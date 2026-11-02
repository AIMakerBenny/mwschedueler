// R5-b44: lock the R5-b42 full-race Blue Coast traffic-wave recovery.
// Reads accepted real browser race evidence. Does not alter racing physics.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const seed=Number(process.env.MWS_R5B9_SEED||1);
assert([1,2].includes(seed),'Only verified Blue Coast seeds are supported');
const input='artifacts/f1-v12-r5b9-blue-coast-seed'+seed+'.json';
const race=JSON.parse(fs.readFileSync(input,'utf8'));
assert.equal(race.status,'PASS','Require completed real paired 10-lap browser races');
assert.equal(race.seed,seed,'Seed mismatch');
assert.equal(race.trackId,'blue-coast-speedway-v1','Track mismatch');
const base=race.baseline;
assert(base?.rows?.length===12,'Missing real twelve-driver finish');
assert.equal(base.collisionStops,0,'Physical collision solver stopped');
assert.deepEqual(base.invalid,[],'Invalid accepted physics');
assert(base.rows.every(row=>row.finishMs>0&&row.lapTimesMs?.length===10),
 'Incomplete real ten-lap race');
assert.equal(race.interventions?.length,3,'Missing three real tyre counterfactual races');
for(const intervention of race.interventions){
 assert.equal(intervention.collisionStops,0,'Compound race has collision stops');
 assert.deepEqual(intervention.invalid,[],'Compound race invalid physical steps');
 assert(intervention.rows?.length===12&&intervention.rows.every(row=>
  row.finishMs>0&&row.lapTimesMs?.length===10),
  'Compound race unfinished');
}
const accepted=race.rootCauseTelemetry,traffic=race.trafficWave;
assert(Number.isFinite(accepted?.slowTrackSeconds)&&
 Number.isFinite(accepted?.predictedTrafficLimitedSlowSeconds),
 'Missing 20ms accepted solver measurements');
assert(Number.isFinite(traffic?.trackUnder95Seconds)&&
 Number.isFinite(traffic?.trackUnder5Seconds),
 'Missing 200ms traffic-wave samples');
const report={
 phase:'R5-b44',status:'PASS',seed,track:race.trackId,
 fullRaces:1+race.interventions.length,drivers:12,laps:10,
 collisionStops:base.collisionStops,
 slowTrackSeconds:accepted.slowTrackSeconds,
 constrainedSlowSeconds:accepted.predictedTrafficLimitedSlowSeconds,
 sampledUnder95Seconds:traffic.trackUnder95Seconds,
 sampledUnder5Seconds:traffic.trackUnder5Seconds,
 comparison:'R5-b43 same-source fixed-seed 20ms accepted solver',
 limitation:'Valid only for these two deterministic full-race seeds'
};
// Allow one discrete sampling interval but reject recurrence of the ~35s wave.
assert(accepted.slowTrackSeconds<=.02+1e-9,
 'R5-b42 regression: seed '+seed+' 20ms under-95km/h wave returned');
assert(accepted.predictedTrafficLimitedSlowSeconds<=.02+1e-9,
 'R5-b42 regression: predicted-traffic slowdown returned');
assert(traffic.trackUnder95Seconds<=.2+1e-9,
 'R5-b42 regression: 200ms traffic-wave check returned');
if(seed===2){
 const entry=race.pitAvoidance?.pitEntryBottlenecks?.find(x=>x.id==='r5b3-driver-0');
 assert(entry?.preEntryPartialFrames>0,
  'Seed 2 must demonstrate real partial pit-side steering before entering pit lane');
 const initial=entry.firstRequested;
 assert(initial?.pit==='TRACK'&&Number.isFinite(initial.lateralMeters)&&
  Number.isFinite(initial.commandedLaneTarget)&&initial.commandedLaneTarget<initial.lateralMeters,
  'Seed 2 must show accepted early physical pit-side target');
 report.earlyPitIntent={driver:entry.id,preEntryPartialFrames:entry.preEntryPartialFrames,
  firstTarget:initial.commandedLaneTarget,firstLateral:initial.lateralMeters};
}
fs.mkdirSync('artifacts',{recursive:true});
const output='artifacts/f1-v12-r5b44-wave-seed'+seed+'.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,artifact:output}));
