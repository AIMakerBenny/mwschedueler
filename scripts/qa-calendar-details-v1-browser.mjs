import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),core=read('assets/app-core.js'),steam=read('assets/steam-game-v111.js');
const modal=html.slice(html.indexOf('<div id="eventModal"'),html.indexOf('<div id="datePickerPopover"'));
const helper=core.slice(core.indexOf('function openCalendarEventDetailsV1(id){'),core.indexOf("document.addEventListener('keydown'",core.indexOf('function openCalendarEventDetailsV1(id){')));
const render=core.slice(core.indexOf('function renderCalendar(){'),core.indexOf('  const grid=document.getElementById(\'calendarGrid\');grid.innerHTML=out;'));
assert(!render.includes('calendar-event-drag-handle-v4'),'Monthly card must have no drag handle');
assert(!render.includes('timePrefix'),'Monthly labels must have no generated time prefix');
assert(core.includes('el.onpointerdown=e=>{')&&core.includes('beginCalendarPointerEventDragV174(e,el);'));
const gameMarkup=steam.match(/panel\.innerHTML=`([\s\S]*?)`;/)[1];
const steamCSS=steam.match(/style\.textContent=`([\s\S]*?)`;/)[1];
const inline=[...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
const css=[read('assets/app-core.css'),inline,...[
  'mawang-premium-v1621.css','calendar-toolbar-v4.css','calendar-stable-layout-v1.css',
  'calendar-responsive-cards-v1.css','event-sidebar-tabs-v5.css','calendar-content-groups-v2.css',
  'calendar-broadcast-duration-v1.css','workspace-clean-v1.css'
].map(p=>read('assets/'+p)),steamCSS,read('assets/calendar-details-v1.css')].join('\n');
const boot=`
const eventData={id:'qa-event',date:'2026-11-18',title:'합방 예열 로블록스',start:'13:55',end:'15:02',description:'상세 내용 <script>unsafe</'+'script>',memoTitle:'준비 메모',memoContent:'체크할 내용',participants:[],steamGame:{name:'ROBLOX'},contentGroupId:'existing-group'};
const data={events:[eventData],gameLibrary:[]};
const baseline=JSON.stringify(data);
let editorOpens=0,saves=0,calendarCtrlCopyMode=false;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function calendarPreviewHTML(e){return '<div class="calendar-preview-title">'+esc(e.title)+'</div><div class="event-meta">'+e.date+' · '+e.start+' - '+e.end+'</div><div>참가자 0명</div>'}
function hideCalendarEventPreview(){}
function isCalendarTabActive(){return true}
function duplicateEventById(){}
function saveData(){saves++}
function openEvent(){editorOpens++;document.getElementById('eventModal').classList.add('open');window.mwsEventEditorLayoutV6.reset()}
${helper}
document.querySelector('.mini-event').onclick=e=>handleCalendarMiniEventClick(e,'qa-event');
document.querySelector('[data-close="eventModal"]').onclick=()=>document.getElementById('eventModal').classList.remove('open');
const tick=()=>new Promise(r=>setTimeout(r,30));
window.addEventListener('DOMContentLoaded',async()=>{
 await tick();
 const $=s=>document.querySelector(s),r=e=>e.getBoundingClientRect();
 $('.mini-event').click();await tick();await new Promise(resolve=>setTimeout(resolve,220));
 const readOnlyDrawer=window.mwsCalendarDetailsV1.isOpen()&&!$('#eventModal').classList.contains('open')&&editorOpens===0&&saves===0;
 const contentEscaped=$('#calendarDetailsBodyV1').textContent.includes('<script>unsafe')&&!$('#calendarDetailsBodyV1 script');
 const drawerFits=r($('#calendarEventDetailsV1')).right<=innerWidth+1&&r($('#calendarEventDetailsV1')).left>=0;
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 const escapeCloses=!window.mwsCalendarDetailsV1.isOpen();
 $('.mini-event').click();await tick();$('#calendarDetailsEditV1').click();await tick();
 const editOnlyOnButton=editorOpens===1&&$('#eventModal').classList.contains('open')&&!window.mwsCalendarDetailsV1.isOpen();
 const game=document.createElement('aside');game.id='eventGamePanelV112';game.className='event-game-panel-v112';game.innerHTML=${JSON.stringify(gameMarkup)};
 $('.event-info-panel').insertAdjacentElement('afterend',game);await tick();
 $('.event-modalbox').classList.add('mws-game-panel-enabled-v112');
 const lateGameReparented=game.parentElement.classList.contains('event-editor-tools-v6');
 $('#evTitle').value=eventData.title;$('#evMemoContent').value='메모 유지';$('#evContentGroupV2').innerHTML='<option value="existing-group">기존 그룹</option>';$('#evContentGroupV2').value='existing-group';
 $('#evDateDisplay span').textContent='2026년 11월 18일';$('#evStartDisplay span').textContent='오후 01:55';$('#evEndDisplay span').textContent='오후 03:02';
 $('#selectedParticipants').innerHTML='<span>테스트 참가자 · 확정</span>';
 $('#participantResults').innerHTML=Array.from({length:20},(_,i)=>'<button type="button" class="secondary">테스트 참가자 '+(i+1)+'</button>').join('');
 const initialGameVisible=getComputedStyle(game).display!=='none'&&getComputedStyle($('.event-memo-panel')).display==='none';
 $('[data-editor-tool-v6="organize"]').click();$('#eventMemoTabV5').click();
 const memoVisible=!$('#eventMemoPaneV5').hidden&&getComputedStyle($('.event-memo-panel')).display!=='none';
 $('[data-editor-tool-v6="game"]').click();$('[data-editor-tool-v6="organize"]').click();
 const inputsRetained=$('#evMemoContent').value==='메모 유지'&&$('#evContentGroupV2').value==='existing-group'&&$('#evTitle').value===eventData.title;
 const uniqueInputs=['evTitle','evMemoContent','evContentGroupV2','gameManualNameV1'].every(id=>document.querySelectorAll('#'+id).length===1);
 const footer=$('.mws-event-editor-v6>.event-actions'),footerRect=r(footer);
 const footerVisible=footerRect.bottom<=innerHeight+1&&footerRect.top>=0&&r($('#saveEventBtn')).bottom<=innerHeight+1;
 const desktop=innerWidth>760;
 const boxFits=r($('.event-modalbox')).width<=innerWidth+1;
 const dateTimeRow=!desktop||Math.abs(r($('#evDateDisplay')).top-r($('#evStartDisplay')).top)<2&&Math.abs(r($('#evStartDisplay')).top-r($('#evEndDisplay')).top)<2;
 const noPaneOverlap=!desktop||r($('.event-info-panel')).right<=r($('.event-editor-tools-v6')).left+1;
 const cardTitle=$('.mini-event-main'),cover=$('.mws-steam-slot-v111');
 const cardNoOverlap=r(cardTitle).right<=r(cover).left+1;
 const noSourceMutation=baseline===JSON.stringify(data)&&saves===0;
 const result={readOnlyDrawer,contentEscaped,drawerFits,escapeCloses,editOnlyOnButton,lateGameReparented,initialGameVisible,memoVisible,inputsRetained,uniqueInputs,footerVisible,boxFits,dateTimeRow,noPaneOverlap,cardNoOverlap,noSourceMutation,noRootOverflow:document.documentElement.scrollWidth<=innerWidth+2};
 $('#result').textContent=JSON.stringify(result);
 $('[data-editor-tool-v6="game"]').click();
});
`;
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-details-'));
try{
 const fixture='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="mws-premium" data-resolution="fhd"><main><section id="calendar" class="section active"><div id="calendarGrid" class="calendar"><div class="day"><div class="daynum">18</div><div class="mini-event mws-steam-host-v111" data-evid="qa-event"><span class="mini-event-main">합방 예열 로블록스</span><button type="button" class="mws-steam-slot-v111">+</button></div></div></div></section></main>'+modal+'<pre id="result">pending</pre><script>'+read('assets/event-sidebar-tabs-v5.js')+'</script><script>'+read('assets/calendar-details-v1.js')+'</script><script>'+boot+'</script></body></html>';
 const dest=path.join(temp,'test.html');writeFileSync(dest,fixture);
 if(process.env.MWS_DETAILS_FIXTURE){writeFileSync(process.env.MWS_DETAILS_FIXTURE,fixture);if(process.env.MWS_FIXTURE_ONLY)process.exit(0);}
 const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(n=>spawnSync('which',[n],{encoding:'utf8'})).find(r=>r.status===0)?.stdout.trim();assert(chrome,'Chromium required');
 for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[2560,1080],[700,900]]){
  const run=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--virtual-time-budget=2500','--window-size='+width+','+height,'--dump-dom','file://'+dest],{encoding:'utf8',timeout:30000,maxBuffer:18*1024*1024});
  assert.equal(run.status,0,run.stderr.slice(-700));const match=run.stdout.match(/<pre id="result">([^<]+)<\/pre>/);assert(match,'Missing details result');
  const result=JSON.parse(match[1]);for(const [key,value] of Object.entries(result))assert.equal(value,true,width+'x'+height+' '+key+' '+JSON.stringify(result));
  console.log('CALENDAR_DETAILS_BROWSER_OK',width,height,JSON.stringify(result));
 }
}finally{rmSync(temp,{recursive:true,force:true})}
