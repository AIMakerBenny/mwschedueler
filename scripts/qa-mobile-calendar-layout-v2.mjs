import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const live=process.argv.includes('--live');
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-mobile-layout-'));
let browser;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
  const html=read('index.html'),core=read('assets/app-core.js');
  const top=html.slice(html.indexOf('<div class="calendar-topbar-v4">'),html.indexOf('<div id="calendarMonthPanelV172"'));
  const globalTop=html.slice(html.indexOf('<div class="topbar">'),html.indexOf('\n<section id="dashboard"'));
  const render=core.slice(core.indexOf('function renderCalendar(){'),core.indexOf("  const grid=document.getElementById('calendarGrid');grid.innerHTML=out;"))+"document.getElementById('calendarGrid').innerHTML=out;window.mwsCalendarContinuousSeriesV1.render(document.getElementById('calendarGrid'),data.events,data.contentGroups);}";
  const host=read('assets/content-planner-host.js');
  const css=[...html.matchAll(/<link\b[^>]*href="(assets\/[^"?]+\.css)(?:\?[^" ]*)?"[^>]*>|<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]?read(m[1]):m[2]).join('\n')+'\n'+host.slice(host.indexOf('#calendarGrid.calendar{'),host.indexOf('#sniper .sniper-name'))+'\n'+read('assets/mobile-drawer-v130.css');
  const fixture=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style>
  <body data-theme="neon" class="mws-premium mws-public-mode"><div class="app"><aside class="sidebar"><div class="nav"><button data-tab="calendar" class="active">일정</button></div></aside><main class="main">${globalTop}<section id="calendar" class="section active">${top}<div id="calendarMonthPanelV172" class="calendar-view-panel-v172 active"><div class="calendar-responsive-scroll-v1"><div class="calendar-head">${['일','월','화','수','목','금','토'].map(d=>'<div>'+d+'</div>').join('')}</div><div id="calendarGrid" class="calendar"></div></div></div></section><section id="settings" class="section"></section></main></div><button class="mobile-nav-toggle">›</button>
  <script>const data={events:[],contentGroups:[{id:'series',name:'연속 게임',color:'#118c95'}]};let calDate=new Date(2026,10,1);const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),sundayIndex=d=>d,todayKST=()=> '2026-11-21',activeEvents=()=>data.events,category=()=>({color:'#8b5cf6'}),rgba=()=> '#29233f',esc=s=>String(s);function hideCalendarEventPreview(){}function ensureCalendarYearOptions(){}function handleCalendarMiniEventClick(){}window.setResolutionMode=mode=>document.body.dataset.resolution=mode;window.toggleMobileDrawer=()=>document.body.classList.toggle('mobile-drawer-open');window.setMobileDrawer=()=>document.body.classList.remove('mobile-drawer-open');for(let d=1;d<=30;d++)for(let j=0;j<(d===18?4:1);j++)data.events.push({id:d+'-'+j,date:'2026-11-'+String(d).padStart(2,'0'),title:'와우 포에버 '+j,start:'13:55',contentGroupId:d>=5&&d<=18?'series':null});</script>
  <script>${read('assets/calendar-continuous-series-v1.js')}\n${render}\nrenderCalendar();document.getElementById('nextMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};document.getElementById('prevMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};</script>
  <script>${read('assets/device-ui.js')}</script><script>${read('assets/mobile-calendar-day-detail-v130.js')}</script><script>${read('assets/mobile-calendar-quick-add-v130.js')}</script></body>`;
  const file=path.join(dir,'fixture.html');writeFileSync(file,fixture);
  browser=await launchCalendarBrowser(dir);
  const base=process.env.MWS_LIVE_BASE||'https://mawang-scheduler.majoku.workers.dev';
  for(const width of [320,360,390,412,480]){
    const url=live?base.replace(/\/$/,'')+'/?mobile-layout-qa='+width+'-'+Date.now():pathToFileURL(file).href;
    await browser.navigate(url,width,800,true);
    let ready=false;
    for(let i=0;i<240&&!ready;i++){
      try{ready=await browser.evaluate(`(()=>{const notice=document.querySelector('#mwsAnnouncementDialog[open]');if(notice)notice.querySelector('.mws-notice-close')?.click();return document.body.dataset.deviceMode==='mobile'&&window.__mwsMobileCalendarDayDetailV130&&window.__mwsMobileCalendarQuickAddV130&&document.querySelector('#calendarGrid .mini-event[data-evid]')&&${live?'window.__mwsAppReadyV130':'true'}?true:false})()`)}catch{}
      if(!ready)await delay(125);
    }
    assert(ready,'Mobile calendar did not initialize at '+width);
    await delay(650);
    const metrics=await browser.evaluate(`(()=>{const $=s=>document.querySelector(s),r=e=>e.getBoundingClientRect(),headers=[...document.querySelectorAll('.calendar-head>div')],days=[...document.querySelectorAll('#calendarGrid .day')],wrap=$('.calendar-responsive-scroll-v1'),month=$('#monthLabel'),card=[...document.querySelectorAll('#calendarGrid .mini-event[data-evid] .calendar-card-title-v2')].find(e=>r(e).width>0&&r(e).height>0),bar=$('.mws-mobile-calendar-quick-add-v130'),title=card&&r(card),cardBox=card&&r(card.closest('.mini-event')),nav=$('.mws-mobile-tabs');return {width:innerWidth,columns:headers.length,aligned:headers.every((h,i)=>Math.abs(r(h).left-r(days[i]).left)<2&&Math.abs(r(h).width-r(days[i]).width)<2),first:r(days[0]).left,last:r(days[6]).right,gridWidth:r($('#calendarGrid')).width,scrollWidth:wrap.scrollWidth,clientWidth:wrap.clientWidth,month:month.textContent,monthVisible:r(month).height>10&&r(month).width>0&&parseFloat(getComputedStyle(month).fontSize)>=16,titleVisible:!!title&&title.height>=10&&title.bottom<=cardBox.bottom+1&&title.width>=10,timeHidden:!!card&&getComputedStyle(card.parentElement.querySelector('time')).display==='none',rootOverflow:document.documentElement.scrollWidth-innerWidth,barWidth:r(bar).width,barAboveNav:r(bar).bottom<=r(nav).top,handleHidden:getComputedStyle($('.mobile-nav-toggle')).display==='none',navWidth:r(nav).width,rows:days.length/7,hiddenOverflow:[...document.querySelectorAll('.day[data-mobile-more]:not([data-mobile-more=""])')].every(d=>[...d.querySelectorAll('.mini-event')].filter(e=>r(e).height>0).length<=2)}})()`);
    console.log('MWS_MOBILE_CALENDAR_GEOMETRY',JSON.stringify(metrics));
    assert(metrics.width===width&&metrics.columns===7&&metrics.aligned&&metrics.first>=-1&&metrics.last<=width+1&&metrics.scrollWidth<=metrics.clientWidth+1&&metrics.monthVisible&&metrics.titleVisible&&metrics.timeHidden&&metrics.rootOverflow<=2&&metrics.barWidth<=145&&metrics.barAboveNav&&metrics.handleHidden&&metrics.hiddenOverflow,JSON.stringify(metrics));
    const month=metrics.month;
    await browser.evaluate(`document.getElementById('nextMonth').click()`);await delay(300);
    assert.notEqual(await browser.evaluate(`document.getElementById('monthLabel').textContent`),month);
    await browser.evaluate(`document.getElementById('prevMonth').click()`);await delay(300);
    assert.equal(await browser.evaluate(`document.getElementById('monthLabel').textContent`),month);
    const point=await browser.evaluate(`(()=>{const e=document.querySelector('#calendarGrid .day:has(.mini-event[data-evid]) .daynum');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
    await browser.clickPoint(point.x,point.y);await delay(350);
    const detail=await browser.evaluate(`(()=>{const s=document.querySelector('#mwsMobileCalendarDayDetailV130.open .mws-mobile-day-sheet-v130');if(!s)return null;const r=s.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,events:s.querySelectorAll('[data-mws-event-id]').length}})()`);
    assert(detail&&detail.left>=-1&&detail.right<=width+1&&detail.top>=-1&&detail.bottom<=800&&detail.events>0,JSON.stringify(detail));
    await browser.evaluate(`document.querySelector('.mws-mobile-day-close-v130').click();document.querySelector('[data-calendar-view="day"]').click()`);await delay(200);
    assert(await browser.evaluate(`document.querySelector('.mws-calendar-agenda').getBoundingClientRect().width>0&&document.querySelectorAll('.mws-agenda-day').length===1`));
    await browser.evaluate(`document.querySelector('[data-calendar-view="week"]').click()`);await delay(200);
    assert.equal(await browser.evaluate(`document.querySelectorAll('.mws-agenda-day').length`),7);
    await browser.evaluate(`document.querySelector('[data-calendar-view="month"]').click()`);
    console.log('MWS_MOBILE_CALENDAR_INTERACTIONS',JSON.stringify({width,monthNavigation:true,dayDetail:detail,dayView:true,weekView:true}));
  }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true});}
