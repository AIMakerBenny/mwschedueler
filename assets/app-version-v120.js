/* Mawang Scheduler Neo v1.0.0 - visual label; v1.4.0 retained as the internal compatibility version */
(()=>{
'use strict';
if(window.__mwsAppVersionV120)return;
window.__mwsAppVersionV120=1;

const VERSION='1.4.0';
const LABEL='Mawang Scheduler Neo v1.0.0';
const BUILD=`MWS V ${VERSION}`;
window.MWS_APP_VERSION=VERSION;
window.MWS_APP_VERSION_LABEL=LABEL;

function apply(){
  const body=document.body;
  if(body&&body.getAttribute('data-build-version')!==BUILD)body.setAttribute('data-build-version',BUILD);
  const version=document.getElementById('mwsBuildVersion')||document.querySelector('[id^="mwsBuildVersionV5"],[class*="sidebar-build-version"]');
  if(version){
    if(version.textContent!==LABEL)version.textContent=LABEL;
    const aria=`현재 버전 ${LABEL}`;
    if(version.getAttribute('aria-label')!==aria)version.setAttribute('aria-label',aria);
  }
}

window.mwsApplyAppVersionV120=apply;

apply();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
window.addEventListener('load',apply,{once:true});
/* Legacy modules may finish their one-time boot just after load. Re-assert finitely, never observe/mutate in a loop. */
setTimeout(apply,250);
setTimeout(apply,1200);
})();
