// R5-b54: three-arm (natural, pace-only, strategy-only) Majoku diagnosis.
// Uses completed real 12-car 10-lap races. Records differences without
// inventing winners, forcing ranks, or changing public race simulation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const b49=JSON.parse(fs.readFileSync('artifacts/r5-b49-majoku/summary.json','utf8'));
const b50=JSON.parse(fs.readFileSync('artifacts/r5-b49-majoku/cause-audit.json','utf8'));
const b51=JSON.parse(fs.readFileSync('artifacts/r5-b51-majoku/paired-pace.json','utf8'));
const b53=JSON.parse(fs.readFileSync('artifacts/r5-b53-majoku/paired-strategy.json','utf8'));
for(const report of [b49,b50,b51,b53])assert.equal(report.status,'PASS','Source evidence not passed');
assert.equal(b49.cases.length,2);assert.equal(b50.cases.length,2);
assert.equal(b51.pairs.length,2);assert.equal(b53.pairs.length,2);
const bySeed=(list,key)=>new Map(list.map(x=>[x[key],x]));
const b=bySeed(b49.cases,'seed'),o=bySeed(b50.cases,'seed'),
 p=bySeed(b51.pairs,'seed'),s=bySeed(b53.pairs,'seed');
const readRun=filename=>JSON.parse(fs.readFileSync(filename,'utf8'));
const cases=[];
for(const seed of [1,2]){
 const base=b.get(seed),observed=o.get(seed),pace=p.get(seed),strategy=s.get(seed);
 assert(base&&observed&&pace&&strategy,'Three-way seeded counterpart missing');
 assert.equal(base.track,'majoku-ring-v1');assert.equal(pace.gridSame,true);
 assert.equal(strategy.startingGridSame,true);
 assert.equal(strategy.driverAbilitiesSame,true);
 assert.equal(strategy.startingTyresSame,true);
 assert.equal(base.winnerId,pace.baseline.winner);
 assert.equal(base.winnerId,strategy.baseline.winner);
 assert.equal(base.firstToSecondFinishGapSeconds,pace.baseline.frontGapSeconds);
 assert.equal(base.firstToSecondFinishGapSeconds,strategy.baseline.frontGapSeconds);
 assert.equal(base.passes,pace.baseline.passes);
 assert.equal(base.passes,strategy.baseline.confirmedPasses);
 const actual=readRun(base.outcomeFile);
 const equalPace=readRun(pace.sourceFiles.equalPace);
 const equalStrategy=readRun(strategy.sourceFiles.allBalanced);
 for(const r of [actual,equalPace,equalStrategy]){
  assert.equal(r.status,'PASS');assert.equal(r.track,'majoku-ring-v1');
  assert.equal(r.mode,'NORMAL');assert.equal(r.laps,10);
  assert.equal(r.finishedRows?.length,12);
  assert(r.finishedRows.every(x=>x.lapTimesMs?.length===10&&x.finishMs>0));
  assert.equal(r.physics?.collisionStops,0);
  assert.deepEqual(r.physics?.invalid,[]);
  assert.deepEqual(r.continuityErrors,[]);
  assert.equal(r.setupCreatedAt,actual.setupCreatedAt);
  assert.deepEqual(r.initialOrder,actual.initialOrder);
  assert.deepEqual(r.startingCompounds,actual.startingCompounds);
 }
 assert.deepEqual(equalPace.originalProfiles,actual.originalProfiles);
 assert.deepEqual(equalStrategy.originalProfiles,actual.originalProfiles);
 assert.deepEqual(equalStrategy.appliedProfiles,actual.appliedProfiles);
 assert.deepEqual(equalStrategy.originalStrategies,actual.originalStrategies);
 const fields=[
  {name:'natural',winner:base.winnerId,frontGapSeconds:base.firstToSecondFinishGapSeconds,
   finishSpreadSeconds:base.finishSpreadSeconds,passes:base.passes,
   pitStops:base.completedPitStops},
  {name:'equalPace75',winner:pace.equalPace.winner,
   frontGapSeconds:pace.equalPace.frontGapSeconds,
   finishSpreadSeconds:pace.equalPace.finishSpreadSeconds,
   passes:pace.equalPace.passes,pitStops:pace.equalPace.pitStops},
  {name:'allBalancedStrategy',winner:strategy.allBalanced.winner,
   frontGapSeconds:strategy.allBalanced.frontGapSeconds,
   finishSpreadSeconds:strategy.allBalanced.finishSpreadSeconds,
   passes:strategy.allBalanced.confirmedPasses,pitStops:strategy.allBalanced.pitStops}
 ];
 const change=arm=>({
  frontGapSeconds:arm.frontGapSeconds-fields[0].frontGapSeconds,
  finishSpreadSeconds:arm.finishSpreadSeconds-fields[0].finishSpreadSeconds,
  passes:arm.passes-fields[0].passes,
  pitStops:arm.pitStops-fields[0].pitStops,
  winnerChanged:arm.winner!==fields[0].winner
 });
 cases.push({seed,physicalTenLapRaces:3,entrants:12,profileExperimentalChange:'pace only to 75',
  strategyExperimentalChange:'style only to BALANCED after first accepted step',
  arms:fields,paceVsNatural:change(fields[1]),
  strategyVsNatural:change(fields[2]),
  observational:{firstOver100Seconds:observed.firstOver100Seconds,
   peakGapMeters:observed.peakGapMeters,
   observedLeadChanges:observed.observedLeadChanges},
  notes:['Front gap differences include genuine tyre, traffic, pit and random downstream effects',
   'A lower finish gap alone does not prove better overtaking or game balance']});
}
const aggregate={
 completedRaces:6,matchedSeeds:2,entrantsPerRace:12,lapsPerRace:10,
 totalConfirmedPasses:Object.fromEntries(['natural','equalPace75','allBalancedStrategy'].map((name,index)=>[
  name,cases.reduce((n,c)=>n+c.arms[index].passes,0)])),
 gapsSecondsByArm:Object.fromEntries(['natural','equalPace75','allBalancedStrategy'].map((name,index)=>[
  name,cases.map(c=>c.arms[index].frontGapSeconds)])),
 winnerChanges:{pace:cases.filter(c=>c.paceVsNatural.winnerChanged).length,
  strategy:cases.filter(c=>c.strategyVsNatural.winnerChanged).length},
 zeroPhysicalCollisionStops:true,
 evidenceLevel:'Fixed-seed two-match comparative experiment, not a general causal or fun guarantee'
};
const output='artifacts/r5-b53-majoku/three-arm-attribution.json';
const report={phase:'R5-b54',status:'PASS',track:'majoku-ring-v1',
 aggregate,cases,nextDecision:'Interpret measured deltas before changing core physics; if effects are ambiguous, expand Majoku seeds.',
 otherTracks:'All six WIP tracks remain inaccessible in the public game'};
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:'R5-b54',status:'PASS',aggregate,artifact:output}));
