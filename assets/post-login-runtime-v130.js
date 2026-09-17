/* Mawang Scheduler v1.3.0 - isolated post-login UI/runtime loader */
(()=>{
'use strict';
if(window.__mwsPostLoginRuntimeV130)return;
window.__mwsPostLoginRuntimeV130=true;

const loaded=new Map();
const loadedStyles=new Map();
function load(key,src,flag){
  if(flag&&window[flag])return Promise.resolve();
  if(loaded.has(key))return loaded.get(key);
  const promise=new Promise(resolve=>{
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    script.dataset.mwsPostLogin=key;
    script.onload=()=>resolve();
    script.onerror=()=>{console.error(`Post-login module failed: ${key}`);resolve()};
    document.body.appendChild(script);
  });
  loaded.set(key,promise);return promise;
}
function loadStyle(key,href){
  if(loadedStyles.has(key))return loadedStyles.get(key);
  const existing=document.querySelector(`link[data-mws-post-login-style="${key}"]`);
  if(existing?.sheet){
    const ready=Promise.resolve({key,ok:true,source:'existing'});
    loadedStyles.set(key,ready);
    return ready;
  }
  const promise=new Promise(resolve=>{
    const link=existing||document.createElement('link');
    const finish=ok=>resolve({key,ok,source:existing?'existing-pending':'created'});
    link.addEventListener('load',()=>finish(true),{once:true});
    link.addEventListener('error',()=>{console.error(`Post-login stylesheet failed: ${key}`);finish(false)},{once:true});
    if(!existing){
      link.rel='stylesheet';
      link.href=href;
      link.dataset.mwsPostLoginStyle=key;
      document.head.appendChild(link);
    }
  });
  loadedStyles.set(key,promise);
  return promise;
}

let started=false;
async function start(){
  if(started)return;
  started=true;
  await load('perf-runtime','/assets/perf-runtime.js?v=1.3.0-post-login','__mwsCf571Optimizer');
  await load('test-v55','/assets/test-v5.5.js?v=1.3.0-post-login');
  await load('test-v56','/assets/test-v5.6.js?v=1.3.0-post-login');
  await load('device-ui','/assets/device-ui.js?v=1.3.0-mobile-cleanup');
  const styleResults=await Promise.all([
    loadStyle('mobile-drawer-v130','/assets/mobile-drawer-v130.css?v=1.3.0-mobile-cleanup'),
    loadStyle('mobile-calendar-v130','/assets/mobile-calendar-v130.css?v=1.3.0-mobile-cleanup')
  ]);
  window.__mwsPostLoginStyleErrorsV130=styleResults.filter(x=>!x.ok).map(x=>x.key);
  await load('mobile-access-tools-v130','/assets/mobile-access-tools-v130.js?v=1.3.0-mobile-cleanup','__mwsMobileAccessToolsV130');
  await load('mobile-calendar-quick-add-v130','/assets/mobile-calendar-quick-add-v130.js?v=1.3.0-mobile-cleanup','__mwsMobileCalendarQuickAddV130');
  window.__mwsPostLoginUiReadyV130=true;
  try{window.dispatchEvent(new Event('mws:post-login-ui-ready'))}catch(_){}
}

if(window.__mwsAppReadyV130)start();
else window.addEventListener('mws:app-ready',start,{once:true});
})();
