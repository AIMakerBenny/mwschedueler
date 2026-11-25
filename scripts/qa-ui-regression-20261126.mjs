import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
const steam=read('assets/steam-game-v111.js');
const steamCSS=steam.match(/style\.textContent=`([\s\S]*?)`;/)[1];
const aside=html.slice(html.indexOf('<aside class="sidebar">'),html.indexOf('</aside>',html.indexOf('<aside class="sidebar">'))+8);
const css=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="(assets\/[^"?]+\.css)[^"]*"[^>]*>|<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]?read(m[1]):m[2]).join('\n')+'\n'+steamCSS;
const dir=mkdtempSync(path.join(tmpdir(),'mws-ui-regression-'));let browser;
const file=path.join(dir,'fixture.html');
const modal='<div id="eventModal" class="modal"><div class="modalbox event-modalbox mws-event-editor-v6 mws-game-panel-enabled-v112"><div class="event-modal-header">일정 수정</div><div class="event-modal-layout"><section class="event-info-panel">기본 정보</section><aside class="event-editor-tools-v6">게임</aside></div><div class="event-actions"><button>저장</button></div></div></div>';
const card='<div class="day" style="width:190px"><div class="calendar-day-events-v2"><div class="mini-event mws-steam-host-v111" data-evid="qa"><span class="mini-event-main"><time class="calendar-start-v2">17:11</time><span class="calendar-card-title-v2">와포 성검 원정대</span></span><button class="mws-steam-slot-v111">+</button></div></div></div>';
writeFileSync(file,'<!doctype html><html><meta charset="utf-8"><style>'+css+'</style><body class="mws-premium" data-resolution="fhd" data-theme="neon" data-mws-mode="admin"><div class="app">'+aside+'<main class="main"><section id="calendar" class="section active"><div id="calendarGrid">'+card+'</div></section></main></div>'+modal+'<script>'+read('assets/sidebar-hover-v2.js')+'</script></body></html>');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 browser=await launchCalendarBrowser(dir);
 for(const [w,h] of [[1366,768],[1920,1080],[2560,1440]]){
  await browser.navigate(pathToFileURL(file).href+'?w='+w,w,h);
  await browser.movePoint(500,300);await sleep(400);
  const state=()=>browser.evaluate("(()=>{const s=document.querySelector('.sidebar'),i=s.querySelector('[data-tab=calendar] .nav-icon'),l=s.querySelector('[data-tab=calendar] .nav-label'),n=s.querySelector('.nav-scroll'),m=document.querySelector('.main'),r=e=>e.getBoundingClientRect();return {w:r(s).width,x:r(i).x,y:r(i).y,n:r(n).height,m:r(m).left,label:getComputedStyle(l).visibility}})()");
  const closed=await state();assert(closed.w<85&&closed.label==='hidden',JSON.stringify(closed));
  await browser.movePoint(30,100);
  const frames=[];for(let i=0;i<15;i++){await sleep(16);frames.push(await state())}
  const open=await state();assert(open.w>=165&&open.label==='visible',JSON.stringify(open));
  await browser.movePoint(500,300);
  for(let i=0;i<25;i++){await sleep(16);frames.push(await state())}
  const end=await state();assert(end.w<85&&end.label==='hidden',JSON.stringify(end));
  for(const f of frames)assert(Math.abs(f.x-closed.x)<2&&Math.abs(f.y-closed.y)<2&&Math.abs(f.n-closed.n)<2&&Math.abs(f.m-closed.m)<2,JSON.stringify({closed,f}));
  for(const scale of [1,1.15,1.3]){
   const metrics=await browser.evaluate("(()=>{const c=document.querySelector('.mini-event');c.style.setProperty('--ui-text-scale',"+scale+");const r=c.getBoundingClientRect(),t=c.querySelector('.calendar-card-title-v2'),m=c.querySelector('.mini-event-main'),b=t.getBoundingClientRect(),s=getComputedStyle(c);return {bottom:b.bottom,limit:r.bottom-parseFloat(s.paddingBottom),textHeight:b.height,line:parseFloat(getComputedStyle(t).lineHeight),mainHeight:m.clientHeight,mainScroll:m.scrollHeight}})()");
   assert(metrics.bottom<=metrics.limit+1&&metrics.textHeight>=metrics.line-1&&metrics.mainScroll<=metrics.mainHeight+1,JSON.stringify(metrics));
  }
  await browser.evaluate("document.getElementById('eventModal').classList.add('open')");await sleep(500);
  const e=await browser.evaluate("(()=>{const g=document.querySelector('.event-modal-layout'),a=g.querySelector('.event-info-panel'),b=g.querySelector('.event-editor-tools-v6'),r=e=>e.getBoundingClientRect();return {cols:getComputedStyle(g).gridTemplateColumns,empty:r(g).right-r(b).right,left:r(a).width,overlap:r(a).right-r(b).left}})()");
  assert(e.cols.trim().split(/\s+/).length===2&&Math.abs(e.empty)<3&&e.left>350&&e.overlap<2,JSON.stringify(e));
  console.log('UI_REGRESSION_OK',w,h,JSON.stringify(e));
 }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
