// R5-b118: first 90s real-grid top-pair pursuit state attribution.
// PLAN_ATTACK and corridor candidates are NOT collision-free passes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const replay=read('replay.json'),decision=read('decision.json');
assert.equal(replay.status,'PASS');
assert.equal(decision.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(decision.safeLiveAiPatchApproved,false);
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const cases=[];
for(const pair of replay.pairs){
 const row=read('seed'+pair.seed+'-observed10.json');
 const d=decision.cases.find(c=>c.seed===pair.seed);
 assert(d&&row.status==='PASS'&&row.track==='majoku-ring-v1');
 const p=row.real20ms;
 assert(p&&p.acceptedFrames>=4400&&p.acceptedFrames<=4500);
 assert.equal(p.closeFasterFrames,pair.nearFasterFrames);
 assert.equal(p.followCloseFaster,pair.followingNearFaster);
 assert.equal(p.planAttackCloseFaster,pair.attackPlanningNearFaster);
 assert.equal(p.corridorCandidateFrames,pair.offeredCorridorCandidateFrames);
 assert.equal(p.blockedFrames,pair.mergeBlockedFrames);
 assert.equal(p.closeFasterFrames,d.nearFaster20msFrames);
 assert.equal(p.planAttackCloseFaster,d.attackPlanner20msFrames);
 assert.equal(p.followCloseFaster,d.followingCloseFaster20msFrames);
 assert(p.closeFasterFrames<=p.frontFrames);
 assert(p.planAttackCloseFaster<=p.closeFasterFrames);
 assert(p.followCloseFaster<=p.closeFasterFrames);
 const otherFrames=p.closeFasterFrames-p.planAttackCloseFaster-p.followCloseFaster;
 assert(otherFrames>=0,'Attack and FOLLOW modes must not overlap one frame');
 const first90Passes=row.physics.passEvents.filter(x=>x.t<=90.001).length;
 const percentage=n=>p.closeFasterFrames>0?100*n/p.closeFasterFrames:0;
 cases.push({seed:pair.seed,realRaceFinished:true,
  accepted20msFrames:p.acceptedFrames,closeAndFasterFrames:p.closeFasterFrames,
  planAttackFrames:p.planAttackCloseFaster,
  followFrames:p.followCloseFaster,
  otherStateFrames:otherFrames,
  planAttackShareOfCloseFasterPercent:percentage(p.planAttackCloseFaster),
  followShareOfCloseFasterPercent:percentage(p.followCloseFaster),
  corridorCandidateFrames:p.corridorCandidateFrames,
  reportedMergeBlockedFrames:p.blockedFrames,
  genuineFieldPhysicalPassesFirst90s:first90Passes,
  genuineFieldPhysicalPassesFullTenLaps:row.physics.passes,
  sustainedUnblockedFollow400msEpisodes:p.candidateUnblocked400msEpisodes,
  physicalMergeSafetyProven:false,unnecessaryBrakingProven:false});
 console.log(JSON.stringify({phase:'R5-b118',status:'CASE_PASS',seed:pair.seed,
  closeAndFaster:p.closeFasterFrames,planAttack:p.planAttackCloseFaster,
  follow:p.followCloseFaster,other:otherFrames}));
}
assert.equal(cases.length,2);
const output={phase:'R5-b118',status:'PASS',track:'majoku-ring-v1',
 sampleScope:'observed first 90s of two genuine 12-car/10-lap races',
 futureGameTuningAuthorized:false,physicsChanged:false,
 candidateRouteIsNotSweptSafetyClearance:true,
 interpretations:['PLAN_ATTACK means intended pursuit state, not proved safe overtake',
  'A near/faster frame is not equivalent to an unneeded brake',
  'Top two drivers can change identity; not a fixed leader-follower pair',
  'Cannot generalize these two seeds to all races'],cases};
fs.writeFileSync(dir+'b118-chase-state-attribution.json',JSON.stringify(output,null,2));
