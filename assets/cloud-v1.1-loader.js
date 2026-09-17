/* Mawang Scheduler v1.2.0 Cloudflare auth bootstrap */
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

const loadSoopFetchProxy=()=>loadScript('soop-fetch-proxy','/assets/soop-fetch-proxy-v123.js?v=1.2.5','__mwsSoopFetchProxyV124');
const loadFriendFinder=()=>loadScript('friend-finder-v120','/assets/friend-finder-v120.js?v=1.2.1','__mwsFriendFinderV120');
const loadFriendLivePreview=()=>loadScript('friend-live-preview-v120','/assets/friend-live-preview-v120.js?v=1.2.1','__mwsFriendLivePreviewV120');
const loadTodayPeopleWheel=()=>loadScript('today-people-wheel','/assets/today-people-wheel-v117.js?v=1.2.0','__mwsTodayPeopleWheelV120');
const loadUiFixes=()=>loadScript('ui-fixes','/assets/ui-fixes-v121.js?v=1.2.1','__mwsUiFixesV121');
const loadSteamPicker=()=>loadScript('steam-picker','/assets/steam-game-v111.js?v=1.1.3','__mwsSteamGameV111');
const loadBossManager=()=>loadScript('boss-manager','/assets/boss-manager-v121.js?v=1.2.1','__mwsBossManagerV121');
const loadMajokuHost=()=>loadScript('majoku-host','/assets/majoku-host-fix-v114.js?v=1.2.0','__mwsMajokuHostFixV120');

async function loadCalendarFeatures(){
  loadStyle('calendar-drag','/assets/calendar-drag-layout-fix.css?v=1.1.3');
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
  const urls=['/assets/steam-game-v111.js?v=1.1.3','/assets/ui-fixes-v121.js?v=1.2.1','/assets/boss-manager-v121.js?v=1.2.1','/assets/majoku-host-fix-v114.js?v=1.2.0'];
  for(const href of urls){if(document.querySelector(`link[rel="prefetch"][href="${href}"]`))continue;const link=document.createElement('link');link.rel='prefetch';link.as='script';link.href=href;document.head.appendChild(link)}
}

document.addEventListener('click',event=>{
  const button=event.target?.closest?.('.nav button[data-tab]');
  if(button?.dataset?.tab)Promise.resolve(ensureFeaturesForTab(button.dataset.tab)).catch(()=>{});
},true);

loadSoopFetchProxy()
  .then(()=>loadFriendFinder())
  .then(()=>loadFriendLivePreview())
  .then(()=>fetch('/assets/cloud-v1.1.js?v=1.1.1',{cache:'no-store'}))
  .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text()})
  .then(code=>{
    code=code.replace("Math.max(0,Math.min(100,Math.round(Number(percent)||0));","Math.max(0,Math.min(100,Math.round(Number(percent)||0)));");
    const s=document.createElement('script');s.textContent=code;document.body.appendChild(s);
    installTabBridge();
    ensureFeaturesForTab(activeTab()).catch(()=>{});
    if('requestIdleCallback'in window)requestIdleCallback(prefetchFeatures,{timeout:3500});else setTimeout(prefetchFeatures,1200);
  })
  .catch(error=>{
    console.error('Cloudflare auth bootstrap failed',error);
    const el=document.getElementById('mwsLoginError');if(el)el.textContent='Cloudflare 로그인 모듈 로딩 실패: '+(error?.message||String(error));
    installTabBridge();ensureFeaturesForTab(activeTab()).catch(()=>{});
  });
})();
