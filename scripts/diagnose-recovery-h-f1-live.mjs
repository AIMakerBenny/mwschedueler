import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE=process.env.MWS_RECOVERY_H_BASE||'https://mawang-scheduler.majoku.workers.dev';
const candidates=['google-chrome','google-chrome-stable','chromium','chromium-browser'];
let chrome='';
for(const candidate of candidates){
  const found=spawnSync('which',[candidate],{encoding:'utf8'});
  if(found.status===0&&found.stdout.trim()){chrome=found.stdout.trim();break}
}
if(!chrome)throw new Error('Recovery H live browser QA requires Chrome/Chromium');

const profile=mkdtempSync(path.join(os.tmpdir(),'mws-recovery-h-'));
const port=9444;
const child=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-default-apps','--disable-extensions',
  `--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,
  '--window-size=1920,1080','about:blank'
],{stdio:'ignore'});

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function json(url,init){
  const response=await fetch(url,init);
  if(!response.ok)throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}
async function waitDebugger(){
  let last;
  for(let i=0;i<100;i++){
    try{return await json(`http://127.0.0.1:${port}/json/version`)}
    catch(error){last=error;await sleep(120)}
  }
  throw last||new Error('Chrome DevTools endpoint did not start');
}
class Cdp{
  constructor(url){this.nextId=1;this.pending=new Map();this.listeners=new Map();this.ws=new WebSocket(url)}
  async open(){
    if(this.ws.readyState!==WebSocket.OPEN)await new Promise((resolve,reject)=>{
      this.ws.addEventListener('open',resolve,{once:true});
      this.ws.addEventListener('error',reject,{once:true});
    });
    this.ws.addEventListener('message',event=>{
      const message=JSON.parse(String(event.data));
      if(message.id){
        const pending=this.pending.get(message.id);if(!pending)return;
        this.pending.delete(message.id);
        if(message.error)pending.reject(new Error(message.error.message||JSON.stringify(message.error)));
        else pending.resolve(message.result);
        return;
      }
      for(const listener of this.listeners.get(message.method)||[])listener(message.params||{});
    });
  }
  send(method,params={}){
    const id=this.nextId++;
    return new Promise((resolve,reject)=>{
      this.pending.set(id,{resolve,reject});
      this.ws.send(JSON.stringify({id,method,params}));
    });
  }
  once(method,timeout=20000){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error(`Timeout waiting for ${method}`)),timeout);
      const fn=params=>{
        clearTimeout(timer);
        this.listeners.set(method,(this.listeners.get(method)||[]).filter(x=>x!==fn));
        resolve(params);
      };
      this.listeners.set(method,[...(this.listeners.get(method)||[]),fn]);
    });
  }
  close(){try{this.ws.close()}catch(_){}}
}
async function evaluate(cdp,expression,label){
  const result=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails)throw new Error(label+' browser exception: '+(result.exceptionDetails.exception?.description||result.exceptionDetails.text||'unknown'));
  return result.result?.value;
}

