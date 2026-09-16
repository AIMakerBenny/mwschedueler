/* Mawang Scheduler Steam game integration v1.1.1 */
(()=>{
'use strict';
if(window.__mwsSteamGameV111)return;
window.__mwsSteamGameV111=1;

const $=id=>document.getElementById(id);
const getData=()=>{try{return data}catch(_){return window.data||null}};
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const appIdOf=game=>String(game?.appid??game?.appId??'').trim();
const steamUrl=id=>`https://store.steampowered.com/app/${encodeURIComponent(id)}/`;
let activeEventId='';
let selectedGame=null;
let searchAbort=null;
let searchTimer=null;
let scanTimer=null;

function eventById(id){return getData()?.events?.find(event=>String(event?.id||'')===String(id||''))||null}
function normalizeGame(game){
  const appid=appIdOf(game);
  if(!/^\d{1,12}$/.test(appid))return null;
  const rawImage=String(game?.image||game?.headerImage||'').trim();
  return {
    appid,
    name:String(game?.name||'').trim()||`Steam App ${appid}`,
    image:/^https:\/\//i.test(rawImage)?rawImage:`https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(appid)}/header.jpg`,
    storeUrl:steamUrl(appid),
  };
}
function notice(title,message){
  try{if(typeof toast==='function'){toast(title,message);return}}catch(_){}
  try{alert(message)}catch(_){}
}

function installCss(){
  if($('mwsSteamGameStyleV111'))return;
  const style=document.createElement('style');
  style.id='mwsSteamGameStyleV111';
  style.textContent=`
.steam-game-slot-v110{display:none!important}
.mini-event.mws-steam-host-v111{position:relative!important;padding-right:48px!important;overflow:hidden!important}
.mini-event>.mws-steam-slot-v111{position:absolute!important;right:3px!important;top:3px!important;bottom:3px!important;width:40px!important;min-width:40px!important;height:auto!important;margin:0!important;padding:0!important;border:1px solid color-mix(in srgb,var(--accent) 68%,var(--border))!important;border-radius:7px!important;background:color-mix(in srgb,var(--panel) 86%,#000)!important;color:var(--text)!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:30!important;font-size:22px!important;font-weight:1000!important;line-height:1!important;overflow:hidden!important;cursor:pointer!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 4px 12px rgba(0,0,0,.24)!important}
.mini-event>.mws-steam-slot-v111:hover{border-color:var(--accent)!important;background:color-mix(in srgb,var(--accent) 23%,var(--panel))!important}
.mini-event>.mws-steam-slot-v111 img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
.dashboard-upcoming-card.mws-steam-host-v111{position:relative!important;padding-right:54px!important}
.dashboard-upcoming-card>.mws-steam-slot-v111{position:absolute!important;right:7px!important;top:7px!important;bottom:7px!important;width:40px!important;min-width:40px!important;padding:0!important;border:1px solid color-mix(in srgb,var(--accent) 68%,var(--border))!important;border-radius:8px!important;background:var(--input)!important;color:var(--text)!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:30!important;font-size:22px!important;font-weight:1000!important;overflow:hidden!important;cursor:pointer!important}
.dashboard-upcoming-card>.mws-steam-slot-v111 img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
#mwsSteamModalV111{position:fixed;inset:0;z-index:20000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(2,4,10,.82);backdrop-filter:blur(8px)}
#mwsSteamModalV111.open{display:flex}
.mws-steam-modal-v111{width:min(1080px,96vw);max-height:min(800px,92vh);display:flex;flex-direction:column;overflow:hidden;border:1px solid color-mix(in srgb,var(--accent) 60%,var(--border));border-radius:20px;background:color-mix(in srgb,var(--sidebar) 97%,#000);box-shadow:0 32px 100px rgba(0,0,0,.66)}
.mws-steam-head-v111{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid var(--border)}
.mws-steam-title-v111{font-size:22px;font-weight:1000}.mws-steam-sub-v111{margin-top:4px;font-size:11px;color:var(--muted)}
.mws-steam-body-v111{display:grid;grid-template-columns:minmax(300px,.9fr) minmax(440px,1.35fr);min-height:500px;overflow:hidden}
.mws-steam-left-v111{display:flex;flex-direction:column;min-width:0;padding:20px;border-right:1px solid var(--border);background:color-mix(in srgb,var(--panel) 58%,transparent)}
.mws-steam-right-v111{display:flex;flex-direction:column;min-width:0;padding:20px;overflow:hidden}
.mws-steam-kicker-v111{margin-bottom:10px;font-size:10px;font-weight:950;letter-spacing:.14em;color:var(--muted)}
.mws-steam-preview-v111{flex:1;min-height:350px;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border);border-radius:16px;background:var(--input)}
.mws-steam-preview-v111.has-game{border-color:color-mix(in srgb,var(--accent) 62%,var(--border))}
.mws-steam-preview-v111 img{width:100%;aspect-ratio:460/215;object-fit:cover;background:#080b12}
.mws-steam-preview-copy-v111{padding:17px}.mws-steam-preview-name-v111{font-size:21px;font-weight:1000;line-height:1.3}.mws-steam-preview-app-v111{margin-top:6px;font-size:10px;color:var(--muted)}
.mws-steam-preview-empty-v111{flex:1;display:grid;place-items:center;padding:28px;text-align:center;color:var(--muted);font-size:12px;line-height:1.7}.mws-steam-preview-plus-v111{margin-bottom:12px;font-size:50px;line-height:1;color:var(--accent)}
.mws-steam-preview-actions-v111{display:flex;gap:8px;margin-top:14px}.mws-steam-preview-actions-v111 button{flex:1}
.mws-steam-search-row-v111{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.mws-steam-search-row-v111 input{width:100%;min-width:0}
.mws-steam-search-status-v111{min-height:24px;padding-top:7px;font-size:10px;color:var(--muted)}
.mws-steam-results-v111{display:flex;flex-direction:column;gap:8px;overflow:auto;padding-right:4px;margin-top:5px}
.mws-steam-result-v111{width:100%;display:grid;grid-template-columns:132px minmax(0,1fr) auto;gap:11px;align-items:center;padding:8px;border:1px solid var(--border);border-radius:12px;background:var(--input);color:var(--text);text-align:left;cursor:pointer}
.mws-steam-result-v111:hover,.mws-steam-result-v111.selected{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 9%,var(--input))}
.mws-steam-result-v111 img{width:132px;height:62px;object-fit:cover;border-radius:8px;background:#080b12}.mws-steam-result-v111 strong{display:block;font-size:13px}.mws-steam-result-v111 small{display:block;margin-top:4px;font-size:9px;color:var(--muted)}.mws-steam-result-v111 .pick{font-size:11px;font-weight:950;color:var(--accent)}
.mws-steam-empty-v111{padding:24px;border:1px dashed var(--border);border-radius:12px;text-align:center;color:var(--muted);font-size:11px;line-height:1.6}
.mws-steam-foot-v111{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 20px;border-top:1px solid var(--border)}.mws-steam-foot-note-v111{font-size:10px;color:var(--muted)}.mws-steam-foot-actions-v111{display:flex;gap:8px}
@media(max-width:820px){.mws-steam-body-v111{grid-template-columns:1fr;overflow:auto}.mws-steam-left-v111{border-right:0;border-bottom:1px solid var(--border)}.mws-steam-preview-v111{min-height:0}.mws-steam-right-v111{min-height:420px}.mws-steam-result-v111{grid-template-columns:96px minmax(0,1fr)}.mws-steam-result-v111 img{width:96px;height:46px}.mws-steam-result-v111 .pick{display:none}}
`;
  document.head.appendChild(style);
}

function ensureModal(){
  let modal=$('mwsSteamModalV111');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='mwsSteamModalV111';
  modal.innerHTML=`<div class="mws-steam-modal-v111" role="dialog" aria-modal="true" aria-labelledby="mwsSteamTitleV111">
    <div class="mws-steam-head-v111"><div><div id="mwsSteamTitleV111" class="mws-steam-title-v111">Steam 게임 연결</div><div id="mwsSteamEventV111" class="mws-steam-sub-v111"></div></div><button type="button" class="ghost" id="mwsSteamCloseV111">닫기</button></div>
    <div class="mws-steam-body-v111">
      <section class="mws-steam-left-v111"><div class="mws-steam-kicker-v111">CURRENT GAME</div><div id="mwsSteamPreviewV111" class="mws-steam-preview-v111"></div></section>
      <section class="mws-steam-right-v111"><div class="mws-steam-kicker-v111">STEAM SEARCH</div><div class="mws-steam-search-row-v111"><input id="mwsSteamSearchV111" autocomplete="off" placeholder="Steam 게임 이름 검색"><button type="button" class="primary" id="mwsSteamSearchBtnV111">검색</button></div><div id="mwsSteamStatusV111" class="mws-steam-search-status-v111">오른쪽에서 게임을 검색해 선택하세요.</div><div id="mwsSteamResultsV111" class="mws-steam-results-v111"><div class="mws-steam-empty-v111">검색 결과가 여기에 표시됩니다.</div></div></section>
    </div>
    <div class="mws-steam-foot-v111"><div class="mws-steam-foot-note-v111">선택한 게임은 현재 컨텐츠에 저장됩니다.</div><div class="mws-steam-foot-actions-v111"><button type="button" class="secondary" id="mwsSteamRemoveV111">게임 연결 해제</button><button type="button" class="primary" id="mwsSteamApplyV111">적용</button></div></div>
  </div>`;
  document.body.appendChild(modal);
  $('mwsSteamCloseV111').onclick=closeModal;
  modal.addEventListener('pointerdown',event=>{if(event.target===modal)closeModal()});
  const input=$('mwsSteamSearchV111');
  input.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>searchSteam(input.value),300)});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();clearTimeout(searchTimer);searchSteam(input.value)}else if(event.key==='Escape')closeModal()});
  $('mwsSteamSearchBtnV111').onclick=()=>searchSteam(input.value);
  $('mwsSteamRemoveV111').onclick=()=>{selectedGame=null;renderPreview();markSelectedResult()};
  $('mwsSteamApplyV111').onclick=applySelection;
  return modal;
}

