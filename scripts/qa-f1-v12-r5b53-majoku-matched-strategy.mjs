// R5-b53: matched 12-car 10-lap Majoku Ring strategy-only comparison.
// Intervention is applied in the test browser after the first valid 20ms
// solver frame. No driver rating, start grid, physical lane, pit rule, energy,
// collision guard, position, or race result is externally forced.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const base=JSON.parse(fs.readFileSync('artifacts/r5-b49-majoku/summary.json','utf8'));
assert.equal(base.status,'PASS');
assert.deepEqual(base.cases.map(x=>x.seed),[1,2]);
const dir='artifacts/r5-b53-majoku';
fs.mkdirSync(dir,{recursive:true});
const pairs=[];
for(const [index,baselineCase] of base.cases.entries()){
 const seed=baselineCase.seed,output=dir+'/seed'+seed+'-equal-balanced.json';
 const run=spawnSync(process.execPath,[path.join(here,'qa-f1-v12-r5b3-normal-auto-pit.mjs')],{
  encoding:'utf8',timeout:360000,maxBuffer:4*1024*1024,
  env:{...process.env,MWS_R5B3_TRACK:'majoku-ring-v1',MWS_R5B3_SEED:String(seed),
   MWS_R5B3_PORT:String(8970+index),MWS_R5B3_OUTPUT:output,
   MWS_R5B3_PROFILE_SCENARIO:'EQUAL_STRATEGY_BALANCED'}
 });
 for(const line of String(run.stdout||'').split('\n').filter(x=>x.includes('R5-b3')||x.includes('"status":"PASS"')).slice(-4))console.log(line);
 if(run.error||run.status!==0||!fs.existsSync(output))
  throw Error('Majoku matched strategy seed '+seed+' failed: '+String(run.error||run.stderr||run.stdout).slice(-4000));
 const baseline=JSON.parse(fs.readFileSync(baselineCase.outcomeFile,'utf8'));
 const experiment=JSON.parse(fs.readFileSync(output,'utf8'));
 assert.equal(baseline.status,'PASS');assert.equal(experiment.status,'PASS');
 assert.equal(baseline.track,'majoku-ring-v1');
 assert.equal(experiment.track,'majoku-ring-v1');
 assert.equal(experiment.profileScenario,'EQUAL_STRATEGY_BALANCED');
 assert.equal(baseline.profileScenario,'NATURAL');
 assert.equal(experiment.seedId,String(seed));
 assert.equal(experiment.seededIso,baseline.seededIso);
 assert.equal(experiment.setupCreatedAt,baseline.setupCreatedAt);
 assert.equal(experiment.mode,'NORMAL');assert.equal(experiment.laps,10);
 assert.equal(experiment.state,'FINISHING');
 assert.equal(experiment.finishedRows?.length,12);
 assert(experiment.finishedRows.every(r=>r.finishMs>0&&r.lapTimesMs?.length===10));
 assert.equal(experiment.physics?.collisionStops,0);
 assert.deepEqual(experiment.physics?.invalid,[]);
 assert.deepEqual(experiment.continuityErrors,[]);
 assert.deepEqual(experiment.initialOrder,baseline.initialOrder,'Different fixed-seed starting grid');
 assert.deepEqual(experiment.startingCompounds,baseline.startingCompounds,'Different starting tyre compounds');
 assert.deepEqual(experiment.originalProfiles,baseline.originalProfiles,'Different generated ability profiles');
 assert.deepEqual(experiment.appliedProfiles,baseline.appliedProfiles,'Strategy experiment changed pace');
 assert.deepEqual(experiment.originalStrategies,baseline.originalStrategies,'Different initial strategy assignment');
 assert.deepEqual(baseline.appliedStrategies,baseline.originalStrategies,'Natural control changed strategies');
 assert.equal(experiment.strategyInterventionAtMs,20);
 assert(Object.values(experiment.appliedStrategies).every(v=>v==='BALANCED'),
  'Comparison vehicle retained a non-balanced strategy');
 const altered=Object.entries(experiment.originalStrategies).filter(([id,s])=>
  experiment.appliedStrategies[id]!==s).length;
 const winnerBaseline=baseline.finishedRows[0],winnerExperiment=experiment.finishedRows[0];
 const baselineRows=new Map(baseline.finishedRows.map(r=>[r.id,r]));
 const finishChanges=experiment.finishedRows.map(r=>({
  id:r.id,originalStrategy:baseline.originalStrategies[r.id],
  originalPace:baseline.originalProfiles[r.id].pace,
  baselineRank:baselineRows.get(r.id)?.position,balancedRank:r.position,
  finishSecondsDifference:(r.finishMs-(baselineRows.get(r.id)?.finishMs||0))/1000
 }));
 const firstGap=rows=>(rows[1].finishMs-rows[0].finishMs)/1000;
 const spread=rows=>(rows.at(-1).finishMs-rows[0].finishMs)/1000;
 const result={seed,track:'majoku-ring-v1',fullTenLap:true,entrants:12,
  actualPhysics:true,scenario:'natural strategy vs everyone BALANCED after accepted 20ms step',
  interventionAtMs:experiment.strategyInterventionAtMs,changedStyles:altered,
  startingGridSame:true,driverAbilitiesSame:true,startingTyresSame:true,
  baseline:{winner:winnerBaseline.id,confirmedPasses:baseline.physics.passes,
   frontGapSeconds:firstGap(baseline.finishedRows),finishSpreadSeconds:spread(baseline.finishedRows),
   pitStops:baseline.finishedRows.reduce((n,r)=>n+r.pits,0)},
  allBalanced:{winner:winnerExperiment.id,confirmedPasses:experiment.physics.passes,
   frontGapSeconds:firstGap(experiment.finishedRows),finishSpreadSeconds:spread(experiment.finishedRows),
   pitStops:experiment.finishedRows.reduce((n,r)=>n+r.pits,0)},
  finishChanges,sourceFiles:{baseline:baselineCase.outcomeFile,allBalanced:output}};
 pairs.push(result);
 console.log(JSON.stringify({stage:'R5-b53',status:'CASE_PASS',seed,changedStyles:altered,
  originalWinner:result.baseline.winner,balancedWinner:result.allBalanced.winner}));
}
const result={stage:'R5-b53',status:'PASS',track:'majoku-ring-v1',
 matchedPairs:pairs.length,intervention:'Strategy label only, browser test after first 20ms physical frame',
 pairs,limit:'This changes later physical energy, tyre and pit histories naturally. Two seeds are not a universal causal model.'};
assert.equal(pairs.length,2);
fs.writeFileSync(dir+'/paired-strategy.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({stage:result.stage,status:result.status,matchedPairs:pairs.length,
 artifact:dir+'/paired-strategy.json'}));
