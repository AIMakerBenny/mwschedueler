import assert from 'node:assert/strict';
import test from 'node:test';
import {snapshotAttemptContextFrame,deriveExactAttackStartWitness} from './lib/f1-r5b137-attempt-context.mjs';
const cars=()=>Array.from({length:12},(_,i)=>({
 id:'d'+i,raceProgress:i===0?1.5:i===1?1.51:2+i*.01,
 speedKph:i===0?140:i===1?132:120,
 unifiedYV11:i%4,unifiedAiStateV11:i===0?'PLAN_ATTACK':'CRUISE',
 unifiedAiTargetV11:i===0?'d1':'',
 pitState:'TRACK',finished:false,unifiedMergeBlockedV11:[]
}));
const event={type:'START',attemptId:8,ms:2000,driver:'d0',target:'d1',retry:true,attemptNumber:2};
test('R5-b137 derives only physical longitudinal progress and speed at the exact START time',()=>{
 const frame=snapshotAttemptContextFrame(2000,2000,cars());
 const w=deriveExactAttackStartWitness(event,frame);
 assert.equal(w.attemptId,8);assert.equal(w.retry,true);
 assert(Math.abs(w.targetAheadLongitudinalMeters-20)<1e-6);
 assert(Math.abs(w.closingSpeedMps-8/3.6)<1e-6);
 assert.equal(w.driverAiState,'PLAN_ATTACK');
 assert.equal(w.physicalOvertakingClearanceProven,false);
 assert.equal(w.metricType,'longitudinal circuit progress, not Euclidean or swept-body clearance');
});
test('R5-b137 refuses delayed 5-second sample substituted for exact event',()=>{
 const frame=snapshotAttemptContextFrame(5000,2000,cars());
 assert.throws(()=>deriveExactAttackStartWitness(event,frame),/START_CLOCK_MISMATCH/);
});
test('R5-b137 requires real, ongoing exact-target attack state at event time',()=>{
 const vehicles=cars();vehicles[0].unifiedAiTargetV11='d2';
 assert.throws(()=>deriveExactAttackStartWitness(event,snapshotAttemptContextFrame(2000,2000,vehicles)),/START_AI_STATE_TARGET_MISMATCH/);
});
test('R5-b137 never asserts pass evidence when target is in pit or finished',()=>{
 const vehicles=cars();vehicles[1].pitState='PIT';
 assert.throws(()=>deriveExactAttackStartWitness(event,snapshotAttemptContextFrame(2000,2000,vehicles)),/START_AI_STATE_TARGET_MISMATCH/);
});
test('R5-b137 does not fill unknown speed with zero',()=>{
 const vehicles=cars();vehicles[0].speedKph=undefined;
 assert.throws(()=>deriveExactAttackStartWitness(event,snapshotAttemptContextFrame(2000,2000,vehicles)),/START_PHYSICAL_CONTEXT_UNAVAILABLE/);
});
test('R5-b137 rejects malformed field and duplicate driver IDs',()=>{
 assert.throws(()=>snapshotAttemptContextFrame(2000,2000,cars().slice(1)),/INVALID_FIELD_SIZE/);
 const vehicles=cars();vehicles[1].id='d0';
 assert.throws(()=>snapshotAttemptContextFrame(2000,2000,vehicles),/INVALID_DRIVER_ID/);
});

test('R5-b142 records real same-step strategy, tyre, pace and ERS without zero imputation',()=>{
 const v=cars();
 v[0].tyreWear=.32;v[1].tyreWear=.67;
 v[0].tyreCompound='SOFT';v[1].tyreCompound='HARD';
 v[0].batteryMJ=2.5;v[1].batteryMJ=3.4;
 v[0].energyDeployKW=0;v[1].energyDeployKW=120;
 v[0].unifiedStrategyErsKWV12=50;v[1].unifiedStrategyErsKWV12=80;
 v[0].unifiedStrategyEffortV12=.9;v[1].unifiedStrategyEffortV12=1.05;
 v[0].unifiedStrategyV12='CHASER';v[1].unifiedStrategyV12='BALANCED';
 v[0].driverProfile={pace:82};v[1].driverProfile={pace:67};
 v[0].unifiedCorridorCountV12=0;v[1].unifiedCorridorCountV12=2;
 const w=deriveExactAttackStartWitness(event,snapshotAttemptContextFrame(2000,2000,v));
 assert.equal(w.driverTyreWearFraction,.32);
 assert.equal(w.targetTyreWearFraction,.67);
 assert.equal(w.driverTyreCompound,'SOFT');
 assert.equal(w.targetTyreCompound,'HARD');
 assert.equal(w.driverBatteryMJ,2.5);
 assert.equal(w.targetBatteryMJ,3.4);
 assert.equal(w.driverEnergyDeployKW,0);
 assert.equal(w.targetEnergyDeployKW,120);
 assert.equal(w.driverErsRequestKW,50);
 assert.equal(w.driverStrategyEffort,.9);
 assert.equal(w.targetStrategyEffort,1.05);
 assert.equal(w.driverStrategyName,'CHASER');
 assert.equal(w.targetStrategyName,'BALANCED');
 assert.equal(w.driverPaceRating,82);
 assert.equal(w.targetPaceRating,67);
 assert.equal(w.driverReportedCorridorCandidates,0);
 assert.equal(w.physicalOvertakingClearanceProven,false);
});
test('R5-b142 unknown tyre wear, ERS, battery and pace remain null, never estimated from delayed samples',()=>{
 const v=cars();
 v[0].batteryMJ=undefined;v[0].tyreWear=Number.NaN;
 v[0].unifiedStrategyErsKWV12=Infinity;
 v[0].driverProfile={pace:'82'};
 const w=deriveExactAttackStartWitness(event,snapshotAttemptContextFrame(2000,2000,v));
 assert.equal(w.driverBatteryMJ,null);
 assert.equal(w.driverTyreWearFraction,null);
 assert.equal(w.driverErsRequestKW,null);
 assert.equal(w.driverPaceRating,null);
 assert.equal(w.driverStrategyName,null);
 assert.equal(w.driverTyreCompound,null);
});
