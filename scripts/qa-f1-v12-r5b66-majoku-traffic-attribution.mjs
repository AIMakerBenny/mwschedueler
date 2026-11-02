// R5-b66 - actual accepted per-driver traffic constrained commands over
// first 85s, not speculative "traffic caused the gap" claims.
// Uses unmodified live unified engine via R5-b59 Majoku-only SVG fixtures.
// Does not tune, alter positions, unlock WIP tracks, or reassign drivers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b59-majoku/';
const files=['natural.json','equal_pace_75.json','balanced_strategy.json'];
const scenarios=[],windowIndices=[[0,6],[6,12],[12,17]];
for(const file of files){
 const report=JSON.parse(fs.readFileSync(dir+file,'utf8'));
 assert.equal(report.sum.scenarios,4);
 assert(report.results.every(r=>r.track==='majoku-ring-v1'));
 for(const r of report.results){
  const samples=r.sampleTrace,traffic=r.trafficTimeline;
  assert.equal(samples.length,18);assert.equal(traffic.length,18);
  assert.equal(r.physical.stops,0);assert.deepEqual(r.physical.invalid,[]);
  assert.deepEqual(r.physical.overlaps,[]);assert.deepEqual(r.physical.continuity,[]);
  for(let i=0;i<18;i++){
   assert.equal(samples[i].simMs,traffic[i].simMs);
   assert.equal(samples[i].trafficConstrainedSteps,traffic[i].total);
   const count=Object.values(traffic[i].byDriver).reduce((a,b)=>a+b,0);
   assert.equal(count,traffic[i].total);
   if(i>0)assert(traffic[i].total>=traffic[i-1].total);
  }
  const periods=windowIndices.map(([start,end])=>{
   const before=samples[start],after=samples[end];
   const beforeTrace=traffic[start],afterTrace=traffic[end];
   const leaders=[before.leader,before.second];
   const delta=id=>Number(afterTrace.byDriver[id]||0)-Number(beforeTrace.byDriver[id]||0);
   const leaderBrake=delta(leaders[0]),p2Brake=delta(leaders[1]);
   const total=afterTrace.total-beforeTrace.total;
   const otherBrake=total-leaderBrake-p2Brake;
   assert(leaderBrake>=0&&p2Brake>=0&&otherBrake>=0);
   return {startSeconds:before.simMs/1000,endSeconds:after.simMs/1000,
    leaderAtStart:leaders[0],secondAtStart:leaders[1],
    leaderChanged:after.leader!==before.leader,
    leadGapStartMeters:before.gapMeters,leadGapEndMeters:after.gapMeters,
    leadGapDeltaMeters:after.gapMeters-before.gapMeters,
    totalTrafficLimitedAcceptedCarSteps:total,
    startLeaderTrafficLimitedSteps:leaderBrake,
    startSecondTrafficLimitedSteps:p2Brake,
    otherTenDriversTrafficLimitedSteps:otherBrake,
    startLeaderDriveMode:before.vehicles[0].mode,
    startSecondDriveMode:before.vehicles[1].mode,
    evidenceType:'Committed traffic brake commands by vehicle, not cause of the gap'};
  });
  const example={
   track:r.track,mode:r.mode,seed:r.seed,variant:r.variant,
   actualSeconds:r.seconds,completedRace:false,
   gridGapMeters:r.initialGapMeters,
   confirmedPhysicalPasses:r.confirmedPasses,
   acceptedLeadReorders:r.leaderChanges,
   first85sTrafficConstrainedAcceptedCarSteps:traffic.at(-1).total,
   periods
  };
  scenarios.push(example);
  console.log(JSON.stringify({phase:'R5-b66',status:'CASE_PASS',mode:r.mode,seed:r.seed,
   variant:r.variant,passes:r.confirmedPasses,
   totalTrafficSteps:example.first85sTrafficConstrainedAcceptedCarSteps}));
 }
}
assert.equal(scenarios.length,12);
assert(scenarios.every(x=>x.track==='majoku-ring-v1'&&x.actualSeconds===90));
const select=(variant,mode,seed)=>scenarios.find(x=>x.variant===variant&&x.mode===mode&&x.seed===seed);
const contrasts=[];
for(const mode of ['FAST','NORMAL'])for(const seed of [0,1]){
 const natural=select('NATURAL',mode,seed);
 const pace=select('EQUAL_PACE_75',mode,seed);
 const strategy=select('BALANCED_STRATEGY',mode,seed);
 assert(natural&&pace&&strategy);
 const compare=r=>({
  gapDifferenceMeters:r.periods.at(-1).leadGapEndMeters-natural.periods.at(-1).leadGapEndMeters,
  totalTrafficStepDifference:r.first85sTrafficConstrainedAcceptedCarSteps-natural.first85sTrafficConstrainedAcceptedCarSteps,
  physicalPassDifference:r.confirmedPhysicalPasses-natural.confirmedPhysicalPasses
 });
 if(seed===0){
  assert.equal(compare(pace).gapDifferenceMeters,0);
  assert.equal(compare(pace).totalTrafficStepDifference,0);
 }
 contrasts.push({mode,seed,natural:natural.periods,
  equalPaceVsNatural:compare(pace),balancedVsNatural:compare(strategy)});
}
const out={phase:'R5-b66',status:'PASS',track:'majoku-ring-v1',
 scenarios:scenarios.length,windowSeconds:90,observedLatestSeconds:85.02,
 actualFullTenLap:false,physicalDynamicsUnchanged:true,
 cases:scenarios,contrasts,
 limitations:['Short physics fixture places vehicles 9m apart, unlike real 10-lap starting grid',
  'A constrained car-step cannot prove the next rank or gap was caused by overbraking',
  'Mode FAST/NORMAL changes effective race strategy phase, not physics laws',
  'No other circuit was tested or unlocked']};
const output=dir+'traffic-attribution.json';
fs.writeFileSync(output,JSON.stringify(out,null,2));
console.log(JSON.stringify({phase:'R5-b66',status:'PASS',scenarios:scenarios.length,
 matchedContrasts:contrasts.length,artifact:output}));
