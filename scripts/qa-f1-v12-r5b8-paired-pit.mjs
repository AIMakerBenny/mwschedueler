// R5-b8: controlled same-seed normal-race pit/no-pit comparison.
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
const trackId='castle-street-circuit-v1',target='r5b3-driver-3',seed=1;
const iso=new Date(Date.UTC(2026,9,18,0,0,0,seed*1000)).toISOString();
const output='artifacts/f1-v12-r5b8-paired-pit.json';
const anchor="  if(plan.decision==='BOX_NOW'&&requestPitStopV205(v.id,plan.targetCompound,'UNIFIED_V11_TIME_ADVANTAGE')){";
const patch=[
 "  // R5-b8 browser-only counterfactual, not a production source change.",
 "  if(plan.decision==='BOX_NOW'&&window.__r5b8NoPitTarget===String(v.id)){",
 "    window.__r5b8Denied.push({id:String(v.id),t:now,compound:plan.targetCompound,benefit:plan.benefit});",
 "    return;",
 "  }"
].join('\n')+'\n';
const server=createF1PreviewServer();
await new Promise(resolve=>server.listen(8868,'127.0.0.1',resolve));
let browser,result={phase:'R5-b8',status:'DIAGNOSTIC'};
async function oneRace(intervention){
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 let routeCount=0;
 try{
  if(intervention){
   await page.addInitScript(({target})=>{
    window.__r5b8NoPitTarget=target;window.__r5b8Denied=[];
   },{target});
   await page.route('**/assets/f1-racing-v1.js*',async route=>{
    const upstream=await route.fetch(),js=await upstream.text();
    if(js.split(anchor).length!==2)throw Error('Autonomous pit boundary changed or duplicated');
    routeCount++;
    await route.fulfill({response:upstream,body:js.replace(anchor,patch+anchor)});
   });
  }
  await page.goto('http://127.0.0.1:8868/',{waitUntil:'load'});
  await page.waitForFunction(()=>typeof window.mwsF1UnifiedV11Report==='function');
  if(intervention)assert.equal(routeCount,1,'Experimental source interception absent');
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
   window.__r5b8Record={ticks:0,requested:new Set(),requests:[],samples:[]};
   return {state:window.mwsF1GetScreenStateV185(),
    ms:window.mwsF1GetSimulationClockV192().simTimeMs,
    grid:cars.map(v=>String(v.id)),tyres};
  });
  assert.equal(initial.state,'RACE');assert.equal(initial.ms,0);
  assert.equal(initial.grid.length,12);
  let status='RACE',ticks=0;
  while(status==='RACE'&&ticks<70000){
   const step=await page.evaluate(size=>{
    const q=window.__r5b8Record;
    for(let i=0;i<size;i++){
     const ok=window.mwsF1SimulateRaceStepV192(20);q.ticks++;
     const vehicles=window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle);
     for(const v of vehicles)if(v.pitRequested&&!q.requested.has(String(v.id))){
      q.requested.add(String(v.id));
      const p=window.mwsF1UnifiedV11Report().pit.find(p=>p.id===String(v.id))||null;
      q.requests.push({id:String(v.id),t:window.mwsF1GetSimulationClockV192().simTimeMs/1000,plan:p});
     }
     if(q.ticks%250===0)q.samples.push({tick:q.ticks,
      simSeconds:window.mwsF1GetSimulationClockV192().simTimeMs/1000,
      cars:vehicles.map(v=>({id:String(v.id),lap:v.raceProgress,wear:v.tyreWear,speedKph:v.speedKph}))
       .sort((a,b)=>a.id.localeCompare(b.id))});
     if(!ok||window.mwsF1GetScreenStateV185()!=='RACE')break;
    }
    return {ticks:q.ticks,status:window.mwsF1GetScreenStateV185()};
   },250);
   ticks=step.ticks;status=step.status;
  }
  const actual=await page.evaluate(()=>{
   const q=window.__r5b8Record,r=window.mwsF1GetRaceResultRecoveryG(),
    physics=window.mwsF1UnifiedV11Report();
   return {screen:window.mwsF1GetScreenStateV185(),
    requests:q.requests,samples:q.samples,denied:window.__r5b8Denied||[],
    rows:(r?.rows||[]).map(v=>({id:v.contactId,rank:v.position,pits:v.pitStopCount,
     finishMs:v.finishedAtSimMs,lapTimesMs:v.lapTimesMs})),
    invalid:physics.invalid,collisionStops:physics.collisionStops};
  });
  assert.deepEqual(errors,[]);
  assert.equal(actual.screen,'FINISHING');
  assert.equal(actual.rows.length,12);
  assert.equal(actual.collisionStops,0);
  assert.deepEqual(actual.invalid,[]);
  assert(actual.rows.every(r=>r.finishMs>0&&r.lapTimesMs?.length===10));
  return {mode:intervention?'EXPERIMENTAL_NO_PIT':'NATURAL_BASELINE',initial,...actual};
 }finally{await page.close();}
}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.MWS_CHROME_PATH||undefined,args:['--no-sandbox']});
 const natural=await oneRace(false),control=await oneRace(true);
 const request=natural.requests.find(p=>p.id===target),
  firstDenied=control.denied[0]||null;
 const n=natural.rows.find(r=>r.id===target),c=control.rows.find(r=>r.id===target);
 const prior=natural.samples.filter(x=>x.simSeconds<Math.min(request?.t||0,firstDenied?.t||0));
 const paired=new Map(control.samples.map(x=>[x.tick,x]));
 const mismatch=prior.find(x=>JSON.stringify(x.cars)!==JSON.stringify(paired.get(x.tick)?.cars))||null;
 const observed=(c?.finishMs-n?.finishMs)/1000,forecast=request?.plan?.benefit??null;
 result={phase:'R5-b8',trackId,seed,target,
  intervention:'QA browser only: decline this driver autonomous pit request. No forced pit or physics alteration.',
  matchedGrid:JSON.stringify(natural.initial.grid)===JSON.stringify(control.initial.grid),
  matchedTyres:JSON.stringify(natural.initial.tyres)===JSON.stringify(control.initial.tyres),
  matchedPreDecisionSamples:prior.length,firstMismatchTick:mismatch?.tick??null,
  request,firstDenied,naturalPits:n?.pits,controlPits:c?.pits,
  forecastedBenefitSeconds:forecast,pairedSimulatorBenefitSeconds:observed,
  forecastErrorSeconds:Number.isFinite(forecast)?forecast-observed:null,
  interpretation:'Paired simulated finish time includes traffic and rivals; not isolated tyre-only gain, not a population estimate.',
  natural,control};
 assert(result.matchedGrid&&result.matchedTyres);
 assert(Number.isFinite(forecast)&&forecast>1.5,'Natural target pit missing');
 assert(n?.pits===1&&c?.pits===0,'QA test-only pit suppression failed');
 assert(firstDenied?.id===target);
 assert(Math.abs(request.t-firstDenied.t)<=.04,'Unmatched policy decision time');
 assert(prior.length>=10&&!mismatch,'Pre-intervention trajectories differ');
 assert(Number.isFinite(observed));
 result.status='PASS';
}catch(error){result.status='FAIL';result.error=String(error?.stack||error)}
finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
 fs.mkdirSync('artifacts',{recursive:true});
 fs.writeFileSync(output,JSON.stringify(result,null,2));
 console.log(JSON.stringify({phase:'R5-b8',status:result.status,forecast:result.forecastedBenefitSeconds,
  paired:result.pairedSimulatorBenefitSeconds,matchedSamples:result.matchedPreDecisionSamples,
  mismatch:result.firstMismatchTick,error:result.error||null,artifact:output}));
}
assert.equal(result.status,'PASS',result.error||'Paired Chromium comparison failed');
