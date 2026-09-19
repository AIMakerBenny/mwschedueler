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
let migrationPromise=null;

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
    updatedAt:now
  };
  await withStore('readwrite',store=>store.put(record));
  return record;
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
  const res=await fetch(cloudUrl(id),{method:'GET',credentials:'same-origin',cache:'default'});
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
  const local=await getLocal(id);
  if(local?.blob instanceof Blob)return local;
  const blob=await fetchCloudBlob(id);
  if(!(blob instanceof Blob))return null;
  return await storeLocal(blob,{id,kind:kindForId(id),mime:blob.type});
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
async function syncReferencedToCloud(){
  if(migrationPromise)return migrationPromise;
  migrationPromise=(async()=>{
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
          const record=await getLocal(id);
          if(!(record?.blob instanceof Blob)){missingLocal++;continue}
          local++;
          await uploadCloud(id,record.blob);
          uploaded++;
        }catch(error){
          failed++;
          console.warn('Achievement media cloud migration failed',id,error);
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(2,Math.max(1,ids.length))},worker));
    const result={authenticated:true,referenced:ids.length,local,uploaded,existing,missingLocal,failed};
    window.__mwsAchievementMediaCloudSyncV1621=result;
    try{window.dispatchEvent(new CustomEvent('mws:achievement-media-cloud-sync',{detail:result}))}catch(_){}
    return result;
  })().finally(()=>{migrationPromise=null});
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
setTimeout(()=>{syncReferencedToCloud().catch(error=>console.warn('Achievement media startup cloud sync failed',error))},250);
try{window.dispatchEvent(new Event('mws:achievement-media-ready'))}catch(_){}
})();