function renderPreview(){
  const box=$('mwsSteamPreviewV111');if(!box)return;
  const game=normalizeGame(selectedGame);
  if(!game){
    box.className='mws-steam-preview-v111';
    box.innerHTML='<div class="mws-steam-preview-empty-v111"><div><div class="mws-steam-preview-plus-v111">+</div><div>연결된 Steam 게임이 없습니다.</div><div style="margin-top:6px">오른쪽 검색창에서 게임을 선택하세요.</div></div></div>';
    return;
  }
  box.className='mws-steam-preview-v111 has-game';
  box.innerHTML=`<img src="${esc(game.image)}" alt="${esc(game.name)}"><div class="mws-steam-preview-copy-v111"><div class="mws-steam-preview-name-v111">${esc(game.name)}</div><div class="mws-steam-preview-app-v111">Steam App ${esc(game.appid)}</div><div class="mws-steam-preview-actions-v111"><button type="button" class="secondary" id="mwsSteamOpenStoreV111">Steam 페이지 열기</button></div></div>`;
  $('mwsSteamOpenStoreV111').onclick=()=>window.open(game.storeUrl,'_blank','noopener,noreferrer');
}
function markSelectedResult(){
  const game=normalizeGame(selectedGame);
  document.querySelectorAll('#mwsSteamResultsV111 .mws-steam-result-v111').forEach(node=>node.classList.toggle('selected',!!game&&node.dataset.appid===game.appid));
}
function renderResults(items,message=''){
  const box=$('mwsSteamResultsV111'),status=$('mwsSteamStatusV111');if(!box)return;
  if(message){if(status)status.textContent=message;box.innerHTML=`<div class="mws-steam-empty-v111">${esc(message)}</div>`;return}
  const games=(Array.isArray(items)?items:[]).map(normalizeGame).filter(Boolean);
  if(status)status.textContent=games.length?`${games.length}개 검색 결과`:'검색 결과 없음';
  if(!games.length){box.innerHTML='<div class="mws-steam-empty-v111">검색 결과가 없습니다.</div>';return}
  box.innerHTML=games.map(game=>`<button type="button" class="mws-steam-result-v111" data-appid="${esc(game.appid)}"><img src="${esc(game.image)}" alt="" loading="lazy"><span><strong>${esc(game.name)}</strong><small>Steam App ${esc(game.appid)}</small></span><span class="pick">선택</span></button>`).join('');
  box.querySelectorAll('[data-appid]').forEach(button=>button.onclick=()=>{const game=games.find(item=>item.appid===button.dataset.appid);if(!game)return;selectedGame=game;renderPreview();markSelectedResult()});
  markSelectedResult();
}
async function searchSteam(query){
  const q=String(query||'').trim();
  if(q.length<2){renderResults([],'게임 이름을 2글자 이상 입력하세요.');return}
  if(searchAbort)searchAbort.abort();
  searchAbort=new AbortController();
  renderResults([],'Steam에서 검색 중...');
  try{
    const response=await fetch(`/api/steam/search?q=${encodeURIComponent(q)}`,{headers:{accept:'application/json'},signal:searchAbort.signal,cache:'no-store'});
    const body=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(body?.error||`HTTP ${response.status}`);
    renderResults(body?.results||[]);
  }catch(error){
    if(error?.name==='AbortError')return;
    console.error('Steam search failed',error);
    renderResults([],'Steam 검색에 실패했습니다. 다시 시도해 주세요.');
  }
}

