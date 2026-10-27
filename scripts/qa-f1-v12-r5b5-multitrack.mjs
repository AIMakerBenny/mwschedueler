// R5-b5 actual NORMAL 10-lap, 3 physical tracks x 2 fixed app RNG seeds.
// Runs the unchanged R5-b3 integrated Chromium race/pit QA as real child sessions.
// No race physics, pit strategy, rank, starting position, tyres or outcome overrides.
// Source records kept separately. Cross-run aggregates are descriptive, not causal.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const races=[
 {track:'castle-street-circuit-v1',seed:1},
 {track:'castle-street-circuit-v1',seed:2},
 {track:'blue-coast-speedway-v1',seed:1},
 {track:'blue-coast-speedway-v1',seed:2},
 {track:'royal-street-circuit-v1',seed:1},
 {track:'royal-street-circuit-v1',seed:2}
];
const dir='artifacts/r5-b5';
fs.mkdirSync(dir,{recursive:true});
const aggregated=[],failures=[];
for(const [index,entry] of races.entries()){
 const label=entry.track+'-seed'+entry.seed;
 const output=dir+'/'+label+'.json';
 console.log(JSON.stringify({stage:'R5-b5-case-start',index:index+1,total:races.length,...entry,output}));
 const call=spawnSync(process.execPath,[path.join(here,'qa-f1-v12-r5b3-normal-auto-pit.mjs')],{
  env:{...process.env,MWS_R5B3_PORT:String(8800+index),MWS_R5B3_TRACK:entry.track,
   MWS_R5B3_SEED:String(entry.seed),MWS_R5B3_OUTPUT:output},
  encoding:'utf8',timeout:360000,maxBuffer:3*1024*1024
 });
 if(call.stdout){
  const lines=call.stdout.trim().split('\n');
  for(const line of lines.filter(x=>/R5-b3|PASS|FAIL/.test(x)).slice(-6))console.log(line);
 }
 if(call.stderr)console.error(call.stderr.slice(-2500));
 if(call.error||call.status!==0||!fs.existsSync(output)){
  failures.push({...entry,status:call.status,error:String(call.error||'QA command failed'),
   log:call.stderr?.slice(-1600)||'',output});
  break;
 }
 const result=JSON.parse(fs.readFileSync(output,'utf8'));
 if(result.status!=='PASS'||result.seedId!==String(entry.seed)||
   result.track!==entry.track||result.setupCreatedAt!==result.seededIso){
  failures.push({...entry,error:'Report seed/track/status mismatch',status:result.status});
  break;
 }
 const rows=result.finishedRows,requests=result.pitRequests;
 const initial=result.startingCompounds;
 const compounds={};
 for(const name of ['SOFT','MEDIUM','HARD']){
  const drivers=Object.keys(initial).filter(id=>initial[id]===name);
  compounds[name]={started:drivers.length,autoRequests:requests.filter(r=>initial[r.id]===name).length,
   completedStops:rows.filter(r=>initial[r.id]===name).reduce((a,v)=>a+v.pits,0),
   meanRank:Math.round(100*rows.filter(r=>initial[r.id]===name).reduce((a,v)=>a+v.position,0)/drivers.length)/100};
 }
 const winner=rows[0],last=rows.at(-1);
 const row={
  track:entry.track,seed:entry.seed,setupCreatedAt:result.setupCreatedAt,trackMeters:result.samples?.[0]?.drivers?.length?null:null,
  entrants:rows.length,laps:result.laps,simulatedSeconds:result.simulatedSeconds,
  firstFinishSeconds:winner.finishMs/1000,lastFinishSeconds:last.finishMs/1000,
  finishSpreadSeconds:(last.finishMs-winner.finishMs)/1000,
  confirmedPasses:result.physics.passes,rawCrossings:result.physics.rawCrossings,
  pitRequests:requests.length,completedPitStops:rows.reduce((sum,v)=>sum+v.pits,0),
  pitRate:requests.length/rows.length,
  pitPlanBenefits:requests.map(v=>({id:v.id,compound:initial[v.id],wear:v.wear,
    remainingLaps:v.remainingLaps,benefitSeconds:v.recordedPlan?.benefit,
    modelPitLossSeconds:v.recordedPlan?.pitLossSeconds,target:v.to,
    observedBenefitSeconds:null,benefitKind:v.recordedPlan?.benefitKind,
    forecast:v.recordedPlan?.forecast,alternatives:v.recordedPlan?.candidates,
    bestVsRunnerUpSeconds:v.recordedPlan?.candidates?.length===3?
      v.recordedPlan.candidates[0].benefit-v.recordedPlan.candidates[1].benefit:null})),
  compounds,initialGrid:result.initialOrder,finishOrder:rows.map(v=>v.id),
  physicsFailures:result.physics.collisionStops+(result.physics.invalid?.length||0),
  state:result.state,sourceFile:output
 };
 aggregated.push(row);
 console.log(JSON.stringify({stage:'R5-b5-case-PASS',track:entry.track,seed:entry.seed,
  passes:row.confirmedPasses,stops:row.completedPitStops,byCompound:compounds,
  first:row.firstFinishSeconds,last:row.lastFinishSeconds,
  pitBenefitRange:row.pitPlanBenefits.length?[Math.min(...row.pitPlanBenefits.map(b=>b.benefitSeconds)),
   Math.max(...row.pitPlanBenefits.map(b=>b.benefitSeconds))]:null}));
}
const summaryPath=dir+'/summary.json';
const warnings=[];
for(const track of [...new Set(aggregated.map(x=>x.track))]){
 const trial=aggregated.filter(x=>x.track===track);
 if(trial.length===2&&JSON.stringify(trial[0].initialGrid)===JSON.stringify(trial[1].initialGrid))
  warnings.push('Identical starting grid despite different setup RNG seed: '+track);
}
const totalStarts=aggregated.reduce((sum,r)=>sum+r.entrants,0);
const totalStops=aggregated.reduce((sum,r)=>sum+r.completedPitStops,0);
const rate=totalStarts?totalStops/totalStarts:0;
const predicted=aggregated.flatMap(r=>r.pitPlanBenefits);
const benefitStats=predicted.length?{min:Math.min(...predicted.map(r=>r.benefitSeconds)),
 mean:predicted.reduce((s,r)=>s+r.benefitSeconds,0)/predicted.length,
 max:Math.max(...predicted.map(r=>r.benefitSeconds))}:null;
