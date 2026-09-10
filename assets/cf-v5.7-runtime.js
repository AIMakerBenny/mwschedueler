/* MAWANG Scheduler CF V5.7 runtime patch
   - high-quality profile image preprocessing
   - quick data backup
   - self-contained full backup with direct R2/CDN media embedding
*/
(()=>{
  'use strict';
  if(window.__mwsCf57Runtime)return;
  window.__mwsCf57Runtime=true;

  const BUILD='CF V5.7';
  const MAX_PROFILE_SIZE=1600;
  const PROFILE_QUALITY=.92;

  function clone(v){
    try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v))}
  }

  function loadImage(dataUrl){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error('이미지를 읽지 못했습니다.'));
      img.src=dataUrl;
    });
  }

  async function compressProfileImageV57(dataUrl,maxSize=MAX_PROFILE_SIZE,quality=PROFILE_QUALITY){
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

  try{window.compressContactImage=compressProfileImageV57;compressContactImage=compressProfileImageV57}catch(_){}
  try{window.compressFolderContactPhotoV417=compressProfileImageV57;compressFolderContactPhotoV417=compressProfileImageV57}catch(_){}
  window.mwsV57CompressProfileImage=compressProfileImageV57;

  function mediaBase(){
    return String(window.__mwsCf57MediaBaseUrl||localStorage.getItem('mws_cf_v57_media_base')||'').replace(/\/+$/,'');
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
    async function run(){
      while(true){
        const i=cursor++;
        if(i>=items.length)return;
        const result=await worker(items[i],i);
        done++;
        onProgress?.(done,items.length,result,i);
      }
    }
    await Promise.all(Array.from({length:Math.max(1,Math.min(limit,items.length||1))},run));
  }

  function saveJson(obj,name){
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    return blob.size;
  }

  function baseBackup(){
    if(typeof window.buildFullBackupObject!=='function')throw new Error('백업 생성 함수를 찾지 못했습니다.');
    return clone(window.buildFullBackupObject());
  }

  function statusEl(){return document.getElementById('fullBackupAssetStatus')}
  function setStatus(text,ok=false){const el=statusEl();if(el){el.textContent=text;el.classList.toggle('ok',Boolean(ok))}}

  async function quickBackup(){
    const backup=baseBackup();
    const refs=collectManagedMedia(backup.data);
    backup.version=Math.max(39,Number(backup.version)||0);
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
      const map=new Map(),failures=[];
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
        console.error('CF V5.7 backup media failures',failures);
        throw new Error(`이미지 ${failures.length}개를 받지 못했습니다. R2 CORS 설정을 확인하세요.`);
      }
      replaceManagedMedia(backup.data,map);
      if(backup.assets&&typeof backup.assets==='object'){
        backup.assets.contactImages={};
        backup.assets.contactTagBanners={};
      }
      backup.version=Math.max(39,Number(backup.version)||0);
      backup.exportedAt=new Date().toISOString();
      backup.meta={...(backup.meta||{}),backupMode:'self-contained',appBuild:BUILD,managedMediaEmbedded:map.size,embeddedMediaBytes:rawBytes,externalManagedMedia:0};
      const bytes=saveJson(backup,'mawang-scheduler-full-backup.json');
      setStatus(`완전 백업 완료 · 이미지 ${map.size}개 · ${(bytes/1024/1024).toFixed(1)} MB`,true);
      try{window.toast?.('완전 백업',`이미지 ${map.size}개를 실제 파일 데이터로 포함했습니다.`)}catch(_){}
    }catch(err){
      console.error('CF V5.7 complete backup failed',err);
      setStatus(`완전 백업 실패 · ${String(err?.message||err)}`,false);
      try{window.toast?.('완전 백업 실패',String(err?.message||err))}catch(_){}
    }finally{if(btn){btn.disabled=false;btn.textContent=old}}
  }

  function installBackupUi(){
    const full=document.getElementById('exportAllBtn');
    if(!full)return;
    full.textContent='완전 백업';
    full.title='현재 데이터와 R2 프로필/워크스페이스 이미지를 실제 데이터로 포함합니다.';
    full.onclick=e=>{e.preventDefault();completeBackup()};
    if(!document.getElementById('mwsV57QuickBackupBtn')){
      const quick=document.createElement('button');
      quick.type='button';quick.id='mwsV57QuickBackupBtn';quick.className='secondary';
      quick.textContent='빠른 데이터 백업';
      quick.title='이미지는 R2 URL로 유지하고 데이터만 빠르게 저장합니다.';
      quick.onclick=e=>{e.preventDefault();quickBackup().catch(err=>setStatus(String(err?.message||err)))};
      full.parentElement?.insertBefore(quick,full);
    }
    const refs=(()=>{try{return collectManagedMedia(baseBackup().data).length}catch(_){return 0}})();
    setStatus(`완전 백업 시 R2/CDN 이미지 ${refs}개 포함`);
  }

  function requestReport(){
    const base=mediaBase();
    const resources=performance.getEntriesByType?.('resource')||[];
    let r2=0;
    if(base){try{const origin=new URL(base).origin;r2=resources.filter(x=>{try{return new URL(x.name).origin===origin}catch(_){return false}}).length}catch(_){}}
    const legacy=typeof window.mwsV55EgressReport==='function'?window.mwsV55EgressReport():null;
    return {build:BUILD,mediaBase:base||null,r2CdnResourceLoads:r2,legacyMetrics:legacy};
  }

  window.mwsV57CreateQuickBackup=quickBackup;
  window.mwsV57CreateCompleteBackup=completeBackup;
  window.mwsV57RequestReport=requestReport;

  installBackupUi();
  setTimeout(installBackupUi,500);
  setTimeout(installBackupUi,1500);
})();
