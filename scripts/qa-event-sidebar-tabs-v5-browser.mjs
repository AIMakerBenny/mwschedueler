import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
  .map(n=>spawnSync('which',[n],{encoding:'utf8'}))
  .find(x=>x.status===0)?.stdout.trim();
assert(chrome,'Chromium required for event sidebar tab QA');
const load=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=load('index.html'),app=load('assets/app-core.js');
const baseCSS=load('assets/app-core.css');
const groupCSS=load('assets/calendar-content-groups-v2.css');
const tabCSS=load('assets/event-sidebar-tabs-v5.css');
const groupsJS=load('assets/calendar-content-groups-v2.js');
const tabsJS=load('assets/event-sidebar-tabs-v5.js');

const start='<aside class="event-memo-panel event-sidebar-tabs-enabled-v5">';
const end='</aside>';
const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
assert(a>=0&&b>a,'V5 left sidebar markup missing');
const aside=html.slice(a,b+end.length);
assert(aside.includes('id="evMemoContent"'));
assert(aside.includes('id="evContentGroupV2"'));
assert(aside.includes('id="eventSeriesPaneV5"'));
assert(!html.slice(html.indexOf('<section class="event-info-panel">'),html.indexOf('<label>시작 시간</label>'))
  .includes('calendar-group-event-editor-v2'),'Group UI must no longer consume middle panel space');
assert.equal((html.match(/id="evContentGroupV2"/g)||[]).length,1);
assert.equal((html.match(/id="evMemoContent"/g)||[]).length,1);
assert(app.includes("window.mwsCalendarContentGroupsV2?.syncEditor(e)"));
assert(app.includes("contentGroupId:document.getElementById('evContentGroupV2')?.value||''"));
assert(app.includes("memoContent:document.getElementById('evMemoContent').value"));