if(rate>.85)warnings.push('HIGH_AUTO_PIT_RATE_GREATER_THAN_85_PERCENT');
if(benefitStats&&benefitStats.max>90)warnings.push('FORECAST_BENEFIT_GREATER_THAN_90_SECONDS_CHECK_MODEL_CALIBRATION');
if(aggregated.some(r=>r.pitRequests===0))warnings.push('NO_AUTONOMOUS_STOPS_ON_SOME_SCENARIOS');
const summary={version:'v1.2-R5-b5',status:failures.length?'FAIL':'PASS',scope:
 'Three authentic SVG circuits, two fixed setup RNG seeds each, 12 drivers and NORMAL 10 laps; no manual pits or forced outcomes',
 runCount:aggregated.length,driversObserved:totalStarts,tracks:[...new Set(aggregated.map(x=>x.track))],
 seeds:[1,2],totalAutoStops:totalStops,autoPitRate:rate,benefitStats,
 passCount:aggregated.reduce((sum,x)=>sum+x.confirmedPasses,0),
 totalRealRaceSimSeconds:aggregated.reduce((sum,x)=>sum+x.simulatedSeconds,0),
 scenarios:aggregated,warnings,failures,
 inferenceLimit:'Observational finish positions and pit decisions cannot identify the causal time gain from pitting. Predicted benefit is a model output, NOT measured lap-time gain. Counterfactual paired testing remains necessary.'
};
fs.writeFileSync(summaryPath,JSON.stringify(summary,null,2));
console.log(JSON.stringify({stage:'R5-b5-summary',status:summary.status,runCount:summary.runCount,
 stops:summary.totalAutoStops,rate:summary.autoPitRate,
 passes:summary.passCount,benefitStats,warnings,summaryPath}));
assert.equal(failures.length,0,JSON.stringify(failures));
assert.equal(aggregated.length,6,'Missing real full-race simulations');
assert.deepEqual(summary.tracks,[
 'castle-street-circuit-v1','blue-coast-speedway-v1','royal-street-circuit-v1']);
assert.equal(totalStarts,72);
assert(aggregated.every(row=>row.entrants===12&&row.laps===10&&row.physicsFailures===0&&
 row.state==='FINISHING'&&row.completedPitStops===row.pitRequests&&row.firstFinishSeconds>0));
assert(aggregated.every(row=>row.pitPlanBenefits.every(b=>b.wear>.60&&b.remainingLaps>=1.1&&b.benefitSeconds>1.5)));
assert(aggregated.every(row=>row.pitPlanBenefits.every(b=>b.benefitKind==='MODEL_ESTIMATE_NOT_OBSERVED_GAIN'&&
 b.observedBenefitSeconds===null&&b.alternatives?.length===3&&b.alternatives[0].compound===b.target&&
 Number.isFinite(b.bestVsRunnerUpSeconds)&&b.bestVsRunnerUpSeconds>=0&&
 Number.isFinite(b.forecast?.lapSeconds)&&Number.isFinite(b.forecast?.stayLossSeconds))),
 'Missing decision-time tyre alternatives or mislabeled actual gain');
