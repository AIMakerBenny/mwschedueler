import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import os from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Isolated first-paint fallback: all external stylesheets are deliberately absent.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/<style id="mws-first-paint-guard">([\s\S]*?)<\/style>/);
assert(match,'Critical first-paint style must be embedded in the initial HTML head');
const guardIndex=html.indexOf('<style id="mws-first-paint-guard">');
const firstSheet=html.indexOf('<link rel="stylesheet"');
assert(guardIndex>0&&guardIndex<firstSheet,'Critical first-paint CSS must precede external CSS');
assert(html.includes('class="mws-archive-kicker"')&&html.includes('class="mws-archive-wiki"'));
const fixture=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${match[1]}</style></head><body><div class="app"><aside class="sidebar"><nav class="nav"><span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"></path></svg></span></nav></aside><main class="main"><span class="mws-archive-kicker">WRONG HEADER</span><a class="mws-archive-wiki"><svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z"></path></svg></a><section class="section">WRONG TAB</section><section class="section active">캘린더</section></main></div></body></html>`;
const output='visual-first-paint';
const capture=process.env.MWS_FIRST_PAINT_CAPTURE==='1';
if(capture)mkdirSync(output,{recursive:true});
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-firstpaint-'));
let browser;
try{
 const file=path.join(dir,'firstpaint.html');writeFileSync(file,fixture);
 browser=await launchCalendarBrowser(dir);
 for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[390,844]]){
  await browser.navigate(pathToFileURL(file).href+'?width='+width,width,height,width<=760);
  const state=await browser.evaluate(`(()=>{
    const svg=document.querySelector('.nav-icon svg'),box=svg.getBoundingClientRect(),app=document.querySelector('.app');
    const archive=[...document.querySelectorAll('.mws-archive-kicker,.mws-archive-wiki')].map(e=>getComputedStyle(e).display);
    return {svgWidth:box.width,svgHeight:box.height,archive,wrongTab:getComputedStyle(document.querySelector('.section:not(.active)')).display,activeTab:getComputedStyle(document.querySelector('.section.active')).display,grid:getComputedStyle(app).gridTemplateColumns,pageOverflow:document.documentElement.scrollWidth-innerWidth};
  })()`);
  assert(state.svgWidth>=19&&state.svgWidth<=22&&state.svgHeight>=19&&state.svgHeight<=22,JSON.stringify({width,state}));
  assert(state.archive.every(x=>x==='none')&&state.wrongTab==='none'&&state.activeTab!=='none',JSON.stringify({width,state}));
  assert(state.pageOverflow<=1,'First-paint layout overflow: '+JSON.stringify({width,state}));
  if(width>760)assert(state.grid.startsWith('72px'),'Initial sidebar width drift: '+JSON.stringify(state));
  if(capture)writeFileSync(path.join(output,'first-paint-'+width+'.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
  console.log('MWS_FIRST_PAINT_GUARD_OK',width,JSON.stringify(state));
 }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
