/* Mawang Scheduler v1.3.0 - lean bootstrap and lossless image policy */
(()=>{
  'use strict';
  if(window.__mwsCf571Optimizer)return;
  window.__mwsCf571Optimizer=true;

  const nativeFetch=window.fetch.bind(window);
  const version=(window.version&&typeof window.version==='object')?window.version:(window.version={});
  version.name='Mawang Scheduler v 1.4.0';
  const BUILD=version.name;
  const ETAG_KEY='mws_cf_v571_etag';
  const MANIFEST_KEY='mws_cf_v571_manifest';
  const MEDIA_BASE_KEY='mws_cf_v571_media_base';
  const DB_NAME='mawang_data_v130';
  const DB_VERSION=3;
  const PARTS=['core','contacts','contactMeta','events','posts','miniGames','activity','clipboard','notebook'];
  let bundle=null;
  let bootstrapPromise=null;
  let dbPromise=null;
  let postLoginStarted=false;

  const idle=(fn,timeout=1800)=>{
    if('requestIdleCallback' in window)return requestIdleCallback(fn,{timeout});
    return setTimeout(fn,Math.min(timeout,250));
  };

  /* Image quality rule: never resize, recompress, or transcode user images. */
  const preserveOriginalImage=async value=>value||'';
  function installLosslessImagePolicy(){
    try{window.compressContactImage=preserveOriginalImage;compressContactImage=preserveOriginalImage}catch(_){}
    try{window.compressFolderContactPhotoV417=preserveOriginalImage;compressFolderContactPhotoV417=preserveOriginalImage}catch(_){}
    window.mwsV571CompressProfileImage=preserveOriginalImage;
    window.mwsV57CompressProfileImage=preserveOriginalImage;
    window.__mwsLosslessImagesV122=true;
  }
  installLosslessImagePolicy();

  function syntheticJson(value,status=200,headers={}){
    return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-mws-cf571-synthetic':'1',...headers}});
  }

  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return}
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        for(const name of PARTS)if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'scope'});
        if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'key'});
      };
      req.onblocked=()=>{dbPromise=null;reject(new Error('IndexedDB open blocked'))};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>{dbPromise=null;reject(req.error||new Error('IndexedDB open failed'))};
    });
    return dbPromise;
  }

  async function getCachedPart(part,scope='public',db=null){
    if(!PARTS.includes(part)||!('indexedDB' in window))return null;
    try{
      const handle=db||await openDb();
      return await new Promise((resolve,reject)=>{
        const tx=handle.transaction(part,'readonly');
        const req=tx.objectStore(part).get(scope);
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error);
      });
    }catch(_){return null}
  }

  async function persistBundle(body){
    if(!body?.parts||!('indexedDB' in window))return;
    try{
      const db=await openDb();
      await Promise.all(PARTS.map(part=>new Promise((resolve,reject)=>{
        const row=body.parts[part];
        if(!row){resolve();return}
        const tx=db.transaction(part,'readwrite');
        const entry={version:Number(row.version)||0,data:row.data,cachedAt:Date.now()};
        const os=tx.objectStore(part);
        os.put({scope:'public',...entry});
        os.put({scope:'admin',...entry});
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error);
      })));
    }catch(error){console.warn('Mawang cache write skipped',error)}
  }

  async function hasCompleteCache(manifest){
    if(!manifest?.parts||!('indexedDB' in window))return false;
    try{
      const db=await openDb();
      const checks=await Promise.all(PARTS.map(async part=>{
        const wanted=Number(manifest.parts[part])||0;
        if(!wanted)return true;
        const row=await getCachedPart(part,'public',db);
        return Boolean(row&&Number(row.version)===wanted);
      }));
      return checks.every(Boolean);
    }catch(_){return false}
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
      if((!savedManifest||!complete)&&useEtag){localStorage.removeItem(ETAG_KEY);return requestBootstrap(false)}
      const savedBase=localStorage.getItem(MEDIA_BASE_KEY)||'';
      if(savedBase)window.__mwsCf57MediaBaseUrl=savedBase;
      return {status:304,manifest:savedManifest,bundle:null};
    }

    if(!res.ok)return {raw:res};
    const body=await res.json();
    const etag=res.headers.get('etag')||`"${body?.globalVersion||'mws-v1'}"`;
    bundle=body;
    if(body?.mediaBaseUrl)window.__mwsCf57MediaBaseUrl=body.mediaBaseUrl;
    try{
      localStorage.setItem(ETAG_KEY,etag);
      localStorage.setItem(MANIFEST_KEY,JSON.stringify(body.manifest||null));
      if(body?.mediaBaseUrl)localStorage.setItem(MEDIA_BASE_KEY,body.mediaBaseUrl);
    }catch(_){}
    /* Cache persistence is non-blocking. The in-memory bundle serves this session immediately. */
    idle(()=>persistBundle(body),2200);
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
    if(url.pathname==='/api/health')return syntheticJson({ok:true,env:'cloudflare-production',backend:'D1 + R2',optimized:BUILD,mediaMode:'r2-original-bytes'});
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
      if(cached&&(!wanted||Number(cached.version)===wanted))return syntheticJson({part,version:Number(cached.version)||wanted||1,data:cached.data});
      try{localStorage.removeItem(ETAG_KEY)}catch(_){}
      const refreshed=await requestBootstrap(false);
      if(refreshed.raw)return refreshed.raw;
      const row=refreshed.bundle?.parts?.[part];
      return row?syntheticJson(row):syntheticJson({error:`Part unavailable after bootstrap: ${part}`},503);
    }
    return nativeFetch(input,init);
  };

  /* app-version-v120.js is the single authoritative version writer. Never observe and rewrite the same DOM nodes here. */
  function forceVersion(){
    try{window.mwsApplyAppVersionV120?.()}catch(_){}
  }

  const PAGE_SCALE_KEY='mws_page_text_scales_v54';
  const clampPageScale=value=>Math.max(70,Math.min(180,Math.round((Number(value)||100)/5)*5));
  function pageScaleMap(){try{const value=JSON.parse(localStorage.getItem(PAGE_SCALE_KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch(_){return {}}}
  function activeSection(){return document.querySelector('.section.active')}
  function globalTextScale(){try{return Math.max(80,Math.min(200,Number(data?.textScale)||100))}catch(_){return 100}}
  function ensurePageScaleStyle(){
    if(document.getElementById('mws-v122-page-scale-style'))return;
    const style=document.createElement('style');style.id='mws-v122-page-scale-style';style.textContent='.main{overflow-x:auto!important}.section{transform-origin:top left}';document.head.appendChild(style);
  }
  function applyPageLayoutScale(){
    ensurePageScaleStyle();
    const sec=activeSection();if(!sec)return;
    const global=globalTextScale(),local=clampPageScale(pageScaleMap()[sec.id]||100),supportsZoom='zoom' in document.documentElement.style;
    if(supportsZoom){sec.style.setProperty('--ui-text-scale',String(global/100));sec.style.fontSize=`calc(14px * ${global/100})`;sec.style.zoom=String(local/100)}
    else{const combined=(global*local)/100;sec.style.setProperty('--ui-text-scale',String(combined/100));sec.style.fontSize=`calc(14px * ${combined/100})`}
    const label=document.getElementById('pageTextScaleValueV54');if(label)label.textContent=`페이지 ${local}%`;
    document.body?.style.setProperty('--mws-page-layout-scale',String(local/100));
  }
  function wrapPageScaleFunction(name){
    const current=window[name];if(typeof current!=='function'||current.__mwsV122PageScaleBridge)return;
    const wrapped=function(){const out=current.apply(this,arguments);queueMicrotask(applyPageLayoutScale);return out};
    wrapped.__mwsV122PageScaleBridge=true;window[name]=wrapped;try{globalThis[name]=wrapped}catch(_){}
  }
  function installPageScaleBridge(){['setPageTextScaleV54','setTab','applyTextScale','renderMultiDraw'].forEach(wrapPageScaleFunction);applyPageLayoutScale()}

  function loadContentPlannerHost(){
    if(document.getElementById('mwsContentPlannerHostScriptV110'))return;
    const s=document.createElement('script');s.id='mwsContentPlannerHostScriptV110';s.src='assets/content-planner-host.js?v=1.4.0-phase74';document.body.appendChild(s);
  }
  function loadMaintenanceRuntimeFeatures(){
    if(document.getElementById('mwsCf571RuntimeScript'))return;
    const s=document.createElement('script');
    s.id='mwsCf571RuntimeScript';
    s.src='assets/maintenance-runtime-v130.js?v=1.3.0-stage68';
    s.onload=()=>{
      if(window.__mwsMaintenanceRuntimeV130Ready){installLosslessImagePolicy();forceVersion();return}
      console.error('Mawang maintenance runtime readiness handshake failed');
    };
    s.onerror=()=>console.error('Mawang maintenance runtime loading failed');
    document.body.appendChild(s);
  }
  function loadPerfBase(){
    if(document.getElementById('mwsPerfRuntimeBaseV130'))return;
    const s=document.createElement('script');s.id='mwsPerfRuntimeBaseV130';s.src='assets/perf-runtime-base.js?v=1.4.0-phase81';document.head.appendChild(s);
  }

  function startPostLoginFeatures(){
    if(postLoginStarted)return;
    if(document.body?.classList.contains('mws-gated'))return;
    postLoginStarted=true;
    installLosslessImagePolicy();forceVersion();installPageScaleBridge();
    idle(loadPerfBase,250);
    idle(loadContentPlannerHost,1200);
    idle(loadMaintenanceRuntimeFeatures,4500);
  }
  function armPostLogin(){
    if(!document.body?.classList.contains('mws-gated')){startPostLoginFeatures();return}
    const observer=new MutationObserver(()=>{
      if(document.body.classList.contains('mws-gated'))return;
      observer.disconnect();
      startPostLoginFeatures();
    });
    observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  }

  window.mwsV101ApplyPageLayoutScale=applyPageLayoutScale;
  window.addEventListener('DOMContentLoaded',armPostLogin,{once:true});
  window.addEventListener('load',armPostLogin,{once:true});
  window.addEventListener('mawang:datachange',()=>{if(!document.body.classList.contains('mws-gated'))queueMicrotask(()=>{forceVersion();applyPageLayoutScale()})});
  if(document.readyState!=='loading')armPostLogin();
})();
