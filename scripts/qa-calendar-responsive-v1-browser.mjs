/* Calendar responsive geometry regression using production CSS and the real
   Steam module's late-injected stylesheet. Uses synthetic events only. */
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
  .map(name=>spawnSync('which',[name],{encoding:'utf8'}))
  .find(result=>result.status===0)?.stdout.trim();
assert(chrome,'Chromium is required for calendar geometry QA');
const html=file('index.html');
const core=file('assets/app-core.css');
const seriesStyle=file('assets/calendar-continuous-series-v1.css');
const toolbar=file('assets/calendar-toolbar-v4.css');
const responsive=file('assets/calendar-responsive-cards-v1.css');
const steamModule=file('assets/steam-game-v111.js');
const seriesEngine=file('assets/calendar-continuous-series-v1.js');
assert(html.includes('assets/calendar-responsive-cards-v1.css?v=1'));
assert(html.includes('<div class="calendar-responsive-scroll-v1"'));
assert(html.includes('id="calendarGrid" class="calendar"'));
assert(html.indexOf('class="calendar-head"')<html.indexOf('id="calendarGrid"'));
assert(html.includes('class="calendar-responsive-scroll-v1" role="region" tabindex="0"'));
assert(!responsive.includes('display:none'),'Responsive CSS must not hide events');
const steamCss=steamModule.match(/style\.textContent=`([\s\S]*?)`;/)?.[1];
assert(steamCss&&steamCss.includes('mws-steam-slot-v111'),'Steam runtime CSS must be used in QA');
const stylesheet=[core,seriesStyle,toolbar,responsive,steamCss].join('\n');

