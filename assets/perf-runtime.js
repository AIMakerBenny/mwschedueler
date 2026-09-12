/* Mawang Scheduler v1.0 - one-request bootstrap + verified IndexedDB reuse */
(()=>{
  'use strict';
  if(window.__mwsCf571Optimizer)return;
  window.__mwsCf571Optimizer=true;

  const nativeFetch=window.fetch.bind(window);
  const version=(window.version&&typeof window.version==='object')?window.version:(window.version={});
  version.name='Mawang Scheduler v1.0';
  const BUILD=version.name;
  const ETAG_KEY='mws_cf_v571_etag';
  const MANIFEST_KEY='mws_cf_v571_manifest';
  const MEDIA_BASE_KEY='mws_cf_v571_media_base';
  const DB_NAME='mawang_data';
  const DB_VERSION=3;
  const PARTS=['core','contacts','contactMeta','events','posts','miniGames','activity','clipboard','notebook'];
  const OLD_BAD_PLANNER_PREVIEW='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLAlQAAAABJRU5ErkJggg==';
  const EMPTY_PLANNER_PREVIEW='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==';
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
        if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'key'});
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
    let db;
    try{
      db=await openDb();
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
    }catch(e){console.warn('Mawang Scheduler v1.0 bundle cache write failed',e)}
    finally{try{db?.close()}catch(_){}}
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
    const etag=res.headers.get('etag')||`"${body?.globalVersion||'mws-v1'}"`;
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
      if(cached&&(!wanted||Number(cached.version)===wanted))return syntheticJson({part,version:Number(cached.version)||wanted||1,data:cached.data});
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
      const name=window.version?.name||BUILD;
      document.body?.setAttribute('data-build-version',name);
      document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]').forEach(label=>{if(label.textContent!==name)label.textContent=name});
    }catch(_){}
  }

  function loadRuntimePatch(){
    if(document.getElementById('mwsCf571RuntimeScript'))return;
    const s=document.createElement('script');
    s.id='mwsCf571RuntimeScript';
    s.src='assets/cf-v5.7-runtime.js?v=5.7.1';
    document.body.appendChild(s);
  }

  function loadContentPlannerHostV110(){
    if(document.getElementById('mwsContentPlannerHostScriptV110'))return;
    const s=document.createElement('script');
    s.id='mwsContentPlannerHostScriptV110';
    s.src='assets/content-planner-host.js?v=1.0';
    document.body.appendChild(s);
  }

  function repairPlannerPreviewV10(){
    const frame=document.getElementById('mwsContentPlannerFrame');
    if(!frame?.contentWindow)return;
    const w=frame.contentWindow;
    let doc;
    try{doc=w.document}catch(_){return}
    if(!doc?.documentElement)return;

    try{
      const ctxProto=w.CanvasRenderingContext2D?.prototype;
      if(ctxProto&&!ctxProto.__mwsV10SafeDrawImage){
        const baseDrawImage=ctxProto.drawImage;
        ctxProto.drawImage=function(source){
          try{
            if(w.HTMLImageElement&&source instanceof w.HTMLImageElement){
              const raw=source.currentSrc||source.src||'';
              if(raw&&!/^(data:|blob:)/i.test(raw)){
                const u=new w.URL(raw,w.location.href);
                if(u.origin!==w.location.origin&&source.crossOrigin!=='anonymous'&&source.crossOrigin!=='use-credentials'){
                  console.warn('Skipped unsafe cross-origin image while rendering planner preview',raw);
                  return;
                }
              }
            }
          }catch(_){}
          return baseDrawImage.apply(this,arguments);
        };
        ctxProto.__mwsV10SafeDrawImage=true;
      }
    }catch(error){console.warn('Planner preview drawImage safety install failed',error)}

    try{
      const proto=w.HTMLCanvasElement?.prototype;
      if(proto&&!proto.__mwsV10FinalToDataUrlSafe){
        const baseToDataURL=proto.toDataURL;
        proto.toDataURL=function(){
          try{
            const result=baseToDataURL.apply(this,arguments);
            return result===OLD_BAD_PLANNER_PREVIEW?EMPTY_PLANNER_PREVIEW:result;
          }catch(err){
            if(err?.name==='SecurityError'||/taint/i.test(String(err?.message||err))){
              console.warn('Planner preview export blocked by cross-origin image; save continues without preview',err);
              return EMPTY_PLANNER_PREVIEW;
            }
            throw err;
          }
        };
        proto.__mwsV10FinalToDataUrlSafe=true;
        proto.__mwsV10ToDataUrlSafe=true;
      }
    }catch(error){console.warn('Planner preview toDataURL safety install failed',error)}

    const scrub=()=>{
      try{
        doc.querySelectorAll('.proposal-preview img').forEach(img=>{
          const raw=img.getAttribute('src')||'';
          if(raw!==OLD_BAD_PLANNER_PREVIEW&&raw!==EMPTY_PLANNER_PREVIEW)return;
          const box=img.parentElement;
          img.remove();
          if(box&&!box.querySelector('.no-preview')){
            const note=doc.createElement('div');
            note.className='no-preview';
            note.textContent='미리보기 없음 · 다시 저장하면 자동 복구됩니다';
            box.appendChild(note);
          }
        });
      }catch(_){}
    };
    scrub();
    if(!doc.__mwsPlannerPreviewObserverV10){
      const observer=new w.MutationObserver(scrub);
      observer.observe(doc.documentElement,{childList:true,subtree:true});
      doc.__mwsPlannerPreviewObserverV10=observer;
    }
  }

  function installPlannerPreviewRepairV10(){
    const frame=document.getElementById('mwsContentPlannerFrame');
    if(!frame)return;
    if(!frame.__mwsPlannerPreviewRepairBound){
      frame.__mwsPlannerPreviewRepairBound=true;
      frame.addEventListener('load',()=>setTimeout(repairPlannerPreviewV10,0));
    }
    setTimeout(repairPlannerPreviewV10,0);
  }

  const PAGE_SCALE_KEY='mws_page_text_scales_v54';
  const clampPageScale=value=>Math.max(70,Math.min(180,Math.round((Number(value)||100)/5)*5));
  function pageScaleMap(){try{const value=JSON.parse(localStorage.getItem(PAGE_SCALE_KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch(_){return {}}}
  function activePageId(){return document.querySelector('.section.active')?.id||'dashboard'}
  function pageScale(id=activePageId()){return clampPageScale(pageScaleMap()[id]||100)}
  function globalTextScale(){try{return Math.max(80,Math.min(200,Number(data?.textScale)||100))}catch(_){return 100}}

  function ensurePageScaleStyle(){
    if(document.getElementById('mws-cf-v110-page-scale-style'))return;
    const style=document.createElement('style');
    style.id='mws-cf-v110-page-scale-style';
    style.textContent='.main{overflow-x:auto!important}.section{transform-origin:top left}';
    document.head.appendChild(style);
  }

  function applyPageLayoutScale(){
    ensurePageScaleStyle();
    const global=globalTextScale(),globalRatio=global/100,scales=pageScaleMap();
    const supportsZoom=typeof document!=='undefined'&&document.documentElement&&('zoom' in document.documentElement.style);
    document.querySelectorAll('.section').forEach(sec=>{
      const local=clampPageScale(scales[sec.id]||100);
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
    const current=pageScale();
    const label=document.getElementById('pageTextScaleValueV54');
    if(label)label.textContent=`페이지 ${current}%`;
    const control=document.getElementById('pageTextScaleControlV54');
    if(control)control.title='현재 페이지의 텍스트와 카드, 버튼 등 UI 크기를 함께 조절합니다. 개인 브라우저에 저장됩니다.';
    document.body?.style.setProperty('--mws-page-layout-scale',String(current/100));
  }

  function wrapPageScaleFunction(name){
    const current=window[name];
    if(typeof current!=='function'||current.__mwsV110PageScaleBridge)return;
    const wrapped=function(){const out=current.apply(this,arguments);queueMicrotask(applyPageLayoutScale);return out};
    wrapped.__mwsV110PageScaleBridge=true;
    wrapped.__mwsV110PageScaleBase=current;
    window[name]=wrapped;
  }

  function installPageScaleBridge(){
    wrapPageScaleFunction('setPageTextScaleV54');
    wrapPageScaleFunction('setTab');
    wrapPageScaleFunction('applyTextScale');
    wrapPageScaleFunction('renderMultiDraw');
    applyPageLayoutScale();
  }

  function installReleaseVersionGuard(){
    forceVersion();
    const body=document.body;
    if(body&&!body.__mwsV110BuildObserver){
      const observer=new MutationObserver(()=>{if(body.getAttribute('data-build-version')!==(window.version?.name||BUILD))forceVersion()});
      observer.observe(body,{attributes:true,attributeFilter:['data-build-version']});
      body.__mwsV110BuildObserver=observer;
    }
    const label=document.querySelector('[id^="mwsBuildVersionV5"],#mwsBuildVersion,.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]');
    if(label&&!label.__mwsV110BuildObserver){
      const observer=new MutationObserver(()=>{if(label.textContent!==(window.version?.name||BUILD))forceVersion()});
      observer.observe(label,{childList:true,characterData:true,subtree:true});
      label.__mwsV110BuildObserver=observer;
    }
  }

  window.mwsV101ApplyPageLayoutScale=applyPageLayoutScale;
  const ready=()=>{forceVersion();installReleaseVersionGuard();installPageScaleBridge();loadContentPlannerHostV110();setTimeout(installPlannerPreviewRepairV10,80)};
  window.addEventListener('DOMContentLoaded',ready,{once:true});
  window.addEventListener('load',()=>{forceVersion();loadRuntimePatch();installReleaseVersionGuard();installPageScaleBridge();loadContentPlannerHostV110();setTimeout(installPlannerPreviewRepairV10,80)},{once:true});
  window.addEventListener('mawang:datachange',()=>setTimeout(()=>{installReleaseVersionGuard();installPageScaleBridge();installPlannerPreviewRepairV10()},0));
  [50,150,350,800,1500,3000,6000,9000].forEach(ms=>setTimeout(()=>{installReleaseVersionGuard();installPageScaleBridge();installPlannerPreviewRepairV10()},ms));
  let tries=0;const versionTimer=setInterval(()=>{forceVersion();installPlannerPreviewRepairV10();if(++tries>=32)clearInterval(versionTimer)},250);
  if(document.readyState!=='loading')setTimeout(loadContentPlannerHostV110,0);

  if(document.readyState==='loading')document.write('<script src="assets/perf-runtime-base.js?v=5.7.1"><\/script>');
  else{const s=document.createElement('script');s.src='assets/perf-runtime-base.js?v=5.7.1';document.head.appendChild(s)}
})();
