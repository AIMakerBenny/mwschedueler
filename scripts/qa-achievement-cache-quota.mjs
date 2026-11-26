import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../assets/achievement-media-v1621.js',import.meta.url),'utf8');
const cloudBlob=new Blob(['image'],{type:'image/png'});
const local=new Map();
let quota=true, getCalls=0, writes=0;
const db={transaction(_store,mode){
  const tx={objectStore(){return {get(id){const req={result:local.get(id)};queueMicrotask(()=>req.onsuccess());return req},put(record){writes++;const req={};queueMicrotask(()=>{if(quota){tx.error=new DOMException('full','QuotaExceededError');tx.onerror()}else{local.set(record.id,record);tx.oncomplete()}});return req}}}};
  return tx;
}};
const window={indexedDB:true,dispatchEvent(){},mwsGetAchievementCardsV1621:()=>[]};
// This fixture exercises the canonical media fallback, with batch media disabled.
vm.runInNewContext(source,{window,document:{querySelector:()=>null},Blob,Date,DOMException,crypto,console,Event,indexedDB:{open(){const req={result:db};queueMicrotask(()=>req.onsuccess());return req}},fetch:async()=>{getCalls++;return {ok:true,blob:async()=>cloudBlob}},setTimeout(){},queueMicrotask});
const media=window.mwsAchievementMediaV1;
assert.equal(await media.getBlob('quota'),cloudBlob);
assert.equal(local.size,0);
assert.equal(writes,1);
await assert.rejects(media.put(cloudBlob,{id:'strict-write'}),{name:'QuotaExceededError'});
quota=false;
assert.equal(await media.getBlob('normal'),cloudBlob);
assert.equal(local.get('normal').blob,cloudBlob);
const prev=getCalls;
assert.equal(await media.getBlob('normal'),cloudBlob);
assert.equal(getCalls,prev);
console.log('Achievement cache quota fallback: PASS');
