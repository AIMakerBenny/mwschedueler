/* Mawang Scheduler v1.2.0 - Majoku Castle simplified game sidebar */
(()=>{
'use strict';
if(window.__mwsMajokuSidebarV120)return;
window.__mwsMajokuSidebarV120=1;

const games=[
  ['drawing','그림 맞추기','drawingGame'],
  ['food','뭐먹지','foodGame'],
  ['choseong','초성 퀴즈','choseongGame'],
  ['prediction','마왕 기록 예측','predictionGame'],
  ['omok','마왕과 오목','omokGame'],
  ['bombing','마왕의 폭격을 피해라','bombingGame'],
  ['minority','소수결 눈치싸움','minorityGame'],
  ['elevator','추락하는 엘리베이터','elevatorGame'],
  ['boss','마왕 보스 레이드','bossGame']
];

function installStyle(){
  if(document.getElementById('mwsMajokuSidebarStyleV120'))return;
  const style=document.createElement('style');style.id='mwsMajokuSidebarStyleV120';style.textContent=`
.sidebar{position:sticky!important;top:0;height:100vh!important}
.sidebar .nav.mws-majoku-game-nav{display:flex!important;flex-direction:column!important;gap:5px!important;overflow:auto!important;max-height:calc(100vh - 104px)!important;padding-right:3px!important}
.sidebar .nav.mws-majoku-game-nav button[data-castle-game-target]{display:block!important;width:100%!important;padding:11px 10px!important;border:1px solid transparent!important;border-radius:10px!important;background:transparent!important;color:var(--muted)!important;text-align:left!important}
.sidebar .nav.mws-majoku-game-nav button[data-castle-game-target]:hover{background:color-mix(in srgb,var(--panel2) 72%,transparent)!important;color:var(--text)!important}
.sidebar .nav.mws-majoku-game-nav button[data-castle-game-target].active{border-color:color-mix(in srgb,var(--accent) 50%,var(--border))!important;background:color-mix(in srgb,var(--accent) 15%,var(--panel2))!important;color:var(--text)!important}
.mws-majoku-nav-name{display:block;min-width:0;font-size:12px;font-weight:850;line-height:1.3;white-space:normal;word-break:keep-all}
.mws-majoku-sidebar-toggle{display:none!important}.sidebar>.logo{padding-right:0!important}.records-wrap,.records-btn{display:none!important}
@media(max-width:760px){.sidebar .nav.mws-majoku-game-nav{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;max-height:none!important}.sidebar .nav.mws-majoku-game-nav button[data-castle-game-target]{text-align:center!important}.mws-majoku-nav-name{font-size:10px}}
`;document.head.appendChild(style);
}
function activeGameId(){for(const [id,,sectionId] of games){if(document.getElementById(sectionId)?.classList.contains('active'))return id}return''}
function setActive(gameId=activeGameId()){document.querySelectorAll('[data-castle-game-target]').forEach(button=>button.classList.toggle('active',button.dataset.castleGameTarget===gameId))}
function openGame(gameId){
  const card=document.querySelector(`.game-card.live[data-game="${CSS.escape(gameId)}"]`);
  if(card){card.click();requestAnimationFrame(()=>setActive(gameId));return}
  const item=games.find(row=>row[0]===gameId);if(!item)return;
  document.querySelectorAll('main .section').forEach(section=>section.classList.remove('active'));
  document.getElementById(item[2])?.classList.add('active');setActive(gameId);
}
function installNav(){
  const nav=document.querySelector('.sidebar .nav');if(!nav)return false;
  nav.classList.add('mws-majoku-game-nav');
  nav.innerHTML=games.map(([id,name])=>`<button type="button" data-castle-game-target="${id}" title="${name}"><span class="mws-majoku-nav-name">${name}</span></button>`).join('');
  nav.querySelectorAll('[data-castle-game-target]').forEach(button=>button.addEventListener('click',()=>openGame(button.dataset.castleGameTarget)));
  setActive();return true;
}
function removeLegacy(){
  document.body.classList.remove('mws-majoku-sidebar-collapsed');
  document.getElementById('mwsMajokuSidebarToggle')?.remove();
  document.querySelectorAll('.mws-majoku-sidebar-toggle,.records-wrap,.records-btn').forEach(node=>node.remove());
  try{localStorage.removeItem('mwsMajokuSidebarCollapsed')}catch(_){}
}
function boot(){
  installStyle();removeLegacy();
  let tries=0;
  const tryInstall=()=>{tries++;if(installNav()||tries>=20)return;setTimeout(tryInstall,150)};
  tryInstall();
  document.addEventListener('click',event=>{const card=event.target?.closest?.('.game-card.live[data-game]');if(card)requestAnimationFrame(()=>setActive(card.dataset.game))},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
