/* Mawang Scheduler Steam game integration v1.1.0 - popup picker */
(()=>{
'use strict';
if(window.__mwsSteamGameV110Popup)return;
window.__mwsSteamGameV110Popup=1;

const $=id=>document.getElementById(id);
const D=()=>{try{return data}catch(_){return null}};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const appIdOf=g=>String(g?.appid??g?.appId??'').trim();
const storeUrl=id=>`https://store.steampowered.com/app/${encodeURIComponent(id)}/`;
let activeEventId='';
let draftGame=null;
let searchTimer=null;
let searchAbort=null;
let augmentTimer=null;

function eventById(id){return D()?.events?.find(e=>String(e?.id||'')===String(id||''))||null}
function safeImage(value,appid){
  const raw=String(value||'').trim();
  if(/^https:\/\//i.test(raw))return raw;
  return appid?`https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(appid)}/header.jpg`:'';
}
function normalizeGame(game){
  const appid=appIdOf(game);
  if(!/^\d{1,12}$/.test(appid))return null;
  return {
    appid,
    name:String(game?.name||'').trim()||`Steam App ${appid}`,
    image:safeImage(game?.image||game?.headerImage,appid),
    storeUrl:storeUrl(appid),
  };
}
function notify(title,msg){
  try{if(typeof toast==='function'){toast(title,msg);return}}catch(_){}
  try{alert(msg)}catch(_){}
}
function openStore(game){const g=normalizeGame(game);if(g)window.open(g.storeUrl,'_blank','noopener,noreferrer')}

function installCss(){
  if($('mwsSteamGameStyleV110'))return;
  const s=document.createElement('style');
  s.id='mwsSteamGameStyleV110';
  s.textContent=`
.mini-event.steam-slot-host-v110{position:relative!important;padding-right:43px!important;overflow:hidden!important}
.mini-event .steam-game-slot-v110{position:absolute;right:3px;top:3px;bottom:3px;width:35px;height:auto;border:1px solid color-mix(in srgb,var(--accent) 55%,var(--border));border-radius:7px;background:color-mix(in srgb,var(--panel) 84%,transparent);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;z-index:7;font-size:20px;font-weight:900;line-height:1;overflow:hidden;box-shadow:0 5px 14px rgba(0,0,0,.22)}
.mini-event .steam-game-slot-v110:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 20%,var(--panel))}
.mini-event .steam-game-slot-v110 img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.9) brightness(.88)}
.mini-event .steam-game-slot-v110.linked:after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 55%,transparent);pointer-events:none}
.dashboard-upcoming-card.steam-slot-host-v110{position:relative!important;padding-right:49px!important}
.dashboard-upcoming-card .steam-game-slot-v110{position:absolute;right:7px;top:7px;bottom:7px;width:36px;border:1px solid color-mix(in srgb,var(--accent) 55%,var(--border));border-radius:8px;background:var(--input);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;z-index:7;font-size:20px;font-weight:900;overflow:hidden}
.dashboard-upcoming-card .steam-game-slot-v110 img{width:100%;height:100%;object-fit:cover;display:block}

#steamGameModalV110{position:fixed;inset:0;z-index:12000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(2,4,10,.78);backdrop-filter:blur(7px)}
#steamGameModalV110.open{display:flex}
.steam-modal-v110{width:min(1040px,95vw);max-height:min(760px,90vh);display:flex;flex-direction:column;border:1px solid color-mix(in srgb,var(--accent) 48%,var(--border));border-radius:20px;background:color-mix(in srgb,var(--sidebar) 97%,#000);box-shadow:0 30px 90px rgba(0,0,0,.62);overflow:hidden}
.steam-modal-head-v110{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:18px 20px;border-bottom:1px solid var(--border)}
.steam-modal-title-v110{font-size:21px;font-weight:950}.steam-modal-sub-v110{font-size:11px;color:var(--muted);margin-top:4px}
.steam-modal-body-v110{display:grid;grid-template-columns:minmax(300px,.9fr) minmax(420px,1.35fr);min-height:470px;overflow:hidden}
.steam-preview-pane-v110{padding:20px;border-right:1px solid var(--border);background:color-mix(in srgb,var(--panel) 56%,transparent);display:flex;flex-direction:column;min-width:0}
.steam-pane-kicker-v110{font-size:10px;letter-spacing:.14em;color:var(--muted);font-weight:900;margin-bottom:10px}
.steam-preview-card-v110{flex:1;min-height:330px;border:1px solid var(--border);border-radius:16px;background:var(--input);overflow:hidden;display:flex;flex-direction:column}
.steam-preview-card-v110.has-game{border-color:color-mix(in srgb,var(--accent) 58%,var(--border))}
.steam-preview-image-v110{width:100%;aspect-ratio:460/215;object-fit:cover;background:#080b12;display:block}
.steam-preview-copy-v110{padding:16px}.steam-preview-name-v110{font-size:20px;font-weight:950;line-height:1.3}.steam-preview-app-v110{font-size:10px;color:var(--muted);margin-top:6px}.steam-preview-empty-v110{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;padding:26px;color:var(--muted);font-size:12px;line-height:1.7}.steam-preview-plus-v110{font-size:46px;color:var(--accent);line-height:1;margin-bottom:12px}
.steam-preview-actions-v110{display:flex;gap:8px;margin-top:12px}.steam-preview-actions-v110 button{flex:1}
.steam-search-pane-v110{padding:20px;display:flex;flex-direction:column;min-width:0;overflow:hidden}
.steam-search-row-v110{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.steam-search-row-v110 input{width:100%;min-width:0}
.steam-search-status-v110{height:22px;padding-top:7px;color:var(--muted);font-size:10px}
.steam-search-results-v110{display:flex;flex-direction:column;gap:7px;overflow:auto;padding-right:4px;margin-top:5px}
.steam-search-result-v110{border:1px solid var(--border);background:var(--input);color:var(--text);border-radius:12px;padding:8px;display:grid;grid-template-columns:128px minmax(0,1fr) auto;gap:11px;align-items:center;text-align:left;width:100%}
.steam-search-result-v110:hover{border-color:var(--accent);background:color-mix(in srgb,var(--input) 90%,var(--accent))}.steam-search-result-v110.selected{border-color:var(--accent);box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 35%,transparent)}
.steam-search-result-v110 img{width:128px;height:60px;object-fit:cover;border-radius:8px;background:#080b12}.steam-search-result-v110 strong{display:block;font-size:13px;line-height:1.35}.steam-search-result-v110 small{display:block;color:var(--muted);font-size:9px;margin-top:4px}.steam-search-result-v110 .pick{font-size:11px;font-weight:900;color:var(--accent)}
.steam-search-empty-v110{border:1px dashed var(--border);border-radius:12px;padding:22px;text-align:center;color:var(--muted);font-size:11px;line-height:1.6}
.steam-modal-foot-v110{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 20px;border-top:1px solid var(--border)}.steam-modal-foot-actions-v110{display:flex;gap:8px}.steam-modal-note-v110{font-size:10px;color:var(--muted)}
@media(max-width:820px){.steam-modal-body-v110{grid-template-columns:1fr;overflow:auto}.steam-preview-pane-v110{border-right:0;border-bottom:1px solid var(--border)}.steam-preview-card-v110{min-height:0}.steam-search-pane-v110{min-height:420px}.steam-search-result-v110{grid-template-columns:92px minmax(0,1fr)}.steam-search-result-v110 img{width:92px;height:45px}.steam-search-result-v110 .pick{display:none}}
`;
  document.head.appendChild(s);
}

function ensureModal(){
  let m=$('steamGameModalV110');
  if(m)return m;
  m=document.createElement('div');
  m.id='steamGameModalV110';
  m.innerHTML=`<div class="steam-modal-v110" role="dialog" aria-modal="true" aria-labelledby="steamGameModalTitleV110">
    <div class="steam-modal-head-v110"><div><div id="steamGameModalTitleV110" class="steam-modal-title-v110">Steam 게임 연결</div><div id="steamEventNameV110" class="steam-modal-sub-v110"></div></div><button type="button" class="ghost" id="steamModalCloseV110">닫기</button></div>
    <div class="steam-modal-body-v110">
      <section class="steam-preview-pane-v110"><div class="steam-pane-kicker-v110">SELECTED GAME</div><div id="steamPreviewV110" class="steam-preview-card-v110"></div></section>
      <section class="steam-search-pane-v110"><div class="steam-pane-kicker-v110">STEAM SEARCH</div><div class="steam-search-row-v110"><input id="steamGameSearchV110" autocomplete="off" placeholder="게임 이름을 입력하세요"><button type="button" class="primary" id="steamSearchBtnV110">검색</button></div><div id="steamSearchStatusV110" class="steam-search-status-v110">Steam에서 게임을 검색해 선택하세요.</div><div id="steamSearchResultsV110" class="steam-search-results-v110"><div class="steam-search-empty-v110">검색 결과가 여기에 표시됩니다.</div></div></section>
    </div>
    <div class="steam-modal-foot-v110"><div class="steam-modal-note-v110">선택한 게임은 이 컨텐츠에만 연결됩니다.</div><div class="steam-modal-foot-actions-v110"><button type="button" class="secondary" id="steamRemoveBtnV110">게임 연결 해제</button><button type="button" class="primary" id="steamApplyBtnV110">적용</button></div></div>
  </div>`;
  document.body.appendChild(m);
  $('steamModalCloseV110').onclick=closeModal;
  m.addEventListener('pointerdown',e=>{if(e.target===m)closeModal()});
  const input=$('steamGameSearchV110');
  input.addEventListener('input',()=>{if(searchTimer)clearTimeout(searchTimer);searchTimer=setTimeout(()=>searchSteam(input.value),320)});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(searchTimer)clearTimeout(searchTimer);searchSteam(input.value)}else if(e.key==='Escape')closeModal()});
  $('steamSearchBtnV110').onclick=()=>searchSteam(input.value);
  $('steamRemoveBtnV110').onclick=()=>{draftGame=null;renderPreview();renderSearchSelection()};
  $('steamApplyBtnV110').onclick=applyGame;
  return m;
}

