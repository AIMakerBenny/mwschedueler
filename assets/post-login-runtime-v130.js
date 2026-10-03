/* Mawang Scheduler v1.6.21 - isolated post-login UI/runtime loader, Phase 173 */
(()=>{
'use strict';
if(window.__mwsPostLoginRuntimeV130)return;
window.__mwsPostLoginRuntimeV130=true;

const POST_LOGIN_LOAD_TIMEOUT_MS=6000;
const loaded=new Map();
const loadedStyles=new Map();

function load(key,src,flag){
  if(flag&&window[flag])return Promise.resolve({key,ok:true,source:'flag'});
  if(loaded.has(key))return loaded.get(key);
  const promise=new Promise(resolve=>{
    const script=document.createElement('script');
    let settled=false;
    let timer=0;
    const finish=(ok,source)=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      resolve({key,ok,source});
    };
    script.src=src;
    script.async=false;
    script.dataset.mwsPostLogin=key;
    script.onload=()=>finish(true,'loaded');
    script.onerror=()=>{console.error(`Post-login module failed: ${key}`);finish(false,'error')};
    timer=setTimeout(()=>{
      console.error(`Post-login module timed out: ${key}`);
      finish(false,'timeout');
    },POST_LOGIN_LOAD_TIMEOUT_MS);
    document.body.appendChild(script);
  });
  loaded.set(key,promise);
  return promise;
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
    let settled=false;
    let timer=0;
    const finish=(ok,source)=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      resolve({key,ok,source});
    };
    link.addEventListener('load',()=>finish(true,existing?'existing-pending':'created'),{once:true});
    link.addEventListener('error',()=>{
      console.error(`Post-login stylesheet failed: ${key}`);
      finish(false,'error');
    },{once:true});
    timer=setTimeout(()=>{
      console.error(`Post-login stylesheet timed out: ${key}`);
      finish(false,'timeout');
    },POST_LOGIN_LOAD_TIMEOUT_MS);
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
  window.__mwsPostLoginUiFailedV130=failed.length>0;
  if(!failed.length)return;
  console.error('Post-login UI degraded:',failed);
  try{window.dispatchEvent(new CustomEvent('mws:post-login-ui-error',{detail:{failed}}))}catch(_){}
}

function finishPostLoginUi(failed=[]){
  markCriticalUiFailure(failed);
  window.__mwsPostLoginUiReadyV130=true;
  try{window.dispatchEvent(new Event('mws:post-login-ui-ready'))}catch(_){}
  if(failed.length){
    requestAnimationFrame(()=>{
      const sync=document.getElementById('syncStatusText');
      if(sync)sync.textContent='일부 화면 구성 로딩 지연 · 기본 화면 사용 중';
    });
  }
}

function recordOptionalResults(results){
  const failed=(Array.isArray(results)?results:[]).filter(x=>!x?.ok).map(x=>x.key);
  window.__mwsPostLoginOptionalErrorsV130=failed;
}

let started=false;
async function start(){
  if(started)return;
  started=true;

  // These enhance the already-hydrated app but must never hold the login gate open.
  void Promise.all([
    load('perf-runtime','/assets/perf-runtime.js?v=1.4.0-phase113-contact-image-owner1','__mwsCf571Optimizer'),
    load('today-people-runtime-v130','/assets/today-people-runtime-v130.js?v=1.3.0-final68','__mwsTodayPeopleRuntimeV130'),
    load('contact-runtime-v130','/assets/contact-runtime-v130.js?v=1.3.0-search86','__mwsContactRuntimeV130')
  ]).then(recordOptionalResults).catch(()=>{});

  // Keep the primary device shell ordered first, but cap the wait.
  const deviceUiResult=await load('device-ui','/assets/device-ui.js?v=1.3.0-perf87');

  // The remaining shell helpers can load together. Every request is time-bounded.
  const criticalResults=await Promise.all([
    Promise.resolve(deviceUiResult),
    loadStyle('mobile-drawer-v130','/assets/mobile-drawer-v130.css?v=1.6.21-navfix1'),
    loadStyle('mobile-calendar-v130','/assets/mobile-calendar-v130.css?v=1.3.0-mobile-calendar-viewport-p29'),
    load('mobile-calendar-quick-add-v130','/assets/mobile-calendar-quick-add-v130.js?v=1.3.0-mobile-calendar-ui-p26','__mwsMobileCalendarQuickAddV130'),
    load('mobile-calendar-day-detail-v130','/assets/mobile-calendar-day-detail-v130.js?v=1.3.0-perf35','__mwsMobileCalendarDayDetailV130'),
    load('integrity-runtime-v130','/assets/integrity-runtime-v130.js?v=1.3.0-phase12','__mwsIntegrityRuntimeV130'),
    loadStyle('workspace-ui-v176','/assets/workspace-ui-v176.css?v=1.6.21-workspace176'),
    load('workspace-ui-v176','/assets/workspace-ui-v176.js?v=1.6.21-workspace176','__mwsWorkspaceUiV176')
  ]);
  const criticalFailures=criticalResults.filter(x=>!x?.ok).map(x=>x.key);

  // Authentication/data hydration already succeeded. Never leave the user trapped at
  // the login gate solely because a presentation/runtime asset stalled.
  finishPostLoginUi(criticalFailures);

  // Achievement/access extras are explicitly non-blocking after the shell is released.
  void Promise.all([
    load('achievement-media-v1621','/assets/achievement-media-v1621.js?v=1.6.21-phase107-cloud1','__mwsAchievementMediaRuntimeV1621'),
    loadStyle('achievement-gallery-v1621','/assets/achievement-gallery-v1621.css?v=1.6.21-phase111'),
    load('achievement-gallery-v1621','/assets/achievement-gallery-v1621.js?v=1.6.21-phase111','__mwsAchievementGalleryRuntimeV1621'),
    load('mobile-access-tools-v130','/assets/mobile-access-tools-v130.js?v=1.3.0-mobile-cleanup','__mwsMobileAccessToolsV130')
  ]).then(results=>{
    const previous=Array.isArray(window.__mwsPostLoginOptionalErrorsV130)?window.__mwsPostLoginOptionalErrorsV130:[];
    const failed=results.filter(x=>!x?.ok).map(x=>x.key);
    window.__mwsPostLoginOptionalErrorsV130=[...new Set([...previous,...failed])];
  }).catch(()=>{});
}

if(window.__mwsAppReadyV130)start();
else window.addEventListener('mws:app-ready',start,{once:true});
})();
