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
if(!chrome)throw new Error('Phase156 live regression audit requires Chrome/Chromium');

const profile=mkdtempSync(path.join(os.tmpdir(),'mws-phase156-'));
const port=9335;
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
  await cdp.send('Page.navigate',{url:`${BASE}/?phase156-regression=${Date.now()}`});
  await loaded;
  await sleep(1600);

  const expression=`(async()=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const gate=document.getElementById('mwsAccessGate');
    if(gate)gate.style.setProperty('display','none','important');
    document.body.classList.remove('mws-gated');
    try{window.dispatchEvent(new Event('mws:app-ready'))}catch(_){}

    for(let i=0;i<60;i++){
      if(document.getElementById('mwsToolsCleanV109Style')&&
         document.querySelector('.nav button[data-tab="toolTier"]')&&
         document.querySelector('.nav button[data-tab="toolMatrix"]')&&
         document.querySelector('.nav button[data-tab="toolRelations"]')&&
         document.querySelector('.nav button[data-tab="contentPlanner"]'))break;
      await sleep(150);
    }
    await raf();

    document.body.dataset.resolution='mobile';
    document.body.dataset.deviceMode='mobile';

    const frames=['classic','workshop','agenda','messenger','material','linear','notion','glass','studio','brutal'];
    const expectedTitles={
      toolTier:'티어 게임',
      toolMatrix:'2D Matrix Chart',
      toolRelations:'인물 관계도',
      contentPlanner:'컨텐츠 플래너'
    };
    const selectors={
      toolTier:['.mws-tier-rank','.mws-tier-title-v106'],
      toolMatrix:['.mws-axis-input'],
      toolRelations:['.mws-relation-toolbar select','.mws-relation-toolbar input']
    };

    function rgb(value){
      const m=String(value||'').match(/rgba?\\(\\s*([0-9.]+)[, ]+\\s*([0-9.]+)[, ]+\\s*([0-9.]+)/i);
      return m?[Number(m[1]),Number(m[2]),Number(m[3])]:[0,0,0];
    }
    function linear(v){
      v/=255;
      return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);
    }
    function luminance(value){
      const [r,g,b]=rgb(value);
      return .2126*linear(r)+.7152*linear(g)+.0722*linear(b);
    }
    function contrast(fg,bg){
      const a=luminance(fg),b=luminance(bg),hi=Math.max(a,b),lo=Math.min(a,b);
      return (hi+.05)/(lo+.05);
    }
    function controlInfo(el,tab,frame,selector){
      const cs=getComputedStyle(el);
      return {
        tab,frame,selector,
        color:cs.color,
        background:cs.backgroundColor,
        contrast:Number(contrast(cs.color,cs.backgroundColor).toFixed(2)),
        value:String(el.value||''),
        display:cs.display,
        visibility:cs.visibility,
        opacity:cs.opacity
      };
    }

    const results=[];
    const failures=[];
    for(const frame of frames){
      document.body.dataset.uiFrame=frame;
      await raf();

      for(const tab of ['toolTier','toolMatrix','toolRelations']){
        const button=document.querySelector(`.nav button[data-tab="${tab}"]`);
        if(!button){failures.push(`${frame}/${tab}: nav button missing`);continue}
        button.click();
        await raf();
        const title=String(document.getElementById('pageTitle')?.textContent||'').trim();
        if(title!==expectedTitles[tab])failures.push(`${frame}/${tab}: title=${title}`);

        for(const selector of selectors[tab]){
          const nodes=[...document.querySelectorAll(`#${tab} ${selector}`)];
          if(!nodes.length){failures.push(`${frame}/${tab}: control missing ${selector}`);continue}
          for(const el of nodes.slice(0,3)){
            const info=controlInfo(el,tab,frame,selector);
            results.push(info);
            if(info.display==='none'||info.visibility==='hidden'||Number(info.opacity)===0){
              failures.push(`${frame}/${tab}: hidden control ${selector}`);
            }else if(info.contrast<3){
              failures.push(`${frame}/${tab}: low contrast ${selector}=${info.contrast}`);
            }
          }
        }
      }

      const plannerButton=document.querySelector('.nav button[data-tab="contentPlanner"]');
      if(!plannerButton){failures.push(`${frame}/contentPlanner: nav button missing`)}
      else{
        plannerButton.click();
        await raf();
        const setTabFn=typeof window.setTab==='function'?window.setTab:(typeof setTab==='function'?setTab:null);
        if(!setTabFn)failures.push(`${frame}/contentPlanner: setTab unavailable`);
        else{
          setTabFn('contentPlanner');
          await raf();
        }
        const title=String(document.getElementById('pageTitle')?.textContent||'').trim();
        const navLabel=String(plannerButton.querySelector('.nav-label')?.textContent||'').trim();
        const navTitle=String(plannerButton.getAttribute('title')||'').trim();
        results.push({tab:'contentPlanner',frame,title,navLabel,navTitle});
        if(title!==expectedTitles.contentPlanner)failures.push(`${frame}/contentPlanner: title=${title}`);
        if(navLabel!==expectedTitles.contentPlanner)failures.push(`${frame}/contentPlanner: navLabel=${navLabel}`);
        if(navTitle!==expectedTitles.contentPlanner)failures.push(`${frame}/contentPlanner: navTitle=${navTitle}`);
        if(title==='contentPlanner'||navLabel==='contentPlanner'||navTitle==='contentPlanner'){
          failures.push(`${frame}/contentPlanner: raw id visible`);
        }
      }
    }

    return {
      premium:document.body.classList.contains('mws-premium'),
      resultCount:results.length,
      failures,
      lowestContrast:results.filter(x=>Number.isFinite(x.contrast)).sort((a,b)=>a.contrast-b.contrast).slice(0,12),
      plannerResults:results.filter(x=>x.tab==='contentPlanner')
    };
  })()`;

  const evaluated=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(evaluated.exceptionDetails)throw new Error('Phase156 regression probe exception: '+evaluated.exceptionDetails.text);
  const value=evaluated.result?.value;
  if(!value)throw new Error('Phase156 regression probe returned no result');
  console.log(JSON.stringify({phase156ToolPlannerRegression:value},null,2));
  if(!value.premium)throw new Error('Phase156 probe did not run under premium UI');
  if(value.failures?.length){
    throw new Error('Phase156 regression failures: '+value.failures.slice(0,20).join(' | '));
  }
}finally{
  cdp?.close();
  child.kill('SIGTERM');
  await sleep(150);
  try{rmSync(profile,{recursive:true,force:true})}catch(_){}
}
