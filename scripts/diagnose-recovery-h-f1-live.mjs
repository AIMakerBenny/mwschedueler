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

  let phase257Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase257Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV257==='phase257-embedded-driver-profile-marker'","Phase 257 runtime readiness"));
    if(phase257Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v257=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1400);
  }
  if(!phase257Ready)throw new Error('Phase 257 runtime did not propagate to Recovery H browser');

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
    const gridLayoutQa244=window.mwsF1QaStartingGridLayoutV244?.();
    assert(gridLayoutQa244?.allPass===true,'Phase 244 starting grid structure QA failed: '+JSON.stringify(gridLayoutQa244));
    const gridStage244=document.querySelector('.f1-racing-grid-stage-v244')?.getBoundingClientRect();
    const gridStart244=manualStart.getBoundingClientRect();
    assert(gridStage244&&gridStart244.right>=gridStage244.right-36&&gridStart244.top<=gridStage244.top+76,'Phase 244 race start button is not at grid top-right: '+JSON.stringify({stage:gridStage244,start:gridStart244}));
    manualStart.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='RACE','Explicit grid start click did not enter RACE');
    await sleep(350);await raf();
    const playbackQa247=window.mwsF1QaRacePlaybackSpeedV247?.();
    assert(playbackQa247?.allPass===true&&Number(playbackQa247?.baseRate)===2,'Phase 247 playback mapping QA failed: '+JSON.stringify(playbackQa247));
    const speed1V247=document.getElementById('f1RacingSpeed1V192');
    const speed2V247=document.getElementById('f1RacingSpeed2V192');
    assert(speed1V247?.getAttribute('aria-pressed')==='true','Phase 247 default 1x button is not active');
    const defaultClockBefore247=window.mwsF1GetSimulationClockV192?.();
    assert(Number(defaultClockBefore247?.timeScale)===1&&Number(defaultClockBefore247?.effectiveTimeScale)===2,'Phase 247 default clock is not rebased to effective 2x: '+JSON.stringify(defaultClockBefore247));
    await sleep(280);await raf();
    const defaultClockAfter247=window.mwsF1GetSimulationClockV192?.();
    const defaultAdvance247=Number(defaultClockAfter247?.simTimeMs)-Number(defaultClockBefore247?.simTimeMs);
    assert(defaultAdvance247>=320&&defaultAdvance247<=950,'Phase 247 default playback did not advance near rebased 2x: '+defaultAdvance247);
    speed2V247?.click();await raf();
    const doubledClock247=window.mwsF1GetSimulationClockV192?.();
    assert(Number(doubledClock247?.timeScale)===2&&Number(doubledClock247?.effectiveTimeScale)===4&&speed2V247?.getAttribute('aria-pressed')==='true','Phase 247 2x control did not select effective 4x: '+JSON.stringify(doubledClock247));
    speed1V247?.click();await raf();
    assert(Number(window.mwsF1GetSimulationClockV192?.().effectiveTimeScale)===2,'Phase 247 1x restore failed');
    const commentaryQa=window.mwsF1QaRaceCommentaryV219?.();
    assert(commentaryQa?.allPass===true&&Number(commentaryQa?.entries)>=1,'Phase 219 commentary engine did not produce a live entry: '+JSON.stringify(commentaryQa));
    assert(document.getElementById('f1RacingCommentaryLogV188')?.textContent?.includes('경기가 시작됐습니다.'),'Phase 219 race-start commentary missing');
    const narrativeQa=window.mwsF1QaRaceNarrativeV222?.();
    assert(narrativeQa?.allPass===true,'Phase 222 commentary flow QA failed: '+JSON.stringify(narrativeQa));
    const commentaryOrderQa=window.mwsF1QaCommentaryEventOrderV230?.();
    assert(commentaryOrderQa?.allPass===true&&commentaryOrderQa?.passTargetId==='passed'&&commentaryOrderQa?.invalidReturn==='','Phase 230 commentary event order QA failed: '+JSON.stringify(commentaryOrderQa));
    const commentaryReadQa=window.mwsF1QaCommentaryReadabilityV226?.();
    assert(commentaryReadQa?.allPass===true&&commentaryReadQa?.badgeReady===true,'Phase 226 commentary readability QA failed: '+JSON.stringify(commentaryReadQa));
    window.mwsF1ResetCommentaryCadenceV227?.();
    const cadenceBefore=document.querySelectorAll('#f1RacingCommentaryLogV188 .f1-racing-commentary-entry-v219').length;
    const cadenceFirst=window.mwsF1AppendRaceCommentaryV222?.('QA 장시간 흐름 A','flow','qa-cadence-a',1000);
    const cadenceSecond=window.mwsF1AppendRaceCommentaryV222?.('QA 장시간 흐름 B','flow','qa-cadence-b',1000);
    const cadenceAfter=document.querySelectorAll('#f1RacingCommentaryLogV188 .f1-racing-commentary-entry-v219').length;
    const cadenceQa=window.mwsF1QaCommentaryCadenceV227?.();
    assert(cadenceFirst===true&&cadenceSecond===false&&cadenceAfter-cadenceBefore===1,'Phase 227 cadence gate did not suppress same-tick flow spam: '+JSON.stringify({cadenceFirst,cadenceSecond,cadenceBefore,cadenceAfter,cadenceQa}));
    assert(cadenceQa?.allPass===true&&Number(cadenceQa?.suppressed)>=1&&Number(cadenceQa?.maxNarrativePerWindow)===18,'Phase 227 cadence QA failed: '+JSON.stringify(cadenceQa));
    for(let i=0;i<20;i++)window.mwsF1AppendRaceCommentaryV222?.('QA 흐름 '+i,'flow','qa-flow-'+i,0);
    const commentaryLog=document.getElementById('f1RacingCommentaryLogV188');
    commentaryLog.scrollTop=0;commentaryLog.dispatchEvent(new Event('scroll'));await raf();
    window.mwsF1AppendRaceCommentaryV222?.('QA 읽지 않은 해설','flow','qa-unread',0);await raf();
    const unreadQa=window.mwsF1QaCommentaryReadabilityV226?.();
    assert(Number(unreadQa?.unread)>=1,'Phase 226 unread commentary counter did not increment: '+JSON.stringify(unreadQa));
    document.getElementById('f1RacingCommentaryUnreadV226')?.click();await raf();
    const unreadCleared=window.mwsF1QaCommentaryReadabilityV226?.();
    assert(Number(unreadCleared?.unread)===0&&unreadCleared?.followTail===true,'Phase 226 unread commentary return-to-tail failed: '+JSON.stringify(unreadCleared));

    const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
    assert(workspace,'Race workspace missing');
    const panelIds=['timing','track','commentary'];
    for(const id of panelIds)assert(document.querySelector('[data-f1-workspace-panel="'+id+'"]'),'Workspace panel missing: '+id);
    assert(!document.querySelector('[data-f1-workspace-panel="radio"],[data-f1-workspace-panel="speed"]'),'Obsolete workspace panel still mounted');

    const visible=panelIds.filter(id=>{
      const panel=document.querySelector('[data-f1-workspace-panel="'+id+'"]');
      return panel&&!panel.hidden&&getComputedStyle(panel).display!=='none';
    });
    assert(visible.length===3&&visible.includes('timing')&&visible.includes('track')&&visible.includes('commentary'),'Default visible workspace panels incorrect: '+visible.join(','));

    const wr=workspace.getBoundingClientRect();
    const timing=document.querySelector('[data-f1-workspace-panel="timing"]').getBoundingClientRect();
    const track=document.querySelector('[data-f1-workspace-panel="track"]').getBoundingClientRect();
    const commentary=document.querySelector('[data-f1-workspace-panel="commentary"]').getBoundingClientRect();
    const coverage=(timing.width*timing.height+track.width*track.height+commentary.width*commentary.height)/Math.max(1,wr.width*wr.height);
    assert(wr.width>1000&&wr.height>500,'Workspace geometry too small');
    assert(track.width>wr.width*.60&&track.width<wr.width*.72,'Track Map width is not the expected left two-thirds: '+track.width+'/'+wr.width);
    assert(timing.width>wr.width*.28&&timing.width<wr.width*.40,'Live Timing width is not the expected right third: '+timing.width+'/'+wr.width);
    assert(track.width*track.height>commentary.width*commentary.height*2,'Track Map is not dominant in default layout');
    assert(coverage>.78,'Workspace visible coverage too low: '+coverage.toFixed(3));

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
      panelAreas:{timing:Math.round(timing.width*timing.height),track:Math.round(track.width*track.height),commentary:Math.round(commentary.width*commentary.height)},
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
    const pausedAt247=Number(window.mwsF1GetSimulationClockV192?.().simTimeMs)||0;
    await sleep(160);await raf();
    assert(Math.abs((Number(window.mwsF1GetSimulationClockV192?.().simTimeMs)||0)-pausedAt247)<=20,'Phase 247 pause allowed simulation time to advance');
    pause.click();await raf();
    assert(window.mwsF1GetSimulationClockV192?.().paused===false,'Phase 247 resume failed');
    await sleep(120);await raf();
    assert((Number(window.mwsF1GetSimulationClockV192?.().simTimeMs)||0)>pausedAt247,'Phase 247 resumed clock did not advance');
    pause.click();await raf();
    assert(window.mwsF1GetSimulationClockV192?.().paused===true,'Phase 247 second pause failed');
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
    assert(multiTrackQa?.trackCount>=3,'Phase 210 track catalog count mismatch: '+String(multiTrackQa?.trackCount));
    assert(['majoku-ring-v1','castle-street-circuit-v1','blue-coast-speedway-v1'].every(id=>multiTrackQa?.ids?.includes(id)),'Phase 210 base track ids missing: '+JSON.stringify(multiTrackQa?.ids));
    assert(multiTrackQa?.allPass===true,'Phase 210 multi-track integration failed: '+JSON.stringify(multiTrackQa?.tracks));
    assert(multiTrackQa?.tracks?.every(row=>row.snapshotReady&&row.geometryReady&&row.pitReady&&row.overtakeReady&&row.renderingReady&&row.dynamicsReady&&row.trafficPassReady),'Phase 210 subsystem coverage incomplete');
    const diverseTracksQa=window.mwsF1QaDiverseTrackCatalogV220?.();
    assert(diverseTracksQa?.allPass===true&&Number(diverseTracksQa?.trackCount)>=7,'Phase 220 diverse track catalog failed: '+JSON.stringify(diverseTracksQa));
    assert(Number(diverseTracksQa?.pathShapes)===7&&Number(diverseTracksQa?.archetypes)>=6,'Phase 220 track silhouettes/archetypes are not diverse: '+JSON.stringify(diverseTracksQa));
    const benchmarkAlignmentQa=window.mwsF1QaTrackBenchmarkAlignmentV239?.();
    assert(benchmarkAlignmentQa?.allPass===true&&Number(benchmarkAlignmentQa?.overtakeCorrelation)>=.72&&Number(benchmarkAlignmentQa?.incidentCorrelation)>=.72&&Number(benchmarkAlignmentQa?.speedCorrelation)>=.72,'Phase 239 benchmark alignment QA failed: '+JSON.stringify(benchmarkAlignmentQa));
    const trackBenchmarkQa=window.mwsF1QaSevenTrackBenchmarkV238?.();
    assert(trackBenchmarkQa?.allPass===true&&Number(trackBenchmarkQa?.rows?.length)===7&&Number(trackBenchmarkQa?.speedSpread)>=20&&Number(trackBenchmarkQa?.passSpread)>=1,'Phase 238 seven-track benchmark QA failed: '+JSON.stringify(trackBenchmarkQa));
    const telemetryQa=window.mwsF1QaRaceResultTelemetryV237?.();
    assert(telemetryQa?.allPass===true&&Number(telemetryQa?.sample?.totalPasses)===5&&Number(telemetryQa?.sample?.incidentCount)===3,'Phase 237 race telemetry QA failed: '+JSON.stringify(telemetryQa));
    const trackCommentaryQa=window.mwsF1QaTrackAwareCommentaryV236?.();
    assert(trackCommentaryQa?.allPass===true&&Number(trackCommentaryQa?.uniqueLines)>=7,'Phase 236 track-aware commentary QA failed: '+JSON.stringify(trackCommentaryQa));
    const activeTrackArchetype=String(window.mwsF1GetActiveRaceSnapshotV187?.()?.track?.runtimeProfile?.archetype||'');
    const commentaryTextV236=String(document.getElementById('f1RacingCommentaryLogV188')?.textContent||'');
    assert(activeTrackArchetype&&commentaryTextV236.includes(activeTrackArchetype),'Phase 236 live commentary missing active track archetype: '+JSON.stringify({activeTrackArchetype,commentaryTextV236:commentaryTextV236.slice(0,600)}));
    const trackBehaviorQa=window.mwsF1QaTrackBehaviorModifiersV235?.();
    assert(trackBehaviorQa?.allPass===true&&Number(trackBehaviorQa?.overtakeSpread)>0&&Number(trackBehaviorQa?.incidentSpread)>0,'Phase 235 track behavior QA failed: '+JSON.stringify(trackBehaviorQa));
    const trackRuntimeProfileQa=window.mwsF1QaTrackRuntimeProfilesV234?.();
    assert(trackRuntimeProfileQa?.allPass===true&&Number(trackRuntimeProfileQa?.uniqueProfiles)>=5,'Phase 234 track runtime profile QA failed: '+JSON.stringify(trackRuntimeProfileQa));
    const activeSnapshotProfile=window.mwsF1GetActiveRaceSnapshotV187?.()?.track?.runtimeProfile;
    assert(activeSnapshotProfile&&Number(activeSnapshotProfile.overtakeFactor)>0&&String(activeSnapshotProfile.archetype||''),'Phase 234 active race snapshot profile missing: '+JSON.stringify(activeSnapshotProfile));
    const trackFlowQa243=window.mwsF1QaTrackFlowDesignV243?.();
    assert(trackFlowQa243?.allPass===true&&Number(trackFlowQa243?.rows?.length)===7&&Number(trackFlowQa243?.miniStroke)<=10,'Phase 243 flowing circuit QA failed: '+JSON.stringify(trackFlowQa243));
    const angularTracks243=(trackFlowQa243?.rows||[]).filter(row=>Number(row.lines)>1||Number(row.curves)<6);
    assert(angularTracks243.length===0,'Phase 243 angular track paths remain: '+JSON.stringify(angularTracks243));
    const trackSilhouetteQa=window.mwsF1QaTrackSilhouetteCardsV233?.();
    assert(trackSilhouetteQa?.allPass===true&&Number(trackSilhouetteQa?.trackCount)>=7&&Number(trackSilhouetteQa?.uniqueCardPaths)===Number(trackSilhouetteQa?.trackCount),'Phase 233 track silhouette card QA failed: '+JSON.stringify(trackSilhouetteQa));
    const trackProfileQa=window.mwsF1QaTrackProfileUiV223?.();
    assert(trackProfileQa?.allPass===true&&Number(trackProfileQa?.trackCount)>=7,'Phase 223 track profile UI data failed: '+JSON.stringify(trackProfileQa));
    const markerQa=window.mwsF1QaTrackMarkersV211?.();
    assert(markerQa?.trackCount>=3&&markerQa?.allPass===true,'Phase 211 marker integration failed: '+JSON.stringify(markerQa));
    const trackPresentationQa246=window.mwsF1QaTrackPresentationV246?.();
    assert(trackPresentationQa246?.allPass===true,'Phase 246 track presentation QA failed: '+JSON.stringify(trackPresentationQa246));
    const raceMarkerText=String(document.getElementById('f1RacingRaceAnnotationsRecoveryB')?.textContent||'');
    assert(raceMarkerText.includes('출발 / 결승선')&&raceMarkerText.includes('피트 진입')&&raceMarkerText.includes('피트 출구'),'Phase 246 essential Race Control markers incomplete: '+raceMarkerText);
    assert(!raceMarkerText.includes('ST1')&&!raceMarkerText.includes('ST2')&&!raceMarkerText.includes('추월 감지'),'Phase 246 obsolete track marker labels still visible: '+raceMarkerText);
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
    const cameraDirectorQa=window.mwsF1QaCameraDirectorV225?.();
    assert(cameraDirectorQa?.allPass===true&&cameraDirectorQa?.hasFront===true,'Phase 225 camera director QA failed: '+JSON.stringify(cameraDirectorQa));
    const cameraStabilityQa=window.mwsF1QaCameraDirectorStabilityV229?.();
    assert(cameraStabilityQa?.allPass===true&&Number(cameraStabilityQa?.candidateHoldMs)>=500&&Number(cameraStabilityQa?.minSwitchMs)>=1500,'Phase 229 camera director stability QA failed: '+JSON.stringify(cameraStabilityQa));
    assert(document.querySelector('[data-f1-camera-mode="FRONT"]')?.textContent?.includes('상위권'),'Phase 225 front-group camera button missing');
    const zoomMarkerQa245=window.mwsF1QaZoomAwareMarkerScaleV245?.();
    assert(zoomMarkerQa245?.allPass===true&&Number(zoomMarkerQa245?.samples?.length)===5,'Phase 245 zoom-aware marker QA failed: '+JSON.stringify(zoomMarkerQa245));
    assert(Number(window.mwsF1RaceMarkerScaleV245?.(4.5))<Number(window.mwsF1RaceMarkerScaleV245?.(2)),'Phase 245 marker scale does not shrink with zoom');
    const markerIdentityQa=window.mwsF1QaDriverMarkerIdentityV232?.();
    assert(markerIdentityQa?.allPass===true&&Number(markerIdentityQa?.liveMarkerCount)>=2&&Number(markerIdentityQa?.liveMarkerCount)===Number(markerIdentityQa?.liveNumberCount),'Phase 232 driver marker identity QA failed: '+JSON.stringify(markerIdentityQa));
    const profileMarkerQa250=window.mwsF1QaDriverProfileMarkersV250?.();
    assert(profileMarkerQa250?.allPass===true&&Number(profileMarkerQa250?.markerCount)>=2,'Phase 250 driver profile marker QA failed: '+JSON.stringify(profileMarkerQa250));
    const embeddedProfileQa257=window.mwsF1QaEmbeddedDriverProfilesV257?.();
    assert(embeddedProfileQa257?.allPass===true&&Number(embeddedProfileQa257?.markerCount)>=2&&Number(embeddedProfileQa257?.legacyConnectors)===0,'Phase 257 embedded driver profile QA failed: '+JSON.stringify(embeddedProfileQa257));
    const firstProfileMarker257=document.querySelector('.f1-racing-race-vehicle-v189');
    const profileRing257=firstProfileMarker257?.querySelector('.car-ring');
    const profileImage257=firstProfileMarker257?.querySelector('.car-profile-image-v257');
    const profileFallback257=firstProfileMarker257?.querySelector('.car-profile-fallback-bg-v257');
    const profileInitials257=firstProfileMarker257?.querySelector('.car-profile-initials-v257');
    const profileConnector257=firstProfileMarker257?.querySelector('.car-profile-connector-v250');
    const profileCore257=firstProfileMarker257?.querySelector('.car-core');
    const profileRect257=profileRing257?.getBoundingClientRect();
    const imageRect257=profileImage257?.getBoundingClientRect();
    const fallbackRect257=profileFallback257?.getBoundingClientRect();
    const visibleProfileRect257=imageRect257&&imageRect257.width>0?imageRect257:fallbackRect257;
    const profileCenters257=profileRect257&&visibleProfileRect257?{
      dx:Math.abs((profileRect257.left+profileRect257.width/2)-(visibleProfileRect257.left+visibleProfileRect257.width/2)),
      dy:Math.abs((profileRect257.top+profileRect257.height/2)-(visibleProfileRect257.top+visibleProfileRect257.height/2)),
      ringW:profileRect257.width,visualW:visibleProfileRect257.width,
      initials:String(profileInitials257?.textContent||'').trim()
    }:null;
    assert(profileCenters257&&profileCenters257.ringW>0&&profileCenters257.visualW>0&&profileCenters257.dx<2&&profileCenters257.dy<2&&!profileConnector257&&!profileCore257,'Phase 257 embedded driver profile geometry invalid: '+JSON.stringify(profileCenters257));
    const markerNumberTexts=[...document.querySelectorAll('.f1-racing-race-vehicle-v189 .car-number-v232')].map(node=>String(node.textContent||'').trim());
    assert(markerNumberTexts.length>=2&&new Set(markerNumberTexts).size===markerNumberTexts.length,'Phase 232 driver marker numbers are not unique: '+JSON.stringify(markerNumberTexts));
    const labelCollisionQa=window.mwsF1QaDriverLabelCollisionV228?.();
    assert(labelCollisionQa?.allPass===true&&Number(labelCollisionQa?.syntheticOverlapPairs)===0,'Phase 228 driver label collision QA failed: '+JSON.stringify(labelCollisionQa));
    const cameraQa=window.mwsF1QaDriverMarkerCameraV216?.();
    assert(cameraQa?.allPass===true&&Number(cameraQa?.paletteCount)>=8,'Phase 216 marker/camera QA failed: '+JSON.stringify(cameraQa));
    const markerColors=Array.from(document.querySelectorAll('.f1-racing-race-vehicle-v189')).map(node=>node.style.getPropertyValue('--f1-driver-color')).filter(Boolean);
    assert(new Set(markerColors).size===markerColors.length&&markerColors.length>=2,'Phase 216 driver markers are not uniquely colored: '+JSON.stringify(markerColors));
    assert(window.mwsF1SetRaceCameraModeV216?.('AUTO')===true,'Phase 216 auto camera enable failed');
    const mapStage=document.querySelector('#f1RacingWorkspaceRecoveryE .f1-racing-race-map-stage-v188');
    assert(mapStage,'Phase 216 race map stage missing');
    const mapRect=mapStage.getBoundingClientRect();
    // Phase 245: measure rendered sizes, not just the inverse-scale helper.
    window.mwsF1SetRaceCameraModeV216('FULL');await raf();
    const raceSvg245=document.getElementById('f1RacingRaceTrackSvgV188');
    const sizeSelectors245=['.car-ring','.car-number-v232','.car-label','.car-profile-embedded-v257','.f1-racing-track-annotation-v183.pit circle','.f1-racing-track-annotation-v183.pit text','.f1-racing-track-indicator-v246 rect','.finish-label'];
    const measure245=()=>sizeSelectors245.map(selector=>{
      const node=raceSvg245.querySelector(selector),rect=node?.getBoundingClientRect();
      assert(rect&&rect.width>0&&rect.height>0,'Phase 245 missing rendered marker: '+selector);
      return {selector,width:rect.width,height:rect.height};
    });
    const sizesAtFull245=measure245();
    const finishLine245=raceSvg245.querySelector('.finish-underlay');
    const finishLength245=()=>{const box=finishLine245.getBoundingClientRect();return Math.hypot(box.width,box.height)};
    const lineAtFull245=finishLength245();
    for(let step245=0;step245<12;step245++)mapStage.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:-120,clientX:mapRect.left+mapRect.width/2,clientY:mapRect.top+mapRect.height/2}));
    await raf();
    const zoomState245=window.mwsF1GetRaceCameraStateV216();
    assert(zoomState245.mode==='MANUAL'&&zoomState245.zoom===4.5,'Phase 245 wheel zoom did not reach clamped maximum');
    const sizesAtZoom245=measure245();
    sizesAtZoom245.forEach((row,index)=>{
      const ratio=row.width/sizesAtFull245[index].width;
      assert(ratio>.85&&ratio<1.12,'Phase 245 rendered marker enlarged or became unreadable: '+JSON.stringify({row,ratio}));
    });
    assert(finishLength245()/lineAtFull245>4.4,'Phase 245 finish line must retain track-relative geometry');
    window.mwsF1SetRaceCameraModeV216('AUTO');await raf();
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
    const compactQa=window.mwsF1QaCompactWorkspaceV217?.();
    assert(compactQa?.allPass===true,'Phase 217 compact workspace QA failed: '+JSON.stringify(compactQa));
    const compactLayout=window.mwsF1GetWorkspaceLayoutRecoveryE?.();
    assert(compactLayout?.panels?.track?.x===0&&compactLayout?.panels?.track?.w===8&&compactLayout?.panels?.track?.h===8,'Phase 217 track default layout mismatch: '+JSON.stringify(compactLayout?.panels?.track));
    assert(compactLayout?.panels?.timing?.x===8&&compactLayout?.panels?.timing?.y===0&&compactLayout?.panels?.timing?.w===4,'Phase 217 timing default layout mismatch: '+JSON.stringify(compactLayout?.panels?.timing));
    assert(compactLayout?.panels?.commentary?.x===8&&compactLayout?.panels?.commentary?.y===3&&compactLayout?.panels?.commentary?.w===4,'Phase 217 commentary default layout mismatch: '+JSON.stringify(compactLayout?.panels?.commentary));
    assert(!document.querySelector('[data-f1-workspace-panel="radio"],[data-f1-workspace-panel="speed"]'),'Phase 217 obsolete Team Radio or Speed Trap panel remains in workspace');
    assert(!document.getElementById('f1RacingTeamRadioV188')&&!document.getElementById('f1RacingSpeedTrapV188')&&!document.querySelector('.f1-racing-race-side-v188'),'Phase 249 obsolete static race panels remain');
    const migrationQa249=window.mwsF1QaWorkspacePanelMigrationV249?.();
    assert(migrationQa249?.allPass===true&&Number(migrationQa249?.version)===6,'Phase 249 saved layout migration failed: '+JSON.stringify(migrationQa249));
    assert(migrationQa249?.reasons?.includes('obsolete-panel:radio')&&migrationQa249?.reasons?.includes('obsolete-panel:speed'),'Phase 249 migration did not identify obsolete panel keys: '+JSON.stringify(migrationQa249));
    assertNoDomOverlap('after compact default');
    const raceHeaderRect=document.querySelector('#f1RacingViewRaceV185 .f1-racing-race-header-v188')?.getBoundingClientRect();
    assert(raceHeaderRect&&raceHeaderRect.height<=46,'Phase 224 race header is not compact: '+String(raceHeaderRect?.height));
    const timingPanel=document.querySelector('[data-f1-workspace-panel="timing"]');
    const gearCell=timingPanel?.querySelector('.f1-racing-timing-row-v188 .gear');
    const rpmCell=timingPanel?.querySelector('.f1-racing-timing-row-v188 .rpm');
    assert(gearCell&&getComputedStyle(gearCell).display==='none','Phase 224 compact timing gear column still visible');
    assert(rpmCell&&getComputedStyle(rpmCell).display==='none','Phase 224 compact timing RPM column still visible');
    const timingIdentityQa251=window.mwsF1QaLiveTimingIdentityV251?.();
    assert(timingIdentityQa251?.allPass===true&&Number(timingIdentityQa251?.rowCount)>=2&&Number(timingIdentityQa251?.uniqueColors)>=2,'Phase 251 Live Timing identity QA failed: '+JSON.stringify(timingIdentityQa251));
    const firstTimingAvatar251=timingPanel?.querySelector('.f1-racing-timing-avatar-v251');
    const firstTimingStrip251=timingPanel?.querySelector('.f1-racing-driver-color-v251');
    const avatarRect251=firstTimingAvatar251?.getBoundingClientRect(),stripRect251=firstTimingStrip251?.getBoundingClientRect();
    assert(avatarRect251&&avatarRect251.width>=18&&avatarRect251.width<=28&&avatarRect251.height>=18&&avatarRect251.height<=28,'Phase 251 timing avatar geometry invalid: '+JSON.stringify(avatarRect251?{w:avatarRect251.width,h:avatarRect251.height}:null));
    assert(stripRect251&&stripRect251.width>=2&&stripRect251.width<=6&&stripRect251.height>=18,'Phase 251 driver color strip geometry invalid: '+JSON.stringify(stripRect251?{w:stripRect251.width,h:stripRect251.height}:null));
    const spectatorQa252=window.mwsF1QaSpectatorHighlightsV252?.();
    assert(spectatorQa252?.allPass===true,'Phase 252 spectator highlight QA failed: '+JSON.stringify(spectatorQa252));
    assert(spectatorQa252?.markerBattle===true&&String(spectatorQa252?.battleAnimation||'').includes('f1BattlePulseV252'),'Phase 252 battle marker pulse was not rendered: '+JSON.stringify(spectatorQa252));
    assert(spectatorQa252?.positionLabel==='▲3'&&spectatorQa252?.positionTrend==='up','Phase 252 position change indicator missing: '+JSON.stringify(spectatorQa252));
    assert(spectatorQa252?.bestFastest===true&&String(spectatorQa252?.fastestAfter||'').includes('FL'),'Phase 252 fastest lap indicator missing: '+JSON.stringify(spectatorQa252));
    const timingStatusQa253=window.mwsF1QaLiveTimingStatusV253?.();
    assert(timingStatusQa253?.allPass===true,'Phase 253 Live Timing status QA failed: '+JSON.stringify(timingStatusQa253));
    const timingTyre253=timingPanel?.querySelector('[data-f1-status-tyre-v253]');
    const timingTyreRect253=timingTyre253?.getBoundingClientRect();
    assert(timingTyreRect253&&timingTyreRect253.width>20&&timingTyreRect253.height>=12,'Phase 253 timing tyre badge geometry invalid: '+JSON.stringify(timingTyreRect253?{w:timingTyreRect253.width,h:timingTyreRect253.height}:null));
    const markerPositionQa254=window.mwsF1QaRaceMarkerPositionV254?.();
    assert(markerPositionQa254?.allPass===true&&Number(markerPositionQa254?.count)>=2,'Phase 254 live marker position QA failed: '+JSON.stringify(markerPositionQa254));
    const markerPositionTag254=document.querySelector('.f1-racing-race-vehicle-v189 .car-position-tag-v254');
    const markerPositionBox254=markerPositionTag254?.querySelector('.car-position-box-v254');
    const markerPositionText254=markerPositionTag254?.querySelector('.car-position-text-v254');
    const markerPositionRect254=markerPositionBox254?.getBoundingClientRect();
    assert(markerPositionRect254&&markerPositionRect254.width>=8&&markerPositionRect254.height>=5&&/^P\\d+$/.test(String(markerPositionText254?.textContent||'')),'Phase 254 marker position tag geometry invalid: '+JSON.stringify(markerPositionRect254?{w:markerPositionRect254.width,h:markerPositionRect254.height,text:markerPositionText254?.textContent}:null));
    const raceHeadlineQa255=window.mwsF1QaRaceHeadlineV255?.();
    assert(raceHeadlineQa255?.allPass===true,'Phase 255 race headline QA failed: '+JSON.stringify(raceHeadlineQa255));
    const raceHeadline255=document.getElementById('f1RacingRaceHeadlineV255');
    const raceHeadlineRect255=raceHeadline255?.getBoundingClientRect();
    const raceHeadlineCells255=raceHeadline255?.querySelectorAll(':scope > span')?.length||0;
    assert(raceHeadlineRect255&&raceHeadlineRect255.width>200&&raceHeadlineRect255.height>0&&raceHeadlineCells255===4,'Phase 255 race headline geometry invalid: '+JSON.stringify(raceHeadlineRect255?{w:raceHeadlineRect255.width,h:raceHeadlineRect255.height,cells:raceHeadlineCells255}:null));
    const battleLinkQa256=window.mwsF1QaBattleLinksV256?.();
    assert(battleLinkQa256?.allPass===true,'Phase 256 battle link QA failed: '+JSON.stringify(battleLinkQa256));
    assert(Number(battleLinkQa256?.length)>4&&Number(battleLinkQa256?.length)<=88.5&&Number(battleLinkQa256?.arrowWidth)>0&&Number(battleLinkQa256?.arrowHeight)>0&&String(battleLinkQa256?.lineAnimation||'').includes('f1BattleLinkFlowV256'),'Phase 256 battle link rendering invalid: '+JSON.stringify(battleLinkQa256));
    assert(document.querySelector('[data-f1-workspace-panel="timing"] [data-f1-panel-drag="timing"]')?.textContent?.includes('실시간 순위'),'Phase 218 timing panel is not Korean');
    assert(document.querySelector('[data-f1-workspace-panel="track"] [data-f1-panel-drag="track"]')?.textContent?.includes('트랙 맵'),'Phase 218 track panel is not Korean');
    assert(document.querySelector('[data-f1-workspace-panel="commentary"] [data-f1-panel-drag="commentary"]')?.textContent?.includes('경기 해설'),'Phase 218 commentary panel is not Korean');
    assert(document.getElementById('f1RacingPauseV192')?.textContent==='일시정지','Phase 218 pause control is not Korean');

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
    assert(Number(persisted?.version)>=6,'Workspace layout did not persist as repaired schema');
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
    assert(Number(repaired?.layout?.version)===6&&!repaired?.layout?.panels?.radio&&!repaired?.layout?.panels?.speed,'Phase 249 repaired layout retained obsolete panels: '+JSON.stringify(repaired));
    assert(repaired?.before?.includes('obsolete-panel:radio')&&repaired?.before?.includes('obsolete-panel:speed'),'Phase 249 repaired layout did not report obsolete panel migration: '+JSON.stringify(repaired?.before));

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

    const engineQa240=window.mwsF1QaAcceleratedEngineRaceV240?.();
    assert(engineQa240?.allPass===true&&engineQa240?.result?.completed===true&&Number(engineQa240?.result?.telemetry?.fieldAverageSpeedKph)>0,'Phase 240 accelerated real-engine QA failed: '+JSON.stringify(engineQa240));
    assert(window.mwsF1GetScreenStateV185?.()==='SETUP','Phase 240 engine QA did not restore Setup');
    const engineSuiteQa241=window.mwsF1QaSevenTrackEngineSuiteV241?.();
    assert(engineSuiteQa241?.allPass===true&&Number(engineSuiteQa241?.suite?.rows?.length)===7&&Number(engineSuiteQa241?.suite?.completedRuns)===7,'Phase 241 seven-track real-engine suite failed: '+JSON.stringify(engineSuiteQa241));
    assert(window.mwsF1GetScreenStateV185?.()==='SETUP','Phase 241 engine suite did not restore Setup');
    const engineAlignmentQa242=window.mwsF1QaRealEngineBenchmarkAlignmentV242?.();
    assert(engineAlignmentQa242?.allPass===true&&Number(engineAlignmentQa242?.speedCorrelation)>=.7&&Number(engineAlignmentQa242?.uniqueActualSignatures)>=5&&Number(engineAlignmentQa242?.overtakeStress?.totalPasses)>=1,'Phase 242 real-engine benchmark alignment failed: '+JSON.stringify(engineAlignmentQa242));

    const lapTimingQa248=window.mwsF1QaLapTimingV248?.(context.targetTrackId);
    assert(lapTimingQa248?.allPass===true&&lapTimingQa248?.rowPass===true,'Phase 248 multi-lap engine timing failed: '+JSON.stringify(lapTimingQa248));
    assert(lapTimingQa248?.domPass===true&&lapTimingQa248?.result?.timingDom?.every(row=>row.last&&!row.last.includes('--')&&row.best&&!row.best.includes('--')),'Phase 248 timing board still shows lap placeholders: '+JSON.stringify(lapTimingQa248?.result?.timingDom));
    assert(lapTimingQa248?.result?.lapTiming?.every(row=>Number(row.timedCompletedLaps)===3&&row.lapTimesMs?.length===3),'Phase 248 did not commit all three actual engine laps: '+JSON.stringify(lapTimingQa248?.result?.lapTiming));
    assert(window.mwsF1GetScreenStateV185?.()==='SETUP','Phase 248 engine timing QA did not restore Setup');

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
      compactDefault:true,
      zoomMarkerGeometryV245:{zoom:zoomState245.zoom,before:sizesAtFull245,after:sizesAtZoom245},
      profileMarkerV250:profileMarkerQa250||null,
      timingIdentityV251:timingIdentityQa251||null,
      spectatorHighlightsV252:spectatorQa252||null,
      persistenceVersion:Number(persisted?.version)||0,
      malformedRepairReasons:repaired?.before||[],
      workspaceMigrationV249:migrationQa249||null,
      finalDomOverlapPairs:domOverlapPairs(),
      cancelPreservedDrivers:afterCancelIds,
      podiumCount,
      resultCount,
      newRacePreservedDrivers:afterNewRaceIds,
      lapTimingV248:{rowPass:Boolean(lapTimingQa248?.rowPass),domPass:Boolean(lapTimingQa248?.domPass),rows:lapTimingQa248?.result?.lapTiming||[],timingDom:lapTimingQa248?.result?.timingDom||[]},
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
