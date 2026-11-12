/* Chrome UI regression for searchable content groups with long names and 80+ groups.
 * Pure synthetic local page, no contacts, events or production data are modified.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
 .map(n=>spawnSync('which',[n],{encoding:'utf8'})).find(x=>x.status===0)?.stdout.trim();
assert(chrome,'Chrome is required');
const load=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const mainHTML=load('index.html');
const css=load('assets/calendar-content-groups-v2.css');
const engine=load('assets/calendar-continuous-series-v1.js');
const manager=load('assets/calendar-content-groups-v2.js');
const between=(a,b)=>{
 const first=mainHTML.indexOf(a),last=mainHTML.indexOf(b,first+a.length);
 assert(first>=0&&last>first,'Markup anchor missing: '+a.slice(0,48));
 return mainHTML.slice(first,last);
};
const panel=between('<div class="calendar-group-toolbar-v2">','<div class="calendar-head">');
const editor=between('<div class="field full calendar-group-event-editor-v2">','<div class="field">\n            <label>시작 시간</label>');
const initialGroups=Array.from({length:80},(_,i)=>({
  id:'group-'+i,name:'장기 게임 콘텐츠 / 시즌 '+String(i).padStart(3,'0')+' 특별 방송',color:'#335577'
}));
initialGroups.push({id:'sbo',name:'SBO 야구 연속 프로젝트 - 매우 긴 그룹 이름도 전부 표시',color:'#7659a5'});
initialGroups.push({id:'wow',name:'와우 포에버',color:'#0f8c95'});
const initialEvents=[
  {id:'e1',date:'2026-10-13',title:'SBO 연습',start:'15:00',end:'18:00',contentGroupId:'sbo',restDay:false},
  {id:'e2',date:'2026-10-14',title:'다른 제목의 SBO',start:'09:00',end:'12:00',contentGroupId:'sbo',restDay:false},
  {id:'e3',date:'2026-10-15',title:'새 일정',start:'18:30',end:'22:00',restDay:false},
  {id:'other',date:'2026-10-15',title:'다른 게임',start:'13:00',restDay:false}
];
const scriptData=`
let data={contentGroups:${JSON.stringify(initialGroups)},events:${JSON.stringify(initialEvents)}};
let saves=0;
function saveData(){saves++;return true}
function toast(){}
function hideCalendarEventPreview(){}
function confirm(){return true}
function handleCalendarMiniEventClick(e,id){e.stopPropagation();window.mwsCalendarContentGroupsV2.selectEvent(id)}
`;
const check=`
(async()=>{
 const $=id=>document.getElementById(id);
 const wait=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const engine=window.mwsCalendarContentGroupsV2;
 const search=$('evContentGroupSearchV3');
 engine.syncEditor(data.events[0]);
 const previous=$('evContentGroupV2').value==='sbo';
 const quick=[...$('evContentGroupQuickV3').querySelectorAll('button')].map(x=>x.textContent);
 const quickFirstSbo=quick[0]?.includes('SBO')||false;
 search.focus();search.value='SBO';search.dispatchEvent(new Event('input',{bubbles:true}));
 const items=[...$('evContentGroupResultsV3').querySelectorAll('button')];
 const match=items.length===1&&items[0].textContent.includes('SBO');
 items[0]?.click();
 const kept=$('evContentGroupV2').value==='sbo'&&$('evContentGroupCurrentV3').textContent.includes('SBO');
 const manyGroups=data.contentGroups.length===82;
 search.focus();search.value='시즌 079';search.dispatchEvent(new Event('input',{bubbles:true}));
 const narrowed=[...$('evContentGroupResultsV3').querySelectorAll('button')];
 const oneMatch=narrowed.length===1&&narrowed[0].textContent.includes('079');
 narrowed[0]?.click();
 const alternate=$('evContentGroupV2').value==='group-79';
 $('evContentGroupCurrentV3').querySelector('button')?.click();
 const clear=$('evContentGroupV2').value==='';
 const panelSearch=$('calendarGroupSearchPanelV3');
 $('calendarGroupToggleV2').click();
 const card=$('calendarGrid').querySelector('[data-evid="e3"]');
 card.click();
 panelSearch.focus();panelSearch.value='SBO';
 panelSearch.dispatchEvent(new Event('input',{bubbles:true}));
 const panelResults=[...$('calendarGroupResultsPanelV3').querySelectorAll('button')];
 panelResults[0]?.click();
 const panelChosen=$('calendarGroupTargetV2').value==='sbo';
 $('calendarGroupApplyV2').click();
 const attached=data.events.find(e=>e.id==='e3').contentGroupId==='sbo';
 const otherSafe=!data.events.find(e=>e.id==='other').contentGroupId;
 const timeSafe=data.events.find(e=>e.id==='e3').start==='18:30';
 // Test width, wrapping and visibility of the selected long group name.
 engine.syncEditor(data.events[0]);
 await wait();
 const box=$('editor-column').getBoundingClientRect();
 const field=$('evContentGroupCurrentV3').getBoundingClientRect();
 const name=$('evContentGroupCurrentV3').querySelector('.calendar-group-current-name-v3');
 const nameBounds=name.getBoundingClientRect();
 const longVisible=name.scrollHeight>17&&nameBounds.right<=box.right+1;
 const noOverflow=field.right<=box.right+1 &&
  $('evContentGroupSearchV3').getBoundingClientRect().right<=box.right+1 &&
  document.documentElement.scrollWidth<=document.documentElement.clientWidth+2;
 const onScreen=getComputedStyle(name).whiteSpace==='normal';
 const ok=previous&&quickFirstSbo&&match&&kept&&manyGroups&&oneMatch&&alternate&&
  clear&&panelChosen&&attached&&otherSafe&&timeSafe&&noOverflow&&onScreen&&longVisible&&saves===1;
 $('qa-result').textContent=JSON.stringify({ok,previous,quickFirstSbo,match,kept,manyGroups,
   oneMatch,alternate,clear,panelChosen,attached,otherSafe,timeSafe,noOverflow,
   onScreen,longVisible,saves,viewport:window.innerWidth});
})();
`;
const folder=mkdtempSync(path.join(os.tmpdir(),'mws-content-search-'));
try{
 const file=path.join(folder,'index.html');
 const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8">
 <style>
 :root{--text:#f8fafc;--muted:#9aa8ba;--accent:#8160dc;--border:#343c4c;--panel:#151923}
 *{box-sizing:border-box}html,body{margin:0;padding:0;background:#0a1019;color:var(--text);font:14px Arial,sans-serif}
 .columns{display:grid;grid-template-columns:minmax(0,58fr) minmax(0,42fr);gap:10px;padding:12px;max-width:100%;min-width:0}
 #editor-column{min-width:0;padding:12px;border:1px solid var(--border);border-radius:12px}
 .field{min-width:0}button,input,select{font:inherit;background:#0d111a;color:var(--text);border:1px solid var(--border);border-radius:8px;padding:7px}
 .calendar-group-panel-v2[hidden], [hidden]{display:none!important}
 #calendarGrid{display:flex;gap:8px} .mini-event{cursor:pointer;display:inline-flex;padding:6px;border:1px solid #666}
 ${css}
 </style></head><body><div class="columns"><div id="editor-column">
 ${editor}</div><div id="calendar">
 ${panel}
 <div id="calendarGrid">
 <div class="mini-event" data-evid="e1" onclick="handleCalendarMiniEventClick(event,'e1')">SBO</div>
 <div class="mini-event" data-evid="e2" onclick="handleCalendarMiniEventClick(event,'e2')">SBO2</div>
 <div class="mini-event" data-evid="e3" onclick="handleCalendarMiniEventClick(event,'e3')">새 일정</div>
 <div class="mini-event" data-evid="other">다른 게임</div>
 </div></div></div>
 <pre id="qa-result">pending</pre>
 <script>${engine}</script><script>${scriptData}</script><script>${manager}</script><script>${check}</script>
 </body></html>`;
 writeFileSync(file,html,'utf8');
 for(const width of [1580,1140,850,560]){
  const run=spawnSync(chrome,[
    '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--disable-extensions','--no-first-run','--virtual-time-budget=4000',
    '--window-size='+width+',900','--dump-dom','file://'+file
  ],{encoding:'utf8',timeout:30000,maxBuffer:10*1024*1024});
  assert.equal(run.status,0,'Chrome failed '+width+' '+run.stderr.slice(-900));
  const matched=run.stdout.match(/<pre id="qa-result">([^<]+)<\/pre>/);
  assert(matched,'Result missing '+width+' '+run.stdout.slice(-400));
  const result=JSON.parse(matched[1]);
  assert(result.ok,'Search UI failed at '+width+' '+JSON.stringify(result));
  console.log('CONTENT_GROUP_SEARCH_UI_OK',width,JSON.stringify(result));
 }
}finally{rmSync(folder,{recursive:true,force:true})}