function openModal(eventId){
  const event=eventById(eventId);
  if(!event||event.restDay)return;
  activeEventId=String(eventId);
  selectedGame=normalizeGame(event.steamGame);
  const modal=ensureModal();
  $('mwsSteamEventV111').textContent=event.title?`컨텐츠: ${event.title}`:'현재 컨텐츠';
  $('mwsSteamSearchV111').value='';
  $('mwsSteamStatusV111').textContent='Steam에서 게임을 검색해 선택하세요.';
  $('mwsSteamResultsV111').innerHTML='<div class="mws-steam-empty-v111">검색 결과가 여기에 표시됩니다.</div>';
  renderPreview();
  modal.classList.add('open');
  setTimeout(()=>$('mwsSteamSearchV111')?.focus(),0);
}
function closeModal(){
  if(searchAbort)searchAbort.abort();
  clearTimeout(searchTimer);
  $('mwsSteamModalV111')?.classList.remove('open');
  activeEventId='';
}
function applySelection(){
  const event=eventById(activeEventId);
  if(!event){closeModal();return}
  const game=normalizeGame(selectedGame);
  if(game)event.steamGame={appid:game.appid,name:game.name,image:game.image,storeUrl:game.storeUrl};
  else delete event.steamGame;
  try{
    const result=typeof saveData==='function'?saveData(game?'Steam 게임 연결':'Steam 게임 연결 해제'):null;
    if(result&&typeof result.catch==='function')result.catch(error=>console.error('Steam save failed',error));
  }catch(error){console.error('Steam save failed',error);notice('Steam 게임','저장 중 오류가 발생했습니다.');return}
  closeModal();
  try{if(typeof renderCalendar==='function')renderCalendar()}catch(_){}
  try{if(typeof renderDashboard==='function')renderDashboard()}catch(_){}
  scheduleScan();
  notice('Steam 게임',game?`${game.name} 게임을 연결했습니다.`:'게임 연결을 해제했습니다.');
}
window.openSteamGamePickerV111=openModal;

