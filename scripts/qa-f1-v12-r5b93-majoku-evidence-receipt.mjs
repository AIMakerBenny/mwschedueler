// R5-b93: a CI-readable provenance receipt for completed real-grid evidence.
// A PASS here only means file-level evidence assertions passed INSIDE a job.
// Overall GitHub Actions success is determined separately after job completion.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const dir='artifacts/r5-b77-majoku/';
const baseline=read(dir+'b92-historical-baseline-provenance.json');
const replay=read(dir+'replay.json');
const b85=read(dir+'b85-episode-evidence.json');
const b87=read(dir+'b87-contiguous-episode-audit.json');
const b88=read(dir+'b88-physical-fingerprints.json');
const b89=read(dir+'b89-live-ai-evidence-gate.json');
for(const r of [baseline,replay,b85,b87,b88,b89])assert.equal(r.status,'PASS');
for(const r of [baseline,replay,b85,b87,b88,b89])assert.equal(r.track,'majoku-ring-v1');
assert.equal(baseline.wholeSourceRunSucceeded,false);
assert.equal(baseline.current20msJobSuccess,null);
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(b88.physicalOutcomesIdentical,true);
assert.equal(b89.classification,'HOLD_UNPROVEN_LANE_CLEARANCE');
assert.equal(b89.liveAiBrakingReductionApproved,false);
assert.equal(b89.rearCarBoostApproved,false);
assert.equal(b89.collisionOverrideApproved,false);
assert.equal(b89.sweptCollisionClearanceProven,false);
assert.equal(b89.mergeReservationSafetyProven,false);
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const cases=[];
for(const p of replay.pairs){
 const seed=p.seed;
 const historic=baseline.cases.find(x=>x.seed===seed);
 const w=b85.cases.find(x=>x.seed===seed);
 const frames=b87.cases.find(x=>x.seed===seed);
 const immutable=b88.cases.find(x=>x.seed===seed);
 const guard=b89.cases.find(x=>x.seed===seed);
 assert(historic&&w&&frames&&immutable&&guard,'Incomplete seed evidence');
 assert.equal(immutable.identicalOutcomes,true);
 assert.equal(immutable.finishers,12);
 assert.equal(immutable.collisionStops,0);
 assert.equal(immutable.passes,historic.confirmedPasses);
 assert.equal(immutable.stops,historic.pitStops);
 assert.equal(guard.physicsPasses,immutable.passes);
 assert.equal(guard.genuinePitStops,immutable.stops);
 assert.equal(guard.collisionStops,0);
 assert.equal(guard.physicsFingerprint,immutable.sha256);
 assert.equal(guard.candidateUnblocked400msEpisodes,
  frames.continuous400msEpisodes);
 assert.equal(frames.continuous400msEpisodes,w.continuous400msEpisodes);
 assert(frames.accepted20msFrames>=4400&&frames.accepted20msFrames<=4500);
 assert.equal(guard.safetyClassification,
  'ADVISORY_ONLY_NO_SWEPT_OR_RESERVATION_PROOF');
 assert.deepEqual(guard.permittedGameLogicChanges,[]);
 cases.push({
  seed,realCars:12,realLaps:10,first90Seconds20msFrames:frames.accepted20msFrames,
  verifiedFinishers:immutable.finishers,physicalPasses:immutable.passes,
  actualPitStops:immutable.stops,collisionStops:immutable.collisionStops,
  candidateUnblocked400msEpisodes:frames.continuous400msEpisodes
 });
 console.log(JSON.stringify({phase:'R5-b93',status:'EVIDENCE_VERIFIED',seed,
  passes:immutable.passes,pits:immutable.stops,
  collisionStops:immutable.collisionStops,
  advisoryFollowEpisodes:frames.continuous400msEpisodes}));
}
const receipt={
 phase:'R5-b93',status:'EVIDENCE_VERIFIED_WITHIN_JOB',
 track:'majoku-ring-v1',runId:process.env.GITHUB_RUN_ID||null,
 verifiedCommit:process.env.GITHUB_SHA||null,
 sourceRun:41460159785,sourceRunOverallConclusion:'CANCELLED',
 realGridSeedCount:2,readOnly:true,physicsOutcomeIdentical:true,
 safeLaneClearanceProven:false,aiTuningApproved:false,cases,
 githubWorkflowOverallConclusion:'NOT_AVAILABLE_UNTIL_RUN_COMPLETES'
};
fs.writeFileSync(dir+'b93-ci-evidence-receipt.json',JSON.stringify(receipt,null,2));
console.log(JSON.stringify({phase:'R5-b93',status:receipt.status,
 artifact:dir+'b93-ci-evidence-receipt.json',
 workflowConclusion:receipt.githubWorkflowOverallConclusion}));
