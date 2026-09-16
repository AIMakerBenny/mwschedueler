/* Mawang Scheduler v1.1.0 - Majoku Castle collapsible game sidebar */
(()=>{
'use strict';
if(window.__mwsMajokuSidebarV111)return;
window.__mwsMajokuSidebarV111=1;

const STORAGE_KEY='mwsMajokuSidebarCollapsed';
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

function installStyle(){
  if(document.getElementById('mwsMajokuSidebarStyleV111'))return;
  const style=document.createElement('style');
  style.id='mwsMajokuSidebarStyleV111';
  style.textContent=`
.sidebar{transition:width .18s ease,padding .18s ease}
.sidebar .nav.mws-majoku-game-nav{gap:4px;overflow:auto;max-height:calc(100vh - 96px);padding-right:2px}
.sidebar .nav.mws-majoku-game-nav button[data-castle-game-target]{display:grid;grid-template-columns:28px minmax(0,1fr);align-items:center;gap:8px;width:100%;padding:9px 10px;border:1px solid transparent;border-radius:9px}
.sidebar .nav.mws-majoku-game-nav button[data-castle-game-target]:hover{background:color-mix(in srgb,var(--panel2) 72%,transparent);color:var(--text)}
.sidebar .nav.mws-majoku-game-nav button[data-castle-game-target].active{border-color:color-mix(in srgb,var(--accent) 45%,var(--border));background:color-mix(in srgb,var(--accent) 14%,var(--panel2));color:var(--text)}
.mws-majoku-nav-no{font-size:9px;font-weight:950;letter-spacing:.08em;color:var(--accent);text-align:center}
.mws-majoku-nav-name{min-width:0;font-size:11px;font-weight:850;line-height:1.25;white-space:normal;word-break:keep-all}
.mws-majoku-sidebar-toggle{position:absolute;top:12px;right:8px;z-index:20;width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:9px;background:var(--panel);color:var(--text);display:grid;place-items:center;font-size:22px;font-weight:900;line-height:1;box-shadow:0 5px 16px rgba(0,0,0,.22);transition:background .15s,border-color .15s,transform .15s}
.mws-majoku-sidebar-toggle:hover{background:var(--panel2);border-color:var(--accent)}
.sidebar>.logo{padding-right:34px}
body.mws-majoku-sidebar-collapsed .app{grid-template-columns:48px minmax(0,1fr)}
body.mws-majoku-sidebar-collapsed .sidebar{padding:10px 8px;overflow:visible}
body.mws-majoku-sidebar-collapsed .sidebar>.logo{display:none}
body.mws-majoku-sidebar-collapsed .sidebar .nav.mws-majoku-game-nav{display:none}
body.mws-majoku-sidebar-collapsed .mws-majoku-sidebar-toggle{position:sticky;top:10px;right:auto;margin:0 auto;width:32px;height:32px}
@media(max-width:760px){
  .sidebar .nav.mws-majoku-game-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));max-height:none}
  .sidebar .nav.mws-majoku-game-nav button[data-castle-game-target]{grid-template-columns:1fr;text-align:center;gap:2px}
  .mws-majoku-nav-name{font-size:10px}
  body.mws-majoku-sidebar-collapsed .app{grid-template-columns:1fr}
  body.mws-majoku-sidebar-collapsed .sidebar{height:48px;min-height:48px;padding:8px;border-bottom:1px solid var(--border)}
  body.mws-majoku-sidebar-collapsed .mws-majoku-sidebar-toggle{position:absolute;top:8px;left:8px;margin:0}
}
`;
  document.head.appendChild(style);
}

function setActive(gameId){
  document.querySelectorAll('.mws-majoku-game-nav [data-castle-game-target]').forEach(button=>{
    button.classList.toggle('active',button.dataset.castleGameTarget===gameId);
  });
}

function openGame(gameId){
  const card=document.querySelector(`.game-card.live[data-game="${CSS.escape(gameId)}"]`);
  if(!card)return;
  setActive(gameId);
  card.click();
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
  if(persist){
    try{localStorage.setItem(STORAGE_KEY,collapsed?'1':'0')}catch(_){ }
  }
}

function installToggle(){
  const sidebar=document.querySelector('.sidebar');
  if(!sidebar)return;
  let toggle=document.getElementById('mwsMajokuSidebarToggle');
  if(!toggle){
    toggle=document.createElement('button');
    toggle.type='button';
    toggle.id='mwsMajokuSidebarToggle';
    toggle.className='mws-majoku-sidebar-toggle';
    sidebar.appendChild(toggle);
    toggle.addEventListener('click',()=>applyCollapsed(!document.body.classList.contains('mws-majoku-sidebar-collapsed')));
  }
  let collapsed=false;
  try{collapsed=localStorage.getItem(STORAGE_KEY)==='1'}catch(_){ }
  applyCollapsed(collapsed,false);
}

function installNav(){
  const nav=document.querySelector('.sidebar .nav');
  if(!nav)return;
  nav.classList.add('mws-majoku-game-nav');
  nav.innerHTML=games.map(([id,no,name])=>`<button type="button" data-castle-game-target="${id}" title="${name}"><span class="mws-majoku-nav-no">${no}</span><span class="mws-majoku-nav-name">${name}</span></button>`).join('');
  nav.querySelectorAll('[data-castle-game-target]').forEach(button=>{
    button.addEventListener('click',()=>openGame(button.dataset.castleGameTarget));
  });

  document.querySelectorAll('.game-card.live[data-game]').forEach(card=>{
    card.addEventListener('click',()=>setActive(card.dataset.game));
  });
  [
    'backCastleBtn','backCastleFoodBtn','backCastleChoseongBtn','backCastlePredictionBtn',
    'backCastleOmokBtn','backCastleBombingBtn','backCastleMinorityBtn','backCastleElevatorBtn','backCastleBossBtn'
  ].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setActive('')));
}

function removeRecordsRoom(){
  document.querySelectorAll('.records-wrap,.records-btn').forEach(el=>el.remove());
}

function boot(){installStyle();installNav();installToggle();removeRecordsRoom()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
