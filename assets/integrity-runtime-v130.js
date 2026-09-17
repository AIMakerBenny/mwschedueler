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

/* Phase 12: serialize explicit SAVE with any autosave already using /api/save. */
let activeSaveRequests=0;
if(!window.__mwsIntegrityFetchTrackedV130){
  window.__mwsIntegrityFetchTrackedV130=true;
  const baseFetch=window.fetch.bind(window);
  window.fetch=async function(input,init={}){
    const raw=typeof input==='string'?input:(input?.url||'');
    let isSave=false;
    try{
      const url=new URL(raw,location.href);
      const method=String(init?.method||input?.method||'GET').toUpperCase();
      isSave=url.origin===location.origin&&url.pathname==='/api/save'&&method==='POST';
    }catch(_){}
    if(isSave)activeSaveRequests++;
    try{return await baseFetch(input,init)}
    finally{if(isSave)activeSaveRequests=Math.max(0,activeSaveRequests-1)}
  };
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitForSaveRequests(timeoutMs=65000){
  const deadline=Date.now()+timeoutMs;
  while(activeSaveRequests>0&&Date.now()<deadline)await sleep(50);
  return activeSaveRequests===0;
}
let guardedManualSaveRunning=false;
async function guardedManualSave(){
  if(guardedManualSaveRunning)return false;
  const btn=document.getElementById('mwsSidebarSaveBtn');
  guardedManualSaveRunning=true;
  if(btn)btn.disabled=true;
  try{
    if(!(await waitForSaveRequests())){
      try{toast('SAVE 보류','진행 중인 온라인 저장이 끝나지 않았습니다.')}catch(_){}
      return false;
    }
    if(typeof window.mwsV55SaveNow!=='function')return false;
    let ok=await window.mwsV55SaveNow();
    if(ok)return true;

    // false can mean that an autosave is between its session check and POST request.
    const appearDeadline=Date.now()+5000;
    while(activeSaveRequests===0&&Date.now()<appearDeadline)await sleep(50);
    if(activeSaveRequests>0){
      if(!(await waitForSaveRequests())){
        try{toast('SAVE 보류','진행 중인 온라인 저장이 끝나지 않았습니다.')}catch(_){}
        return false;
      }
      ok=await window.mwsV55SaveNow();
      if(ok)return true;
    }
    try{toast('SAVE FAILED','온라인 저장을 완료하지 못했습니다.')}catch(_){}
    return false;
  }finally{
    guardedManualSaveRunning=false;
    if(btn)btn.disabled=false;
  }
}
const saveBtn=document.getElementById('mwsSidebarSaveBtn');
if(saveBtn&&typeof window.mwsV55SaveNow==='function'){
  saveBtn.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    void guardedManualSave();
  },true);
}

window.__mwsIntegrityHasUnsavedAdminStateV130=hasUnsavedAdminState;
window.__mwsIntegrityRequestImmediateSaveV130=requestImmediateSave;
window.__mwsIntegrityLazyTabRequestSeqV130=()=>lazyTabRequestSeq;
window.__mwsIntegrityActiveSaveRequestsV130=()=>activeSaveRequests;
window.__mwsIntegrityGuardedManualSaveV130=guardedManualSave;
})();
