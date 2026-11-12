import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

// Tests the production stylesheet and the real Steam module, with synthetic data.
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
  .map(n=>spawnSync('which',[n],{encoding:'utf8'}))
  .find(r=>r.status===0)?.stdout.trim();
assert(chrome,'Chromium is required');
const source=read('assets/app-core.js');
assert(source.includes("'mws-steam-host-v111'"),'Calendar must render the Steam host immediately');
assert(source.includes('data-event-id=')&&source.includes('aria-label="게임 추가"'),
  'Calendar must render the game button immediately');
const steam=read('assets/steam-game-v111.js');
assert(steam.includes('if(!button.__mwsSteamSlotHandlersV1)'),
  'Runtime must bind pre-existing game buttons exactly once');
assert(read('index.html').includes('assets/calendar-stable-layout-v1.css?v=1'));
const css=[
  read('assets/app-core.css'),read('assets/calendar-toolbar-v4.css'),
  read('assets/calendar-stable-layout-v1.css'),read('assets/calendar-responsive-cards-v1.css'),
  read('assets/sidebar-rail-scrollbar-v1.css')
].join('\n');
const card=(title,id,rest=false)=>rest
  ? '<div class="mini-event rest-event" draggable="false"><button class="calendar-event-drag-handle-v4">⋮⋮</button><span class="mini-event-main">휴방</span></div>'
  : '<div class="mini-event mws-steam-host-v111" data-evid="'+id+'" draggable="false" style="border-left:4px solid #a465ff;background:#242037">'+
    '<button type="button" class="calendar-event-drag-handle-v4">⋮⋮</button>'+
    '<span class="mini-event-main">'+title+'</span>'+
    '<span class="mini-event-people">마왕0216 · 하치 · 시라안 · 데스헤마츠</span>'+
    '<button type="button" class="mws-steam-slot-v111" data-event-id="'+id+'" aria-label="게임 추가" title="게임 추가">+</button></div>';
const days=Array.from({length:42},(_,i)=>{
  const date=new Date(Date.UTC(2026,10,1+i)).toISOString().slice(0,10);
  let cards=card('[PC] 09:40 와우 포에버','e'+i);
  if(i===2)cards=card('[PC] 13:55 합방 예열 로블록스 마왕0216 등 다양한 참여자','e100')+
    card('[PC] 15:05 문 스위퍼 합방 여러 참가자','e101')+
    card('[PC] 17:21 후열 일본 라멘 시뮬레이터','e102');
  if(i===1)cards=card('',null,true);
  return '<div class="day" data-date="'+date+'"><div class="daynum">'+(i+1)+'</div>'+cards+'</div>';
}).join('');
const head=['일','월','화','수','목','금','토'].map(n=>'<div>'+n+'</div>').join('');

const beforeScript=[
  'let editingEventId="e100",openCount=0;',
  'let data={events:[],contentGroups:[],gameLibrary:[]};',
  'for(const el of document.querySelectorAll("#calendarGrid .mini-event[data-evid]")){',
  'const id=el.dataset.evid;',
  'data.events.push({id,title:el.querySelector(".mini-event-main").textContent,',
  'date:el.closest(".day").dataset.date,restDay:false,steamGame:id==="e100"?',
  '{appid:"730",name:"Counter-Strike 2",image:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlVUp8AAAAASUVORK5CYII="}:null});}',
  'function saveData(){return true;}function toast(){};',
  'window.openEvent=function(){openCount++};',
  'document.getElementById("saveEventBtn").onclick=function(){};',
  'window.measure=function(){',
  'const day=document.querySelector("#calendarGrid .day:nth-child(3)");',
  'const cards=[...day.querySelectorAll(".mini-event")];',
  'return {row:day.getBoundingClientRect().height,',
  'cards:cards.map(c=>c.getBoundingClientRect().height),',
  'titles:cards.map(c=>c.querySelector(".mini-event-main").getBoundingClientRect().height),',
  'buttons:document.querySelectorAll("#calendarGrid .mws-steam-slot-v111").length,',
  'width:cards[0].querySelector(".mws-steam-slot-v111").getBoundingClientRect().width,',
  'position:getComputedStyle(cards[0].querySelector(".mws-steam-slot-v111")).position,',
  'rootOverflow:document.documentElement.scrollWidth>innerWidth+3};};',
  'window.before=window.measure();'
].join('\n');

