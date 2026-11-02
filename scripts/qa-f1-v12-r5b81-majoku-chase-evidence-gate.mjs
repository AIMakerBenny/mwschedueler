// R5-b81 - gate on authentic real-grid results before any AI adjustment.
// Do not confuse candidate lane options with a swept-body safe trajectory.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const replay=read('artifacts/r5-b77-majoku/replay.json');
const brake=read('artifacts/r5-b77-majoku/traffic-attribution.json');
const decision=read('artifacts/r5-b77-majoku/decision.json');
assert.equal(replay.status,'PASS');
assert.equal(brake.status,'PASS');
assert.equal(decision.status,'PASS');
assert.equal(replay.track,'majoku-ring-v1');
assert.equal(brake.track,'majoku-ring-v1');
assert.equal(decision.track,'majoku-ring-v1');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(brake.tenLapPhysicsIdentical,true);
assert.equal(decision.physicalOutcomeIdentical,true);
assert.equal(decision.safeLiveAiPatchApproved,false);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
assert.deepEqual(brake.cases.map(x=>x.seed),[1,2]);
assert.deepEqual(decision.cases.map(x=>x.seed),[1,2]);
const cases=[];
for(const seed of [1,2]){
 const physical=replay.pairs.find(x=>x.seed===seed);
 const traffic=brake.cases.find(x=>x.seed===seed);
 const risk=decision.cases.find(x=>x.seed===seed);
 assert(physical&&traffic&&risk);
 assert.equal(physical.trueOpeningGapMeters,traffic.actualFirstStepLeadGapMeters);
 assert.equal(physical.first90EndGapMeters,traffic.phases.at(-1).endGapMeters);
 assert.equal(physical.followingNearFaster,traffic.closeFasterFollowFrames);
 assert.equal(physical.persistent400msFollow,traffic.persistent400msFollowEpisodes);
 assert.equal(physical.nearFasterFrames,traffic.closeFasterObservedFrames);
 assert.equal(traffic.phases.length,3);
 assert(traffic.phases.every((p,i)=>
  p.fromSeconds===i*30&&p.toSeconds===(i+1)*30));
 const withFollowerBrake=traffic.phases.reduce((n,p)=>
  n+p.attributedToSecondAtWindowEnd,0);
 const brakeRatio=traffic.physicalTrafficBrakeCountsTotal90s>0?
  withFollowerBrake/traffic.physicalTrafficBrakeCountsTotal90s:0;
 const potential=(risk.potentialDelayedAttackSignal||
  withFollowerBrake>0&&physical.persistent400msFollow>0);
 cases.push({seed,unmodifiedTrueTenLapReplay:true,
  first90SecondsPhysicalPasses:traffic.realPhysicalPassesFirst90s,
  topTwoBrakeCountAttributedAtWindowEnd:withFollowerBrake,
  allCarBrakeCount:traffic.physicalTrafficBrakeCountsTotal90s,
  currentSecondBrakeShareOfField:brakeRatio,
  sustained400msFollowEpisodes:physical.persistent400msFollow,
  actualCorridorOptionsObserved:physical.offeredCorridorCandidateFrames,
  hypotheticalUnnecessaryBrakeProven:false,
  potentialForFurtherClearanceStudy:potential,
  nextEvidence:'Reconstruct a complete collision-free lane-merge path with the real physical safety reservations'});
}
assert.equal(cases.length,2);
const reasons=[
 'AI is not guaranteed to recompute every 20ms committed step',
 'Candidate corridor counts do not prove collision-free swept motion',
 '5s-attributed traffic steps can include vehicles that changed race position within the window',
 'Two fixed seeds and a 90s diagnostic interval cannot certify full-race improvement'
];
const outcome={phase:'R5-b81',status:'PASS',track:'majoku-ring-v1',
 actualTenLapSeeds:[1,2],cases,
 sourceReplayIdentical:true,
 physicalCollisionSafetyPreserved:true,
 permissionToChangeLiveAIDeceleration:false,
 permissionToForceOvertakes:false,
 nextRequiredTest:'Direct actual-grid before/after safe-lane counterfactual with identical full-race finishing and collision checks',
 interpretation:'Evidence for prioritizing a clearance study, not sufficient evidence for changing live AI',
 reasons,otherSixTracksStatus:'WIP-LOCKED'};
const output='artifacts/r5-b77-majoku/chase-evidence-gate.json';
fs.writeFileSync(output,JSON.stringify(outcome,null,2));
console.log(JSON.stringify({phase:outcome.phase,status:outcome.status,
 certifiedAiFix:outcome.permissionToChangeLiveAIDeceleration,
 seedSummaries:cases.map(c=>({seed:c.seed,
  fullRacePasses:c.first90SecondsPhysicalPasses,
  constrainedCarSteps:c.allCarBrakeCount,
  sustainedFollow:c.sustained400msFollowEpisodes})),
 artifact:output}));
