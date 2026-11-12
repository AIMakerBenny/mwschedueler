import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
 .map(n=>spawnSync('which',[n],{encoding:'utf8'}))
 .find(x=>x.status===0)?.stdout.trim();
assert(chrome,'Chromium required for calendar layout and interaction QA');
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=file('index.html'),core=file('assets/app-core.js');
const stylesheet=file('assets/app-core.css')+'\n'+file('assets/calendar-content-groups-v2.css')
 +'\n'+file('assets/calendar-toolbar-v4.css');
const manager=file('assets/calendar-content-groups-v2.js');
const moves=file('assets/calendar-move-guard-v4.js');
const open='<section id="calendar" class="section">';
const close='<div id="calendarCopyTray" class="calendar-copy-tray">';
const i=html.indexOf(open),j=html.indexOf(close,i);
assert(i>=0&&j>i,'Actual calendar header/panel source not found');
const calendar=html.slice(i,j).replace(open,'<section id="calendar" class="section active">')+'\n</div></section>';
assert(calendar.includes('id="calendarGroupManageToggleV4"'));
assert(calendar.includes('id="calendarGroupManagerPanelV4"'));
assert(calendar.includes('id="calendarGroupManageTargetV4"'));
assert(!calendar.includes('<details class="calendar-group-details-v2">'));
assert(calendar.includes('id="calendarUndoLastMoveV4"'));
assert(core.includes('el.onpointerdown=null;'),'ordinary event card pointer drag must be disabled');
assert(core.includes("moveHandle.onpointerdown=e=>"),'move handle must be wired');
assert(core.includes('window.mwsCalendarMoveGuardV4?.recordMove'),'record moves in calendar');
assert(core.includes('draggable="false"'),'calendar cards not native draggable');
assert(core.includes('class="calendar-event-drag-handle-v4" draggable="true"'));

