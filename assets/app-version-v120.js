/* Mawang Scheduler v1.2.0 - single authoritative version display */
(()=>{
'use strict';
if(window.__mwsAppVersionV120)return;
window.__mwsAppVersionV120=1;

const VERSION='1.2.0';
const LABEL=`Mawang Scheduler v ${VERSION}`;
window.MWS_APP_VERSION=VERSION;
window.MWS_APP_VERSION_LABEL=LABEL;

let applying=false;
function apply(){
  if(applying)return;
  applying=true;
  try{
    document.body?.setAttribute('data-build-version',`MWS V ${VERSION}`);
    const direct=document.getElementById('mwsBuildVersion')||document.querySelector('[id^="mwsBuildVersionV5"],[class*="sidebar-build-version"]');
    if(direct){
      if(direct.textContent!==LABEL)direct.textContent=LABEL;
      direct.setAttribute('aria-label',`현재 버전 ${LABEL}`);
    }
  }finally{applying=false}
}
window.mwsApplyAppVersionV120=apply;

apply();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});

const root=document.querySelector('.sidebar')||document.body;
if(root){
  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      const target=mutation.target?.nodeType===3?mutation.target.parentElement:mutation.target;
      if(target?.id==='mwsBuildVersion'||target?.closest?.('#mwsBuildVersion')){apply();break}
    }
  });
  observer.observe(root,{subtree:true,childList:true,characterData:true});
}
})();
