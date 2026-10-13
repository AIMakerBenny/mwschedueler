// Basic local Chromium integration, not a race-balance benchmark.
// Run: MWS_CHROME_PATH=/path/to/chrome node scripts/qa-f1-unified-v11-browser.mjs
// Requires playwright, optionally resolved through CODEX_PRIMARY_RUNTIME_NODE_MODULES.
import assert from 'node:assert/strict';
import {createF1PreviewServer} from './serve-f1-unified-v11-preview.mjs';
import {createRequire} from 'node:module';
import path from 'node:path';
let chromium;
try{({chromium}=await import('playwright'));}catch(error){
  if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;
  ({chromium}=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'_resolve.cjs'))('playwright'));
}
const port=Number(process.env.MWS_QA_PORT)||8766;
const server=createF1PreviewServer();
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
let browser;
try{
  await new Promise(resolve=>setTimeout(resolve,400));
  browser=await chromium.launch({headless:true,executablePath:process.env.MWS_CHROME_PATH||undefined,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof window.mwsF1UnifiedV11Report==='function');
  await page.waitForFunction(()=>document.getElementById('mwsLoginForm').dataset.mode==='admin');
  await page.locator('#mwsModePublic').click();
  await page.locator('#mwsLoginSubmit').click();
  try{await page.waitForFunction(()=>document.getElementById('mwsAccessGate').classList.contains('hidden'));}catch(error){console.error(await page.evaluate(()=>({error:document.getElementById('mwsLoginError').textContent,mode:document.getElementById('mwsLoginForm').dataset.mode,ready:window.__mwsCloudRuntimeV130Ready})));throw error;}
  const setup=await page.evaluate(()=>{
    const contacts=Array.from({length:12},(_,i)=>({id:'unified-browser-'+i,name:'QA Driver '+i,image:'',labels:['LOCAL QA']}));
    window.mwsGetF1ContactsV181=()=>contacts;
    const section=document.getElementById('gameF1Racing');
    document.querySelectorAll('.section').forEach(node=>node.classList.toggle('active',node===section));
    window.mwsRenderF1RacingV180();
    const tracks=window.mwsF1GetTrackCatalogV186();
    window.mwsF1SelectTrackV186(tracks[0].id);
    for(const c of contacts)window.mwsF1ToggleDriverV181(c.id);
    return {tracks:tracks.length,drivers:window.mwsF1GetSelectedContactIdsV181().length,started:window.mwsF1StartRaceFromSetupV187()};
  });
  assert.deepEqual(setup,{tracks:7,drivers:12,started:true});
  await page.waitForFunction(()=>window.mwsF1GetScreenStateV185()==='GRID');
  assert.equal(await page.evaluate(()=>window.mwsF1WaitGridRevealV273(20000)),true);
  await page.locator('#f1RacingGridStartRecoveryM').click();
  await page.waitForFunction(()=>window.mwsF1GetScreenStateV185()==='RACE');
  await page.waitForFunction(()=>window.mwsF1GetSimulationClockV192().simTimeMs>=30000||window.mwsF1UnifiedV11Report().invalid.length>0,null,{timeout:60000});
  assert.deepEqual(await page.evaluate(()=>window.mwsF1UnifiedV11Report().invalid),[]);
  const read=()=>page.evaluate(()=>({clock:window.mwsF1GetSimulationClockV192().simTimeMs,
    state:window.mwsF1ComputeRaceStandingsV191().map(r=>({id:r.vehicle.id,s:r.vehicle.raceProgress,y:r.vehicle.unifiedYV11,
      v:r.vehicle.speedKph,E:r.vehicle.batteryMJ,w:r.vehicle.tyreWear,T:r.vehicle.unifiedTempCV11,heading:r.vehicle.unifiedHeadingV11,metric:r.vehicle.unifiedPathMetricV11,world:r.vehicle.unifiedWorldPoseV11,
      rng:r.vehicle.unifiedRngV11,ai:r.vehicle.unifiedAiAtV11,skill:r.vehicle.specialUntilV401,
      transform:r.vehicle.marker?.getAttribute('transform')}))}));
  await page.locator('#f1RacingPauseV192').click();
  const before=await read();await page.waitForTimeout(400);const after=await read();
  assert.deepEqual(after,before,'Pause changed simulation or rendered position');
  const layouts=[];
  for(const viewport of [{width:1920,height:1080},{width:2560,height:1440}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(150);
    layouts.push(await page.evaluate(()=>({width:innerWidth,height:innerHeight,
      panels:document.querySelectorAll('[data-f1-workspace-panel]').length,
      overlap:window.mwsF1WorkspaceOverlapPairsRecoveryI(),
      markers:document.querySelectorAll('.f1-racing-race-vehicle-v189').length,
      profile:window.mwsF1QaDriverProfileMarkersV250().allPass,
      geometry:window.mwsF1UnifiedV11Report().screenGeometryWarnings,
      rings:window.mwsF1UnifiedV11Report().renderOverlaps})));
  }
  for(const layout of layouts){assert.equal(layout.markers,12);assert.deepEqual(layout.overlap,[]);assert.equal(layout.profile,true);}
  const physical=()=>page.evaluate(()=>JSON.stringify(window.mwsF1ComputeRaceStandingsV191().map(r=>({id:r.vehicle.id,s:r.vehicle.raceProgress,y:r.vehicle.unifiedYV11,v:r.vehicle.speedKph,E:r.vehicle.batteryMJ,w:r.vehicle.tyreWear,heading:r.vehicle.unifiedHeadingV11}))));
  const physicalBefore=await physical(),zooms=[];
  for(const mode of ['FULL','CLEARANCE','BATTLE','AUTO']){
    assert.equal(await page.evaluate(mode=>window.mwsF1SetRaceCameraModeV216(mode),mode),true);
    await page.waitForTimeout(100);
    zooms.push(await page.evaluate(()=>({camera:window.mwsF1GetRaceCameraStateV216(),fit:window.mwsF1UnifiedV11Report().screenFit})));
    assert.equal(await physical(),physicalBefore,'Camera mode changed physical state');
  }
  assert.equal(zooms[0].camera.zoom,1);
  assert.equal(zooms[1].camera.mode,'CLEARANCE');
  if(zooms[1].fit.supported)assert.equal(zooms[1].fit.currentPairs,0,'Feasible clearance focus still overlaps');
  else assert.equal(zooms[1].fit.minimumFeasibleZoom,null);
  assert.equal(await page.locator('[data-f1-camera-mode="CLEARANCE"]').count(),1);
  if(process.env.MWS_QA_SCREENSHOT)await page.screenshot({path:process.env.MWS_QA_SCREENSHOT});
  await page.locator('#f1RacingPauseV192').click();
  await page.waitForFunction(t=>window.mwsF1GetSimulationClockV192().simTimeMs>t,before.clock);
  // The exported legacy integrator must not add another motion step.
  const legacy=await page.evaluate(()=>{
    window.mwsF1ToggleSimulationPauseV192(true);
    const v=window.mwsF1ComputeRaceStandingsV191()[0].vehicle,old=[v.travel,v.speedKph,v.unifiedYV11];
    return {accepted:window.mwsF1SimulateVehicleDynamicsV196(v,20),unchanged:JSON.stringify(old)===JSON.stringify([v.travel,v.speedKph,v.unifiedYV11])};
  });
  assert.deepEqual(legacy,{accepted:false,unchanged:true});
  const incident=await page.evaluate(()=>{
    const v=window.mwsF1ComputeRaceStandingsV191()[0].vehicle,saved={...v};
    v.unifiedErrorUntilV11=0;v.unifiedErrorTypeV11='';
    const physical=JSON.stringify([v.travel,v.speedKph,v.unifiedYV11]),report=window.mwsF1UnifiedV11Report();
    const base=report.incidents.find(r=>r.id===String(v.id)).grip;
    const previousLog=window.mwsF1GetTechnicalCommentaryV263().length;
    const forced=window.mwsF1ForceDrivingIncidentV204(v.id,'UNDERSTEER',.85);
    const until=v.unifiedErrorUntilV11;
    const adapted=window.mwsF1UpdateDrivingIncidentsV204(v,1000000,'STRAIGHT');
    window.mwsF1UpdateRaceCommentaryV219(true);
    const live=window.mwsF1GetTechnicalCommentaryV263().slice(previousLog);
    const active=window.mwsF1GetDrivingIncidentStatesV204().find(r=>r.id===v.id).active;
    const grip=window.mwsF1UnifiedV11Report().incidents.find(r=>r.id===String(v.id)).grip;
    const result={forced,active,base,grip,adapted,clockPreserved:until===v.unifiedErrorUntilV11,
      physicalPreserved:physical===JSON.stringify([v.travel,v.speedKph,v.unifiedYV11]),live};
    for(const key of Object.keys(v))if(!(key in saved))delete v[key];Object.assign(v,saved);
    return result;
  });
  assert.equal(incident.forced.type,'UNDERSTEER');assert.equal(incident.active,'UNDERSTEER');
  assert(incident.grip<incident.base);assert(incident.clockPreserved&&incident.physicalPreserved);
  assert.equal(incident.adapted.speedFactor,1);assert(incident.live.some(row=>JSON.stringify(row).includes('언더스티어')));
  // Explicit service fixture, separate from the preceding unmodified LIVE drive.
  const pit=await page.evaluate(()=>{
    const v=window.mwsF1ComputeRaceStandingsV191()[0].vehicle;
    const count=v.pitStopCount;v.pitState='PIT_BOX';v.pitBoxTimerMs=40;
    v.pitTargetCompound='HARD';v.tyreWear=.9;v.speedKph=0;
    window.mwsF1ToggleSimulationPauseV192(false);
    const steps=[window.mwsF1SimulateRaceStepV192(20),window.mwsF1SimulateRaceStepV192(20)];
    window.mwsF1ToggleSimulationPauseV192(true);window.mwsF1UpdateRaceProgressHudV190();
    return {steps,compound:v.tyreCompound,wear:v.tyreWear,temp:v.unifiedTempCV11,
      serviced:v.pitStopCount===count+1,state:v.pitState,hud:!!document.getElementById('f1RacingPitHudV361')};
  });
  assert.deepEqual(pit.steps,[true,true]);assert.equal(pit.compound,'HARD');
  assert(pit.wear<.001);assert(pit.temp>=89&&pit.temp<=91);assert(pit.serviced&&pit.hud);assert.equal(pit.state,'PIT_LANE');
  // Full pit journey from explicit, separated initial conditions, using real adapters.
  const pitJourney=await page.evaluate(initialState=>{
    const cars=window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle),track=window.mwsGetF1TrackV182(window.mwsF1GetTrackCatalogV186()[0].id);
    if(initialState==='FIXED')cars.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    const saved=cars.map(v=>({v,state:{...v}})),v=cars[0],len=track.lengthMeters;
    cars.forEach((car,i)=>{
      car.startOffset=track.pit.entry-(400+i*120)/len;car.travel=0;car.raceProgress=car.startOffset;
      car.progress=((car.raceProgress%1)+1)%1;car.speedKph=144;car.pitState='TRACK';car.pitRequested=false;
      car.pitServiced=false;
      if(initialState==='FIXED'){car.tyreCompound='MEDIUM';car.tyreWear=.1;car.unifiedTempCV11=100;
      car.tyreWarmupFactor=1;car.pitWarmupRemainingLaps=0;car.unifiedRngV11=(i+1)*7919;car.driverRandomState=(i+1)*104729;car.unifiedFormV11=1;
      car.unifiedErrorUntilV11=0;car.unifiedErrorCooldownV11=0;car.unifiedErrorTypeV11='';}
      car.specialUsesV401=2;car.unifiedPitEvalAtV11=1e9;car.unifiedDetectionV11={};
      car.unifiedYV11=0;car.unifiedVyV11=0;car.unifiedAyV11=0;car.unifiedAiAtV11=0;car.unifiedIntentUntilV11=0;
      delete car.unifiedHeadingV11;delete car.unifiedPitStopProgressV11;
    });
    v.racingLineMode='OUTSIDE';
    const requested=window.mwsF1RequestPitStopV205(v.id,'HARD','MANUAL_QA');
    const events=[],count=v.pitStopCount;let previous=v.pitState,maxAcceleration=0,steps=0,boxDrift=0,boxStart=null,boxMoving=false;
    window.mwsF1ToggleSimulationPauseV192(false);
    for(let i=0;i<7000;i++){
      const oldSpeed=v.speedKph,oldProgress=v.raceProgress;
      if(!window.mwsF1SimulateRaceStepV192(20))break;
      steps++;maxAcceleration=Math.max(maxAcceleration,Math.abs(v.speedKph-oldSpeed)/3.6/.02);
      if(v.pitState!==previous){events.push({state:v.pitState,s:v.raceProgress,speed:v.speedKph,ms:window.mwsF1GetSimulationClockV192().simTimeMs});previous=v.pitState;}
      if(v.pitState==='PIT_BOX'){
        if(boxStart===null)boxStart=v.raceProgress;
        boxDrift=Math.max(boxDrift,Math.abs(v.raceProgress-boxStart)*len);boxMoving ||= v.speedKph!==0;
      }
      if(v.pitStopCount>count&&v.pitState==='TRACK')break;
    }
    window.mwsF1ToggleSimulationPauseV192(true);
    const result={initialState,requested,steps,events,maxAcceleration,boxDrift,boxMoving,serviced:v.pitStopCount===count+1,
      compound:v.tyreCompound,restoredLine:v.racingLineMode,finalState:v.pitState,finalProgress:v.raceProgress,finalSpeed:v.speedKph,boxTarget:v.unifiedPitStopProgressV11,errors:window.mwsF1UnifiedV11Report().invalid};
    // Restore test initialisation before checking existing finish/return flows.
    for(const {v,state} of saved){for(const key of Object.keys(v))if(!(key in state))delete v[key];Object.assign(v,state);}
    return result;
  },process.env.MWS_QA_PIT_INITIAL_STATE||'FIXED');
  assert(pitJourney.requested&&pitJourney.serviced,JSON.stringify(pitJourney));assert.equal(pitJourney.finalState,'TRACK',JSON.stringify(pitJourney));
  assert.deepEqual(pitJourney.events.map(e=>e.state),['PIT_ENTRY','PIT_LANE','PIT_BOX','PIT_LANE','PIT_EXIT','TRACK']);
  assert(pitJourney.events[0].speed<=80+1e-6);
  assert.equal(pitJourney.boxMoving,false);assert.equal(pitJourney.boxDrift,0);assert(pitJourney.maxAcceleration<40);
  assert.equal(pitJourney.compound,'HARD');assert.equal(pitJourney.restoredLine,'OUTSIDE');assert.deepEqual(pitJourney.errors,[]);
  const report=await page.evaluate(()=>window.mwsF1UnifiedV11Report());
  assert.deepEqual(report.invalid,[]);assert(report.steps>0);
  assert.equal(await page.evaluate(()=>window.mwsF1ForceFinishRecoveryG()),true);
  const finish=await page.evaluate(()=>({overlay:!!document.getElementById('f1RacingFinishOverlayV291'),
    podium:document.querySelectorAll('#f1RacingFinishOverlayPodiumV291 .place').length}));
  assert.equal(finish.overlay,true);assert.equal(finish.podium,3);
  await page.evaluate(()=>window.mwsF1ReturnToSetupRecoveryG());
  assert.equal(await page.evaluate(()=>window.mwsF1GetScreenStateV185()),'SETUP');
  assert.equal(await page.evaluate(()=>window.mwsF1GetSelectedContactIdsV181().length),12);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',setup,layouts,zooms,pauseResume:true,legacyGuard:true,incident,pit,pitJourney,finish,
    simulationSeconds:report.steps*.02,physicalStops:report.collisionStops,
    warning:'Short UI integration only. Ring geometry warnings are not a zero-overlap result.'},null,2));
}finally{await browser?.close();server.close();}
