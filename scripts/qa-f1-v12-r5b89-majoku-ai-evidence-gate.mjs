// R5-b89 - make the live AI decision explicit and non-authorizing.
// Never treat a candidate route or a missing merge-blocker flag as a
// physically swept, reservation-safe lane transition.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const baseline=read('artifacts/r5-b49-majoku/summary.json');
const replay=read(dir+'replay.json');
const b85=read(dir+'b85-episode-evidence.json');
const b87=read(dir+'b87-contiguous-episode-audit.json');
const b88=read(dir+'b88-physical-fingerprints.json');
for(const record of [baseline,replay,b85,b87,b88])
 assert.equal(record.status,'PASS');
for(const record of [replay,b85,b87,b88])
 assert.equal(record.track,'majoku-ring-v1');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(b85.physicalOutcomeUnchanged,true);
assert.equal(b87.readOnly,true);
assert.equal(b88.readOnly,true);
assert.equal(b88.physicalOutcomesIdentical,true);
assert.equal(b87.sweptClearanceProven,false);
assert.equal(b87.mergeReservationClearanceProven,false);
assert.equal(b87.aiOrSpeedChangesAuthorized,false);
assert.equal(b88.safetyClearanceProven,false);
assert.equal(b88.aiPatchAuthorized,false);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const cases=[];
for(const pair of replay.pairs){
 const seed=pair.seed;
 const b85case=b85.cases.find(x=>x.seed===seed);
 const b87case=b87.cases.find(x=>x.seed===seed);
 const b88case=b88.cases.find(x=>x.seed===seed);
 const prior=baseline.cases.find(x=>x.seed===seed);
 assert(b85case&&b87case&&b88case&&prior);
 assert.equal(b85case.continuous400msEpisodes,b87case.continuous400msEpisodes);
 assert.equal(b87case.episodes.length,b87case.continuous400msEpisodes);
 assert.equal(b88case.passes,prior.passes);
 assert.equal(b88case.stops,prior.completedPitStops);
 assert.equal(b88case.finishers,12);
 assert.equal(b88case.collisionStops,0);
 assert.equal(b88case.identicalOutcomes,true);
 assert.equal(b87case.physicalOutcomeIdentical,true);
 assert(b87case.episodes.every(e=>
  e.classification==='ADVISORY_CANDIDATE_UNBLOCKED_NOT_PHYSICALLY_CLEARED'&&
  e.maximumReportedMergeBlockers===0&&e.minimumCandidateCount>0));
 cases.push({seed,finishers:12,physicsPasses:prior.passes,
  genuinePitStops:prior.completedPitStops,collisionStops:0,
  physicsFingerprint:b88case.sha256,
  candidateUnblocked400msEpisodes:b87case.continuous400msEpisodes,
  safetyClassification:'ADVISORY_ONLY_NO_SWEPT_OR_RESERVATION_PROOF',
  permittedGameLogicChanges:[]});
 console.log(JSON.stringify({phase:'R5-b89',status:'CASE_PASS',seed,
  verdict:'HOLD_UNPROVEN_LANE_CLEARANCE'}));
}
const result={phase:'R5-b89',status:'PASS',track:'majoku-ring-v1',
 evidenceValidated:true,races:2,readOnly:true,
 classification:'HOLD_UNPROVEN_LANE_CLEARANCE',cases,
 liveAiBrakingReductionApproved:false,
 rearCarBoostApproved:false,collisionOverrideApproved:false,
 sweptCollisionClearanceProven:false,mergeReservationSafetyProven:false,
 reasons:['Candidate count and zero reported merge blockers are not swept-world clearance',
  'The 20ms FOLLOW sample covers the first 90s, not every situation in both races',
  'No controlled identical-seed safe-lane before/after intervention has been certified',
  'Never modify other six locked WIP tracks']};
fs.writeFileSync(dir+'b89-live-ai-evidence-gate.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b89',status:'PASS',
 verdict:result.classification,approved:false}));
