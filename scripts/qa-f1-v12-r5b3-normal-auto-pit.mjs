// R5-b3: genuine FULL NORMAL race and autonomous-pit economics audit.
// The real app/Chromium controls the production unified solver and V205 pit lifecycle.
// NO manual pit requests, forced wear, forced finish or rank changes.
// Starting compounds are explicitly set as grid fixtures: 6 SOFT, 3 MEDIUM, 3 HARD.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createF1PreviewServer} from './serve-f1-unified-v11-preview.mjs';
let chromium;
try {({chromium}=await import('playwright'));}
catch(error){
 if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;
 ({chromium}=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'_resolve.cjs'))('playwright'));
}
const port=Number(process.env.MWS_R5B3_PORT)||8783;
const trackId=String(process.env.MWS_R5B3_TRACK||'castle-street-circuit-v1');
const maxTicks=Math.max(30000,Math.min(85000,Number(process.env.MWS_R5B3_MAX_TICKS)||70000));
const output='artifacts/f1-v12-r5b3-normal-auto-pit.json';
const server=createF1PreviewServer();
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
let browser,observation=null;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.MWS_CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'load'});
 await page.waitForFunction(()=>typeof window.mwsF1UnifiedV11Report==='function');
 await page.waitForFunction(()=>document.getElementById('mwsLoginForm')?.dataset.mode==='admin');
 await page.locator('#mwsModePublic').click();
 await page.locator('#mwsLoginSubmit').click();
 await page.waitForFunction(()=>document.getElementById('mwsAccessGate').classList.contains('hidden'));
 const initial=await page.evaluate(({trackId})=>{
  const contacts=Array.from({length:12},(_,i)=>({id:'r5b3-driver-'+i,name:'NORMAL Driver '+i,image:'',labels:['R5B3 NORMAL QA']}));
  window.mwsGetF1ContactsV181=()=>contacts;
  const section=document.getElementById('gameF1Racing');
  document.querySelectorAll('.section').forEach(node=>node.classList.toggle('active',node===section));
  window.mwsRenderF1RacingV180();
  window.mwsF1SelectTrackV186(trackId);
  for(const c of contacts)window.mwsF1ToggleDriverV181(c.id);
  window.mwsF1SetLapCountV260(10);
  return {started:window.mwsF1StartRaceFromSetupV187('NORMAL'),
   tracks:window.mwsF1GetTrackCatalogV186().length,
   drivers:window.mwsF1GetSelectedContactIdsV181().length,
   laps:window.mwsF1GetActiveRaceSnapshotV187()?.totalLaps,
   mode:window.mwsF1GetActiveRaceSnapshotV187()?.raceMode,
   track:window.mwsF1GetActiveRaceSnapshotV187()?.trackId};
 },{trackId});
 assert(initial.started&&initial.drivers===12&&initial.tracks===7,JSON.stringify(initial));
 assert.deepEqual({track:initial.track,laps:initial.laps,mode:initial.mode},{track:trackId,laps:10,mode:'NORMAL'});
 await page.waitForFunction(()=>window.mwsF1GetScreenStateV185()==='GRID');
 assert.equal(await page.evaluate(()=>window.mwsF1WaitGridRevealV273(20000)),true);
 await page.locator('#f1RacingGridStartRecoveryM').click();
 await page.waitForFunction(()=>window.mwsF1GetScreenStateV185()==='RACE');
 const start=await page.evaluate(()=>{
  window.mwsF1PauseRaceMotionV189(false); // disables only RAF; public 20ms integrator is unchanged
  const vehicles=window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle);
  const startingCompounds={};
  for(const v of vehicles){
   const i=Number(String(v.id).split('-').at(-1));
   const compound=i<6?'SOFT':i<9?'MEDIUM':'HARD';
   if(!window.mwsF1SetVehicleTyreCompoundV203(v.id,compound))throw Error('Initial compound failed');
   startingCompounds[String(v.id)]=compound;
  }
  window.__mwsR5b3={
   ticks:0,startingCompounds,events:[],requests:[],strategySamples:[],pitTransitions:[],
   lastPit:new Map(vehicles.map(v=>[String(v.id),String(v.pitState||'TRACK')])),
   everRequested:new Set(),finishEvents:[],finished:new Set(),continuityErrors:[],
   initialOrder:vehicles.map(v=>String(v.id)),finishBoundary:null,plannedPitViolations:[]};
  return {drivers:vehicles.length,compounds:startingCompounds,screen:window.mwsF1GetScreenStateV185(),
    profile:window.mwsF1QaDriverProfileMarkersV250().allPass};
 });
 assert(start.profile&&start.drivers===12&&start.screen==='RACE');
 let state='RACE',ticks=0;
 while(state==='RACE'&&ticks<maxTicks){
  const batch=await page.evaluate((batchSize)=>{
   const q=window.__mwsR5b3,standings=()=>window.mwsF1ComputeRaceStandingsV191(),
    seconds=()=>window.mwsF1GetSimulationClockV192().simTimeMs/1000;
   for(let n=0;n<batchSize;n++){
    const cars=standings().map(r=>r.vehicle);
    const old=new Map(cars.map(v=>[String(v.id),{progress:Number(v.raceProgress)||0,
      path:Number(v.unifiedPathDistanceV11)||0,speed:Number(v.speedKph)||0,finished:!!v.finished}]));
    const accepted=window.mwsF1SimulateRaceStepV192(20);q.ticks++;
    const active=standings().map(r=>r.vehicle),time=seconds(),totalLaps=window.mwsF1GetActiveRaceSnapshotV187().totalLaps;
    for(const v of active){
     const id=String(v.id),previous=q.lastPit.get(id)||'TRACK',current=String(v.pitState||'TRACK');
     if(v.pitRequested&&!q.everRequested.has(id)){
      q.everRequested.add(id);
      const read=window.mwsF1GetPitStrategyStatesV206().find(x=>String(x.id)===id);
      const item={id,time,lap:Number(v.raceProgress)||0,remainingLaps:totalLaps-v.raceProgress,
       wear:Number(v.tyreWear)||0,from:v.tyreCompound,to:v.pitTargetCompound,
       reason:String(v.pitRequestReason||''),readReason:read?.reason||'',benefit:read?.context?.benefit??null,
       pitLossSeconds:read?.context?.pitLossSeconds??null,
       recordedPlan:window.mwsF1UnifiedV11Report().pit.find(x=>String(x.id)===id)||null};
      q.requests.push(item);
      if(item.wear<=.6||item.remainingLaps<1.1||item.reason!=='UNIFIED_V11_TIME_ADVANTAGE'
        ||!item.recordedPlan||!(item.recordedPlan.benefit>1.5))q.plannedPitViolations.push(item);
     }
     if(current!==previous){
      q.pitTransitions.push({id,from:previous,to:current,time,lap:v.raceProgress,
       compound:v.tyreCompound,stopCount:v.pitStopCount,wear:v.tyreWear,speedKph:v.speedKph});
      q.lastPit.set(id,current);
     }
     if(v.finished&&!q.finished.has(id)){
      q.finished.add(id);q.finishEvents.push({id,time,rank:v.finishPosition,
       atMs:v.finishedAtSimMs,pits:v.pitStopCount,compound:v.tyreCompound});
     }
     if(q.ticks%50===0&&!v.finished&&!old.get(id).finished){
      const before=old.get(id),travel=(Number(v.unifiedPathDistanceV11)||0)-before.path,
       speed=Math.max(before.speed,Number(v.speedKph)||0)/3.6,
       bound=speed*.02+.25;
      if(!Number.isFinite(travel)||travel< -1e-6||travel>bound+1e-6||v.raceProgress<before.progress-1e-8)
       q.continuityErrors.push({id,tick:q.ticks,travel,bound,old:before.progress,newProgress:v.raceProgress});
     }
    }
    if(q.ticks%250===0){
     const strategies=window.mwsF1GetPitStrategyStatesV206();
     const leader=active[0],second=active[1],len=window.mwsF1GetActiveRaceSnapshotV187().track.lengthMeters;
     q.strategySamples.push({simSeconds:time,leader:String(leader.id),
      leaderProgress:leader.raceProgress,leaderGapMeters:(leader.raceProgress-second.raceProgress)*len,
      confirmedPasses:window.mwsF1UnifiedV11Report().passes.length,
      requests:q.requests.length,
      drivers:active.map(v=>{
       const st=strategies.find(x=>String(x.id)===String(v.id));
       return {id:String(v.id),lap:v.raceProgress,wear:v.tyreWear,compound:v.tyreCompound,
        state:v.pitState,requested:!!v.pitRequested,reason:st?.reason||'',
        decision:st?.decision||'',remainingLaps:st?.context?.remainingLaps??null,
        bestBenefit:st?.context?.candidates?.[0]?.benefit??null,
        predictedPitLoss:st?.context?.pitLossSeconds??null,
        target:st?.targetCompound||'',pits:v.pitStopCount};
      })});
    }
    if(!accepted||window.mwsF1GetScreenStateV185()!=='RACE'){
     q.finishBoundary={state:window.mwsF1GetScreenStateV185(),simSeconds:time,
      officialRows:window.mwsF1GetRaceResultRecoveryG()?.rows?.length||0};
     break;
    }
   }
   return {tick:q.ticks,state:window.mwsF1GetScreenStateV185(),seconds:seconds()};
  },250);
  state=batch.state;ticks=batch.tick;
  if(ticks%5000===0)console.log(JSON.stringify({stage:'R5-b3-progress',simSeconds:batch.seconds,ticks,state}));
 }
 await page.waitForTimeout(120);
 observation=await page.evaluate(()=>{
  const q=window.__mwsR5b3,report=window.mwsF1UnifiedV11Report(),
   snapshot=window.mwsF1GetActiveRaceSnapshotV187(),result=window.mwsF1GetRaceResultRecoveryG(),
   statuses=window.mwsF1GetPitStatesV205(),
   transitions=window.mwsF1ScreenTransitionsV12();
  return {version:'v1.2-R5-b3',scope:'12 LIVE drivers on one real SVG circuit, NORMAL 10 laps, mixed initial tyre compounds, zero manual pit requests',
   mode:snapshot.raceMode,track:snapshot.trackId,laps:snapshot.totalLaps,
   simulatedSeconds:window.mwsF1GetSimulationClockV192().simTimeMs/1000,
   state:window.mwsF1GetScreenStateV185(),domScreen:document.getElementById('gameF1Racing')?.dataset.f1Screen,
   initialOrder:q.initialOrder,startingCompounds:q.startingCompounds,
   pitRequests:q.requests,pitTransitions:q.pitTransitions,pitPlanViolations:q.plannedPitViolations,
   finishBoundary:q.finishBoundary,finishEvents:q.finishEvents,continuityErrors:q.continuityErrors,
   samples:q.strategySamples,screenTransitions:transitions,
   finishedRows:result?.rows?.map(r=>({id:r.contactId,position:r.position,gridPosition:r.gridPosition,
    pits:r.pitStopCount,compound:r.tyreCompound,finishMs:r.finishedAtSimMs,lapTimesMs:r.lapTimesMs,bestLapMs:r.bestLapMs})),
   pitStates:statuses,physics:{collisionStops:report.collisionStops,invalid:report.invalid,
    passes:report.passes?.length,rawCrossings:report.rawCrossings?.length,autoPitPlans:report.pit},
   strategySummary:{sampleCount:q.strategySamples.length,
    reasonCounts:Object.fromEntries([...new Set(q.strategySamples.flatMap(x=>x.drivers.map(d=>d.reason)))].map(reason=>
     [reason,q.strategySamples.flatMap(x=>x.drivers).filter(d=>d.reason===reason).length])),
    peakWearByCompound:Object.fromEntries(['SOFT','MEDIUM','HARD'].map(c=>[c,Math.max(0,...q.strategySamples.flatMap(x=>x.drivers.filter(d=>q.startingCompounds[d.id]===c).map(d=>Number(d.wear)||0)))])),
    highWearNoPitSamples:q.strategySamples.flatMap(x=>x.drivers).filter(d=>d.wear>.60&&d.state==='TRACK'&&!d.requested).length},
   view:{finishingVisible:document.getElementById('f1RacingViewFinishingV185')?.hidden===false,
    overlayVisible:document.getElementById('f1RacingFinishOverlayV291')?.hidden===false},
   tickCount:q.ticks};
 });
 fs.mkdirSync('artifacts',{recursive:true});
 fs.writeFileSync(output,JSON.stringify({status:'DIAGNOSTIC',...observation,pageErrors},null,2));
 console.log(JSON.stringify({phase:'R5-b3',state:observation.state,seconds:observation.simulatedSeconds,
  officialFinishers:observation.finishedRows?.length,autoRequests:observation.pitRequests.length,
  actualStops:observation.finishedRows?.reduce((n,r)=>n+r.pits,0),softPeakWear:observation.strategySummary.peakWearByCompound.SOFT,
  warning:observation.pitRequests.length?'':'NO_AUTOMATIC_PIT_ON_NORMAL_TEN_LAPS',
  phys:observation.physics.collisionStops,invalid:observation.physics.invalid?.length}));
 assert.deepEqual(pageErrors,[],'LIVE browser JS exceptions');
 assert.equal(observation.state,'FINISHING','Natural NORMAL finish missing or screen reverted');
 assert.equal(observation.domScreen,'FINISHING');
 assert(observation.view.finishingVisible&&observation.view.overlayVisible,'Official finishing view / result overlay must persist');
 assert.equal(observation.mode,'NORMAL');assert.equal(observation.laps,10);
 assert.equal(observation.finishedRows?.length,12);assert.equal(observation.finishEvents.length,12);
 assert.deepEqual(observation.finishedRows.map(r=>r.position),Array.from({length:12},(_,i)=>i+1));
 assert(observation.finishedRows.every(r=>r.finishMs>0&&r.lapTimesMs.length===10),
  'Official 10-lap finish and timing absent');
 assert.equal(observation.finishBoundary?.state,'FINISHING');
 assert.equal(observation.finishBoundary?.officialRows,12);
 assert.equal(observation.physics.collisionStops,0);
 assert.deepEqual(observation.physics.invalid,[]);
 assert.deepEqual(observation.continuityErrors,[]);
 assert.deepEqual(observation.pitPlanViolations,[],'Incorrect voluntary pit decision');
 assert(!observation.screenTransitions.some(t=>t.from==='FINISHING'&&t.to==='RACE'));
 assert(observation.physics.passes<=observation.physics.rawCrossings);
 assert.equal(observation.physics.autoPitPlans?.length,observation.pitRequests.length,
  'Autonomous pit telemetry / actual requests disagree');
 const byId=new Map(observation.finishedRows.map(x=>[x.id,x]));
 for(const request of observation.pitRequests){
  const transitions=observation.pitTransitions.filter(x=>x.id===request.id);
  assert.deepEqual(transitions.map(x=>x.to),['PIT_ENTRY','PIT_LANE','PIT_BOX','PIT_LANE','PIT_EXIT','TRACK'],
   'Unfinished autonomous pit sequence '+request.id);
  assert.equal(byId.get(request.id)?.pits,1,'Auto pit must service exactly once');
  const service=transitions.find(x=>x.from==='PIT_BOX'&&x.to==='PIT_LANE');
  assert.equal(service?.compound,request.to,'Tyre change did not match autonomous pit selection');
 }
 assert(observation.strategySummary.sampleCount>=100,'Long-run samples missing');
 const warnings=[];
 if(observation.pitRequests.length===0)warnings.push('NO_AUTOMATIC_PIT_REQUEST_IN_TEN_LAPS: economics or wear threshold may make pit unattractive; do not claim tested automatic pit service');
 if(observation.strategySummary.peakWearByCompound.SOFT<=.60)warnings.push('SOFT_DID_NOT_REACH_STRATEGY_WEAR_THRESHOLD');
 fs.writeFileSync(output,JSON.stringify({status:'PASS',warnings,...observation,pageErrors},null,2));
 console.log(JSON.stringify({status:'PASS',stage:'R5-b3',track:trackId,mode:'NORMAL',
  finishers:observation.finishedRows.length,simulatedSeconds:observation.simulatedSeconds,
  autonomousRequests:observation.pitRequests.length,realPitStops:observation.finishedRows.reduce((n,r)=>n+r.pits,0),
  confirmedPasses:observation.physics.passes,softPeakWear:observation.strategySummary.peakWearByCompound.SOFT,
  warnings,artifact:output}));
}catch(error){
 fs.mkdirSync('artifacts',{recursive:true});
 fs.writeFileSync(output,JSON.stringify({status:'FAIL',error:String(error?.stack||error),observation},null,2));
 throw error;
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}