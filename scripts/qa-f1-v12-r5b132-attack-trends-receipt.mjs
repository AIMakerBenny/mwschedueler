// R5-b132 - fail-closed provenance receipt for archived real 10-lap trends.
// The original completed browser run is validated separately from this job.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=x=>JSON.parse(fs.readFileSync(dir+x,'utf8'));
const pinned=read('b104-full-physical-outcome-gate.json');
const base=read('b123-attempt-lifecycle.json');
const groups=read('b129-attack-pair-retries.json');
const timeline=read('b130-temporal-cohorts.json');
const context=read('b131-disengagement-context.json');
for(const x of [pinned,base,groups,timeline,context])assert.equal(x.status,'PASS');
assert.equal(pinned.completeFullJsonOutcomeIdentical,true);
assert.equal(pinned.permissionToReduceSafetyBraking,false);
assert.equal(pinned.permissionToBoostTrailingCars,false);
assert.equal(groups.liveGameChanged,false);
assert.equal(timeline.physicsChanged,false);
assert.equal(context.engineChanged,false);
assert.equal(context.liveAiPatchApproved,false);
const expected=new Map([[1,{starts:219,retries:163,disengaged:142}],[2,{starts:178,retries:120,disengaged:131}]]);
const cases=[];
for(const seed of [1,2]){
 const x=groups.cases.find(c=>c.seed===seed),
  t=timeline.cases.find(c=>c.seed===seed),
  c=context.cases.find(c=>c.seed===seed),
  b=base.cases.find(c=>c.seed===seed),
  p=pinned.cases.find(c=>c.seed===seed),
  old=expected.get(seed);
 assert(x&&t&&c&&b&&p&&old);
 assert.equal(x.attemptStarts,old.starts);
 assert.equal(x.repeatAttempts,old.retries);
 assert.equal(x.attemptStarts,t.allAttemptStarts);
 assert.equal(x.attemptStarts,c.attemptStarts);
 assert.equal(x.attemptStarts,b.attemptStarts);
 assert.equal(x.physicalPasses,p.confirmedPhysicalPasses);
 assert.equal(x.collisionStops,0);
 assert.equal(c.observedFinalStateCounts.DISENGAGED_UNCONFIRMED.count,old.disengaged);
 assert.equal(c.observedFinalStateCounts.SUCCESS.count,b.outcomes.SUCCESS);
 assert.equal(c.observedFinalStateCounts.TARGET_CHANGED.count,b.outcomes.TARGET_CHANGED);
 assert.equal(c.observedFinalStateCounts.PIT_INTERRUPTED.count,b.outcomes.PIT_INTERRUPTED);
 assert.equal(c.disengagementWithoutPriorReportedBlocker+
  c.disengagementWithPriorReportedBlocker,old.disengaged);
 assert.equal(t.cohorts.reduce((n,a)=>n+a.startCount,0),old.starts);
 assert.equal(t.cohorts.reduce((n,a)=>n+a.exactTargetSuccesses,0),b.outcomes.SUCCESS);
 assert(x.mostRepeatedPairs.every((p,i,arr)=>!i||p.attempts<=arr[i-1].attempts));
 cases.push({seed,attemptStarts:x.attemptStarts,repeatAttempts:x.repeatAttempts,
  confirmedAttackSuccesses:b.outcomes.SUCCESS,
  stoppedWithoutConfirmedPass:old.disengaged,
  physicalPasses:x.physicalPasses,collisionStops:0,
  priorBlockerAndDisengagement:c.disengagementWithPriorReportedBlocker,
  timeCohorts:t.cohorts.map(r=>({name:r.id,starts:r.startCount,success:r.exactTargetSuccesses}))});
}
assert.equal(cases.length,2);
const result={phase:'R5-b132',status:'PASS',track:'majoku-ring-v1',
 sourceGithubRunId:41553183438,
 sourceGithubRunConclusion:'SUCCESS',
 sourceRealChromiumRaces:2,newChromiumRacesInThisJob:0,
 gameCodeChanged:false,aiBalanceChangesApproved:false,
 physicallySafeAlternateLaneProven:false,cases,
 limitation:'This is a read-only regression on archived real browser data. Repeated attempts and blockers are descriptive, not evidence of a safe AI intervention.'};
fs.writeFileSync(dir+'b132-trend-evidence-receipt.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b132',status:'PASS',cases:cases.map(x=>({
 seed:x.seed,attempts:x.attemptStarts,retries:x.repeatAttempts,
 disengaged:x.stoppedWithoutConfirmedPass})),newChromiumRacesInThisJob:0}));
