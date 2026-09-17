/* Mawang Scheduler v1.2.0 - single runtime version authority */
(()=>{
'use strict';
if(window.__mwsVersionRuntimeV120)return;
window.__mwsVersionRuntimeV120=1;

const VERSION='1.2.0';
const LABEL=`Mawang Scheduler v ${VERSION}`;
const BUILD=`MWS V ${VERSION}`;
let observer=null;

function apply(){
  document.body?.setAttribute('data-build-version',BUILD);
  const version=document.getElementById('mwsBuildVersion')||document.querySelector('[id^="mwsBuildVersionV5"],[class*="sidebar-build-version"]');
  if(version){
    if(version.textContent!==LABEL)version.textContent=LABEL;
    version.setAttribute('aria-label',`현재 버전 ${VERSION}`);
  }
}

function watch(){
  apply();
  const version=document.getElementById('mwsBuildVersion')||document.querySelector('[id^="mwsBuildVersionV5"],[class*="sidebar-build-version"]');
  if(!version)return;
  observer?.disconnect();
  observer=new MutationObserver(()=>{
    if(version.textContent!==LABEL)version.textContent=LABEL;
    if(document.body?.getAttribute('data-build-version')!==BUILD)document.body?.setAttribute('data-build-version',BUILD);
  });
  observer.observe(version,{childList:true,subtree:true,characterData:true});
}

window.MWS_APP_VERSION=VERSION;
window.MWS_APP_VERSION_LABEL=LABEL;
window.mwsApplyAppVersion=apply;

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
window.addEventListener('mws:friend-live-updated',apply);
})();
