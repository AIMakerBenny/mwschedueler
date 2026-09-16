/* Mawang Scheduler v1.1.0 - Majoku Castle game sidebar */
(()=>{
'use strict';
if(window.__mwsMajokuSidebarV110)return;
window.__mwsMajokuSidebarV110=1;

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
  if(document.getElementById('mwsMajokuSidebarStyleV110'))return;
  const style=document.createElement('style');
  style.id='mwsMajokuSidebarStyleV110';
  style.textContent=`
.sidebar .nav.mws-majoku-game-nav{gap:4px;overflow:auto;max-height:calc(100vh - 96px);padding-right:2px}
.sidebar .nav.mws-majoku-game-nav button{display:grid;grid-template-columns:28px minmax(0,1fr);align-items:center;gap:8px;width:100%;padding:9px 10px;border:1px solid transparent;border-radius:9px}
.sidebar .nav.mws-majoku-game-nav button:hover{background:color-mix(in srgb,var(--panel2) 72%,transparent);color:var(--text)}
.sidebar .nav.mws-majoku-game-nav button.active{border-color:color-mix(in srgb,var(--accent) 45%,var(--border));background:color-mix(in srgb,var(--accent) 14%,var(--panel2));color:var(--text)}
.mws-majoku-nav-no{font-size:9px;font-weight:950;letter-spacing:.08em;color:var(--accent);text-align:center}
.mws-majoku-nav-name{min-width:0;font-size:11px;font-weight:850;line-height:1.25;white-space:normal;word-break:keep-all}
@media(max-width:760px){.sidebar .nav.mws-majoku-game-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));max-height:none}.sidebar .nav.mws-majoku-game-nav button{grid-template-columns:1fr;text-align:center;gap:2px}.mws-majoku-nav-name{font-size:10px}}
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

function installNav(){
  const nav=document.querySelector('.sidebar .nav');
  if(!nav||nav.classList.contains('mws-majoku-game-nav'))return;
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

function boot(){installStyle();installNav()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