const boot=`
const data={contentGroups:[{id:'sbo',name:'SBO 프로젝트',color:'#7659a5'},
{id:'wow',name:'와우 포에버',color:'#0f8c95'}],
events:[{id:'event-1',date:'2026-11-08',title:'와우 포에버 8일차',
 start:'09:22',end:'12:36',contentGroupId:'wow',restDay:false}]};
window.mwsCalendarContinuousSeriesV1={safeColor:c=>c};
window.setCalendarViewModeV172=mode=>{window.__view=mode};
window.__saveCount=0;
function saveData(reason){
 window.__saveCount++;
 window.dispatchEvent(new CustomEvent('mawang:datachange',{detail:{reason}}));
 return true;
}
function toast(){}
function hideCalendarEventPreview(){}
function confirm(){return true}
`;
const check=`
(async()=>{
 const $=id=>document.getElementById(id);
 const twoFrames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const manager=window.mwsCalendarContentGroupsV2;
 const top=$('calendar').querySelector('.calendar-topbar-v4');
 const toggle=$('calendarGroupManageToggleV4'),panel=$('calendarGroupManagerPanelV4');
 const tab=$('calendar').querySelector('.calendar-view-tabs-v172');
 const nav=$('calendar').querySelector('.calendar-toolbar');
 const actions=$('calendar').querySelector('.calendar-group-toolbar-v2');
 const boxTop=top.getBoundingClientRect();
 const t=tab.getBoundingClientRect(),n=nav.getBoundingClientRect(),a=actions.getBoundingClientRect();
 const sameLine=Math.abs(t.top-n.top)<4&&Math.abs(t.top-a.top)<4;
 const closeEnough=boxTop.height<68;
 toggle.click();
 const opened=!panel.hidden&&toggle.getAttribute('aria-expanded')==='true';
 const initialBulkHidden=$('calendarGroupPanelV2').hidden;
 const search=$('calendarGroupManagerSearchV4');
 search.value='SBO';
 search.dispatchEvent(new Event('input',{bubbles:true}));
 const item=$('calendarGroupManagerResultsV4').querySelector('button');
 const found=!!item&&item.textContent.includes('SBO 프로젝트');
 item?.click();
 const selected=$('calendarGroupManageTargetV4').value==='sbo'&&
  $('calendarGroupRenameV2').value==='SBO 프로젝트';
 $('calendarGroupRenameV2').value='SBO 리그';
 $('calendarGroupRecolorV2').value='#2244aa';
 $('calendarGroupUpdateV2').click();
 const changed=data.contentGroups.find(x=>x.id==='sbo')?.name==='SBO 리그'&&
  data.contentGroups.find(x=>x.id==='sbo')?.color==='#2244aa';
 const otherUnchanged=data.events[0].title==='와우 포에버 8일차'&&
  data.events[0].start==='09:22'&&data.events[0].date==='2026-11-08';
 $('calendarGroupManageCloseV4').click();
 const closed=panel.hidden&&toggle.getAttribute('aria-expanded')==='false';
 const move=window.mwsCalendarMoveGuardV4;
 const disabledBefore=$('calendarUndoLastMoveV4').disabled;
 data.events[0].date='2026-11-09';
 move.recordMove('event-1','2026-11-08','2026-11-09','와우 포에버 8일차');
 const logged=!$('calendarUndoLastMoveV4').disabled&&!!move.last()&&
  localStorage.getItem('mwsCalendarMoveHistoryV4')?.includes('2026-11-08');
 $('calendarUndoLastMoveV4').click();
 const restored=data.events[0].date==='2026-11-08'&&move.last()===null;
 data.events[0].date='2026-11-10';
 move.recordMove('event-1','2026-11-08','2026-11-10','와우 포에버 8일차');
 data.events[0].date='2026-11-11';
 move.updateButton();
 const staleBlocked=$('calendarUndoLastMoveV4').disabled&&
  move.undoLast()===false&&data.events[0].date==='2026-11-11';
 const overflow=document.documentElement.scrollWidth>document.documentElement.clientWidth+2;
 /* Reading getBoundingClientRect flushes layout without frame scheduling. */
 const ok=opened&&initialBulkHidden&&found&&selected&&changed&&otherUnchanged&&closed&&
  disabledBefore&&logged&&restored&&staleBlocked&&!overflow&&
  (window.innerWidth<1300||sameLine&&closeEnough);
 $('qa-result').textContent=JSON.stringify({ok,viewport:window.innerWidth,topHeight:Math.round(boxTop.height),
  sameLine,opened,initialBulkHidden,found,selected,changed,otherUnchanged,closed,
  disabledBefore,logged,restored,staleBlocked,overflow,saveCount:window.__saveCount});
})();
`;
const tmp=mkdtempSync(path.join(os.tmpdir(),'mws-calendar-v4-'));
try{
 const p=path.join(tmp,'test.html');
 writeFileSync(p,`<!doctype html><html lang="ko"><head><meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <style>${stylesheet}</style></head><body data-resolution="fhd">
 ${calendar}
 <pre id="qa-result">pending</pre>
 <script>${boot}</script><script>${manager}</script><script>${moves}</script><script>${check}</script>
 </body></html>`);
 for(const width of [1920,1366,1100,700]){
  const run=spawnSync(chrome,[
    '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run',
    '--disable-background-networking','--virtual-time-budget=3000','--window-size='+width+',1000',
    '--dump-dom','file://'+p
  ],{encoding:'utf8',timeout:30000,maxBuffer:12*1024*1024});
  assert.equal(run.status,0,'Chrome exit failure '+width+': '+run.stderr.slice(-900));
  const match=run.stdout.match(/<pre id="qa-result">([^<]+)<\/pre>/);
  assert(match,'No test result at '+width+' '+run.stdout.slice(-700));
  const result=JSON.parse(match[1]);
  assert(result.ok,'Calendar V4 UI test failed '+width+': '+JSON.stringify(result));
  console.log('CALENDAR_TOOLBAR_V4_BROWSER_OK',width,JSON.stringify(result));
 }
}finally{rmSync(tmp,{recursive:true,force:true})}
