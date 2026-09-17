/* Mawang Scheduler v1.3.0 Cloudflare auth bootstrap */
(()=>{
'use strict';
if(window.__mwsCloudV120Bootstrap)return;
window.__mwsCloudV120Bootstrap=true;

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
  loaded.set(key,promise);return promise;
};
const loadOptionalScript=(key,src,flag)=>loadScript(key,src,flag).catch(error=>{console.error(error);return null});
const loadStyle=(key,href)=>{
  if(document.querySelector(`link[data-mws-feature-style="${key}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.mwsFeatureStyle=key;document.head.appendChild(link);
};

const loadAppVersion=()=>loadScript('app-version-v120','/assets/app-version-v120.js?v=1.3.0','__mwsAppVersionV120');
const loadCoreRuntime=()=>loadScript('cloud-core-v130','/assets/cloud-v1.1.js?v=1.3.0-directcore3','__mwsCloudV110Loaded');
const loadSoopFetchProxy=()=>loadOptionalScript('soop-fetch-proxy','/assets/soop-fetch-proxy-v123.js?v=1.2.5','__mwsSoopFetchProxyV124');
const loadFriendFinder=()=>loadOptionalScript('friend-finder-v120','/assets/friend-finder-v120.js?v=1.3.0','__mwsFriendFinderV120');
const loadV130Hotfix=()=>loadOptionalScript('v130-live-contact-fix','/assets/v130-live-contact-fix.js?v=1.3.0','__mwsV130LiveContactFix');
const loadTodayPeopleWheel=()=>loadOptionalScript('today-people-wheel','/assets/today-people-wheel-v117.js?v=1.2.0','__mwsTodayPeopleWheelV120');
const loadUiFixes=()=>loadOptionalScript('ui-fixes','/assets/ui-fixes-v121.js?v=1.2.1','__mwsUiFixesV121');
const loadSteamPicker=()=>loadOptionalScript('steam-picker','/assets/steam-game-v111.js?v=1.1.3','__mwsSteamGameV111');
const loadBossManager=()=>loadOptionalScript('boss-manager','/assets/boss-manager-v121.js?v=1.2.2','__mwsBossManagerV121');
const loadMajokuHost=()=>loadOptionalScript('majoku-host','/assets/majoku-host-fix-v114.js?v=1.2.2','__mwsMajokuHostFixV122');

/* Login gate must always remain interactive regardless of app state. */
const gateStyle=document.createElement('style');
gateStyle.id='mws-login-interaction-guard-v130';
gateStyle.textContent='#mwsAccessGate{pointer-events:auto!important;z-index:2147483000!important}#mwsAccessGate .mws-login-shell,#mwsAccessGate button,#mwsAccessGate input,#mwsAccessGate label,#mwsAccessGate form{pointer-events:auto!important}';
document.head.appendChild(gateStyle);

/* The legacy core opens `mawang_data`. Route that exact cache name to a fresh DB so a blocked old tab/database can never stall login initialization. */
try{
  if(window.indexedDB&&typeof window.indexedDB.open==='function'&&!window.__mwsIndexedDbV130Wrapped){
    const baseOpen=window.indexedDB.open.bind(window.indexedDB);
    Object.defineProperty(window.indexedDB,'open',{configurable:true,value:function(name,version){
      const safeName=String(name)==='mawang_data'?'mawang_data_v130_login3':name;
      return arguments.length>1?baseOpen(safeName,version):baseOpen(safeName);
    }});
    window.__mwsIndexedDbV130Wrapped=true;
  }
}catch(error){console.warn('IndexedDB compatibility wrapper unavailable',error)}

async function loadCalendarFeatures(){
  loadStyle('calendar-drag','/assets/calendar-drag-layout-fix.css?v=1.3.0');
  await loadSteamPicker();
  await Promise.all([loadUiFixes(),loadTodayPeopleWheel()]);
}
async function loadExportFeatures(){await loadBossManager()}
async function loadMajokuFeatures(){await loadBossManager();await loadMajokuHost()}
function ensureFeaturesForTab(tab){
  if(document.body.classList.contains('mws-gated'))return Promise.resolve();
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
  if(document.body.classList.contains('mws-gated'))return;
  const urls=['/assets/steam-game-v111.js?v=1.1.3','/assets/ui-fixes-v121.js?v=1.2.1','/assets/boss-manager-v121.js?v=1.2.2','/assets/majoku-host-fix-v114.js?v=1.2.2','/assets/v130-live-contact-fix.js?v=1.3.0'];
  for(const href of urls){if(document.querySelector(`link[rel="prefetch"][href="${href}"]`))continue;const link=document.createElement('link');link.rel='prefetch';link.as='script';link.href=href;document.head.appendChild(link)}
}

let optionalStarted=false;
function loadOptionalNetworkFeatures(){
  if(optionalStarted||document.body.classList.contains('mws-gated'))return;
  optionalStarted=true;
  Promise.resolve()
    .then(()=>loadSoopFetchProxy())
    .then(()=>loadFriendFinder())
    .then(()=>loadV130Hotfix())
    .catch(error=>console.error('Optional SOOP/Friend features failed',error));
  if('requestIdleCallback'in window)requestIdleCallback(prefetchFeatures,{timeout:3500});else setTimeout(prefetchFeatures,1200);
}
function armPostLoginFeatures(){
  if(!document.body.classList.contains('mws-gated')){loadOptionalNetworkFeatures();return}
  const observer=new MutationObserver(()=>{
    if(document.body.classList.contains('mws-gated'))return;
    observer.disconnect();
    loadOptionalNetworkFeatures();
    ensureFeaturesForTab(activeTab()).catch(()=>{});
  });
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
}

document.addEventListener('click',event=>{
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
    const el=document.getElementById('mwsLoginError');if(el)el.textContent='Cloudflare 로그인 모듈 로딩 실패: '+(error?.message||String(error));
    window.mwsApplyAppVersionV120?.();
  });
})();
