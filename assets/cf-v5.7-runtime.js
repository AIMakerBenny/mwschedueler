/* MAWANG Scheduler CF V5.7.1 runtime patch
   - high-quality profile image preprocessing
   - quick data backup
   - self-contained full backup with direct R2 media embedding
   - lower-frequency admin autosave batching
   - legacy /media URL migration to direct R2
   - calendar nested-control click guard
   - persistent build-version label
*/
(()=>{
  'use strict';
  if(window.__mwsCf571Runtime)return;
  window.__mwsCf571Runtime=true;

  const BUILD='CF V5.7.1';
  const R2_MEDIA_BASE='https://pub-ff2081dd33384aa0865bb86b4514bbec.r2.dev';
  const MAX_PROFILE_SIZE=1600;
  const PROFILE_QUALITY=.92;
  const ADMIN_SAVE_DEBOUNCE_MS=2500;
  const CACHE_DB='mawang_data';
  const CACHE_STORES=['core','contacts','contactMeta','events','posts','miniGames','activity','clipboard','notebook'];

  function clone(v){
    try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v))}
  }

  function forceBuildVersion(){
    try{
      if(document.body?.getAttribute('data-build-version')!==BUILD)document.body?.setAttribute('data-build-version',BUILD);
      document.querySelectorAll('[id^="mwsBuildVersionV5"],.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]').forEach(label=>{
        if(label.textContent!==BUILD)label.textContent=BUILD;
      });
    }catch(_){}
  }

  function installBuildVersionGuard(){
    forceBuildVersion();
    [100,350,800,1500,3000,6000].forEach(ms=>setTimeout(forceBuildVersion,ms));
    window.addEventListener('mawang:datachange',()=>queueMicrotask(forceBuildVersion));
    const baseRender=window.renderAll;
    if(typeof baseRender==='function'&&!baseRender.__mwsV571VersionGuard){
      const wrapped=function(){
        const out=baseRender.apply(this,arguments);
        queueMicrotask(forceBuildVersion);
        return out;
      };
      wrapped.__mwsV571VersionGuard=true;
      window.renderAll=wrapped;
      try{renderAll=wrapped}catch(_){}
    }
  }

  function loadImage(dataUrl){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error('이미지를 읽지 못했습니다.'));
      img.src=dataUrl;
    });
  }

  async function compressProfileImageV571(dataUrl,maxSize=MAX_PROFILE_SIZE,quality=PROFILE_QUALITY){
    if(typeof dataUrl!=='string'||!dataUrl.startsWith('data:image/'))return dataUrl;
    const img=await loadImage(dataUrl);
    const w=Number(img.naturalWidth||img.width)||1;
    const h=Number(img.naturalHeight||img.height)||1;
    const scale=Math.min(1,maxSize/Math.max(w,h));
    const cw=Math.max(1,Math.round(w*scale));
    const ch=Math.max(1,Math.round(h*scale));
    const canvas=document.createElement('canvas');
    canvas.width=cw;canvas.height=ch;
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)return dataUrl;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(img,0,0,cw,ch);
    try{return canvas.toDataURL('image/webp',quality)||dataUrl}catch(_){return dataUrl}
  }

  const compressContactImageV571=(dataUrl)=>compressProfileImageV571(dataUrl,MAX_PROFILE_SIZE,PROFILE_QUALITY);
  const compressFolderContactPhotoV571=(dataUrl)=>compressProfileImageV571(dataUrl,MAX_PROFILE_SIZE,PROFILE_QUALITY);
  try{
    window.compressContactImage=compressContactImageV571;
    compressContactImage=compressContactImageV571;
  }catch(_){}
  try{
    window.compressFolderContactPhotoV417=compressFolderContactPhotoV571;
    compressFolderContactPhotoV417=compressFolderContactPhotoV571;
  }catch(_){}
  window.mwsV571CompressProfileImage=compressProfileImageV571;
  window.mwsV57CompressProfileImage=compressProfileImageV571;

  function installSaveRequestOptimizer(){
    if(window.__mwsCf571SaveOptimizer)return;
    window.__mwsCf571SaveOptimizer=true;
    const nativeSetTimeout=window.setTimeout.bind(window);
    window.setTimeout=function(fn,delay,...args){
      let nextDelay=delay;
      if(Number(delay)===650&&typeof fn==='function'){
        try{
          const src=Function.prototype.toString.call(fn);
          if(src.includes('writeCloudNow(false)'))nextDelay=ADMIN_SAVE_DEBOUNCE_MS;
        }catch(_){}
      }
      return nativeSetTimeout(fn,nextDelay,...args);
    };
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState!=='hidden'||document.body?.dataset?.mwsMode!=='admin')return;
      try{
        const report=window.mwsV55EgressReport?.();
        if(Array.isArray(report?.dirtyParts)&&report.dirtyParts.length&&typeof window.mwsV55SaveNow==='function'){
          Promise.resolve(window.mwsV55SaveNow()).catch(()=>{});
        }
      }catch(_){}
    });
  }

  function mediaBase(){
    return String(window.__mwsCf57MediaBaseUrl||localStorage.getItem('mws_cf_v571_media_base')||localStorage.getItem('mws_cf_v57_media_base')||R2_MEDIA_BASE).replace(/\/+$/,'');
  }

  function directMediaUrl(value){
    if(typeof value!=='string'||!value)return value;
    let u;
    try{u=new URL(value,location.href)}catch(_){return value}
    if(u.origin!==location.origin)return value;
    const match=/^\/media\/(contact|workspace)\/([^/?#]+)$/.exec(u.pathname);
    if(!match)return value;
    let key=match[2];
    try{key=decodeURIComponent(key)}catch(_){}
    const folder=match[1]==='contact'?'contacts':'workspace';
    const v=u.searchParams.get('v');
    return `${mediaBase()}/${folder}/${encodeURIComponent(key)}${v?`?v=${encodeURIComponent(v)}`:''}`;
  }

  function rewriteLegacyMediaInPlace(root){
    let changed=0;
    function visit(value){
      if(Array.isArray(value)){
        for(let i=0;i<value.length;i++){
          const next=directMediaUrl(value[i]);
          if(next!==value[i]){value[i]=next;changed++}
          if(value[i]&&typeof value[i]==='object')visit(value[i]);
        }
      }else if(value&&typeof value==='object'){
        for(const key of Object.keys(value)){
          const next=directMediaUrl(value[key]);
          if(next!==value[key]){value[key]=next;changed++}
          if(value[key]&&typeof value[key]==='object')visit(value[key]);
        }
      }
    }
    visit(root);
    return changed;
  }

  function migrateLiveAndLocalStorage(){
    let changed=0;
    try{
      if(typeof data!=='undefined'&&data&&typeof data==='object')changed+=rewriteLegacyMediaInPlace(data);
    }catch(_){}
    try{
      const raw=localStorage.getItem('mawangSchedulerBeta');
      if(raw){
        const parsed=JSON.parse(raw);
        const n=rewriteLegacyMediaInPlace(parsed);
        if(n){localStorage.setItem('mawangSchedulerBeta',JSON.stringify(parsed));changed+=n}
      }
      localStorage.setItem('mws_cf_v571_media_base',mediaBase());
    }catch(e){console.warn('CF V5.7.1 local media migration skipped',e)}
    return changed;
  }

  async function migrateIndexedDbMedia(){
    if(!('indexedDB' in window))return 0;
    return await new Promise(resolve=>{
      const req=indexedDB.open(CACHE_DB,3);
      req.onerror=()=>resolve(0);
      req.onsuccess=()=>{
        const db=req.result;
        const stores=CACHE_STORES.filter(name=>db.objectStoreNames.contains(name));
        if(!stores.length){db.close();resolve(0);return}
        let changed=0,pending=stores.length;
        for(const store of stores){
          let tx;
          try{tx=db.transaction(store,'readwrite')}catch(_){if(--pending===0){db.close();resolve(changed)}continue}
          const os=tx.objectStore(store),all=os.getAll();
          all.onsuccess=()=>{
            for(const row of all.result||[]){
              if(!row||!row.data)continue;
              const n=rewriteLegacyMediaInPlace(row.data);
              if(n){changed+=n;try{os.put(row)}catch(_){}}
            }
          };
          const done=()=>{if(--pending===0){db.close();resolve(changed)}};
          tx.oncomplete=done;tx.onerror=done;tx.onabort=done;
        }
      };
    });
  }

  function isManagedDirectMedia(value){
    if(typeof value!=='string'||!value)return false;
    const base=mediaBase();
    if(!base)return false;
    try{
      const u=new URL(value,location.href),b=new URL(base);
      const prefix=b.pathname.replace(/\/$/,'');
      return u.origin===b.origin&&(u.pathname.startsWith(`${prefix}/contacts/`)||u.pathname.startsWith(`${prefix}/workspace/`));
    }catch(_){return false}
  }

  function walk(value,visit){
    if(Array.isArray(value)){
      for(let i=0;i<value.length;i++){
        const next=visit(value[i]);
        if(next!==undefined)value[i]=next;
        if(value[i]&&typeof value[i]==='object')walk(value[i],visit);
      }
      return;
    }
    if(value&&typeof value==='object'){
      for(const key of Object.keys(value)){
        const next=visit(value[key]);
        if(next!==undefined)value[key]=next;
        if(value[key]&&typeof value[key]==='object')walk(value[key],visit);
      }
    }
  }

  function collectManagedMedia(root){
    const set=new Set();
    walk(root,v=>{if(isManagedDirectMedia(v))set.add(v)});
    return [...set];
  }

  function replaceManagedMedia(root,map){walk(root,v=>map.has(v)?map.get(v):undefined)}

  function blobToDataUrl(blob){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>resolve(String(r.result||''));
      r.onerror=()=>reject(r.error||new Error('이미지 변환 실패'));
      r.readAsDataURL(blob);
    });
  }

  async function fetchMedia(url){
    const res=await fetch(url,{method:'GET',mode:'cors',cache:'force-cache'});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const blob=await res.blob();
    return {dataUrl:await blobToDataUrl(blob),bytes:Number(blob.size)||0};
  }

  async function mapLimit(items,limit,worker,onProgress){
    let cursor=0,done=0;
    const out=new Array(items.length);
    async function run(){
      while(true){
        const i=cursor++;
        if(i>=items.length)return;
        out[i]=await worker(items[i],i);
        done++;
        onProgress?.(done,items.length,out[i],i);
      }
    }
    await Promise.all(Array.from({length:Math.max(1,Math.min(limit,items.length||1))},run));
    return out;
  }

  function saveJson(obj,name){
    const text=JSON.stringify(obj,null,2);
    const blob=new Blob([text],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    return blob.size;
  }

  function baseBackup(){
    if(typeof window.buildFullBackupObject!=='function')throw new Error('백업 생성 함수를 찾지 못했습니다.');
    const backup=clone(window.buildFullBackupObject());
    rewriteLegacyMediaInPlace(backup);
    return backup;
  }

  function statusEl(){return document.getElementById('fullBackupAssetStatus')}
  function setStatus(text,ok=false){
    const el=statusEl();if(!el)return;
    el.textContent=text;
    el.classList.toggle('ok',Boolean(ok));
  }

  async function quickBackup(){
    const backup=baseBackup();
    const refs=collectManagedMedia(backup.data);
    backup.version=Math.max(40,Number(backup.version)||0);
    backup.exportedAt=new Date().toISOString();
    backup.meta={...(backup.meta||{}),backupMode:'data-only',appBuild:BUILD,externalManagedMedia:refs.length};
    const bytes=saveJson(backup,'mawang-scheduler-data-backup.json');
    setStatus(`빠른 데이터 백업 완료 · ${(bytes/1024/1024).toFixed(1)} MB`,true);
    try{window.toast?.('빠른 백업','데이터 백업을 저장했습니다. 고화질 R2 이미지는 URL로 유지됩니다.')}catch(_){}
  }

  async function completeBackup(){
    const btn=document.getElementById('exportAllBtn');
    const old=btn?.textContent||'완전 백업';
    if(btn){btn.disabled=true;btn.textContent='백업 준비 중...'}
    try{
      const base=mediaBase();
      if(!base)throw new Error('R2 Public Media URL 설정을 찾지 못했습니다.');
      const backup=baseBackup();
      const refs=collectManagedMedia(backup.data);
      const map=new Map();
      const failures=[];
      let rawBytes=0;

      await mapLimit(refs,4,async url=>{
        try{
          const item=await fetchMedia(url);
          map.set(url,item.dataUrl);rawBytes+=item.bytes;
          return {ok:true,url,bytes:item.bytes};
        }catch(err){
          failures.push({url,error:String(err?.message||err)});
          return {ok:false,url};
        }
      },(done,total)=>{
        if(btn)btn.textContent=`이미지 ${done}/${total}`;
        setStatus(`완전 백업용 이미지 ${done}/${total} 다운로드 중`);
      });

      if(failures.length){
        console.error('CF V5.7.1 backup media failures',failures);
        throw new Error(`이미지 ${failures.length}개를 받지 못했습니다. R2 CORS 설정을 확인하세요.`);
      }

      replaceManagedMedia(backup.data,map);
      if(backup.assets&&typeof backup.assets==='object'){
        backup.assets.contactImages={};
        backup.assets.contactTagBanners={};
      }
      backup.version=Math.max(40,Number(backup.version)||0);
      backup.exportedAt=new Date().toISOString();
      backup.meta={...(backup.meta||{}),backupMode:'self-contained',appBuild:BUILD,managedMediaEmbedded:map.size,embeddedMediaBytes:rawBytes,externalManagedMedia:0};
      const bytes=saveJson(backup,'mawang-scheduler-full-backup.json');
      setStatus(`완전 백업 완료 · 이미지 ${map.size}개 · ${(bytes/1024/1024).toFixed(1)} MB`,true);
      try{window.toast?.('완전 백업',`이미지 ${map.size}개를 실제 파일 데이터로 포함했습니다.`)}catch(_){}
    }catch(err){
      console.error('CF V5.7.1 complete backup failed',err);
      setStatus(`완전 백업 실패 · ${String(err?.message||err)}`,false);
      try{window.toast?.('완전 백업 실패',String(err?.message||err))}catch(_){}
    }finally{
      if(btn){btn.disabled=false;btn.textContent=old}
    }
  }

  function installBackupUi(){
    const full=document.getElementById('exportAllBtn');
    if(!full)return;
    full.textContent='완전 백업';
    full.title='현재 데이터와 R2 프로필/워크스페이스 이미지를 실제 데이터로 포함합니다.';
    if(!full.dataset.mwsV571FullBackup){
      full.dataset.mwsV571FullBackup='1';
      full.addEventListener('click',e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        completeBackup();
      },true);
    }

    if(!document.getElementById('mwsV571QuickBackupBtn')){
      document.getElementById('mwsV57QuickBackupBtn')?.remove();
      const quick=document.createElement('button');
      quick.type='button';quick.id='mwsV571QuickBackupBtn';quick.className='secondary';
      quick.textContent='빠른 데이터 백업';
      quick.title='이미지는 R2 URL로 유지하고 데이터만 빠르게 저장합니다.';
      quick.onclick=e=>{e.preventDefault();quickBackup().catch(err=>setStatus(String(err?.message||err)))};
      full.parentElement?.insertBefore(quick,full);
    }
    const refs=(()=>{try{return collectManagedMedia(baseBackup().data).length}catch(_){return 0}})();
    setStatus(`완전 백업 시 R2 이미지 ${refs}개 포함`);
  }

  function patchCalendarDayHandlers(){
    const grid=document.getElementById('calendarGrid');
    if(!grid)return;
    grid.querySelectorAll('.day[data-date]').forEach(day=>{
      if(day.dataset.mwsV571ClickGuard==='1')return;
      day.dataset.mwsV571ClickGuard='1';
      const original=day.onclick;
      day.onclick=function(event){
        const target=event?.target instanceof Element?event.target:null;
        if(target&&target!==day&&!target.classList.contains('daynum')){
          return;
        }
        if(typeof original==='function')return original.call(day,event);
        try{if(typeof openEvent==='function')return openEvent(null,day.dataset.date)}catch(_){}
      };
    });
  }

  function installCalendarClickGuard(){
    const grid=document.getElementById('calendarGrid');
    if(!grid)return;
    patchCalendarDayHandlers();
    if(grid.dataset.mwsV571Observer==='1')return;
    grid.dataset.mwsV571Observer='1';
    new MutationObserver(()=>queueMicrotask(patchCalendarDayHandlers)).observe(grid,{childList:true,subtree:false});
  }

  function requestReport(){
    const base=mediaBase();
    const resources=performance.getEntriesByType?.('resource')||[];
    let r2=0,legacy=0,api=0;
    try{
      const r2Origin=new URL(base).origin;
      for(const item of resources){
        try{
          const u=new URL(item.name,location.href);
          if(u.origin===r2Origin)r2++;
          if(u.origin===location.origin&&u.pathname.startsWith('/media/'))legacy++;
          if(u.origin===location.origin&&u.pathname.startsWith('/api/'))api++;
        }catch(_){}
      }
    }catch(_){}
    const legacyMetrics=typeof window.mwsV55EgressReport==='function'?window.mwsV55EgressReport():null;
    return {build:BUILD,mediaBase:base||null,apiResourceLoads:api,legacyMediaResourceLoads:legacy,r2DirectResourceLoads:r2,adminSaveDebounceMs:ADMIN_SAVE_DEBOUNCE_MS,legacyMetrics};
  }

  window.mwsV571CreateQuickBackup=quickBackup;
  window.mwsV571CreateCompleteBackup=completeBackup;
  window.mwsV571RequestReport=requestReport;
  window.mwsV57CreateQuickBackup=quickBackup;
  window.mwsV57CreateCompleteBackup=completeBackup;
  window.mwsV57RequestReport=requestReport;

  installSaveRequestOptimizer();
  migrateLiveAndLocalStorage();
  migrateIndexedDbMedia().catch(()=>{});
  installCalendarClickGuard();
  installBuildVersionGuard();
  installBackupUi();
  setTimeout(()=>{migrateLiveAndLocalStorage();installCalendarClickGuard();installBuildVersionGuard();installBackupUi()},500);
  setTimeout(()=>{migrateLiveAndLocalStorage();installCalendarClickGuard();forceBuildVersion();installBackupUi()},1500);
})();
