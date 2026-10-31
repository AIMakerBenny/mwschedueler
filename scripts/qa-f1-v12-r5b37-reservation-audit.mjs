// R5-b37: independent read-only accepted-physics reservation audit.
// Audits the actual physical lane-reservation overrides on both Blue Coast
// seeds. This script cannot change trajectories, collision policy or ranks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const seed=Number(process.env.MWS_R5B9_SEED||1);
assert([1,2].includes(seed),'Seed must be 1 or 2');
const input='artifacts/f1-v12-r5b9-blue-coast-seed'+seed+'.json';
const race=JSON.parse(fs.readFileSync(input,'utf8'));
assert.equal(race.status,'PASS','Full accepted-physics race required');
assert.equal(race.seed,seed);
assert.equal(race.baseline?.collisionStops,0,'Actual collision stop is not acceptable');
assert.deepEqual(race.baseline?.invalid,[],'Invalid physical integration step');
const frames=race.baseline?.peerChainFrames||[];
assert(frames.length>100,'Accepted multi-vehicle race frames missing');
const overrides=frames.flatMap(f=>(f.cars||[]).filter(c=>c.laneReservationOverride)
 .map(c=>({t:f.t,id:c.id,pit:c.pit,actualY:c.lateralMeters,
  target:c.commandedLaneTarget,...c.laneReservationOverride})));
for(const item of overrides){
 assert([item.separationMeters,item.requiredClearanceMeters,
  item.beforeMeters,item.afterMeters,item.gapMeters].every(Number.isFinite),
  'Missing physical reservation clearance, delta or gap');
 assert(item.separationMeters>=0&&item.requiredClearanceMeters>0&&item.gapMeters>=0,
  'Impossible collision envelope or longitudinal gap');
 assert(item.peer&&item.peer!==item.id,'Missing real physical blocking peer');
}
const observed=['r5b3-driver-0','r5b3-driver-1','r5b3-driver-9'].map(id=>{
 const cells=overrides.filter(x=>x.id===id);
 const far=cells.filter(x=>x.separationMeters>x.requiredClearanceMeters+.6);
 return {id,frames:cells.length,farSeparatedFrames:far.length,
  first:cells[0]||null,
  peers:[...new Set(cells.map(x=>x.peer))].map(peer=>({
   peer,frames:cells.filter(x=>x.peer===peer).length}))};
});
const expected=race.pitAvoidance?.pitReservationSummary;
assert(Array.isArray(expected)&&expected.length===3,'R5-b37 source telemetry missing');
for(const entry of observed){
 const e=expected.find(x=>x.id===entry.id);
 assert(e,'Missing physical reservation driver');
 assert.equal(entry.frames,e.frames,'Reservation override frame counts disagree');
 assert.equal(entry.farSeparatedFrames,e.farSeparatedFrames,
  'Accepted far-separated override measurement inconsistent');
}
const report={phase:'R5-b37',seed,status:'PASS',
 acceptedReservationEvents:overrides.length,physicalCollisionStops:race.baseline.collisionStops,
 observed,slowTrackSeconds:race.rootCauseTelemetry.slowTrackSeconds,
 caveat:'Only accepted sampled physics. This is observational correlation; no collision-reservation exemption was used.'};
const output='artifacts/f1-v12-r5b37-reservation-audit-seed'+seed+'.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,artifact:output}));
