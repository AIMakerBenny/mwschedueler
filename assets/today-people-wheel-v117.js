/* Mawang Scheduler v1.1.8 - keep mouse wheel inside the actual Today People calendar popup */
(()=>{
'use strict';
if(window.__mwsTodayPeopleWheelV118)return;
window.__mwsTodayPeopleWheelV118=1;

const TITLE_RE=/오늘\s*함께한\s*사람/;
let cachedPopup=null;
let cachedScroller=null;

function installStyle(){
  if(document.getElementById('mwsTodayPeopleWheelStyleV118'))return;
  const style=document.createElement('style');
  style.id='mwsTodayPeopleWheelStyleV118';
  style.textContent=`
.mws-today-people-wheel-popup-v118,
.mws-today-people-wheel-scroll-v118{
  overscroll-behavior:contain!important;
  scrollbar-gutter:stable!important;
}
`;
  document.head.appendChild(style);
}

function visible(el){
  if(!(el instanceof Element))return false;
  const r=el.getBoundingClientRect();
  if(r.width<80||r.height<50)return false;
  const s=getComputedStyle(el);
  return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)!==0;
}

function isTodayPopup(el){
  if(!visible(el))return false;
  return TITLE_RE.test(String(el.textContent||''));
}

function locatePopup(){
  if(cachedPopup&&cachedPopup.isConnected&&isTodayPopup(cachedPopup))return cachedPopup;
  cachedPopup=null;
  cachedScroller=null;

  const selectors='[id*="today" i],[class*="today" i],[class*="popover" i],[class*="preview" i],[class*="popup" i]';
  let candidates=[...document.querySelectorAll(selectors)].filter(isTodayPopup);

  if(!candidates.length){
    candidates=[...document.querySelectorAll('div,section,aside')].filter(isTodayPopup);
  }
  if(!candidates.length)return null;

  candidates.sort((a,b)=>{
    const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
    return ar.width*ar.height-br.width*br.height;
  });
  cachedPopup=candidates[0];
  cachedPopup.classList.add('mws-today-people-wheel-popup-v118');
  return cachedPopup;
}

function locateScroller(popup){
  if(!popup)return null;
  if(cachedScroller&&cachedScroller.isConnected&&popup.contains(cachedScroller))return cachedScroller;

  const nodes=[popup,...popup.querySelectorAll('*')];
  const scrollables=nodes.filter(el=>{
    if(!(el instanceof HTMLElement)||!visible(el))return false;
    if(el.scrollHeight<=el.clientHeight+2)return false;
    const s=getComputedStyle(el);
    return /(auto|scroll|overlay)/.test(s.overflowY)||el===popup;
  });

  scrollables.sort((a,b)=>{
    const da=(a===popup?0:1),db=(b===popup?0:1);
    if(da!==db)return da-db;
    return b.clientHeight-a.clientHeight;
  });

  cachedScroller=scrollables[0]||popup;
  if(cachedScroller instanceof HTMLElement){
    cachedScroller.classList.add('mws-today-people-wheel-scroll-v118');
    if(cachedScroller.scrollHeight>cachedScroller.clientHeight+2){
      cachedScroller.style.setProperty('overflow-y','auto','important');
    }
  }
  return cachedScroller;
}

function pointInside(el,x,y){
  if(!el)return false;
  const r=el.getBoundingClientRect();
  return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
}

function shouldCapture(event,popup){
  const target=event.target instanceof Element?event.target:null;
  if(target&&popup.contains(target))return true;
  if(pointInside(popup,event.clientX,event.clientY))return true;
  if(target&&target.closest('#calendar,#calendarGrid,.day'))return true;
  return false;
}

function normalizedDelta(event,scroller){
  let delta=Number(event.deltaY)||0;
  if(event.deltaMode===1)delta*=32;
  else if(event.deltaMode===2)delta*=Math.max(120,scroller?.clientHeight||window.innerHeight);
  return delta;
}

function onWheel(event){
  const popup=locatePopup();
  if(!popup||!shouldCapture(event,popup))return;
  const scroller=locateScroller(popup);
  if(!scroller)return;

  const delta=normalizedDelta(event,scroller);
  if(!delta)return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  scroller.scrollTop+=delta;
}

function invalidate(){
  if(cachedPopup&&!cachedPopup.isConnected){cachedPopup=null;cachedScroller=null;return}
  if(cachedPopup&&!isTodayPopup(cachedPopup)){cachedPopup=null;cachedScroller=null}
}

function boot(){
  installStyle();
  document.addEventListener('wheel',onWheel,{capture:true,passive:false});
  const root=document.body||document.documentElement;
  if(root)new MutationObserver(()=>requestAnimationFrame(invalidate)).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-hidden']});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
