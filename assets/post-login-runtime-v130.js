/* Mawang Scheduler v1.3.0 - isolated post-login UI/runtime loader */
(()=>{
'use strict';
if(window.__mwsPostLoginRuntimeV130)return;
window.__mwsPostLoginRuntimeV130=true;

const loaded=new Map();
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
  loaded.set(key,promise);
  return promise;
}
function loadStyle(key,href){
  const existing=document.querySelector(`link[data-mws-post-login-style="${key}"]`);
  if(existing)return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=href;
  link.dataset.mwsPostLoginStyle=key;
  document.head.appendChild(link);
}

let started=false;
async function start(){
  if(started)return;
  started=true;
  await load('perf-runtime','/assets/perf-runtime.js?v=1.3.0-post-login','__mwsCf571Optimizer');
  await load('test-v55','/assets/test-v5.5.js?v=1.3.0-post-login');
  await load('test-v56','/assets/test-v5.6.js?v=1.3.0-post-login');
  await load('device-ui','/assets/device-ui.js?v=1.3.0-post-login');
  loadStyle('mobile-drawer-v130','/assets/mobile-drawer-v130.css?v=1.3.0-drawer-fix');
  window.__mwsPostLoginUiReadyV130=true;
  try{window.dispatchEvent(new Event('mws:post-login-ui-ready'))}catch(_){}
}

if(window.__mwsAppReadyV130)start();
else window.addEventListener('mws:app-ready',start,{once:true});
})();
