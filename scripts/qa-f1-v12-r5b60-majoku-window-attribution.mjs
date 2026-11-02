// R5-b60: read-only diagnostic synthesis of genuine 90-second accepted
// Majoku physics windows. No winner/position/time forcing, no WIP circuits.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const folder='artifacts/r5-b59-majoku';
const input=JSON.parse(fs.readFileSync(folder+'/summary.json','utf8'));
assert.equal(input.status,'PASS');
assert.equal(input.track,'majoku-ring-v1');
assert.equal(input.matchedConditions,4);
assert.equal(input.completeRace,false,'90s observation must never be called a completed race');
const cases=[];
for(const p of input.pairs){
 const variants={natural:p.natural,equalPace:p.equalPace,equalStrategy:p.equalStrategy};
 assert(['NORMAL','FAST'].includes(p.mode)&&[0,1].includes(p.seed));
 for(const v of Object.values(variants)){
  assert(v.passes>=0&&v.leadChanges>=0&&Number.isFinite(v.gapMeters)&&v.gapMeters>=0);
 }
 const delta=v=>({
  gapMeters:Number((v.gapMeters-p.natural.gapMeters).toFixed(3)),
  physicalPasses:v.passes-p.natural.passes,
  leaderChanges:v.leadChanges-p.natural.leadChanges});
 const effects={equalPace:delta(p.equalPace),equalStrategy:delta(p.equalStrategy)};
 if(p.seed===0)assert.equal(effects.equalPace.gapMeters,0,
  'Seed-zero equal-pace arm must reproduce the no-op baseline');
 cases.push({mode:p.mode,seed:p.seed,baseline:p.natural,variants,
  effects,dominantObservedGapReducer:
   effects.equalPace.gapMeters<effects.equalStrategy.gapMeters?'EQUAL_PACE':
   effects.equalStrategy.gapMeters<effects.equalPace.gapMeters?'BALANCED_STRATEGY':'TIE',
  interpretation:'Association under one fixed seed and isolated 90-second pit-stubbed physics, not verified full-race balance'});
}
assert.equal(cases.length,4);
for(const mode of ['FAST','NORMAL']){
 const values=cases.filter(c=>c.mode===mode);
 assert.deepEqual(values.map(v=>v.seed),[0,1]);
}
const normalStrongPole=cases.find(c=>c.mode==='NORMAL'&&c.seed===1);
assert(normalStrongPole);
const signals={
 normalStrongPoleEarlyGapMeters:normalStrongPole.baseline.gapMeters,
 naturalNormalStrongPolePhysicalPasses:normalStrongPole.baseline.passes,
 equalPaceNormalStrongPole:normalStrongPole.effects.equalPace,
 equalStrategyNormalStrongPole:normalStrongPole.effects.equalStrategy,
 observedGapReductionFromPace:normalStrongPole.effects.equalPace.gapMeters<0,
 observedGapReductionFromStrategy:normalStrongPole.effects.equalStrategy.gapMeters<0,
 enoughEvidenceForLivePhysicsTuning:false
};
const report={phase:'R5-b60',status:'PASS',track:'majoku-ring-v1',
 acceptedWindows:12,seededComparisons:4,signals,cases,
 nextStep:'Use the real 10-lap 6-race R5-b57 report before modifying the live solver; expand Majoku seeded cases if effects differ',
 restrictions:['No other six WIP circuits tested by these counterfactual runners',
  'Original seven-track catalog and all locked cards retained',
  'Do not introduce rank-based rubber banding, position warps, forced passing or collision bypass',
  'No claim of causal fairness or completed 10-lap finish from 90-second fixture']};
const output=folder+'/attribution.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:'R5-b60',status:'PASS',signals,artifact:output}));
