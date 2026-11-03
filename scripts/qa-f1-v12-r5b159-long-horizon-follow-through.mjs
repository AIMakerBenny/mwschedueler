// R5-b159. Verify exact long-horizon driver-target progress for real repeated
// attacks. Gap reduction is not a successful pass or a safe lane.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=name=>JSON.parse(fs.readFileSync(dir+name,'utf8'));
const replay=read('replay.json');
const fast=read('b139-exact-retry-context.json');
const physical=read('b155-early-speed-vs-eventual-pass.json');
for(const r of [replay,fast,physical])assert.equal(r.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const offsets=[0,1000,5000,10000,20000,40000,70000];
const outcome=['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED','ACTIVE_AT_RACE_FINISH'];
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');
 assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const led=race.real20ms?.attackLedger;
 assert(led&&!led.missingOverlap);
 assert.deepEqual(led.longHorizonOffsetsMs,offsets);
 assert.equal(led.longHorizonSweptClearanceProven,false);
 assert.equal(led.longHorizonSource,
  'genuine accepted 20ms source frame or declared unavailable');
 assert(Array.isArray(led.longHorizonRetryAttempts));
 const starts=led.events.filter(x=>x.type==='START');
 const retries=starts.filter(x=>x.retry===true);
 assert.equal(led.longHorizonRetryAttempts.length,retries.length);
 const byAttempt=new Map(led.longHorizonRetryAttempts.map(x=>[x.attemptId,x]));
 assert.equal(byAttempt.size,retries.length,'Duplicate full-retry trajectory');
 for(const attempt of retries){
  const record=byAttempt.get(attempt.attemptId);
  assert(record&&record.startMs===attempt.ms);
  assert.equal(record.driver,attempt.driver);
  assert.equal(record.target,attempt.target);
  for(const offset of offsets){
   const sample=record.samples[String(offset)];
   assert(sample,'Every long-horizon timestamp must be observed or unavailable');
   assert.equal(sample.offsetMs,offset);
   assert.equal(sample.ms,attempt.ms+offset);
   assert.equal(typeof sample.available,'boolean');
   if(sample.available){
    assert.equal(sample.driver,attempt.driver);
    assert.equal(sample.target,attempt.target);
    assert.equal(sample.sweptBodyClearanceProven,false);
    assert.equal(sample.causalEffectProven,false);
    for(const key of ['signedTrackProgressGapMeters','relativeClosingSpeedMps',
     'driverBatteryMJ','driverEnergyDeployKW','driverTyreWearFraction'])
     assert(sample[key]===null||Number.isFinite(sample[key]),'Unverified source '+key);
   }else{
    assert(['AFTER_RACE_END','EXACT_ACCEPTED_FRAME_UNAVAILABLE']
     .includes(sample.reason));
   }
  }
 }
 const actual=fast.cases.find(x=>x.seed===seed);
 const delayed=physical.cases.find(x=>x.seed===seed);
 assert(actual&&delayed);
 const passById=new Map(delayed.rows.map(x=>[x.attemptId,x]));
 const stats=Object.fromEntries(offsets.slice(1).map(x=>[String(x),{
  offsetMs:x,rapidAttempts:0,available:0,unavailable:0,
  sameTargetStillAttacked:0,opponentStillAttacking:0,
  longitudinalGapShrank:0,longitudinalGapExpanded:0,
  gapUnchanged:0,knownGapComparisons:0,
  closingSpeedPositive:0,closingSpeedNonpositive:0,
  actualCrossingAlreadyOccurred:0
 }]));
 const rows=[];
 for(const candidate of actual.rapidRetryWitnesses){
  const record=byAttempt.get(candidate.attemptId);
  assert(record);
  const start=record.samples['0'];
  assert(start.available===true,'Rapid retry requires genuine exact source at START');
  assert(Math.abs(start.relativeClosingSpeedMps-candidate.relativeClosingSpeedMps)<1e-8);
  const confirmed=passById.get(candidate.attemptId);
  assert(confirmed);
  assert.equal(confirmed.eventualOutcome,candidate.resultOfCurrentAttack);
  const successDelay=confirmed.startToPhysicalCrossingSeconds;
  if(successDelay!==null)assert(successDelay>0);
  const sampleSummary=[];
  for(const offset of offsets.slice(1)){
   const current=record.samples[String(offset)],group=stats[String(offset)];
   group.rapidAttempts++;
   if(!current.available){
    group.unavailable++;
    sampleSummary.push({offsetMs:offset,available:false,reason:current.reason});
    continue;
   }
   group.available++;
   group.sameTargetStillAttacked+=Number(current.driverStillAttackingOriginalTarget);
   group.opponentStillAttacking+=Number(current.targetAiState==='PLAN_ATTACK');
   if(Number.isFinite(current.relativeClosingSpeedMps)){
    group.closingSpeedPositive+=Number(current.relativeClosingSpeedMps>0);
    group.closingSpeedNonpositive+=Number(current.relativeClosingSpeedMps<=0);
   }
   let gapChange=null;
   if(Number.isFinite(start.signedTrackProgressGapMeters)&&
    Number.isFinite(current.signedTrackProgressGapMeters)){
    gapChange=current.signedTrackProgressGapMeters-start.signedTrackProgressGapMeters;
    group.knownGapComparisons++;
    group.longitudinalGapShrank+=Number(gapChange< -1e-7);
    group.longitudinalGapExpanded+=Number(gapChange>1e-7);
    group.gapUnchanged+=Number(Math.abs(gapChange)<=1e-7);
   }
   sampleSummary.push({offsetMs:offset,available:true,
    signedGapChangeSinceStartMeters:gapChange,
    driverStillAttackingOriginalTarget:current.driverStillAttackingOriginalTarget,
    opponentAiState:current.targetAiState,
    closingSpeedMps:current.relativeClosingSpeedMps,
    overtakeAlreadyPhysicallyCrossed:successDelay!==null&&
     successDelay<=offset/1000,
    safeLateralClearanceProven:false});
  }
  for(const item of sampleSummary){
   if(item.available&&item.overtakeAlreadyPhysicallyCrossed)
    stats[String(item.offsetMs)].actualCrossingAlreadyOccurred++;
  }
  rows.push({attemptId:candidate.attemptId,seed,
   driver:candidate.driver,target:candidate.target,
   startMs:candidate.startMs,successDelaySeconds:successDelay,
   eventualOutcome:confirmed.eventualOutcome,
   observations:sampleSummary});
 }
 assert.equal(rows.length,actual.rapidSameTargetRetries);
 assert.equal(rows.length,seed===1?22:18);
 for(const s of Object.values(stats)){
  assert.equal(s.rapidAttempts,rows.length);
  assert.equal(s.available+s.unavailable,rows.length);
  assert.equal(s.longitudinalGapShrank+s.longitudinalGapExpanded+
   s.gapUnchanged,s.knownGapComparisons);
  assert(s.sameTargetStillAttacked<=s.available);
  assert(s.opponentStillAttacking<=s.available);
  assert(s.actualCrossingAlreadyOccurred<=s.available);
 }
 cases.push({seed,recordedStartAttempts:starts.length,
  engineConfirmedRepeatedStarts:retries.length,rapidRetries:rows.length,
  timeline:stats,rows,actualPhysicalPasses:race.physics.passes,
  collisionStops:0,changedGameCode:false,
  safeAlternativeLateralLaneEstablished:false});
 console.log(JSON.stringify({phase:'R5-b159',status:'CASE_PASS',seed,
  quick:rows.length,
  knownAfter5s:stats['5000'].available,
  knownAfter20s:stats['20000'].available,
  stillTargetAfter10s:stats['10000'].sameTargetStillAttacked,
  alreadyCrossedBy40s:stats['40000'].actualCrossingAlreadyOccurred}));
}
const output={phase:'R5-b159',status:'PASS',track:'majoku-ring-v1',
 sourceRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 browserRaceExecutedByThisScript:false,readOnly:true,
 physicsModified:false,aiBalancePatchAuthorized:false,
 safeSweptCorridorProven:false,cases,
 interpretation:'Progress, AI intent and physical pass are separate evidence; events after an exact START may belong to a new strategy or target.'};
fs.writeFileSync(dir+'b159-long-horizon-follow-through.json',JSON.stringify(output,null,2));