const iso=i=>new Date(Date.UTC(2026,10,1+i)).toISOString().slice(0,10);
const events=[];
const image='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
function eventCard(date,n,rest=false){
 const id='test-'+date+'-'+n;
 const title=rest?'휴방':n===1?'21:30 와우 포에버 긴 콘텐츠 제목과 다양한 참가자':'19:00 SBO 연속 콘텐츠 시리즈 방송 일정';
 const people=rest?'':'참가자 가나다, 마왕, 테스트 참여자';
 if(!rest)events.push({id,date,contentGroupId:'wow',title,restDay:false});
 const color=rest?'#bd5367':'#0f8c95';
 return `<div class="mini-event ${rest?'rest-event':'mws-steam-host-v111 calendar-content-group-event-v2'}"
  draggable="false" data-evid="${id}" style="border-left:4px solid ${color};background:#19373d">
  <button type="button" draggable="true" class="calendar-event-drag-handle-v4">⋮⋮</button>
  <span class="mini-event-main">${title}</span>
  ${people?`<span class="mini-event-people">${people}</span>`:''}
  ${rest?'':`<button type="button" class="mws-steam-slot-v111" aria-label="Steam 게임 추가"><img src="${image}" alt=""></button>`}
 </div>`;
}
const dates=Array.from({length:42},(_,i)=>iso(i));
const days=dates.map((date,i)=>{
 const heavy=[2,3,10].includes(i); // November 3, 4 and 11, 2026
 let cards=eventCard(date,1);
 if(heavy){cards+=eventCard(date,2)+eventCard(date,3)+eventCard(date,4);}
 if(i===12)cards+=eventCard(date,9,true);
 return `<div class="day" data-date="${date}"><div class="daynum">${i+1}</div>${cards}</div>`;
}).join('');
const headings=['일','월','화','수','목','금','토'].map(x=>'<div>'+x+'</div>').join('');
const boot=`
(async()=>{
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const grid=$('#calendarGrid'),scroll=$('.calendar-responsive-scroll-v1');
 const events=${JSON.stringify(events)};
 const raf=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 window.mwsCalendarContinuousSeriesV1.render(grid,events,[{id:'wow',name:'와우 포에버',color:'#0f8c95'}]);
 await raf();
 const cells=$$('#calendarGrid .day'),cards=$$('#calendarGrid .mini-event');
 const day=cells[2],card=day.querySelector('.mini-event'),main=card.querySelector('.mini-event-main');
 const handle=card.querySelector('.calendar-event-drag-handle-v4'),slot=card.querySelector('.mws-steam-slot-v111');
 const r=el=>el.getBoundingClientRect();
 const width=r(day).width,mainRect=r(main),slotRect=r(slot),handleRect=r(handle);
 const compact=getComputedStyle(slot).position==='static';
 const expectedCompact=width-18<=215;
 const regionHeight=r(scroll).height;
 const noMainSlotOverlap=compact? mainRect.top>=slotRect.bottom-1:mainRect.right<=slotRect.left+1;
 const noHandleTitleOverlap=compact?mainRect.top>=handleRect.bottom-1:mainRect.left>=handleRect.right-1;
 const noHeaderMismatch=Math.abs(r(cells[0]).left-r($('.calendar-head>div')).left)<2;
 const allCardsPresent=cards.length===events.length+1;
 const textReadable=mainRect.width>=95&&getComputedStyle(main).webkitLineClamp==='2';
 const columnFloor=width>=140;
 const counts={edit:0,game:0,handle:0};
 card.addEventListener('click',()=>{counts.edit++});
 slot.addEventListener('click',e=>{e.stopPropagation();counts.game++});
 handle.addEventListener('click',e=>{e.stopPropagation();counts.handle++});
 slot.click();handle.click();main.click();
 const interactionSafe=counts.edit===1&&counts.game===1&&counts.handle===1;
 const ribbon=$('.calendar-continuous-ribbon-v1');
 const firstGroupCell=cells[0];
 const groupAligned=!!ribbon&&Math.abs(r(ribbon).left-(r(firstGroupCell).left+7))<=3;
 const beforeScroll=scroll.scrollLeft;
 scroll.scrollLeft=165;
 await raf();
 const scrollSync=Math.abs(r(cells[0]).left-r($('.calendar-head>div')).left)<2;
 const hadScroll=scroll.scrollWidth>scroll.clientWidth+2;
 const scrollbarWorks=!hadScroll||scroll.scrollLeft>beforeScroll;
 const noRootOverflow=document.documentElement.scrollWidth<=window.innerWidth+3;
 const ok=compact===expectedCompact&&noMainSlotOverlap&&noHandleTitleOverlap&&
   noHeaderMismatch&&allCardsPresent&&textReadable&&columnFloor&&interactionSafe&&
   groupAligned&&scrollSync&&scrollbarWorks&&noRootOverflow&&regionHeight>0;
 $('#qa-result').textContent=JSON.stringify({ok,viewport:innerWidth,zoom:document.body.style.zoom||'1',
   dateWidth:Math.round(width),titleWidth:Math.round(mainRect.width),compact,expectedCompact,
   noMainSlotOverlap,noHandleTitleOverlap,noHeaderMismatch,allCardsPresent,textReadable,
   columnFloor,interactionSafe,groupAligned,scrollSync,hadScroll,scrollbarWorks,
   noRootOverflow,ribbonCount:$$('.calendar-continuous-ribbon-v1').length});
})().catch(e=>document.querySelector('#qa-result').textContent=JSON.stringify({ok:false,error:String(e),stack:e.stack}));
`;
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-calendar-responsive-v1-'));
try{
 const test=path.join(temp,'index.html');
 const widths=[[2560,1440,1],[2048,1140,1],[1920,1080,1],[1898,902,1],
  [1366,768,1],[1366,768,1.25],[1898,902,1.1],[1092,768,1],[850,768,1]];
 for(const [width,height,zoom] of widths){
   writeFileSync(test,`<!doctype html><html lang="ko"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>${stylesheet}</style></head>
    <body data-resolution="fhd" style="zoom:${zoom}">
     <div class="app"><aside class="sidebar"></aside><main class="main">
       <section id="calendar" class="section active">
        <div class="calendar-responsive-scroll-v1" role="region" tabindex="0">
        <div class="calendar-head">${headings}</div>
        <div id="calendarGrid" class="calendar">${days}</div>
        </div>
       </section></main></div><pre id="qa-result">pending</pre>
      <script>${seriesEngine}</script><script>${boot}</script>
    </body></html>`);
   const run=spawnSync(chrome,[
    '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run',
    '--disable-background-networking','--virtual-time-budget=3500',
    '--window-size='+width+','+height,'--dump-dom','file://'+test
   ],{encoding:'utf8',timeout:30000,maxBuffer:15*1024*1024});
   assert.equal(run.status,0,'Chromium exited with error '+width+': '+run.stderr.slice(-1000));
   const match=run.stdout.match(/<pre id="qa-result">([^<]+)<\/pre>/);
   assert(match,'Missing browser metrics '+width+' '+run.stdout.slice(-600));
   const result=JSON.parse(match[1]);
   assert(result.ok,'Calendar responsive QA failure '+width+' / '+zoom+': '+JSON.stringify(result));
   console.log('CALENDAR_RESPONSIVE_V1_OK',width,height,'zoom',zoom,JSON.stringify(result));
 }
}finally{rmSync(temp,{recursive:true,force:true})}