function renderPreview(){
  const box=$('steamPreviewV110');if(!box)return;
  const g=normalizeGame(draftGame);
  if(!g){
    box.className='steam-preview-card-v110';
    box.innerHTML='<div class="steam-preview-empty-v110"><div><div class="steam-preview-plus-v110">+</div><div>등록된 Steam 게임이 없습니다.</div><div style="margin-top:5px">오른쪽에서 게임을 검색한 뒤 선택하세요.</div></div></div>';
    return;
  }
  box.className='steam-preview-card-v110 has-game';
  box.innerHTML=`<img class="steam-preview-image-v110" src="${esc(g.image)}" alt="${esc(g.name)}"><div class="steam-preview-copy-v110"><div class="steam-preview-name-v110">${esc(g.name)}</div><div class="steam-preview-app-v110">Steam App ${esc(g.appid)}</div><div class="steam-preview-actions-v110"><button type="button" class="secondary" id="steamPreviewOpenV110">Steam 페이지 열기</button></div></div>`;
  $('steamPreviewOpenV110').onclick=()=>openStore(g);
}
function renderSearchSelection(){
  const selected=normalizeGame(draftGame);
  document.querySelectorAll('#steamSearchResultsV110 .steam-search-result-v110').forEach(el=>el.classList.toggle('selected',!!selected&&el.dataset.appid===selected.appid));
}
function renderSearchResults(items,message=''){
  const box=$('steamSearchResultsV110'),status=$('steamSearchStatusV110');if(!box)return;
  if(message){box.innerHTML=`<div class="steam-search-empty-v110">${esc(message)}</div>`;if(status)status.textContent=message;return}
  const list=(items||[]).map(normalizeGame).filter(Boolean);
  if(status)status.textContent=list.length?`${list.length}개 검색 결과`:'검색 결과 없음';
  if(!list.length){box.innerHTML='<div class="steam-search-empty-v110">검색 결과가 없습니다.</div>';return}
  box.innerHTML=list.map(g=>`<button type="button" class="steam-search-result-v110" data-appid="${esc(g.appid)}"><img src="${esc(g.image)}" alt="" loading="lazy"><span><strong>${esc(g.name)}</strong><small>Steam App ${esc(g.appid)}</small></span><span class="pick">선택</span></button>`).join('');
  box.querySelectorAll('[data-appid]').forEach(btn=>btn.onclick=()=>{const g=list.find(x=>x.appid===btn.dataset.appid);if(!g)return;draftGame=g;renderPreview();renderSearchSelection()});
  renderSearchSelection();
}
async function searchSteam(query){
  const q=String(query||'').trim();
  if(q.length<2){renderSearchResults([],'게임 이름을 2글자 이상 입력하세요.');return}
  if(searchAbort)searchAbort.abort();
  searchAbort=new AbortController();
  renderSearchResults([],'Steam에서 검색 중...');
  try{
    const res=await fetch(`/api/steam/search?q=${encodeURIComponent(q)}`,{headers:{accept:'application/json'},signal:searchAbort.signal});
    const body=await res.json().catch(()=>null);
    if(!res.ok)throw new Error(body?.error||`HTTP ${res.status}`);
    renderSearchResults(body?.results||[]);
  }catch(err){
    if(err?.name==='AbortError')return;
    console.error('Steam search failed',err);
    renderSearchResults([],'Steam 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

function openModal(eventId){
  const ev=eventById(eventId);if(!ev||ev.restDay)return;
  activeEventId=String(eventId);
  draftGame=normalizeGame(ev.steamGame);
  const m=ensureModal();
  $('steamEventNameV110').textContent=ev.title?`컨텐츠: ${ev.title}`:'현재 컨텐츠';
  $('steamGameSearchV110').value='';
  $('steamSearchStatusV110').textContent='Steam에서 게임을 검색해 선택하세요.';
  $('steamSearchResultsV110').innerHTML='<div class="steam-search-empty-v110">검색 결과가 여기에 표시됩니다.</div>';
  renderPreview();
  m.classList.add('open');
  setTimeout(()=>$('steamGameSearchV110')?.focus(),0);
}
function closeModal(){
  if(searchAbort)searchAbort.abort();
  if(searchTimer)clearTimeout(searchTimer);
  $('steamGameModalV110')?.classList.remove('open');
  activeEventId='';
}
function applyGame(){
  const ev=eventById(activeEventId);if(!ev)return closeModal();
  const g=normalizeGame(draftGame);
  if(g)ev.steamGame={appid:g.appid,name:g.name,image:g.image,storeUrl:g.storeUrl};
  else delete ev.steamGame;
  try{saveData(g?'Steam 게임 연결':'Steam 게임 연결 해제')}catch(err){console.error(err);notify('Steam 게임','저장 중 오류가 발생했습니다.');return}
  closeModal();
  try{if(typeof renderCalendar==='function')renderCalendar()}catch(_){}
  try{if(typeof renderDashboard==='function')renderDashboard()}catch(_){}
  scheduleAugment();
  notify('Steam 게임',g?`${g.name} 게임을 연결했습니다.`:'게임 연결을 해제했습니다.');
}

function addSlot(host,eventId){
  if(!host||host.querySelector(':scope > .steam-game-slot-v110'))return;
  const ev=eventById(eventId);if(!ev||ev.restDay)return;
  const g=normalizeGame(ev.steamGame);
  host.classList.add('steam-slot-host-v110');
  const b=document.createElement('button');
  b.type='button';
  b.className=`steam-game-slot-v110${g?' linked':''}`;
  b.setAttribute('aria-label',g?`${g.name} 게임 수정`:'Steam 게임 추가');
  b.title=g?`${g.name} - 게임 수정`:'Steam 게임 추가';
  b.innerHTML=g?`<img src="${esc(g.image)}" alt="">`:'+';
  b.addEventListener('pointerdown',e=>e.stopPropagation());
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openModal(eventId)});
  host.appendChild(b);
}
function augmentSchedules(){
  augmentTimer=null;
  document.querySelectorAll('.mini-event[data-evid]').forEach(el=>addSlot(el,el.dataset.evid));
  document.querySelectorAll('#upcomingDashboard .dashboard-upcoming-card[data-event-id]').forEach(el=>addSlot(el,el.dataset.eventId));
}
function scheduleAugment(){if(augmentTimer)return;augmentTimer=setTimeout(augmentSchedules,0)}
function observeSchedules(){
  for(const id of ['calendarGrid','upcomingDashboard']){
    const el=$(id);if(!el||el.__mwsSteamObserverV110)continue;
    el.__mwsSteamObserverV110=1;
    new MutationObserver(scheduleAugment).observe(el,{childList:true,subtree:true});
  }
  scheduleAugment();
}
function boot(){installCss();ensureModal();observeSchedules()}
let attempts=0;
const timer=setInterval(()=>{
  attempts+=1;
  if(D()&&$('calendarGrid')){clearInterval(timer);boot();return}
  if(attempts>300)clearInterval(timer);
},50);
})();
