/* WARDOGS Phase 118 - session-aware tactical entry transition */
(()=>{
'use strict';
if(window.__mwsWardogsIntroV118)return;
window.__mwsWardogsIntroV118=true;

const SESSION_KEY='mws_wardogs_intro_v118';
const FULL_EXIT_AT=1500;
const FULL_HIDE_AT=1710;
const QUICK_HIDE_AT=340;
let fallbackSeen=false;
let timerExit=0;
let timerHide=0;
let observer=null;
let wasActive=false;

function prefersReducedMotion(){
  try{return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true}catch(_){return false}
}
function hasSeenFull(){
  try{return sessionStorage.getItem(SESSION_KEY)==='1'}catch(_){return fallbackSeen}
}
function markSeenFull(){
  fallbackSeen=true;
  try{sessionStorage.setItem(SESSION_KEY,'1')}catch(_){}
}
function overlay(){
  return document.getElementById('wardogsEntryV118');
}
function clearTimers(){
  clearTimeout(timerExit);
  clearTimeout(timerHide);
  timerExit=0;
  timerHide=0;
}
function hideOverlay(){
  const el=overlay();
  if(!el)return;
  clearTimers();
  el.classList.remove('is-running','is-full','is-quick','is-exiting');
  el.hidden=true;
  el.setAttribute('aria-hidden','true');
}
function showFull(){
  const el=overlay();
  if(!el)return;
  clearTimers();
  markSeenFull();
  el.hidden=false;
  el.setAttribute('aria-hidden','false');
  el.classList.remove('is-full','is-quick','is-exiting','is-running');

  if(prefersReducedMotion()){
    hideOverlay();
    return;
  }

  requestAnimationFrame(()=>{
    el.classList.add('is-running','is-full');
    timerExit=setTimeout(()=>el.classList.add('is-exiting'),FULL_EXIT_AT);
    timerHide=setTimeout(hideOverlay,FULL_HIDE_AT);
  });
}
function showQuick(){
  const el=overlay();
  if(!el)return;
  clearTimers();
  el.hidden=false;
  el.setAttribute('aria-hidden','false');
  el.classList.remove('is-full','is-quick','is-exiting','is-running');

  if(prefersReducedMotion()){
    hideOverlay();
    return;
  }

  requestAnimationFrame(()=>{
    el.classList.add('is-running','is-quick');
    timerHide=setTimeout(hideOverlay,QUICK_HIDE_AT);
  });
}
function enterWardogs(){
  if(hasSeenFull())showQuick();
  else showFull();
}
function onActiveChange(root){
  const active=root.classList.contains('active');
  if(active&&!wasActive)enterWardogs();
  if(!active&&wasActive)hideOverlay();
  wasActive=active;
}
function init(){
  const root=document.getElementById('wardogs');
  const el=overlay();
  if(!root||!el||root.dataset.wardogsIntroBoundV118==='1')return;
  root.dataset.wardogsIntroBoundV118='1';
  wasActive=root.classList.contains('active');
  observer=new MutationObserver(()=>onActiveChange(root));
  observer.observe(root,{attributes:true,attributeFilter:['class']});
  if(wasActive)enterWardogs();
}

window.mwsWardogsIntroV118=Object.freeze({
  init,
  enter:enterWardogs,
  hide:hideOverlay,
  hasSeenFull
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
window.addEventListener('mws:app-ready',init);
window.addEventListener('mws:cloud-runtime-v130-ready',init);
})();
