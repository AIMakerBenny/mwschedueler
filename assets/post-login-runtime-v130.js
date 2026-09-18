/* Mawang Scheduler v1.3.0 - isolated post-login UI/runtime loader */
(()=>{
'use strict';
if(window.__mwsPostLoginRuntimeV130)return;
window.__mwsPostLoginRuntimeV130=true;

const loaded=new Map();
const loadedStyles=new Map();
function load(key,src,flag){
  if(flag&&window[flag])return Promise.resolve({key,ok:true,source:'flag'});
  if(loaded.has(key))return loaded.get(key);
  const promise=new Promise(resolve=>{
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    script.dataset.mwsPostLogin=key;
    script.onload=()=>resolve({key,ok:true,source:'loaded'});
    script.onerror=()=>{console.error(`Post-login module failed: ${key}`);resolve({key,ok:false,source:'error'})};
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
function markCriticalUiFailure(keys){
  const failed=[...new Set(keys.filter(Boolean))];
  window.__mwsPostLoginUiErrorsV130=failed;
  window.__mwsPostLoginUiFailedV130=true;
  const message='로그인에는 성공했지만 화면 구성 파일을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.';
  const loginError=document.getElementById('mwsLoginError');
  if(loginError)loginError.textContent=message;
  const sync=document.getElementById('syncStatusText');
  if(sync)sync.textContent='화면 구성 로딩 실패';
  try{window.dispatchEvent(new CustomEvent('mws:post-login-ui-error',{detail:{failed}}))}catch(_){}
}

let started=false;
async function start(){
  if(started)return;
  started=true;
  await load('perf-runtime','/assets/perf-runtime.js?v=1.3.0-post-login','__mwsCf571Optimizer');
  await load('test-v55','/assets/test-v5.5.js?v=1.3.0-post-login');
  await load('test-v56','/assets/test-v5.6.js?v=1.3.0-post-login');

  const deviceUiResult=await load('device-ui','/assets/device-ui.js?v=1.3.0-mobile-cleanup');
  if(!deviceUiResult.ok){markCriticalUiFailure(['device-ui']);return;}

  const styleResults=await Promise.all([
    loadStyle('mobile-drawer-v130','/assets/mobile-drawer-v130.css?v=1.3.0-mobile-cleanup'),
    loadStyle('mobile-calendar-v130','/assets/mobile-calendar-v130.css?v=1.3.0-mobile-calendar-detail-media1')
  ]);
  window.__mwsPostLoginStyleErrorsV130=styleResults.filter(x=>!x.ok).map(x=>x.key);
  if(window.__mwsPostLoginStyleErrorsV130.length){markCriticalUiFailure(window.__mwsPostLoginStyleErrorsV130);return;}

  const quickAddResult=await load('mobile-calendar-quick-add-v130','/assets/mobile-calendar-quick-add-v130.js?v=1.3.0-mobile-cleanup','__mwsMobileCalendarQuickAddV130');
  if(!quickAddResult.ok){markCriticalUiFailure(['mobile-calendar-quick-add-v130']);return;}

  const dayDetailResult=await load('mobile-calendar-day-detail-v130','/assets/mobile-calendar-day-detail-v130.js?v=1.3.0-mobile-calendar-bugfix-p20','__mwsMobileCalendarDayDetailV130');
  if(!dayDetailResult.ok){markCriticalUiFailure(['mobile-calendar-day-detail-v130']);return;}

  const integrityResult=await load('integrity-runtime-v130','/assets/integrity-runtime-v130.js?v=1.3.0-phase12','__mwsIntegrityRuntimeV130');
  if(!integrityResult.ok){markCriticalUiFailure(['integrity-runtime-v130']);return;}

  const optionalResults=[];
  optionalResults.push(await load('mobile-access-tools-v130','/assets/mobile-access-tools-v130.js?v=1.3.0-mobile-cleanup','__mwsMobileAccessToolsV130'));
  window.__mwsPostLoginOptionalErrorsV130=optionalResults.filter(x=>!x.ok).map(x=>x.key);
  window.__mwsPostLoginUiFailedV130=false;
  window.__mwsPostLoginUiReadyV130=true;
  try{window.dispatchEvent(new Event('mws:post-login-ui-ready'))}catch(_){}
}

if(window.__mwsAppReadyV130)start();
else window.addEventListener('mws:app-ready',start,{once:true});
})();
