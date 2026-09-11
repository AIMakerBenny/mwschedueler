/* CF MWS V 1.0.5 - host wrapper */
(()=>{
'use strict';
if(window.__mwsContentPlannerHostWrapperV105)return;window.__mwsContentPlannerHostWrapperV105=1;
const BUILD='CF MWS V 1.0.5';
function forceVersion(){try{document.body?.setAttribute('data-build-version',BUILD);document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]').forEach(x=>{if(x.textContent!==BUILD)x.textContent=BUILD})}catch(_){}}
function forcePlanner(){try{const f=document.getElementById('mwsContentPlannerFrame');if(f&&!String(f.getAttribute('src')||'').includes('v=1.0.5')){f.dataset.mwsLoaded='1';f.src='/content-planner.html?v=1.0.5'}}catch(_){}}
function stopOld(){try{const b=document.body;if(b?.__mwsV104BuildObserver){b.__mwsV104BuildObserver.disconnect();b.__mwsV104BuildObserver=null}document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,[class*="sidebar-build-version"]').forEach(x=>{if(x.__mwsV104BuildObserver){x.__mwsV104BuildObserver.disconnect();x.__mwsV104BuildObserver=null}})}catch(_){}}
function load(src,id,done){if(document.getElementById(id)){done?.();return}const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>done?.();document.body.appendChild(s)}
function install(){load('/assets/content-planner-host-v104.js?v=1.0.4','mwsContentPlannerHostBaseV104',()=>{forcePlanner();forceVersion()});load('/assets/tools-v1.0.5.js?v=1.0.5','mwsToolsScriptV105');forceVersion();forcePlanner()}
window.addEventListener('DOMContentLoaded',install,{once:true});window.addEventListener('load',install,{once:true});if(document.readyState!=='loading')install();[50,150,400,900,1800,3300,4200,6500].forEach(ms=>setTimeout(()=>{if(ms>=3300)stopOld();forceVersion();forcePlanner();install()},ms));let n=0;const timer=setInterval(()=>{stopOld();forceVersion();forcePlanner();if(++n>24)clearInterval(timer)},500);
})();