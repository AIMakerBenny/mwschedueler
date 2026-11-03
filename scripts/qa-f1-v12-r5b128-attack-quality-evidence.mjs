// R5-b128: actionable, truthful read-only summary of two real Majoku
// 10-lap seeded races. Intent-to-pass conversion and physical overtakes are
// different denominators. No causal AI brake or safe-corridor claim is made.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(root+n,'utf8'));
const attempts=read('b122-attack-attribution.json');
const endings=read('b123-attempt-lifecycle.json');
const replay=read('replay.json');
for(const report of [attempts,endings,replay])assert.equal(report.status,'PASS');
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
assert.equal(attempts.liveAiTuningAuthorized,false);
assert.equal(endings.aiChangesApproved,false);
const cases=[];
for(const seed of [1,2]){
 const a=attempts.cases.find(x=>x.seed===seed);
 const b=endings.cases.find(x=>x.seed===seed);
 const pair=replay.pairs.find(x=>x.seed===seed);
 assert(a&&b&&pair);
 const original=read('seed'+seed+'-observed10.json');
 assert.equal(original.physics.collisionStops,0);
 assert.equal(original.finishedRows.length,12);
 assert.equal(original.physics.passes,a.physicalConfirmedPasses);
 assert.equal(original.physics.passEvents.length,a.physicalConfirmedPasses);
 assert.equal(b.attemptStarts,a.engineAttemptStarts);
 assert.equal(b.outcomes.SUCCESS,a.exactTargetAttemptSuccesses);
 assert.equal(a.physicalConfirmedPasses,a.exactTargetAttemptSuccesses+
  a.physicallyConfirmedPassesWithoutMatchingLiveAttempt);
 assert.equal(b.outcomes.TARGET_CHANGED+b.outcomes.SUCCESS+
  b.outcomes.DISENGAGED_UNCONFIRMED+b.outcomes.PIT_INTERRUPTED+
  b.outcomes.ACTIVE_AT_RACE_FINISH,b.attemptStarts);
 assert.equal(b.drivers.length,12);
 assert.equal(b.drivers.reduce((n,x)=>n+x.starts,0),b.attemptStarts);
 assert.equal(b.drivers.reduce((n,x)=>n+x.successes,0),b.outcomes.SUCCESS);
 assert(b.targetChangedAfterCrossingBeforeConfirmation<=b.outcomes.SUCCESS);
 const drivers=b.drivers.map(d=>({
  id:d.driver,attempts:d.starts,physicallyConfirmedExactTargetSuccesses:d.successes,
  completionRatioPercent:d.starts?100*d.successes/d.starts:null,
  attemptWithReportedBlocker:d.blockedAttempts,
  targetChangedWithoutPass:d.targetChanges,
  disengagedWithoutPass:d.disengagedUnconfirmed,
  pitInterruptions:d.pitInterrupted,
  stillOpenAtFinish:d.unresolvedAtFinish
 })).sort((a,b)=>b.attempts-a.attempts||a.id.localeCompare(b.id));
 const physicalUnattributedRate=100*
  a.physicallyConfirmedPassesWithoutMatchingLiveAttempt/a.physicalConfirmedPasses;
 const outcome={seed,realDrivers:12,normalLaps:10,finishers:12,
  physicalPasses:a.physicalConfirmedPasses,
  exactTargetAttackStarts:a.engineAttemptStarts,
  exactTargetAttackSuccesses:a.exactTargetAttemptSuccesses,
  exactTargetAttemptConversionPercent:a.startToPhysicalSuccessPercent,
  physicalPassesNotLinkedToAnActiveExactTargetAttack:
   a.physicallyConfirmedPassesWithoutMatchingLiveAttempt,
  shareOfPhysicalPassesNotLinkedToAttackPercent:physicalUnattributedRate,
  targetChangesAfterCrossingBeforeConfirmation:
   b.targetChangedAfterCrossingBeforeConfirmation,
  targetChangedWithoutSuccess:b.outcomes.TARGET_CHANGED,
  disengagedWithoutSuccess:b.outcomes.DISENGAGED_UNCONFIRMED,
  pitInterruption:b.outcomes.PIT_INTERRUPTED,
  unresolvedAtFinish:b.outcomes.ACTIVE_AT_RACE_FINISH,
  attemptsThatEverReportedMergeBlockers:b.attemptsWithBlockedObservation,
  attemptsThatEverObservedSideBySide:b.attemptsWithSideBySideObservation,
  collisionStops:0,genuinePitStops:original.finishedRows.reduce((n,r)=>n+r.pits,0),
  drivers};
 assert(outcome.genuinePitStops===7);
 cases.push(outcome);
 console.log(JSON.stringify({phase:'R5-b128',status:'CASE_PASS',seed,
  physicalPasses:outcome.physicalPasses,
  attackStarts:outcome.exactTargetAttackStarts,
  attackSuccesses:outcome.exactTargetAttackSuccesses,
  lastTargetChangesDuringConfirmation:
   outcome.targetChangesAfterCrossingBeforeConfirmation}));
}
const result={phase:'R5-b128',status:'PASS',track:'majoku-ring-v1',
 input:'GitHub real-browser ten-lap race artifact from run 41550310758',
 newChromiumRaceExecuted:false,realEnginePhysicsChanged:false,
 sourceRunOverallStatus:'FAILURE_IN_OLD_UNCORRECTED_LIFECYCLE_GATE',
 currentReportIsAnIndependentArchivedRegression:true,
 liveAiPatchAuthorized:false,forceOvertakeAuthorized:false,
 causalAttributionToExcessiveBrakingProven:false,
 sweptBodyAndMergeReservationSafetyProven:false,cases,
 interpretation:[
  'Success rates divide successes linked to an exact-target AI START by all recorded START events',
  'A physical pass without a matching active exact-target attack is counted, not assigned to a guessed attempt',
  'AI target changes after a captured crossing but before the 500ms confirmation are successful physically when proven',
  'DISENGAGED_UNCONFIRMED is a classification, not proof of poor AI balance',
  'A reported merge blocker is not proof that a different lane was safely usable',
  'Two fixed genuine ten-lap seeds do not certify global balance'
 ]};
fs.writeFileSync(root+'b128-attack-quality-evidence.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:result.phase,status:result.status,
 seeds:cases.map(x=>x.seed),authorized:false}));
