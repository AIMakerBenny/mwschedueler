// R5-b1: actual LIVE Chromium FAST finish with real pit adapters.
// Uses only the production-exported unified solver and official lifecycle.
// One explicitly labelled manual pit ensures the real pit chain is exercised.
// This is NOT a comparison of naturally chosen pit strategies.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createF1PreviewServer} from './serve-f1-unified-v11-preview.mjs';
let chromium;
try { ({chromium}=await import('playwright')); }
catch (error) {
 if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;
 ({chromium}=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'_resolve.cjs'))('playwright'));
}
const port=Number(process.env.MWS_R5B_PORT)||8775;
const maxTicks=Math.max(16000,Math.min(60000,Number(process.env.MWS_R5B_MAX_TICKS)||33000));
const trackId='castle-street-circuit-v1',manualPitId='r5b-driver-9';
const server=createF1PreviewServer();
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.MWS_CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'load'});
 await page.waitForFunction(()=>typeof window.mwsF1UnifiedV11Report==='function');
 await page.waitForFunction(()=>document.getElementById('mwsLoginForm')?.dataset.mode==='admin');
 await page.locator('#mwsModePublic').click();
 await page.locator('#mwsLoginSubmit').click();
 await page.waitForFunction(()=>document.getElementById('mwsAccessGate').classList.contains('hidden'));
 const initialized=await page.evaluate(({trackId})=>{
  const contacts=Array.from({length:12},(_,i)=>({id:'r5b-driver-'+i,name:'R5B Driver '+i,image:'',labels:['R5B CHROMIUM QA']}));
  window.mwsGetF1ContactsV181=()=>contacts;
  const section=document.getElementById('gameF1Racing');
  document.querySelectorAll('.section').forEach(node=>node.classList.toggle('active',node===section));
  window.mwsRenderF1RacingV180();
  const selected=window.mwsF1SelectTrackV186(trackId);
  contacts.forEach(c=>window.mwsF1ToggleDriverV181(c.id));
  return {selected,tracks:window.mwsF1GetTrackCatalogV186().length,drivers:window.mwsF1GetSelectedContactIdsV181().length,
   started:window.mwsF1StartRaceFromSetupV187('FAST')};
 },{trackId});
 assert(initialized.started&&initialized.drivers===12&&initialized.tracks===7&&initialized.selected!==false,JSON.stringify(initialized));
 await page.waitForFunction(()=>window.mwsF1GetScreenStateV185()==='GRID');
 assert.equal(await page.evaluate(()=>window.mwsF1WaitGridRevealV273(20000)),true);
 await page.locator('#f1RacingGridStartRecoveryM').click();
 await page.waitForFunction(()=>window.mwsF1GetScreenStateV185()==='RACE');
 const start=await page.evaluate(({trackId,manualPitId})=>{
  window.mwsF1PauseRaceMotionV189(false); // stop RAF only, do not change solver
  const snapshot=window.mwsF1GetActiveRaceSnapshotV187();
  const vehicles=window.mwsF1ComputeRaceStandingsV191().map(x=>x.vehicle);
  window.__mwsR5bQa={tick:0,manualPitId,request:null,pitEvents:[],samples:[],lapEvents:[],continuity:[],pauseChecked:false,
   pitPrevious:new Map(vehicles.map(v=>[String(v.id),String(v.pitState||'TRACK')])),pitStopInitial:new Map(vehicles.map(v=>[String(v.id),Number(v.pitStopCount)||0])),
   finishSeen:new Set(),finishEvents:[],countedPassesAtStart:window.mwsF1CompetitionBaselineV12().confirmedPasses};
  return {track:snapshot.trackId,laps:snapshot.totalLaps,mode:snapshot.raceMode,drivers:vehicles.length,
   markers:document.querySelectorAll('.f1-racing-race-vehicle-v189').length,
   profile:window.mwsF1QaDriverProfileMarkersV250().allPass};
 },{trackId,manualPitId});
 assert.deepEqual({track:start.track,laps:start.laps,mode:start.mode,drivers:start.drivers},
  {track:trackId,laps:3,mode:'FAST',drivers:12});
 assert.equal(start.markers,12);assert(start.profile);
 let state='RACE',ticks=0;
 while(state==='RACE'&&ticks<maxTicks){
  const progress=await page.evaluate((maxPerBatch)=>{
   const q=window.__mwsR5bQa,drivers=()=>window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle);
   for(let i=0;i<maxPerBatch;i++){
    const vehicles=drivers(),target=vehicles.find(v=>String(v.id)===q.manualPitId);
    if(!q.request&&target&&!target.finished&&target.raceProgress>=.36&&target.raceProgress<.8&&target.pitState==='TRACK'){
     const accepted=window.mwsF1RequestPitStopV205(target.id,'HARD','R5B_MANUAL_QA');
     if(accepted)q.request={id:String(target.id),simMs:window.mwsF1GetSimulationClockV192().simTimeMs,
      progress:target.raceProgress,from:target.tyreCompound,to:'HARD',reason:'EXPLICIT_MANUAL_QA'};
    }
    // Pausing the live unified solver at the actual race clock must preserve positions.
    if(!q.pauseChecked&&q.tick>=500){
     const before=JSON.stringify(vehicles.map(v=>[v.id,v.raceProgress,v.speedKph,v.unifiedYV11,v.batteryMJ,v.tyreWear]));
     window.mwsF1ToggleSimulationPauseV192(true);
     const accepted=window.mwsF1SimulateRaceStepV192(20);
     const after=JSON.stringify(vehicles.map(v=>[v.id,v.raceProgress,v.speedKph,v.unifiedYV11,v.batteryMJ,v.tyreWear]));
     q.pauseChecked=!accepted&&before===after;
     window.mwsF1ToggleSimulationPauseV192(false);
     if(!q.pauseChecked)throw Error('Pause caused solver mutation');
    }
    const before=new Map(vehicles.map(v=>[String(v.id),{
     progress:v.raceProgress,speed:v.speedKph,path:v.unifiedPathDistanceV11||0,finished:Boolean(v.finished)}]));
    const accepted=window.mwsF1SimulateRaceStepV192(20);q.tick++;
    const active=drivers(),clock=window.mwsF1GetSimulationClockV192().simTimeMs;
    for(const v of active){
     const id=String(v.id),previous=q.pitPrevious.get(id)||'TRACK',current=String(v.pitState||'TRACK');
     if(current!==previous){
      q.pitEvents.push({id,from:previous,to:current,simMs:clock,progress:v.raceProgress,
       speedKph:v.speedKph,compound:v.tyreCompound,wear:v.tyreWear,stopCount:v.pitStopCount});
      q.pitPrevious.set(id,current);
     }
     if(v.finished&&!q.finishSeen.has(id)){
      q.finishSeen.add(id);q.finishEvents.push({id,rank:v.finishPosition,atMs:v.finishedAtSimMs,
       progress:v.raceProgress,pits:v.pitStopCount});
     }
     if(!v.finished&&!before.get(id)?.finished&&q.tick%25===0){
      const old=before.get(id),distance=(v.unifiedPathDistanceV11||0)-old.path,
       bound=Math.max(old.speed||0,v.speedKph||0)/3.6*.02+.25;
      if(!Number.isFinite(distance)||distance < -1e-6||distance>bound+1e-6||v.raceProgress<old.progress-1e-8)
       q.continuity.push({id,tick:q.tick,distance,bound,oldProgress:old.progress,current:v.raceProgress});
     }
    }
    if(q.tick%250===0){
     const standing=window.mwsF1ComputeRaceStandingsV191(),lead=standing[0].vehicle,p2=standing[1].vehicle,
      baseline=window.mwsF1CompetitionBaselineV12();
     q.samples.push({simMs:clock,leader:String(lead.id),p2:String(p2.id),
      gapMeters:(lead.raceProgress-p2.raceProgress)*window.mwsF1GetActiveRaceSnapshotV187().track.lengthMeters,
      winnerLapFraction:lead.raceProgress,physicalPasses:baseline.confirmedPasses,
      pitRequests:baseline.pitDecisions,rankReorders:baseline.rankReorders,
      pitActive:active.filter(v=>v.pitState!=='TRACK').length,
      completed:active.filter(v=>v.finished).length});
    }
    if(!accepted||window.mwsF1GetScreenStateV185()!=='RACE'){
     const terminal=window.mwsF1GetScreenStateV185();
     const view=document.getElementById('f1RacingViewFinishingV185');
     q.terminalSnapshot={screen:terminal,domScreen:document.getElementById('gameF1Racing')?.dataset.f1Screen||null,
      viewVisible:view?.hidden===false,officialRows:window.mwsF1GetRaceResultRecoveryG()?.rows?.length||0,
      finishOverlay:!!document.getElementById('f1RacingFinishOverlayV291'),simMs:clock};
     break;
    }
   }
   return {ticks:q.tick,state:window.mwsF1GetScreenStateV185(),clock:window.mwsF1GetSimulationClockV192().simTimeMs};
  },250);
  state=progress.state;ticks=progress.ticks;
 }
 const loopExitState=state;
 const observation=await page.evaluate(()=>{
  const q=window.__mwsR5bQa,standings=window.mwsF1ComputeRaceStandingsV191(),
   result=window.mwsF1GetRaceResultRecoveryG(),report=window.mwsF1UnifiedV11Report(),
   clock=window.mwsF1GetSimulationClockV192(),pit=window.mwsF1GetPitStatesV205();
  const screenBeforeRender=window.mwsF1GetScreenStateV185();
  window.mwsF1RenderRaceVehiclesV189(0);window.mwsF1RenderPitHudV361();
  const screenAfterRender=window.mwsF1GetScreenStateV185();
  return {track:window.mwsF1GetActiveRaceSnapshotV187()?.trackId,mode:window.mwsF1GetActiveRaceSnapshotV187()?.raceMode,
   laps:window.mwsF1GetActiveRaceSnapshotV187()?.totalLaps,
   simulatedSeconds:clock.simTimeMs/1000,screen:window.mwsF1GetScreenStateV185(),screenBeforeRender,screenAfterRender,
   originalGrid:window.mwsF1GetActiveRaceSnapshotV187()?.drivers.map(v=>({id:v.contactId,grid:v.gridPosition})),
   manualPitRequest:q.request,pitEvents:q.pitEvents,finishEvents:q.finishEvents,continuity:q.continuity,terminalSnapshot:q.terminalSnapshot||null,
   pauseChecked:q.pauseChecked,samples:q.samples,
   finalPitStates:pit,finishOrder:result?.rows?.map(r=>({id:r.contactId,rank:r.position,
     grid:r.gridPosition,pits:r.pitStopCount,finishedMs:r.finishedAtSimMs,lapTimesMs:r.lapTimesMs,bestLapMs:r.bestLapMs})),
   summary:result?.telemetry||null,
   physical:{collisionStops:report.collisionStops,invalid:report.invalid,
    confirmedPasses:report.passes?.length,rawCrossings:report.rawCrossings?.length,
    pitDecisions:report.pit?.length},
   screenQA:{markers:document.querySelectorAll('.f1-racing-race-vehicle-v189').length,
    profile:window.mwsF1QaDriverProfileMarkersV250().allPass,
    finishOverlay:!!document.getElementById('f1RacingFinishOverlayV291'),
    finishing:!!document.getElementById('f1RacingViewFinishingV185'),
    finishingVisible:document.getElementById('f1RacingViewFinishingV185')?.hidden===false,
    domScreen:document.getElementById('gameF1Racing')?.dataset.f1Screen||null},
   screenshotAvailable:true};
 });
 fs.mkdirSync('artifacts',{recursive:true});
 const output='artifacts/f1-v12-r5b-live-finish.json';
 fs.writeFileSync(output,JSON.stringify({status:'DIAGNOSTIC',version:'v1.2-R5-b1',loopExitState,scope:'Full LIVE FAST with explicit pit QA',...observation,pageErrors},null,2));
 console.log(JSON.stringify({phase:'R5-b1',loopExitState,screenBeforeRender:observation.screenBeforeRender,screenAfterRender:observation.screenAfterRender,screen:observation.screen,officialRows:observation.finishOrder?.length,finishEvents:observation.finishEvents.length,physics:observation.physical,clock:observation.simulatedSeconds}));
 assert.deepEqual(pageErrors,[],JSON.stringify(pageErrors));
 assert.equal(loopExitState,'FINISHING','LIVE step failed to complete natural finish. '+JSON.stringify({
  loopExitState,screenBeforeRender:observation.screenBeforeRender,screenAfterRender:observation.screenAfterRender,ticks,clock:observation.simulatedSeconds,finished:observation.finishEvents.length,
  pitEvents:observation.pitEvents.slice(-8)}));
 assert.equal(observation.finishOrder.length,12);
 assert.equal(observation.finishEvents.length,12);
 assert.deepEqual(observation.finishOrder.map(r=>r.rank),Array.from({length:12},(_,i)=>i+1));
 assert(observation.finishOrder.every(r=>Number.isFinite(r.finishedMs)&&r.finishedMs>0));
 assert(observation.finishOrder.every(r=>Array.isArray(r.lapTimesMs)&&r.lapTimesMs.length>=2),
  'Official completed finish missing lap timing');
 assert(observation.manualPitRequest,'Requested manual QA pit not accepted');
 const target=observation.finishOrder.find(r=>r.id===manualPitId);
 assert.equal(target.pits,1,'Manual pit did not service exactly once');
 assert.equal(observation.finalPitStates.find(r=>String(r.id)===manualPitId).compound,'HARD');
 const chain=observation.pitEvents.filter(e=>e.id===manualPitId).map(e=>e.to);
 assert.deepEqual(chain,['PIT_ENTRY','PIT_LANE','PIT_BOX','PIT_LANE','PIT_EXIT','TRACK'],
  'Real pit state machine not completed: '+JSON.stringify(chain));
 assert(observation.pitEvents.some(e=>e.id===manualPitId&&e.to==='PIT_BOX'&&e.speedKph===0));
 assert.equal(observation.continuity.length,0,JSON.stringify(observation.continuity.slice(0,3)));
 assert.equal(observation.physical.collisionStops,0);
 assert.deepEqual(observation.physical.invalid,[]);
 assert(observation.physical.confirmedPasses<=observation.physical.rawCrossings);
 assert(observation.pauseChecked&&observation.screenQA.profile&&observation.screenQA.markers===12);
 assert(observation.screenQA.finishOverlay);
 assert(observation.terminalSnapshot?.screen==='FINISHING'&&observation.terminalSnapshot?.domScreen==='FINISHING'&&
  observation.terminalSnapshot?.viewVisible===true&&observation.terminalSnapshot?.officialRows===12,
  'Natural FINISHING view and 12 official results were not present at accepted finish boundary');
 fs.writeFileSync(output,JSON.stringify({status:'PASS',version:'v1.2-R5-b1',scope:'One LIVE FAST 3-lap race, single real-SVG circuit; explicitly manual pit; not auto-strategy validation',loopExitState,
  knownIssues:observation.screen!==loopExitState?['FINISHING view reverts to '+observation.screen+' after the accepted finish boundary. Post-finish UI state regression remains unresolved and requires R5-b2.']:[],...observation},null,2));
 console.log(JSON.stringify({status:'PASS',version:'R5-b1',track:observation.track,mode:observation.mode,
  simulatedSeconds:observation.simulatedSeconds,finishers:observation.finishOrder.length,
  naturalFinishUi:observation.terminalSnapshot,postFinishStateMismatch:observation.screen!==loopExitState,
  manualPit:chain,physical:observation.physical,pauseChecked:true,finishTop3:observation.finishOrder.slice(0,3),artifact:output}));
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
