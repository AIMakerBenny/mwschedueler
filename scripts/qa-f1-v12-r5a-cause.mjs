// R5-a observational cause audit. Analysis only; never changes the live solver.
// Reads R5 real-SVG accepted-step observations, not official race/pit results.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const input=process.env.MWS_R5A_INPUT||'artifacts/f1-v12-r5-balance.json';
const output=process.env.MWS_R5A_OUTPUT||'artifacts/f1-v12-r5a-cause.json';
const report=JSON.parse(fs.readFileSync(input,'utf8'));
assert(Array.isArray(report.results)&&report.results.length>0,'R5 scenarios missing');
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const median=a=>{if(!a.length)return null;const b=[...a].sort((x,y)=>x-y);return (b[Math.floor((b.length-1)/2)]+b[Math.floor(b.length/2)])/2;};
const round=v=>v===null?null:Math.round(v*100)/100;
const group=rows=>({
 scenarios:rows.length,
 originalLeaderHeld:rows.filter(r=>r.openingLeader===r.endingLeader).length,
 gapsOver100m:rows.filter(r=>r.lastSampleGapMeters>100).length,
 averageGapMeters:round(mean(rows.map(r=>r.lastSampleGapMeters))),
 medianGapMeters:round(median(rows.map(r=>r.lastSampleGapMeters))),
 totalConfirmedPasses:rows.reduce((s,r)=>s+r.confirmedPasses,0),
 totalLeaderChanges:rows.reduce((s,r)=>s+r.leaderChanges,0),
 totalTrafficConstrainedSteps:rows.reduce((s,r)=>s+r.trafficConstrainedSteps,0),
 totalBoosts:rows.reduce((s,r)=>s+r.boosts,0)
});
const scenarios=report.results.map(r=>{
 const trace=r.sampleTrace;
 assert(Array.isArray(trace)&&trace.length>=2,r.track+' missing accepted 5s trace');
 let previous=-Infinity;
 for(const t of trace){
  assert(t.simMs>previous&&Number.isFinite(t.gapMeters),'Nonmonotonic trace');
  previous=t.simMs;
  assert.equal(t.vehicles.length,12,'Missing vehicle telemetry');
  assert.equal(t.vehicles[0].id,t.leader,'Leader not first in sample');
 }
 const first=trace[0],last=trace.at(-1),early=trace.filter(x=>x.simMs<=30000),
  middle=trace.filter(x=>x.simMs>30000&&x.simMs<=60000),
  later=trace.filter(x=>x.simMs>60000);
 const initialPole=first.vehicles.find(x=>x.id===r.openingLeader);
 const initialSecond=first.vehicles.find(x=>x.rank===2);
 const lastLeader=last.vehicles[0],lastSecond=last.vehicles[1];
 const threshold=trace.find(x=>x.gapMeters>100);
 const frontPair=trace.map(t=>({a:t.vehicles[0],b:t.vehicles[1]}));
 const windowSummary=arr=>{
  if(!arr.length)return null;
  return {samples:arr.length,gapStartMeters:round(arr[0].gapMeters),gapEndMeters:round(arr.at(-1).gapMeters),
   meanLeaderSpeedKph:round(mean(arr.map(t=>t.vehicles[0].speedKph))),
   meanP2SpeedKph:round(mean(arr.map(t=>t.vehicles[1].speedKph))),
   meanLeaderErsRequestKW:round(mean(arr.map(t=>t.vehicles[0].ersRequestKW))),
   meanP2ErsRequestKW:round(mean(arr.map(t=>t.vehicles[1].ersRequestKW)))};
 };
 const pitStates=[...new Set(trace.flatMap(t=>t.vehicles.map(v=>v.pit)))].sort();
 return {track:r.track,mode:r.mode,seed:r.seed,profile:r.profile,
  sampleCount:trace.length,firstSampleSec:round(first.simMs/1000),lastSampleSec:round(last.simMs/1000),
  initialPole:{id:initialPole.id,pace:initialPole.pace,style:initialPole.style,form:initialPole.form},
  initialP2:{id:initialSecond.id,pace:initialSecond.pace,style:initialSecond.style},
  lastLeader:{id:lastLeader.id,pace:lastLeader.pace,style:lastLeader.style,speedKph:round(lastLeader.speedKph),tyreWear:round(lastLeader.tyreWear),batteryMJ:round(lastLeader.batteryMJ)},
  lastP2:{id:lastSecond.id,pace:lastSecond.pace,style:lastSecond.style,speedKph:round(lastSecond.speedKph),tyreWear:round(lastSecond.tyreWear),batteryMJ:round(lastSecond.batteryMJ)},
  initialGapMeters:round(first.gapMeters),lastGapMeters:round(last.gapMeters),
  gapGrowthMeters:round(last.gapMeters-first.gapMeters),
  firstOver100mAtSeconds:threshold?round(threshold.simMs/1000):null,
  firstToLastGapMeters:round(last.lastGapMeters),leaderChangeEvents:r.leaderChanges,
  confirmedPasses:r.confirmedPasses,trafficConstrainedSteps:r.trafficConstrainedSteps,
  snapshots:trace.map(t=>({seconds:round(t.simMs/1000),leader:t.leader,p2:t.second,
    gapMeters:round(t.gapMeters),lastGapMeters:round(t.lastGapMeters),
    leaderSpeedKph:round(t.vehicles[0].speedKph),p2SpeedKph:round(t.vehicles[1].speedKph),
    leaderBatteryMJ:round(t.vehicles[0].batteryMJ),p2BatteryMJ:round(t.vehicles[1].batteryMJ),
    leaderTyreWear:round(t.vehicles[0].tyreWear),p2TyreWear:round(t.vehicles[1].tyreWear),
    leaderMode:t.vehicles[0].mode,p2Mode:t.vehicles[1].mode,
    confirmedPasses:t.confirmedPasses,trafficConstrainedSteps:t.trafficConstrainedSteps})),
  windows:{start30:windowSummary(early),middle30:windowSummary(middle),lateWindow:windowSummary(later)},
  observedPitStates:pitStates,firstPhysicalLapLimitCrossing:r.firstPhysicalLapLimitCrossing||null
 };
});
const bySeed=Object.fromEntries([...new Set(report.results.map(r=>r.seed))].sort().map(k=>[k,group(report.results.filter(r=>r.seed===k))]));
const byMode=Object.fromEntries([...new Set(report.results.map(r=>r.mode))].sort().map(k=>[k,group(report.results.filter(r=>r.mode===k))]));
const byTrack=Object.fromEntries([...new Set(report.results.map(r=>r.track))].sort().map(k=>[k,group(report.results.filter(r=>r.track===k))]));
const warnings=[];
if(bySeed[0]?.gapsOver100m>bySeed[0]?.scenarios/2)warnings.push('Equal-pace seed already has widespread early lead separation; strong pole alone is insufficient as explanation.');
if(scenarios.every(r=>r.observedPitStates.every(x=>x==='TRACK')))warnings.push('Pit telemetry is fixture-only; no integrated pit or pit strategy verified.');
if(report.results.some(r=>r.mode==='NORMAL'&&r.maximumProgress<r.laps))warnings.push('At least one NORMAL case has not reached its full race lap target.');
const result={version:'v1.2-R5-a',sourceVersion:report.version,observational:true,
 physics:'unchanged v1.1 unified engine',coverage:group(report.results),bySeed,byMode,byTrack,
 warnings,limitations:['Position changes and 5-second speed/ERS/tyre samples show correlation, not isolated causal effects.',
 'Requested ERS power is not necessarily delivered ERS energy.',
 'A first physical lap-threshold crossing is not an official race finish or final classification.',
 'The isolated fixture still stubs requestPitStopV205, pit control and UI integration.'],
 scenarios};
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2));
assert.equal(result.coverage.scenarios,report.results.length);
assert.equal(result.coverage.totalConfirmedPasses,report.sum.totalPasses);
assert(scenarios.every(s=>s.lastGapMeters>=0&&s.initialGapMeters>=0));
console.log(JSON.stringify({status:'PASS',version:result.version,source:input,
 coverage:result.coverage,bySeed,byMode,warnings,output},null,2));