const verifyScript=[
  'document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{',
  'try{const before=window.before,after=window.measure();',
  'const card=document.querySelector("#calendarGrid [data-evid=e100]");',
  'const button=card.querySelector(".mws-steam-slot-v111");',
  'const slots=card.querySelectorAll(".mws-steam-slot-v111").length===1;',
  'button.click();const clickBound=openCount===1;',
  'const stable= Math.abs(before.row-after.row)<.6&&',
  ' before.cards.every((v,i)=>Math.abs(v-after.cards[i])<.6);',
  'card.querySelector(".mini-event-main").textContent="아주 긴 제목 여러 참가자 12345 새로운 가상 이벤트와 반복되는 제목";',
  'const afterTitle=window.measure();',
  'const titleStable=Math.abs(afterTitle.row-after.row)<.6&&',
  ' after.cards.every((v,i)=>Math.abs(v-afterTitle.cards[i])<.6);',
  'window.dispatchEvent(new CustomEvent("mawang:datachange",{detail:{reason:"qa"}}));',
  'setTimeout(()=>{const rescan=window.measure();',
  'const noDup=rescan.buttons===before.buttons;',
  'const afterStable=Math.abs(rescan.row-afterTitle.row)<.6;',
  'const ok=slots&&clickBound&&stable&&titleStable&&noDup&&afterStable&&',
  ' !rescan.rootOverflow&&before.buttons>30;',
  'document.getElementById("qa-result").textContent=JSON.stringify({ok,',
  ' before,after,afterTitle,rescan,slots,clickBound,stable,titleStable,noDup,afterStable});',
  '},35);',
  '}catch(err){document.getElementById("qa-result").textContent=JSON.stringify({ok:false,error:String(err),stack:err.stack})}',
  '},35));'
].join('\n');

const temp=mkdtempSync(path.join(os.tmpdir(),'mws-calendar-stable-v1-'));
try{
  const page=path.join(temp,'stable.html');
  for(const [width,height,zoom,pinned,dpr] of [
    [1920,1080,1,false,1],[1898,902,1,false,1],
    [1366,768,1,false,1],[1366,768,1.25,false,1],
    [1898,902,1,false,1.25],[850,768,1,false,1],
    [1898,902,1,true,1],[1366,768,1.25,true,1]
  ]){
    const html='<!doctype html><html lang="ko"><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head>'+
      '<body data-mws-mode="admin" data-resolution="fhd" class="'+(pinned?'sidebar-pinned':'')+'" style="zoom:'+zoom+'">'+
      '<div class="app"><aside class="sidebar"></aside><main class="main">'+
      '<div class="topbar"><h1>캘린더</h1></div><section id="calendar" class="section active">'+
      '<div class="calendar-responsive-scroll-v1"><div class="calendar-head">'+head+'</div>'+
      '<div id="calendarGrid" class="calendar">'+days+'</div></div></section></main></div>'+
      '<div id="eventModal"><div class="event-modalbox"><div class="event-modal-layout">'+
      '<div class="event-info-panel"><button id="saveEventBtn">저장</button></div></div></div></div>'+
      '<div id="upcomingDashboard"></div><pre id="qa-result">pending</pre>'+
      '<script>'+beforeScript+'</script><script>'+steam+'</script><script>'+verifyScript+'</script></body></html>';
    writeFileSync(page,html,'utf8');
    const run=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
      '--no-first-run','--disable-background-networking','--virtual-time-budget=2100',
      '--force-device-scale-factor='+dpr,'--window-size='+width+','+height,
      '--dump-dom','file://'+page],{encoding:'utf8',timeout:30000,maxBuffer:18*1024*1024});
    assert.equal(run.status,0,'Chromium failure '+width+': '+run.stderr.slice(-900));
    const m=run.stdout.match(/<pre id="qa-result">([^<]+)<\/pre>/);
    assert(m,'Calendar stability metrics missing '+width+' '+run.stdout.slice(-700));
    const result=JSON.parse(m[1]);
    assert(result.ok,'Calendar changed layout '+width+' zoom '+zoom+' pinned '+pinned+': '+JSON.stringify(result));
    console.log('CALENDAR_STABLE_LAYOUT_V1_OK',width,height,'zoom',zoom,'pinned',pinned,'DPR',dpr,
      JSON.stringify({before:result.before.row,after:result.after.row,
        title:result.afterTitle.row,slots:result.rescan.buttons}));
  }
}finally{rmSync(temp,{recursive:true,force:true})}
