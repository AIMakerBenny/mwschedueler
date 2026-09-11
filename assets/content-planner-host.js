/* CF MWS V 1.0.10 - planner UI/fullscreen update */
(()=>{
'use strict';
if(window.__mwsV110Stable)return;window.__mwsV110Stable=1;
const BUILD='CF MWS V 1.0.10';
const noopObserver={disconnect(){}};

function forceVersion(){
  try{
    document.body?.setAttribute('data-build-version',BUILD);
    document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]').forEach(x=>{if(x.textContent!==BUILD)x.textContent=BUILD});
  }catch(_){ }
}
function guardVersionObservers(){
  try{
    const body=document.body;
    for(const key of ['__mwsV104BuildObserver','__mwsV101BuildObserver','__mwsV108BuildObserver','__mwsV109BuildObserver']){
      try{body?.[key]?.disconnect?.()}catch(_){ }
      if(body)body[key]=noopObserver;
    }
    document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,[class*="sidebar-build-version"]').forEach(x=>{
      for(const key of ['__mwsV104BuildObserver','__mwsV101BuildObserver','__mwsV108BuildObserver','__mwsV109BuildObserver']){
        try{x[key]?.disconnect?.()}catch(_){ }
        x[key]=noopObserver;
      }
    });
  }catch(_){ }
}
function cutBlock(code,startToken,endToken,replacement=''){
  const a=code.indexOf(startToken);if(a<0)return code;
  const b=code.indexOf(endToken,a);if(b<0)return code;
  return code.slice(0,a)+replacement+code.slice(b);
}
function stableBase(code){
  code=code.replaceAll('CF MWS V 1.0.4',BUILD).replaceAll('/content-planner.html?v=1.0.4','/content-planner.html?v=1.0.10');
  return cutBlock(code,'  setTimeout(()=>{forceVersionV104();const body=document.body;','\n})();','');
}
function stableBridge(code){return cutBlock(code,'let raf=0;const mo=new MutationObserver',"window.addEventListener('mawang:datachange'",'let raf=0;')}
function stableFinal106(code){
  code=code.replaceAll('CF MWS V 1.0.6',BUILD);
  code=cutBlock(code,'const flushGuard=new WeakSet();','function applyAll(){','');
  return cutBlock(code,'const observer=new MutationObserver',"window.addEventListener('mawang:datachange'",'');
}
function stableTier107(code){return cutBlock(code,'let busy=false;const observer=new MutationObserver',"window.addEventListener('DOMContentLoaded'",'let busy=false;')}
function stableFinal108(code){return cutBlock(code,'let raf=0;const mo=new MutationObserver',"window.addEventListener('mawang:datachange'",'let raf=0;')}

const evalPromises=new Map();
function fetchEval(src,key,transform,done){
  if(window[key]){done?.();return}
  if(!evalPromises.has(key)){
    const p=fetch(src,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`${src} ${r.status}`);return r.text()}).then(code=>(0,eval)(transform?transform(code):code)).catch(e=>{evalPromises.delete(key);console.error('MWS stable load failed',src,e);throw e});
    evalPromises.set(key,p);
  }
  evalPromises.get(key).then(()=>done?.()).catch(()=>{});
}
function loadScript(src,id,done){
  if(document.getElementById(id)){done?.();return}
  const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>done?.();s.onerror=e=>console.error('MWS script load failed',src,e);document.body.appendChild(s);
}
function cleanRecords(){try{document.querySelector('.nav button[data-tab="toolRecords"]')?.remove();document.getElementById('toolRecords')?.remove()}catch(_){ }}

let advancedLoading=false,advancedReady=false;
function loadAdvancedTools(){
  if(advancedReady){guardVersionObservers();forceVersion();window.dispatchEvent(new Event('mws:v109-tools-ready'));return}
  if(advancedLoading)return;
  advancedLoading=true;
  fetchEval('/assets/tools-v1.0.6-bridge.js?v=1.0.10','__mwsToolsBridgeV106',stableBridge,()=>{
    fetchEval('/assets/tools-v1.0.6-final.js?v=1.0.10','__mwsToolsFinalV106',stableFinal106,()=>{
      fetchEval('/assets/tools-v1.0.7-tier.js?v=1.0.10','__mwsTierVisualV107',stableTier107,()=>{
        fetchEval('/assets/tools-v1.0.8-final.js?v=1.0.10','__mwsToolsV108',stableFinal108,()=>{
          loadScript('/assets/tools-v1.0.9-ui.js?v=1.0.10','mwsToolsUiScriptV109',()=>{
            advancedLoading=false;advancedReady=true;guardVersionObservers();forceVersion();cleanRecords();window.dispatchEvent(new Event('mws:v109-tools-ready'));
          });
        });
      });
    });
  });
}

function requestedTool(){
  try{
    const q=new URL(location.href).searchParams.get('mwsTool')||location.hash.replace(/^#/,'');
    return ['toolTier','toolMatrix','toolRelations'].includes(q)?q:'';
  }catch(_){return''}
}
function activateRequestedTool(){
  const id=requestedTool();if(!id)return;
  const btn=document.querySelector(`.nav button[data-tab="${id}"]`);
  if(btn){btn.click();setTimeout(loadAdvancedTools,0)}
}

let baseStarted=false;
function baseInstall(){
  if(baseStarted){guardVersionObservers();forceVersion();cleanRecords();activateRequestedTool();return}
  baseStarted=true;
  guardVersionObservers();forceVersion();
  fetchEval('/assets/content-planner-host-v104.js?v=1.0.10','__mwsContentPlannerHostV104',stableBase,()=>{
    guardVersionObservers();forceVersion();
    loadScript('/assets/tools-v1.0.5.js?v=1.0.10','mwsToolsScriptV105',()=>{
      cleanRecords();guardVersionObservers();forceVersion();setTimeout(activateRequestedTool,60);
    });
  });
}

document.addEventListener('click',e=>{
  if(e.target.closest('.nav button[data-tab="toolTier"],.nav button[data-tab="toolMatrix"],.nav button[data-tab="toolRelations"]'))setTimeout(loadAdvancedTools,0);
},true);
window.addEventListener('DOMContentLoaded',baseInstall,{once:true});
window.addEventListener('load',baseInstall,{once:true});
if(document.readyState!=='loading')baseInstall();
[250,900,1800,3500,6500,10500].forEach(ms=>setTimeout(()=>{guardVersionObservers();forceVersion();cleanRecords()},ms));
})();
