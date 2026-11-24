/* Share only explicitly opted-in public external reads, in memory, across same-origin tabs. */
(()=>{
'use strict';
if(window.mwsPublicReadSharingV1)return;
function createPublicReadSharing({channel,locks,storage,now=Date.now,delay=setTimeout,cancel=clearTimeout}){
 const cache=new Map(),waiting=new Map();let seq=0;
 const validAge=(record,ttl)=>record&&Number.isFinite(record.at)&&record.at<=now()&&now()-record.at<ttl;
 const save=(key,record)=>{
  if(!validAge(record,60000)||cache.get(key)?.at>record.at)return;
  cache.delete(key);cache.set(key,record);
  while(cache.size>100)cache.delete(cache.keys().next().value);
 };
 function send(message){try{channel?.postMessage(message)}catch(_){}}
 if(channel)channel.onmessage=event=>{
  const m=event.data;if(!m||typeof m.key!=='string'||m.key.length>16000)return;
  if(m.type==='query'&&typeof m.id==='string'&&m.id.length<=120){
   const row=cache.get(m.key);if(validAge(row,Math.min(60000,Math.max(0,Number(m.ttl)||0))))send({type:'reply',key:m.key,id:m.id,row});
  }else if(m.type==='reply'){
   const accept=waiting.get(m.id);if(accept&&accept.key===m.key)accept.receive(m.row);
  }
 };
 async function read(key,{ttl,load,valid=()=>true,force=false}){
  const usable=row=>validAge(row,ttl)&&valid(row.value);
  const fetchNew=async()=>{const at=now(),value=await load();if(valid(value))save(key,{at,value});return {at,value}};
  if(force||!channel||!locks?.request)return fetchNew();
  const current=cache.get(key);if(usable(current))return current;
  let entered=false;
  try{return await locks.request('mws-public-read:'+key,async()=>{
   entered=true;
   const existing=cache.get(key);if(usable(existing))return existing;
   const id=String(now())+':'+String(++seq)+':'+Math.random().toString(36).slice(2);
   const peer=await new Promise(resolve=>{
    let timer;const finish=row=>{waiting.delete(id);cancel(timer);resolve(row)};
    waiting.set(id,{key,receive:row=>{if(usable(row))finish(row)}});
    timer=delay(()=>finish(null),60);send({type:'query',key,id,ttl});
   });
   if(usable(peer)){save(key,peer);return peer}
   return fetchNew();
  })}catch(error){if(entered)throw error;return fetchNew()}
 }
 // A confirmed same-browser save invalidates startup/parts sharing without a
 // polling timer or sending private data. New tabs read the same storage epoch.
 const workspaceEpochKey='mws-public-workspace-epoch-v3';
 function workspaceEpoch(){
  if(storage===null)return null;
  if(storage===undefined)return '0'; // injectable non-browser unit-test adapter
  try{return storage.getItem(workspaceEpochKey)||'0'}catch(_){return null}
 }
 function invalidateWorkspace(){
  if(!storage)return false;
  try{storage.setItem(workspaceEpochKey,String(now())+':'+Math.random().toString(36).slice(2));return true}catch(_){return false}
 }
 function readWorkspace(key,policy){
  const epoch=workspaceEpoch();
  if(epoch===null)return Promise.resolve().then(policy.load).then(value=>({at:now(),value}));
  return read('workspace-epoch:'+epoch+':'+key,policy);
 }
 function publishWorkspaceParts(versions){
  if(!storage||!versions||typeof versions!=='object')return false;
  try{
   storage.setItem('mws-public-confirmed-parts-v3',JSON.stringify({at:now(),nonce:Math.random(),versions}));
   return true;
  }catch(_){return false}
 }
 return {read,readWorkspace,invalidateWorkspace,publishWorkspaceParts};
}
let channel=null,locks=null;try{locks=typeof navigator==='object'?navigator.locks:null;if(typeof BroadcastChannel==='function'&&locks?.request)channel=new BroadcastChannel('mws-public-read-sharing-v1')}catch(_){}
let storage=null;try{storage=window.localStorage}catch(_){}
window.mwsPublicReadSharingV1=createPublicReadSharing({channel,locks,storage});
})();
