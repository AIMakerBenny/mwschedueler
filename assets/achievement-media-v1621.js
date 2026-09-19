/* Mawang Scheduler v1.6.21 - Achievement media storage foundation, Phase 88 */
(()=>{
'use strict';
if(window.__mwsAchievementMediaRuntimeV1621)return;
window.__mwsAchievementMediaRuntimeV1621=true;

const DB_NAME='mws_achievement_media_v1';
const DB_VERSION=1;
const STORE='media';
let dbPromise=null;

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
    tx.oncomplete=()=>resolve(result);
    tx.onerror=()=>reject(tx.error||new Error('Achievement media transaction failed'));
    tx.onabort=()=>reject(tx.error||new Error('Achievement media transaction aborted'));
  });
}
function requestResult(req){
  return new Promise((resolve,reject)=>{
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Achievement media request failed'));
  });
}
async function put(blob,meta={}){
  if(!(blob instanceof Blob))throw new TypeError('Achievement media must be a Blob');
  const now=new Date().toISOString();
  const id=String(meta.id||crypto.randomUUID());
  const existing=meta.id?await get(id):null;
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
  return {...record,blob:undefined};
}
async function get(id){
  id=String(id||'');if(!id)return null;
  const db=await openDb();
  return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).get(id);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error||new Error('Achievement media read failed'));
  });
}
async function getBlob(id){const record=await get(id);return record?.blob instanceof Blob?record.blob:null}
async function has(id){return Boolean(await get(id))}
async function remove(id){
  id=String(id||'');if(!id)return false;
  await withStore('readwrite',store=>store.delete(id));
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
  listIds
});
try{window.dispatchEvent(new Event('mws:achievement-media-ready'))}catch(_){}
})();
