import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Read-only real-production smoke. There are no injected scripts or styles.
// The embedded render-critical CSS is tested separately before stylesheet load.
const ORIGIN='https://mawang-scheduler.majoku.workers.dev/';
const out='visual-achievement-production-firstpaint';
const capture=process.env.MWS_HALL_CAPTURE==='1';
if(capture)mkdirSync(out,{recursive:true});
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-prod-firstpaint-'));
let browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function snapshot(width,height,phase){
 const state=await browser.evaluate(`(()=>{
  const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0};
  const icons=[...document.querySelectorAll('.sidebar .nav-icon svg,.sidebar .mws-creator-links svg,.sidebar .sidebar-pin-icon svg')].filter(visible).map(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height}});
  const archive=[...document.querySelectorAll('.mws-archive-kicker,.mws-archive-wiki')].filter(visible).map(el=>el.textContent.trim().slice(0,60));
  const sidebar=document.querySelector('.sidebar')?.getBoundingClientRect();
  const styles=[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>x.href);
  return {title:document.querySelector('#pageTitle')?.textContent?.trim(),stylesLoaded:styles.some(x=>x.includes('achievement-exhibition-v1.css')&&x.includes('v=5')),
   guard:!!document.querySelector('#mws-first-paint-guard'),icons,archive,sidebarWidth:sidebar?.width,
   cssFailed:document.documentElement.dataset.mwsCssLoadFailed==='true',gated:document.body.classList.contains('mws-gated'),
   loading:document.body.classList.contains('mws-app-loading'),appReady:!!window.__mwsAppReadyV130,
   pageOverflow:document.documentElement.scrollWidth-innerWidth};
 })()`);
 assert(state.guard&&state.stylesLoaded&&!state.cssFailed,JSON.stringify({width,height,phase,state}));
 assert(state.icons.length>0&&state.icons.every(x=>x.w<=30&&x.h<=30),JSON.stringify({width,height,phase,state}));
 assert(state.archive.length===0,'Archive-only text leaked into calendar: '+JSON.stringify({width,height,phase,state}));
 if(width>760)assert(state.sidebarWidth>0&&state.sidebarWidth<301,'Sidebar width is invalid: '+JSON.stringify({width,height,phase,state}));
 if(capture)writeFileSync(path.join(out,'production-'+phase+'-'+width+'.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
 console.log('MWS_REAL_PRODUCTION_PAINT_OK',width,height,phase,JSON.stringify(state));
}
try{
 browser=await launchCalendarBrowser(dir);
 for(const [width,height,mobile] of [[1366,768,false],[1920,1080,false],[2560,1440,false],[390,844,true]]){
  for(const phase of ['cold','warm']){
   await browser.navigate(ORIGIN,width,height,mobile);
   await snapshot(width,height,phase);
   let state={};
   for(let attempt=0;attempt<130;attempt++){
    state=await browser.evaluate(`(()=>({ready:!!window.__mwsAppReadyV130,loading:document.body.classList.contains('mws-app-loading'),gated:document.body.classList.contains('mws-gated')}))()`);
    if(state.gated){
      await browser.evaluate(`(()=>{document.querySelector('#mwsModePublic')?.click();document.querySelector('#mwsLoginSubmit')?.click()})()`);
    }
    if(state.ready&&!state.loading&&!state.gated)break;
    await pause(150);
   }
   assert(state.ready&&!state.loading&&!state.gated,'Public production app did not mount: '+JSON.stringify({width,height,phase,state}));
   await snapshot(width,height,phase+'-ready');
  }
 }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
