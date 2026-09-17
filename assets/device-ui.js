/* Mawang Scheduler: explicit device modes, mobile UI first pass. */
(()=>{
'use strict';
const KEY='mws-device-ui-v1';
const desktops=['fhd','2k','4k','wide'];
let prefs={mode:'pc',pc:'fhd'};
try { const saved=JSON.parse(localStorage.getItem(KEY)||'null'); if(saved){prefs.mode=saved.mode==='mobile'?'mobile':'pc';prefs.pc=desktops.includes(saved.pc)?saved.pc:'fhd';}else{prefs.mode=document.body.dataset.resolution==='mobile'?'mobile':'pc';prefs.pc=desktops.includes(document.body.dataset.resolution)?document.body.dataset.resolution:'fhd';}} catch(_){}
const settings=document.querySelector('#settings');
if(!settings||!window.setResolutionMode)return;
const card=document.createElement('div');card.className='card mws-device-card';
card.innerHTML='<h3>화면 모드</h3><p class="muted">이 기기에서 사용할 화면을 선택하세요.</p><div class="mws-device-options" role="group" aria-label="화면 모드"><button type="button" data-device-choice="pc">PC<small>기존 화면</small></button><button type="button" data-device-choice="mobile">모바일<small>세로 화면</small></button><button type="button" data-device-choice="fold8" disabled>폴드8<small>준비 중</small></button></div><p id="mwsDeviceStatus" class="muted" role="status"></p>';
settings.prepend(card);
const nav=document.createElement('nav');nav.className='mws-mobile-tabs';nav.setAttribute('aria-label','주요 메뉴');
[['dashboard','홈'],['calendar','일정'],['contacts','연락처'],['settings','설정'],['menu','전체 메뉴']].forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.dataset.mobileTab=id;b.textContent=label;b.onclick=()=>{if(id==='menu'){window.toggleMobileDrawer?.();return;}document.querySelector('.sidebar [data-tab="'+id+'"]')?.click();window.setMobileDrawer?.(false);window.scrollTo({top:0});};nav.append(b);});document.body.append(nav);
const baseSet=window.setResolutionMode;
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){document.getElementById('mwsDeviceStatus').textContent='화면을 변경했습니다. 브라우저 설정 때문에 선택값을 저장하지 못했습니다.';}}
function refresh(){
 document.body.dataset.deviceMode=prefs.mode;
 card.querySelectorAll('[data-device-choice]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.deviceChoice===prefs.mode));});
 document.getElementById('mwsDeviceStatus').textContent=prefs.mode==='pc'?'PC 화면을 사용 중입니다.':'모바일 화면을 사용 중입니다. 선택은 이 브라우저에 저장됩니다.';
 const res=document.querySelector('.resolution-settings-card');if(res)res.hidden=prefs.mode==='mobile';
 document.querySelectorAll('[data-resolution-choice="mobile"]').forEach(b=>b.hidden=true);
 const active=document.querySelector('.sidebar [data-tab].active')?.dataset.tab;
 nav.querySelectorAll('[data-mobile-tab]').forEach(b=>{if(b.dataset.mobileTab===active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 document.querySelectorAll('#calendarGrid .day[data-date]').forEach(d=>{const n=d.querySelector('.daynum');if(n)n.dataset.mobileDate=d.dataset.date.slice(5).replace('-',' / ');});
}
function apply(mode){if(!['pc','mobile'].includes(mode))return;if(prefs.mode==='pc'&&desktops.includes(document.body.dataset.resolution))prefs.pc=document.body.dataset.resolution;prefs.mode=mode;window.setMobileDrawer?.(false);baseSet(mode==='mobile'?'mobile':prefs.pc);refresh();save();}
window.setResolutionMode=function(mode){if(mode==='mobile'){apply('mobile');return;}if(desktops.includes(mode)){prefs.pc=mode;prefs.mode='pc';baseSet(mode);refresh();save();}};
card.addEventListener('click',e=>{const b=e.target.closest('[data-device-choice]');if(b&&!b.disabled)apply(b.dataset.deviceChoice);});
let queued=false;const update=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh();});};
new MutationObserver(update).observe(document.querySelector('.sidebar .nav'),{subtree:true,attributes:true,attributeFilter:['class']});
new MutationObserver(update).observe(document.getElementById('calendarGrid'),{childList:true,subtree:true});
window.addEventListener('mawang:datachange',update);
baseSet(prefs.mode==='mobile'?'mobile':prefs.pc);refresh();
})();

