// R5-b72: discriminate physical corridor opportunities from assumptions
// that PLAN_ATTACK or traffic braking must be overridden in the public race.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const evidence=JSON.parse(fs.readFileSync('artifacts/r5-b71-majoku/controls.json','utf8'));
const archived=JSON.parse(fs.readFileSync('artifacts/r5-b53-majoku/ai-decision-gate.json','utf8'));
assert.equal(evidence.status,'PASS');assert.equal(archived.status,'PASS');
assert.equal(evidence.track,'majoku-ring-v1');
assert.equal(evidence.unchangedPhysicsProvenAcrossTwoFixtures,true);
assert.deepEqual(evidence.comparisons.map(x=>x.seed),[0,1]);
assert.equal(archived.liveGameChanged,false);
assert.equal(archived.automaticBalancePatch,false);
const cases=[];
for(const item of evidence.comparisons){
 const d=item.diagnostics;
 assert(item.physicsIdentical);
 assert(d.frames<=4500&&d.attackEligible<=d.frames);
 assert(d.corridorClear+d.corridorBlocked===d.attackEligible);
 assert(d.clearButFollow<=d.corridorClear);
 assert(d.clearButBrake<=d.corridorClear);
 assert(d.clearButFollow+d.corridorBlocked<=d.attackEligible);
 assert(d.examples.length<=50);
 const coarseWindows=new Map();
 for(const e of d.examples){
  assert(e.ms>=20&&e.ms<=90000);
  assert(e.leader!==e.follower);
  assert(Number.isFinite(e.gapMeters)&&Number.isFinite(e.relativeMps));
  const k=Math.floor(e.ms/5000)*5;
  const bucket=coarseWindows.get(k)||{seconds:k,observedExamples:0,
   followWithClear:0,brakingWithClear:0,oneOrMorePhysicalOptions:0};
  bucket.observedExamples++;
  if(e.corridorTarget!==null){
   bucket.oneOrMorePhysicalOptions++;
   if(e.mode==='FOLLOW')bucket.followWithClear++;
   if(e.brakeCount>0)bucket.brakingWithClear++;
  }
  coarseWindows.set(k,bucket);
 }
 cases.push({seed:item.seed,realAccepted20msObservations:4500,
  physicalBaselineUnchanged:item.physicsIdentical,
  observedAttackEligibleSteps:d.attackEligible,validCorridorFrames:d.corridorClear,
  rejectedCorridorFrames:d.corridorBlocked,
  corridorViableButFollowingFrames:d.clearButFollow,
  corridorViableWithTrafficBrakeFrames:d.clearButBrake,
  opponentAheadTrafficBrakeFrames:d.brakeInAttack,
  proximityTimeGateFrames:d.notYetClose,
  examplesGroupedIntoFiveSecondBuckets:[...coarseWindows.values()].sort((a,b)=>a.seconds-b.seconds),
  verdict:'OBSERVATION_ONLY_NO_SAFE_OVERBRAKING_PROOF'});
}
const flags={
 anyViableCorridorWithFollow:cases.some(x=>x.corridorViableButFollowingFrames>0),
 anyViableCorridorWithTrafficBrake:cases.some(x=>x.corridorViableWithTrafficBrakeFrames>0),
 stablePhysicalObservations:cases.every(x=>x.physicalBaselineUnchanged),
 trueTenLapSampledContext:archived.comparisons.length===2,
 safetyEnforced:true,
 authorizePhysicsOrAiChange:false};
const result={phase:'R5-b72',status:'PASS',track:'majoku-ring-v1',
 runScope:'two 90s accepted-step 9m-grid Majoku-only windows',
 cases,flags,
 recommendedFollowup:'If clear-corridor braking appears, reproduce the same issue in full 12-car 10-lap real-grid 20ms playback with collision-free reservation before changing live AI',
 explicitlyNotDemonstrated:['No validated unnecessary braking established by this diagnostic',
  'No real full-ten-lap 20ms corridor record',
  'No model proving a candidate route remains free throughout a complete lane merge',
  'No evidence supporting forced speed boosts, rank changes or overtake injection'],
 invariants:['All other six public tracks remain WIP-locked',
  'Unified physical solver source unchanged',
  'Full-race pit, safety and collision rules retained']};
const output='artifacts/r5-b71-majoku/decision.json';
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b72',status:'PASS',flags,
 cases:cases.length,artifact:output}));
