// R5-b56: explain real Majoku 10-lap overtakes using the 500ms-confirmed
// physical pass ledger and accepted 5-second leader snapshots.
// No race-state intervention; no other tracks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const summary=JSON.parse(fs.readFileSync('artifacts/r5-b49-majoku/summary.json','utf8'));
const pace=JSON.parse(fs.readFileSync('artifacts/r5-b51-majoku/paired-pace.json','utf8'));
const strategy=JSON.parse(fs.readFileSync('artifacts/r5-b53-majoku/paired-strategy.json','utf8'));
const three=JSON.parse(fs.readFileSync('artifacts/r5-b53-majoku/three-arm-attribution.json','utf8'));
for(const x of [summary,pace,strategy,three])assert.equal(x.status,'PASS');
assert.equal(summary.cases.length,2);
const cases=[];
for(const original of summary.cases){
 const seed=original.seed;
 const p=pace.pairs.find(x=>x.seed===seed),s=strategy.pairs.find(x=>x.seed===seed);
 assert(p&&s,'Matched Majoku seed not found');
 const arms=[
  ['NATURAL',original.outcomeFile],
  ['EQUAL_PACE_75',p.sourceFiles.equalPace],
  ['EQUAL_STRATEGY_BALANCED',s.sourceFiles.allBalanced]
 ];
 for(const [scenario,file] of arms){
  const race=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(race.status,'PASS');
  assert.equal(race.track,'majoku-ring-v1');
  assert.equal(race.seedId,String(seed));
  assert.equal(race.profileScenario,scenario);
  assert.equal(race.laps,10);assert.equal(race.mode,'NORMAL');
  assert.equal(race.finishedRows?.length,12);
  assert.equal(race.physics.collisionStops,0);assert.deepEqual(race.physics.invalid,[]);
  assert.deepEqual(race.continuityErrors,[]);
  const passes=race.physics.passEvents,comp=race.acceptedCompetition;
  assert(Array.isArray(passes)&&Array.isArray(comp?.samples),'Require complete real 20ms/5sec evidence');
  assert.equal(passes.length,race.physics.passes);
  assert.equal(comp.confirmedPasses,passes.length);
  assert.equal(comp.collisionStops,0);assert.equal(comp.invalidSteps,0);
  assert(comp.samples.length>20,'Actual 5-second history missing');
  assert.equal(comp.leaderChanges>=0,true);
  const known=new Set(race.finishedRows.map(row=>String(row.id)));
  const pairCounts=new Map(),attacks=new Map(),lapBuckets=Array(10).fill(0);
  const changes=new Map();
  let reversalCount=0,leadingInvolvementEstimate=0;
  for(const event of passes){
   assert(known.has(event.front)&&known.has(event.passed),'Unknown physical passing driver');
   assert(event.front!==event.passed&&Number.isFinite(event.t)&&event.t>=0);
   assert(event.t<=race.simulatedSeconds+1,'Pass occurred outside accepted race');
   const key=[event.front,event.passed].sort().join('|');
   const previous=changes.get(key);
   if(previous&&previous.front!==event.front)reversalCount++;
   changes.set(key,event);
   pairCounts.set(key,(pairCounts.get(key)||0)+1);
   attacks.set(event.front,(attacks.get(event.front)||0)+1);
   // Passes happen at their genuine crossing time. Nearest older 5s snapshot
   // only estimates the leaderboard, it does not certify 1st-place passing.
   const older=comp.samples.filter(x=>x.simMs<=event.t*1000).at(-1)||comp.samples[0];
   if(older&&[older.leader,older.second].some(id=>id===event.front||id===event.passed))
    leadingInvolvementEstimate++;
   // Estimate full lap from the driver's previous accepted sample.
   const progress=older?.vehicles?.find(v=>v.id===event.front)?.raceProgress;
   if(Number.isFinite(progress)){
    const lap=Math.min(9,Math.max(0,Math.floor(progress)));
    lapBuckets[lap]++;
   }
  }
  const gaps=comp.samples.map(x=>Number(x.leaderToP2Meters)).filter(Number.isFinite);
  const over100=comp.samples.filter(x=>Number(x.leaderToP2Meters)>100);
  let maxStreak=0,run=0;
  for(const sample of comp.samples){
   if(Number(sample.leaderToP2Meters)>100){run++;maxStreak=Math.max(maxStreak,run);}
   else run=0;
  }
  const confirmedVsRaw=passes.length<=race.physics.rawCrossings;
  assert(confirmedVsRaw,'Confirmed passes exceed raw physical crossings');
  const result={seed,scenario,track:'majoku-ring-v1',fullTenLap:true,
   confirmedPhysicalPasses:passes.length,rawPhysicalCrossings:race.physics.rawCrossings,
   uniquePassingDrivers:attacks.size,uniquePassingPairs:pairCounts.size,
   reversePassEvents:reversalCount,
   twoWayPassingPairs:[...pairCounts.keys()].filter(key=>{
    const members=key.split('|');
    return passes.some(p=>p.front===members[0]&&p.passed===members[1])&&
     passes.some(p=>p.front===members[1]&&p.passed===members[0]);
   }).length,
   sampledLeadChanges:comp.samples.slice(1).filter((sample,i)=>
    sample.leader!==comp.samples[i].leader).length,
   committedLeadChanges:comp.leaderChanges,
   rankReordersIncludingPitAndFinish:comp.rankReorders,
   trafficConstrainedSteps:comp.trafficConstrainedSteps,
   aiModeSteps:comp.aiModeSteps,
   leaderGap:{observedSamples:gaps.length,over100mSamples:over100.length,
    maxOver100mSampleStreak:maxStreak,
    peakSampleMeters:gaps.length?Math.max(...gaps):null},
   leaderInvolvementNearby5sSample:leadingInvolvementEstimate,
   estimatedPassCountsByPriorSampleLap:lapBuckets,
   passingDrivers:[...attacks.entries()].map(([id,count])=>({id,count})),
   passingPairs:[...pairCounts.entries()].map(([ids,count])=>({ids,count})),
   sourceFile:file,
   caveats:['Leader involvement is based on nearest prior 5-second observation, not exact 20ms leader rank',
    'Pass lap is estimated from prior 5-second sampled progress',
    'Rank reorder is not equivalent to on-track passing']};
  assert(result.sampledLeadChanges<=result.committedLeadChanges);
  cases.push(result);
  console.log(JSON.stringify({phase:'R5-b56',status:'CASE_PASS',
   seed,scenario,passes:passes.length,
   actualLeadChanges:comp.leaderChanges,peakGapMeters:result.leaderGap.peakSampleMeters}));
 }
}
assert.equal(cases.length,6);
const report={phase:'R5-b56',status:'PASS',scope:'Six authentic Majoku-only NORMAL 10-lap Chromium races',
 completedRaces:cases.length,cases,
 assessment:'Real crossing and leader-ledger evidence only; no balance tuning performed'};
const output='artifacts/r5-b53-majoku/pass-anatomy.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:'R5-b56',status:'PASS',completedRaces:cases.length,artifact:output}));
