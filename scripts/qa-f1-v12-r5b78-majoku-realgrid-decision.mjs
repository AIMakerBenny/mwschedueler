// R5-b78 - genuine 10-lap, 20ms pursuit evidence gate.
// A corridor candidate and a FOLLOW state cannot alone prove unsafe braking.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const replay=read('artifacts/r5-b77-majoku/replay.json');
const baseline=read('artifacts/r5-b49-majoku/summary.json');
assert.equal(replay.status,'PASS');
assert.equal(baseline.status,'PASS');
assert.equal(replay.track,'majoku-ring-v1');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(replay.fullTenLapRaces,2);
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const cases=[];
for(const p of replay.pairs){
 const b=baseline.cases.find(x=>x.seed===p.seed);
 assert(b&&b.finishers===12);
 assert(p.physicsIdentical&&p.finishIdentical&&p.pitsIdentical);
 assert.equal(p.fullTenLap,true);
 assert(p.accepted20msFrames>=4400&&p.accepted20msFrames<=4500);
 assert(Number.isFinite(p.trueOpeningGapMeters)&&p.trueOpeningGapMeters>0);
 assert(Number.isFinite(p.first90EndGapMeters)&&p.first90EndGapMeters>=0);
 assert(p.followingNearFaster<=p.nearFasterFrames);
 assert(p.persistent400msFollow<=p.followingNearFaster);
 assert(p.offeredCorridorCandidateFrames<=p.nearFasterFrames);
 const flagged=p.persistent400msFollow>0&&p.offeredCorridorCandidateFrames>0;
 cases.push({seed:p.seed,trueStartGridGapMeters:p.trueOpeningGapMeters,
  first90GapMeters:p.first90EndGapMeters,confirmedTenLapPasses:b.passes,
  finishGapSeconds:b.firstToSecondFinishGapSeconds,
  nearFaster20msFrames:p.nearFasterFrames,
  followingCloseFaster20msFrames:p.followingNearFaster,
  attackPlanner20msFrames:p.attackPlanningNearFaster,
  follow400msEpisodes:p.persistent400msFollow,
  corridorCandidate20msFrames:p.offeredCorridorCandidateFrames,
  blockedMerge20msFrames:p.mergeBlockedFrames,
  potentialDelayedAttackSignal:flagged,physicalOutcomeUnchanged:true,
  classification:flagged?'DIRECT_CLEARANCE_REPRODUCTION_REQUIRED':'NO_CONFIRMED_AI_ERROR'});
}
const potential=cases.some(x=>x.potentialDelayedAttackSignal);
const result={phase:'R5-b78',status:'PASS',track:'majoku-ring-v1',
 fullTenLapRaces:2,readOnlyDiagnostics:true,physicalOutcomeIdentical:true,
 cases,safeLiveAiPatchApproved:false,
 furtherInvestigationNeeded:potential,
 reason:potential?'Reconstruct real swept-body lane safety before changing FOLLOW or braking':
 'No proven persistent avoidable follow anomaly in these two seeded races',
 constraints:['No rank-based boosts, position warps or artificial overtakes',
  'A corridor candidate is not a proven physically reachable overtaking path',
  'Collision reservations and swept-world physics are mandatory',
  'Other six WIP circuits remain locked',
  'Two seeds do not certify universal game balance']};
const output='artifacts/r5-b77-majoku/decision.json';
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b78',status:'PASS',
 furtherInvestigation:potential,patchApproved:false,artifact:output}));
