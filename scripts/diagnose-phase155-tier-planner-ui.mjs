import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE=process.env.MWS_UI_BASE||'https://mawang-scheduler.majoku.workers.dev';
const candidates=['google-chrome','google-chrome-stable','chromium','chromium-browser'];
let chrome='';
for(const candidate of candidates){
  const found=spawnSync('which',[candidate],{encoding:'utf8'});
  if(found.status===0&&found.stdout.trim()){chrome=found.stdout.trim();break}
}
if(!chrome)throw new Error('Phase155 live UI audit requires Chrome/Chromium');

const profile=mkdtempSync(path.join(os.tmpdir(),'mws-phase155-'));
const port=9334;
const child=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  `--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,
  '--window-size=720,1400','about:blank'
],{stdio:'ignore'});

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function json(url,init){
  const response=await fetch(url,init);
  if(!response.ok)throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}
async function waitDebugger(){
  let last;
  for(let i=0;i<80;i++){
    try{return await json(`http://127.0.0.1:${port}/json/version`)}
    catch(error){last=error;await sleep(125)}
  }
  throw last||new Error('Chrome DevTools endpoint did not start');
}
class Cdp{
  constructor(url){
    this.nextId=1;this.pending=new Map();this.listeners=new Map();
    this.ws=new WebSocket(url);
  }
  async open(){
    if(this.ws.readyState===WebSocket.OPEN)return;
    await new Promise((resolve,reject)=>{
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
      const listeners=this.listeners.get(message.method)||[];
      for(const listener of listeners)listener(message.params||{});
    });
  }
  send(method,params={}){
    const id=this.nextId++;
    return new Promise((resolve,reject)=>{
      this.pending.set(id,{resolve,reject});
      this.ws.send(JSON.stringify({id,method,params}));
    });
  }
  once(method,timeout=15000){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error(`Timeout waiting for ${method}`)),timeout);
      const fn=params=>{clearTimeout(timer);this.listeners.set(method,(this.listeners.get(method)||[]).filter(x=>x!==fn));resolve(params)};
      this.listeners.set(method,[...(this.listeners.get(method)||[]),fn]);
    });
  }
  close(){try{this.ws.close()}catch(_){}}
}

let cdp;
try{
  await waitDebugger();
  const pages=await json(`http://127.0.0.1:${port}/json`);
  const page=pages.find(x=>x.type==='page');
  if(!page?.webSocketDebuggerUrl)throw new Error('No debuggable Chrome page');
  cdp=new Cdp(page.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:720,height:1400,deviceScaleFactor:1,mobile:true});
  const loaded=cdp.once('Page.loadEventFired',20000);
  await cdp.send('Page.navigate',{url:`${BASE}/?phase155-ui=${Date.now()}`});
  await loaded;
  await sleep(1600);

  const expression=`(async()=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const gate=document.getElementById('mwsAccessGate');
    if(gate)gate.style.setProperty('display','none','important');
    document.body.classList.remove('mws-gated');
    try{window.dispatchEvent(new Event('mws:app-ready'))}catch(_){}

    for(let i=0;i<50;i++){
      if(document.getElementById('mwsToolsCleanV109Style')&&document.getElementById('toolTier')&&document.getElementById('contentPlanner'))break;
      await sleep(160);
    }
    await raf();

    const premium=document.body.classList.contains('mws-premium');
    document.body.dataset.resolution='mobile';
    document.body.dataset.deviceMode='mobile';

    const tier=document.getElementById('toolTier');
    if(!tier)throw new Error('toolTier section unavailable');
    if(!document.getElementById('mwsToolsCleanV109Style'))throw new Error('tools runtime style unavailable');

    const probe=document.createElement('div');
    probe.id='mwsPhase155TierProbe';
    probe.className='mws-tier-meta';
    probe.style.background='#ff7f7f';
    probe.innerHTML='<input class="mws-tier-rank" value="S"><input class="mws-tier-title-v106" value="제목">';
    tier.appendChild(probe);
    await raf();

    const rank=probe.querySelector('.mws-tier-rank');
    const titleInput=probe.querySelector('.mws-tier-title-v106');
    const rankStyle=getComputedStyle(rank);
    const titleStyle=getComputedStyle(titleInput);
    const parseRgb=value=>{const m=String(value||'').match(/rgba?\\((\\d+)[, ]+\\s*(\\d+)[, ]+\\s*(\\d+)/i);return m?[Number(m[1]),Number(m[2]),Number(m[3])]:[0,0,0]};
    const lum=value=>{const [r,g,b]=parseRgb(value);return .2126*r+.7152*g+.0722*b};
    const tierResult={
      rankBackground:rankStyle.backgroundColor,
      rankColor:rankStyle.color,
      titleBackground:titleStyle.backgroundColor,
      titleColor:titleStyle.color,
      rankBackgroundLuma:Number(lum(rankStyle.backgroundColor).toFixed(2)),
      rankColorLuma:Number(lum(rankStyle.color).toFixed(2)),
      titleBackgroundLuma:Number(lum(titleStyle.backgroundColor).toFixed(2)),
      titleColorLuma:Number(lum(titleStyle.color).toFixed(2))
    };
    probe.remove();

    const setTabFn=typeof window.setTab==='function'?window.setTab:(typeof setTab==='function'?setTab:null);
    if(!setTabFn)throw new Error('setTab unavailable');
    setTabFn('contentPlanner');
    await raf();
    const plannerTitle=String(document.getElementById('pageTitle')?.textContent||'').trim();

    return {premium,tierResult,plannerTitle};
  })()`;

  const evaluated=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(evaluated.exceptionDetails)throw new Error('Phase155 UI probe exception: '+evaluated.exceptionDetails.text);
  const value=evaluated.result?.value;
  if(!value?.tierResult)throw new Error('Phase155 UI probe returned no tier result');
  console.log(JSON.stringify({phase155TierPlannerUi:value},null,2));

  const t=value.tierResult;
  if(!value.premium)throw new Error('Phase155 probe did not run under premium UI');
  if(t.rankBackgroundLuma<180||t.titleBackgroundLuma<180){
    throw new Error(`Phase155 tier inputs remain dark: rank=${t.rankBackground}, title=${t.titleBackground}`);
  }
  if(t.rankColorLuma>90||t.titleColorLuma>90){
    throw new Error(`Phase155 tier input text is not dark on restored light controls: rank=${t.rankColor}, title=${t.titleColor}`);
  }
  if(value.plannerTitle!=='컨텐츠 플래너'){
    throw new Error(`Phase155 content planner title mismatch: ${value.plannerTitle}`);
  }
}finally{
  cdp?.close();
  child.kill('SIGTERM');
  await sleep(150);
  try{rmSync(profile,{recursive:true,force:true})}catch(_){}
}
