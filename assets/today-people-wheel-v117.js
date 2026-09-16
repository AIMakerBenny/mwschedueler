/* Mawang Scheduler v1.2.0 - precise Today People popup wheel handling */
(()=>{
'use strict';
if(window.__mwsTodayPeopleWheelV120)return;
window.__mwsTodayPeopleWheelV120=1;

const TITLE_RE=/오늘\s*함께한\s*사람/;
let trigger=null;
let pendingTrigger=null;

function installStyle(){
  if(document.getElementById('mwsTodayPeopleWheelStyleV120'))return;
  const style=document.createElement('style');
  style.id='mwsTodayPeopleWheelStyleV120';
  style.textContent=`
#calendarEventPreview.mws-today-people-hover-v115{
  overscroll-behavior:contain!important;
  scrollbar-gutter:stable!important;
}
`;
  document.head.appendChild(style);
}

function visiblePopup(){
  const popup=document.getElementById('calendarEventPreview');
  if(!popup||!popup.classList.contains('open'))return null;
  if(!TITLE_RE.test(String(popup.textContent||'')))return null;
  const rect=popup.getBoundingClientRect();
  if(rect.width<80||rect.height<50)return null;
  return popup;
}

function pointInside(el,x,y){
  if(!el?.isConnected)return false;
  const r=el.getBoundingClientRect();
  return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
}

function chooseTrigger(start){
  if(!(start instanceof Element))return null;
  const calendar=start.closest('#calendar');
  if(!calendar)return null;
  let node=start,chosen=start;
  while(node&&node!==calendar){
    const r=node.getBoundingClientRect();
    if(r.width>=70&&r.height>=18&&r.height<=64)chosen=node;
    if(node.classList?.contains('day')||node.hasAttribute?.('data-date'))break;
    node=node.parentElement;
  }
  return chosen;
}

function rememberPotentialTrigger(event){
  const target=event.target instanceof Element?event.target:null;
  if(!target?.closest('#calendar'))return;
  pendingTrigger=chooseTrigger(target);
  requestAnimationFrame(()=>{
    const popup=visiblePopup();
    if(popup&&pendingTrigger&&!popup.contains(pendingTrigger))trigger=pendingTrigger;
  });
}

function normalizedDelta(event,scroller){
  let delta=Number(event.deltaY)||0;
  if(event.deltaMode===1)delta*=32;
  else if(event.deltaMode===2)delta*=Math.max(120,scroller?.clientHeight||window.innerHeight);
  return delta;
}

function onWheel(event){
  const popup=visiblePopup();
  if(!popup){trigger=null;return}

  const overPopup=pointInside(popup,event.clientX,event.clientY);
  const overTrigger=trigger&&pointInside(trigger,event.clientX,event.clientY);
  if(!overPopup&&!overTrigger)return;

  const delta=normalizedDelta(event,popup);
  if(!delta)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  popup.scrollTop+=delta;
}

function onPointerMove(event){
  const popup=visiblePopup();
  if(!popup){trigger=null;rememberPotentialTrigger(event);return}
  if(pointInside(popup,event.clientX,event.clientY))return;
  if(!trigger||!pointInside(trigger,event.clientX,event.clientY))rememberPotentialTrigger(event);
}

function boot(){
  installStyle();
  document.addEventListener('mousemove',onPointerMove,{capture:true,passive:true});
  document.addEventListener('mouseover',rememberPotentialTrigger,{capture:true,passive:true});
  document.addEventListener('wheel',onWheel,{capture:true,passive:false});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
