// R5-b33: independently reconcile real accepted pit-entry lateral intent
// and physical blocking peers during the Blue Coast pit wave.
// No browser overrides, artificial ranks, positions or speed corrections.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const seed=Number(process.env.MWS_R5B9_SEED||1);
assert([1,2].includes(seed),'Only seeded full-race references 1 and 2 supported');
const input='artifacts/f1-v12-r5b9-blue-coast-seed'+seed+'.json';
const race=JSON.parse(fs.readFileSync(input,'utf8'));
assert.equal(race.status,'PASS','Require complete accepted physical race');
assert.equal(race.seed,seed);
assert.equal(race.baseline?.collisionStops,0,'Real physical collision stop');
assert.deepEqual(race.baseline?.invalid,[],'Invalid physical step');
const frames=race.baseline?.peerChainFrames||[];
assert(frames.length>100,'Missing accepted 100ms physical snapshots');
const tracked=['r5b3-driver-0','r5b3-driver-1'];
const entrants=tracked.map(id=>{
 const accepted=frames.flatMap(f=>f.cars.filter(c=>c.id===id&&c.requestedPit)
  .map(c=>({...c,t:f.t})));
 const prep=accepted.filter(c=>c.pit==='TRACK');
 const blocked=accepted.filter(c=>c.blockedMergeIds?.length>0);
 const blockers=new Map();
 for(const c of blocked)for(const peer of c.blockedMergeIds)
  blockers.set(peer,(blockers.get(peer)||0)+1);
 const intent=accepted.filter(c=>c.racingLineMode==='PIT_LINE');
 for(const c of accepted){
  assert(Number.isFinite(c.lateralMeters)&&Number.isFinite(c.candidateLateralMeters),
   'Missing true lateral positions for '+id);
  if(c.commandedLaneTarget!==null)assert(Number.isFinite(c.commandedLaneTarget),
   'Non-finite requested pit line target '+id);
  assert(Array.isArray(c.blockedMergeIds),'Missing merge occupancy provenance '+id);
 }
 return {id,observedFrames:accepted.length,preEntryFrames:prep.length,
  pitLineModeFrames:intent.length,
  blockedFrames:blocked.length,
  preEntryBlockedFrames:prep.filter(c=>c.blockedMergeIds.length).length,
  topBlockers:[...blockers].sort((a,b)=>b[1]-a[1])
   .map(([driver,frames])=>({driver,frames,seconds:frames*.1})),
  earliestRequested:accepted[0]?{
   t:accepted[0].t,pit:accepted[0].pit,lateralMeters:accepted[0].lateralMeters,
   laneTarget:accepted[0].commandedLaneTarget,mode:accepted[0].racingLineMode}:null,
  latestTrack:prep.length?{
   t:prep[prep.length-1].t,
   lateralMeters:prep[prep.length-1].lateralMeters,
   laneTarget:prep[prep.length-1].commandedLaneTarget,
   blockedBy:prep[prep.length-1].blockedMergeIds}:null};
});
const source=race.pitAvoidance?.pitEntryBottlenecks;
assert(Array.isArray(source)&&source.length===2,
 'R5-b31 recorded accepted pit-entry blockage summary missing');
for(const r of entrants){
 const baseline=source.find(s=>s.id===r.id);
 assert(baseline,'R5-b31 pit-entry vehicle missing '+r.id);
 assert.equal(r.preEntryFrames,baseline.preEntryFrames,
  'Observed pre-entry frame count inconsistent '+r.id);
 assert.equal(r.blockedFrames,baseline.blockedFrames,
  'Physical merge blocking count inconsistent '+r.id);
 assert.equal(r.preEntryBlockedFrames,baseline.preEntryBlockedFrames,
  'Missing recorded TRACK pit-preparation blockage '+r.id);
}
const report={phase:'R5-b33',status:'PASS',seed,
 observedFrames:frames.length,entrants,
 slowTrackSeconds:race.rootCauseTelemetry.slowTrackSeconds,
 trafficLimitedSeconds:race.rootCauseTelemetry.predictedTrafficLimitedSlowSeconds,
 physicalCollisionStops:race.baseline.collisionStops,
 caveat:'A limited accepted window near the reference pit wave, not an isolated causal experiment; zero collision-stop evidence does not replace the continuous world-space validator.'};
const output='artifacts/f1-v12-r5b33-pit-entry-seed'+seed+'.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,artifact:output}));