/* Mobile calendar views, preserving the original PC calendar. */
(()=>{
'use strict';
const section=document.getElementById('calendar'),grid=document.getElementById('calendarGrid');
if(!section||!grid)return;
const key='mws-mobile-calendar-view-v2';
let view='month',anchor=today();
try{const v=localStorage.getItem(key);if(['day','week','month'].includes(v))view=v;}catch(_){}
function today(){return typeof todayKST==='function'?todayKST():new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());}
function shift(iso,n){const [y,m,d]=iso.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d+n));return date.toISOString().slice(0,10);}
function weekStart(iso){return shift(iso,-new Date(iso+'T12:00:00Z').getUTCDay());}
const tabs=document.createElement('div');tabs.className='mws-calendar-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','캘린더 보기');
[['day','오늘'],['week','일주일'],['month','한달']].forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.calendarView=id;b.onclick=()=>{view=id;if(id==='day'||id==='week')anchor=today();try{localStorage.setItem(key,view);}catch(_){}render();};tabs.append(b);});section.prepend(tabs);
const agenda=document.createElement('div');agenda.className='mws-calendar-agenda';grid.after(agenda);
function button(text,fn){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=text;b.onclick=fn;return b;}
function render(){
 const mobile=document.body.dataset.deviceMode==='mobile';section.dataset.mobileCalendarView=view;
 tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.calendarView===view)));
 const monthLabel=document.getElementById('monthLabel');
 if(monthLabel){
  const match=String(monthLabel.textContent||'').match(/(\d{4}).*?(\d{1,2})월/);
  if(match){monthLabel.dataset.mobileYear=match[1];monthLabel.dataset.mobileMonth=`${Number(match[2])}월`;}
 }
 grid.querySelectorAll('.day').forEach(day=>{const n=day.querySelectorAll('.mini-event').length;day.dataset.mobileCount=n?n+'개':'';day.dataset.mobileMore=n>2?`+${n-2}`:'';day.setAttribute('aria-label',day.dataset.date+' 일정 '+n+'개');});
 agenda.replaceChildren();if(!mobile||view==='month')return;
 const start=view==='week'?weekStart(anchor):anchor;
 const end=shift(start,view==='week'?6:0);
 const bar=document.createElement('div');bar.className='mws-agenda-toolbar';
 bar.append(button('이전',()=>{anchor=shift(anchor,view==='week'?-7:-1);render();}),button('오늘로',()=>{anchor=today();render();}),button('다음',()=>{anchor=shift(anchor,view==='week'?7:1);render();}));
 const title=document.createElement('h3');title.textContent=start+(start!==end?' ~ '+end:'');agenda.append(bar,title);
 const events=typeof activeEvents==='function'?activeEvents():[];
 for(let i=0;i<(view==='week'?7:1);i++){
  const date=shift(start,i),day=document.createElement('article');day.className='mws-agenda-day';if(date===today())day.classList.add('is-today');
  const head=document.createElement('div');head.className='space';const h=document.createElement('h3');h.textContent=date.slice(5).replace('-',' / ')+' '+['일','월','화','수','목','금','토'][new Date(date+'T12:00:00Z').getUTCDay()]+'요일';head.append(h,button('추가',()=>{if(typeof openEvent==='function')openEvent(null,date);}));day.append(head);
  const rows=events.filter(e=>e.date===date).sort((a,b)=>String(a.start==='TBD'?'99:99':a.start||'99:99').localeCompare(String(b.start==='TBD'?'99:99':b.start||'99:99')));
  if(!rows.length){const p=document.createElement('p');p.className='muted';p.textContent='등록된 일정이 없습니다.';day.append(p);}
  rows.forEach(e=>{const b=button('',()=>{if(typeof openEvent==='function')openEvent(e.id);});b.className='mws-agenda-event';const time=document.createElement('span');time.textContent=e.restDay?'휴방':e.start==='TBD'||!e.start?'시간 미정':e.start;const label=document.createElement('strong');label.textContent=e.title||'제목 없음';b.append(time,label);day.append(b);});agenda.append(day);
 }
}
grid.addEventListener('click',e=>{if(document.body.dataset.deviceMode!=='mobile'||view!=='month')return;if(e.target.closest('.mini-event'))return;const day=e.target.closest('.day[data-date]');if(!day)return;e.preventDefault();e.stopImmediatePropagation();anchor=day.dataset.date;view='day';render();},true);
grid.addEventListener('keydown',e=>{if(document.body.dataset.deviceMode==='mobile'&&view==='month'&&(e.key==='Enter'||e.key===' ')){const day=e.target.closest('.day[data-date]');if(day){e.preventDefault();day.click();}}});
let scheduled=false;function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render();grid.querySelectorAll('.day').forEach(d=>{if(document.body.dataset.deviceMode==='mobile'){d.tabIndex=0;d.setAttribute('role','button');}else{d.removeAttribute('tabindex');d.removeAttribute('role');}});});}
new MutationObserver(queue).observe(grid,{childList:true,subtree:true});
new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['data-device-mode']});
window.addEventListener('mawang:datachange',queue);queue();
})();

