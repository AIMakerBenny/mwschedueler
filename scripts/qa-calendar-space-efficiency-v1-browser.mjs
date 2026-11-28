/* Geometry regression for the actual desktop premium shell plus compact CSS.
   Local fixture only: no authenticated user data, no Cloudflare API writes. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';

const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=file('index.html');
const aside=html.slice(html.indexOf('<aside class="sidebar">'),html.indexOf('</aside>',html.indexOf('<aside class="sidebar">'))+'</aside>'.length);
assert(aside.includes('nav-scroll')&&aside.includes('sidebarPinBtn'),'Sidebar markup extraction failed');
assert(html.includes('assets/calendar-space-efficiency-v1.css?v=1'),'Compact stylesheet not included in production HTML');
assert(html.indexOf('assets/calendar-space-efficiency-v1.css?v=1')>html.indexOf('assets/ui-frame-presets.css?'),
  'Compact stylesheet must load last');

const styles=[
  'assets/app-core.css',
  'assets/calendar-toolbar-v4.css',
  'assets/calendar-responsive-cards-v1.css',
  'assets/calendar-stable-layout-v1.css',
  'assets/sidebar-rail-scrollbar-v1.css',
  'assets/mawang-premium-v1621.css'
].map(file).join('\n');
const inline=[...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
const frame=file('assets/ui-frame-presets.css');
const compact=file('assets/calendar-space-efficiency-v1.css');


const measure=()=>{
  const q=s=>document.querySelector(s),rect=x=>x.getBoundingClientRect();
  const body=document.body,app=q('.app'),side=q('.sidebar'),main=q('.main'),logo=q('.logo'),
    pin=q('#sidebarPinBtn'),day=q('#calendarGrid .day'),top=q('.topbar');
  const keyLabels=['캘린더','연락처','레거시'];
  const keyFits=keyLabels.map(label=>{
    const e=[...document.querySelectorAll('.nav-scroll > button .nav-label')]
      .find(n=>n.textContent.trim()===label);
    return {label,found:!!e,visible:!!e&&getComputedStyle(e).opacity==='1',
      fits:!!e&&e.scrollWidth<=e.clientWidth+2,client:e?.clientWidth,scroll:e?.scrollWidth};
  });
  return {
    viewport:innerWidth,
    gridCol:getComputedStyle(app).gridTemplateColumns.split(' ')[0],
    sideWidth:rect(side).width,mainX:rect(main).x,mainWidth:rect(main).width,
    mainPadding:parseFloat(getComputedStyle(main).paddingLeft),
    dayWidth:rect(day).width,topbarHeight:rect(top).height,
    logoEnd:rect(logo).right,pinStart:rect(pin).left,
    navKeyFits:keyFits,
    rootOverflow:document.documentElement.scrollWidth>innerWidth+4
  };
};
function testPage(){
  const sheet=document.getElementById('compact-style').sheet;
  const after=measure();
  sheet.disabled=true;
  const before=measure();
  sheet.disabled=false;
  const isPinned=document.body.classList.contains('sidebar-pinned');
  const wide=innerWidth>=1366;
  const sidebarOK=isPinned?Math.abs(after.sideWidth-200)<2:Math.abs(after.sideWidth-72)<2;
  const gained=after.mainWidth-before.mainWidth;
  const logoSafe=!isPinned||after.logoEnd<=after.pinStart-2;
  const expectedGain=isPinned?gained>=8:gained>=4;
  const sideShrunk=!isPinned||before.sideWidth-after.sideWidth>=18;
  const keyOK=!isPinned||after.navKeyFits.every(x=>x.found&&x.visible&&x.fits);
  const dayGain=after.dayWidth-before.dayWidth;
  const dayOK=!wide||dayGain>=2;
  const horizontalOK=!wide||!after.rootOverflow;
  const headerOK=after.topbarHeight<=before.topbarHeight+1;
  const paddingOK=after.mainPadding<before.mainPadding;
  const ok=sidebarOK&&sideShrunk&&expectedGain&&logoSafe&&keyOK&&dayOK&&horizontalOK&&headerOK&&paddingOK;
  document.querySelector('#qa-result').textContent=JSON.stringify({
    ok,isPinned,wide,sidebarOK,sideShrunk,expectedGain,logoSafe,keyOK,dayOK,horizontalOK,headerOK,paddingOK,
    gained,dayGain,before,after
  });
}
const folder=mkdtempSync(path.join(os.tmpdir(),'mws-compact-calendar-'));
let browser;
try{
  browser=await launchCalendarBrowser(folder);
  for(const [width,height,pinned] of [
    [1366,768,true],[1920,1080,true],[2560,1440,true],
    [1366,768,false],[1920,1080,false],[2560,1440,false]
  ]){
    const days=Array.from({length:7},(_,i)=>
      '<div class="day"><div class="daynum">'+(i+1)+'</div><div class="mini-event">[PC] 09:40 와우 포에버</div></div>').join('');
    const fixture='<!doctype html><html lang="ko"><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<style>'+styles+'\n'+inline+'\n'+frame+'</style>'+
      '<style id="compact-style">'+compact+'</style></head>'+
      '<body class="mws-premium '+(pinned?'sidebar-pinned':'')+'" data-resolution="fhd" data-ui-frame="classic">'+
      '<div class="app">'+(pinned?aside.replace(/>고정<\/span>/,'>고정 해제</span>'):aside)+'<main class="main">'+
      '<div class="topbar"><div class="top-left"><h1>캘린더</h1><div class="subtle">2026년 11월 14일 토요일</div></div>'+
      '<div class="clock"><span class="sync-status">컨텐츠 그룹 저장 실패</span><span>오후 01:34:33</span><button class="primary">컨텐츠 추가</button></div></div>'+
      '<section id="calendar" class="section active"><div class="calendar-topbar-v4">'+
      '<div class="calendar-toolbar">캘린더 보기 이전 오늘 다음 2026년 11월</div></div>'+
      '<div id="calendarGrid" class="calendar">'+days+'</div></section></main></div>'+
      '<pre id="qa-result">pending</pre></body></html>';
    const filename=path.join(folder,'case-'+width+'-'+height+'-'+pinned+'.html');
    writeFileSync(filename,fixture);
    await browser.navigate(pathToFileURL(filename).href,width,height);
    const result=await browser.evaluate('(async()=>{await document.fonts.ready;const measure=('+measure.toString()+');('+testPage.toString()+')();return JSON.parse(document.getElementById("qa-result").textContent)})()');
    assert(result&&result.after.viewport===width,'Geometry result missing or viewport mismatch');
    assert(result.ok,'Compact layout collision '+width+' pin '+pinned+': '+JSON.stringify(result));
    console.log('CALENDAR_SPACE_EFFICIENCY_V1_OK',width,height,'pinned',pinned,
      JSON.stringify({sidebar:result.after.sideWidth,gained:result.gained,dayGain:result.dayGain,
        topbar:result.after.topbarHeight,logoSafe:result.logoSafe}));
  }
}finally{await browser?.close();rmSync(folder,{recursive:true,force:true})}
