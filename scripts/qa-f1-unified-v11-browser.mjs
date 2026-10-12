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
  await page.waitForFunction(()=>window.mwsF1GetSimulationClockV192().simTimeMs>=30000);
  const read=()=>page.evaluate(()=>({clock:window.mwsF1GetSimulationClockV192().simTimeMs,
    state:window.mwsF1ComputeRaceStandingsV191().map(r=>({id:r.vehicle.id,s:r.vehicle.raceProgress,y:r.vehicle.unifiedYV11,
      v:r.vehicle.speedKph,E:r.vehicle.batteryMJ,w:r.vehicle.tyreWear,T:r.vehicle.unifiedTempCV11,
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
  console.log(JSON.stringify({result:'PASS',setup,layouts,pauseResume:true,legacyGuard:true,pit,finish,
    simulationSeconds:report.steps*.02,physicalStops:report.collisionStops,
    warning:'Short UI integration only. Ring geometry warnings are not a zero-overlap result.'},null,2));
}finally{await browser?.close();server.close();}