/* v1.3.0 Majoku Castle sidebar: game shortcuts, collapsible list, direct iframe navigation, and legacy records removal. */
(()=>{
'use strict';
const STORAGE_KEY='mws-majoku-subnav-collapsed-v130';
const games=[
 ['drawing','01','그림 맞추기'],
 ['food','02','뭐먹지'],
 ['choseong','03','초성 퀴즈'],
 ['prediction','04','마왕 기록 예측'],
 ['omok','05','마왕과 오목'],
 ['bombing','06','마왕의 폭격을 피해라'],
 ['minority','07','소수결 눈치싸움'],
 ['elevator','08','추락하는 엘리베이터'],
 ['boss','09','마왕 보스 레이드']
];
const mainButton=document.querySelector('.sidebar .nav button[data-tab="gameMajoku"]');
const frame=document.querySelector('#gameMajoku .majoku-castle-frame');
if(!mainButton||!frame||document.getElementById('mwsMajokuSubnavV130'))return;

const style=document.createElement('style');
style.id='mwsMajokuSubnavStyleV130';
style.textContent=`
.sidebar .nav button[data-tab="gameMajoku"]{position:relative;padding-right:34px!important}
.mws-majoku-toggle-v130{position:absolute;right:9px;top:50%;width:22px;height:22px;transform:translateY(-50%);display:grid;place-items:center;border-radius:7px;color:var(--muted);font-size:15px;line-height:1;cursor:pointer;transition:transform .16s,background .16s,color .16s}
.mws-majoku-toggle-v130:hover,.mws-majoku-toggle-v130:focus-visible{background:var(--panel2);color:var(--text);outline:1px solid var(--border)}
.mws-majoku-subnav-v130{display:flex;flex-direction:column;gap:3px;margin:2px 0 6px 34px;padding:5px 0 5px 9px;border-left:1px solid color-mix(in srgb,var(--accent) 40%,var(--border));overflow:hidden;max-height:430px;opacity:1;transition:max-height .18s ease,opacity .14s ease,padding .18s ease,margin .18s ease}
.mws-majoku-subnav-v130.collapsed{max-height:0;opacity:0;padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;pointer-events:none}
.mws-majoku-subnav-v130 button{display:grid!important;grid-template-columns:24px minmax(0,1fr)!important;gap:6px!important;align-items:center!important;width:100%!important;min-height:32px!important;padding:6px 8px!important;border-radius:8px!important;font-size:11px!important;color:var(--muted)!important;text-align:left!important;white-space:normal!important}
.mws-majoku-subnav-v130 button:hover,.mws-majoku-subnav-v130 button.active{background:color-mix(in srgb,var(--accent) 14%,var(--panel2))!important;color:var(--text)!important}
.mws-majoku-no-v130{font-size:9px;font-weight:900;letter-spacing:.08em;color:var(--accent)}
body[data-device-mode="mobile"] .mws-majoku-subnav-v130{margin-left:32px!important;margin-right:4px!important}
body[data-device-mode="mobile"] .mws-majoku-subnav-v130 button{min-height:42px!important;font-size:13px!important;padding:9px 10px!important}
`;
document.head.appendChild(style);

let collapsed=false;
try{collapsed=localStorage.getItem(STORAGE_KEY)==='1'}catch(_){}
let pendingGame='';

const toggle=document.createElement('span');
toggle.className='mws-majoku-toggle-v130';
toggle.setAttribute('role','button');
toggle.setAttribute('tabindex','0');
toggle.setAttribute('aria-label','Majoku Castle 게임 목록 접기 또는 펼치기');
mainButton.appendChild(toggle);

const subnav=document.createElement('div');
subnav.id='mwsMajokuSubnavV130';
subnav.className='mws-majoku-subnav-v130';
subnav.setAttribute('aria-label','Majoku Castle 게임 목록');
for(const [game,no,label] of games){
 const b=document.createElement('button');
 b.type='button';b.dataset.majokuGame=game;
 b.innerHTML=`<span class="mws-majoku-no-v130">${no}</span><span>${label}</span>`;
 subnav.appendChild(b);
}
mainButton.insertAdjacentElement('afterend',subnav);

function renderCollapsed(){
 subnav.classList.toggle('collapsed',collapsed);
 toggle.textContent=collapsed?'›':'⌄';
 toggle.setAttribute('aria-expanded',String(!collapsed));
 toggle.title=collapsed?'게임 목록 펼치기':'게임 목록 접기';
}
function setCollapsed(next){
 collapsed=Boolean(next);renderCollapsed();
 try{localStorage.setItem(STORAGE_KEY,collapsed?'1':'0')}catch(_){}
}
function toggleCollapsed(event){event?.preventDefault?.();event?.stopPropagation?.();setCollapsed(!collapsed)}
toggle.addEventListener('click',toggleCollapsed);
toggle.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){toggleCollapsed(event)}});
renderCollapsed();

