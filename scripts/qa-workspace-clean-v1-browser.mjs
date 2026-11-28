import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),core=read('assets/app-core.js');
const aside=html.slice(html.indexOf('<aside class="sidebar">'),html.indexOf('</aside>')+8);
const header=html.slice(html.indexOf('    <div class="topbar">'),html.indexOf('<section id="dashboard"'));
const calendar=html.slice(html.indexOf('<section id="calendar"'),html.indexOf('</section>',html.indexOf('<section id="calendar"'))+10);
const switcher=core.slice(core.indexOf('function setCalendarViewModeV172(mode){'),core.indexOf('function initCalendarSearchV172(){'));
const pageScale=html.slice(html.indexOf("  const PAGE_SCALE_KEY='mws_page_text_scales_v54';"),html.indexOf('  /* ---------- Robust contact tag panel ---------- */'));
const inline=[...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
const css=[read('assets/app-core.css'),inline,...[
  'mawang-premium-v1621.css','ui-frame-presets.css','calendar-toolbar-v4.css',
  'calendar-responsive-cards-v1.css','calendar-stable-layout-v1.css','sidebar-rail-scrollbar-v1.css',
  'calendar-space-efficiency-v1.css','calendar-timeline-v1.css','workspace-clean-v1.css','topbar-context-v1.css'
].map(p=>read('assets/'+p))].join('\n');
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(n=>spawnSync('which',[n],{encoding:'utf8'})).find(r=>r.status===0)?.stdout.trim();
assert(chrome,'Chromium required');
assert(html.includes('>게임</button>')&&!html.includes('>타임라인</button>'));
assert(html.indexOf('assets/workspace-clean-v1.css')>html.indexOf('assets/contact-card-readable-layout-v1.css'));
const boot=`
let calendarViewModeV172='month';
const events=[{date:'2026-11-18',title:'와우 포에버',start:'10:00',end:'14:00',participants:[],steamGame:{name:'월드 오브 워크래프트: 포에버'}}];
const data={contentGroups:[],gameLibrary:[],contacts:[]};
${pageScale}
const activeEvents=()=>events,todayKST=()=> '2026-11-18';
function renderCalendarSearchResultsV172(){}
${switcher}
for(const tab of document.querySelectorAll('[data-calendar-view-tab]'))tab.onclick=()=>setCalendarViewModeV172(tab.dataset.calendarViewTab);
document.querySelector('#todayText').textContent='2026년 11월 18일 수요일';
document.querySelector('#clockText').textContent='오후 09:30';
const days=Array.from({length:42},(_,i)=>'<div class="day"><div class="daynum">'+(i+1)+'</div><div class="mini-event mws-steam-host-v111" style="border-left:3px solid #0f8c95;background:#12343a"><button class="calendar-event-drag-handle-v4">⋮⋮</button><span class="mini-event-main">[PC] 10:00 와우 포에버</span><button class="mws-steam-slot-v111">+</button></div></div>').join('');
document.querySelector('#calendarGrid').innerHTML=days;
const $=s=>document.querySelector(s),rect=e=>e.getBoundingClientRect();
const base=JSON.stringify(events);
const card=$('#calendarGrid .mini-event'),titleRect=rect(card.querySelector('.mini-event-main')),slot=card.querySelector('.mws-steam-slot-v111'),slotRect=rect(slot),handleRect=rect(card.querySelector('.calendar-event-drag-handle-v4'));
const noCardOverlap=getComputedStyle(slot).position==='static'?titleRect.top>=slotRect.bottom-1&&titleRect.top>=handleRect.bottom-1:titleRect.right<=slotRect.left+1&&titleRect.left>=handleRect.right-1;
const heading=getComputedStyle($('#pageTitle')).fontSize;
const shellPaint=getComputedStyle($('.main')),gridPaint=getComputedStyle($('#calendarGrid')),brush=getComputedStyle(document.body).getPropertyValue('--mws-calendar-brush').trim();
const urls=paint=>Array.from(paint.matchAll(/url\\("[^"]*"\\)/g),m=>m[0]);
const shellUrls=urls(shellPaint.backgroundImage),gridUrls=urls(gridPaint.backgroundImage);
const studioShell=shellPaint.backgroundImage.includes('linear-gradient')&&shellUrls.length===1&&shellUrls[0]===brush&&brush.startsWith('url("data:image/svg+xml,')&&shellPaint.backgroundSize.startsWith('64px 64px')&&shellPaint.boxShadow.includes('inset')&&gridUrls.length===0&&gridPaint.backgroundImage.includes('radial-gradient')&&gridPaint.backgroundImage.includes('linear-gradient')&&getComputedStyle($('.sidebar')).boxShadow==='none';
const charcoalShell=getComputedStyle(document.body).backgroundColor==='rgb(13, 15, 20)'&&getComputedStyle($('.main')).backgroundColor==='rgb(13, 15, 20)'&&getComputedStyle($('.sidebar')).backgroundColor==='rgb(18, 20, 27)'&&getComputedStyle(document.body).getPropertyValue('--panel').trim()==='#171920'&&getComputedStyle(document.body).getPropertyValue('--text').trim()==='#f5f5f7';
document.body.dataset.theme='rose';const alternateThemeKept=getComputedStyle(document.body).getPropertyValue('--bg').trim()==='#160d14'&&getComputedStyle(document.body).getPropertyValue('--accent').trim()==='#e65b9c';document.body.dataset.theme='neon';
const headerFit=rect($('.top-left')).right<=rect($('.clock')).left||rect($('.top-left')).bottom<=rect($('.clock')).top;
const tab=$('[data-calendar-view-tab="timeline"]');tab.click();
const gameTitle=$('#pageTitle').textContent==='게임'&&tab.textContent==='게임';
$('[data-calendar-view-tab="search"]').click();
const searchTitle=$('#pageTitle').textContent==='일정 검색';
$('[data-calendar-view-tab="month"]').click();
const monthTitle=$('#pageTitle').textContent==='캘린더';
$('#calendar').classList.remove('active');$('#gameF1Racing').classList.add('active');
setCalendarViewModeV172('timeline');
const inactiveTitleSafe=$('#pageTitle').textContent==='캘린더';
const f1ShellRestored=getComputedStyle($('.main')).boxShadow!=='none';
$('#gameF1Racing').classList.remove('active');$('#calendar').classList.add('active');setCalendarViewModeV172('month');
const control=$('#pageTextScaleControlV54'),label=$('#pageTextScaleValueV54'),controlButtons=control.querySelectorAll('button');
const sidebarLayoutChildren=[...$('.sidebar').children].filter(e=>!e.matches('script,style,template'));
const scaleInSidebar=control.parentElement===$('.sidebar')&&sidebarLayoutChildren[sidebarLayoutChildren.indexOf(control)-1]?.classList.contains('nav')&&!$('.topbar').contains(control)&&rect(control).width>0&&rect(control).bottom<=rect($('.sidebar')).bottom&&rect(control).right<=rect($('.sidebar')).right;
window.resetPageTextScaleV54();controlButtons[1].click();const scaleIncrease=label.textContent==='105%'&&$('#calendar').style.getPropertyValue('--ui-text-scale')==='1.05'&&JSON.parse(localStorage.getItem(PAGE_SCALE_KEY)).calendar===105;
controlButtons[0].click();const scaleDecrease=label.textContent==='100%';controlButtons[1].click();
$('#calendar').classList.remove('active');$('#gameF1Racing').classList.add('active');applyPageTextScalesV54();const scalePerPage=label.textContent==='100%';
$('#gameF1Racing').classList.remove('active');$('#calendar').classList.add('active');applyPageTextScalesV54();const scaleRetained=label.textContent==='105%';controlButtons[2].click();const scaleReset=label.textContent==='100%';
const result={noCardOverlap,headingOK:parseFloat(heading)<=20,studioShell,charcoalShell,alternateThemeKept,headerFit,gameTitle,searchTitle,monthTitle,inactiveTitleSafe,f1ShellRestored,scaleInSidebar,scaleIncrease,scaleDecrease,scalePerPage,scaleRetained,scaleReset,noMutation:base===JSON.stringify(events),noRootOverflow:document.documentElement.scrollWidth<=innerWidth+3};
document.querySelector('#result').textContent=JSON.stringify(result);
`;
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-workspace-clean-'));
try{
  const fixture='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body data-theme="neon" class="mws-premium sidebar-pinned" data-resolution="fhd" data-ui-frame="classic"><div class="app">'+aside+'<main class="main">'+header+calendar+'<section id="gameF1Racing" class="section"></section></main></div><pre id="result"></pre><script>'+read('assets/calendar-timeline-v1.js')+'</script><script>'+boot+'</script></body></html>';
  const dest=path.join(temp,'test.html');writeFileSync(dest,fixture);
  if(process.env.MWS_WORKSPACE_FIXTURE){writeFileSync(process.env.MWS_WORKSPACE_FIXTURE,fixture);if(process.env.MWS_FIXTURE_ONLY)process.exit(0);}
  for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[2560,1080]]){
    const run=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--window-size='+width+','+height,'--dump-dom','file://'+dest],{encoding:'utf8',timeout:30000,maxBuffer:18*1024*1024});
    assert.equal(run.status,0,run.stderr.slice(-600));
    const match=run.stdout.match(/<pre id="result">([^<]+)<\/pre>/);assert(match,'Missing geometry output');
    const result=JSON.parse(match[1]);
    for(const [key,value] of Object.entries(result))assert.equal(value,true,width+'x'+height+' '+key+' '+JSON.stringify(result));
    console.log('WORKSPACE_CLEAN_BROWSER_OK',width,height,JSON.stringify(result));
  }
}finally{rmSync(temp,{recursive:true,force:true})}
