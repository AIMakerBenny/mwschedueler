/* Mawang Scheduler v1.1.5 - calendar hover, Steam thumbnail editing, and editor sizing fixes */
(()=>{
'use strict';
if(window.__mwsUiFixesV113)return;
window.__mwsUiFixesV113=1;

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const getData=()=>{try{return data}catch(_){return window.data||null}};
const eventById=id=>(getData()?.events||[]).find(event=>String(event?.id||'')===String(id||''))||null;
const normalizeGame=game=>{
  const appid=String(game?.appid??game?.appId??'').trim();
  if(!/^\d{1,12}$/.test(appid))return null;
  const rawImage=String(game?.image||game?.headerImage||'').trim();
  return {
    appid,
    name:String(game?.name||'').trim()||`Steam App ${appid}`,
    image:/^https:\/\//i.test(rawImage)?rawImage:`https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(appid)}/header.jpg`
  };
};

function installStyle(){
  if($('mwsUiFixesStyleV113'))return;
  const style=document.createElement('style');
  style.id='mwsUiFixesStyleV113';
  style.textContent=`
/* Larger schedule editor and substantially wider game panel. */
#eventModal .event-modalbox.mws-game-panel-enabled-v112{
  width:min(1920px,99vw)!important;
  max-width:none!important;
  max-height:calc(100dvh - 14px)!important;
  padding:18px!important;
}
#eventModal .event-modalbox.mws-game-panel-enabled-v112 .event-modal-layout{
  grid-template-columns:minmax(300px,370px) minmax(540px,1fr) minmax(410px,500px)!important;
  gap:18px!important;
}
#eventModal .event-modalbox.mws-game-panel-enabled-v112 .event-game-panel-v112{
  padding:18px!important;
  border-radius:16px!important;
}
#eventModal .mws-game-panel-head-v112{margin-bottom:16px!important}
#eventModal .mws-game-panel-head-v112 h3{font-size:19px!important}
#eventModal .mws-game-panel-head-v112 .muted.small{font-size:12px!important;line-height:1.55!important}
#eventModal .mws-game-panel-head-v112 .chip{font-size:11px!important;padding:5px 9px!important}
#eventModal .mws-game-preview-name-v112{font-size:21px!important;line-height:1.35!important}
#eventModal .mws-game-preview-app-v112{font-size:11px!important}
#eventModal .mws-game-preview-copy-v112{padding:15px!important}
#eventModal .mws-game-preview-actions-v112 button{font-size:12px!important;padding:9px 11px!important}
#eventModal .mws-game-preview-empty-v112{min-height:230px!important;font-size:13px!important}
#eventModal .mws-game-preview-empty-mark-v112{width:58px!important;height:58px!important;font-size:32px!important}
#eventModal .mws-game-search-section-v112{margin-top:18px!important}
#eventModal .mws-game-search-label-v112{font-size:14px!important;margin-bottom:9px!important}
#eventModal .mws-game-search-row-v112 input{font-size:14px!important;padding:11px 12px!important}
#eventModal .mws-game-search-row-v112 button{font-size:13px!important;padding:10px 14px!important}
#eventModal .mws-game-search-status-v112{font-size:11px!important;min-height:30px!important;padding-top:8px!important}
#eventModal .mws-game-results-v112{gap:9px!important;max-height:430px!important}
#eventModal .mws-game-result-v112{grid-template-columns:112px minmax(0,1fr)!important;gap:12px!important;padding:9px!important;border-radius:11px!important}
#eventModal .mws-game-result-v112 img{width:112px!important;height:53px!important;border-radius:7px!important}
#eventModal .mws-game-result-v112 strong{font-size:14px!important;line-height:1.4!important}
#eventModal .mws-game-result-v112 small{font-size:10px!important;margin-top:4px!important}
#eventModal .mws-game-search-empty-v112{font-size:11px!important;padding:20px 13px!important}
#eventModal .mws-game-panel-bottom-v112 button{font-size:12px!important;padding:9px 11px!important}

/* Game-only hover card shown when the mouse is over the calendar thumbnail. */
#calendarEventPreview .mws-game-hover-v113{width:min(360px,76vw)}
#calendarEventPreview .mws-game-hover-image-v113{display:block;width:100%;aspect-ratio:460/215;object-fit:cover;border-radius:12px;background:#080b12;border:1px solid var(--border)}
#calendarEventPreview .mws-game-hover-copy-v113{padding-top:12px}
#calendarEventPreview .mws-game-hover-kicker-v113{font-size:10px;font-weight:900;letter-spacing:.12em;color:var(--accent)}
#calendarEventPreview .mws-game-hover-name-v113{margin-top:5px;font-size:20px;line-height:1.35;font-weight:1000;color:var(--text);word-break:keep-all}
#calendarEventPreview .mws-game-hover-app-v113{margin-top:6px;font-size:11px;color:var(--muted)}

/* Today-people calendar hover. Wider popup, three columns, and no inner scrollbar for ordinary large groups. */
#calendarEventPreview.mws-today-people-hover-v115{
  width:min(570px,calc(100vw - 24px))!important;
  max-width:570px!important;
  max-height:calc(100vh - 24px)!important;
  overflow:auto!important;
}
#calendarEventPreview.mws-today-people-hover-v115 .mws-today-people-grid-v115{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:8px!important;
  width:100%!important;
  max-height:none!important;
  overflow:visible!important;
}
#calendarEventPreview.mws-today-people-hover-v115 .mws-today-people-grid-v115>*{min-width:0!important}

@media(max-width:1500px){
  #eventModal .event-modalbox.mws-game-panel-enabled-v112 .event-modal-layout{
    grid-template-columns:minmax(280px,330px) minmax(500px,1fr) minmax(390px,450px)!important;
  }
}
@media(max-width:1230px){
  #eventModal .event-modalbox.mws-game-panel-enabled-v112{width:min(1120px,98vw)!important}
  #eventModal .event-modalbox.mws-game-panel-enabled-v112 .event-modal-layout{grid-template-columns:1fr!important}
  #eventModal .event-game-panel-v112{min-height:620px!important;overflow:visible!important}
  #eventModal .mws-game-results-v112{max-height:380px!important}
}
@media(max-width:700px){
  #calendarEventPreview.mws-today-people-hover-v115{width:min(390px,calc(100vw - 16px))!important}
  #calendarEventPreview.mws-today-people-hover-v115 .mws-today-people-grid-v115{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
`;
  document.head.appendChild(style);
}

function positionPreview(preview,x,y){
  if(!preview)return;
  const gap=14;
  const rect=preview.getBoundingClientRect();
  let left=Number(x||0)+gap;
  let top=Number(y||0)+gap;
  if(left+rect.width>window.innerWidth-10)left=Number(x||0)-rect.width-gap;
  if(top+rect.height>window.innerHeight-10)top=Number(y||0)-rect.height-gap;
  preview.style.left=Math.max(10,left)+'px';
  preview.style.top=Math.max(10,top)+'px';
}

function showGamePreview(button,x,y){
  const event=eventById(button?.dataset?.eventId);
  const game=normalizeGame(event?.steamGame);
  const preview=$('calendarEventPreview');
  if(!preview||!game)return;
  preview.innerHTML=`<div class="mws-game-hover-v113"><img class="mws-game-hover-image-v113" src="${esc(game.image)}" alt="${esc(game.name)}"><div class="mws-game-hover-copy-v113"><div class="mws-game-hover-kicker-v113">STEAM GAME</div><div class="mws-game-hover-name-v113">${esc(game.name)}</div><div class="mws-game-hover-app-v113">Steam App ${esc(game.appid)}</div></div></div>`;
  preview.classList.remove('mws-today-people-hover-v115');
  preview.classList.add('open');
  preview.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>positionPreview(preview,x,y));
}

function hidePreview(){
  const preview=$('calendarEventPreview');
  if(!preview)return;
  preview.classList.remove('open');
  preview.setAttribute('aria-hidden','true');
}

function findTodayPeopleGrid(preview){
  const nodes=[...preview.querySelectorAll('*')];
  const candidates=nodes.filter(node=>{
    if(node.children.length<3)return false;
    const style=getComputedStyle(node);
    const isGrid=style.display==='grid'||/grid/i.test(String(node.className||''));
    if(!isGrid)return false;
    const personLike=[...node.children].filter(child=>child.querySelector?.('img,.avatar')||/\S/.test(child.textContent||''));
    return personLike.length>=3;
  });
  candidates.sort((a,b)=>b.children.length-a.children.length);
  return candidates[0]||null;
}

function tuneTodayPeoplePreview(){
  const preview=$('calendarEventPreview');
  if(!preview)return;
  preview.querySelectorAll('.mws-today-people-grid-v115').forEach(node=>node.classList.remove('mws-today-people-grid-v115'));
  const isTodayPeople=/오늘\s*함께한\s*사람/.test(preview.textContent||'');
  preview.classList.toggle('mws-today-people-hover-v115',isTodayPeople);
  if(!isTodayPeople)return;
  const grid=findTodayPeopleGrid(preview);
  if(grid)grid.classList.add('mws-today-people-grid-v115');
}

let lastOpenAt=0;
let lastOpenId='';
function openGameEditor(button){
  const eventId=String(button?.dataset?.eventId||'');
  if(!eventId||!eventById(eventId))return;
  const now=Date.now();
  if(lastOpenId===eventId&&now-lastOpenAt<350)return;
  lastOpenId=eventId;
  lastOpenAt=now;
  hidePreview();

  let invoked=false;
  try{
    if(typeof window.openSteamGamePickerV111==='function'){
      window.openSteamGamePickerV111(eventId);
      invoked=true;
    }
  }catch(error){console.error('Steam game editor open failed',error)}

  const forceOpen=()=>{
    try{
      const modal=$('eventModal');
      if(!modal?.classList.contains('open')){
        if(typeof window.openEvent==='function'){window.openEvent(eventId);invoked=true}
        else if(typeof openEvent==='function'){openEvent(eventId);invoked=true}
      }
      setTimeout(()=>$('eventGameSearchV112')?.focus(),0);
    }catch(error){console.error('Game thumbnail editor fallback failed',error)}
  };
  setTimeout(forceOpen,40);
  if(!invoked)forceOpen();
}

function bindSlot(button){
  if(!button||button.__mwsUiFixV113)return;
  button.__mwsUiFixV113=1;
  button.draggable=false;
  button.addEventListener('dragstart',event=>{event.preventDefault();event.stopPropagation()});
  button.addEventListener('mouseenter',event=>showGamePreview(button,event.clientX,event.clientY));
  button.addEventListener('mousemove',event=>positionPreview($('calendarEventPreview'),event.clientX,event.clientY));
  button.addEventListener('mouseleave',event=>{
    const host=button.closest('.mini-event');
    if(host&&event.relatedTarget&&host.contains(event.relatedTarget)&&typeof host.onmouseenter==='function'){
      try{host.onmouseenter({clientX:event.clientX,clientY:event.clientY})}catch(_){hidePreview()}
    }else hidePreview();
  });
}

function scan(){
  document.querySelectorAll('.mws-steam-slot-v111').forEach(bindSlot);
  tuneTodayPeoplePreview();
}

function gameSlotFromEvent(event){return event.target?.closest?.('.mws-steam-slot-v111')||null}

/* Dedicated thumbnail interaction. Pointer-up handles cases where the draggable calendar row swallows click. */
document.addEventListener('pointerdown',event=>{
  const button=gameSlotFromEvent(event);
  if(!button)return;
  event.stopPropagation();
},true);
document.addEventListener('pointerup',event=>{
  const button=gameSlotFromEvent(event);
  if(!button||event.button!==0)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openGameEditor(button);
},true);
document.addEventListener('click',event=>{
  const button=gameSlotFromEvent(event);
  if(!button)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openGameEditor(button);
},true);

document.addEventListener('mouseover',event=>{
  if(event.target?.closest?.('#calendar'))requestAnimationFrame(tuneTodayPeoplePreview);
},true);

function boot(){
  installStyle();
  scan();
  const preview=$('calendarEventPreview');
  if(preview)new MutationObserver(()=>requestAnimationFrame(tuneTodayPeoplePreview)).observe(preview,{childList:true,subtree:true,characterData:true});
  const target=document.body||document.documentElement;
  if(target)new MutationObserver(scan).observe(target,{childList:true,subtree:true});
  setInterval(scan,1500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
