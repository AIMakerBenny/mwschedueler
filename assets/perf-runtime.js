/* MAWANG Scheduler CF V5.7.1 - one-request public bootstrap + verified IndexedDB reuse */
(()=>{
  'use strict';
  if(window.__mwsCf571Optimizer)return;
  window.__mwsCf571Optimizer=true;

  const nativeFetch=window.fetch.bind(window);
  const BUILD='CF MWS V 1.0.6';
  const ETAG_KEY='mws_cf_v571_etag';
  const MANIFEST_KEY='mws_cf_v571_manifest';
  const MEDIA_BASE_KEY='mws_cf_v571_media_base';
  const DB_NAME='mawang_data';
  const DB_VERSION=3;
  const PARTS=['core','contacts','contactMeta','events','posts','miniGames','activity','clipboard','notebook'];
  let bundle=null;
  let bootstrapPromise=null;

  function syntheticJson(value,status=200,headers={}){
    return new Response(JSON.stringify(value),{
      status,
      headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-mws-cf571-synthetic':'1',...headers}
    });
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        for(const name of PARTS)if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'scope'});
        if(!db.objectStoreNames.contains('meta'))db.createObjectStore(name='meta',{keyPath:'key'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));
    });
  }

  async function getCachedPart(part,scope='public'){
    if(!PARTS.includes(part)||!('indexedDB' in window))return null;
    let db;
    try{
      db=await openDb();
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(part,'readonly');
        const req=tx.objectStore(part).get(scope);
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error);
      });
    }catch(_){return null}
    finally{try{db?.close()}catch(_){}}
  }

  async function persistBundle(body){
    if(!body?.parts||!('indexedDB' in window))return;
    try{
      const db=await openDb();
      await Promise.all(PARTS.map(part=>new Promise((resolve,reject)=>{
        const row=body.parts[part];
        if(!row){resolve();return}
        const tx=db.transaction(part,'readwrite');
        const os=tx.objectStore(part);
        const entry={version:Number(row.version)||0,data:row.data,cachedAt:Date.now()};
        os.put({scope:'public',...entry});
        os.put({scope:'admin',...entry});
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error);
      })));
      db.close();
    }catch(e){console.warn('CF V5.7.1 bundle cache write failed',e)}
  }

  async function hasCompleteCache(manifest){
    if(!manifest?.parts)return false;
    for(const part of PARTS){
      const wanted=Number(manifest.parts[part])||0;
      if(!wanted)continue;
      const row=await getCachedPart(part,'public');
      if(!row||Number(row.version)!==wanted)return false;
    }
    return true;
  }

  async function requestBootstrap(useEtag=true){
    const headers={};
    const savedEtag=useEtag?localStorage.getItem(ETAG_KEY):'';
    if(savedEtag)headers['If-None-Match']=savedEtag;
    const res=await nativeFetch('/api/bootstrap',{method:'GET',headers,cache:'no-store'});

    if(res.status===304){
      let savedManifest=null;
      try{savedManifest=JSON.parse(localStorage.getItem(MANIFEST_KEY)||'null')}catch(_){}
      const complete=savedManifest?await hasCompleteCache(savedManifest):false;
      if((!savedManifest||!complete)&&useEtag){
        localStorage.removeItem(ETAG_KEY);
        return requestBootstrap(false);
      }
      const savedBase=localStorage.getItem(MEDIA_BASE_KEY)||'';
      if(savedBase)window.__mwsCf57MediaBaseUrl=savedBase;
      return {status:304,manifest:savedManifest,bundle:null};
    }

    if(!res.ok)return {raw:res};
    const body=await res.json();
    const etag=res.headers.get('etag')||`"${body?.globalVersion||'cf571'}"`;
    bundle=body;
    if(body?.mediaBaseUrl)window.__mwsCf57MediaBaseUrl=body.mediaBaseUrl;
    try{
      localStorage.setItem(ETAG_KEY,etag);
      localStorage.setItem(MANIFEST_KEY,JSON.stringify(body.manifest||null));
      if(body?.mediaBaseUrl)localStorage.setItem(MEDIA_BASE_KEY,body.mediaBaseUrl);
    }catch(_){}
    await persistBundle(body);
    return {status:200,manifest:body.manifest,bundle:body};
  }

  function getBootstrap(){
    if(bundle)return Promise.resolve({status:200,manifest:bundle.manifest,bundle});
    if(bootstrapPromise)return bootstrapPromise;
    bootstrapPromise=requestBootstrap(true).finally(()=>{bootstrapPromise=null});
    return bootstrapPromise;
  }

  window.fetch=async function(input,init={}){
    const raw=typeof input==='string'?input:(input?.url||'');
    let url;
    try{url=new URL(raw,location.href)}catch(_){return nativeFetch(input,init)}
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    if(url.origin!==location.origin||method!=='GET')return nativeFetch(input,init);

    if(url.pathname==='/api/health'){
      return syntheticJson({ok:true,env:'cloudflare-production',backend:'D1 + R2',optimized:BUILD,mediaMode:'r2-public-direct'});
    }

    if(url.pathname==='/api/manifest'){
      const result=await getBootstrap();
      if(result.raw)return result.raw;
      return syntheticJson(result.manifest||{parts:{},scope:'public',cacheSchemaVersion:DB_VERSION,backend:'cloudflare-d1'});
    }

    if(url.pathname.startsWith('/api/parts/')){
      const part=decodeURIComponent(url.pathname.slice('/api/parts/'.length));
      const result=await getBootstrap();
      if(result.raw)return result.raw;
      const bundled=result.bundle?.parts?.[part];
      if(bundled)return syntheticJson(bundled);
      const cached=await getCachedPart(part,'public');
      const wanted=Number(result.manifest?.parts?.[part])||0;
      if(cached&&(!wanted||Number(cached.version)===wanted)){
        return syntheticJson({part,version:Number(cached.version)||wanted||1,data:cached.data});
      }
      try{localStorage.removeItem(ETAG_KEY)}catch(_){}
      const refreshed=await requestBootstrap(false);
      if(refreshed.raw)return refreshed.raw;
      const row=refreshed.bundle?.parts?.[part];
      if(row)return syntheticJson(row);
      return syntheticJson({error:`Part unavailable after bootstrap: ${part}`},503);
    }

    return nativeFetch(input,init);
  };

  function forceVersion(){
    try{
      document.body?.setAttribute('data-build-version',BUILD);
      document.querySelectorAll('[id^="mwsBuildVersionV5"], .sidebar-build-version-v52, .sidebar-build-version-v53, [class*="sidebar-build-version"]').forEach(label=>label.textContent=BUILD);
    }catch(_){}
  }

  function loadRuntimePatch(){
    if(document.getElementById('mwsCf571RuntimeScript'))return;
    const s=document.createElement('script');
    s.id='mwsCf571RuntimeScript';
    s.src='assets/cf-v5.7-runtime.js?v=5.7.1';
    document.body.appendChild(s);
  }

  function loadContentPlannerHostV106(){
    if(document.getElementById('mwsContentPlannerHostScriptV106'))return;
    const s=document.createElement('script');
    s.id='mwsContentPlannerHostScriptV106';
    s.src='assets/content-planner-host.js?v=1.0.6';
    document.body.appendChild(s);
  }

  const PAGE_SCALE_KEY_V101='mws_page_text_scales_v54';
  const clampPageScaleV101=value=>Math.max(70,Math.min(180,Math.round((Number(value)||100)/5)*5));

  function pageScaleMapV101(){
    try{
      const value=JSON.parse(localStorage.getItem(PAGE_SCALE_KEY_V101)||'{}');
      return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    }catch(_){return {}}
  }

  function activePageIdV101(){return document.querySelector('.section.active')?.id||'dashboard'}
  function pageScaleV101(id=activePageIdV101()){return clampPageScaleV101(pageScaleMapV101()[id]||100)}
  function globalTextScaleV101(){
    try{return Math.max(80,Math.min(200,Number(data?.textScale)||100))}catch(_){return 100}
  }

  function ensurePageScaleStyleV101(){
    if(document.getElementById('mws-cf-v101-page-scale-style'))return;
    const style=document.createElement('style');
    style.id='mws-cf-v101-page-scale-style';
    style.textContent='.main{overflow-x:auto!important}.section{transform-origin:top left}';
    document.head.appendChild(style);
  }

  function applyPageLayoutScaleV101(){
    ensurePageScaleStyleV101();
    const global=globalTextScaleV101();
    const globalRatio=global/100;
    const scales=pageScaleMapV101();
    const supportsZoom=typeof document!=='undefined'&&document.documentElement&&('zoom' in document.documentElement.style);
    document.querySelectorAll('.section').forEach(sec=>{
      const local=clampPageScaleV101(scales[sec.id]||100);
      if(supportsZoom){
        sec.style.setProperty('--ui-text-scale',String(globalRatio));
        sec.style.fontSize=`calc(14px * ${globalRatio})`;
        sec.style.zoom=String(local/100);
      }else{
        const combined=(global*local)/100;
        sec.style.setProperty('--ui-text-scale',String(combined/100));
        sec.style.fontSize=`calc(14px * ${combined/100})`;
      }
    });
    const current=pageScaleV101();
    const label=document.getElementById('pageTextScaleValueV54');
    if(label)label.textContent=`페이지 ${current}%`;
    const control=document.getElementById('pageTextScaleControlV54');
    if(control)control.title='현재 페이지의 텍스트와 카드, 버튼 등 UI 크기를 함께 조절합니다. 개인 브라우저에 저장됩니다.';
    document.body?.style.setProperty('--mws-page-layout-scale',String(current/100));
  }

  function wrapPageScaleFunctionV101(name){
    const current=window[name];
    if(typeof current!=='function'||current.__mwsV101PageScaleBridge)return;
    const wrapped=function(){
      const out=current.apply(this,arguments);
      queueMicrotask(applyPageLayoutScaleV101);
      return out;
    };
    wrapped.__mwsV101PageScaleBridge=true;
    wrapped.__mwsV101PageScaleBase=current;
    window[name]=wrapped;
  }

  function installPageScaleBridgeV101(){
    wrapPageScaleFunctionV101('setPageTextScaleV54');
    wrapPageScaleFunctionV101('setTab');
    wrapPageScaleFunctionV101('applyTextScale');
    wrapPageScaleFunctionV101('renderMultiDraw');
    applyPageLayoutScaleV101();
  }

  function installReleaseVersionGuardV101(){
    forceVersion();
    const body=document.body;
    if(body&&!body.__mwsV101BuildObserver){
      const observer=new MutationObserver(()=>{if(body.getAttribute('data-build-version')!==BUILD)forceVersion()});
      observer.observe(body,{attributes:true,attributeFilter:['data-build-version']});
      body.__mwsV101BuildObserver=observer;
    }
    const label=document.querySelector('[id^="mwsBuildVersionV5"], .sidebar-build-version-v52, .sidebar-build-version-v53, [class*="sidebar-build-version"]');
    if(label&&!label.__mwsV101BuildObserver){
      const observer=new MutationObserver(()=>{if(label.textContent!==BUILD)forceVersion()});
      observer.observe(label,{childList:true,characterData:true,subtree:true});
      label.__mwsV101BuildObserver=observer;
    }
  }

  window.mwsV101ApplyPageLayoutScale=applyPageLayoutScaleV101;
  window.addEventListener('DOMContentLoaded',()=>{forceVersion();installReleaseVersionGuardV101();installPageScaleBridgeV101();loadContentPlannerHostV106()},{once:true});
  window.addEventListener('load',()=>{forceVersion();loadRuntimePatch();installReleaseVersionGuardV101();installPageScaleBridgeV101();loadContentPlannerHostV106()},{once:true});
  window.addEventListener('mawang:datachange',()=>setTimeout(()=>{installReleaseVersionGuardV101();installPageScaleBridgeV101()},0));
  [50,150,350,800,1500,3000,6000,9000].forEach(ms=>setTimeout(()=>{installReleaseVersionGuardV101();installPageScaleBridgeV101()},ms));
  let tries=0;const versionTimer=setInterval(()=>{forceVersion();if(++tries>=32)clearInterval(versionTimer)},250);
  if(document.readyState!=='loading')setTimeout(loadContentPlannerHostV106,0);

  if(document.readyState==='loading'){
    document.write('<script src="assets/perf-runtime-base.js?v=5.7.1"><\/script>');
  }else{
    const s=document.createElement('script');s.src='assets/perf-runtime-base.js?v=5.7.1';document.head.appendChild(s);
  }
})();
