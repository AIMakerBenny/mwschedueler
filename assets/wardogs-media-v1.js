/* WARDOGS Phase 130 - card media R2 persistence + optional IndexedDB cache */
(()=>{
'use strict';
if(window.__mwsWardogsMediaV121)return;
window.__mwsWardogsMediaV121=true;

const DB_NAME='mws_wardogs_media_v1';
const DB_VERSION=1;
const STORE='media';
const MAX_BYTES=32*1024*1024;
let dbPromise=null;
let syncPromise=null;
let localWarningShown=false;

function createId(){
  const shared=window.mwsWardogsDataV119?.createId;
  if(typeof shared==='function')return shared();
  return 'wdm-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
}
function noteLocalFailure(error){
  window.__mwsWardogsMediaLocalStorageV130='unavailable';
  if(localWarningShown)return;
  localWarningShown=true;
  console.warn('WARDOGS IndexedDB cache unavailable; continuing with Cloudflare R2 where possible.',error);
}

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
    req.onerror=()=>{dbPromise=null;reject(req.error||new Error('WARDOGS media database open failed'))};
    req.onblocked=()=>{dbPromise=null;reject(new Error('WARDOGS media database open blocked'))};
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
    tx.onerror=()=>reject(tx.error||new Error('WARDOGS media transaction failed'));
    tx.onabort=()=>reject(tx.error||new Error('WARDOGS media transaction aborted'));
  });
}
async function getLocal(id){
  id=String(id||'');if(!id)return null;
  const db=await openDb();
  return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).get(id);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error||new Error('WARDOGS media read failed'));
  });
}
async function tryGetLocal(id){
  try{return await getLocal(id)}
  catch(error){noteLocalFailure(error);return null}
}
async function tryStoreLocal(blob,meta={}){
  try{return await storeLocal(blob,meta)}
  catch(error){noteLocalFailure(error);return null}
}
async function tryDeleteLocal(id){
  try{await withStore('readwrite',store=>store.delete(id));return true}
  catch(error){noteLocalFailure(error);return false}
}
async function storeLocal(blob,meta={}){
  if(!(blob instanceof Blob))throw new TypeError('WARDOGS media must be a Blob');
  if(blob.size<1)throw new Error('WARDOGS media is empty');
  if(blob.size>MAX_BYTES)throw new Error('WARDOGS media exceeds 32MB');
  const now=new Date().toISOString();
  const id=String(meta.id||createId());
  const existing=meta.id?await getLocal(id):null;
  const record={
    id,
    blob,
    mime:String(blob.type||meta.mime||'application/octet-stream'),
    width:Math.max(0,Number(meta.width)||0),
    height:Math.max(0,Number(meta.height)||0),
    size:Math.max(0,Number(blob.size)||0),
    createdAt:String(existing?.createdAt||meta.createdAt||now),
    updatedAt:now
  };
  await withStore('readwrite',store=>store.put(record));
  return record;
}
function cloudUrl(id){return '/media/wardogs/'+encodeURIComponent(String(id||''))}
function cloudApiUrl(id){return '/api/wardogs-media/'+encodeURIComponent(String(id||''))}
async function cloudExists(id){
  id=String(id||'');if(!id)return false;
  try{
    const res=await fetch(cloudUrl(id),{method:'HEAD',credentials:'same-origin',cache:'no-store'});
    return res.ok;
  }catch(_){return false}
}
async function fetchCloudBlob(id){
  id=String(id||'');if(!id)return null;
  const res=await fetch(cloudUrl(id),{method:'GET',credentials:'same-origin',cache:'default'});
  if(res.status===404)return null;
  if(!res.ok)throw new Error('WARDOGS cloud media read failed: HTTP '+res.status);
  const blob=await res.blob();
  if(!(blob instanceof Blob)||blob.size<1)return null;
  if(blob.size>MAX_BYTES)throw new Error('WARDOGS cloud media exceeds 32MB');
  if(!String(blob.type||'').toLowerCase().startsWith('image/'))throw new Error('WARDOGS cloud media is not an image');
  return blob;
}
async function uploadCloud(id,blob){
  id=String(id||'');
  if(!id)throw new Error('WARDOGS media id is missing');
  if(!(blob instanceof Blob))throw new TypeError('WARDOGS media must be a Blob');
  if(blob.size<1)throw new Error('WARDOGS media is empty');
  if(blob.size>MAX_BYTES)throw new Error('WARDOGS media exceeds 32MB');
  const type=String(blob.type||'').split(';')[0].trim().toLowerCase();
  if(!type.startsWith('image/'))throw new Error('WARDOGS media must be an image');
  const res=await fetch(cloudApiUrl(id),{
    method:'PUT',
    credentials:'same-origin',
    headers:{'content-type':type},
    body:blob
  });
  let body=null;try{body=await res.json()}catch(_){}
  if(!res.ok)throw new Error(body?.error||('WARDOGS cloud media upload failed: HTTP '+res.status));
  return body||{ok:true,id};
}
async function deleteCloud(id){
  id=String(id||'');if(!id)return false;
  const res=await fetch(cloudApiUrl(id),{method:'DELETE',credentials:'same-origin'});
  if(res.status===404)return true;
  let body=null;try{body=await res.json()}catch(_){}
  if(!res.ok)throw new Error(body?.error||('WARDOGS cloud media delete failed: HTTP '+res.status));
  return true;
}
async function putLocal(blob,meta={}){
  if(!(blob instanceof Blob))throw new TypeError('WARDOGS media must be a Blob');
  const record=await storeLocal(blob,meta);
  return {...record,blob:undefined};
}
async function removeLocal(id){
  id=String(id||'');if(!id)return false;
  await withStore('readwrite',store=>store.delete(id));
  return true;
}
async function put(blob,meta={}){
  if(!(blob instanceof Blob))throw new TypeError('WARDOGS media must be a Blob');
  const id=String(meta.id||createId());
  const previous=await tryGetLocal(id);
  const record=await tryStoreLocal(blob,{...meta,id});
  try{
    await uploadCloud(id,blob);
  }catch(error){
    if(record){
      try{
        if(previous)await withStore('readwrite',store=>store.put(previous));
        else await withStore('readwrite',store=>store.delete(id));
      }catch(_){}
    }
    throw error;
  }
  if(record)return {...record,blob:undefined};
  const now=new Date().toISOString();
  return {
    id,
    mime:String(blob.type||meta.mime||'application/octet-stream'),
    width:Math.max(0,Number(meta.width)||0),
    height:Math.max(0,Number(meta.height)||0),
    size:Math.max(0,Number(blob.size)||0),
    createdAt:String(meta.createdAt||now),
    updatedAt:now
  };
}
async function get(id){
  id=String(id||'');if(!id)return null;
  const local=await tryGetLocal(id);
  if(local?.blob instanceof Blob)return local;
  const blob=await fetchCloudBlob(id);
  if(!(blob instanceof Blob))return null;
  const cached=await tryStoreLocal(blob,{id,mime:blob.type});
  if(cached)return cached;
  const now=new Date().toISOString();
  return {id,blob,mime:String(blob.type||'application/octet-stream'),width:0,height:0,size:blob.size,createdAt:now,updatedAt:now};
}
async function getBlob(id){const record=await get(id);return record?.blob instanceof Blob?record.blob:null}
async function has(id){
  id=String(id||'');if(!id)return false;
  if(await tryGetLocal(id))return true;
  return await cloudExists(id);
}
async function remove(id){
  id=String(id||'');if(!id)return false;
  await tryDeleteLocal(id);
  await deleteCloud(id);
  return true;
}
async function listIds(){
  const db=await openDb();
  return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).getAllKeys();
    req.onsuccess=()=>resolve((req.result||[]).map(String));
    req.onerror=()=>reject(req.error||new Error('WARDOGS media list failed'));
  });
}
function referencedIds(){
  const ids=new Set();
  try{
    for(const card of window.mwsWardogsDataV119?.get?.()?.cards||[]){
      const imageId=String(card?.imageId||'').trim();
      if(imageId)ids.add(imageId);
    }
  }catch(_){}
  return [...ids];
}
async function syncReferencedToCloud(){
  if(syncPromise)return syncPromise;
  syncPromise=(async()=>{
    let session=null;
    try{
      const res=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store'});
      if(res.ok)session=await res.json();
    }catch(_){}
    if(!session?.authenticated)return {authenticated:false,referenced:0,local:0,uploaded:0,existing:0,missingLocal:0,failed:0};
    const ids=referencedIds();
    let local=0,uploaded=0,existing=0,missingLocal=0,failed=0,cursor=0;
    async function worker(){
      while(true){
        const index=cursor++;if(index>=ids.length)return;
        const id=ids[index];
        try{
          if(await cloudExists(id)){existing++;continue}
          const record=await tryGetLocal(id);
          if(!(record?.blob instanceof Blob)){missingLocal++;continue}
          local++;
          await uploadCloud(id,record.blob);
          uploaded++;
        }catch(error){
          failed++;
          console.warn('WARDOGS media cloud sync failed',id,error);
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(2,Math.max(1,ids.length))},worker));
    const result={authenticated:true,referenced:ids.length,local,uploaded,existing,missingLocal,failed};
    window.__mwsWardogsMediaCloudSyncV121=result;
    try{window.dispatchEvent(new CustomEvent('mws:wardogs-media-cloud-sync',{detail:result}))}catch(_){}
    return result;
  })().finally(()=>{syncPromise=null});
  return syncPromise;
}

window.__mwsWardogsMediaStorageV130='r2-with-indexeddb-cache-fallback';
window.mwsWardogsMediaV1=Object.freeze({
  dbName:DB_NAME,
  dbVersion:DB_VERSION,
  storeName:STORE,
  maxBytes:MAX_BYTES,
  open:openDb,
  put,
  putLocal,
  removeLocal,
  get,
  getBlob,
  has,
  remove,
  listIds,
  cloudExists,
  syncReferencedToCloud
});
try{window.dispatchEvent(new Event('mws:wardogs-media-ready'))}catch(_){}
})();
