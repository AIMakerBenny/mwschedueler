// R5-b25: verify the real pit/main-track physical corridor before
// proposing any collision-solver bypass. Never changes runtime physics.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const seed=Number(process.env.MWS_R5B9_SEED||1);
assert([1,2].includes(seed),'Seed must be 1 or 2');
const input='artifacts/f1-v12-r5b9-blue-coast-seed'+seed+'.json';
const race=JSON.parse(fs.readFileSync(input,'utf8'));
assert.equal(race.status,'PASS','Only completed true-physics races are admissible');
assert.equal(race.seed,seed);
assert.equal(race.baseline?.collisionStops,0,'Physical solver encountered a collision stop');
assert.deepEqual(race.baseline?.invalid,[],'Physical solver invalid-steps present');
const root=race.rootChains,chain=race.peerChain;
assert(root&&chain,'No accepted upstream braking chain');
const topology=chain.firstPitChainGeometry;
const audit={phase:'R5-b25',seed,status:'PASS',physicalCollisionStops:race.baseline.collisionStops,
 pitDependentSlowFrames:root.terminalDistribution.find(x=>x.terminal==='PIT_STATE')?.frames||0,
 physicalChain:null,
 conclusion:'Not available - no pit terminal sampled in the observed target slowdown',
 recommendedChange:'Never bypass pit-lane collision constraints without demonstrated, separate world geometry'};

if(seed===2){
 assert(topology&&topology.cars?.length===4&&topology.links?.length===3,
  'R5-b24 real pit-to-track chain geometry missing');
 assert(Number.isFinite(topology.t),'Missing physical chain timestamp');
 const ids=['r5b3-driver-0','r5b3-driver-9','r5b3-driver-10','r5b3-driver-3'];
 assert.deepEqual(topology.cars.map(x=>x.id),ids,
  'Upstream chain does not match the observed first pit dependency');
 assert.equal(topology.cars[0].pit,'PIT_LANE',
  'Pit terminal is not in the physically modeled lane');
 assert(topology.cars.slice(1).every(x=>x.pit==='TRACK'),
  'Pit chain follower is not on the main circuit');
 const perLink=topology.links.map((link,i)=>{
  const leader=topology.cars[i],follower=topology.cars[i+1];
  assert.equal(link.leading,leader.id);assert.equal(link.follower,follower.id);
  for(const c of [leader,follower]){
   assert(Number.isFinite(c.candidateLateralMeters)&&
    Number.isFinite(c.physicalEnvelopeWidthMeters)&&c.physicalEnvelopeWidthMeters>0,
    'Missing genuine physical chassis width or lane position');
   assert(c.worldEnd&&Number.isFinite(c.worldEnd.x)&&
    Number.isFinite(c.worldEnd.y)&&Number.isFinite(c.worldEnd.heading),
    'Missing computed 2D world pose or heading');
  }
  const lateral=Math.abs(follower.candidateLateralMeters-leader.candidateLateralMeters);
  assert(Math.abs(lateral-link.relativeLateralMeters)<1e-7,
   'Reported relative lateral distance differs from candidate physical state');
  const requiredClearance=(leader.physicalEnvelopeWidthMeters+
   follower.physicalEnvelopeWidthMeters)/2;
  const samePhysicalCorridor=lateral<requiredClearance;
  return {from:leader.id,to:follower.id,
   fromState:leader.pit,toState:follower.pit,
   lateralMeters:lateral,requiredLateralClearanceMeters:requiredClearance,
   samePhysicalCorridor,
   candidateWorldCenterDistanceMeters:Math.hypot(
    leader.worldEnd.x-follower.worldEnd.x,
    leader.worldEnd.y-follower.worldEnd.y)};
 });
 const first=perLink[0];
 assert(first.fromState==='PIT_LANE'&&first.toState==='TRACK',
  'Missing the direct pit/main-track constraint boundary');
 assert(first.samePhysicalCorridor,
  'The logged pit and track cars do not share an occupied lateral corridor; re-examine this diagnostic before classifying safety');
 assert(perLink.every(x=>x.samePhysicalCorridor),
  'A chain member is laterally separated, requiring geometry-specific review');
 assert(audit.pitDependentSlowFrames>0,'Missing completed pit-cascade evidence');
 audit.physicalChain={t:topology.t,links:perLink,
  lateralOverlapCount:perLink.filter(x=>x.samePhysicalCorridor).length,
  crossStatePairs:perLink.filter(x=>x.fromState!==x.toState).length};
 audit.conclusion='Observed pit-lane and track cars physically share lateral clearance in the current unified world coordinates';
 audit.recommendedChange='A naive pit-state traffic-brake exemption is UNSAFE without separate lane geometry plus swept-envelope QA';
}else{
 assert(!topology||topology.cars?.length===4,
  'Unexpected malformed optional physical pit geometry');
}
const output='artifacts/f1-v12-r5b25-pit-corridor-seed'+seed+'.json';
fs.writeFileSync(output,JSON.stringify(audit,null,2));
console.log(JSON.stringify({...audit,artifact:output}));
