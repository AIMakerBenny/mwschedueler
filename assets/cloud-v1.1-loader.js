/* Mawang Scheduler v1.3.0 Cloudflare auth bootstrap */
(()=>{
'use strict';
if(window.__mwsCloudV120Bootstrap)return;
window.__mwsCloudV120Bootstrap=true;

const loaded=new Map();
const loadScript=(key,src,flag)=>{
  if(flag&&window[flag])return Promise.resolve();
  if(loaded.has(key))return loaded.get(key);
  const promise=new Promise(resolve=>{
    const existing=document.querySelector(`script[data-mws-feature="${key}"]`);
    if(existing){if(existing.dataset.mwsLoaded==='1'){resolve();return}existing.addEventListener('load',()=>resolve(),{once:true});existing.addEventListener('error',()=>resolve(),{once:true});return}
    const s=document.createElement('script');s.src=src;s.async=false;s.dataset.mwsFeature=key;s.onload=()=>{s.dataset.mwsLoaded='1';resolve()};s.onerror=()=>{console.error(`${key} loading failed`);resolve()};document.body.appendChild(s);
  });
  loaded.set(key,promise);return promise;
};
const loadStyle=(key,href)=>{
  if(document.querySelector(`link[data-mws-feature-style="${key}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.mwsFeatureStyle=key;document.head.appendChild(link);
};

const loadAppVersion=()=>loadScript('app-version-v120','/assets/app-version-v120.js?v=1.3.0','__mwsAppVersionV120');
const loadSoopFetchProxy=()=>loadScript('soop-fetch-proxy','/assets/soop-fetch-proxy-v123.js?v=1.2.5','__mwsSoopFetchProxyV124');
const loadFriendFinder=()=>loadScript('friend-finder-v120','/assets/friend-finder-v120.js?v=1.3.0','__mwsFriendFinderV120');
const loadV130Hotfix=()=>loadScript('v130-live-contact-fix','/assets/v130-live-contact-fix.js?v=1.3.0','__mwsV130LiveContactFix');
const loadTodayPeopleWheel=()=>loadScript('today-people-wheel','/assets/today-people-wheel-v117.js?v=1.2.0','__mwsTodayPeopleWheelV120');
const loadUiFixes=()=>loadScript('ui-fixes','/assets/ui-fixes-v121.js?v=1.2.1','__mwsUiFixesV121');
const loadSteamPicker=()=>loadScript('steam-picker','/assets/steam-game-v111.js?v=1.1.3','__mwsSteamGameV111');
const loadBossManager=()=>loadScript('boss-manager','/assets/boss-manager-v121.js?v=1.2.2','__mwsBossManagerV121');
const loadMajokuHost=()=>loadScript('majoku-host','/assets/majoku-host-fix-v114.js?v=1.2.2','__mwsMajokuHostFixV122');

async function loadCalendarFeatures(){
  loadStyle('calendar-drag','/assets/calendar-drag-layout-fix.css?v=1.3.0');
  await loadSteamPicker();
  await Promise.all([loadUiFixes(),loadTodayPeopleWheel()]);
}
async function loadExportFeatures(){await loadBossManager()}
async function loadMajokuFeatures(){await loadBossManager();await loadMajokuHost()}
function ensureFeaturesForTab(tab){
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
  wrapped.__mwsFeatureGateV122=true;window.setTab=wrapped;try{setTab=wrapped}catch(_){}
}
function activeTab(){
  const section=document.querySelector('.section.active');
  if(section?.id)return section.id;
  return document.querySelector('.nav button.active[data-tab]')?.dataset?.tab||'';
}
function prefetchFeatures(){
  const urls=['/assets/steam-game-v111.js?v=1.1.3','/assets/ui-fixes-v121.js?v=1.2.1','/assets/boss-manager-v121.js?v=1.2.2','/assets/majoku-host-fix-v114.js?v=1.2.2','/assets/v130-live-contact-fix.js?v=1.3.0'];
  for(const href of urls){if(document.querySelector(`link[rel="prefetch"][href="${href}"]`))continue;const link=document.createElement('link');link.rel='prefetch';link.as='script';link.href=href;document.head.appendChild(link)}
}

function loadOptionalNetworkFeatures(){
  Promise.resolve()
    .then(()=>loadSoopFetchProxy())
    .then(()=>loadFriendFinder())
    .then(()=>loadV130Hotfix())
    .catch(error=>console.error('Optional SOOP/Friend features failed',error));
}

function patchCoreRuntime(source){
  let code=String(source||'');
  code=code.replace("Math.max(0,Math.min(100,Math.round(Number(percent)||0));","Math.max(0,Math.min(100,Math.round(Number(percent)||0)));");

  /* Login freeze fix: never reuse the old IndexedDB connection that can remain blocked after schema changes. */
  code=code.replace("const CACHE_DB='mawang_data';","const CACHE_DB='mawang_data_v130';");

  /* A blocked IndexedDB upgrade must reject instead of waiting forever. */
  code=code.replace(
    "req.onerror=()=>reject(req.error||new Error('IndexedDB 열기 실패'));req.onsuccess=()=>resolve(req.result)",
    "req.onblocked=()=>reject(new Error('IndexedDB 열기가 차단되었습니다.'));req.onerror=()=>reject(req.error||new Error('IndexedDB 열기 실패'));req.onsuccess=()=>resolve(req.result)"
  );

  /* Cache is an optimization only. It is never allowed to hold the login/data hydration path. */
  code=code.replace(
    "async function getCachedPart(scope,part){if(!CACHE_STORES.includes(part))return null;try{return await idbTx(part,'readonly',os=>os.get(scope))||null}catch(_){return null}}",
    "async function getCachedPart(scope,part){if(!CACHE_STORES.includes(part))return null;try{return await timeout(idbTx(part,'readonly',os=>os.get(scope)),1200,'IndexedDB 캐시')||null}catch(_){return null}}"
  );
  code=code.replace(
    "async function putCachedPart(scope,part,version,value){if(!CACHE_STORES.includes(part))return;try{await idbTx(part,'readwrite',os=>os.put({scope,version:Number(version)||0,data:clone(value),cachedAt:Date.now()}))}catch(_){}}",
    "async function putCachedPart(scope,part,version,value){if(!CACHE_STORES.includes(part))return;try{await timeout(idbTx(part,'readwrite',os=>os.put({scope,version:Number(version)||0,data:clone(value),cachedAt:Date.now()})),1200,'IndexedDB 캐시 저장')}catch(_){}}"
  );

  /* Bind the form first. Cache validation runs in the background and cannot make the login screen inert. */
  code=code.replace(
    "async function init(){await validateCacheSchema();installSaveBridge();bindUi();selectLoginMode('admin');",
    "async function init(){installSaveBridge();bindUi();selectLoginMode('admin');Promise.resolve(validateCacheSchema()).catch(()=>{});"
  );

  return code;
}

function startCoreRuntime(){
  return fetch('/assets/cloud-v1.1.js?v=1.3.0-loginfix2',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text()})
    .then(source=>{
      const code=patchCoreRuntime(source);
      const s=document.createElement('script');s.textContent=code;s.dataset.mwsCoreRuntime='v1.3.0-loginfix2';document.body.appendChild(s);
      window.mwsApplyAppVersionV120?.();
      installTabBridge();
      ensureFeaturesForTab(activeTab()).catch(()=>{});
      if('requestIdleCallback'in window)requestIdleCallback(prefetchFeatures,{timeout:3500});else setTimeout(prefetchFeatures,1200);
      /* Authentication/login core must never wait on SOOP or Friend Finder. */
      setTimeout(loadOptionalNetworkFeatures,0);
    });
}

document.addEventListener('click',event=>{
  const button=event.target?.closest?.('.nav button[data-tab]');
  if(button?.dataset?.tab)Promise.resolve(ensureFeaturesForTab(button.dataset.tab)).catch(()=>{});
},true);

loadAppVersion()
  .then(()=>startCoreRuntime())
  .catch(error=>{
    console.error('Cloudflare auth bootstrap failed',error);
    const el=document.getElementById('mwsLoginError');if(el)el.textContent='Cloudflare 로그인 모듈 로딩 실패: '+(error?.message||String(error));
    window.mwsApplyAppVersionV120?.();
    installTabBridge();ensureFeaturesForTab(activeTab()).catch(()=>{});
  });
})();
