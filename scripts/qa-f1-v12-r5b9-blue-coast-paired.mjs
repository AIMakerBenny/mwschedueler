// R5-b9: controlled same-seed normal-race pit/no-pit comparison.
// The baseline uses unmodified real app source and natural automatic pits.
// Only the comparison browser intercepts one driver's automatic request;
// genuine vehicle physics/position/tyre wear are never overridden.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createF1PreviewServer} from './serve-f1-unified-v11-preview.mjs';
let chromium;
try{({chromium}=await import('playwright'))}
catch(e){
 if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw e;
 ({chromium}=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'_resolve.cjs'))('playwright'));
}
const trackId='blue-coast-speedway-v1',target='r5b3-driver-3',seed=Number(process.env.MWS_R5B9_SEED||1);
assert([1,2].includes(seed),'Seed must be 1 or 2');
const iso=new Date(Date.UTC(2026,9,18,0,0,0,seed*1000)).toISOString();
const output='artifacts/f1-v12-r5b9-blue-coast-seed'+seed+'.json';
const anchor='  const plan=unifiedPitPlanV11(row,track);';
const patch=[
 "  if(String(v.id)===window.__r5b9Target&&plan.wear>.60&&plan.remainingLaps>=1.1&&window.__r5b9Eligibility===null){",
 "    const p={id:String(v.id),t:now,lap:row.s/unifiedStateV11.path.len,wear:plan.wear,",
 "     remainingLaps:plan.remainingLaps,decision:plan.decision,pitLossSeconds:plan.pitLossSeconds,",
 "     candidates:plan.candidates.map(c=>({...c}))};",
 "    window.__r5b9Eligibility=p;",
 "    if(window.__r5b9Compound){",
 "      const c=plan.candidates.find(c=>c.compound===window.__r5b9Compound);",
 "      window.__r5b9Forces.push({...p,compound:window.__r5b9Compound,modelBenefitSeconds:c?.benefit??null});",
 "      if(!requestPitStopV205(v.id,window.__r5b9Compound,'QA_ONLY_PAIRED_PIT'))",
 "       throw Error('Actual pit lifecycle declined browser-only intervention');",
 "    }",
 "  }",
 "  // Only QA: avoid the REAL autonomous request overriding MEDIUM/HARD",
 "  // with the planner default SOFT in the SAME accepted physics step.",
 "  // Null compound is the intentionally no-pit control.",
 "  if(String(v.id)===window.__r5b9Target)return;"
].join('\n')+'\n';
const server=createF1PreviewServer();
await new Promise(resolve=>server.listen(8868,'127.0.0.1',resolve));
let browser,result={phase:'R5-b9',status:'DIAGNOSTIC'};
async function oneRace(compound){
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 let routeCount=0;
 try{
  await page.addInitScript(({target,compound})=>{
   window.__r5b9Target=target;window.__r5b9Compound=compound;
   window.__r5b9Eligibility=null;window.__r5b9Forces=[];
  },{target,compound});
  await page.route('**/assets/f1-racing-v1.js*',async route=>{
   const upstream=await route.fetch(),js=await upstream.text();
   if(js.split(anchor).length!==2)throw Error('Pit model anchor missing or duplicated');
   routeCount++;
   await route.fulfill({response:upstream,body:js.replace(anchor,anchor+'\n'+patch)});
  });
  await page.goto('http://127.0.0.1:8868/',{waitUntil:'load'});
  await page.waitForFunction(()=>typeof window.mwsF1UnifiedV11Report==='function');
  assert.equal(routeCount,1,'Browser-only telemetry route absent');
  await page.waitForFunction(()=>document.getElementById('mwsLoginForm')?.dataset.mode==='admin');
  await page.locator('#mwsModePublic').click();await page.locator('#mwsLoginSubmit').click();
  await page.waitForFunction(()=>document.getElementById('mwsAccessGate').classList.contains('hidden'));
  const setup=await page.evaluate(({trackId,iso})=>{
   const contacts=Array.from({length:12},(_,i)=>({id:'r5b3-driver-'+i,name:'NORMAL Driver '+i,image:'',labels:['R5B3 NORMAL QA']}));
   window.mwsGetF1ContactsV181=()=>contacts;
   const section=document.getElementById('gameF1Racing');
   document.querySelectorAll('.section').forEach(n=>n.classList.toggle('active',n===section));
   window.mwsRenderF1RacingV180();window.mwsF1SelectTrackV186(trackId);
   for(const c of contacts)window.mwsF1ToggleDriverV181(c.id);
   window.mwsF1SetLapCountV260(10);
   const Original=window.Date;
   class FixedDate extends Original{
    constructor(...args){super(...(args.length?args:[iso]));}
    static now(){return Original.parse(iso);}
   }
   window.Date=FixedDate;
   let started;
   try{started=window.mwsF1StartRaceFromSetupV187('NORMAL')}
   finally{window.Date=Original;}
   const s=window.mwsF1GetActiveRaceSnapshotV187();
   return {started,createdAt:s?.createdAt,track:s?.trackId,laps:s?.totalLaps,mode:s?.raceMode};
  },{trackId,iso});
  assert.deepEqual(setup,{started:true,createdAt:iso,track:trackId,laps:10,mode:'NORMAL'});
  await page.waitForFunction(()=>window.mwsF1GetScreenStateV185()==='GRID');
  assert.equal(await page.evaluate(()=>window.mwsF1WaitGridRevealV273(20000)),true);
  const initial=await page.evaluate(()=>{
   const button=document.getElementById('f1RacingGridStartRecoveryM');
   if(!button)throw Error('Missing genuine GRID start');
   button.click();window.mwsF1PauseRaceMotionV189(false);
   const cars=window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle),tyres={};
   for(const v of cars){
    const i=Number(String(v.id).split('-').at(-1)),c=i<6?'SOFT':i<9?'MEDIUM':'HARD';
    if(!window.mwsF1SetVehicleTyreCompoundV203(v.id,c))throw Error('Starting tyre fixture failed');
    tyres[String(v.id)]=c;
   }
   window.__r5b9Record={ticks:0,requested:new Set(),requests:[],samples:[]};
   return {state:window.mwsF1GetScreenStateV185(),
    ms:window.mwsF1GetSimulationClockV192().simTimeMs,
    grid:cars.map(v=>String(v.id)),tyres};
  });
  assert.equal(initial.state,'RACE');assert.equal(initial.ms,0);
  assert.equal(initial.grid.length,12);
  let status='RACE',ticks=0;
  while(status==='RACE'&&ticks<70000){
   const step=await page.evaluate(size=>{
    const q=window.__r5b9Record;
    for(let i=0;i<size;i++){
     const ok=window.mwsF1SimulateRaceStepV192(20);q.ticks++;
     const vehicles=window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle);
     for(const v of vehicles)if(v.pitRequested&&!q.requested.has(String(v.id))){
      q.requested.add(String(v.id));
      const p=window.mwsF1UnifiedV11Report().pit.find(p=>p.id===String(v.id))||null;
      q.requests.push({id:String(v.id),t:window.mwsF1GetSimulationClockV192().simTimeMs/1000,
       targetCompound:v.pitTargetCompound,requestReason:v.pitRequestReason,plan:p});
     }
     if(q.ticks%250===0)q.samples.push({tick:q.ticks,
      simSeconds:window.mwsF1GetSimulationClockV192().simTimeMs/1000,
      cars:vehicles.map(v=>({id:String(v.id),lap:v.raceProgress,wear:v.tyreWear,speedKph:v.speedKph,
       compound:v.tyreCompound,pitState:v.pitState,pitTargetCompound:v.pitTargetCompound}))
       .sort((a,b)=>a.id.localeCompare(b.id))});
     if(!ok||window.mwsF1GetScreenStateV185()!=='RACE')break;
    }
    return {ticks:q.ticks,status:window.mwsF1GetScreenStateV185()};
   },250);
   ticks=step.ticks;status=step.status;
  }
  const actual=await page.evaluate(()=>{
   const q=window.__r5b9Record,r=window.mwsF1GetRaceResultRecoveryG(),
    physics=window.mwsF1UnifiedV11Report(),
    tyres=new Map(window.mwsF1GetPitStatesV205().map(t=>[String(t.id),t]));
   return {screen:window.mwsF1GetScreenStateV185(),
    requests:q.requests,samples:q.samples,eligibility:window.__r5b9Eligibility,forces:window.__r5b9Forces||[],
    rows:(r?.rows||[]).map(v=>({id:v.contactId,rank:v.position,pits:v.pitStopCount,
     installedCompound:tyres.get(String(v.contactId))?.compound,
     finalPitTarget:tyres.get(String(v.contactId))?.targetCompound,
     finishMs:v.finishedAtSimMs,lapTimesMs:v.lapTimesMs})),
    invalid:physics.invalid,collisionStops:physics.collisionStops};
  });
  assert.deepEqual(errors,[]);
  assert.equal(actual.screen,'FINISHING');
  assert.equal(actual.rows.length,12);
  assert.equal(actual.collisionStops,0);
  assert.deepEqual(actual.invalid,[]);
  assert(actual.rows.every(r=>r.finishMs>0&&r.lapTimesMs?.length===10));
  return {mode:compound||'QA_ONLY_NO_PIT_CONTROL',initial,...actual};
 }finally{await page.close();}
}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.MWS_CHROME_PATH||undefined,args:['--no-sandbox']});
 const baseline=await oneRace(null);
 const interventions=[];
 for(const compound of ['SOFT','MEDIUM','HARD'])interventions.push(await oneRace(compound));
 const b=baseline.rows.find(v=>v.id===target);
 assert.equal(b?.pits,0,'Browser-only no-pit control unexpectedly stopped');
 assert(baseline.eligibility?.wear>.60&&baseline.eligibility?.remainingLaps>=1.1,
  'No-pit control did not reach a real eligible high-wear decision');
 const comparisons=interventions.map(run=>{
  const v=run.rows.find(v=>v.id===target),event=run.forces[0];
  const cutoff=Math.min(baseline.eligibility.t,run.eligibility?.t||0);
  const prior=baseline.samples.filter(z=>z.simSeconds<cutoff),lookup=new Map(run.samples.map(z=>[z.tick,z]));
  const mismatch=prior.find(z=>JSON.stringify(z.cars)!==JSON.stringify(lookup.get(z.tick)?.cars));
  return {compound:run.mode,gridMatch:JSON.stringify(baseline.initial.grid)===JSON.stringify(run.initial.grid),
   tyreMatch:JSON.stringify(baseline.initial.tyres)===JSON.stringify(run.initial.tyres),
   beforeDecisionSamples:prior.length,firstMismatchTick:mismatch?.tick??null,
   decisionDeltaSeconds:Math.abs(baseline.eligibility.t-run.eligibility.t),
   interventionCount:run.forces.length,completedPitStops:v?.pits,
   actualRequestedCompound:run.requests.find(x=>x.id===target)?.targetCompound??null,
   finalInstalledCompound:v?.installedCompound??null,finalPitTarget:v?.finalPitTarget??null,
   modelBenefitSeconds:event?.modelBenefitSeconds??null,
   pairedFinishBenefitSeconds:(b.finishMs-v?.finishMs)/1000,
   baselineRank:b.rank,interventionRank:v?.rank,
   baselineFinishSeconds:b.finishMs/1000,interventionFinishSeconds:v?.finishMs/1000,
   interventionLapTimesMs:v?.lapTimesMs};
 });
 result={phase:'R5-b9',status:'DIAGNOSTIC',trackId,seed,target,
  firstEligibleModel:baseline.eligibility,comparisons,baseline,interventions,
  interpretation:'Browser-only no-pit control vs forced real SOFT/MEDIUM/HARD pit lifecycle. Traffic feedback remains; real engine physics unchanged. Separately calibrated real-game autonomous forecast is measured by its independent full-race QA.'};
 for(const q of comparisons){
  assert(q.gridMatch&&q.tyreMatch&&q.beforeDecisionSamples>=10&&q.firstMismatchTick===null,
   'Pre-intervention mismatch '+q.compound);
  assert(q.decisionDeltaSeconds<=.04&&q.interventionCount===1&&q.completedPitStops===1,
   'Full real pit lifecycle or decision timing mismatch '+q.compound);
  assert(q.actualRequestedCompound===q.compound&&q.finalPitTarget===q.compound&&
   q.finalInstalledCompound===q.compound,
   'TEST INVALID: pit selection was overwritten or wrong compound fitted '+JSON.stringify(q));
  assert(Number.isFinite(q.modelBenefitSeconds)&&Number.isFinite(q.pairedFinishBenefitSeconds),
   'Missing paired cost/forecast '+q.compound);
 }
 // Compare actual completed races, never nominal requested compound labels.
 assert(new Set(comparisons.map(x=>x.interventionFinishSeconds.toFixed(4))).size>=2,
  'TEST INVALID: three compounds gave identical finish times');
 result.status='PASS';
}catch(error){result.status='FAIL';result.error=String(error?.stack||error)}
finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
 fs.mkdirSync('artifacts',{recursive:true});
 fs.writeFileSync(output,JSON.stringify(result,null,2));
 console.log(JSON.stringify({phase:'R5-b9',seed,status:result.status,
  comparisons:result.comparisons?.map(x=>({compound:x.compound,
   fitted:x.finalInstalledCompound,forecast:x.modelBenefitSeconds,
   observed:x.pairedFinishBenefitSeconds,rank:x.interventionRank})),
  error:result.error||null,artifact:output}));
}
assert.equal(result.status,'PASS',result.error||'Paired Chromium comparison failed');
