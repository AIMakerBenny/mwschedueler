// R5-b83 - distinguish route CANDIDATES from actual physical clearance.
// Tests authentic unmodified 12-car Majoku 10-lap Chromium observations.
// Never infer an AI failure or authorize collision/merge safety relaxation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const replay=read('artifacts/r5-b77-majoku/replay.json');
const traffic=read('artifacts/r5-b77-majoku/traffic-attribution.json');
const gate=read('artifacts/r5-b77-majoku/decision.json');
for(const r of [replay,traffic,gate])assert.equal(r.status,'PASS');
assert.equal(replay.track,'majoku-ring-v1');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(traffic.tenLapPhysicsIdentical,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const cases=[];
for(const race of replay.pairs){
 const p=read(race.observedFile).real20ms;
 const sameSeed=traffic.cases.find(x=>x.seed===race.seed);
 assert(sameSeed&&p);
 assert.equal(p.acceptedFrames,4500);
 assert.equal(p.frontFrames<=p.acceptedFrames,true);
 assert(p.closeFasterFrames<=p.frontFrames);
 assert.equal(p.followCloseFaster,
  p.followWithoutCandidateFrames+p.followCandidateBlockedFrames+
   p.followCandidateUnblockedFrames,
  'Every real follow frame must have exactly one candidate/merge classification');
 assert(p.followCandidateBlockedFrames<=p.blockedFrames);
 assert(p.followCandidateUnblockedFrames<=p.corridorCandidateFrames);
 assert(p.attackPlannedUnblockedFrames<=p.planAttackCloseFaster);
 assert(p.streak400ms<=p.followCloseFaster);
 assert(p.maxStreakFrames<=p.followCloseFaster);
 assert.equal(p.corridorCandidatesNotClearance,true);
 assert.equal(sameSeed.closeFasterObservedFrames,p.closeFasterFrames);
 assert.equal(sameSeed.closeFasterFollowFrames,p.followCloseFaster);
 assert.equal(sameSeed.persistent400msFollowEpisodes,p.streak400ms);
 const d={
  seed:race.seed,realGridPhysicsIdentical:true,fullTenLaps:true,
  observedFirst90sAccepted20msSteps:p.acceptedFrames,
  within70mAndClosingFaster:p.closeFasterFrames,
  followingWithNoCorridorCandidates:p.followWithoutCandidateFrames,
  followingWithCandidatesButMergeBlocked:p.followCandidateBlockedFrames,
  followingWithCandidatesNoReportedMergeBlock:p.followCandidateUnblockedFrames,
  plannedAttackNoReportedMergeBlock:p.attackPlannedUnblockedFrames,
  followingAll:p.followCloseFaster,
  sustained400msFollowingEpisodes:p.streak400ms,
  noConfirmedUnnecessaryBraking:true,
  meaning:'Reported merge blockers and attempted corridor candidates are advisory, not a full swept-body safety clearance'};
 cases.push(d);
 console.log(JSON.stringify({phase:'R5-b83',status:'CASE_PASS',seed:d.seed,
  follow:d.followingAll,withoutCandidate:d.followingWithNoCorridorCandidates,
  blockedCandidate:d.followingWithCandidatesButMergeBlocked,
  candidateWithoutReportedBlock:d.followingWithCandidatesNoReportedMergeBlock,
  sustained:d.sustained400msFollowingEpisodes}));
}
assert.deepEqual(cases.map(c=>c.seed),[1,2]);
const result={phase:'R5-b83',status:'PASS',track:'majoku-ring-v1',
 realGridAndPitLifecycle:true,completeTenLapRaces:2,
 physicalOutcomeUnchanged:true,cases,
 safeLiveOvertakeTuningApproved:false,
 risks:['Candidates can be counted even when no corridor target is physically reachable',
  'A nonblocked merge flag is not a swept-world collision-free path proof',
  'The AI changes advisory target less frequently than 20ms physical solver commits',
  'A FOLLOW observation is not proof that physical braking is too strong',
  'There is no general balance certification from two deterministic seeds'],
 nextRequiredEvidence:'Direct before/after collision-free swept-path comparison on identical real-grid races'};
const out='artifacts/r5-b77-majoku/corridor-evidence.json';
fs.writeFileSync(out,JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b83',status:'PASS',artifact:out}));
