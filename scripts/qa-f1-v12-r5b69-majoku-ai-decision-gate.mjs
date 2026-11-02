// R5-b69 - traceable Majoku-only pursuit investigation gate.
// A correlation must never silently become a live physics tweak.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const modes=read('artifacts/r5-b53-majoku/chase-modes.json');
const attacks=read('artifacts/r5-b53-majoku/attack-outcomes.json');
const traffic=read('artifacts/r5-b59-majoku/traffic-attribution.json');
const early=read('artifacts/r5-b53-majoku/early-traffic.json');
for(const report of [modes,attacks,traffic,early])assert.equal(report.status,'PASS');
assert.equal(modes.scenarios.length,2);
assert.equal(attacks.cases.length,2);
assert.equal(early.cases.length,2);
assert.equal(traffic.scenarios,12);
const comparisons=[];
for(const seed of [1,2]){
 const mode=modes.scenarios.find(x=>x.seed===seed),
  attack=attacks.cases.find(x=>x.seed===seed),
  timing=early.cases.find(x=>x.seed===seed);
 assert(mode&&attack&&timing,'Missing matched 10-lap seed');
 assert.equal(mode.track,'majoku-ring-v1');
 assert.equal(mode.earlySamples,19);
 // R5-b110: opening grid gap in earlier 90s diagnostic was recorded
 // at millimetre display precision. Compare values at that resolution,
 // rather than requiring a rounded display to equal a full-precision sample.
 assert(Number.isFinite(mode.startGapMeters)&&Number.isFinite(timing.openingPhysicalGridGapMeters));
 assert(Math.abs(mode.startGapMeters-timing.openingPhysicalGridGapMeters)<=.0005+1e-10,
  'Matched opening physical gap differs beyond 0.001m rounding precision');
 assert.equal(attack.summary.sampledLeaderIdentityChanges,
  mode.frames.slice(1).filter((x,i)=>x.leaderId!==mode.frames[i].leaderId).length);
 assert(mode.secondPlaceAttackPlanSnapshots>=0&&mode.secondPlaceAttackPlanSnapshots<=19);
 assert(attack.summary.closeAndFasterButFollowing<=attack.summary.closeAndFasterObservations);
 assert(attack.summary.physicalLeaderPairPassIntervals<=attack.summary.physicallyConfirmedPassEventsFirst90s);
 comparisons.push({
  seed,actualPhysicsTenLaps:true,observedFirst90Seconds:true,
  initialGridGapMeters:timing.openingPhysicalGridGapMeters,
  end90SecondsGapMeters:mode.end90GapMeters,
  secondPlaceAttackPlanSnapshots:mode.secondPlaceAttackPlanSnapshots,
  secondPlaceFollowingSnapshots:mode.secondPlaceFollowingSnapshots,
  closeAndFasterSnapshots:attack.summary.closeAndFasterObservations,
  closeAndFasterFollowingSnapshots:attack.summary.closeAndFasterButFollowing,
  truePhysicalPassesFirst90s:attack.summary.physicallyConfirmedPassEventsFirst90s,
  physicalPassBetweenObservedFirstAndSecond:attack.summary.physicalLeaderPairPassIntervals,
  realPitBeginsAfter90Seconds:timing.firstRealPitTransitionSeconds>90,
  note:'These metrics identify opportunities for physical-corridor QA, not proof of overconservative braking'});
}
assert(comparisons.length===2);
const engine=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const trackSource=fs.readFileSync('assets/f1-track-v1.js','utf8');
const safety={
 oneUnlockedCircuit:engine.includes("const F1_PUBLIC_TRACK_ID_V348='majoku-ring-v1'")&&
  engine.includes("if(!isF1PublicTrackV348(id)&&!isF1InternalQaV348()||!window.mwsGetF1TrackV182?.(id))return false;")&&
  engine.includes("function isF1InternalQaV348(){return window.__MWS_F1_INTERNAL_QA_V348===true}")&&
  engine.includes("if(f1ScreenStateV185!=='SETUP'||!isF1PublicTrackV348(activeTrackId)&&!isF1InternalQaV348())return false;"),
 physicalCollisionCheckerPreserved:engine.includes('if(unifiedSweptWorldV11(a,ca,b,cb))'),
 sharedLaneReservationPreserved:engine.includes('function unifiedReservationThreatV12(a,b,ca,cb)'),
 normalTrafficConstraintPreserved:engine.includes("cmd.reason='PREDICTED_TRAFFIC'"),
 allOriginalTrackDefinitionsRetained:trackSource.includes('castle-street-circuit-v1')&&
  trackSource.includes('blue-coast-speedway-v1')&&
  trackSource.includes('royal-street-circuit-v1')&&
  trackSource.includes('infinity-eight-circuit-v1')&&
  trackSource.includes('highland-flow-ring-v1')};
assert(Object.values(safety).every(Boolean),'Public track lock or original physics safety guard changed');
const actionCandidates=[
 {priority:1,scope:'Majoku only',action:'Reproduce physical attack corridor decisions near genuine front pair',
  why:'Close/faster vehicle FOLLOW samples and attack options should be investigated with 20ms decisions',
  evidence:'Real 10-lap sampled AI states plus confirmed 500ms crossing ledger',
  changeAuthorized:false},
 {priority:2,scope:'Majoku only',action:'Compare actual constrained follower deceleration with physical stopping-distance requirement',
  why:'Aggregated brake constraints can be legitimate; test for objectively safe alternative before reducing reserve',
  evidence:'Accepted vehicle-specific constrained steps from real-SVG 90s fixture; 9m grid caveat',
  changeAuthorized:false},
 {priority:3,scope:'Majoku only',action:'If safe-lane improvement is shown, stage one isolated branch experiment with collision-free replay',
  why:'Existing 46 and 32 genuine passes show physical passing works; avoid blanket boosts',
  evidence:'Two full races, no collision stops and independent short-window controls',
  changeAuthorized:false}
];
const report={phase:'R5-b69',status:'PASS',track:'majoku-ring-v1',
 comparisons,physicalGuardContracts:safety,decisions:actionCandidates,
 liveGameChanged:false,automaticBalancePatch:false,balanceCertified:false,
 reason:'Only two actual 10-lap seeds; no direct 20ms evidence that any brake was physically unnecessary',
 nextRequiredEvidence:'20ms attack-corridor reason and safe passing clearance during Majoku lead chase',
 caveat:'The 90s pit-stubbed 9m-grid fixture cannot replace actual 86m-grid full-race results'};
const output='artifacts/r5-b53-majoku/ai-decision-gate.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:'R5-b69',status:'PASS',
 comparisonSeeds:comparisons.map(x=>x.seed),safety,
 patchAuthorized:report.automaticBalancePatch,artifact:output}));
