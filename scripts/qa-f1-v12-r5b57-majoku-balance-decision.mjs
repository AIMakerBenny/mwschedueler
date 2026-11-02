// R5-b57: traceable decision memo, not an automatic race balance fix.
// Read all six confirmed 12-car 10-lap Majoku races before suggesting a
// candidate mechanism. Never infer generalized fairness from two seeds.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const comparison=read('artifacts/r5-b53-majoku/three-arm-attribution.json');
const passes=read('artifacts/r5-b53-majoku/pass-anatomy.json');
const causes=read('artifacts/r5-b49-majoku/cause-audit.json');
for(const r of [comparison,passes,causes])assert.equal(r.status,'PASS');
assert.equal(comparison.cases.length,2);assert.equal(passes.cases.length,6);
assert.equal(causes.completeTenLapRaces,2);
assert.equal(comparison.aggregate.completedRaces,6);
const seeds=[1,2];
const summary=[];
for(const seed of seeds){
 const row=comparison.cases.find(r=>r.seed===seed),
  p=passes.cases.filter(r=>r.seed===seed),
  c=causes.cases.find(r=>r.seed===seed);
 assert(row&&c&&p.length===3,'Seed evidence missing');
 const byName=Object.fromEntries(p.map(r=>[r.scenario,r]));
 const scenarios=['NATURAL','EQUAL_PACE_75','EQUAL_STRATEGY_BALANCED'];
 assert.deepEqual(p.map(r=>r.scenario),scenarios);
 const natural=byName.NATURAL,pace=byName.EQUAL_PACE_75,style=byName.EQUAL_STRATEGY_BALANCED;
 assert.equal(natural.confirmedPhysicalPasses,row.arms[0].passes);
 assert.equal(pace.confirmedPhysicalPasses,row.arms[1].passes);
 assert.equal(style.confirmedPhysicalPasses,row.arms[2].passes);
 for(const x of p){
  assert.equal(x.track,'majoku-ring-v1');
  assert(x.leaderGap.observedSamples>=20);
  assert(x.leaderGap.peakSampleMeters>=0);
  assert(x.confirmedPhysicalPasses>=0);
  assert(x.committedLeadChanges>=0);
  assert(x.uniquePassingDrivers<=12);
 }
 assert.equal(c.recordedConfirmedPasses,natural.confirmedPhysicalPasses);
 const delta=(exp,base)=>Number((exp-base).toFixed(3));
 summary.push({
  seed,
  baseline:{frontGapSeconds:row.arms[0].frontGapSeconds,
   leadChanges:natural.committedLeadChanges,
   confirmedPasses:natural.confirmedPhysicalPasses,
   uniquePassingPairs:natural.uniquePassingPairs,
   peakSampleLeadGapMeters:natural.leaderGap.peakSampleMeters,
   peakConsecutive100mSampleWindows:natural.leaderGap.maxOver100mSampleStreak},
  equalPaceOnly:{
   frontGapSecondsDelta:delta(row.arms[1].frontGapSeconds,row.arms[0].frontGapSeconds),
   leadChangesDelta:pace.committedLeadChanges-natural.committedLeadChanges,
   confirmedPassesDelta:pace.confirmedPhysicalPasses-natural.confirmedPhysicalPasses,
   peakLeadGapMetersDelta:delta(pace.leaderGap.peakSampleMeters,natural.leaderGap.peakSampleMeters),
   winnerChanged:row.paceVsNatural.winnerChanged},
  equalStrategyOnly:{
   frontGapSecondsDelta:delta(row.arms[2].frontGapSeconds,row.arms[0].frontGapSeconds),
   leadChangesDelta:style.committedLeadChanges-natural.committedLeadChanges,
   confirmedPassesDelta:style.confirmedPhysicalPasses-natural.confirmedPhysicalPasses,
   peakLeadGapMetersDelta:delta(style.leaderGap.peakSampleMeters,natural.leaderGap.peakSampleMeters),
   winnerChanged:row.strategyVsNatural.winnerChanged}
 });
}
const arms=['equalPaceOnly','equalStrategyOnly'];
const signals=arms.map(arm=>{
 const values=summary.map(s=>s[arm].frontGapSecondsDelta);
 const lead=summary.map(s=>s[arm].leadChangesDelta);
 const pass=summary.map(s=>s[arm].confirmedPassesDelta);
 return {arm,seedCount:values.length,frontGapChangeSecondsBySeed:values,
  leadsChangeBySeed:lead,confirmedPassesChangeBySeed:pass,
  reducedWinnerGapBothSeeds:values.every(v=>v<0),
  increasedLeaderChangesBothSeeds:lead.every(v=>v>0),
  increasedConfirmedPassesBothSeeds:pass.every(v=>v>0),
  consistentAcrossOnlyTwoSeeds:values.every(v=>v<0)||values.every(v=>v>0)};
});
const candidates=signals.filter(s=>s.reducedWinnerGapBothSeeds);
const nextProbe=candidates.length===1?
 'Expand fixed seeds and grid swaps for '+candidates[0].arm+' before any live engine adjustment':
 candidates.length===2?
 'Both tested factors correlate with smaller winner gaps: expand seeds and factorial controls before tuning':
 'The two seeded matches do not identify a consistent winner-gap mechanism: widen seeds and isolate grid/traffic effects';
const result={phase:'R5-b57',status:'PASS',integrityPassed:true,
 balanceCertified:false,track:'majoku-ring-v1',
 experimentalRaces:6,matchedSeeds:seeds,
 comparison:summary,signals,nextProbe,
 safeguards:['No public track other than Majoku Ring may be released',
  'No actual code, tyre, ERS, collision, ranking, special, or pit dynamics changed',
  'A reduced winner gap alone cannot establish better passing, balance or fun',
  'Never infer a population causal effect from two deterministic seeds',
  'No automatic engine tuning from this evidence']};
const output='artifacts/r5-b53-majoku/balance-decision.json';
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:result.phase,status:result.status,
 evidenceQuality:'TWO_MATCHED_SEEDS_NOT_BALANCE_CERTIFIED',
 nextProbe,signals,artifact:output}));
