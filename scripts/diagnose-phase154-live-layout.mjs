import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE=process.env.MWS_LAYOUT_BASE||'https://mawang-scheduler.majoku.workers.dev';
const candidates=['google-chrome','google-chrome-stable','chromium','chromium-browser'];
let chrome='';
for(const candidate of candidates){
  const found=spawnSync('which',[candidate],{encoding:'utf8'});
  if(found.status===0&&found.stdout.trim()){chrome=found.stdout.trim();break}
}
if(!chrome)throw new Error('Phase154 live layout audit requires Chrome/Chromium');

const profile=mkdtempSync(path.join(os.tmpdir(),'mws-phase154-'));
const port=9333;
const child=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
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
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
  const loaded=cdp.once('Page.loadEventFired',20000);
  await cdp.send('Page.navigate',{url:`${BASE}/?phase154-layout=${Date.now()}`});
  await loaded;
  await sleep(1800);

  const expression=`(async()=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const gate=document.getElementById('mwsAccessGate');
    if(gate)gate.style.setProperty('display','none','important');
    document.body.classList.remove('mws-gated');
    try{window.dispatchEvent(new Event('mws:app-ready'))}catch(_){}
    await sleep(2200);

    const pageIds=['contacts','posts','sniper','targets','friendFinder','memos','worldtime','achievements','wardogs','export','settings','contentPlanner'];
    const frames=['classic','workshop','agenda','messenger','material','linear','notion','glass','studio','brutal'];
    const sections=[...document.querySelectorAll('.section')];
    const topbar=document.querySelector('.topbar');
    const main=document.querySelector('.main');
    const results=[];
    document.body.dataset.resolution='fhd';
    document.body.dataset.deviceMode='pc';

    for(const frame of frames){
      document.body.dataset.uiFrame=frame;
      await raf();
      for(const id of pageIds){
        const sec=document.getElementById(id);
        if(!sec)continue;
        for(const node of sections)node.classList.toggle('active',node===sec);
        await raf();
        const first=sec.firstElementChild;
        const tr=topbar?.getBoundingClientRect();
        const sr=sec.getBoundingClientRect();
        const fr=first?.getBoundingClientRect();
        const tc=topbar?getComputedStyle(topbar):null;
        const sc=getComputedStyle(sec);
        const fc=first?getComputedStyle(first):null;
        results.push({
          frame,id,
          topbarTop:tr?.top??null,topbarHeight:tr?.height??null,topbarBottom:tr?.bottom??null,
          sectionTop:sr.top,firstTop:fr?.top??null,
          sectionGap:tr?Number((sr.top-tr.bottom).toFixed(2)):null,
          firstGap:tr&&fr?Number((fr.top-tr.bottom).toFixed(2)):null,
          topbarDisplay:tc?.display||'',topbarHeightCss:tc?.height||'',topbarMinHeight:tc?.minHeight||'',
          topbarMarginBottom:tc?.marginBottom||'',topbarPaddingTop:tc?.paddingTop||'',topbarPaddingBottom:tc?.paddingBottom||'',
          sectionDisplay:sc.display,sectionPosition:sc.position,sectionTopCss:sc.top,sectionMarginTop:sc.marginTop,
          sectionPaddingTop:sc.paddingTop,sectionTransform:sc.transform,sectionZoom:sc.zoom||'',
          firstTag:first?.tagName||'',firstClass:first?.className||'',firstMarginTop:fc?.marginTop||'',
          mainPaddingTop:main?getComputedStyle(main).paddingTop:''
        });
      }
    }
    const children=[...main.children].map(el=>{const r=el.getBoundingClientRect(),c=getComputedStyle(el);return{
      tag:el.tagName,id:el.id||'',className:el.className||'',display:c.display,position:c.position,
      top:Number(r.top.toFixed(2)),height:Number(r.height.toFixed(2)),marginTop:c.marginTop,paddingTop:c.paddingTop
    }});
    return {href:location.href,bodyClass:document.body.className,resolution:document.body.dataset.resolution||'',
      deviceMode:document.body.dataset.deviceMode||'',results,children};
  })()`;

  const evaluated=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(evaluated.exceptionDetails)throw new Error('Layout probe exception: '+evaluated.exceptionDetails.text);
  const value=evaluated.result?.value;
  if(!value?.results?.length)throw new Error('Layout probe returned no section measurements');
  const worst=[...value.results].sort((a,b)=>(b.firstGap??-999)-(a.firstGap??-999)).slice(0,20);
  const oversized=value.results.filter(row=>Number.isFinite(row.firstGap)&&row.firstGap>24);
  console.log(JSON.stringify({phase154LayoutGeometry:{sampleCount:value.results.length,worst,oversized,children:value.children}},null,2));
  if(oversized.length){
    const sample=oversized.slice(0,12).map(row=>`${row.frame}/${row.id}=${row.firstGap}px`).join(', ');
    throw new Error(`Phase154 oversized title/content gap remains: ${sample}`);
  }
}finally{
  cdp?.close();
  child.kill('SIGTERM');
  await sleep(150);
  try{rmSync(profile,{recursive:true,force:true})}catch(_){}
}