function frameDoc(){try{return frame.contentDocument||frame.contentWindow?.document||null}catch(_){return null}}
function cleanLegacyRecords(doc){
 if(!doc)return false;
 const records=doc.querySelector('.records-wrap');
 if(records)records.remove();
 return Boolean(doc.querySelector('#castleHome'));
}
function markActive(game){subnav.querySelectorAll('[data-majoku-game]').forEach(b=>b.classList.toggle('active',b.dataset.majokuGame===game))}
function openInsideFrame(game){
 const doc=frameDoc();if(!doc)return false;
 cleanLegacyRecords(doc);
 const card=doc.querySelector(`[data-game="${game}"]`);
 if(!card)return false;
 card.click();markActive(game);pendingGame='';return true;
}
function requestGame(game){
 pendingGame=game;
 if(!mainButton.classList.contains('active'))mainButton.click();
 window.setMobileDrawer?.(false);
 if(openInsideFrame(game))return;
 [80,220,600,1200].forEach(ms=>setTimeout(()=>{if(pendingGame===game)openInsideFrame(game)},ms));
}
subnav.addEventListener('click',event=>{const b=event.target.closest('[data-majoku-game]');if(!b)return;event.preventDefault();event.stopPropagation();requestGame(b.dataset.majokuGame)});

frame.addEventListener('load',()=>{
 const doc=frameDoc();cleanLegacyRecords(doc);
 if(pendingGame)openInsideFrame(pendingGame);
});
if(frame.contentDocument?.readyState==='complete')cleanLegacyRecords(frameDoc());
else setTimeout(()=>cleanLegacyRecords(frameDoc()),500);
})();

/* v1.3.0 calendar drag layout guard: make the dedicated stability stylesheet active. */
(()=>{
'use strict';
if(document.querySelector('link[data-mws-calendar-drag-fix="1"]'))return;
const link=document.createElement('link');
link.rel='stylesheet';
link.href='assets/calendar-drag-layout-fix.css?v=1.3.0';
link.dataset.mwsCalendarDragFix='1';
document.head.appendChild(link);
})();

/* v1.3.0 final version display guard: older helpers must not overwrite the visible version. */
(()=>{
'use strict';
const LABEL='Mawang Scheduler v 1.3.0';
const BUILD='MWS V 1.3.0';
let applying=false;
function applyVersion(){
 if(applying)return;applying=true;
 try{
  if(document.body&&document.body.dataset.buildVersion!==BUILD)document.body.dataset.buildVersion=BUILD;
  const el=document.getElementById('mwsBuildVersion');
  if(el&&el.textContent!==LABEL)el.textContent=LABEL;
 }finally{applying=false}
}
applyVersion();
queueMicrotask(applyVersion);
setTimeout(applyVersion,0);
const target=document.getElementById('mwsBuildVersion');
if(target)new MutationObserver(applyVersion).observe(target,{childList:true,characterData:true,subtree:true});
if(document.body)new MutationObserver(applyVersion).observe(document.body,{attributes:true,attributeFilter:['data-build-version']});
})();