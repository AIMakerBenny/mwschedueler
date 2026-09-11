/* CF MWS V 1.0.8 - host wrapper */
(()=>{
'use strict';
if(window.__mwsContentPlannerHostWrapperV108)return;window.__mwsContentPlannerHostWrapperV108=1;
const BUILD='CF MWS V 1.0.8';
function forceVersion(){try{document.body?.setAttribute('data-build-version',BUILD);document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]').forEach(x=>{if(x.textContent!==BUILD)x.textContent=BUILD})}catch(_){}}
function forcePlanner(){try{const f=document.getElementById('mwsContentPlannerFrame');if(f&&!String(f.getAttribute('src')||'').includes('v=1.0.5')){f.dataset.mwsLoaded='1';f.src='/content-planner.html?v=1.0.5'}}catch(_){}}
function stopOld(){try{const b=document.body;for(const key of ['__mwsV104BuildObserver','__mwsV101BuildObserver']){if(b?.[key]){b[key].disconnect();b[key]=null}}document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,[class*="sidebar-build-version"]').forEach(x=>{for(const key of ['__mwsV104BuildObserver','__mwsV101BuildObserver']){if(x[key]){x[key].disconnect();x[key]=null}}})}catch(_){}}
function load(src,id,done){if(document.getElementById(id)){done?.();return}const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>done?.();document.body.appendChild(s)}
let finalPromise=null;
function loadFinalCompat(done){
  if(window.__mwsToolsFinalV106){done?.();return}
  if(!finalPromise){
    finalPromise=fetch('/assets/tools-v1.0.6-final.js?v=1.0.8',{cache:'no-store'})
      .then(r=>{if(!r.ok)throw new Error(`tools final ${r.status}`);return r.text()})
      .then(code=>{(0,eval)(code.replaceAll('CF MWS V 1.0.6','CF MWS V 1.0.8'))})
      .catch(e=>{finalPromise=null;console.error('V1.0.8 final tool compatibility load failed',e);throw e});
  }
  finalPromise.then(()=>done?.()).catch(()=>{});
}
function install(){
  load('/assets/content-planner-host-v104.js?v=1.0.4','mwsContentPlannerHostBaseV104',()=>{forcePlanner();forceVersion()});
  load('/assets/tools-v1.0.5.js?v=1.0.5','mwsToolsScriptV105',()=>{
    load('/assets/tools-v1.0.6-bridge.js?v=1.0.6','mwsToolsBridgeScriptV106',()=>{
      loadFinalCompat(()=>load('/assets/tools-v1.0.7-tier.js?v=1.0.7-hotfix','mwsTierVisualScriptV107',()=>load('/assets/tools-v1.0.8.js?v=1.0.8','mwsToolsScriptV108')));
    });
  });
  forceVersion();forcePlanner();
}
window.addEventListener('DOMContentLoaded',install,{once:true});
window.addEventListener('load',install,{once:true});
if(document.readyState!=='loading')install();
[50,150,400,900,1800,3300,4200,6500,9000,11000].forEach(ms=>setTimeout(()=>{stopOld();forceVersion();forcePlanner();install()},ms));
let n=0;const timer=setInterval(()=>{stopOld();forceVersion();forcePlanner();if(++n>60)clearInterval(timer)},250);
})();