let cdp;
try{
  await waitDebugger();
  const pages=await json(`http://127.0.0.1:${port}/json`);
  const page=pages.find(row=>row.type==='page');
  if(!page?.webSocketDebuggerUrl)throw new Error('No debuggable Chrome page');
  cdp=new Cdp(page.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});

  const loaded=cdp.once('Page.loadEventFired',30000);
  await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1=${Date.now()}`});
  await loaded;
  await sleep(1800);

  const baseline=await evaluate(cdp,`(async()=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const assert=(condition,message)=>{if(!condition)throw new Error(message)};
    window.__recoveryHErrors=[];
    window.addEventListener('error',event=>window.__recoveryHErrors.push('error:'+String(event.message||event.error||'')));
    window.addEventListener('unhandledrejection',event=>window.__recoveryHErrors.push('rejection:'+String(event.reason||'')));

    const gate=document.getElementById('mwsAccessGate');
    if(gate)gate.style.setProperty('display','none','important');
    document.body.classList.remove('mws-gated');
    document.body.dataset.resolution='fhd';
    document.body.dataset.deviceMode='pc';
    try{window.dispatchEvent(new Event('mws:app-ready'))}catch(_){}
    await sleep(2200);

    const section=document.getElementById('gameF1Racing');
    assert(section,'F1 section missing');
    document.querySelectorAll('.section').forEach(node=>node.classList.toggle('active',node===section));

    assert(typeof window.mwsRenderF1RacingV180==='function','F1 renderer missing');
    let contacts=typeof window.mwsGetF1ContactsV181==='function'?window.mwsGetF1ContactsV181():[];
    let synthetic=false;
    if(!Array.isArray(contacts)||contacts.length<2){
      synthetic=true;
      contacts=[
        {id:'recovery-h-alpha',name:'Recovery H Alpha',image:'',labels:['QA']},
        {id:'recovery-h-bravo',name:'Recovery H Bravo',image:'',labels:['QA']},
        {id:'recovery-h-charlie',name:'Recovery H Charlie',image:'',labels:['QA']}
      ];
      window.mwsGetF1ContactsV181=()=>contacts;
    }
    window.mwsRenderF1RacingV180();
    await raf();

    document.getElementById('f1RacingClearDriversV181')?.click();
    await raf();

    const tracks=window.mwsF1GetTrackCatalogV186?.()||[];
    assert(tracks.length>=3,'Expected at least 3 F1 tracks, found '+tracks.length);
    const targetTrack=tracks[1]||tracks[0];
    assert(window.mwsF1SelectTrackV186?.(targetTrack.id)===true,'Could not select QA track');
    const driverIds=contacts.slice(0,2).map(row=>String(row.id));
    for(const id of driverIds)window.mwsF1ToggleDriverV181?.(id);
    await raf();

    const selected=window.mwsF1GetSelectedContactIdsV181?.()||[];
    assert(selected.length>=2,'Participant selection did not reach 2 drivers');
    assert(String(window.mwsF1GetActiveTrackV182?.()?.id||'')===String(targetTrack.id),'Selected track not active');

    const activeTrackModel=window.mwsF1GetActiveTrackV182?.();
    const threshold=Math.max(.00001,Number(activeTrackModel?.geometry?.cornerCurvatureThreshold)||.0018);
    const maxStraight=Number(activeTrackModel?.geometry?.maxStraightKph)||320;
    const mildZone=(activeTrackModel?.zones||[]).find(zone=>String(zone.type||'').toLowerCase()==='fastcorner')||(activeTrackModel?.zones||[]).find(zone=>String(zone.type||'').toLowerCase()==='mediumcorner');
    const sharpZone=(activeTrackModel?.zones||[]).find(zone=>String(zone.type||'').toLowerCase()==='hairpin')||(activeTrackModel?.zones||[]).find(zone=>String(zone.type||'').toLowerCase()==='slowcorner');
    assert(mildZone&&sharpZone,'Recovery L QA zones missing');
    const mildProgress=(Number(mildZone.start)+Number(mildZone.end))/2;
    const sharpProgress=(Number(sharpZone.start)+Number(sharpZone.end))/2;
    const mildLimit=window.mwsF1CurvatureWeightedZoneLimitRecoveryL?.(activeTrackModel,{progress:mildProgress,curvatureRadPerMeter:threshold*.60},maxStraight);
    const sharpLimit=window.mwsF1CurvatureWeightedZoneLimitRecoveryL?.(activeTrackModel,{progress:sharpProgress,curvatureRadPerMeter:threshold*3.0},maxStraight);
    assert(Number(mildLimit)>maxStraight*.84,'Recovery L gentle bend still over-slows: '+mildLimit);
    assert(Number(sharpLimit)<Number(mildLimit)-100,'Recovery L curvature speed separation too small: mild='+mildLimit+' sharp='+sharpLimit);

    const setupLine=document.querySelector('#f1RacingTrackAnnotationsV183 [data-f1-start-finish="1"]');
    const setupStripe=setupLine?.querySelector('.finish-stripe');
    assert(setupLine&&setupStripe,'Setup Start / Finish line missing');
    const setupLength=Math.hypot(
      Number(setupStripe.getAttribute('x2'))-Number(setupStripe.getAttribute('x1')),
      Number(setupStripe.getAttribute('y2'))-Number(setupStripe.getAttribute('y1'))
    );
    assert(setupLength>20,'Setup Start / Finish line too short');

    assert(window.mwsF1StartRaceFromSetupV187?.()===true,'Race preparation failed');
    await sleep(1200);
    await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='GRID','Race started before explicit grid start click');
    assert(Number(window.mwsF1GetSimulationClockV192?.().simTimeMs||0)===0,'Simulation advanced before explicit grid start click');
    const manualStart=document.getElementById('f1RacingGridStartRecoveryM');
    assert(manualStart,'Explicit grid start button missing');
    manualStart.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='RACE','Explicit grid start click did not enter RACE');

    const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
    assert(workspace,'Race workspace missing');
    const panelIds=['timing','track','commentary','radio','speed'];
    for(const id of panelIds)assert(document.querySelector('[data-f1-workspace-panel="'+id+'"]'),'Workspace panel missing: '+id);

    const visible=panelIds.filter(id=>{
      const panel=document.querySelector('[data-f1-workspace-panel="'+id+'"]');
      return panel&&!panel.hidden&&getComputedStyle(panel).display!=='none';
    });
    assert(visible.includes('timing')&&visible.includes('track')&&visible.includes('commentary')&&visible.includes('radio'),'Default visible workspace panels incorrect: '+visible.join(','));
    assert(!visible.includes('speed'),'Speed Trap should start as inactive tab');

    const wr=workspace.getBoundingClientRect();
    const timing=document.querySelector('[data-f1-workspace-panel="timing"]').getBoundingClientRect();
    const track=document.querySelector('[data-f1-workspace-panel="track"]').getBoundingClientRect();
    const commentary=document.querySelector('[data-f1-workspace-panel="commentary"]').getBoundingClientRect();
    const radio=document.querySelector('[data-f1-workspace-panel="radio"]').getBoundingClientRect();
    const coverage=(timing.width*timing.height+track.width*track.height+commentary.width*commentary.height+radio.width*radio.height)/Math.max(1,wr.width*wr.height);
    assert(wr.width>1000&&wr.height>500,'Workspace geometry too small');
    assert(timing.width>wr.width*.9,'Live Timing is not full-width');
    assert(track.width*track.height>commentary.width*commentary.height*1.6,'Track Map is not dominant in default layout');
    assert(coverage>.68,'Workspace visible coverage too low: '+coverage.toFixed(3));

    const raceLine=document.querySelector('#f1RacingRaceAnnotationsRecoveryB [data-f1-start-finish="1"]');
    const raceStripe=raceLine?.querySelector('.finish-stripe');
    assert(raceLine&&raceStripe,'Race Start / Finish line missing');

    section.scrollIntoView({block:'start'});
    await raf();

    window.__recoveryHContext={driverIds,targetTrackId:String(targetTrack.id),synthetic,curvatureSpeedQa:{mildLimit:Number(mildLimit)||0,sharpLimit:Number(sharpLimit)||0}};
    return {
      tracks:tracks.map(row=>row.id),
      targetTrackId:String(targetTrack.id),
      selected,
      setupLineLength:Number(setupLength.toFixed(2)),
      visible,
      workspace:{width:Number(wr.width.toFixed(1)),height:Number(wr.height.toFixed(1)),coverage:Number(coverage.toFixed(3))},
      panelAreas:{timing:Math.round(timing.width*timing.height),track:Math.round(track.width*track.height),commentary:Math.round(commentary.width*commentary.height),radio:Math.round(radio.width*radio.height)},
      state:window.mwsF1GetScreenStateV185?.(),
      errors:[...(window.__recoveryHErrors||[])]
    };
  })()`,'Recovery H baseline');

  const shot=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:58,fromSurface:true,captureBeyondViewport:false});
  console.log('RECOVERY_H_SCREENSHOT_JPEG_BASE64='+String(shot.data||''));

  const interaction=await evaluate(cdp,`(async()=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const assert=(condition,message)=>{if(!condition)throw new Error(message)};
    const context=window.__recoveryHContext||{};
    const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
    assert(workspace,'Workspace disappeared');
    const domOverlapPairs=()=>{
      const panels=Array.from(workspace.querySelectorAll('[data-f1-workspace-panel]')).filter(panel=>!panel.hidden&&getComputedStyle(panel).display!=='none');
      const rows=[];
      for(let i=0;i<panels.length;i++){
        const a=panels[i].getBoundingClientRect();
        for(let j=i+1;j<panels.length;j++){
          const b=panels[j].getBoundingClientRect();
          const width=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
          const height=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
          const area=width*height;
          if(area>1)rows.push({a:panels[i].dataset.f1WorkspacePanel,b:panels[j].dataset.f1WorkspacePanel,area:Number(area.toFixed(2))});
        }
      }
      return rows;
    };
    const assertNoDomOverlap=label=>{
      const pairs=domOverlapPairs();
      assert(pairs.length===0,label+' DOM panel overlap: '+JSON.stringify(pairs));
      assert((window.mwsF1WorkspaceOverlapPairsRecoveryI?.()||[]).length===0,label+' grid overlap');
      return pairs;
    };
    assertNoDomOverlap('baseline');

    const pause=document.getElementById('f1RacingPauseV192');
    assert(pause,'Pause button missing');
    pause.click();await raf();
    assert(window.mwsF1GetSimulationClockV192?.().paused===true,'Pause button did not pause simulation');
    const incidentDriver=context.driverIds?.[0];
    const tyreBefore=(window.mwsF1GetTyreStatesV203?.()||[]).find(row=>String(row.id)===String(incidentDriver));
    const forcedIncident=window.mwsF1ForceDrivingIncidentV204?.(incidentDriver,'LOCK_UP',.9);
    window.mwsF1RenderRaceVehiclesV189?.();await raf();
    const incidentAfter=(window.mwsF1GetDrivingIncidentStatesV204?.()||[]).find(row=>String(row.id)===String(incidentDriver));
    const incidentMarker=document.querySelector('.f1-racing-race-vehicle-v189[data-driver-id="'+CSS.escape(String(incidentDriver))+'"]');
    assert(forcedIncident?.type==='LOCK_UP','Phase 204 forced lock-up failed');
    assert((incidentAfter?.lockupActiveMs||0)>0,'Phase 204 lock-up timer missing');
    assert((incidentAfter?.tyreFlatSpot||0)>(tyreBefore?.flatSpot||0),'Phase 204 lock-up did not add flat spot');
    assert(incidentMarker?.dataset.incident==='LOCK_UP','Phase 204 marker did not expose lock-up state');
    const pitCycle=window.mwsF1QaPitCycleV205?.(incidentDriver,'SOFT');
    window.mwsF1RenderRaceVehiclesV189?.();await raf();
    const pitAfter=(window.mwsF1GetPitStatesV205?.()||[]).find(row=>String(row.id)===String(incidentDriver));
    assert(Array.isArray(pitCycle?.states)&&pitCycle.states.join('>')==='PIT_ENTRY>PIT_LANE>PIT_BOX>PIT_LANE>PIT_EXIT>TRACK','Phase 205 pit state sequence failed');
    assert(Number(pitCycle?.laneSpeedCapKph)===Number(window.mwsF1GetActiveRaceSnapshotV187?.()?.track?.pit?.speedLimitKph),'Phase 205 pit limiter cap mismatch');
    assert(pitAfter?.compound==='SOFT'&&Number(pitAfter?.stopCount)>=1,'Phase 205 tyre service failed');
    assert(Number(pitAfter?.tyreWarmupFactor)<1&&Number(pitAfter?.warmupRemainingLaps)>0,'Phase 205 tyre warmup state missing');
    const strategyDriver=context.driverIds?.[1]||incidentDriver;
    const strategyQa=window.mwsF1QaPitStrategyV206?.(strategyDriver,'BOX_NOW');
    assert(strategyQa?.decision==='BOX_NOW','Phase 206 critical tyre strategy did not choose BOX_NOW');
    assert(strategyQa?.pitRequested===true&&strategyQa?.requestReason==='BOX_NOW','Phase 206 BOX_NOW did not issue Phase 205 pit request');
    assert(['SOFT','MEDIUM','HARD'].includes(strategyQa?.targetCompound),'Phase 206 target compound invalid');
    assert(Number(strategyQa?.context?.pressure)>=.8&&Number(strategyQa?.context?.tyreNeed)>.5,'Phase 206 strategy did not expose tyre evidence');
    const trafficQa=window.mwsF1QaTrafficV207?.();
    assert(trafficQa?.follower?.state==='PRESSURE','Phase 207 follower did not enter PRESSURE');
    assert(Number(trafficQa?.follower?.gapMeters)<20&&Number(trafficQa?.follower?.closingRateKph)>0,'Phase 207 traffic gap or closing rate invalid');
    assert(trafficQa?.follower?.lineIntent==='ATTACK_INSIDE','Phase 207 attacker did not choose inside line');
    assert(trafficQa?.ahead?.defenceActive===true&&trafficQa?.ahead?.lineIntent==='DEFENSIVE_INSIDE','Phase 207 defender did not react to pressure');
    const passQa=window.mwsF1QaPassStateMachineV208?.();
    const expectedPassSequence=['FOLLOWING','CLOSING','TOWING','PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK','PASS_COMPLETED'];
    assert(JSON.stringify(passQa?.sequence)===JSON.stringify(expectedPassSequence),'Phase 208 pass state sequence mismatch: '+JSON.stringify(passQa?.sequence));
    assert(passQa?.failed==='PASS_FAILED','Phase 208 pass failure branch missing');
    assert(passQa?.states?.includes('LATE_BRAKING')===false&&passQa?.states?.includes('BRAKING_DUEL'),'Phase 208 braking duel state contract invalid');
    const longRunQa=window.mwsF1QaLongRunGapBalanceV209?.();
    assert(longRunQa?.vehicleCount===5,'Phase 209 long-run QA vehicle set missing');
    assert(longRunQa?.nonUniform===true,'Phase 209 flattened all driver pace');
    assert(longRunQa?.gapDependency===false,'Phase 209 introduced gap-based rubber banding');
    assert(Number(longRunQa?.settledBiasSpread)<Number(longRunQa?.openingBiasSpread),'Phase 209 did not reduce persistent base pace spread');
    assert(Number(longRunQa?.paceOnlyThirtyLapSpreadSeconds)<=14,'Phase 209 pace-only 30-lap spread too large: '+String(longRunQa?.paceOnlyThirtyLapSpreadSeconds));
    assert(longRunQa?.systemsConnected===true,'Phase 209 disconnected tyre/pit/traffic/pass systems');
    const multiTrackQa=window.mwsF1QaMultiTrackIntegrationV210?.();
    assert(multiTrackQa?.trackCount===3,'Phase 210 track catalog count mismatch: '+String(multiTrackQa?.trackCount));
    assert(JSON.stringify(multiTrackQa?.ids)===JSON.stringify(['majoku-ring-v1','castle-street-circuit-v1','blue-coast-speedway-v1']),'Phase 210 track ids mismatch: '+JSON.stringify(multiTrackQa?.ids));
    assert(multiTrackQa?.allPass===true,'Phase 210 multi-track integration failed: '+JSON.stringify(multiTrackQa?.tracks));
    assert(multiTrackQa?.tracks?.every(row=>row.snapshotReady&&row.geometryReady&&row.pitReady&&row.overtakeReady&&row.renderingReady&&row.dynamicsReady&&row.trafficPassReady),'Phase 210 subsystem coverage incomplete');
    const markerQa=window.mwsF1QaTrackMarkersV211?.();
    assert(markerQa?.trackCount===3&&markerQa?.allPass===true,'Phase 211 marker integration failed: '+JSON.stringify(markerQa));
    const raceMarkerText=String(document.getElementById('f1RacingRaceAnnotationsRecoveryB')?.textContent||'');
    assert(raceMarkerText.includes('START / FINISH')&&raceMarkerText.includes('PIT IN')&&raceMarkerText.includes('PIT OUT')&&raceMarkerText.includes('OVT D1'),'Phase 211 Race Control markers incomplete: '+raceMarkerText);
    const flipQa=window.mwsF1QaLiveTimingFlipV212?.();
    assert(flipQa?.allPass===true&&Number(flipQa?.domRows)>=2,'Phase 212 FLIP live timing QA failed: '+JSON.stringify(flipQa));
    const topThreeQa=window.mwsF1QaTopThreePresentationV213?.();
    assert(topThreeQa?.allPass===true,'Phase 213 top-three presentation failed: '+JSON.stringify(topThreeQa));
    const flagQa=window.mwsF1QaRaceControlFlagsV214?.();
    assert(flagQa?.allPass===true,'Phase 214 race control flag engine failed: '+JSON.stringify(flagQa));
    assert(window.mwsF1SetRaceControlFlagV214?.('YELLOW','QA')===true,'Phase 214 Yellow Flag setter failed');
    assert(window.mwsF1GetRaceControlFlagV214?.().flag==='YELLOW','Phase 214 Yellow Flag state missing');
    assert(window.mwsF1SetRaceControlFlagV214?.('GREEN','')===true,'Phase 214 Green Flag restore failed');
    const blueQa=window.mwsF1QaBackmarkerBlueFlagV215?.();
    assert(blueQa?.allPass===true,'Phase 215 backmarker/blue flag QA failed: '+JSON.stringify(blueQa));
    const cameraQa=window.mwsF1QaDriverMarkerCameraV216?.();
    assert(cameraQa?.allPass===true&&Number(cameraQa?.paletteCount)>=8,'Phase 216 marker/camera QA failed: '+JSON.stringify(cameraQa));
    const markerColors=Array.from(document.querySelectorAll('.f1-racing-race-vehicle-v189')).map(node=>node.style.getPropertyValue('--f1-driver-color')).filter(Boolean);
    assert(new Set(markerColors).size===markerColors.length&&markerColors.length>=2,'Phase 216 driver markers are not uniquely colored: '+JSON.stringify(markerColors));
    assert(window.mwsF1SetRaceCameraModeV216?.('AUTO')===true,'Phase 216 auto camera enable failed');
    const mapStage=document.querySelector('#f1RacingWorkspaceRecoveryE .f1-racing-race-map-stage-v188');
    assert(mapStage,'Phase 216 race map stage missing');
    const mapRect=mapStage.getBoundingClientRect();
    mapStage.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:-120,clientX:mapRect.left+mapRect.width/2,clientY:mapRect.top+mapRect.height/2}));
    await raf();
    assert(window.mwsF1GetRaceCameraStateV216?.().mode==='MANUAL','Phase 216 wheel did not disable automatic camera');
    assert(window.mwsF1SetRaceCameraModeV216?.('AUTO')===true,'Phase 216 auto camera restore failed');
    pause.click();await raf();
    assert(window.mwsF1GetSimulationClockV192?.().paused===false,'Pause button did not resume simulation');

    const trackPanel=document.querySelector('[data-f1-workspace-panel="track"]');
    const maxButton=trackPanel?.querySelector('[data-f1-workspace-action="maximize"]');
    assert(maxButton,'Track maximize control missing');
    maxButton.click();await raf();
    assert(workspace.dataset.maximized==='track'&&trackPanel.classList.contains('is-maximized'),'Track maximize failed');
    trackPanel.querySelector('[data-f1-workspace-action="maximize"]')?.click();await raf();
    assert(!workspace.dataset.maximized,'Track restore failed');

    const beforeResize=window.mwsF1GetWorkspaceLayoutRecoveryE?.().panels.track;
    const resize=trackPanel.querySelector('[data-f1-workspace-resize]');
    assert(resize,'Track resize handle missing');
    const rr=resize.getBoundingClientRect();
    resize.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:rr.left+5,clientY:rr.top+5,pointerId:1,buttons:1}));
    window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:rr.left+Math.max(100,workspace.clientWidth/12),clientY:rr.top+80,pointerId:1,buttons:1}));
    window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:rr.left+Math.max(100,workspace.clientWidth/12),clientY:rr.top+80,pointerId:1,buttons:0}));
    await raf();
    const afterResize=window.mwsF1GetWorkspaceLayoutRecoveryE?.().panels.track;
    assert(afterResize.w!==beforeResize.w||afterResize.h!==beforeResize.h,'Pointer resize did not change Track panel size');
    assertNoDomOverlap('after resize');

    document.getElementById('f1RacingWorkspaceResetRecoveryE')?.click();await raf();
    const speedTab=document.querySelector('[data-f1-workspace-tab="speed"]');
    assert(speedTab,'Speed Trap tab control missing');
    speedTab.click();await raf();
    const speedPanel=document.querySelector('[data-f1-workspace-panel="speed"]');
    const radioPanel=document.querySelector('[data-f1-workspace-panel="radio"]');
    assert(!speedPanel.hidden&&radioPanel.hidden,'Tab switching Radio -> Speed Trap failed');
    assertNoDomOverlap('after tab switch');

    document.getElementById('f1RacingWorkspaceResetRecoveryE')?.click();await raf();
    const commentary=document.querySelector('[data-f1-workspace-panel="commentary"]');
    const title=commentary?.querySelector('[data-f1-panel-drag="commentary"]');
    assert(title,'Commentary drag handle missing');
    let tr=title.getBoundingClientRect(),wr=workspace.getBoundingClientRect();

    title.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:tr.left+40,clientY:tr.top+12,pointerId:20,buttons:1}));
    window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:wr.left+wr.width*.5,clientY:wr.top+wr.height*.45,pointerId:20,buttons:1}));
    window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:wr.left+wr.width*.5,clientY:wr.top+wr.height*.45,pointerId:20,buttons:0}));
    await raf();
    const centerDocked=window.mwsF1GetWorkspaceLayoutRecoveryE?.().panels.commentary;
    assert(centerDocked.x===4&&centerDocked.w===4,'Recovery N Commentary did not dock to center third: '+JSON.stringify(centerDocked));
    const centerLayout=window.mwsF1GetWorkspaceLayoutRecoveryE?.();
    const centerXs=Object.entries(centerLayout?.panels||{}).filter(([,row])=>!row.hidden).map(([,row])=>Number(row.x));
    assert(centerXs.includes(0)&&centerXs.includes(8),'Recovery N remaining panels did not redistribute to left and right columns: '+centerXs.join(','));
    assertNoDomOverlap('after center dock');

    document.getElementById('f1RacingWorkspaceResetRecoveryE')?.click();await raf();
    tr=title.getBoundingClientRect();wr=workspace.getBoundingClientRect();
    title.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:tr.left+40,clientY:tr.top+12,pointerId:2,buttons:1}));
    window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:wr.left+3,clientY:wr.top+wr.height*.45,pointerId:2,buttons:1}));
    window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:wr.left+3,clientY:wr.top+wr.height*.45,pointerId:2,buttons:0}));
    await raf();
    const docked=window.mwsF1GetWorkspaceLayoutRecoveryE?.().panels.commentary;
    assert(docked.x===0&&docked.w>=4,'Pointer drag did not dock Commentary left');
    assert((window.mwsF1WorkspaceOverlapPairsRecoveryI?.()||[]).length===0,'Workspace overlap after Commentary dock');
    assertNoDomOverlap('after dock');

    document.getElementById('f1RacingWorkspaceResetRecoveryE')?.click();await raf();
    assertNoDomOverlap('after reset');
    const persisted=window.mwsGetF1RacingSettingsRecoveryD?.()?.workspaceLayout;
    assert(Number(persisted?.version)>=4,'Workspace layout did not persist as repaired schema');
    const malformed={version:3,panels:{
      timing:{x:0,y:0,w:12,h:3,hidden:false,maximized:false,tabGroup:''},
      track:{x:0,y:0,w:7,h:6,hidden:false,maximized:false,tabGroup:''},
      commentary:{x:0,y:0,w:5,h:4,hidden:false,maximized:false,tabGroup:''},
      radio:{x:0,y:0,w:5,h:3,hidden:false,maximized:false,tabGroup:''},
      speed:{x:0,y:0,w:5,h:3,hidden:false,maximized:false,tabGroup:''}
    },activeTabs:{}};
    const repaired=window.mwsF1AuditWorkspaceLayoutRecoveryK?.(malformed);
    assert(repaired&&repaired.overlaps.length===0,'Malformed saved layout was not repaired');
    assert(repaired.repaired===true,'Malformed saved layout repair was not reported');

    document.getElementById('f1RacingRaceCancelRecoveryC')?.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='SETUP','Race cancel did not return to Setup');
    const afterCancelIds=window.mwsF1GetSelectedContactIdsV181?.()||[];
    assert(context.driverIds?.every(id=>afterCancelIds.includes(id)),'Participants were lost after race cancel');
    assert(String(window.mwsF1GetActiveTrackV182?.()?.id||'')===String(context.targetTrackId),'Track was lost after race cancel');

    assert(window.mwsF1StartRaceFromSetupV187?.()===true,'Second race preparation failed');
    await sleep(1200);await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='GRID','Second race started before explicit grid click');
    document.getElementById('f1RacingGridStartRecoveryM')?.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='RACE','Second explicit start did not reach RACE');

    assert(window.mwsF1ForceFinishRecoveryG?.()===true,'Force finish QA hook failed');
    await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='FINISHING','Finish did not enter FINISHING');
    document.getElementById('f1RacingShowPodiumRecoveryG')?.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='PODIUM','Podium button failed');
    const podiumCount=document.querySelectorAll('#f1RacingPodiumRowsRecoveryG .f1-racing-podium-place-recovery-g').length;
    assert(podiumCount>=2,'Podium did not render expected drivers');
    document.getElementById('f1RacingPodiumResultRecoveryG')?.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='RESULT','Result button failed');
    const resultCount=document.querySelectorAll('#f1RacingResultRowsRecoveryG .f1-racing-result-row-recovery-g').length;
    assert(resultCount>=2,'Final result rows missing');

    document.getElementById('f1RacingResultNewRaceRecoveryG')?.click();
    await sleep(1200);await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='GRID','Same-settings new race auto-started before explicit click');
    document.getElementById('f1RacingGridStartRecoveryM')?.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='RACE','Same-settings explicit start did not reach RACE');
    const afterNewRaceIds=window.mwsF1GetSelectedContactIdsV181?.()||[];
    assert(context.driverIds?.every(id=>afterNewRaceIds.includes(id)),'Participants were lost for same-settings new race');
    assert(String(window.mwsF1GetActiveTrackV182?.()?.id||'')===String(context.targetTrackId),'Track was lost for same-settings new race');

    document.getElementById('f1RacingRaceCancelRecoveryC')?.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='SETUP','Final cancel did not return to Setup');

    const errors=[...(window.__recoveryHErrors||[])];
    assert(errors.length===0,'Browser errors during Recovery H: '+errors.join(' | '));

    return {
      curvatureSpeedQa:context.curvatureSpeedQa||null,
      manualStartGate:true,
      centerTripleDock:centerDocked,
      pausedAndResumed:true,
      phase204Incident:{type:forcedIncident?.type||'',lockupActiveMs:Number(incidentAfter?.lockupActiveMs)||0,flatSpot:Number(incidentAfter?.tyreFlatSpot)||0},
      phase205Pit:{states:pitCycle?.states||[],laneSpeedCapKph:Number(pitCycle?.laneSpeedCapKph)||0,compound:pitAfter?.compound||'',warmupFactor:Number(pitAfter?.tyreWarmupFactor)||0},
      phase206Strategy:{decision:strategyQa?.decision||'',reason:strategyQa?.reason||'',pitRequested:Boolean(strategyQa?.pitRequested),targetCompound:strategyQa?.targetCompound||'',context:strategyQa?.context||{}},
      resizeChanged:{before:beforeResize,after:afterResize},
      dockedCommentary:docked,
      overlapPairsAfterDock:window.mwsF1WorkspaceOverlapPairsRecoveryI?.()||[],
      tabSwitch:true,
      persistenceVersion:Number(persisted?.version)||0,
      malformedRepairReasons:repaired?.before||[],
      finalDomOverlapPairs:domOverlapPairs(),
      cancelPreservedDrivers:afterCancelIds,
      podiumCount,
      resultCount,
      newRacePreservedDrivers:afterNewRaceIds,
      finalState:window.mwsF1GetScreenStateV185?.(),
      errors
    };
  })()`,'Recovery H interaction');

  const result={phase:'recovery-h',name:'f1-live-browser-qa',baseline,interaction,pass:true};
  console.log(JSON.stringify({recoveryHLiveBrowser:result},null,2));
}finally{
  cdp?.close();
  child.kill('SIGTERM');
  await sleep(150);
  try{rmSync(profile,{recursive:true,force:true})}catch(_){}
}
