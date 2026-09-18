/* Mawang Scheduler v1.3.0 maintenance runtime
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
  if(window.__mwsMaintenanceRuntimeV130)return;
  window.__mwsMaintenanceRuntimeV130=true;

  const BUILD=String(window.version?.name||'Mawang Scheduler v 1.3.0');
  const R2_MEDIA_BASE='https://pub-ff2081dd33384aa0865bb86b4514bbec.r2.dev';

  function clone(v){
    try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v))}
  }

  function mediaBase(){
    return String(
      window.__mwsMediaBaseUrlV130||
      window.__mwsCf57MediaBaseUrl||
      localStorage.getItem('mws_media_base_v130')||
      localStorage.getItem('mws_cf_v571_media_base')||
      localStorage.getItem('mws_cf_v57_media_base')||
      R2_MEDIA_BASE
    ).replace(/\/+$/,'');
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
      localStorage.setItem('mws_media_base_v130',mediaBase());
    }catch(e){console.warn('Mawang Scheduler v1.3.0 local media migration skipped',e)}
    return changed;
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
        console.error('Mawang Scheduler v1.3.0 backup media failures',failures);
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
      console.error('Mawang Scheduler v1.3.0 complete backup failed',err);
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
    if(!full.dataset.mwsMaintenanceV130FullBackup){
      full.dataset.mwsMaintenanceV130FullBackup='1';
      full.addEventListener('click',e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        completeBackup();
      },true);
    }

    if(!document.getElementById('mwsMaintenanceV130QuickBackupBtn')){
      document.getElementById('mwsV57QuickBackupBtn')?.remove();
      const quick=document.createElement('button');
      quick.type='button';quick.id='mwsMaintenanceV130QuickBackupBtn';quick.className='secondary';
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
      if(day.dataset.mwsMaintenanceV130ClickGuard==='1')return;
      day.dataset.mwsMaintenanceV130ClickGuard='1';
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
    if(grid.dataset.mwsMaintenanceV130Observer==='1')return;
    grid.dataset.mwsMaintenanceV130Observer='1';
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
    return {build:BUILD,mediaBase:base||null,apiResourceLoads:api,legacyMediaResourceLoads:legacy,r2DirectResourceLoads:r2};
  }

  window.mwsCreateQuickBackupV130=quickBackup;
  window.mwsCreateCompleteBackupV130=completeBackup;
  window.mwsMaintenanceReportV130=requestReport;

  migrateLiveAndLocalStorage();
  installCalendarClickGuard();
  installBackupUi();
  setTimeout(()=>{migrateLiveAndLocalStorage();installCalendarClickGuard();installBackupUi()},500);
  setTimeout(()=>{migrateLiveAndLocalStorage();installCalendarClickGuard();installBackupUi()},1500);
})();
