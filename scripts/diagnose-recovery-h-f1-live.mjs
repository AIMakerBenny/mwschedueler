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
function launchChrome(){
  return spawn(chrome,[
    '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-default-apps','--disable-extensions',
    `--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,
    '--window-size=1920,1080','about:blank'
  ],{stdio:'ignore'});
}
let child=launchChrome();

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function json(url,init){
  const response=await fetch(url,init);
  if(!response.ok)throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}
async function waitDebugger(){
  let last;
  for(let i=0;i<120;i++){
    try{return await json(`http://127.0.0.1:${port}/json/version`)}
    catch(error){last=error;await sleep(150)}
  }
  throw last||new Error('Chrome DevTools endpoint did not start');
}
async function debuggerPages(){
  let last;
  for(let attempt=0;attempt<3;attempt++){
    try{
      await waitDebugger();
      const pages=await json(`http://127.0.0.1:${port}/json`);
      if(Array.isArray(pages)&&pages.some(row=>row.type==='page'))return pages;
      throw new Error('Chrome DevTools page list was empty');
    }catch(error){
      last=error;
      if(attempt>=2)break;
      try{child?.kill('SIGTERM')}catch(_){}
      await sleep(350);
      child=launchChrome();
    }
  }
  throw last||new Error('Chrome DevTools endpoint did not stabilize');
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
  const pages=await debuggerPages();
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

  let phase282Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase282Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV282==='phase282-dialogue-long-run-desktop-qa'","Phase 282 runtime readiness"));
    if(phase282Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v282=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1400);
  }
  if(!phase282Ready)throw new Error('Phase 282 runtime did not propagate to Recovery H browser');

  let phase287Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase287Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV287==='phase287-f1-r12-compact-race-shell-sidebar-hide'","Phase 287 runtime readiness"));
    if(phase287Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v287=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1200);
  }
  if(!phase287Ready)throw new Error('Phase 287 runtime did not propagate to Recovery H browser');
  const extensionQa287=await evaluate(cdp,"(()=>({r08:window.mwsF1QaGeneralOvertakeDefenceV283?.(),r09:window.mwsF1QaTrackRankingOverlayV284?.(),r10:window.mwsF1QaZoomLinkedMarkerScaleV285?.(),r11:window.mwsF1QaAutoCameraJitterSuppressionV286?.(),r12:window.mwsF1QaRaceCompactShellV287?.()}))()","Phase 283-287 extension QA");
  if(extensionQa287?.r08?.allPass!==true)throw new Error('Phase 283 general battle live QA failed: '+JSON.stringify(extensionQa287?.r08));
  if(extensionQa287?.r09?.allPass!==true)throw new Error('Phase 284 track ranking live QA failed: '+JSON.stringify(extensionQa287?.r09));
  if(extensionQa287?.r10?.allPass!==true)throw new Error('Phase 285 zoom marker live QA failed: '+JSON.stringify(extensionQa287?.r10));
  if(extensionQa287?.r11?.allPass!==true)throw new Error('Phase 286 auto camera jitter live QA failed: '+JSON.stringify(extensionQa287?.r11));
  if(extensionQa287?.r12?.allPass!==true)throw new Error('Phase 287 compact race shell live QA failed: '+JSON.stringify(extensionQa287?.r12));

  let phase292Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase292Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV292==='phase292-f1-r17-integrated-desktop-qa'","Phase 292 runtime readiness"));
    if(phase292Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v292=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1200);
  }
  if(!phase292Ready)throw new Error('Phase 292 runtime did not propagate to Recovery H browser');
  await evaluate(cdp,"window.mwsF1ResetFinalDesktopErrorsV292?.()","Phase 292 reset desktop error window");
  const extensionQa292=await evaluate(cdp,"(()=>({r13:window.mwsF1QaWorkspaceViewportFitV288?.(),r14:window.mwsF1QaPreraceCompactV289?.(),r15:window.mwsF1QaGridShuffleSmoothnessV290?.(),r16:window.mwsF1QaFinishOverlayV291?.(),r17Ready:typeof window.mwsF1QaFinalDesktopV292==='function'}))()","Phase 288-292 final extension QA");
  if(extensionQa292?.r13?.allPass!==true)throw new Error('Phase 288 workspace viewport live QA failed: '+JSON.stringify(extensionQa292?.r13));
  if(extensionQa292?.r14?.allPass!==true)throw new Error('Phase 289 pre-race compact live QA failed: '+JSON.stringify(extensionQa292?.r14));
  if(extensionQa292?.r15?.allPass!==true)throw new Error('Phase 290 grid shuffle live QA failed: '+JSON.stringify(extensionQa292?.r15));
  if(extensionQa292?.r16?.allPass!==true)throw new Error('Phase 291 finish overlay live QA failed: '+JSON.stringify(extensionQa292?.r16));
  if(extensionQa292?.r17Ready!==true)throw new Error('Phase 292 integrated desktop QA API missing before F1 render');

  let phase295Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase295Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV295==='phase295-f1-final-regression-gate'","Phase 295 runtime readiness"));
    if(phase295Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v295=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1200);
  }
  if(!phase295Ready)throw new Error('Phase 295 runtime did not propagate to Recovery H browser');
  const finalRuntimeApi295=await evaluate(cdp,"typeof window.mwsF1QaFinalRegressionV295==='function'","Phase 295 final runtime API readiness");
  if(finalRuntimeApi295!==true)throw new Error('Phase 295 final runtime QA API missing before F1 render');

  let phase303Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase303Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV303==='phase303-f1-feedback-stabilization'&&window.__mwsF1FeedbackUiV303==='phase303-f1-feedback-ui-stabilization'","Phase 303 runtime readiness"));
    if(phase303Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v303=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1200);
  }
  if(!phase303Ready)throw new Error('Phase 303 runtime did not propagate to Recovery H browser');

  let phase304Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase304Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV304==='phase304-f1-finish-result-closure'&&typeof window.mwsF1QaFinishResultClosureV304==='function'","Phase 304 runtime readiness"));
    if(phase304Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v304=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1200);
  }
  if(!phase304Ready)throw new Error('Phase 304 runtime did not propagate to Recovery H browser');

  let phase305Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase305Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV305==='phase305-f1-workspace-ui-stability'&&typeof window.mwsF1QaWorkspaceUiV305==='function'","Phase 305 runtime readiness"));
    if(phase305Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v305=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1200);
  }
  if(!phase305Ready)throw new Error('Phase 305 runtime did not propagate to Recovery H browser');

  let phase306Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase306Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV306==='phase306-f1-marker-overlay-collision-avoidance'&&typeof window.mwsF1QaMarkerOverlayCollisionV306==='function'","Phase 306 runtime readiness"));
    if(phase306Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v306=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1200);
  }
  if(!phase306Ready)throw new Error('Phase 306 runtime did not propagate to Recovery H browser');

  let phase307Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase307Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV307==='phase307-live-session-merge-expanded-copy'&&typeof window.mwsF1QaLiveCutinPolicyV307==='function'","Phase 307 runtime readiness"));
    if(phase307Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v307=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1200);
  }
  if(!phase307Ready)throw new Error('Phase 307 runtime did not propagate to Recovery H browser');

  let phase308Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase308Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV308==='phase308-track-overlay-hud-frequency-diversity'&&typeof window.mwsF1QaTrackOverlayHudV308==='function'","Phase 308 runtime readiness"));
    if(phase308Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v308=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1200);
  }
  if(!phase308Ready)throw new Error('Phase 308 runtime did not propagate to Recovery H browser');

  let phase309Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase309Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV309==='phase309-viewport-marker-overtake-flow'&&window.__mwsF1RacingUiV309==='phase309-viewport-marker-overtake-flow-ui'&&typeof window.mwsF1QaViewportMarkerOvertakeV309==='function'","Phase 309 runtime readiness"));
    if(phase309Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v309=${Date.now()}-${attempt}`});
    await refreshed;
    await sleep(1200);
  }
  if(!phase309Ready)throw new Error('Phase 309 runtime did not propagate to Recovery H browser');

  let phase313Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase313Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV313==='phase313-f1-gacha-starting-grid'&&typeof window.mwsF1QaGachaStartingGridV313==='function'","Phase 313 runtime readiness"));
    if(phase313Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v313=${Date.now()}-${attempt}`});
    await refreshed;await sleep(1200);
  }
  if(!phase313Ready)throw new Error('Phase 313 runtime did not propagate to Recovery H browser');

  let phase314Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase314Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV314==='phase314-f1-race-dynamics-rebalance'&&typeof window.mwsF1QaRaceDynamicsV314==='function'","Phase 314 runtime readiness"));
    if(phase314Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v314=${Date.now()}-${attempt}`});
    await refreshed;await sleep(1200);
  }
  if(!phase314Ready)throw new Error('Phase 314 runtime did not propagate to Recovery H browser');

  let phase315Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase315Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV315==='phase315-f1-live-participant-dialogue-diversity'&&window.__mwsF1RacingHudV315==='phase315-dialogue-semantic-diversity'&&typeof window.mwsF1QaLiveDiversityV315==='function'&&typeof window.mwsF1QaDialogueSemanticV315==='function'","Phase 315 runtime readiness"));
    if(phase315Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v315=${Date.now()}-${attempt}`});
    await refreshed;await sleep(1200);
  }
  if(!phase315Ready)throw new Error('Phase 315 runtime did not propagate to Recovery H browser');

  let phase319Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase319Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV319==='phase319-f1-ui-spacing-battle-isolation'&&window.__mwsF1RacingMarkerV319==='phase319-marker-screen-size-lock'&&typeof window.mwsF1QaUiSpacingBattleV319==='function'","Phase 319 runtime readiness"));
    if(phase319Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v319=${Date.now()}-${attempt}`});
    await refreshed;await sleep(1200);
  }
  if(!phase319Ready)throw new Error('Phase 319 runtime did not propagate to Recovery H browser');

  let phase324Ready=false;
  for(let attempt=0;attempt<8;attempt++){
    phase324Ready=Boolean(await evaluate(cdp,"window.__mwsF1RacingV324==='phase324-f1-ui-visibility-train-spacing'&&typeof window.mwsF1QaUiVisibilitySpacingV324==='function'","Phase 324 runtime readiness"));
    if(phase324Ready)break;
    const refreshed=cdp.once('Page.loadEventFired',30000);
    await cdp.send('Page.navigate',{url:`${BASE}/?recovery-h-f1-v324=${Date.now()}-${attempt}`});
    await refreshed;await sleep(1200);
  }
  if(!phase324Ready)throw new Error('Phase 324 runtime did not propagate to Recovery H browser');

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

    const momentumQa262=window.mwsF1QaRaceMomentumV262?.();
    assert(momentumQa262?.allPass===true&&momentumQa262?.deterministic===true&&Number(momentumQa262?.paceRange)>=.015&&Number(momentumQa262?.paceRange)<=.025,'Phase 262 momentum deterministic QA failed: '+JSON.stringify(momentumQa262));

    const narrativeQa263=window.mwsF1QaRaceNarrativeEngineV263?.();
    assert(narrativeQa263?.allPass===true&&Number(narrativeQa263?.templateCount)>=120&&Number(narrativeQa263?.eventCount)>=16&&Number(narrativeQa263?.recentLimit)>=10&&Number(narrativeQa263?.recentLimit)<=15,'Phase 263 narrative engine QA failed: '+JSON.stringify(narrativeQa263));

    const cutinQa264=window.mwsF1QaLiveCutinV264?.();
    assert(cutinQa264?.allPass===true&&cutinQa264?.layerReady===true&&Number(cutinQa264?.maxActive)>=1&&Number(cutinQa264?.dedupeMs)>=1000,'Phase 264 LIVE cut-in QA failed: '+JSON.stringify(cutinQa264));

    const podiumQa265=window.mwsF1QaPodiumV265?.();
    assert(podiumQa265?.allPass===true&&podiumQa265?.domReady===true&&podiumQa265?.singleSafe===true&&podiumQa265?.bestLap===true&&podiumQa265?.overtakes===true,'Phase 265 podium QA failed: '+JSON.stringify(podiumQa265));

    const autoZoomQa268=window.mwsF1QaAutoFollowWheelZoomV268?.();
    assert(autoZoomQa268?.allPass===true,'Phase 268 auto-follow wheel zoom QA failed: '+JSON.stringify(autoZoomQa268));

    const lateralQa269=window.mwsF1QaLateralDynamicsV269?.();
    assert(lateralQa269?.allPass===true&&Number(lateralQa269?.maxVelocity)<=3.02&&Number(lateralQa269?.maxAcceleration)<=7.52,'Phase 269 lateral dynamics QA failed: '+JSON.stringify(lateralQa269));

    const workspaceExactQa269=window.mwsF1QaWorkspaceExactRestoreV269?.();
    assert(workspaceExactQa269?.allPass===true&&workspaceExactQa269?.exact===true,'Phase 269 exact workspace restore failed: '+JSON.stringify(workspaceExactQa269));

    const trackCardQa266=window.mwsF1QaTrackCardsV266?.();
    assert(trackCardQa266?.allPass===true&&Number(trackCardQa266?.trackCount)===7&&trackCardQa266?.mapped===true&&Number(trackCardQa266?.distinctPaths)===7&&trackCardQa266?.hasTechnicalFields===true,'Phase 266 track card QA failed: '+JSON.stringify(trackCardQa266));

    const spectatorQa267=window.mwsF1QaIntegratedSpectatorDesktopV267?.();
    assert(spectatorQa267?.allPass===true,'Phase 267 integrated spectator desktop QA failed: '+JSON.stringify(spectatorQa267));
    assert(Array.isArray(spectatorQa267?.cases)&&spectatorQa267.cases.length===3,'Phase 267 race matrix missing: '+JSON.stringify(spectatorQa267?.cases));
    assert(spectatorQa267.cases.some(row=>row.drivers===3&&row.laps===5&&row.completed),'Phase 267 3-driver 5-lap case failed');
    assert(spectatorQa267.cases.some(row=>row.drivers===6&&row.laps===10&&row.completed),'Phase 267 6-driver 10-lap case failed');
    assert(spectatorQa267.cases.some(row=>row.drivers>=10&&row.laps===20&&row.completed),'Phase 267 10+-driver 20-lap case failed');
    const trackCards266=Array.from(document.querySelectorAll('#f1RacingTrackOptionsV186 .f1-racing-track-card-v266'));
    assert(trackCards266.length===7,'Phase 266 expected 7 track cards, found '+trackCards266.length);
    assert(trackCards266.every(card=>card.querySelector('.f1-racing-track-card-silhouette-v266 path')),'Phase 266 circuit silhouette missing');
    assert(trackCards266.every(card=>['LOW','MID','HIGH'].includes(String(card.dataset.f1SpeedTierV266||''))),'Phase 266 speed tier badge data missing');

    const lapQa260=window.mwsF1QaLapControlV260?.();
    assert(lapQa260?.allPass===true&&lapQa260?.low===3&&lapQa260?.high===99&&lapQa260?.direct===17,'Phase 260 lap-control QA failed: '+JSON.stringify(lapQa260));
    const lapInput260=document.getElementById('f1RacingLapsInputV260');
    const lapMinus260=document.getElementById('f1RacingLapsMinusV260');
    const lapPlus260=document.getElementById('f1RacingLapsPlusV260');
    const lapRestore260=document.getElementById('f1RacingLapsRestoreV260');
    assert(lapInput260&&lapMinus260&&lapPlus260&&lapRestore260,'Phase 260 lap controls missing');
    lapInput260.value='2';lapInput260.dispatchEvent(new Event('change',{bubbles:true}));await raf();
    assert(Number(lapInput260.value)===3,'Phase 260 minimum lap clamp failed');
    lapInput260.value='100';lapInput260.dispatchEvent(new Event('change',{bubbles:true}));await raf();
    assert(Number(lapInput260.value)===99,'Phase 260 maximum lap clamp failed');
    lapInput260.value='17';lapInput260.dispatchEvent(new Event('change',{bubbles:true}));await raf();
    assert(Number(lapInput260.value)===17&&window.mwsF1GetRaceDraftV187?.().totalLaps===17,'Phase 260 direct lap input did not reach draft');
    lapPlus260.click();await raf();assert(Number(lapInput260.value)===18,'Phase 260 plus button failed');
    lapMinus260.click();await raf();assert(Number(lapInput260.value)===17,'Phase 260 minus button failed');
    lapRestore260.click();await raf();
    const recommended260=Number(window.mwsF1RecommendedLapsV260?.());
    assert(Number(lapInput260.value)===recommended260&&window.mwsGetF1RacingSettingsRecoveryD?.()?.lapOverride===false,'Phase 260 recommended restore failed');
    window.mwsF1SetLapCountV260?.(17);await raf();
    assert(window.mwsGetF1RacingSettingsRecoveryD?.()?.lapOverride===true,'Phase 260 manual override persistence failed');

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
    const snapshot260=window.mwsF1GetActiveRaceSnapshotV187?.();
    assert(Number(snapshot260?.totalLaps)===17,'Phase 260 race snapshot did not retain custom laps: '+JSON.stringify(snapshot260?.totalLaps));
    assert(String(document.getElementById('f1RacingGridLapsRecoveryM')?.textContent||'').includes('17'),'Phase 260 grid lap count does not match snapshot');
    const initialReveal273=window.mwsF1GetStartingGridRevealStateV273?.();
    const initialStart273=document.getElementById('f1RacingGridStartRecoveryM');
    if(initialReveal273?.revealing)assert(initialStart273?.disabled===true,'Phase 273 start button unlocked before reveal completion');
    assert(await window.mwsF1WaitGridRevealV273?.(8000)===true,'Phase 273 reveal did not finish');
    const revealQa273=window.mwsF1QaStartingGridRevealV273?.();
    assert(revealQa273?.allPass===true,'Phase 273 starting grid reveal QA failed: '+JSON.stringify(revealQa273));
    const gachaQa313=window.mwsF1QaGachaStartingGridV313?.();
    assert(gachaQa313?.allPass===true&&gachaQa313?.gachaRenderer===true,'Phase 313 Gacha starting grid QA failed: '+JSON.stringify(gachaQa313));
    const gachaStage313=document.getElementById('f1RacingGridGachaStageV313');
    const gachaDock313=document.getElementById('f1GridGachaDockListV313');
    const gachaReveal313=document.getElementById('f1GridGachaRevealV313');
    assert(gachaStage313&&gachaDock313&&gachaReveal313,'Phase 313 Gacha starting grid DOM missing');
    assert(gachaDock313.querySelectorAll('.f1-grid-gacha-dock-item-v313').length===(snapshot260?.drivers||[]).length,'Phase 313 right-side P-grid list count mismatch');
    assert(Boolean(gachaReveal313.firstElementChild),'Phase 313 center Gacha reveal card missing');
    const gachaHost323=gachaReveal313.querySelector('.f1-grid-gacha-card-host-v323');
    const gachaCard319=gachaHost323?.querySelector('.gacha-card')||gachaHost323?.querySelector('.f1-grid-gacha-fallback-card-v313');
    const gachaImage319=gachaCard319?.querySelector('.gacha-card-image img')||gachaCard319?.querySelector('.media img');
    const gachaInfo319=gachaCard319?.querySelector('.gacha-card-info')||gachaCard319?.querySelector('.copy');
    const gachaRevealRect319=gachaReveal313.getBoundingClientRect(),gachaHostRect323=gachaHost323?.getBoundingClientRect(),gachaCardRect319=gachaCard319?.getBoundingClientRect(),gachaInfoRect319=gachaInfo319?.getBoundingClientRect();
    assert(gachaHost323&&gachaHostRect323&&gachaHostRect323.width<=gachaRevealRect319.width+2&&gachaHostRect323.height<=gachaRevealRect319.height+2&&gachaHostRect323.bottom<=gachaRevealRect319.bottom+2,'Phase 323 Gacha host overflows reveal viewport: '+JSON.stringify({reveal:gachaRevealRect319,host:gachaHostRect323,html:gachaReveal313.innerHTML.slice(0,180)}));
    assert(gachaCard319&&gachaCardRect319&&gachaCardRect319.width<=gachaHostRect323.width+2&&gachaCardRect319.height<=gachaHostRect323.height+2,'Phase 321 Gacha card overflows reveal viewport: '+JSON.stringify({host:gachaHostRect323,card:gachaCardRect319,className:gachaCard319?.className}));
    assert(gachaImage319&&getComputedStyle(gachaImage319).objectFit==='contain','Phase 321 Gacha portrait must use contain fit');
    assert(gachaInfoRect319&&gachaInfoRect319.height>=50&&gachaInfoRect319.bottom<=gachaCardRect319.bottom+2,'Phase 321 Gacha card info is clipped: '+JSON.stringify({info:gachaInfoRect319,card:gachaCardRect319}));
    assert(typeof window.multiDrawCardHTML==='function'&&gachaHost323?.dataset?.gachaRendererV323==='shared'&&Boolean(gachaHost323.querySelector('.gacha-card')),'Phase 321 F1 grid did not reuse the real Gacha card renderer');
    assert(gachaHost323?.dataset?.gachaRendererV324==='deterministic'&&gachaCard319?.classList.contains('f1-grid-gacha-card-v324'),'Phase 324 deterministic Gacha card shell missing');
    assert(Math.abs(gachaHostRect323.width-230)<=2&&Math.abs(gachaHostRect323.height-320)<=2,'Phase 324 Gacha card geometry mismatch: '+JSON.stringify({host:gachaHostRect323}));
    assert(initialStart273?.disabled===false&&getComputedStyle(initialStart273).visibility!=='hidden','Phase 273 start button did not unlock after reveal');
    const gridQa272=window.mwsF1QaRandomStartingGridV272?.();
    assert(gridQa272?.allPass===true,'Phase 272 random starting grid QA failed: '+JSON.stringify(gridQa272));
    const gridBefore272=window.mwsF1GetActiveRaceSnapshotV187?.();
    const orderBefore272=(gridBefore272?.drivers||[]).map(row=>String(row.contactId));
    assert((gridBefore272?.drivers||[]).every((row,index)=>Number(row.gridPosition)===index+1),'Phase 272 gridPosition sequence invalid: '+JSON.stringify(gridBefore272?.drivers));
    const offsetRows272=(gridBefore272?.drivers||[]).map((row,index)=>window.mwsF1GridStartOffsetV272?.(index,gridBefore272.drivers.length));
    assert(offsetRows272[0]===0&&offsetRows272.slice(1).every((value,index)=>Number(value)<Number(offsetRows272[index])),'Phase 272 engine start offsets invalid: '+JSON.stringify(offsetRows272));
    const shuffle272=document.getElementById('f1RacingGridShuffleV272');
    assert(shuffle272,'Phase 272 reshuffle button missing');
    shuffle272.click();await raf();
    const reshuffleGachaStage313=document.getElementById('f1RacingGridGachaStageV313');
    const reshuffleGachaDock313=document.getElementById('f1GridGachaDockListV313');
    assert(reshuffleGachaStage313&&reshuffleGachaDock313,'Phase 313 reshuffle did not open Gacha stage');
    const reshuffleStageRect313=reshuffleGachaStage313.getBoundingClientRect();
    const reshuffleDockRect313=reshuffleGachaDock313.closest('.f1-grid-gacha-dock-v313')?.getBoundingClientRect();
    assert(reshuffleStageRect313.width>300&&reshuffleStageRect313.height>250,'Phase 313 Gacha stage geometry invalid: '+JSON.stringify(reshuffleStageRect313));
    assert(reshuffleDockRect313&&reshuffleDockRect313.left>reshuffleStageRect313.left+reshuffleStageRect313.width*.50,'Phase 313 P-grid dock is not on the right side');
    const reshuffleReveal273=window.mwsF1GetStartingGridRevealStateV273?.();
    assert(reshuffleReveal273?.revealing===true,'Phase 273 reshuffle did not start reveal animation');
    assert(document.getElementById('f1RacingGridStartRecoveryM')?.disabled===true,'Phase 273 start button unlocked before reveal completion');
    assert(await window.mwsF1WaitGridRevealV273?.(8000)===true,'Phase 273 reshuffle reveal did not finish');
    const reshuffleDockItems313=[...document.querySelectorAll('#f1GridGachaDockListV313 .f1-grid-gacha-dock-item-v313')];
    assert(reshuffleDockItems313.length===(window.mwsF1GetActiveRaceSnapshotV187?.()?.drivers||[]).length,'Phase 313 reshuffle P-grid dock incomplete');
    assert(reshuffleDockItems313.every((node,index)=>String(node.querySelector('b')?.textContent||'')==='P'+String(index+1).padStart(2,'0')),'Phase 313 P-grid labels are not sequential');
    const gridAfter272=window.mwsF1GetActiveRaceSnapshotV187?.();
    const orderAfter272=(gridAfter272?.drivers||[]).map(row=>String(row.contactId));
    assert(String(gridAfter272?.createdAt)===String(gridBefore272?.createdAt),'Phase 272 reshuffle replaced race snapshot identity');
    assert(JSON.stringify(orderAfter272)!==JSON.stringify(orderBefore272),'Phase 272 reshuffle did not change grid order');
    assert(document.querySelectorAll('#f1RacingGridListV272 [data-f1-grid-position]').length===(gridAfter272?.drivers||[]).length,'Phase 272 grid DOM count mismatch');
    const manualStart=document.getElementById('f1RacingGridStartRecoveryM');
    assert(manualStart,'Explicit grid start button missing');
    const gridLayoutQa244=window.mwsF1QaStartingGridLayoutV244?.();
    assert(gridLayoutQa244?.allPass===true,'Phase 244 starting grid structure QA failed: '+JSON.stringify(gridLayoutQa244));
    const gridStage244=document.querySelector('.f1-racing-grid-stage-v244')?.getBoundingClientRect();
    const gridStart244=manualStart.getBoundingClientRect();
    assert(gridStage244&&gridStart244.right>=gridStage244.right-36&&gridStart244.top<=gridStage244.top+76,'Phase 244 race start button is not at grid top-right: '+JSON.stringify({stage:gridStage244,start:gridStart244}));
    manualStart.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='RACE','Explicit grid start click did not enter RACE');
    await raf();
    window.mwsF1SyncTrackRankingV284?.(true);await raf();
    const rankingQa302=window.mwsF1QaTrackRankingFlipStatusV302?.();
    assert(rankingQa302?.allPass===true,'Phase 302 live ranking FLIP/status QA failed: '+JSON.stringify(rankingQa302));
    const rankingRows302=[...document.querySelectorAll('#f1RacingTrackRankingV284 .f1-racing-track-ranking-row-v284')];
    assert(rankingRows302.length>=2&&rankingRows302.every(row=>Boolean(row.dataset.driverId)&&Number(row.dataset.statusCount||0)<=2),'Phase 302 live ranking keyed/status rows invalid');
    assert(new Set(rankingRows302.map(row=>row.dataset.driverId)).size===rankingRows302.length,'Phase 302 live ranking row keys are not unique');
    const feedbackQa303=window.mwsF1QaFeedbackUiV303?.();
    assert(feedbackQa303?.allPass===true,'Phase 303 feedback UI QA failed: '+JSON.stringify(feedbackQa303));
    const duplicateRank303=document.getElementById('f1RacingTrackRankingV284');
    assert(!duplicateRank303||getComputedStyle(duplicateRank303).display==='none','Phase 303 duplicate LIVE RANK still covers the track');
    const conversation303=document.getElementById('f1RacingConversationStackV276');
    assert(conversation303&&getComputedStyle(conversation303).display==='none','Phase 303 legacy conversation feed still visible');
    const cutin303=document.getElementById('f1RacingLiveCutinLayerV264');
    assert(cutin303?.parentElement?.classList.contains('f1-racing-race-map-stage-v188'),'Phase 303 LIVE cut-in still overlaps the track map');
    const variabilityQa303=window.mwsF1QaGameVariabilityV303?.();
    assert(variabilityQa303?.allPass===true&&Number(variabilityQa303?.config?.liveCadenceMs)>=8500&&Number(variabilityQa303?.config?.liveCadenceMs)<=12000&&Number(variabilityQa303?.config?.maxTotalBiasKph)>=4.5,'Phase 303 race variability QA failed: '+JSON.stringify(variabilityQa303));
    const dynamicsQa314=window.mwsF1QaRaceDynamicsV314?.();
    assert(dynamicsQa314?.allPass===true,'Phase 314 race dynamics QA failed: '+JSON.stringify(dynamicsQa314));
    assert(Number(dynamicsQa314?.tyreWear?.SOFT)>=.10&&Number(dynamicsQa314?.tyreWear?.MEDIUM)>=.08&&Number(dynamicsQa314?.tyreWear?.HARD)>=.06,'Phase 314 tyre wear acceleration not active: '+JSON.stringify(dynamicsQa314?.tyreWear));
    const catchup314=dynamicsQa314?.catchup||[];
    assert(catchup314.length>=4&&Number(catchup314.at(-1)?.pct)>Number(catchup314[0]?.pct)&&Number(dynamicsQa314?.variability?.positionCatchupMaxPct)>=.04,'Phase 314 rear position percentage catch-up bonus invalid: '+JSON.stringify(catchup314));
    const frontPressure314=dynamicsQa314?.front||[];
    assert(frontPressure314.length>=4&&Number(frontPressure314[0]?.rankScore)>Number(frontPressure314[1]?.rankScore)&&Number(frontPressure314[1]?.rankScore)>=Number(frontPressure314[2]?.rankScore),'Phase 314 front-position mistake pressure gradient invalid: '+JSON.stringify(frontPressure314));
    const livePolicy307=window.mwsF1QaLiveCutinPolicyV307?.();
    assert(livePolicy307?.allPass===true&&Number(livePolicy307?.templateCount)>=256&&Number(livePolicy307?.uniqueTemplateCount)>=256,'Phase 307 LIVE phrase library QA failed: '+JSON.stringify(livePolicy307));
    const liveDiversity315=window.mwsF1QaLiveDiversityV315?.();
    assert(liveDiversity315?.allPass===true&&Number(liveDiversity315?.statusTemplates)>=16,'Phase 315 LIVE participant diversity QA failed: '+JSON.stringify(liveDiversity315));
    assert(Number(liveDiversity315?.config?.recentDriverLimit)>=5&&Number(liveDiversity315?.config?.rearCoverageWeight)>0,'Phase 315 LIVE coverage weighting missing: '+JSON.stringify(liveDiversity315?.config));
    assert(Number(livePolicy307?.config?.maxActive)===1&&Number(livePolicy307?.config?.globalCadenceMs)>=5000&&Number(livePolicy307?.config?.minDurationMs)>=4500,'Phase 307 LIVE frequency or duration policy failed: '+JSON.stringify(livePolicy307));
    window.mwsF1ToggleSimulationPauseV192?.(true);
    window.mwsF1ResetLiveCutinsV264?.();
    const liveStandings307=window.mwsF1ComputeRaceStandingsV191?.()||[];
    const liveDriver307=liveStandings307[1]?.vehicle||liveStandings307[0]?.vehicle;
    const liveTarget307=liveStandings307[0]?.vehicle===liveDriver307?liveStandings307[1]?.vehicle:liveStandings307[0]?.vehicle;
    assert(liveDriver307&&liveTarget307,'Phase 307 LIVE merge test drivers missing');
    for(const state307 of ['PULLING_OUT','SIDE_BY_SIDE','COUNTER_ATTACK','PASS_COMPLETED']){
      window.mwsF1EnqueueLiveCutinV264?.(liveDriver307,state307,String(liveTarget307.id||''));
      await sleep(70);
    }
    await raf();
    const mergedLive307=window.mwsF1GetLiveCutinStateV264?.();
    const liveCards307=[...document.querySelectorAll('#f1RacingLiveCutinLayerV264 .f1-racing-live-cutin-v264')];
    assert(Number(mergedLive307?.active)===1&&Number(mergedLive307?.queued)===0&&liveCards307.length===1,'Phase 307 consecutive LIVE events were not merged: '+JSON.stringify(mergedLive307));
    assert(Number(mergedLive307?.activeEntries?.[0]?.mergedCount)>=4&&Number(mergedLive307?.mergeCount)>=3,'Phase 307 merge counter did not advance: '+JSON.stringify(mergedLive307));
    assert(String(liveCards307[0]?.querySelector('[data-f1-live-merge-count-v307]')?.textContent||'').includes('4'),'Phase 307 merged LIVE badge missing');
    const mergedMessage307=String(liveCards307[0]?.querySelector('p')?.textContent||'');
    assert(mergedMessage307&&String(mergedLive307?.activeEntries?.[0]?.event)==='PASS_SUCCESS','Phase 307 merged LIVE did not reach final pass state: '+JSON.stringify(mergedLive307));
    window.mwsF1SyncTrackOverlaysV308?.();await raf();
    const liveStage308=document.querySelector('#f1RacingViewRaceV185 .f1-racing-race-map-stage-v188');
    const liveLayer308=document.getElementById('f1RacingLiveCutinLayerV264');
    const liveCard308=liveLayer308?.querySelector('.f1-racing-live-cutin-v264');
    assert(liveStage308&&liveLayer308?.parentElement===liveStage308&&liveLayer308.classList.contains('track-docked-v308'),'Phase 308 LIVE is not docked to track lower-left');
    const liveStageRect308=liveStage308.getBoundingClientRect(),liveRect308=liveLayer308.getBoundingClientRect();
    assert(liveRect308.left<=liveStageRect308.left+Math.max(40,liveStageRect308.width*.12)&&liveRect308.bottom>=liveStageRect308.bottom-Math.max(50,liveStageRect308.height*.18),'Phase 308 LIVE lower-left geometry failed: '+JSON.stringify({stage:{left:liveStageRect308.left,bottom:liveStageRect308.bottom,width:liveStageRect308.width,height:liveStageRect308.height},live:{left:liveRect308.left,bottom:liveRect308.bottom}}));
    assert(String(getComputedStyle(liveCard308).animationName||'').includes('f1LiveTrackEnterV308'),'Phase 308 LIVE entrance effect missing');
    await sleep(3000);
    assert(document.querySelectorAll('#f1RacingLiveCutinLayerV264 .f1-racing-live-cutin-v264').length===1,'Phase 307 LIVE card did not remain visible long enough');
    window.mwsF1ResetLiveCutinsV264?.();
    window.mwsF1ToggleSimulationPauseV192?.(false);
    const thoughtSpeaker303=String(contacts[0]?.name||'Recovery H Alpha');
    const thoughtSpeaker306=String(contacts[1]?.name||'Recovery H Bravo');
    window.mwsF1AppendLiveConversationV276?.(thoughtSpeaker303,'지금 간다');
    await sleep(80);
    window.mwsF1AppendLiveConversationV276?.(thoughtSpeaker306,'추월한다');
    await sleep(180);await raf();
    window.mwsF1SyncTrackOverlaysV308?.();await raf();
    const dialogueHud308=document.getElementById('f1RacingDialogueHudV308');
    const dialogueCard308=dialogueHud308?.querySelector('.f1-racing-dialogue-card-v308');
    const dialogueStage308=document.querySelector('#f1RacingViewRaceV185 .f1-racing-race-map-stage-v188');
    assert(dialogueHud308&&dialogueCard308&&dialogueHud308.parentElement===dialogueStage308,'Phase 308 driver profile HUD missing from track lower-right');
    assert(Boolean(dialogueCard308.querySelector('.f1-racing-dialogue-avatar-v308')),'Phase 308 driver profile avatar missing');
    const hudRect308=dialogueHud308.getBoundingClientRect(),hudStageRect308=dialogueStage308.getBoundingClientRect();
    assert(hudRect308.right>=hudStageRect308.right-Math.max(50,hudStageRect308.width*.12)&&hudRect308.bottom>=hudStageRect308.bottom-Math.max(50,hudStageRect308.height*.18),'Phase 308 driver HUD lower-right geometry failed');
    assert([...document.querySelectorAll('.f1-racing-driver-thought-v303')].every(node=>getComputedStyle(node).display==='none'),'Phase 308 legacy track speech bubble still visible');
    const overlayQa308=window.mwsF1QaTrackOverlayHudV308?.();
    assert(overlayQa308?.allPass===true,'Phase 308 track overlay HUD QA failed: '+JSON.stringify(overlayQa308));
    const overlayState308=window.mwsF1GetTrackOverlayStateV308?.();
    assert(Number(overlayState308?.config?.globalGapMs)>=6000&&Number(overlayState308?.config?.speakerGapMs)>=10000,'Phase 308 dialogue HUD frequency guard too loose: '+JSON.stringify(overlayState308));
    const dialogueSemantic315=window.mwsF1QaDialogueSemanticV315?.();
    assert(dialogueSemantic315?.allPass===true&&Number(dialogueSemantic315?.unique)>=4,'Phase 315 dialogue semantic diversity QA failed: '+JSON.stringify(dialogueSemantic315));
    assert(Number(dialogueSemantic315?.config?.semanticWindow)>=2&&Number(dialogueSemantic315?.config?.recentSpeakerLimit)>=5,'Phase 315 dialogue semantic/speaker guard missing: '+JSON.stringify(dialogueSemantic315));
    window.mwsF1LayoutMarkerOverlaysV306?.();await raf();
    const thoughtMarker303=[...document.querySelectorAll('.f1-racing-race-vehicle-v189')].find(marker=>marker.querySelector('.f1-racing-driver-thought-v303'));
    assert(thoughtMarker303,'Phase 303 racer thought bubble did not attach to a track marker');
    assert([...document.querySelectorAll('.thought-text-v303')].some(node=>String(node.textContent||'').includes('지금 간다')),'Phase 303 racer thought bubble text missing');
    const markerCollisionQa306=window.mwsF1QaMarkerOverlayCollisionV306?.();
    assert(markerCollisionQa306?.allPass===true,'Phase 306 marker overlay collision QA failed: '+JSON.stringify(markerCollisionQa306));
    assert(Number(markerCollisionQa306?.thoughtOverlap?.nodes)===0,'Phase 306 two-racer thought collision scenario was not exercised: legacy SVG thoughts must be retired by Phase 308 '+JSON.stringify(markerCollisionQa306));
    assert(Number(markerCollisionQa306?.thoughtOverlap?.count)===0,'Phase 306 racer thought bubbles still overlap: '+JSON.stringify(markerCollisionQa306));
    assert(markerCollisionQa306?.fixedMarkerModeV309===true,'Phase 309 fixed marker mode was not honored by Phase 306: '+JSON.stringify(markerCollisionQa306));
    const phase309Qa=window.mwsF1QaViewportMarkerOvertakeV309?.();
    assert(phase309Qa?.allPass===true,'Phase 309 viewport/marker/overtake QA failed: '+JSON.stringify(phase309Qa));
    assert(phase309Qa?.labelFixed===true&&phase309Qa?.tagFixed===true,'Phase 309 marker labels are not fixed under the orb: '+JSON.stringify(phase309Qa));
    assert(phase309Qa?.viewportFit===true&&phase309Qa?.defaultHeightOk===true,'Phase 309 reset workspace does not fit current viewport: '+JSON.stringify(phase309Qa));
    const uiSpacingBattle319=window.mwsF1QaUiSpacingBattleV319?.();
    assert(uiSpacingBattle319?.allPass===true,'Phase 319 UI spacing and battle isolation QA failed: '+JSON.stringify(uiSpacingBattle319));
    assert(uiSpacingBattle319?.thirdBlocked===true&&Number(uiSpacingBattle319?.visual?.blockedGap)>=Number(uiSpacingBattle319?.config?.blockedDisplayGapMeters)-.1,'Phase 319 third-car battle isolation failed: '+JSON.stringify(uiSpacingBattle319));
    const visibilityQa324=window.mwsF1QaUiVisibilitySpacingV324?.();
    assert(visibilityQa324?.allPass===true,'Phase 324 marker visibility/train spacing QA failed: '+JSON.stringify(visibilityQa324));
    assert(Number(visibilityQa324?.markerGeometry?.ringRadius)>=17&&Number(visibilityQa324?.markerGeometry?.profileWidth)>=28,'Phase 324 racer orb did not enlarge: '+JSON.stringify(visibilityQa324?.markerGeometry));
    assert(Number(visibilityQa324?.spacing?.normalDisplayGapMeters)>=65&&Number(visibilityQa324?.spacing?.blockedDisplayGapMeters)>=90&&Number(visibilityQa324?.spacing?.physicalFollowGapMeters)>=18,'Phase 324 train spacing/headway too small: '+JSON.stringify(visibilityQa324?.spacing));
    const liveMarkers319=[...document.querySelectorAll('.f1-racing-race-vehicle-v189')];
    assert(liveMarkers319.length>=2&&liveMarkers319.every(node=>Number(node.dataset.cameraScaleV245)>0),'Phase 319 live marker readability state missing');
    const cadenceQa281=window.mwsF1QaDialogueCadenceV281?.();
    assert(cadenceQa281?.allPass===true,'Phase 281 dialogue cadence QA failed: '+JSON.stringify(cadenceQa281));
    assert(cadenceQa281?.budgetBlocked===true&&Number(cadenceQa281?.config?.maxGroupsPerWindow)<=2&&Number(cadenceQa281?.config?.speakerGapMs)>=4000,'Phase 281 dialogue window budget failed: '+JSON.stringify(cadenceQa281));
    assert(cadenceQa281?.criticalAllowed===true&&cadenceQa281?.duplicateBlocked===true,'Phase 281 critical dialogue priority failed: '+JSON.stringify(cadenceQa281));
    const coverageQa280=window.mwsF1QaEventDialogueCoverageV280?.();
    assert(coverageQa280?.allPass===true,'Phase 280 event-dialogue coverage QA failed: '+JSON.stringify(coverageQa280));
    assert(Array.isArray(coverageQa280?.unmapped)&&coverageQa280.unmapped.length===0&&coverageQa280?.allCatalogMapped===true,'Phase 280 unmapped micro event found: '+JSON.stringify(coverageQa280));
    assert(Array.isArray(coverageQa280?.emptyPools)&&coverageQa280.emptyPools.length===0&&coverageQa280?.allPoolsReady===true,'Phase 280 empty dialogue pool found: '+JSON.stringify(coverageQa280));
    const dialoguePoolQa279=window.mwsF1QaExpandedDialoguePoolV279?.();
    assert(dialoguePoolQa279?.allPass===true,'Phase 279 expanded dialogue pool QA failed: '+JSON.stringify(dialoguePoolQa279));
    assert(Number(dialoguePoolQa279?.stats?.total)>=400&&Number(dialoguePoolQa279?.uniqueCount)>=300,'Phase 279 dialogue pool below 300: '+JSON.stringify(dialoguePoolQa279));
    assert(dialoguePoolQa279?.microCoverage===true&&Number(dialoguePoolQa279?.categoryCount)>=13,'Phase 279 micro dialogue coverage incomplete: '+JSON.stringify(dialoguePoolQa279));
    const microQa278=window.mwsF1QaMicroBattleEventsV278?.();
    assert(microQa278?.allPass===true,'Phase 278 micro battle QA failed: '+JSON.stringify(microQa278));
    assert(microQa278?.coverage===true&&Number(microQa278?.eventCount)>=27,'Phase 278 event catalog incomplete: '+JSON.stringify(microQa278));
    assert(microQa278?.thresholdCoverage===true&&Array.isArray(microQa278?.threshold)&&microQa278.threshold.length===3,'Phase 278 threshold detection failed: '+JSON.stringify(microQa278));
    const dialogueQa277=window.mwsF1QaCharacterDialogueEngineV277?.();
    assert(dialogueQa277?.allPass===true,'Phase 277 character dialogue QA failed: '+JSON.stringify(dialogueQa277));
    assert(dialogueQa277?.roleCoverage===true&&dialogueQa277?.poolsReady===true&&dialogueQa277?.nonRepeat===true,'Phase 277 event-role mapping incomplete: '+JSON.stringify(dialogueQa277));
    assert(dialogueQa277?.bracketInfo===true&&String(dialogueQa277?.info||'').startsWith('['),'Phase 277 commentary bracket format failed: '+JSON.stringify(dialogueQa277));
    const conversationQa276=window.mwsF1QaLiveConversationStackV276?.();
    assert(conversationQa276?.allPass===true,'Phase 276 conversation stack QA failed: '+JSON.stringify(conversationQa276));
    assert(conversationQa276?.alternating===true&&conversationQa276?.sides?.length>=3,'Phase 276 conversation side alternation failed: '+JSON.stringify(conversationQa276));
    assert(Number(conversationQa276?.shortDuration)>=3000&&Number(conversationQa276?.longDuration)<=6000&&Number(conversationQa276?.longDuration)>=Number(conversationQa276?.shortDuration),'Phase 276 conversation duration bounds failed: '+JSON.stringify(conversationQa276));
    const headline260=window.mwsF1RaceHeadlineStateV255?.();
    assert(Number(headline260?.total)===17&&Number(headline260?.remaining)===17,'Phase 260 headline remaining laps mismatch: '+JSON.stringify(headline260));

    const burstQa275=window.mwsF1QaChaseBurstV275?.();
    assert(burstQa275?.allPass===true,'Phase 275 chase burst QA failed: '+JSON.stringify(burstQa275));
    assert(burstQa275?.eligible?.eligible===true&&burstQa275?.leader?.eligible===false&&burstQa275?.pit?.eligible===false&&burstQa275?.incident?.eligible===false&&burstQa275?.exhausted?.eligible===false,'Phase 275 burst eligibility invalid: '+JSON.stringify(burstQa275));
    assert(Number(burstQa275?.config?.maxUsesPerRace)<=2&&Number(burstQa275?.config?.activationChance)<=.05,'Phase 275 burst bounds too aggressive: '+JSON.stringify(burstQa275?.config));
    const pressureQa274=window.mwsF1QaLeaderPressureV274?.();
    assert(pressureQa274?.allPass===true,'Phase 274 leader pressure QA failed: '+JSON.stringify(pressureQa274));
    assert(Number(pressureQa274?.close?.score)===0&&Number(pressureQa274?.runaway?.score)>0,'Phase 274 tight-fight suppression missing: '+JSON.stringify(pressureQa274));
    assert(Number(pressureQa274?.late?.score)<Number(pressureQa274?.runaway?.score)&&Number(pressureQa274?.group?.score)<Number(pressureQa274?.runaway?.score),'Phase 274 late/group pressure scaling invalid: '+JSON.stringify(pressureQa274));
    const pressureStates274=window.mwsF1GetLeaderPressureStatesV274?.()||[];
    assert(pressureStates274.length>=2&&pressureStates274.every(row=>Number(row.speedFactor)>=.94&&Number(row.speedFactor)<=1&&Number(row.score)>=0&&Number(row.score)<=1),'Phase 274 pressure state invalid: '+JSON.stringify(pressureStates274));

    const cornerQa270=window.mwsF1QaCornerDynamicsV270?.();
    assert(cornerQa270?.allPass===true&&cornerQa270?.exitsRecover===true&&cornerQa270?.lineTransitions===true,'Phase 270 corner dynamics QA failed: '+JSON.stringify(cornerQa270));
    assert(cornerQa270.samples.every(row=>Number(row.exitTarget)>=Number(row.apexTarget)-1),'Phase 270 exit acceleration did not recover after apex: '+JSON.stringify(cornerQa270.samples));

    const boundaryQa271=window.mwsF1QaTrackBoundaryV271?.();
    assert(boundaryQa271?.allPass===true&&boundaryQa271?.liveInside===true&&boundaryQa271?.offTrackBlocked===true&&boundaryQa271?.edgeBlocked===true,'Phase 271 track boundary QA failed: '+JSON.stringify(boundaryQa271));
    assert(Number(boundaryQa271?.beyond?.speedFactor)<Number(boundaryQa271?.center?.speedFactor),'Phase 271 off-track penalty missing: '+JSON.stringify(boundaryQa271));

    const immersiveQa261=window.mwsF1QaImmersiveV261?.();
    assert(immersiveQa261?.allPass===true,'Phase 261 immersive QA failed: '+JSON.stringify(immersiveQa261));
    const layoutBefore261=window.mwsF1WorkspaceLayoutSignatureV259?.(window.mwsF1GetWorkspaceLayoutRecoveryE?.());
    const immersiveEnter261=await window.mwsF1EnterImmersiveV261?.();
    await raf();
    assert(immersiveEnter261?.ok===true&&document.body.classList.contains('f1-racing-immersive'),'Phase 261 immersive entry failed: '+JSON.stringify(immersiveEnter261));
    const sidebar261=document.querySelector('.sidebar');
    const topbar261=document.querySelector('.main>.topbar');
    assert(!sidebar261||getComputedStyle(sidebar261).display==='none','Phase 261 sidebar remained visible');
    assert(!topbar261||getComputedStyle(topbar261).display==='none','Phase 261 topbar remained visible');
    const notice261=document.getElementById('f1RacingImmersiveNoticeV261');
    assert(String(notice261?.textContent||'').includes('ESC'),'Phase 261 ESC notice missing');
    const layoutDuring261=window.mwsF1WorkspaceLayoutSignatureV259?.(window.mwsF1GetWorkspaceLayoutRecoveryE?.());
    assert(layoutDuring261===layoutBefore261,'Phase 261 immersive layout signature changed during entry');
    const immersiveSection268=document.getElementById('gameF1Racing')?.getBoundingClientRect();
    const immersiveRace268=document.getElementById('f1RacingViewRaceV185')?.getBoundingClientRect();
    const immersiveWorkspace268=document.getElementById('f1RacingWorkspaceRecoveryE')?.getBoundingClientRect();
    assert(immersiveSection268&&immersiveSection268.top>=-1&&immersiveSection268.bottom<=innerHeight+2,'Phase 268 fullscreen section clipped: '+JSON.stringify(immersiveSection268));
    assert(immersiveRace268&&immersiveRace268.top>=-1&&immersiveRace268.bottom<=innerHeight+2,'Phase 268 fullscreen race view clipped: '+JSON.stringify(immersiveRace268));
    assert(immersiveWorkspace268&&immersiveWorkspace268.height>300&&immersiveWorkspace268.bottom<=innerHeight+2,'Phase 268 fullscreen workspace clipped: '+JSON.stringify(immersiveWorkspace268));
    assert(getComputedStyle(document.getElementById('gameF1Racing')).overflow==='hidden','Phase 268 fullscreen section still scroll-clips its workspace');
    await window.mwsF1ExitImmersiveV261?.({reason:'recovery-h-qa'});
    await raf();
    const layoutAfter261=window.mwsF1WorkspaceLayoutSignatureV259?.(window.mwsF1GetWorkspaceLayoutRecoveryE?.());
    assert(!document.body.classList.contains('f1-racing-immersive')&&layoutAfter261===layoutBefore261,'Phase 261 immersive layout signature changed after exit');

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
    assert(track.width>wr.width*.54&&track.width<wr.width*.62,'Track Map width is not the expected Phase 305 7/12 share: '+track.width+'/'+wr.width);
    assert(timing.width>wr.width*.38&&timing.width<wr.width*.46,'Live Timing width is not the expected Phase 305 5/12 share: '+timing.width+'/'+wr.width);
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

  const phase305ViewportMatrix=[];
  for(const viewport of [
    {label:'2k-100',width:2560,height:1440},
    {label:'2k-150-equivalent',width:1707,height:960},
    {label:'fhd-100',width:1920,height:1080},
    {label:'compact-desktop',width:1366,height:768}
  ]){
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:false});
    await sleep(260);
    const row=await evaluate(cdp,`(()=>{
      window.mwsF1SyncWorkspaceUiV305?.();
      const report=window.mwsF1WorkspaceUiReportV305?.()||{};
      const root=document.getElementById('f1RacingWorkspaceRecoveryE');
      const wr=root?.getBoundingClientRect();
      const visible=[...root?.querySelectorAll('[data-f1-workspace-panel]')||[]].filter(p=>!p.hidden&&getComputedStyle(p).display!=='none');
      const panelOverflow=visible.filter(p=>p.scrollWidth>p.clientWidth+2||p.scrollHeight>p.clientHeight+2&&p.dataset.f1WorkspacePanel==='track').map(p=>p.dataset.f1WorkspacePanel);
      return {...report,viewport:{width:innerWidth,height:innerHeight},workspaceBottom:wr?.bottom||0,panelOverflow};
    })()`,'Phase 305 viewport '+viewport.label);
    phase305ViewportMatrix.push({label:viewport.label,...row});
    if(row?.allPass!==true)throw new Error('Phase 305 viewport layout failed '+viewport.label+': '+JSON.stringify(row));
    if(Number(row?.workspaceBottom)>Number(row?.viewport?.height)+3)throw new Error('Phase 305 workspace bottom clipping '+viewport.label+': '+JSON.stringify(row));
    if(Array.isArray(row?.panelOverflow)&&row.panelOverflow.length)throw new Error('Phase 305 panel overflow '+viewport.label+': '+JSON.stringify(row));
  }
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
  await sleep(260);

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
    const phase305Qa=window.mwsF1QaWorkspaceUiV305?.();
    assert(phase305Qa?.allPass===true,'Phase 305 workspace UI QA failed: '+JSON.stringify(phase305Qa));
    const timingPanel305=document.querySelector('[data-f1-workspace-panel="timing"]');
    const trackPanel305=document.querySelector('[data-f1-workspace-panel="track"]');
    assert(timingPanel305&&trackPanel305,'Phase 305 primary panels missing');
    assert(timingPanel305.scrollWidth<=timingPanel305.clientWidth+2,'Phase 305 timing panel horizontal overflow');
    const timingDensity305=String(timingPanel305.dataset.f1TimingDensityV305||'');
    assert(['wide','standard','compact','micro'].includes(timingDensity305),'Phase 305 timing density missing');
    const layout305=window.mwsF1GetWorkspaceLayoutRecoveryE?.();
    assert(Number(layout305?.panels?.track?.w)>=7&&Number(layout305?.panels?.timing?.w)>=5,'Phase 305 default panel proportions not stabilized: '+JSON.stringify(layout305));

    const frameDeltas311=[];
    await new Promise(resolve=>{
      let previous=performance.now(),frames=0;
      const tick=now=>{
        if(frames>0)frameDeltas311.push(now-previous);
        previous=now;frames+=1;
        if(frames>=72)resolve();else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const sortedFrames311=[...frameDeltas311].sort((a,b)=>a-b);
    const framePacing311={
      samples:sortedFrames311.length,
      averageMs:Number((sortedFrames311.reduce((sum,value)=>sum+value,0)/Math.max(1,sortedFrames311.length)).toFixed(2)),
      p95Ms:Number((sortedFrames311[Math.min(sortedFrames311.length-1,Math.floor(sortedFrames311.length*.95))]||0).toFixed(2)),
      maxMs:Number((sortedFrames311.at(-1)||0).toFixed(2)),
      liveCards:document.querySelectorAll('#f1RacingLiveCutinLayerV264 .f1-racing-live-cutin-v264').length,
      dialogueCards:document.querySelectorAll('#f1RacingDialogueHudV308 .f1-racing-dialogue-card-v308').length
    };
    assert(framePacing311.samples>=60,'Phase 311 frame pacing sample count too low: '+JSON.stringify(framePacing311));
    assert(framePacing311.p95Ms<=90&&framePacing311.maxMs<=350,'Phase 311 frame pacing regression: '+JSON.stringify(framePacing311));
    assert(framePacing311.liveCards<=1&&framePacing311.dialogueCards<=1,'Phase 311 overlay DOM bound regression: '+JSON.stringify(framePacing311));

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
    const lateralSmoothingQa258=window.mwsF1QaVisualLateralSmoothingV258?.();
    assert(lateralSmoothingQa258?.allPass===true&&lateralSmoothingQa258?.smoothStart===true&&lateralSmoothingQa258?.converging===true&&lateralSmoothingQa258?.physicsIsolated===true,'Phase 258 visual lateral smoothing QA failed: '+JSON.stringify(lateralSmoothingQa258));
    const lateralDomQa258=window.mwsF1QaVisualLateralDomV258?.();
    assert(lateralDomQa258?.allPass===true&&lateralDomQa258?.noFirstFrameSnap===true&&lateralDomQa258?.convergesOverTime===true&&lateralDomQa258?.laterRenderMoved===true,'Phase 258 visual lateral DOM QA failed: '+JSON.stringify(lateralDomQa258));
    const workspaceUserDefaultQa259=window.mwsF1QaWorkspaceUserDefaultPersistenceV259?.();
    assert(workspaceUserDefaultQa259?.allPass===true&&workspaceUserDefaultQa259?.persistedSignature===workspaceUserDefaultQa259?.expected&&workspaceUserDefaultQa259?.preservedAfterOtherSetting===workspaceUserDefaultQa259?.expected&&workspaceUserDefaultQa259?.restoredSignature===workspaceUserDefaultQa259?.expected,'Phase 259 workspace user-default persistence QA failed: '+JSON.stringify(workspaceUserDefaultQa259));
    const markerNumberTexts=[...document.querySelectorAll('.f1-racing-race-vehicle-v189 .car-number-v232')].map(node=>String(node.textContent||'').trim());
    assert(markerNumberTexts.length>=2&&new Set(markerNumberTexts).size===markerNumberTexts.length,'Phase 232 driver marker numbers are not unique: '+JSON.stringify(markerNumberTexts));
    const labelCollisionQa=window.mwsF1QaDriverLabelCollisionV228?.();
    assert(labelCollisionQa?.allPass===true&&labelCollisionQa?.fixedBelowV309===true&&labelCollisionQa?.overlapAllowedV309===true,'Phase 228 driver label fixed-below QA failed after Phase 309: '+JSON.stringify(labelCollisionQa));
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
    assert(zoomState245.mode==='FULL'&&zoomState245.zoom===4.5,'Phase 245 wheel zoom did not reach clamped maximum while preserving automatic mode');
    const sizesAtZoom245=measure245();
    const zoomMarkerQa285=window.mwsF1QaZoomLinkedMarkerScaleV285?.();
    const expectedDriverRatio245=Number(zoomMarkerQa285?.screenRatios?.at(-1))||1;
    sizesAtZoom245.forEach((row,index)=>{
      const ratio=row.width/sizesAtFull245[index].width;
      const driverMarker=index<4;
      if(driverMarker){
        const textMarker245=row.selector==='.car-number-v232'||row.selector==='.car-label';
        const lower245=textMarker245?.80:.88,upper245=textMarker245?1.20:1.12;
        assert(ratio>expectedDriverRatio245*lower245&&ratio<expectedDriverRatio245*upper245,'Phase 285 zoom-linked driver marker scale mismatch: '+JSON.stringify({row,ratio,expectedDriverRatio245,textMarker245}));
      }else{
        assert(ratio>.85&&ratio<1.12,'Phase 245 track annotation screen-size regression: '+JSON.stringify({row,ratio}));
      }
    });
    assert(zoomMarkerQa285?.allPass===true&&expectedDriverRatio245>.94&&expectedDriverRatio245<1.06,'Phase 319 marker screen-size lock unavailable or invalid: '+JSON.stringify(zoomMarkerQa285));
    assert(finishLength245()/lineAtFull245>4.4,'Phase 245 finish line must retain track-relative geometry');
    window.mwsF1SetRaceCameraModeV216('AUTO');await raf();
    for(let zoomOut268=0;zoomOut268<3&&Number(window.mwsF1GetRaceCameraStateV216?.().zoom)>=4.2;zoomOut268++){
      mapStage.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:120,clientX:mapRect.left+mapRect.width/2,clientY:mapRect.top+mapRect.height/2}));
      await raf();
    }
    const zoomBefore268=Number(window.mwsF1GetRaceCameraStateV216?.().zoom)||0;
    mapStage.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:-120,clientX:mapRect.left+mapRect.width/2,clientY:mapRect.top+mapRect.height/2}));
    await raf();
    const wheelState268=window.mwsF1GetRaceCameraStateV216?.();
    assert(wheelState268?.mode==='AUTO'&&Number(wheelState268?.zoom)>zoomBefore268,'Phase 268 wheel zoom must keep AUTO: '+JSON.stringify({zoomBefore268,wheelState268}));
    const dragStartX=mapRect.left+mapRect.width*.5,dragStartY=mapRect.top+mapRect.height*.5;
    mapStage.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:dragStartX,clientY:dragStartY,pointerId:268,buttons:1,button:0}));
    mapStage.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:dragStartX+30,clientY:dragStartY+18,pointerId:268,buttons:1}));
    mapStage.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:dragStartX+30,clientY:dragStartY+18,pointerId:268,buttons:0}));
    await raf();
    assert(window.mwsF1GetRaceCameraStateV216?.().mode==='MANUAL','Phase 268 drag did not enter MANUAL');
    assert(window.mwsF1SetRaceCameraModeV216?.('AUTO')===true,'Phase 268 auto camera restore failed');
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
    window.mwsF1SyncViewportMarkerOvertakeV309?.();await raf();
    const resetWorkspace309=document.getElementById('f1RacingWorkspaceRecoveryE'),resetRect309=resetWorkspace309?.getBoundingClientRect();
    const viewport309=Math.max(1,Number(window.visualViewport?.height)||window.innerHeight||document.documentElement.clientHeight||1);
    assert(resetRect309&&resetRect309.bottom<=viewport309+2,'Phase 309 reset workspace extends below viewport: '+JSON.stringify(resetRect309?{top:resetRect309.top,bottom:resetRect309.bottom,height:resetRect309.height,viewport:viewport309}:null));
    assert(Number(resetWorkspace309?.dataset?.usedRows||0)>10||resetRect309.height<=642,'Phase 309 default reset workspace remains too tall: '+JSON.stringify(resetRect309?{height:resetRect309.height,usedRows:resetWorkspace309?.dataset?.usedRows}:null));
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

    assert(window.mwsF1ResizeSplitRecoveryJ?.('track',-1,0)===true,'Phase 259 could not create manual workspace layout');
    await raf();
    const phase259ManualLayout=window.mwsF1GetWorkspaceLayoutRecoveryE?.();
    const phase259ManualSignature=window.mwsF1WorkspaceLayoutSignatureV259?.(phase259ManualLayout);
    const phase259PersistedBeforeRace=window.mwsGetF1RacingSettingsRecoveryD?.()?.workspaceLayout;
    const phase259PersistedSignature=window.mwsF1WorkspaceLayoutSignatureV259?.(phase259PersistedBeforeRace);
    assert(Boolean(phase259ManualSignature)&&phase259PersistedSignature===phase259ManualSignature,'Phase 259 manual workspace was not auto-saved: '+JSON.stringify({phase259ManualLayout,phase259PersistedBeforeRace}));

    document.getElementById('f1RacingRaceCancelRecoveryC')?.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='SETUP','Race cancel did not return to Setup');
    const afterCancelIds=window.mwsF1GetSelectedContactIdsV181?.()||[];
    assert(context.driverIds?.every(id=>afterCancelIds.includes(id)),'Participants were lost after race cancel');
    assert(String(window.mwsF1GetActiveTrackV182?.()?.id||'')===String(context.targetTrackId),'Track was lost after race cancel');

    assert(window.mwsF1StartRaceFromSetupV187?.()===true,'Second race preparation failed');
    await sleep(1200);await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='GRID','Second race started before explicit grid click');
    assert(await window.mwsF1WaitGridRevealV273?.(8000)===true,'Phase 273 second-race reveal did not finish');
    document.getElementById('f1RacingGridStartRecoveryM')?.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='RACE','Second explicit start did not reach RACE');
    const phase259NextRaceLayout=window.mwsF1GetWorkspaceLayoutRecoveryE?.();
    const phase259NextRaceSignature=window.mwsF1WorkspaceLayoutSignatureV259?.(phase259NextRaceLayout);
    assert(phase259NextRaceSignature===phase259ManualSignature,'Phase 259 next-race workspace layout changed: '+JSON.stringify({expected:phase259ManualLayout,actual:phase259NextRaceLayout}));
    assert(document.getElementById('f1RacingWorkspaceRecoveryE')?.dataset?.userDefaultReasonV259==='race-start','Phase 259 race-start restore marker missing');
    document.getElementById('f1RacingWorkspaceResetRecoveryE')?.click();await raf();

    assert(window.mwsF1ForceFinishRecoveryG?.()===true,'Force finish QA hook failed');
    await sleep(140);await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='RACE','Phase 291 finish must keep the race screen active');
    const finishOverlay291=document.getElementById('f1RacingFinishOverlayV291');
    assert(finishOverlay291&&!finishOverlay291.hidden&&getComputedStyle(finishOverlay291).display!=='none','Phase 291 finish overlay is not visible');
    assert(document.getElementById('f1RacingViewRaceV185')?.hidden===false,'Phase 291 race screen was hidden behind final result');
    const podiumCount=document.querySelectorAll('#f1RacingFinishOverlayPodiumV291 .place').length;
    assert(podiumCount>=2,'Phase 291 podium overlay did not render expected drivers');
    const resultRows304=[...document.querySelectorAll('#f1RacingFinishOverlayResultsV291 .row')];
    const resultCount=resultRows304.length;
    assert(resultCount>=2,'Phase 291 full result overlay rows missing');
    const resultHeaders304=[...document.querySelectorAll('.f1-racing-finish-result-head-v291>span')].map(node=>String(node.textContent||'').trim());
    assert(resultHeaders304.join('|')==='POS|DRIVER|START|MOVE|PIT|BEST LAP|OVERTAKES|TIME','Phase 304 final result headers incomplete: '+JSON.stringify(resultHeaders304));
    assert(resultRows304.every(row=>row.hasAttribute('data-result-delta-v304')&&row.hasAttribute('data-pit-stops-v304')&&row.querySelector('.movement-v304')&&row.querySelector('.pit-v304')),'Phase 304 result rows missing movement or PIT data');
    assert(resultRows304[0]?.classList.contains('winner-v304'),'Phase 304 P1 result winner emphasis missing');
    const podiumWinner304=document.querySelector('#f1RacingFinishOverlayPodiumV291 .place.winner-v304');
    assert(podiumWinner304&&podiumWinner304.querySelector('.winner-tag-v304'),'Phase 304 podium winner emphasis missing');
    const resultClosureQa304=window.mwsF1QaFinishResultClosureV304?.();
    assert(resultClosureQa304?.allPass===true,'Phase 304 finish result closure QA failed: '+JSON.stringify(resultClosureQa304));
    const finalDesktopQa292=window.mwsF1QaFinalDesktopV292?.();
    assert(finalDesktopQa292?.allPass===true,'Phase 292 final desktop QA failed after finish: '+JSON.stringify(finalDesktopQa292));
    const finalRegressionQa295=window.mwsF1QaFinalRegressionV295?.();
    assert(finalRegressionQa295?.allPass===true,'Phase 295 final regression QA failed after finish: '+JSON.stringify(finalRegressionQa295));

    document.getElementById('f1RacingFinishOverlayNewRaceV291')?.click();
    await sleep(1200);await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='GRID','Same-settings new race auto-started before explicit click');
    assert(await window.mwsF1WaitGridRevealV273?.(8000)===true,'Phase 273 same-settings reveal did not finish');
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
    const phase305Final=window.mwsF1QaWorkspaceUiV305?.();
    assert(phase305Final?.allPass===true,'Phase 305 final workspace UI QA failed: '+JSON.stringify(phase305Final));

    const engineAlignmentQa242=window.mwsF1QaRealEngineBenchmarkAlignmentV242?.();
    assert(engineAlignmentQa242?.allPass===true&&Number(engineAlignmentQa242?.speedCorrelation)>=.7&&Number(engineAlignmentQa242?.uniqueActualSignatures)>=5&&Number(engineAlignmentQa242?.overtakeStress?.totalPasses)>=1,'Phase 242 real-engine benchmark alignment failed: '+JSON.stringify(engineAlignmentQa242));

    const momentumBenchmark262=window.mwsF1QaRaceMomentumBenchmarkV262?.();
    assert(momentumBenchmark262?.allPass===true,'Phase 262 momentum benchmark failed: '+JSON.stringify(momentumBenchmark262));
    assert(momentumBenchmark262?.allPass===true&&Number(momentumBenchmark262?.trackCount)===7&&Number(momentumBenchmark262?.completedRuns)===7,'Phase 275 long-run benchmark failed: '+JSON.stringify(momentumBenchmark262));
    const longRunQa282=window.mwsF1QaDialogueLongRunDesktopV282?.(momentumBenchmark262);
    assert(longRunQa282?.allPass===true,'Phase 282 integrated long-run QA failed: '+JSON.stringify(longRunQa282));
    assert(longRunQa282?.benchmarkPass===true&&Number(longRunQa282?.benchmark?.trackCount)===7&&Number(longRunQa282?.benchmark?.completedRuns)===7,'Phase 282 seven-track benchmark failed: '+JSON.stringify(longRunQa282));
    assert(longRunQa282?.boundedPass===true&&Object.values(longRunQa282?.bounded||{}).every(Boolean),'Phase 282 dialogue memory bounds failed: '+JSON.stringify(longRunQa282));
    assert(longRunQa282?.desktopUi===true&&longRunQa282?.dialoguePass===true&&longRunQa282?.rulesPass===true,'Phase 282 desktop dialogue integration failed: '+JSON.stringify(longRunQa282));
    assert(Number(momentumBenchmark262?.trackCount)===7&&Number(momentumBenchmark262?.completedRuns)===7,'Phase 262 benchmark did not complete all 7 tracks: '+JSON.stringify(momentumBenchmark262));
    assert(Boolean(momentumBenchmark262?.deterministicRepeat),'Phase 262 benchmark repeat was not deterministic');
    assert(Math.abs(Number(momentumBenchmark262?.gridFinishCorrelation)||0)<.94,'Phase 262 grid-finish correlation remains too strong: '+JSON.stringify(momentumBenchmark262?.gridFinishCorrelation));
    assert(Number(momentumBenchmark262?.p1Retention)<.9,'Phase 262 P1 retention remains too strong: '+JSON.stringify(momentumBenchmark262?.p1Retention));
    assert(Number(momentumBenchmark262?.top3Variation)>.04,'Phase 262 Top3 variation too low: '+JSON.stringify(momentumBenchmark262?.top3Variation));
    assert(Number(momentumBenchmark262?.averageOvertakes)>=1,'Phase 262 average overtakes too low: '+JSON.stringify(momentumBenchmark262?.averageOvertakes));
    assert(Number(momentumBenchmark262?.averageUniquePassPairs)>=1,'Phase 309 unique pass opponents too low: '+JSON.stringify(momentumBenchmark262?.averageUniquePassPairs));
    assert(Number(momentumBenchmark262?.averageOrderChanges)>=1,'Phase 309 actual order changes too low: '+JSON.stringify(momentumBenchmark262?.averageOrderChanges));
    assert(Number(momentumBenchmark262?.averageDriversMovedFromGrid)>=1,'Phase 309 finish-order movement too low: '+JSON.stringify(momentumBenchmark262?.averageDriversMovedFromGrid));
    assert(Number(momentumBenchmark262?.abnormalGapRuns)<=2,'Phase 262 abnormal gap runs too high: '+JSON.stringify(momentumBenchmark262?.gapRows));
    assert(window.mwsF1GetScreenStateV185?.()==='SETUP','Phase 262 momentum benchmark did not restore Setup');

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
      phase311FramePacing:framePacing311,
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
      raceMomentumV262:{
        gridFinishCorrelation:Number(momentumBenchmark262?.gridFinishCorrelation)||0,
        averageOvertakes:Number(momentumBenchmark262?.averageOvertakes)||0,
        averageUniquePassPairs:Number(momentumBenchmark262?.averageUniquePassPairs)||0,
        averageOrderChanges:Number(momentumBenchmark262?.averageOrderChanges)||0,
        averageDriversMovedFromGrid:Number(momentumBenchmark262?.averageDriversMovedFromGrid)||0,
        p1Retention:Number(momentumBenchmark262?.p1Retention)||0,
        top3Variation:Number(momentumBenchmark262?.top3Variation)||0,
        abnormalGapRuns:Number(momentumBenchmark262?.abnormalGapRuns)||0,
        deterministicRepeat:Boolean(momentumBenchmark262?.deterministicRepeat),
        phase242Reference:momentumBenchmark262?.phase242Reference||null
      },
      lapTimingV248:{rowPass:Boolean(lapTimingQa248?.rowPass),domPass:Boolean(lapTimingQa248?.domPass),rows:lapTimingQa248?.result?.lapTiming||[],timingDom:lapTimingQa248?.result?.timingDom||[]},
      finalState:window.mwsF1GetScreenStateV185?.(),
      errors
    };
  })()`,'Recovery H interaction');

  await cdp.send('Emulation.setDeviceMetricsOverride',{width:2560,height:1440,deviceScaleFactor:1,mobile:false});
  await sleep(250);
  const qhd=await evaluate(cdp,`(async()=>{
    const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const assert=(condition,message)=>{if(!condition)throw new Error(message)};
    document.body.dataset.resolution='qhd';
    const context=window.__recoveryHContext||{};
    assert(window.mwsF1GetScreenStateV185?.()==='SETUP','Phase 267 QHD QA did not begin in Setup');
    const selected=window.mwsF1GetSelectedContactIdsV181?.()||[];
    if(selected.length<2){
      for(const id of context.driverIds||[])if(!(window.mwsF1GetSelectedContactIdsV181?.()||[]).includes(id))window.mwsF1ToggleDriverV181?.(id);
    }
    window.mwsF1SetLapCountV260?.(5);
    assert(window.mwsF1StartRaceFromSetupV187?.()===true,'Phase 267 QHD race preparation failed');
    await new Promise(r=>setTimeout(r,1200));await raf();
    assert(await window.mwsF1WaitGridRevealV273?.(8000)===true,'Phase 273 QHD reveal did not finish');
    document.getElementById('f1RacingGridStartRecoveryM')?.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='RACE','Phase 267 QHD race did not start');
    const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
    assert(workspace,'Phase 267 QHD workspace missing');
    const panels=Array.from(workspace.querySelectorAll('[data-f1-workspace-panel]')).filter(panel=>!panel.hidden&&getComputedStyle(panel).display!=='none');
    const overlaps=[];
    for(let i=0;i<panels.length;i++){
      const a=panels[i].getBoundingClientRect();
      for(let j=i+1;j<panels.length;j++){
        const b=panels[j].getBoundingClientRect();
        const width=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
        const height=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
        if(width*height>1)overlaps.push([panels[i].dataset.f1WorkspacePanel,panels[j].dataset.f1WorkspacePanel]);
      }
    }
    const rect=workspace.getBoundingClientRect();
    assert(rect.width>1800&&rect.height>500,'Phase 267 QHD workspace geometry too small: '+JSON.stringify({width:rect.width,height:rect.height}));
    assert(overlaps.length===0,'Phase 267 QHD panel overlap: '+JSON.stringify(overlaps));
    assert(document.querySelectorAll('.f1-racing-race-vehicle-v189').length>=2,'Phase 267 QHD race markers missing');
    assert(document.getElementById('f1RacingRaceHeadlineV255'),'Phase 267 QHD race headline missing');
    assert(document.getElementById('f1RacingCommentaryLogV188'),'Phase 267 QHD commentary missing');
    document.getElementById('f1RacingRaceCancelRecoveryC')?.click();await raf();
    assert(window.mwsF1GetScreenStateV185?.()==='SETUP','Phase 267 QHD cleanup failed');
    return {width:Number(rect.width.toFixed(1)),height:Number(rect.height.toFixed(1)),panelCount:panels.length,overlaps,markers:true};
  })()`,'Phase 267 QHD desktop QA');

  const result={phase:'recovery-h',name:'f1-live-browser-qa',baseline,interaction,qhd,pass:true};
  console.log(JSON.stringify({recoveryHLiveBrowser:result},null,2));
}finally{
  cdp?.close();
  child.kill('SIGTERM');
  await sleep(150);
  try{rmSync(profile,{recursive:true,force:true})}catch(_){}
}
