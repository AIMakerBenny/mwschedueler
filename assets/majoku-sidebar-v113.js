/* Mawang Scheduler v1.1.4 - Majoku Castle persistent game sidebar */
(()=>{
'use strict';
if(window.__mwsMajokuSidebarV114)return;
window.__mwsMajokuSidebarV114=1;

const STORAGE_KEY='mwsMajokuSidebarCollapsed';
const games=[
  ['drawing','01','그림 맞추기','drawingGame'],
  ['food','02','뭐먹지','foodGame'],
  ['choseong','03','초성 퀴즈','choseongGame'],
  ['prediction','04','마왕 기록 예측','predictionGame'],
  ['omok','05','마왕과 오목','omokGame'],
  ['bombing','06','마왕의 폭격을 피해라','bombingGame'],
  ['minority','07','소수결 눈치싸움','minorityGame'],
  ['elevator','08','추락하는 엘리베이터','elevatorGame'],
  ['boss','09','마왕 보스 레이드','bossGame']
];

function installStyle(){
  if(document.getElementById('mwsMajokuSidebarStyleV114'))return;
  const style=document.createElement('style');
  style.id='mwsMajokuSidebarStyleV114';
  style.textContent=`
.sidebar{position:sticky!important;top:0;height:100vh;transition:width .18s ease,padding .18s ease}
.sidebar .nav.mws-majoku-game-nav{display:flex!important;flex-direction:column!important;gap:5px!important;overflow:auto!important;max-height:calc(100vh - 104px)!important;padding-right:3px!important}
.sidebar .nav.mws-majoku-game-nav button[data-castle-game-target]{display:grid!important;grid-template-columns:30px minmax(0,1fr)!important;align-items:center!important;gap:9px!important;width:100%!important;padding:11px 10px!important;border:1px solid transparent!important;border-radius:10px!important;background:transparent!important;color:var(--muted)!important;text-align:left!important}
.sidebar .nav.mws-majoku-game-nav button[data-castle-game-target]:hover{background:color-mix(in srgb,var(--panel2) 72%,transparent)!important;color:var(--text)!important}
.sidebar .nav.mws-majoku-game-nav button[data-castle-game-target].active{border-color:color-mix(in srgb,var(--accent) 50%,var(--border))!important;background:color-mix(in srgb,var(--accent) 15%,var(--panel2))!important;color:var(--text)!important}
.mws-majoku-nav-no{font-size:10px;font-weight:950;letter-spacing:.08em;color:var(--accent);text-align:center}
.mws-majoku-nav-name{min-width:0;font-size:12px;font-weight:850;line-height:1.3;white-space:normal;word-break:keep-all}
.mws-majoku-sidebar-toggle{position:absolute;top:12px;right:8px;z-index:30;width:32px;height:32px;padding:0;border:1px solid var(--border);border-radius:9px;background:var(--panel);color:var(--text);display:grid;place-items:center;font-size:23px;font-weight:900;line-height:1;box-shadow:0 5px 16px rgba(0,0,0,.22)}
.mws-majoku-sidebar-toggle:hover{background:var(--panel2);border-color:var(--accent)}
.sidebar>.logo{padding-right:36px}
body.mws-majoku-sidebar-collapsed .app{grid-template-columns:50px minmax(0,1fr)!important}
body.mws-majoku-sidebar-collapsed .sidebar{padding:10px 8px!important;overflow:visible!important}
body.mws-majoku-sidebar-collapsed .sidebar>.logo,body.mws-majoku-sidebar-collapsed .sidebar .nav.mws-majoku-game-nav{display:none!important}
body.mws-majoku-sidebar-collapsed .mws-majoku-sidebar-toggle{position:sticky;top:10px;right:auto;margin:0 auto;width:32px;height:32px}
.records-wrap,.records-btn{display:none!important}
@media(max-width:760px){
  .sidebar .nav.mws-majoku-game-nav{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;max-height:none!important}
  .sidebar .nav.mws-majoku-game-nav button[data-castle-game-target]{grid-template-columns:1fr!important;text-align:center!important;gap:2px!important}
  .mws-majoku-nav-name{font-size:10px}
  body.mws-majoku-sidebar-collapsed .app{grid-template-columns:1fr!important}
  body.mws-majoku-sidebar-collapsed .sidebar{height:48px!important;min-height:48px!important;padding:8px!important}
}
`;
  document.head.appendChild(style);
}

function activeGameId(){
  for(const [id,,,sectionId] of games){
    if(document.getElementById(sectionId)?.classList.contains('active'))return id;
  }
  return '';
}

function setActive(gameId=activeGameId()){
  document.querySelectorAll('[data-castle-game-target]').forEach(button=>button.classList.toggle('active',button.dataset.castleGameTarget===gameId));
}

function openGame(gameId){
  const card=document.querySelector(`.game-card.live[data-game="${CSS.escape(gameId)}"]`);
  if(card){card.click();requestAnimationFrame(()=>setActive(gameId));return}
  const item=games.find(row=>row[0]===gameId);
  if(!item)return;
  document.querySelectorAll('main .section').forEach(section=>section.classList.remove('active'));
  document.getElementById(item[3])?.classList.add('active');
  setActive(gameId);
}

function installNav(){
  const nav=document.querySelector('.sidebar .nav');
  if(!nav)return false;
  nav.classList.add('mws-majoku-game-nav');
  const signature='drawing,food,choseong,prediction,omok,bombing,minority,elevator,boss';
  if(nav.dataset.mwsGameSignature!==signature){
    nav.dataset.mwsGameSignature=signature;
    nav.innerHTML=games.map(([id,no,name])=>`<button type="button" data-castle-game-target="${id}" title="${name}"><span class="mws-majoku-nav-no">${no}</span><span class="mws-majoku-nav-name">${name}</span></button>`).join('');
    nav.querySelectorAll('[data-castle-game-target]').forEach(button=>button.addEventListener('click',()=>openGame(button.dataset.castleGameTarget)));
  }
  setActive();
  return true;
}

function applyCollapsed(collapsed,persist=true){
  document.body.classList.toggle('mws-majoku-sidebar-collapsed',collapsed);
  const toggle=document.getElementById('mwsMajokuSidebarToggle');
  if(toggle){
    toggle.textContent=collapsed?'›':'‹';
    toggle.title=collapsed?'세부 카테고리 펼치기':'세부 카테고리 숨기기';
    toggle.setAttribute('aria-label',toggle.title);
    toggle.setAttribute('aria-expanded',String(!collapsed));
  }
  if(persist){try{localStorage.setItem(STORAGE_KEY,collapsed?'1':'0')}catch(_){}}
}

function installToggle(){
  const sidebar=document.querySelector('.sidebar');
  if(!sidebar)return false;
  let toggle=document.getElementById('mwsMajokuSidebarToggle');
  if(!toggle){
    toggle=document.createElement('button');toggle.type='button';toggle.id='mwsMajokuSidebarToggle';toggle.className='mws-majoku-sidebar-toggle';sidebar.appendChild(toggle);
    toggle.addEventListener('click',()=>applyCollapsed(!document.body.classList.contains('mws-majoku-sidebar-collapsed')));
  }
  let collapsed=false;try{collapsed=localStorage.getItem(STORAGE_KEY)==='1'}catch(_){}
  applyCollapsed(collapsed,false);
  return true;
}

function removeRecordsRoom(){document.querySelectorAll('.records-wrap,.records-btn').forEach(node=>node.remove())}

function sync(){
  installNav();
  installToggle();
  removeRecordsRoom();
  setActive();
}

function boot(){
  installStyle();
  sync();
  const target=document.body||document.documentElement;
  if(target)new MutationObserver(()=>requestAnimationFrame(sync)).observe(target,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  setInterval(sync,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
