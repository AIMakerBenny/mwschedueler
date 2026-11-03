// R5-b143 - actual resource and opponent context at each rapid attack START.
// Read-only. Observations cannot establish that speed, ERS or tyres caused a failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='artifacts/r5-b77-majoku/';
const read=name=>JSON.parse(fs.readFileSync(root+name,'utf8'));
const replay=read('replay.json');
const speed=read('b141-rapid-attack-velocity-evidence.json');
const exact=read('b139-exact-retry-context.json');
for(const r of [replay,speed,exact])assert.equal(r.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const fields=[
 'driverBatteryMJ','targetBatteryMJ','driverEnergyDeployKW',
 'targetEnergyDeployKW','driverErsRequestKW','targetErsRequestKW',
 'driverTyreWearFraction','targetTyreWearFraction',
 'driverTyreCompound','targetTyreCompound',
 'driverStrategyEffort','targetStrategyEffort',
 'driverStrategyName','targetStrategyName',
 'driverPaceRating','targetPaceRating',
 'driverReportedCorridorCandidates','targetReportedCorridorCandidates'
];
const numericFields=new Set(fields.filter(x=>!x.endsWith('Compound')&&!x.endsWith('StrategyName')));
const median=items=>{
 const v=[...items].sort((a,b)=>a-b);
 return v.length?(v.length%2?v[(v.length-1)/2]:
  (v[v.length/2-1]+v[v.length/2])/2):null;
};
const cases=[];
for(const pair of replay.pairs){
 const seed=pair.seed,raw=read('seed'+seed+'-observed10.json');
 const src=raw.real20ms?.attackLedger;
 assert.equal(raw.status,'PASS');
 assert.equal(raw.track,'majoku-ring-v1');
 assert.equal(raw.mode,'NORMAL');assert.equal(raw.laps,10);
 assert.equal(raw.finishedRows.length,12);
 assert.equal(raw.physics.collisionStops,0);
 assert(src&&!src.missingOverlap&&Array.isArray(src.startWitnesses));
 const e=exact.cases.find(c=>c.seed===seed);
 const old=speed.cases.find(c=>c.seed===seed);
 assert(e&&old);
 const starts=new Map(src.events.filter(x=>x.type==='START').map(x=>[x.attemptId,x]));
 const witnessById=new Map(src.startWitnesses.map(x=>[x.attemptId,x]));
 assert.equal(witnessById.size,src.startWitnesses.length);
 assert.equal(starts.size,src.totalStarts);
 const records=[];
 for(const item of e.rapidRetryWitnesses){
  const w=witnessById.get(item.attemptId);
  const start=starts.get(item.attemptId);
  assert(w&&start,'No genuine exact-time observation for a rapid retry');
  assert.equal(start.ms,w.ms);
  assert.equal(w.ms,item.startMs);
  assert.equal(w.driver,item.driver);
  assert.equal(w.target,item.target);
  assert.equal(w.driverAiState,'PLAN_ATTACK');
  assert.equal(w.physicalOvertakingClearanceProven,false);
  assert.equal(w.retry,true);
  assert(Math.abs(w.closingSpeedMps-item.relativeClosingSpeedMps)<1e-8);
  const resources={};
  for(const field of fields){
   assert(Object.hasOwn(w,field),'R5-b142 exact-time resource field missing: '+field);
   const value=w[field];
   assert(value===null||(numericFields.has(field)?
    typeof value==='number'&&Number.isFinite(value):
    typeof value==='string'), 'Invalid recorded field '+field);
   resources[field]=value;
  }
  records.push({attemptId:item.attemptId,driver:w.driver,target:w.target,
   startMs:w.ms,priorResult:item.previousTerminalEvent,
   elapsedSincePriorAttemptEndMs:item.fromPriorFinalEventMs,
   startClosingSpeedMps:w.closingSpeedMps,
   startTargetAheadTrackMeters:w.targetAheadLongitudinalMeters,
   currentAttackResult:item.resultOfCurrentAttack,
   physicalOvertakingClearanceProven:false,
   ...resources});
 }
 assert.equal(records.length,e.rapidSameTargetRetries);
 assert.equal(records.length,old.rapidRetryStarts);
 assert.equal(new Set(records.map(x=>x.attemptId)).size,records.length);
 const groups={positiveClosing:[],nonPositiveClosing:[]};
 for(const row of records){
  (row.startClosingSpeedMps>0?groups.positiveClosing:groups.nonPositiveClosing).push(row);
 }
 const reportGroups={};
 for(const [group,rows] of Object.entries(groups)){
  const sources=group==='positiveClosing'?old.closingSpeedAtStart.positiveClosing:
   old.closingSpeedAtStart.nonPositiveClosing;
  assert.equal(rows.length,sources.count);
  assert.equal(rows.filter(x=>x.currentAttackResult==='SUCCESS').length,sources.physicalSuccesses);
  const stats={count:rows.length,exactTargetPhysicalSuccesses:rows.filter(x=>
   x.currentAttackResult==='SUCCESS').length,
   candidateAiActionsNotPhysicalClearance:true,
   metrics:{}};
  for(const field of numericFields){
   const values=rows.map(r=>r[field]).filter(Number.isFinite);
   stats.metrics[field]={observed:values.length,unavailable:rows.length-values.length,
    median:median(values),minimum:values.length?Math.min(...values):null,
    maximum:values.length?Math.max(...values):null};
  }
  for(const field of fields.filter(x=>!numericFields.has(x))){
   const counts={};
   for(const row of rows){
    const key=row[field]===null?'NOT_AVAILABLE':row[field];
    counts[key]=(counts[key]||0)+1;
   }
   stats.metrics[field]={counts};
  }
  const knownSpeedAndEnergy=rows.filter(x=>x.driverEnergyDeployKW!==null&&
   x.targetEnergyDeployKW!==null);
  const knownTyre=rows.filter(x=>x.driverTyreWearFraction!==null&&
   x.targetTyreWearFraction!==null);
  stats.comparableCurrentEnergyOutput=knownSpeedAndEnergy.length;
  stats.driverEnergyOutputLowerThanTarget=knownSpeedAndEnergy.filter(x=>
   x.driverEnergyDeployKW<x.targetEnergyDeployKW).length;
  stats.comparableTyreWear=knownTyre.length;
  stats.driverTyreWearHigherThanTarget=knownTyre.filter(x=>
   x.driverTyreWearFraction>x.targetTyreWearFraction).length;
  reportGroups[group]=stats;
 }
 const c={seed,quickRetryStarts:records.length,
  exactTimeContextSamples:records.length,missingQuickRetryContext:0,
  otherUnobservedStarts:src.missingStartWitnesses.length,
  resourceGroups:reportGroups,rows:records,
  genuinePhysicsPasses:raw.physics.passes,collisionStops:0,
  noCausalInferences:true,aiChangeApproved:false};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b143',status:'CASE_PASS',seed,
  rapid:records.length,nonPositive:groups.nonPositiveClosing.length,
  observedDriverBattery:reportGroups.nonPositiveClosing.metrics.driverBatteryMJ.observed,
  observedDriverTyre:reportGroups.nonPositiveClosing.metrics.driverTyreWearFraction.observed}));
}
const output={phase:'R5-b143',status:'PASS',track:'majoku-ring-v1',
 actualSourceRun:41561198639,sourceRealRaces:2,
 readOnly:true,physicsModified:false,
 allMeasurementsTakenAtSameAccepted20msStart:true,
 safePassingLaneProven:false,causalEnergyOrTyreDeficitProven:false,
 proposedAiPatchesAuthorized:false,cases,limitations:[
  'Battery, ERS and tyre values describe simultaneous states, not causality',
  'A higher energy deployment is not necessarily a higher instantaneous speed',
  'Any genuinely unavailable numeric input remains null and is counted separately',
  'The stored track-progress gap is not a swept collision distance',
  'The comparison is limited to two fixed original Majoku races'
 ]};
fs.writeFileSync(root+'b143-rapid-attack-resource-context.json',JSON.stringify(output,null,2));
