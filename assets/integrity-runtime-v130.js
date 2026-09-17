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

window.__mwsIntegrityHasUnsavedAdminStateV130=hasUnsavedAdminState;
window.__mwsIntegrityRequestImmediateSaveV130=requestImmediateSave;
})();
