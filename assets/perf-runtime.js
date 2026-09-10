/* MAWANG Scheduler CF V5.6 - one-request public bootstrap + strong local cache */
(()=>{
  'use strict';
  if(window.__mwsCf56Optimizer)return;
  window.__mwsCf56Optimizer=true;

  const nativeFetch=window.fetch.bind(window);
  const ETAG_KEY='mws_cf_v56_etag';
  const MANIFEST_KEY='mws_cf_v56_manifest';
  const DB_NAME='mawang_data';
  const DB_VERSION=3;
  const PARTS=['core','contacts','contactMeta','events','posts','miniGames','activity','clipboard','notebook'];
  let bundle=null;
  let bootstrapPromise=null;

  function syntheticJson(value,status=200,headers={}){
    return new Response(JSON.stringify(value),{
      status,
      headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-mws-cf56-synthetic':'1',...headers}
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
    }catch(e){console.warn('CF V5.6 bundle cache write failed',e)}
  }

  async function requestBootstrap(useEtag=true){
    const headers={};
    const savedEtag=useEtag?localStorage.getItem(ETAG_KEY):'';
    if(savedEtag)headers['If-None-Match']=savedEtag;
    const res=await nativeFetch('/api/bootstrap',{method:'GET',headers,cache:'no-store'});

    if(res.status===304){
      let savedManifest=null;
      try{savedManifest=JSON.parse(localStorage.getItem(MANIFEST_KEY)||'null')}catch(_){}
      if(!savedManifest&&useEtag){
        localStorage.removeItem(ETAG_KEY);
        return requestBootstrap(false);
      }
      return {status:304,manifest:savedManifest,bundle:null};
    }

    if(!res.ok)return {raw:res};
    const body=await res.json();
    const etag=res.headers.get('etag')||`"${body?.globalVersion||'cf56'}"`;
    bundle=body;
    try{
      localStorage.setItem(ETAG_KEY,etag);
      localStorage.setItem(MANIFEST_KEY,JSON.stringify(body.manifest||null));
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
      return syntheticJson({ok:true,env:'cloudflare-production',backend:'D1 + R2',optimized:'CF V5.6'});
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
      const row=result.bundle?.parts?.[part];
      if(row)return syntheticJson(row);
      return nativeFetch(input,init);
    }

    return nativeFetch(input,init);
  };

  function forceVersion(){
    try{
      document.body?.setAttribute('data-build-version','CF V5.6');
      const label=document.querySelector('[id^="mwsBuildVersionV5"], .sidebar-build-version-v52, .sidebar-build-version-v53, [class*="sidebar-build-version"]');
      if(label)label.textContent='CF V5.6';
    }catch(_){}
  }
  window.addEventListener('DOMContentLoaded',forceVersion,{once:true});
  window.addEventListener('load',forceVersion,{once:true});
  let tries=0;const versionTimer=setInterval(()=>{forceVersion();if(++tries>=24)clearInterval(versionTimer)},250);

  if(document.readyState==='loading'){
    document.write('<script src="assets/perf-runtime-base.js"></script>');
  }else{
    const s=document.createElement('script');s.src='assets/perf-runtime-base.js';document.head.appendChild(s);
  }
})();
