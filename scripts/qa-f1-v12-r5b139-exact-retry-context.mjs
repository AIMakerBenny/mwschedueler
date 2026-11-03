// R5-b139: exact accepted 20ms event-time relative speed and signed
// track progress for real 10-lap repeated attacks. NO safe lane inference.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const replay=read('replay.json');
const attempts=read('b122-attack-attribution.json');
const gap=read('b134-repeat-gap-sequences.json');
const outcomes=read('b135-retry-transition-matrix.json');
assert.equal(replay.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(attempts.status,'PASS');
assert.equal(gap.status,'PASS');assert.equal(outcomes.status,'PASS');
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const cases=[];
for(const pair of replay.pairs){
 const seed=pair.seed,race=read('seed'+seed+'-observed10.json');
 const ledger=race.real20ms?.attackLedger;
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');assert.equal(race.mode,'NORMAL');
 assert.equal(race.laps,10);assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 assert(ledger&&ledger.exactWitnessSource===
  'genuine accepted 20ms simulation frame at engine START ms');
 assert.equal(ledger.missingOverlap,false);
 assert.equal(ledger.safeLaneClaim,false);
 assert(Array.isArray(ledger.missingStartWitnesses));
 assert(Array.isArray(ledger.startWitnesses));
 const starts=ledger.events.filter(x=>x.type==='START');
 const witnesses=ledger.startWitnesses,unavailable=ledger.missingStartWitnesses;
 assert.equal(starts.length,ledger.totalStarts);
 assert.equal(witnesses.length+unavailable.length,starts.length,
  'Every START must have either a real exact frame or explicit unavailable status');
 const missingById=new Map(unavailable.map(x=>[x.attemptId,x]));
 assert.equal(missingById.size,unavailable.length,'Duplicate unavailable identity');
 const byWitness=new Map();
 for(const w of witnesses){
  assert(Number.isInteger(w.attemptId)&&Number.isSafeInteger(w.ms));
  assert(!byWitness.has(w.attemptId),'Duplicate START-frame witness');
  assert.equal(w.driverAiState,'PLAN_ATTACK');
  assert.equal(w.driverAiTarget,w.target);
  assert.equal(w.onTrackPair,true);
  assert.equal(w.physicalOvertakingClearanceProven,false);
  assert.equal(w.metricType,
   'longitudinal circuit progress, not Euclidean or swept-body clearance');
  for(const k of ['targetAheadLongitudinalMeters','closingSpeedMps',
   'driverSpeedKph','targetSpeedKph','driverProgressLaps','targetProgressLaps'])
   assert(Number.isFinite(w[k]),'Missing or guessed START physical witness: '+k);
  assert(Math.abs(w.closingSpeedMps-(w.driverSpeedKph-w.targetSpeedKph)/3.6)<1e-9);
  assert(Array.isArray(w.reportedMergeBlockers));
  byWitness.set(w.attemptId,w);
 }
 const eventById=new Map(),pairAttempts=new Map();
 for(const event of ledger.events){
  if(!Number.isInteger(event.attemptId))continue;
  if(!eventById.has(event.attemptId))eventById.set(event.attemptId,[]);
  eventById.get(event.attemptId).push(event);
 }
 for(const start of starts){
  const w=byWitness.get(start.attemptId);
  if(w){
   assert(!missingById.has(start.attemptId),'START cannot be both observed and missing');
   assert.equal(start.ms,w.ms);
   assert.equal(start.driver,w.driver);
   assert.equal(start.target,w.target);
   assert.equal(Boolean(start.retry),w.retry);
   assert.equal(start.attemptNumber,w.attemptNumber);
  }else{
   const missing=missingById.get(start.attemptId);
   assert(missing,'Unaccounted START lacks same-step data and explicit unavailable status');
   assert.equal(missing.ms,start.ms);
   assert.equal(missing.reason,'EXACT_ACCEPTED_20MS_FRAME_NOT_FOUND');
  }
  const key=start.driver+'|'+start.target;
  if(!pairAttempts.has(key))pairAttempts.set(key,[]);
  const sequence=eventById.get(start.attemptId);
  assert(sequence?.length&&sequence[0].type==='START');
  const present=new Set(sequence.map(e=>e.type));
  const ending=present.has('SUCCESS')?'SUCCESS':
   ['DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED']
    .find(x=>present.has(x))||'ACTIVE_AT_RACE_FINISH';
  pairAttempts.get(key).push({start,w,endMs:sequence.at(-1).ms,outcome:ending});
 }
 const rapid=[];
 for(const [pairId,sequence] of pairAttempts){
  for(let i=0;i<sequence.length;i++){
   const current=sequence[i];
   assert.equal(current.start.retry,i>0);
   if(i===0)continue;
   const previous=sequence[i-1],gapMs=current.start.ms-previous.endMs;
   assert(gapMs>=0,'Cannot overlap exact same-target attempt lifecycles');
   if(gapMs<=1000){
    assert(current.w,'An under-1s retry requires genuine same-step speed and gap; cannot impute');
    rapid.push({
    attemptId:current.start.attemptId,driver:current.w.driver,
    target:current.w.target,startMs:current.w.ms,
    previousAttemptId:previous.start.attemptId,
    previousTerminalEvent:previous.outcome,
    fromPriorFinalEventMs:gapMs,
    signedTargetAheadTrackMeters:current.w.targetAheadLongitudinalMeters,
    relativeClosingSpeedMps:current.w.closingSpeedMps,
    driverSpeedKph:current.w.driverSpeedKph,
    targetSpeedKph:current.w.targetSpeedKph,
    driverAiState:current.w.driverAiState,
    targetAiState:current.w.targetAiState,
    driverReportedMergeBlockers:current.w.reportedMergeBlockers,
    resultOfCurrentAttack:current.outcome,
    safeLateralMergeProven:false
   });
   }
  }
 }
 const prior=gap.cases.find(x=>x.seed===seed);
 const trans=outcomes.cases.find(x=>x.seed===seed);
 const ai=attempts.cases.find(x=>x.seed===seed);
 assert(prior&&trans&&ai);
 assert.equal(starts.length,ai.engineAttemptStarts);
 assert.equal(rapid.length,prior.shortGapCounts.within1s);
 assert.equal(rapid.length,trans.gapBasedNextAttemptGroups.atMost1s.attempts);
 assert.equal(rapid.filter(x=>x.resultOfCurrentAttack==='SUCCESS').length,
  trans.nextSuccessesAfterAtMost1Second);
 assert.equal(rapid.filter(x=>x.previousTerminalEvent==='DISENGAGED_UNCONFIRMED').length,
  prior.shortGapCounts.within1sAfterDisengagement);
 const result={seed,starts:starts.length,verifiedStartWitnessFrames:witnesses.length,
  unmatchedStartWitnesses:unavailable.length,missingRapidRetryWitnesses:0,
  rapidSameTargetRetries:rapid.length,
  rapidRetriesWithPositiveClosingSpeed:rapid.filter(x=>x.relativeClosingSpeedMps>0).length,
  rapidRetriesWithNonpositiveClosingSpeed:rapid.filter(x=>x.relativeClosingSpeedMps<=0).length,
  rapidRetriesWithPositiveSignedTrackGap:rapid.filter(x=>x.signedTargetAheadTrackMeters>0).length,
  rapidRetriesWithReportedMergeBlockerAtStart:rapid.filter(x=>x.driverReportedMergeBlockers.length>0).length,
  rapidlyRetriedConfirmedPasses:rapid.filter(x=>x.resultOfCurrentAttack==='SUCCESS').length,
  rapidRetryWitnesses:rapid,physicalPasses:race.physics.passes,
  collisionStops:race.physics.collisionStops};
 assert.equal(result.collisionStops,0);
 cases.push(result);
 console.log(JSON.stringify({phase:'R5-b139',status:'CASE_PASS',seed,
  exactWitnessFrames:result.verifiedStartWitnessFrames,quick:rapid.length,
  closingPositive:result.rapidRetriesWithPositiveClosingSpeed,
  exactSuccessful:result.rapidlyRetriedConfirmedPasses}));
}
const output={phase:'R5-b139',status:'PASS',track:'majoku-ring-v1',
 exactSource:'genuine 20ms accepted physical steps from two natural 12-car ten-lap Chromium races',
 physicsChanged:false,newGameRulesAdded:false,
 safeLateralMergeProven:false,unnecessaryBrakingProven:false,
 aiTuningApproved:false,cases,
 limitations:[
 'Signed longitudinal track-progress separation is not Euclidean distance between vehicle bodies',
 'A closing-speed snapshot cannot prove the target remained reachable or an adjacent corridor was safe',
 'Only sampled 20ms START frames are used. Unsampled STARTs are declared unavailable and never imputed',
 'All under-one-second retry STARTs must have exact sampled frames, otherwise this gate fails',
 'The START witness is exact-time, unlike 5-second strategy snapshots',
 'These two fixed-seed observations cannot establish causal AI balance improvements'
 ]};
fs.writeFileSync(dir+'b139-exact-retry-context.json',JSON.stringify(output,null,2));
