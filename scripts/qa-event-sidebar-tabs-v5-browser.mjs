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

const a=html.indexOf('<div id="eventModal"'),b=html.indexOf('<div id="datePickerPopover"',a);
assert(a>=0&&b>a,'Actual event editor markup missing');
const modal=html.slice(a,b).replace('id="eventModal" class="modal"','id="eventModal" class="modal open"');
assert(modal.includes('id="evMemoContent"')&&modal.includes('id="evContentGroupV2"')&&modal.includes('id="eventSeriesPaneV5"'));
assert(modal.indexOf('class="event-info-panel"')<modal.indexOf('class="event-editor-tools-v6"'));
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
document.body.dataset.mwsMode='admin';
window.__mwsAppReadyV130=true;
window.mwsV55SaveNow=async()=>true;
window.fetch=async url=>({ok:true,json:async()=>({
  data:String(url).includes('/core')?{contentGroups:structuredClone(data.contentGroups)}:structuredClone(data.events)
})});
function hideCalendarEventPreview(){}
`;
const check=`
(function(){
  const $=id=>document.getElementById(id);
  const sidebar=window.mwsEventSidebarTabsV5;
  sidebar.init(); // Synthetic page scripts execute before DOMContentLoaded.
  const manager=window.mwsCalendarContentGroupsV2;
  const left=$('eventSeriesPaneV5').closest('.event-memo-panel');
  const center=document.querySelector('.event-info-panel');
  const insideLeft=left.contains($('evContentGroupV2'))&&!center.contains($('evContentGroupV2'));
  const defaultSeries=$('eventSeriesPaneV5').hidden&&$('eventMemoPaneV5').hidden
    &&$('eventGameTabV7').getAttribute('aria-selected')==='true';
  manager.syncEditor(data.events[1]);
  const existing=$('evContentGroupV2').value==='wow'&&
    $('eventGameTabV7').getAttribute('aria-selected')==='true';
  $('eventSeriesTabV5').click();
  const input=$('evContentGroupSearchV3');
  input.value='SBO';input.dispatchEvent(new Event('input',{bubbles:true}));
  const result=$('evContentGroupResultsV3').querySelector('button');
  const searchable=result?.textContent?.includes('SBO');
  result?.click();
  const selected=$('evContentGroupV2').value==='sbo';
  $('eventMemoTabV5').click();
  const memoVisible=$('eventSeriesPaneV5').hidden&&!$('eventMemoPaneV5').hidden;
  const debugPane={seriesHidden:$('eventSeriesPaneV5').hidden,
    memoHidden:$('eventMemoPaneV5').hidden,
    memoTabSelected:$('eventMemoTabV5').getAttribute('aria-selected'),
    seriesTabSelected:$('eventSeriesTabV5').getAttribute('aria-selected'),
    current:sidebar.current()};
  $('evMemoTitle').value='방송 준비';
  $('evMemoContent').value='기존 메모와 일정은 유지';
  $('eventSeriesTabV5').click();
  const groupRetained=$('evContentGroupV2').value==='sbo';
  $('eventMemoTabV5').click();
  const memoRetained=$('evMemoTitle').value==='방송 준비'&&
    $('evMemoContent').value==='기존 메모와 일정은 유지';
  manager.syncEditor(data.events[1]);
  const resets=$('eventGameTabV7').getAttribute('aria-selected')==='true'
    &&$('evContentGroupV2').value==='wow';
  $('eventSeriesTabV5').click();
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
  const desktop=window.innerWidth>900;
  const columnsValid=!desktop||leftBox.left>=centerBox.right-2;
  const noOverflow=document.documentElement.scrollWidth<=document.documentElement.clientWidth+2;
  const ok=insideLeft&&defaultSeries&&existing&&searchable&&selected&&memoVisible&&
     groupRetained&&memoRetained&&resets&&formOpened&&created&&eventsUnchanged&&
     noSaveOnToggle&&columnsValid&&noOverflow;
  $('qa-result').textContent=JSON.stringify({ok,viewport:window.innerWidth,insideLeft,defaultSeries,
    existing,searchable,selected,memoVisible,groupRetained,memoRetained,
    resets,formOpened,created,eventsUnchanged,noSaveOnToggle,columnsValid,noOverflow,debugPane});
})();
`;
const tmp=mkdtempSync(path.join(os.tmpdir(),'mws-side-tabs-v5-'));
try{
  const file=path.join(tmp,'tabs.html');
  writeFileSync(file,`<!doctype html><html lang="ko"><head><meta charset="utf-8">
   <meta name="viewport" content="width=device-width,initial-scale=1">
   <style>${baseCSS}\n${groupCSS}\n${tabCSS}
   </style></head><body>
   ${modal}
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
