// R5-b46 - trace genuine 5-second physical leader separation by starting
// profile. Read-only evidence, not a speed/rank/traffic correction.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source='artifacts/f1-v12-r5-balance.json';
const input=JSON.parse(fs.readFileSync(source,'utf8'));
assert.equal(input.sum?.observationOnly,true,'Only actual short SVG physics is analyzed');
assert.equal(input.results?.length,28,'Require 7 SVG circuits x 2 modes x 2 seeds');
const median=a=>{
 const b=[...a].sort((x,y)=>x-y),n=b.length;
 return n?(b[Math.floor((n-1)/2)]+b[Math.floor(n/2)])/2:null;
};
const cases=input.results.map(run=>{
 const samples=run.sampleTrace||[];
 assert(samples.length>=12,'Expected 5-second accepted physics samples');
 assert.equal(samples[0].vehicles.length,12,'Missing 12-car opening grid');
 const pairs=samples.map((s,i)=>{
  assert(Number.isFinite(s.simMs)&&Number.isFinite(s.gapMeters)&&s.gapMeters>=0,
   'Invalid accepted leader gap');
  if(i)assert(s.simMs>samples[i-1].simMs,'Nonmonotonic sampled physics clock');
  assert.equal(s.vehicles.length,12,'Missing physical race grid');
  assert.equal(s.vehicles[0].id,s.leader,'Leader mismatch in accepted sample');
  assert.equal(s.vehicles[1].id,s.second,'Second driver mismatch');
  return {t:s.simMs/1000,gap:s.gapMeters,leader:s.leader,
   p2:s.second,leaderKph:s.vehicles[0].speedKph,p2Kph:s.vehicles[1].speedKph,
   leaderPace:s.vehicles[0].pace,p2Pace:s.vehicles[1].pace};
 });
 const first100=pairs.find(s=>s.gap>100)||null;
 const last=pairs.at(-1);
 assert(Math.abs(last.gap-run.lastSampleGapMeters)<1e-7,
  'Source last physical gap and sampled gap differ');
 const window=(lo,hi)=>{
  const observed=pairs.filter(p=>p.t>=lo&&p.t<hi);
  const gaps=observed.map(p=>p.gap);
  return {samples:observed.length,medianGapMeters:median(gaps),
   gapGrowthMeters:observed.length>1?observed.at(-1).gap-observed[0].gap:null,
   meanSpeedDifferenceKph:observed.length?observed.reduce((s,x)=>
    s+x.leaderKph-x.p2Kph,0)/observed.length:null};
 };
 return {track:run.track,mode:run.mode,seed:run.seed,profile:run.profile,
  openingLeader:run.openingLeader,endingLeader:run.endingLeader,
  originalLeaderHeld:run.openingLeader===run.endingLeader,
  openingGapMeters:pairs[0].gap,endingGapMeters:last.gap,
  firstOver100Seconds:first100?.t??null,over100:last.gap>100,
  confirmedPasses:run.confirmedPasses,leaderChanges:run.leaderChanges,
  meanLeaderPace:median(pairs.map(p=>p.leaderPace)),
  meanSecondPace:median(pairs.map(p=>p.p2Pace)),
  windows:{start:window(0,30),middle:window(30,60),late:window(60,91)}};
});
const group=rows=>({scenarios:rows.length,
 over100:rows.filter(x=>x.over100).length,
 held:rows.filter(x=>x.originalLeaderHeld).length,
 passes:rows.reduce((s,x)=>s+x.confirmedPasses,0),
 leaderChanges:rows.reduce((s,x)=>s+x.leaderChanges,0),
 medianFinalGapMeters:median(rows.map(x=>x.endingGapMeters)),
 firstOver100MedianSeconds:median(rows.filter(x=>x.firstOver100Seconds!==null)
  .map(x=>x.firstOver100Seconds))});
const bySeed=Object.fromEntries([0,1].map(seed=>
 [seed,group(cases.filter(x=>x.seed===seed))]));
const byTrack=Object.fromEntries([...new Set(cases.map(x=>x.track))]
 .map(track=>[track,group(cases.filter(x=>x.track===track))]));
const totals=group(cases);
assert.equal(totals.passes,input.sum.totalPasses,'Physical passes inconsistent');
assert.equal(totals.leaderChanges,input.sum.totalLeaderChanges,'Lead changes inconsistent');
assert.equal(totals.over100,input.sum.largeLeadScenarios,'Lead-gap count inconsistent');
assert.equal(totals.held,input.sum.originalLeaderStillFirst,'Lead retention inconsistent');
assert.equal(bySeed[0].scenarios,14);
assert.equal(bySeed[1].scenarios,14);
assert.equal(bySeed[0].over100+bySeed[1].over100,totals.over100);
const report={phase:'R5-b46',status:'PASS',source,totals,bySeed,byTrack,
 criticalScenarios:cases.filter(x=>x.over100)
  .sort((a,b)=>b.endingGapMeters-a.endingGapMeters),
 interpretation:'Real 90-second physical samples only, not a claim that pace, tyre or ERS caused gap growth',
 caveats:['Seed 0 uses equal initial driver pace; seed 1 uses strong pole profile',
  'Pit lifecycle is stubbed in this simulation','A >100m gap is a diagnostic threshold, not proof of unfair racing']};
fs.mkdirSync('artifacts',{recursive:true});
const output='artifacts/f1-v12-r5b46-lead-gap-causes.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:report.phase,status:report.status,totals,bySeed,
 worst:report.criticalScenarios.slice(0,4).map(x=>
 ({track:x.track,mode:x.mode,seed:x.seed,meters:x.endingGapMeters,
 firstOver100Seconds:x.firstOver100Seconds})),artifact:output}));
