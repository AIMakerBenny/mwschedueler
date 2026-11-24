/* Mawang Scheduler v1.6.21 - Achievement media local cache + Cloudflare R2 sync */
(()=>{
'use strict';
if(window.__mwsAchievementMediaRuntimeV1621)return;
window.__mwsAchievementMediaRuntimeV1621=true;

const DB_NAME='mws_achievement_media_v1';
const DB_VERSION=1;
const STORE='media';
const MAX_BYTES=32*1024*1024;
let dbPromise=null;
let migrationPromise=null,migrationLocalOnly=false;
const pendingReads=new Map();

function openDb(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>{dbPromise=null;reject(req.error||new Error('Achievement media database open failed'))};
    req.onblocked=()=>{dbPromise=null;reject(new Error('Achievement media database open blocked'))};
  });
  return dbPromise;
}
async function withStore(mode,work){
  const db=await openDb();
  return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,mode);
    const store=tx.objectStore(STORE);
    let result;
    try{result=work(store)}catch(error){reject(error);return}
    tx.oncomplete=()=>resolve(result?.result??result);
    tx.onerror=()=>reject(tx.error||new Error('Achievement media transaction failed'));
    tx.onabort=()=>reject(tx.error||new Error('Achievement media transaction aborted'));
  });
}
async function getLocal(id){
  id=String(id||'');if(!id)return null;
  const db=await openDb();
  return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).get(id);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error||new Error('Achievement media read failed'));
  });
}
function kindForId(id){
  try{
    const cards=window.mwsGetAchievementCardsV1621?.()||[];
    if(cards.some(card=>String(card?.backImageId||'')===id))return 'back';
  }catch(_){}
  return 'front';
}
async function storeLocal(blob,meta={}){
  if(!(blob instanceof Blob))throw new TypeError('Achievement media must be a Blob');
  if(blob.size>MAX_BYTES)throw new Error('Achievement media exceeds 32MB');
  const now=new Date().toISOString();
  const id=String(meta.id||crypto.randomUUID());
  const existing=meta.id?await getLocal(id):null;
  const record={
    id,
    blob,
    mime:String(blob.type||meta.mime||'application/octet-stream'),
    kind:meta.kind==='back'?'back':'front',
    width:Math.max(0,Number(meta.width)||0),
    height:Math.max(0,Number(meta.height)||0),
    size:Math.max(0,Number(blob.size)||0),
    createdAt:String(existing?.createdAt||meta.createdAt||now),
    updatedAt:now,
    cloudConfirmed:meta.cloudConfirmed===true
  };
  await withStore('readwrite',store=>store.put(record));
  return record;
}
// A successful cloud GET or PUT proves this immutable image ID is already stored.
// Update metadata without resurrecting a record deleted or replaced during an upload.
async function markCloudConfirmed(id,updatedAt){
  try{await withStore('readwrite',store=>{
    const req=store.get(id);
    req.onsuccess=()=>{const record=req.result;if(record&&record.updatedAt===updatedAt&&!record.cloudConfirmed)store.put({...record,cloudConfirmed:true})};
    return req;
  })}catch(_){}
}
function cloudUrl(id){return '/media/achievement/'+encodeURIComponent(String(id||''))}
function cloudApiUrl(id){return '/api/achievement-media/'+encodeURIComponent(String(id||''))}
async function cloudExists(id){
  id=String(id||'');if(!id)return false;
  try{
    const res=await fetch(cloudUrl(id),{method:'HEAD',credentials:'same-origin',cache:'no-store'});
    return res.ok;
  }catch(_){return false}
}
async function fetchCloudBlob(id){
  id=String(id||'');if(!id)return null;
  const canonical=cloudUrl(id),direct=window.mwsPublicMediaUrlV1?.(canonical);
  if(direct){
    try{
      const response=await fetch(direct,{method:'GET',credentials:'omit',cache:'default',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)});
      if(response.ok&&/^image\//i.test(response.headers.get('content-type')||'')){
        const blob=await response.blob();
        if(blob instanceof Blob&&blob.size>0&&blob.size<=MAX_BYTES)return blob;
      }else await response.body?.cancel();
    }catch(_){/* Canonical Worker remains authoritative on CDN failure. */}
  }
  let res=null;
  if(document.querySelector('meta[name="mws-media-batch-v5"]')?.content==='1'){
    try{res=await (await import('/assets/media-batch-client-v5.js')).getDemandedMedia(cloudUrl(id))}catch{}
  }
  res??=await fetch(cloudUrl(id),{method:'GET',credentials:'same-origin',cache:'default'});
  if(res.status===404)return null;
  if(!res.ok)throw new Error('Achievement cloud media read failed: HTTP '+res.status);
  const blob=await res.blob();
  if(!(blob instanceof Blob)||blob.size<1)return null;
  if(blob.size>MAX_BYTES)throw new Error('Achievement cloud media exceeds 32MB');
  return blob;
}
async function uploadCloud(id,blob){
  id=String(id||'');
  if(!id)throw new Error('Achievement media id is missing');
  if(!(blob instanceof Blob))throw new TypeError('Achievement media must be a Blob');
  if(blob.size>MAX_BYTES)throw new Error('Achievement media exceeds 32MB');
  const res=await fetch(cloudApiUrl(id),{
    method:'PUT',
    credentials:'same-origin',
    headers:{'content-type':String(blob.type||'application/octet-stream')},
    body:blob
  });
  let body=null;try{body=await res.json()}catch(_){}
  if(!res.ok)throw new Error(body?.error||('Achievement cloud media upload failed: HTTP '+res.status));
  return body||{ok:true,id};
}
async function deleteCloud(id){
  id=String(id||'');if(!id)return false;
  const res=await fetch(cloudApiUrl(id),{method:'DELETE',credentials:'same-origin'});
  if(res.status===404)return true;
  let body=null;try{body=await res.json()}catch(_){}
  if(!res.ok)throw new Error(body?.error||('Achievement cloud media delete failed: HTTP '+res.status));
  return true;
}
async function put(blob,meta={}){
  if(!(blob instanceof Blob))throw new TypeError('Achievement media must be a Blob');
  const id=String(meta.id||crypto.randomUUID());
  const previous=await getLocal(id);
  const record=await storeLocal(blob,{...meta,id});
  try{
    await uploadCloud(id,blob);
    await markCloudConfirmed(id,record.updatedAt);
  }catch(error){
    try{
      if(previous)await withStore('readwrite',store=>store.put(previous));
      else await withStore('readwrite',store=>store.delete(id));
    }catch(_){}
    throw error;
  }
  return {...record,blob:undefined};
}
async function get(id){
  id=String(id||'');if(!id)return null;
  if(pendingReads.has(id))return pendingReads.get(id);
  const reading=readWithMediaLock(id).finally(()=>{if(pendingReads.get(id)===reading)pendingReads.delete(id)});
  pendingReads.set(id,reading);return reading;
}
async function readWithMediaLock(id){
  const locks=window.navigator?.locks;
  if(!locks?.request)return readMedia(id);
  let entered=false;
  try{return await locks.request('mws-achievement-media-v3:'+id,async()=>{entered=true;return readMedia(id)})}
  catch(error){if(entered)throw error;return readMedia(id)}
}
async function readMedia(id){
  const local=await getLocal(id).catch(()=>null);
  if(local?.blob instanceof Blob)return local;
  const blob=await fetchCloudBlob(id);
  if(!(blob instanceof Blob))return null;
  const kind=kindForId(id);
  try{
    return await storeLocal(blob,{id,kind,mime:blob.type,cloudConfirmed:true});
  }catch(error){
    // Cloud media remains readable even when the optional local cache is full.
    // Keep upload/write operations strict; this fallback applies only to reads.
    // The remote image remains usable if IndexedDB is blocked or unavailable.
    // Upload and delete operations still use the strict write path.
    const now=new Date().toISOString();
    return {id,blob,mime:blob.type||'application/octet-stream',kind,width:0,height:0,size:blob.size,createdAt:now,updatedAt:now};
  }
}
async function getBlob(id){const record=await get(id);return record?.blob instanceof Blob?record.blob:null}
async function has(id){
  id=String(id||'');if(!id)return false;
  if(await getLocal(id))return true;
  return await cloudExists(id);
}
async function remove(id){
  id=String(id||'');if(!id)return false;
  await withStore('readwrite',store=>store.delete(id));
  await deleteCloud(id);
  return true;
}
async function listIds(){
  const db=await openDb();
  return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).getAllKeys();
    req.onsuccess=()=>resolve((req.result||[]).map(String));
    req.onerror=()=>reject(req.error||new Error('Achievement media list failed'));
  });
}
function referencedIds(){
  const ids=new Set();
  try{
    for(const card of window.mwsGetAchievementCardsV1621?.()||[]){
      const front=String(card?.frontImageId||''),back=String(card?.backImageId||'');
      if(front)ids.add(front);if(back)ids.add(back);
    }
  }catch(_){}
  return [...ids];
}
async function syncReferencedToCloud({localOnly=false}={}){
  if(migrationPromise){if(!localOnly&&migrationLocalOnly){await migrationPromise;return syncReferencedToCloud()}return migrationPromise}
  migrationLocalOnly=localOnly;
  migrationPromise=(async()=>{
    const referenced=referencedIds();
    let ids=referenced;
    if(localOnly){
      const localIds=new Set(await listIds());ids=[];
      for(const id of referenced){if(!localIds.has(id))continue;const record=await getLocal(id);if(record?.blob instanceof Blob&&!record.cloudConfirmed)ids.push(id)}
      if(!ids.length)return {authenticated:true,referenced:referenced.length,local:0,uploaded:0,existing:0,missingLocal:0,failed:0,skipped:true};
    }
    let session=null;
    try{
      const res=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store'});
      if(res.ok)session=await res.json();
    }catch(_){}
    if(!session?.authenticated)return {authenticated:false,referenced:0,local:0,uploaded:0,existing:0,missingLocal:0,failed:0};
    let local=0,uploaded=0,existing=0,missingLocal=0,failed=0,cursor=0;
    async function worker(){
      while(true){
        const index=cursor++;if(index>=ids.length)return;
        const id=ids[index];
        try{
          const record=await getLocal(id);
          if(await cloudExists(id)){if(record)await markCloudConfirmed(id,record.updatedAt);existing++;continue}
          if(!(record?.blob instanceof Blob)){missingLocal++;continue}
          local++;
          await uploadCloud(id,record.blob);
          await markCloudConfirmed(id,record.updatedAt);
          uploaded++;
        }catch(error){
          failed++;
          console.warn('Achievement media cloud migration failed',id,error);
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(2,Math.max(1,ids.length))},worker));
    const result={authenticated:true,referenced:referenced.length,local,uploaded,existing,missingLocal,failed};
    window.__mwsAchievementMediaCloudSyncV1621=result;
    try{window.dispatchEvent(new CustomEvent('mws:achievement-media-cloud-sync',{detail:result}))}catch(_){}
    return result;
  })().finally(()=>{migrationPromise=null;migrationLocalOnly=false});
  return migrationPromise;
}

window.mwsAchievementMediaV1=Object.freeze({
  dbName:DB_NAME,
  dbVersion:DB_VERSION,
  storeName:STORE,
  open:openDb,
  put,
  get,
  getBlob,
  has,
  remove,
  listIds,
  cloudExists,
  syncReferencedToCloud
});
// Migration only needs local-only legacy blobs, not a HEAD for every remote card on every login.
// The explicit syncReferencedToCloud() remains available for full verification.
async function startupLocalMigration(){
  if(document.body?.dataset?.mwsMode!=='admin')return;
  await syncReferencedToCloud({localOnly:true});
}
const scheduleLocalMigration=()=>setTimeout(()=>{if(typeof document!=='undefined')startupLocalMigration().catch(error=>console.warn('Achievement media startup cloud sync failed',error))},250);
scheduleLocalMigration();window.addEventListener?.('mws:app-ready',scheduleLocalMigration);
try{window.dispatchEvent(new Event('mws:achievement-media-ready'))}catch(_){}
})();
