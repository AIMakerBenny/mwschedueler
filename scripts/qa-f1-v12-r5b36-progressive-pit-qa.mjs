// R5-b36 - independently verify accepted 12-car physical partial pit merges.
// The physics engine and replay are not altered; inspect the same 100ms states
// as the current complete Blue Coast 10-lap browser race.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const seed=Number(process.env.MWS_R5B9_SEED||1);
assert([1,2].includes(seed),'Unexpected race seed');
const source='artifacts/f1-v12-r5b9-blue-coast-seed'+seed+'.json';
const race=JSON.parse(fs.readFileSync(source,'utf8'));
assert.equal(race.status,'PASS','The full race must complete first');
assert.equal(race.seed,seed);
const snapshots=race.baseline?.peerChainFrames;
assert(Array.isArray(snapshots)&&snapshots.length>100,
 'No accepted 100ms all-car physical states');
assert.equal(race.baseline.collisionStops,0,
 'Zero physical collision stops required');
assert.deepEqual(race.baseline.invalid,[],
 'Every physical swept-world step must remain valid');
assert(race.baseline.rows?.length===12&&race.baseline.rows.every(c=>
 c.finishMs>0&&c.lapTimesMs?.length===10),
 'All 12 cars must actually finish the complete 10-lap race');
const selected=snapshots.flatMap(frame=>frame.cars.filter(c=>c.pitPartial)
 .map(c=>({t:frame.t,id:c.id,state:c.pit,
  actualLateral:c.lateralMeters,commanded:c.commandedLaneTarget,
  start:c.pitPartial.startLateral,partial:c.pitPartial.partialTarget,
  full:c.pitPartial.fullTarget,
  originallyBlocked:c.pitPartial.fullTargetBlockedBy||[]})));
for(const c of selected){
 const full=c.full-c.start,step=c.partial-c.start;
 assert(c.state==='TRACK'||c.state.startsWith('PIT_'),
  'A partial pit-line steering intent belongs to the pit strategy only');
 assert([full,step,c.actualLateral,c.commanded].every(Number.isFinite),
  'Partial pit-line choice missing real physical lateral coordinates');
 assert(Math.abs(full)>.45&&step*full>0&&Math.abs(step)<Math.abs(full),
  'Intermediate target must strictly follow the true pit-side direction');
 assert(Math.abs(c.commanded-c.partial)<.000001,
  'Physical controller was not commanded to use the verified intermediate lane');
 assert(c.originallyBlocked.length>0,
  'A partial merge must originate from an actually blocked full pit lane');
}
const entrants=['r5b3-driver-0','r5b3-driver-1'].map(id=>{
 const timeline=selected.filter(x=>x.id===id);
 const baseline=race.pitAvoidance?.pitEntryBottlenecks?.find(x=>x.id===id);
 assert(baseline,'Missing physical pit entrant from R5-b31 audit');
 assert.equal(timeline.length,baseline.partialFrames,
  'Independent accepted partial samples disagree with primary telemetry');
 return {id,partialFrames:timeline.length,
  preEntryPartialFrames:timeline.filter(x=>x.state==='TRACK').length,
  firstPartial:timeline[0]||null,
  farthestTargetDistanceMeters:timeline.length?
   Math.max(...timeline.map(x=>Math.abs(x.full-x.start))):null};
});
const report={phase:'R5-b36',seed,status:'PASS',
 totalPartialSnapshots:selected.length,entrants,
 slowTrackSeconds:race.rootCauseTelemetry.slowTrackSeconds,
 trafficLimitedSeconds:race.rootCauseTelemetry.predictedTrafficLimitedSlowSeconds,
 physicalCollisionStops:race.baseline.collisionStops,
 limitations:'Accepted 100ms telemetry, not a promise of traffic improvement. Compare full-race slowdown separately.'};
const artifact='artifacts/f1-v12-r5b36-progressive-pit-seed'+seed+'.json';
fs.writeFileSync(artifact,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,artifact}));
if(seed===2)assert(selected.length>0,
 'R5-b35 progressive physical pit entry never activated in the verified congestion seed');
