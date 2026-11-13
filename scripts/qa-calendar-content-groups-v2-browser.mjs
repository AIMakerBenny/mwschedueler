/* Browser interaction smoke: create group, batch link mixed titles and times, edit and detach. */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
  .map(name=>spawnSync('which',[name],{encoding:'utf8'})).find(x=>x.status===0)?.stdout.trim();
if(!chrome)throw Error('Chrome required');
const engine=readFileSync(new URL('../assets/calendar-continuous-series-v1.js',import.meta.url),'utf8');
const manager=readFileSync(new URL('../assets/calendar-content-groups-v2.js',import.meta.url),'utf8');
const controls=`<section id="calendar"><button id="calendarGroupToggleV2"></button>
<div id="calendarGroupPanelV2" hidden>
<span id="calendarGroupCountV2"></span><button id="calendarGroupCancelV2"></button>
<select id="calendarGroupTargetV2"></select>
<button id="calendarGroupApplyV2"></button><button id="calendarGroupClearV2"></button>
<input id="calendarGroupNewNameV2"><input type="color" id="calendarGroupNewColorV2" value="#7659a5">
<button id="calendarGroupCreateV2"></button>
<input id="calendarGroupRenameV2"><input type="color" id="calendarGroupRecolorV2" value="#7659a5">
<button id="calendarGroupUpdateV2"></button><button id="calendarGroupDeleteV2"></button>
</div>
<div id="calendarGrid">
<div class="mini-event" data-evid="a" onclick="handleCalendarMiniEventClick(event,'a')">13일 SBO 연습</div>
<div class="mini-event" data-evid="b" onclick="handleCalendarMiniEventClick(event,'b')">14일 SBO 정식전</div>
<div class="mini-event" data-evid="c" onclick="handleCalendarMiniEventClick(event,'c')">15일 조별경기</div>
<div class="mini-event" data-evid="other">14일 다른 방송</div>
</div></section>
<select id="evContentGroupV2"></select>
<button id="evContentGroupToggleNewV2"></button>
<div id="evContentGroupNewWrapV2" hidden>
<input id="evContentGroupNewNameV2"><input type="color" id="evContentGroupNewColorV2" value="#7659a5">
<button id="evContentGroupCreateV2"></button></div>
<pre id="browser-result">pending</pre>`;
const preload=`
let data={
  events:[
    {id:'a',date:'2026-10-13',title:'SBO 연습',start:'15:00',end:'17:20',categoryId:'training',restDay:false},
    {id:'b',date:'2026-10-14',title:'보성동 정식전',start:'09:40',end:'12:30',categoryId:'special',restDay:false},
    {id:'c',date:'2026-10-15',title:'SBO 조별경기',start:'21:00',end:'23:00',categoryId:'special',restDay:false},
    {id:'other',date:'2026-10-14',title:'다른 방송',start:'18:00',categoryId:'special',restDay:false}
  ],contentGroups:[]
};
let saves=0;
function saveData(){saves++;return true}
function toast(){}
document.body.dataset.mwsMode='admin';
window.__mwsAppReadyV130=true;
window.mwsV55SaveNow=async()=>true;
window.fetch=async url=>({ok:true,json:async()=>({
  data:String(url).includes('/core')?{contentGroups:structuredClone(data.contentGroups)}:structuredClone(data.events)
})});
function hideCalendarEventPreview(){}
function confirm(){return true}
function handleCalendarMiniEventClick(e,id){e.stopPropagation();window.mwsCalendarContentGroupsV2.selectEvent(id)}
`;
const check=`
const m=window.mwsCalendarContentGroupsV2;
const $=id=>document.getElementById(id);
$('calendarGroupToggleV2').click();
$('calendarGrid').querySelector('[data-evid="a"]').click();
$('calendarGrid').querySelector('[data-evid="b"]').click();
const selectedBefore=m.selectionCount();
$('calendarGroupNewNameV2').value='SBO';
$('calendarGroupNewColorV2').value='#7659a5';
$('calendarGroupCreateV2').click();
const group=data.contentGroups[0];
const assignedFirst=data.events[0].contentGroupId===group?.id&&data.events[1].contentGroupId===group?.id;
const otherUntouched=!data.events[3].contentGroupId;
$('calendarGroupToggleV2').click();
$('calendarGrid').querySelector('[data-evid="c"]').click();
$('calendarGroupTargetV2').value=group.id;
$('calendarGroupApplyV2').click();
const linkedAll=data.events.slice(0,3).every(e=>e.contentGroupId===group.id);
const series=window.mwsCalendarContinuousSeriesV1.streaks(data.events,data.contentGroups);
m.syncEditor(data.events[1]);
const editorSelected=$('evContentGroupV2').value===group.id;
const titlesUnchanged=data.events.map(e=>e.title).join('|')==='SBO 연습|보성동 정식전|SBO 조별경기|다른 방송';
const timesUnchanged=data.events.map(e=>e.start).join('|')==='15:00|09:40|21:00|18:00';
$('calendarGroupToggleV2').click();
$('calendarGrid').querySelector('[data-evid="a"]').click();
$('calendarGroupClearV2').click();
const detached=!data.events[0].contentGroupId&&data.events[1].contentGroupId===group.id;
$('calendarGroupToggleV2').click();
$('calendarGroupTargetV2').value=group.id;
$('calendarGroupTargetV2').dispatchEvent(new Event('change'));
$('calendarGroupRenameV2').value='SBO 프로젝트';
$('calendarGroupRecolorV2').value='#1155aa';
$('calendarGroupUpdateV2').click();
const edited=data.contentGroups[0].name==='SBO 프로젝트'&&data.contentGroups[0].color==='#1155aa';
$('calendarGroupDeleteV2').click();
const removed=data.contentGroups.length===0&&data.events.every(e=>!e.contentGroupId);
const ok=selectedBefore===2&&assignedFirst&&otherUntouched&&linkedAll&&
  series.length===1&&series[0].totalDays===3&&editorSelected&&titlesUnchanged&&
  timesUnchanged&&detached&&edited&&removed&&saves===5;
$('browser-result').textContent=JSON.stringify({ok,selectedBefore,assignedFirst,otherUntouched,
  linkedAll,series:series.map(x=>({start:x.start,end:x.end,days:x.totalDays})),
  editorSelected,titlesUnchanged,timesUnchanged,detached,edited,removed,saves});
`;
const folder=mkdtempSync(path.join(os.tmpdir(),'mws-groups-ui-'));
try{
  const filename=path.join(folder,'test.html');
  writeFileSync(filename,`<!doctype html><meta charset="utf-8">${controls}
  <script>${engine}</script><script>${preload}</script><script>${manager}</script>
  <script>${check}</script>`,'utf8');
  const run=spawnSync(chrome,[
    '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--disable-extensions','--no-first-run','--virtual-time-budget=1500',
    '--window-size=1366,900','--dump-dom','file://'+filename
  ],{encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
  assert.equal(run.status,0,'Chrome exited: '+run.stderr.slice(-1200));
  const m=run.stdout.match(/<pre id="browser-result">([^<]+)<\/pre>/);
  assert(m,'Browser result absent '+run.stdout.slice(-500));
  const result=JSON.parse(m[1]);
  assert(result.ok,'Group workflow failed '+JSON.stringify(result));
  console.log('CONTENT_GROUP_UI_BROWSER_OK',JSON.stringify(result));
}finally{rmSync(folder,{recursive:true,force:true})}
