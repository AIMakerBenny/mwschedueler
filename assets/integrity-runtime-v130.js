/* Mawang Scheduler v1.3.0 - lifecycle and integrity guards */
(()=>{
'use strict';
if(window.__mwsIntegrityRuntimeV130)return;
window.__mwsIntegrityRuntimeV130=true;

function report(){
  try{return window.mwsV55EgressReport?.()||null}catch(_){return null}
}
function hasUnsavedAdminState(){
  const r=report();
  return Boolean(r&&r.mode==='admin'&&Array.isArray(r.dirtyParts)&&r.dirtyParts.length);
}
function requestImmediateSave(){
  if(!hasUnsavedAdminState()||typeof window.mwsV55SaveNow!=='function')return false;
  try{
    Promise.resolve(window.mwsV55SaveNow()).catch(error=>console.error('Lifecycle save failed',error));
    return true;
  }catch(error){
    console.error('Lifecycle save failed',error);
    return false;
  }
}

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden')requestImmediateSave();
});
window.addEventListener('beforeunload',event=>{
  if(!hasUnsavedAdminState())return;
  requestImmediateSave();
  event.preventDefault();
  event.returnValue='';
});

/* Phase 11: a lazy-backed tab may not become interactive until its data is ready.
   A monotonically increasing request id also prevents an older slow tab request from stealing focus. */
let lazyTabRequestSeq=0;
const readySetTab=window.setTab;
if(typeof readySetTab==='function'&&typeof window.mwsV55EnsureParts==='function'){
  window.setTab=function(tab){
    const requestId=++lazyTabRequestSeq;
    const args=[...arguments];
    const context=this;
    const status=document.getElementById('syncStatusText');
    if(status)status.textContent=String(tab||'화면')+' 데이터 확인 중';
    Promise.resolve(window.mwsV55EnsureParts(tab)).then(ok=>{
      if(requestId!==lazyTabRequestSeq)return;
      if(ok){
        readySetTab.apply(context,args);
        return;
      }
      try{toast('화면 열기 실패','필수 데이터를 불러오지 못했습니다.')}catch(_){}
    }).catch(error=>{
      if(requestId!==lazyTabRequestSeq)return;
      console.error('Tab readiness failed',tab,error);
      try{toast('화면 열기 실패','필수 데이터를 불러오지 못했습니다.')}catch(_){}
    });
  };
  try{setTab=window.setTab}catch(_){}
}

window.__mwsIntegrityHasUnsavedAdminStateV130=hasUnsavedAdminState;
window.__mwsIntegrityRequestImmediateSaveV130=requestImmediateSave;
window.__mwsIntegrityLazyTabRequestSeqV130=()=>lazyTabRequestSeq;
})();