function ensureSlot(host,eventId){
  if(!host)return;
  const event=eventById(eventId);
  if(!event||event.restDay)return;
  host.classList.add('mws-steam-host-v111');
  let button=host.querySelector(':scope > .mws-steam-slot-v111');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='mws-steam-slot-v111';
    button.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation()});
    button.addEventListener('mousedown',ev=>{ev.preventDefault();ev.stopPropagation()});
    button.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openModal(button.dataset.eventId)});
    host.appendChild(button);
  }
  button.dataset.eventId=String(eventId);
  const game=normalizeGame(event.steamGame);
  button.classList.toggle('linked',!!game);
  button.setAttribute('aria-label',game?`${game.name} 게임 수정`:'Steam 게임 추가');
  button.title=game?`${game.name} - 게임 수정`:'Steam 게임 추가';
  button.innerHTML=game?`<img src="${esc(game.image)}" alt="">`:'+';
}
function scan(){
  scanTimer=null;
  const current=getData();
  if(!current?.events)return;
  document.querySelectorAll('.mini-event[data-evid]').forEach(node=>ensureSlot(node,node.dataset.evid));
  document.querySelectorAll('#upcomingDashboard .dashboard-upcoming-card[data-event-id]').forEach(node=>ensureSlot(node,node.dataset.eventId));
}
function scheduleScan(){if(scanTimer)return;scanTimer=setTimeout(scan,0)}
function boot(){
  installCss();
  ensureModal();
  scheduleScan();
  const target=document.body||document.documentElement;
  if(target&&!target.__mwsSteamObserverV111){
    target.__mwsSteamObserverV111=1;
    new MutationObserver(scheduleScan).observe(target,{childList:true,subtree:true});
  }
  setInterval(scan,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
