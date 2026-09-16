/* Mawang Scheduler Steam game integration v1.1.0 */
(()=>{
'use strict';
if(window.__mwsSteamGameV110)return;
window.__mwsSteamGameV110=1;

const $=id=>document.getElementById(id);
const D=()=>{try{return data}catch(_){return null}};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const deepClone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const appIdOf=g=>String(g?.appid??g?.appId??'').trim();
const storeUrl=id=>`https://store.steampowered.com/app/${encodeURIComponent(id)}/`;

let selectedSteamGame=null;
let searchTimer=null;
let searchAbort=null;
let hoverTimer=null;
let closeTimer=null;
let augmentTimer=null;

function currentEditingId(){
  try{return String(editingEventId||'').trim()}catch(_){return ''}
}
function eventById(id){return D()?.events?.find(e=>String(e?.id||'')===String(id||''))||null}
function safeImage(value,appid){
  const raw=String(value||'').trim();
  if(/^https:\/\//i.test(raw))return raw;
  return appid?`https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(appid)}/header.jpg`:'';
}
function normalizeGame(game){
  const appid=appIdOf(game);
  if(!/^\d{1,12}$/.test(appid))return null;
  const name=String(game?.name||'').trim()||`Steam App ${appid}`;
  return {appid,name,image:safeImage(game?.image||game?.headerImage,appid),storeUrl:storeUrl(appid)};
}
function sameGame(a,b){
  const aa=normalizeGame(a),bb=normalizeGame(b);
  if(!aa&&!bb)return true;
  if(!aa||!bb)return false;
  return aa.appid===bb.appid&&aa.name===bb.name&&aa.image===bb.image;
}

function installCss(){
  if($('mwsSteamGameStyleV110'))return;
  const style=document.createElement('style');
  style.id='mwsSteamGameStyleV110';
  style.textContent=`
.steam-game-field-v110{grid-column:1/-1;position:relative}.steam-search-row-v110{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.steam-search-wrap-v110{position:relative}.steam-search-wrap-v110 input{width:100%;padding-right:38px}.steam-search-mark-v110{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:950;letter-spacing:.08em;color:var(--muted);pointer-events:none}.steam-search-results-v110{display:none;position:absolute;z-index:260;left:0;right:0;top:calc(100% + 7px);max-height:360px;overflow:auto;padding:7px;border:1px solid var(--border);border-radius:13px;background:color-mix(in srgb,var(--sidebar) 96%,#000);box-shadow:0 20px 55px rgba(0,0,0,.46)}.steam-search-results-v110.open{display:flex;flex-direction:column;gap:6px}.steam-search-result-v110{border:1px solid var(--border);background:var(--input);color:var(--text);border-radius:10px;padding:7px;display:grid;grid-template-columns:112px minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left}.steam-search-result-v110:hover{border-color:var(--accent);background:color-mix(in srgb,var(--input) 90%,var(--accent))}.steam-search-result-v110 img{width:112px;height:52px;object-fit:cover;border-radius:7px;background:#090b14}.steam-search-result-v110 strong{display:block;font-size:12px;line-height:1.35}.steam-search-result-v110 small{display:block;color:var(--muted);font-size:9px;margin-top:3px}.steam-search-result-v110 .pick{color:var(--accent);font-weight:900;font-size:11px}.steam-search-empty-v110{padding:14px;color:var(--muted);font-size:11px;text-align:center}.steam-selected-v110{margin-top:9px;display:none;grid-template-columns:124px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid color-mix(in srgb,var(--accent) 48%,var(--border));border-radius:12px;padding:8px;background:color-mix(in srgb,var(--accent) 7%,var(--input))}.steam-selected-v110.active{display:grid}.steam-selected-v110 img{width:124px;height:58px;object-fit:cover;border-radius:8px;background:#090b14}.steam-selected-v110 strong{display:block;font-size:13px}.steam-selected-v110 small{display:block;color:var(--muted);font-size:9px;margin-top:4px}.steam-selected-actions-v110{display:flex;gap:6px;align-items:center}.steam-selected-actions-v110 button{white-space:nowrap}.steam-game-help-v110{margin-top:7px;color:var(--muted);font-size:10px;line-height:1.45}
.steam-slot-host-v110{position:relative!important;padding-right:39px!important}.steam-game-slot-v110{position:absolute;right:5px;top:50%;transform:translateY(-50%);z-index:5;width:29px;height:29px;border:1px solid color-mix(in srgb,var(--accent) 46%,var(--border));border-radius:8px;background:color-mix(in srgb,var(--panel) 88%,transparent);color:var(--muted);display:grid;place-items:center;padding:0;font-size:10px;font-weight:950;line-height:1;box-shadow:0 5px 14px rgba(0,0,0,.20)}.steam-game-slot-v110.linked{color:#fff;border-color:color-mix(in srgb,var(--accent) 80%,#fff);background:color-mix(in srgb,var(--accent) 24%,var(--panel))}.steam-game-slot-v110:hover{transform:translateY(-50%) scale(1.05);color:#fff}.dashboard-upcoming-card.steam-slot-host-v110{padding-right:46px!important}.dashboard-upcoming-card .steam-game-slot-v110{right:9px}.steam-popover-v110{position:fixed;z-index:9200;display:none;width:min(330px,calc(100vw - 24px));border:1px solid color-mix(in srgb,var(--accent) 48%,var(--border));border-radius:14px;background:color-mix(in srgb,var(--sidebar) 97%,#000);box-shadow:0 22px 60px rgba(0,0,0,.52);padding:10px}.steam-popover-v110.open{display:block}.steam-popover-v110 img{width:100%;aspect-ratio:460/215;object-fit:cover;border-radius:9px;background:#090b14}.steam-popover-name-v110{font-size:14px;font-weight:900;margin-top:9px;line-height:1.35}.steam-popover-meta-v110{font-size:9px;color:var(--muted);margin-top:4px}.steam-popover-actions-v110{display:flex;gap:7px;margin-top:10px}.steam-popover-actions-v110 button{flex:1}.steam-popover-empty-v110{padding:7px 2px 2px;color:var(--muted);font-size:11px;line-height:1.5}
@media(max-width:720px){.steam-search-result-v110{grid-template-columns:84px minmax(0,1fr)}.steam-search-result-v110 img{width:84px;height:42px}.steam-search-result-v110 .pick{display:none}.steam-selected-v110{grid-template-columns:94px minmax(0,1fr)}.steam-selected-v110 img{width:94px;height:46px}.steam-selected-actions-v110{grid-column:1/-1}.steam-selected-actions-v110 button{flex:1}}
`;
  document.head.appendChild(style);
}

function ensurePopover(){
  let p=$('steamGamePopoverV110');
  if(p)return p;
  p=document.createElement('div');
  p.id='steamGamePopoverV110';
  p.className='steam-popover-v110';
  p.addEventListener('mouseenter',()=>{if(closeTimer)clearTimeout(closeTimer)});
  p.addEventListener('mouseleave',()=>scheduleClosePopover());
  document.body.appendChild(p);
  document.addEventListener('pointerdown',e=>{if(!p.classList.contains('open'))return;if(p.contains(e.target)||e.target.closest?.('.steam-game-slot-v110'))return;hidePopover()});
  window.addEventListener('resize',hidePopover,{passive:true});
  window.addEventListener('scroll',hidePopover,{passive:true,capture:true});
  return p;
}
function positionPopover(anchor,pop){
  const r=anchor.getBoundingClientRect();
  const w=Math.min(330,window.innerWidth-24);
  const left=Math.max(12,Math.min(window.innerWidth-w-12,r.right-w));
  let top=r.bottom+8;
  pop.style.width=`${w}px`;
  pop.style.left=`${left}px`;
  pop.style.top='0px';
  pop.classList.add('open');
  const h=pop.getBoundingClientRect().height;
  if(top+h>window.innerHeight-12)top=Math.max(12,r.top-h-8);
  pop.style.top=`${top}px`;
}
function hidePopover(){const p=$('steamGamePopoverV110');if(p)p.classList.remove('open')}
function scheduleClosePopover(){if(closeTimer)clearTimeout(closeTimer);closeTimer=setTimeout(hidePopover,180)}
function openStore(game){const g=normalizeGame(game);if(g)window.open(g.storeUrl,'_blank','noopener,noreferrer')}
function showPopover(anchor,eventId){
  if(hoverTimer)clearTimeout(hoverTimer);
  if(closeTimer)clearTimeout(closeTimer);
  const e=eventById(eventId),g=normalizeGame(e?.steamGame),p=ensurePopover();
  if(g){
    p.innerHTML=`<img src="${esc(g.image)}" alt="${esc(g.name)}" loading="lazy"><div class="steam-popover-name-v110">${esc(g.name)}</div><div class="steam-popover-meta-v110">Steam App ${esc(g.appid)}</div><div class="steam-popover-actions-v110"><button type="button" class="secondary" data-act="edit">컨텐츠 수정</button><button type="button" class="primary" data-act="steam">Steam 열기</button></div>`;
    p.querySelector('[data-act="steam"]').onclick=()=>openStore(g);
  }else{
    p.innerHTML=`<div class="steam-popover-name-v110">게임 미등록</div><div class="steam-popover-empty-v110">이 컨텐츠에는 아직 Steam 게임이 연결되어 있지 않습니다. 컨텐츠 수정에서 게임을 검색해 등록할 수 있습니다.</div><div class="steam-popover-actions-v110"><button type="button" class="primary" data-act="edit">컨텐츠 수정 열기</button></div>`;
  }
  const edit=p.querySelector('[data-act="edit"]');
  if(edit)edit.onclick=()=>{hidePopover();try{window.openEvent?.(eventId)}catch(_){}};
  positionPopover(anchor,p);
}

function selectedCardHtml(game){
  const g=normalizeGame(game);if(!g)return '';
  return `<img src="${esc(g.image)}" alt="${esc(g.name)}"><div><strong>${esc(g.name)}</strong><small>Steam App ${esc(g.appid)}</small></div><div class="steam-selected-actions-v110"><button type="button" class="secondary small" id="steamOpenSelectedV110">Steam</button><button type="button" class="ghost small" id="steamClearSelectedV110">연결 해제</button></div>`;
}
function renderSelected(){
  const box=$('steamSelectedGameV110');if(!box)return;
  const g=normalizeGame(selectedSteamGame);
  if(!g){box.classList.remove('active');box.innerHTML='';return}
  box.innerHTML=selectedCardHtml(g);box.classList.add('active');
  $('steamOpenSelectedV110').onclick=()=>openStore(g);
  $('steamClearSelectedV110').onclick=()=>{selectedSteamGame=null;renderSelected();const input=$('steamGameSearchV110');if(input){input.value='';input.focus()}};
}
function setSelectedGame(game){
  selectedSteamGame=normalizeGame(game);
  renderSelected();
  const results=$('steamSearchResultsV110');if(results){results.classList.remove('open');results.innerHTML=''}
  const input=$('steamGameSearchV110');if(input)input.value=selectedSteamGame?.name||'';
}
function renderSearchResults(items,message=''){
  const box=$('steamSearchResultsV110');if(!box)return;
  if(message){box.innerHTML=`<div class="steam-search-empty-v110">${esc(message)}</div>`;box.classList.add('open');return}
  const list=(items||[]).map(normalizeGame).filter(Boolean);
  if(!list.length){box.innerHTML='<div class="steam-search-empty-v110">검색 결과가 없습니다.</div>';box.classList.add('open');return}
  box.innerHTML=list.map(g=>`<button type="button" class="steam-search-result-v110" data-appid="${esc(g.appid)}"><img src="${esc(g.image)}" alt="" loading="lazy"><span><strong>${esc(g.name)}</strong><small>Steam App ${esc(g.appid)}</small></span><span class="pick">선택</span></button>`).join('');
  box.classList.add('open');
  box.querySelectorAll('[data-appid]').forEach(btn=>{btn.onclick=()=>{const g=list.find(x=>x.appid===btn.dataset.appid);if(g)setSelectedGame(g)}});
}
async function searchSteam(query){
  const q=String(query||'').trim();
  if(q.length<2){const box=$('steamSearchResultsV110');if(box){box.classList.remove('open');box.innerHTML=''}return}
  if(searchAbort)searchAbort.abort();
  searchAbort=new AbortController();
  renderSearchResults([], 'Steam에서 검색 중...');
  try{
    const res=await fetch(`/api/steam/search?q=${encodeURIComponent(q)}`,{headers:{accept:'application/json'},signal:searchAbort.signal});
    const body=await res.json().catch(()=>null);
    if(!res.ok)throw new Error(body?.error||`HTTP ${res.status}`);
    renderSearchResults(body?.results||[]);
  }catch(err){
    if(err?.name==='AbortError')return;
    console.error('Steam search failed',err);
    renderSearchResults([], 'Steam 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  }
}
function injectEditor(){
  if($('steamGameFieldV110'))return true;
  const evUrl=$('evUrl');const host=evUrl?.closest('.field');
  if(!host)return false;
  const field=document.createElement('div');
  field.id='steamGameFieldV110';
  field.className='field full steam-game-field-v110';
  field.innerHTML=`<label>Steam 게임</label><div class="steam-search-row-v110"><div class="steam-search-wrap-v110"><input id="steamGameSearchV110" autocomplete="off" placeholder="Steam 게임 이름 검색"><span class="steam-search-mark-v110">STEAM</span><div id="steamSearchResultsV110" class="steam-search-results-v110"></div></div><button type="button" class="secondary" id="steamSearchBtnV110">검색</button></div><div id="steamSelectedGameV110" class="steam-selected-v110"></div><div class="steam-game-help-v110">게임을 선택하면 이 컨텐츠에 Steam App ID와 게임명이 저장됩니다. 일정의 게임 버튼을 누르거나 마우스를 올리면 썸네일과 이름을 확인할 수 있습니다.</div>`;
  host.after(field);
  const input=$('steamGameSearchV110');
  input.addEventListener('input',()=>{if(searchTimer)clearTimeout(searchTimer);searchTimer=setTimeout(()=>searchSteam(input.value),320)});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(searchTimer)clearTimeout(searchTimer);searchSteam(input.value)}else if(e.key==='Escape'){$('steamSearchResultsV110')?.classList.remove('open')}});
  $('steamSearchBtnV110').onclick=()=>searchSteam(input.value);
  document.addEventListener('pointerdown',e=>{const f=$('steamGameFieldV110');if(f&&!f.contains(e.target))$('steamSearchResultsV110')?.classList.remove('open')});
  return true;
}
function syncEditorFromEvent(){
  if(!injectEditor())return;
  const id=currentEditingId();
  const e=id?eventById(id):null;
  selectedSteamGame=normalizeGame(e?.steamGame);
  const input=$('steamGameSearchV110');if(input)input.value=selectedSteamGame?.name||'';
  const results=$('steamSearchResultsV110');if(results){results.classList.remove('open');results.innerHTML=''}
  renderSelected();
}

function wrapSave(){
  const btn=$('saveEventBtn');
  if(!btn||btn.__mwsSteamWrappedV110)return false;
  const base=btn.onclick;
  if(typeof base!=='function')return false;
  btn.__mwsSteamWrappedV110=1;
  btn.onclick=function(event){
    const d=D();
    const beforeIds=new Set((d?.events||[]).map(e=>String(e?.id||'')));
    const editId=currentEditingId();
    const beforeEdit=editId?eventById(editId):null;
    const seriesId=String(beforeEdit?.seriesId||'');
    const editDate=String(beforeEdit?.date||'');
    const wanted=normalizeGame(selectedSteamGame);
    const result=base.call(this,event);
    const modal=$('eventModal');
    if(modal?.classList.contains('open'))return result;
    queueMicrotask(()=>{
      const now=D();if(!now?.events)return;
      const targets=new Set();
      if(editId&&eventById(editId))targets.add(editId);
      for(const ev of now.events){const id=String(ev?.id||'');if(id&&!beforeIds.has(id))targets.add(id)}
      if(seriesId){for(const ev of now.events){if(String(ev?.seriesId||'')===seriesId&&(!editDate||String(ev?.date||'')>=editDate))targets.add(String(ev.id||''))}}
      let changed=false;
      for(const id of targets){
        const ev=eventById(id);if(!ev||ev.restDay)continue;
        if(wanted){if(!sameGame(ev.steamGame,wanted)){ev.steamGame=deepClone(wanted);changed=true}}
        else if(ev.steamGame){delete ev.steamGame;changed=true}
      }
      if(changed){try{saveData('Steam 게임 연결')}catch(err){console.error(err)}}
      scheduleAugment();
    });
    return result;
  };
  return true;
}

function addSlot(host,eventId){
  if(!host||host.querySelector(':scope > .steam-game-slot-v110'))return;
  const ev=eventById(eventId);if(!ev||ev.restDay)return;
  const g=normalizeGame(ev.steamGame);
  host.classList.add('steam-slot-host-v110');
  const b=document.createElement('button');
  b.type='button';
  b.className=`steam-game-slot-v110${g?' linked':''}`;
  b.setAttribute('aria-label',g?`${g.name} 게임 정보`:'Steam 게임 미등록');
  b.title=g?g.name:'Steam 게임 미등록';
  b.textContent=g?'G':'+';
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showPopover(b,eventId)});
  b.addEventListener('pointerdown',e=>e.stopPropagation());
  b.addEventListener('mouseenter',()=>{if(!g)return;if(hoverTimer)clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>showPopover(b,eventId),180)});
  b.addEventListener('mouseleave',()=>scheduleClosePopover());
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
function observeEventModal(){
  const modal=$('eventModal');if(!modal||modal.__mwsSteamObserverV110)return;
  modal.__mwsSteamObserverV110=1;
  new MutationObserver(()=>{if(modal.classList.contains('open'))setTimeout(syncEditorFromEvent,0);else{$('steamSearchResultsV110')?.classList.remove('open');hidePopover()}}).observe(modal,{attributes:true,attributeFilter:['class']});
}

function boot(){
  installCss();
  injectEditor();
  wrapSave();
  observeEventModal();
  observeSchedules();
  ensurePopover();
  if($('eventModal')?.classList.contains('open'))syncEditorFromEvent();
}

let attempts=0;
const timer=setInterval(()=>{
  attempts+=1;
  const ready=D()&&$('eventModal')&&$('saveEventBtn')&&$('evUrl');
  if(ready){clearInterval(timer);boot();return}
  if(attempts>300)clearInterval(timer);
},50);
})();
