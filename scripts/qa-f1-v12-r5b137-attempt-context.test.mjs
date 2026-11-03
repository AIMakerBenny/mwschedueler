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
