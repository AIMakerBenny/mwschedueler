/* Mawang Scheduler v1.3.0 - isolated auth/bootstrap loader */
(()=>{
'use strict';
if(window.__mwsCloudV120Bootstrap||window.__mwsCloudRuntimeLoaderV130)return;
window.__mwsCloudV120Bootstrap=true;
window.__mwsCloudRuntimeLoaderV130=true;

const loaded=new Map();
const loadScript=(key,src,flag)=>{
  if(flag&&window[flag])return Promise.resolve();
  if(loaded.has(key))return loaded.get(key);
  const promise=new Promise((resolve,reject)=>{
    const existing=document.querySelector(`script[data-mws-feature="${key}"]`);
    if(existing){
      if(existing.dataset.mwsLoaded==='1'){resolve();return}
      existing.addEventListener('load',()=>resolve(),{once:true});
      existing.addEventListener('error',()=>reject(new Error(`${key} loading failed`)),{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.dataset.mwsFeature=key;
    s.onload=()=>{s.dataset.mwsLoaded='1';resolve()};
    s.onerror=()=>reject(new Error(`${key} loading failed`));
    document.body.appendChild(s);
  });
  loaded.set(key,promise);
  return promise;
};
const loadOptionalScript=(key,src,flag)=>loadScript(key,src,flag).catch(error=>{console.error(error);return null});
const loadStyle=(key,href)=>{
  if(document.querySelector(`link[data-mws-feature-style="${key}"]`))return;
  const link=document.createElement('link');
  link.rel='stylesheet';link.href=href;link.dataset.mwsFeatureStyle=key;
  document.head.appendChild(link);
};

const loadAppVersion=()=>loadScript('app-version-v120','/assets/app-version-v120.js?v=1.3.0','__mwsAppVersionV120');
const loadCoreRuntime=()=>loadScript('cloud-core-v130','/assets/cloud-runtime-v130.js?v=1.3.0-stage65','__mwsCloudRuntimeV130');
const loadSoopFetchProxy=()=>loadOptionalScript('soop-fetch-proxy','/assets/soop-fetch-proxy-v123.js?v=1.2.5','__mwsSoopFetchProxyV124');
const loadFriendFinder=()=>loadOptionalScript('friend-finder-v120','/assets/friend-finder-v120.js?v=1.3.0-phase62','__mwsFriendFinderV120');
const loadV130Hotfix=()=>loadOptionalScript('v130-live-contact-fix','/assets/v130-live-contact-fix.js?v=1.3.0-perf31','__mwsV130LiveContactFix');
const loadTodayPeopleWheel=()=>loadOptionalScript('today-people-wheel','/assets/today-people-wheel-v117.js?v=1.2.0','__mwsTodayPeopleWheelV120');
const loadUiFixes=()=>loadOptionalScript('ui-fixes','/assets/ui-fixes-v121.js?v=1.2.3-perf44','__mwsUiFixesV121');
const loadSteamPicker=()=>loadOptionalScript('steam-picker','/assets/steam-game-v111.js?v=1.1.4-perf30','__mwsSteamGameV111');
const loadBossManager=()=>loadOptionalScript('boss-manager','/assets/boss-manager-v121.js?v=1.2.2','__mwsBossManagerV121');
const loadMajokuHost=()=>loadOptionalScript('majoku-host','/assets/majoku-host-fix-v114.js?v=1.2.2','__mwsMajokuHostFixV122');

/* Login gate stays independent and interactive. No cache, UI, calendar or LIVE runtime is started here. */
const gateStyle=document.createElement('style');
gateStyle.id='mws-login-interaction-guard-v130';
gateStyle.textContent='#mwsAccessGate{pointer-events:auto!important;z-index:2147483000!important}#mwsAccessGate .mws-login-shell,#mwsAccessGate button,#mwsAccessGate input,#mwsAccessGate label,#mwsAccessGate form{pointer-events:auto!important}';
document.head.appendChild(gateStyle);

async function loadCalendarFeatures(){
  loadStyle('calendar-drag','/assets/calendar-drag-layout-fix.css?v=1.3.0');
  await loadSteamPicker();
  await Promise.all([loadUiFixes(),loadTodayPeopleWheel()]);
}
async function loadExportFeatures(){await loadBossManager()}
async function loadMajokuFeatures(){await loadBossManager();await loadMajokuHost()}
function ensureFeaturesForTab(tab){
  if(!window.__mwsAppReadyV130)return Promise.resolve();
  if(tab==='calendar')return loadCalendarFeatures();
  if(tab==='export')return loadExportFeatures();
  if(tab==='gameMajoku')return loadMajokuFeatures();
  return Promise.resolve();
}
window.mwsLoadFeaturesForTabV122=ensureFeaturesForTab;

function installTabBridge(){
  const current=window.setTab;
  if(typeof current!=='function'||current.__mwsFeatureGateV122)return;
  const wrapped=function(tab){const out=current.apply(this,arguments);Promise.resolve(ensureFeaturesForTab(tab)).catch(()=>{});return out};
  wrapped.__mwsFeatureGateV122=true;
  window.setTab=wrapped;
  try{setTab=wrapped}catch(_){}
}
function activeTab(){
  const section=document.querySelector('.section.active');
  if(section?.id)return section.id;
  return document.querySelector('.nav button.active[data-tab]')?.dataset?.tab||'';
}
function prefetchFeatures(){
  if(!window.__mwsAppReadyV130)return;
  const urls=['/assets/steam-game-v111.js?v=1.1.4-perf30','/assets/ui-fixes-v121.js?v=1.2.3-perf44','/assets/boss-manager-v121.js?v=1.2.2','/assets/majoku-host-fix-v114.js?v=1.2.2','/assets/v130-live-contact-fix.js?v=1.3.0-perf31'];
  for(const href of urls){
    if(document.querySelector(`link[rel="prefetch"][href="${href}"]`))continue;
    const link=document.createElement('link');link.rel='prefetch';link.as='script';link.href=href;document.head.appendChild(link);
  }
}

let optionalStarted=false;
function startPostLoginFeatures(){
  if(optionalStarted||!window.__mwsAppReadyV130)return;
  optionalStarted=true;
  installTabBridge();
  Promise.resolve()
    .then(()=>loadSoopFetchProxy())
    .then(()=>loadFriendFinder())
    .then(()=>loadV130Hotfix())
    .catch(error=>console.error('Optional SOOP/Friend features failed',error));
  ensureFeaturesForTab(activeTab()).catch(()=>{});
  if('requestIdleCallback'in window)requestIdleCallback(prefetchFeatures,{timeout:3500});else setTimeout(prefetchFeatures,1200);
}
function armPostLoginFeatures(){
  if(window.__mwsAppReadyV130){startPostLoginFeatures();return}
  window.addEventListener('mws:app-ready',startPostLoginFeatures,{once:true});
}

document.addEventListener('click',event=>{
  if(!window.__mwsAppReadyV130)return;
  const button=event.target?.closest?.('.nav button[data-tab]');
  if(button?.dataset?.tab)Promise.resolve(ensureFeaturesForTab(button.dataset.tab)).catch(()=>{});
},true);

loadAppVersion()
  .then(()=>loadCoreRuntime())
  .then(()=>{
    window.mwsApplyAppVersionV120?.();
    installTabBridge();
    armPostLoginFeatures();
  })
  .catch(error=>{
    console.error('Cloudflare auth bootstrap failed',error);
    const el=document.getElementById('mwsLoginError');
    if(el)el.textContent='Cloudflare 로그인 모듈 로딩 실패: '+(error?.message||String(error));
    window.mwsApplyAppVersionV120?.();
  });
})();