const boot=`
let data={events:[
 {id:'e1',title:'SBO 연습',contentGroupId:'sbo',start:'09:40',end:'12:46'},
 {id:'e2',title:'와우 포에버',contentGroupId:'wow',start:'15:00',end:'22:00'}
],contentGroups:[
 {id:'sbo',name:'SBO',color:'#2e42cc'},
 {id:'wow',name:'와우 포에버',color:'#11aec2'}
]};
let saved=0;
function saveData(){saved++;return true}
function toast(){}
function hideCalendarEventPreview(){}
`;
const check=`
(function(){
  const $=id=>document.getElementById(id);
  const sidebar=window.mwsEventSidebarTabsV5;
  const manager=window.mwsCalendarContentGroupsV2;
  const left=$('eventSeriesPaneV5').closest('.event-memo-panel');
  const center=document.querySelector('.event-info-panel');
  const insideLeft=left.contains($('evContentGroupV2'))&&!center.contains($('evContentGroupV2'));
  const defaultSeries=!$('eventSeriesPaneV5').hidden&&$('eventMemoPaneV5').hidden
    &&$('eventSeriesTabV5').getAttribute('aria-selected')==='true';
  manager.syncEditor(data.events[1]);
  const existing=$('evContentGroupV2').value==='wow'&&
    $('eventSeriesTabV5').getAttribute('aria-selected')==='true';
  const input=$('evContentGroupSearchV3');
  input.value='SBO';input.dispatchEvent(new Event('input',{bubbles:true}));
  const result=$('evContentGroupResultsV3').querySelector('button');
  const searchable=result?.textContent?.includes('SBO');
  result?.click();
  const selected=$('evContentGroupV2').value==='sbo';
  $('eventMemoTabV5').click();
  const memoVisible=$('eventSeriesPaneV5').hidden&&!$('eventMemoPaneV5').hidden;
  $('evMemoTitle').value='방송 준비';
  $('evMemoContent').value='기존 메모와 일정은 유지';
  $('eventSeriesTabV5').click();
  const groupRetained=$('evContentGroupV2').value==='sbo';
  $('eventMemoTabV5').click();
  const memoRetained=$('evMemoTitle').value==='방송 준비'&&
    $('evMemoContent').value==='기존 메모와 일정은 유지';
  manager.syncEditor(data.events[1]);
  const resets=$('eventSeriesTabV5').getAttribute('aria-selected')==='true'
    &&$('evContentGroupV2').value==='wow';
  $('evContentGroupToggleNewV2').click();
  const formOpened=!$('evContentGroupNewWrapV2').hidden;
  $('evContentGroupNewNameV2').value='새 게임 시리즈';
  $('evContentGroupCreateV2').click();
  const created=data.contentGroups.some(x=>x.name==='새 게임 시리즈')&&
    $('evContentGroupV2').value===data.contentGroups.find(x=>x.name==='새 게임 시리즈')?.id;
  const eventsUnchanged=data.events[0].title==='SBO 연습'&&data.events[1].start==='15:00';
  const noSaveOnToggle=saved===1;
  const leftBox=left.getBoundingClientRect();
  const centerBox=center.getBoundingClientRect();
  const desktop=window.innerWidth>1050;
  const columnsValid=!desktop||centerBox.left>=leftBox.right-2;
  const noOverflow=document.documentElement.scrollWidth<=document.documentElement.clientWidth+2;
  const ok=insideLeft&&defaultSeries&&existing&&searchable&&selected&&memoVisible&&
     groupRetained&&memoRetained&&resets&&formOpened&&created&&eventsUnchanged&&
     noSaveOnToggle&&columnsValid&&noOverflow;
  $('qa-result').textContent=JSON.stringify({ok,viewport:window.innerWidth,insideLeft,defaultSeries,
    existing,searchable,selected,memoVisible,groupRetained,memoRetained,
    resets,formOpened,created,eventsUnchanged,noSaveOnToggle,columnsValid,noOverflow});
})();
`;
const tmp=mkdtempSync(path.join(os.tmpdir(),'mws-side-tabs-v5-'));
try{
  const file=path.join(tmp,'tabs.html');
  writeFileSync(file,`<!doctype html><html lang="ko"><head><meta charset="utf-8">
   <meta name="viewport" content="width=device-width,initial-scale=1">
   <style>${baseCSS}\n${groupCSS}\n${tabCSS}
   #eventModal{position:static!important;display:block!important}
   #eventModal .event-modalbox{position:relative!important;width:min(1760px,98vw)!important}
   #eventModal .event-modal-layout{grid-template-columns:minmax(270px,340px) minmax(500px,1fr) minmax(280px,320px)!important}
   @media(max-width:1050px){#eventModal .event-modal-layout{grid-template-columns:1fr!important}}
   </style></head><body>
   <div id="eventModal" class="modal open"><div class="modalbox event-modalbox">
   <div class="event-modal-layout">${aside}
   <section class="event-info-panel"><input id="evTitle" value="SBO 연습"></section>
   <aside class="event-game-panel-v112">게임 패널</aside>
   </div></div></div>
   <button id="calendarGroupToggleV2" hidden></button>
   <pre id="qa-result">pending</pre>
   <script>${boot}</script><script>${groupsJS}</script><script>${tabsJS}</script><script>${check}</script>
   </body></html>`,'utf8');
  for(const width of [1760,1366,900,560]){
    const run=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu',
     '--disable-dev-shm-usage','--no-first-run','--virtual-time-budget=2500',
     '--window-size='+width+',900','--dump-dom','file://'+file],
    {encoding:'utf8',timeout:30000,maxBuffer:15*1024*1024});
    assert.equal(run.status,0,'Chrome failed '+width+' '+run.stderr.slice(-450));
    const m=run.stdout.match(/<pre id="qa-result">([^<]+)<\/pre>/);
    assert(m,'No result at width '+width+' '+run.stdout.slice(-500));
    const result=JSON.parse(m[1]);
    assert(result.ok,'V5 tabs failed width '+width+': '+JSON.stringify(result));
    console.log('EVENT_SIDEBAR_TABS_V5_BROWSER_OK',width,JSON.stringify(result));
  }
}finally{rmSync(tmp,{recursive:true,force:true})}
