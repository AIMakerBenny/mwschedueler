/* Mawang Scheduler v1.1.7 - keep mouse wheel inside the Today People calendar popup */
(()=>{
'use strict';
if(window.__mwsTodayPeopleWheelV117)return;
window.__mwsTodayPeopleWheelV117=1;

const PREVIEW_ID='calendarEventPreview';
const TODAY_CLASS='mws-today-people-hover-v115';

function installStyle(){
  if(document.getElementById('mwsTodayPeopleWheelStyleV117'))return;
  const style=document.createElement('style');
  style.id='mwsTodayPeopleWheelStyleV117';
  style.textContent=`
#${PREVIEW_ID}.${TODAY_CLASS}{
  overscroll-behavior:contain!important;
  scrollbar-gutter:stable!important;
}
`;
  document.head.appendChild(style);
}

function activePreview(){
  const preview=document.getElementById(PREVIEW_ID);
  if(!preview)return null;
  if(!preview.classList.contains('open'))return null;
  if(!preview.classList.contains(TODAY_CLASS))return null;
  return preview;
}

function shouldCaptureWheel(event,preview){
  const target=event.target;
  if(!(target instanceof Element))return false;
  if(preview.contains(target))return true;
  return Boolean(target.closest('#calendar'));
}

function onWheel(event){
  const preview=activePreview();
  if(!preview||!shouldCaptureWheel(event,preview))return;

  event.preventDefault();
  event.stopPropagation();

  const delta=Number(event.deltaY)||0;
  if(delta)preview.scrollTop+=delta;
}

function boot(){
  installStyle();
  document.addEventListener('wheel',onWheel,{capture:true,passive:false});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
