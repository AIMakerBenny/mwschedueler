// R5-b136: independently certified genuine two-seed retry intervals.
// All data is from one completed authentic 10-lap Chromium QA artifact.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=p=>JSON.parse(fs.readFileSync(dir+p,'utf8'));
const physical=read('b104-full-physical-outcome-gate.json');
const replay=read('replay.json');
const attribution=read('b122-attack-attribution.json');
const trends=read('b132-trend-evidence-receipt.json');
const first=read('b133-first-repeat-outcomes.json');
const gaps=read('b134-repeat-gap-sequences.json');
const matrix=read('b135-retry-transition-matrix.json');
for(const x of [physical,replay,attribution,trends,first,gaps,matrix])assert.equal(x.status,'PASS');
assert.equal(physical.completeFullJsonOutcomeIdentical,true);
assert.equal(physical.permissionToReduceSafetyBraking,false);
assert.equal(physical.permissionToBoostTrailingCars,false);
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
assert.equal(first.physicsChanged,false);
assert.equal(matrix.physicsModified,false);
assert.equal(matrix.aiTuningApproved,false);
const fixed=[{seed:1,physical:46,starts:219,first:56,firstSuccess:13,
 repeat:163,repeatSuccess:18,short:22,shortSuccess:2},
 {seed:2,physical:32,starts:178,first:58,firstSuccess:18,
 repeat:120,repeatSuccess:12,short:18,shortSuccess:1}];
const cases=[];
for(const d of fixed){
 const a=attribution.cases.find(x=>x.seed===d.seed);
 const t=trends.cases.find(x=>x.seed===d.seed);
 const f=first.cases.find(x=>x.seed===d.seed);
 const g=gaps.cases.find(x=>x.seed===d.seed);
 const m=matrix.cases.find(x=>x.seed===d.seed);
 const p=physical.cases.find(x=>x.seed===d.seed);
 assert(a&&t&&f&&g&&m&&p);
 assert.equal(a.physicalConfirmedPasses,d.physical);
 assert.equal(p.confirmedPhysicalPasses,d.physical);
 assert.equal(a.engineAttemptStarts,d.starts);
 assert.equal(t.attemptStarts,d.starts);
 assert.equal(f.first.starts,d.first);
 assert.equal(f.first.outcomes.SUCCESS,d.firstSuccess);
 assert.equal(f.repeated.starts,d.repeat);
 assert.equal(f.repeated.outcomes.SUCCESS,d.repeatSuccess);
 assert.equal(d.firstSuccess+d.repeatSuccess,a.exactTargetAttemptSuccesses);
 assert.equal(g.repeatAttempts,d.repeat);
 assert.equal(m.repeatAttempts,d.repeat);
 assert.equal(g.shortGapCounts.within1s,d.short);
 assert.equal(m.gapBasedNextAttemptGroups.atMost1s.attempts,d.short);
 assert.equal(m.gapBasedNextAttemptGroups.atMost1s.outcomes.SUCCESS,d.shortSuccess);
 assert.equal(m.nextSuccessesAfterAtMost1Second,d.shortSuccess);
 assert.equal(m.shortRepeatAfterDisengagement,g.shortGapCounts.within1sAfterDisengagement);
 assert.equal(g.collisionStops,0);
 assert.equal(m.collisionStops,0);
 cases.push({seed:d.seed,physicalPasses:d.physical,attackStarts:d.starts,
  firstAttemptStarts:d.first,firstAttemptSuccesses:d.firstSuccess,
  retryStarts:d.repeat,retrySuccesses:d.repeatSuccess,
  sameTargetRetryWithinOneSecond:d.short,
  immediatelyRetriedPhysicalSuccesses:d.shortSuccess,
  firstAttemptSuccessPercent:100*d.firstSuccess/d.first,
  retrySuccessPercent:100*d.repeatSuccess/d.repeat,
  oneSecondRetrySuccessPercent:100*d.shortSuccess/d.short,
  collisionStops:0,physicsInvariant:true});
 console.log(JSON.stringify({phase:'R5-b136',status:'CASE_PASS',seed:d.seed,
  firstStarts:d.first,retryStarts:d.repeat,
  oneSecondRepeats:d.short,oneSecondPasses:d.shortSuccess}));
}
const result={phase:'R5-b136',status:'PASS',track:'majoku-ring-v1',
 sourceActualChromiumRun:41553183438,
 sourceArtifact:'majoku-r5b96-focused-physical-20ms',
 sourceRunVerifiedSuccess:true,actualRacesInSource:2,
 browserRacesExecutedInThisJob:0,readOnly:true,
 gameEngineModified:false,otherSixTracksModified:false,
 safeAlternativeLaneProven:false,causalAiBalanceImprovementProven:false,
 physicsOrAiPatchApproved:false,cases,
 notes:[
  'This QA job re-evaluates prior real browser data; it does not re-simulate browser races',
  'Attempts are exact driver-target STARTs, not chase-state frames',
  'One-second retry means prior last event to next same-target START',
  'Two fixed seeds do not certify braking or safe lane availability'
 ]};
fs.writeFileSync(dir+'b136-retry-provenance.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b136',status:'PASS',
 racesInSource:2,newChromiumRaces:0,gameEngineModified:false}));
