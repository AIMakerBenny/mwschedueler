/* Headless Chrome geometry regression for connected calendar ribbons.
 * No user account, browser login, or data persistence is involved.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdtemp,writeFileSync,rmSync,readFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const candidates=['google-chrome','google-chrome-stable','chromium','chromium-browser'];
const chrome=candidates.map(name=>spawnSync('which',[name],{encoding:'utf8'}))
  .find(out=>out.status===0)?.stdout.trim();
if(!chrome)throw new Error('Chrome is required for continuous calendar UI geometry checks');
const engine=readFileSync(new URL('../assets/calendar-continuous-series-v1.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/calendar-continuous-series-v1.css',import.meta.url),'utf8');
const dates=Array.from({length:42},(_,i)=>new Date(Date.UTC(2026,10,1+i)).toISOString().slice(0,10));
const days=dates.map((d,i)=>`<div class="day ${d.startsWith('2026-11')?'':'out'}" data-date="${d}"><div class="daynum">${i+1}</div><div class="mini-event" tabindex="0" ${i>=4&&i<=11?'data-mws-ui-group="wow"':i===25||i>=32&&i<=34?'data-mws-ui-group="draft"':''}>방송 일정</div></div>`).join('');
const events=['05','06','07','08','09','10','11','12'].map(day=>({
  title:'와우 포에버 '+day,contentGroupId:'wow',categoryId:'gaming',color:'#0f8c95',
  date:'2026-11-'+day,restDay:false
}));
events.push(...['2026-11-26','2026-12-03','2026-12-04','2026-12-05'].map(date=>({title:'오퍼 M - 드래프트',contentGroupId:'draft',date,restDay:false})));
const script=`
const events=${JSON.stringify(events)};
window.mwsCalendarContinuousSeriesV1.render(
  document.getElementById('calendarGrid'),events,[{id:'wow',name:'와우 포에버',color:'#0f8c95'},{id:'draft',name:'오퍼 M - 드래프트',color:'#d97706'}]
);
const grid=document.getElementById('calendarGrid');
const bars=[...grid.querySelectorAll('.calendar-continuous-ribbon-v1')];
const cells=[...grid.querySelectorAll('.day')];
const first=cells[4],last=cells[6],next=cells[7],nextLast=cells[11];
const r1=bars[0]?.getBoundingClientRect(),r2=bars[1]?.getBoundingClientRect();
const c1=first.getBoundingClientRect(),c7=last.getBoundingClientRect();
const c8=next.getBoundingClientRect(),c12=nextLast.getBoundingClientRect();
const card=first.querySelector('.mini-event').getBoundingClientRect();
const dec=bars.find(b=>b.dataset.groupId==='draft'&&b.dataset.seriesStart==='2026-12-03');
const dr=dec?.getBoundingClientRect(),dc1=cells[32].getBoundingClientRect(),dc3=cells[34].getBoundingClientRect();
const ok=bars.length===4 && bars.slice(0,2).every(b=>b.dataset.groupId==='wow' && b.textContent.trim()==='') &&
  !!dr && cells[32].classList.contains('out') && Math.abs(dr.left-(dc1.left+7))<3 && Math.abs(dr.right-(dc3.right-7))<3 &&
  dec.dataset.seriesEnd==='2026-12-05' && bars.filter(b=>b.dataset.groupId==='draft').length===2 &&
  Math.abs(r1.left-(c1.left+7))<3 &&
  Math.abs(r1.right-(c7.right-7))<3 &&
  Math.abs(r2.left-(c8.left+7))<3 &&
  Math.abs(r2.right-(c12.right-7))<3 &&
  r1.bottom<card.top &&
  getComputedStyle(bars[0]).pointerEvents==='none' &&
  cells.every(c=>!!c.querySelector('.mini-event')) &&
  cells[4].querySelector('.daynum').getBoundingClientRect().bottom<r1.top;
const groupCard=first.querySelector('.mini-event'),other=cells[25].querySelector('.mini-event');
const dims=()=>[...grid.querySelectorAll('.mini-event,.calendar-continuous-ribbon-v1')].map(n=>[n.offsetLeft,n.offsetTop,n.offsetWidth,n.offsetHeight]);
const before=JSON.stringify(dims());
groupCard.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));
const active=[...grid.querySelectorAll('.mws-ui-group-highlight')];
const pointerLinked=active.length===10&&active.every(n=>(n.dataset.mwsUiGroup||n.dataset.groupId)==='wow');
groupCard.dispatchEvent(new PointerEvent('pointerleave',{bubbles:true,pointerType:'mouse'}));
grid.dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}));
const pointerCleared=!grid.querySelector('.mws-ui-group-highlight');
groupCard.focus();
const keyboardLinked=grid.querySelectorAll('.mws-ui-group-highlight').length===10;
other.focus();
const switched=[...grid.querySelectorAll('.mws-ui-group-highlight')].every(n=>(n.dataset.mwsUiGroup||n.dataset.groupId)==='draft')&&grid.querySelectorAll('.mws-ui-group-highlight').length===6;
grid.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
const cleared=!grid.querySelector('.mws-ui-group-highlight');
const context=window.mwsCalendarContinuousSeriesV1.contextFor(grid,events[0]);
const interaction=pointerLinked&&pointerCleared&&keyboardLinked&&switched&&cleared&&before===JSON.stringify(dims())&&context?.totalDays===8;
document.getElementById('qa-result').textContent=JSON.stringify({
  ok:ok&&interaction,interaction,pointerLinked,pointerCleared,keyboardLinked,switched,cleared,bars:bars.length,
  groups:bars.map(b=>b.dataset.groupId),
  leftDiff:r1.left-(c1.left+7),rightDiff:r1.right-(c7.right-7),
  nextLeftDiff:r2.left-(c8.left+7),nextRightDiff:r2.right-(c12.right-7),
  ribbonBottom:r1.bottom,cardTop:card.top
});
`;
const baseCss=`*{box-sizing:border-box}
body{margin:12px;background:#090e18;color:#fff;font-family:Arial,sans-serif}
#calendarGrid{display:grid;grid-template-columns:repeat(7,minmax(100px,1fr));gap:7px;position:relative}
.day{min-height:130px;padding:8px;overflow:hidden;position:relative;background:#171c27;border:1px solid #303848;border-radius:8px}
.daynum{font-size:12px;margin-bottom:7px}.mini-event{height:28px;padding:5px;background:#203c46;border-radius:4px}`;
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-continuous-browser-'));
try{
  const file=path.join(dir,'index.html');
  const html=`<!doctype html><meta charset="utf-8"><style>${baseCss}\n${css}</style>
    <div id="calendarGrid">${days}</div><pre id="qa-result">PENDING</pre>
    <script>${engine}</script><script>${script}</script>`;
  writeFileSync(file,html,'utf8');
  for(const width of [1920,1366,850]){
    const run=spawnSync(chrome,[
      '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
      '--disable-background-networking','--no-first-run','--virtual-time-budget=2500',
      '--window-size='+width+',1080','--dump-dom','file://'+file
    ],{encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
    assert.equal(run.status,0,'Chrome failed: '+run.stderr.slice(-1000));
    const match=run.stdout.match(/<pre id="qa-result">([^<]+)<\/pre>/);
    assert(match,'Missing browser layout assertion: '+run.stdout.slice(-300));
    const result=JSON.parse(match[1]);
    assert(result.ok,'Ribbon geometry failed '+width+': '+JSON.stringify(result));
    console.log('CALENDAR_SERIES_BROWSER_OK',width,JSON.stringify(result));
  }
}finally{rmSync(dir,{recursive:true,force:true})}
