/* Mawang Scheduler v1.2.1 - low-overhead calendar and editor fixes */
(()=>{
'use strict';
if(window.__mwsUiFixesV121)return;
window.__mwsUiFixesV121=1;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const getData=()=>{try{return data}catch(_){return window.data||null}};
const eventById=id=>(getData()?.events||[]).find(event=>String(event?.id||'')===String(id||''))||null;
function normalizeGame(game){const appid=String(game?.appid??game?.appId??'').trim();if(!/^\d{1,12}$/.test(appid))return null;const raw=String(game?.image||game?.headerImage||'').trim();return{appid,name:String(game?.name||'').trim()||`Steam App ${appid}`,image:/^https:\/\//i.test(raw)?raw:`https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(appid)}/header.jpg`}}
function installStyle(){if($('mwsUiFixesStyleV121'))return;const s=document.createElement('style');s.id='mwsUiFixesStyleV121';s.textContent=`
#eventModal .event-modalbox.mws-game-panel-enabled-v112{width:min(1920px,99vw)!important;max-width:none!important;max-height:calc(100dvh - 14px)!important;padding:18px!important}
#eventModal .event-modalbox.mws-game-panel-enabled-v112 .event-modal-layout{grid-template-columns:minmax(300px,370px) minmax(540px,1fr) minmax(410px,500px)!important;gap:18px!important}
#eventModal .event-modalbox.mws-game-panel-enabled-v112 .event-game-panel-v112{padding:18px!important;border-radius:16px!important}
#eventModal .mws-game-panel-head-v112 h3{font-size:19px!important}#eventModal .mws-game-panel-head-v112 .muted.small{font-size:12px!important;line-height:1.55!important}#eventModal .mws-game-preview-name-v112{font-size:21px!important}#eventModal .mws-game-search-row-v112 input{font-size:14px!important;padding:11px 12px!important}#eventModal .mws-game-search-row-v112 button{font-size:13px!important;padding:10px 14px!important}#eventModal .mws-game-results-v112{gap:9px!important;max-height:430px!important}#eventModal .mws-game-result-v112{grid-template-columns:112px minmax(0,1fr)!important;gap:12px!important;padding:9px!important}#eventModal .mws-game-result-v112 img{width:112px!important;height:53px!important}#eventModal .mws-game-result-v112 strong{font-size:14px!important}
#calendarEventPreview .mws-game-hover-v121{width:min(360px,76vw)}#calendarEventPreview .mws-game-hover-image-v121{display:block;width:100%;aspect-ratio:460/215;object-fit:cover;border-radius:12px;background:#080b12;border:1px solid var(--border)}#calendarEventPreview .mws-game-hover-copy-v121{padding-top:12px}#calendarEventPreview .mws-game-hover-name-v121{margin-top:5px;font-size:20px;line-height:1.35;font-weight:1000;color:var(--text)}#calendarEventPreview .mws-game-hover-app-v121{margin-top:6px;font-size:11px;color:var(--muted)}
#calendarEventPreview.mws-today-people-hover-v121{width:min(570px,calc(100vw - 24px))!important;max-width:570px!important;max-height:calc(100vh - 24px)!important;overflow:auto!important}
#calendarEventPreview.mws-today-people-hover-v121 .mws-today-people-grid-v121{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;width:100%!important;max-height:none!important;overflow:visible!important}
@media(max-width:1230px){#eventModal .event-modalbox.mws-game-panel-enabled-v112{width:min(1120px,98vw)!important}#eventModal .event-modalbox.mws-game-panel-enabled-v112 .event-modal-layout{grid-template-columns:1fr!important}}
@media(max-width:700px){#calendarEventPreview.mws-today-people-hover-v121{width:min(390px,calc(100vw - 16px))!important}#calendarEventPreview.mws-today-people-hover-v121 .mws-today-people-grid-v121{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
`;document.head.appendChild(s)}
function positionPreview(preview,x,y){if(!preview)return;const gap=14,r=preview.getBoundingClientRect();let left=x+gap,top=y+gap;if(left+r.width>innerWidth-10)left=x-r.width-gap;if(top+r.height>innerHeight-10)top=y-r.height-gap;preview.style.left=Math.max(10,left)+'px';preview.style.top=Math.max(10,top)+'px'}
function showGamePreview(slot,x,y){const game=normalizeGame(eventById(slot?.dataset?.eventId)?.steamGame),preview=$('calendarEventPreview');if(!game||!preview)return;startGamePreviewTracking();preview.innerHTML=`<div class="mws-game-hover-v121"><img class="mws-game-hover-image-v121" src="${esc(game.image)}" alt="${esc(game.name)}"><div class="mws-game-hover-copy-v121"><div class="mws-game-hover-name-v121">${esc(game.name)}</div><div class="mws-game-hover-app-v121">Steam App ${esc(game.appid)}</div></div></div>`;preview.classList.remove('mws-today-people-hover-v121');preview.classList.add('open');preview.setAttribute('aria-hidden','false');requestAnimationFrame(()=>positionPreview(preview,x,y))}
function hidePreview(){stopGamePreviewTracking();const preview=$('calendarEventPreview');if(!preview)return;preview.classList.remove('open');preview.setAttribute('aria-hidden','true')}
function tuneTodayPeoplePreview(){const preview=$('calendarEventPreview');if(!preview)return;preview.querySelectorAll('.mws-today-people-grid-v121').forEach(n=>n.classList.remove('mws-today-people-grid-v121'));const active=/오늘\s*함께한\s*사람/.test(preview.textContent||'');preview.classList.toggle('mws-today-people-hover-v121',active);if(!active)return;const candidates=[...preview.querySelectorAll('*')].filter(n=>n.children.length>=3&&getComputedStyle(n).display==='grid');candidates.sort((a,b)=>b.children.length-a.children.length);candidates[0]?.classList.add('mws-today-people-grid-v121')}
let lastOpenAt=0,lastOpenId='';
function openGameEditor(slot){const id=String(slot?.dataset?.eventId||'');if(!id||!eventById(id))return;const t=Date.now();if(lastOpenId===id&&t-lastOpenAt<300)return;lastOpenId=id;lastOpenAt=t;hidePreview();try{if(typeof window.openSteamGamePickerV111==='function')window.openSteamGamePickerV111(id)}catch(e){console.error(e)}setTimeout(()=>{try{if(!$('eventModal')?.classList.contains('open')){if(typeof window.openEvent==='function')window.openEvent(id);else if(typeof openEvent==='function')openEvent(id)}$('eventGameSearchV112')?.focus()}catch(e){console.error(e)}},30)}
function slotFromEvent(e){return e.target?.closest?.('.mws-steam-slot-v111')||null}
let gamePreviewTracking=false;
function trackGamePreviewMove(e){
  const preview=$('calendarEventPreview');
  if(!preview?.classList.contains('open')){stopGamePreviewTracking();return}
  const slot=slotFromEvent(e);
  if(slot)positionPreview(preview,e.clientX,e.clientY);
}
function startGamePreviewTracking(){
  if(gamePreviewTracking)return;
  gamePreviewTracking=true;
  document.addEventListener('mousemove',trackGamePreviewMove,true);
}
function stopGamePreviewTracking(){
  if(!gamePreviewTracking)return;
  gamePreviewTracking=false;
  document.removeEventListener('mousemove',trackGamePreviewMove,true);
}
document.addEventListener('mouseover',e=>{const slot=slotFromEvent(e);if(!slot||slot.contains(e.relatedTarget))return;showGamePreview(slot,e.clientX,e.clientY)},true);
document.addEventListener('mouseout',e=>{const slot=slotFromEvent(e);if(!slot||slot.contains(e.relatedTarget))return;hidePreview()},true);
document.addEventListener('pointerdown',e=>{if(slotFromEvent(e))e.stopPropagation()},true);
document.addEventListener('pointerup',e=>{const slot=slotFromEvent(e);if(!slot||e.button!==0)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openGameEditor(slot)},true);
document.addEventListener('click',e=>{const slot=slotFromEvent(e);if(!slot)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openGameEditor(slot)},true);
function rpsSearchInput(){const palette=$('rpsContactPalette'),input=palette?.previousElementSibling;return input?.classList?.contains('mini-contact-search')?input:null}
function installRpsSearchPersistence(){const current=window.renderMiniContactPalette;if(typeof current!=='function'||current.__mwsRpsPersistV121)return false;const wrapped=function(game,q=''){let next=q;if(game==='rps'&&(next==null||String(next)==='')){const input=rpsSearchInput();if(input?.value)next=input.value}return current.call(this,game,next)};wrapped.__mwsRpsPersistV121=1;window.renderMiniContactPalette=wrapped;try{renderMiniContactPalette=wrapped}catch(_){}return true}
let previewTuneFrameV144=0;
function queuePreviewTuneV144(){
  if(document.hidden||previewTuneFrameV144)return;
  previewTuneFrameV144=requestAnimationFrame(()=>{
    previewTuneFrameV144=0;
    tuneTodayPeoplePreview();
  });
}
function boot(){installStyle();installRpsSearchPersistence();const preview=$('calendarEventPreview');if(preview)new MutationObserver(mutations=>{if(mutations.some(m=>m.type==='childList'))queuePreviewTuneV144()}).observe(preview,{childList:true,subtree:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&$('calendarEventPreview')?.classList.contains('open'))queuePreviewTuneV144()});if(!installRpsSearchPersistence()){let tries=0;const retry=()=>{if(installRpsSearchPersistence()||++tries>=12)return;setTimeout(retry,300)};setTimeout(retry,300)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
