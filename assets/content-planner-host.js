/* CF MWS V 1.0.8 - stable host hotfix: remove broad DOM observers */
(()=>{
'use strict';
if(window.__mwsContentPlannerHostWrapperV108Stable)return;
window.__mwsContentPlannerHostWrapperV108Stable=1;
const BUILD='CF MWS V 1.0.8';

function forceVersion(){
  try{
    document.body?.setAttribute('data-build-version',BUILD);
    document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]').forEach(x=>{
      if(x.textContent!==BUILD)x.textContent=BUILD;
    });
  }catch(_){ }
}
function forcePlanner(){
  try{
    const f=document.getElementById('mwsContentPlannerFrame');
    if(f&&!String(f.getAttribute('src')||'').includes('v=1.0.5')){
      f.dataset.mwsLoaded='1';
      f.src='/content-planner.html?v=1.0.5';
    }
  }catch(_){ }
}
function stopOld(){
  try{
    const b=document.body;
    for(const key of ['__mwsV104BuildObserver','__mwsV101BuildObserver']){
      if(b?.[key]){b[key].disconnect();b[key]=null}
    }
    document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,[class*="sidebar-build-version"]').forEach(x=>{
      for(const key of ['__mwsV104BuildObserver','__mwsV101BuildObserver']){
        if(x[key]){x[key].disconnect();x[key]=null}
      }
    });
  }catch(_){ }
}
function load(src,id,done){
  if(document.getElementById(id)){done?.();return}
  const s=document.createElement('script');
  s.id=id;s.src=src;s.onload=()=>done?.();s.onerror=e=>console.error('MWS script load failed',src,e);
  document.body.appendChild(s);
}
function cutObserver(code,startToken,endToken,replacement=''){
  const a=code.indexOf(startToken);
  if(a<0)return code;
  const b=code.indexOf(endToken,a);
  if(b<0)return code;
  return code.slice(0,a)+replacement+code.slice(b);
}
function stableBridge(code){
  return cutObserver(code,'let raf=0;const mo=new MutationObserver',"window.addEventListener('mawang:datachange'",'let raf=0;');
}
function stableFinal106(code){
  code=code.replaceAll('CF MWS V 1.0.6',BUILD);
  return cutObserver(code,'const observer=new MutationObserver',"window.addEventListener('mawang:datachange'",'');
}
function stableTier107(code){
  return cutObserver(code,'let busy=false;const observer=new MutationObserver',"window.addEventListener('DOMContentLoaded'",'let busy=false;');
}
function stableFinal108(code){
  return cutObserver(code,'let raf=0;const mo=new MutationObserver',"window.addEventListener('mawang:datachange'",'let raf=0;');
}
const evalPromises=new Map();
function fetchEval(src,key,transform,done){
  if(window[key]){done?.();return}
  if(!evalPromises.has(key)){
    const p=fetch(src,{cache:'no-store'})
      .then(r=>{if(!r.ok)throw new Error(`${src} ${r.status}`);return r.text()})
      .then(code=>{(0,eval)(transform?transform(code):code)})
      .catch(e=>{evalPromises.delete(key);console.error('MWS stable load failed',src,e);throw e});
    evalPromises.set(key,p);
  }
  evalPromises.get(key).then(()=>done?.()).catch(()=>{});
}
function pingTools(){
  clearTimeout(pingTools.t);
  pingTools.t=setTimeout(()=>{
    try{window.dispatchEvent(new Event('mawang:datachange'))}catch(_){ }
  },35);
}
document.addEventListener('click',e=>{
  if(e.target.closest('#toolTier,#toolMatrix,#toolRelations,.nav button[data-tab="toolTier"],.nav button[data-tab="toolMatrix"],.nav button[data-tab="toolRelations"]'))pingTools();
},true);
document.addEventListener('drop',e=>{
  if(e.target.closest('#toolTier,#toolMatrix,#toolRelations'))pingTools();
},true);

let installing=false;
function install(){
  if(installing)return;
  installing=true;
  stopOld();forceVersion();forcePlanner();
  load('/assets/content-planner-host-v104.js?v=1.0.4','mwsContentPlannerHostBaseV104',()=>{
    forcePlanner();forceVersion();
    load('/assets/tools-v1.0.5.js?v=1.0.5','mwsToolsScriptV105',()=>{
      fetchEval('/assets/tools-v1.0.6-bridge.js?v=1.0.8-stable','__mwsToolsBridgeV106',stableBridge,()=>{
        fetchEval('/assets/tools-v1.0.6-final.js?v=1.0.8-stable','__mwsToolsFinalV106',stableFinal106,()=>{
          fetchEval('/assets/tools-v1.0.7-tier.js?v=1.0.8-stable','__mwsTierVisualV107',stableTier107,()=>{
            fetchEval('/assets/tools-v1.0.8-final.js?v=1.0.8-stable2','__mwsToolsV108',stableFinal108,()=>{
              forceVersion();pingTools();
            });
          });
        });
      });
    });
  });
  setTimeout(()=>{installing=false},500);
}
window.addEventListener('DOMContentLoaded',install,{once:true});
window.addEventListener('load',install,{once:true});
if(document.readyState!=='loading')install();
[800,2200,5000].forEach(ms=>setTimeout(()=>{forceVersion();install()},ms));
})();
