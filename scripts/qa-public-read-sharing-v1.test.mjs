import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/public-read-sharing-v1.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function createPublicReadSharing'),source.indexOf('let channel=null'));
const create=new Function(code+'\nreturn createPublicReadSharing')();
test('three tabs share a successful public read, not expired, failed or other-scope reads',async()=>{
 const channels=[],queues=new Map();
 const channel=()=>{const c={postMessage(m){for(const p of channels)if(p!==c)queueMicrotask(()=>p.onmessage?.({data:structuredClone(m)}))}};channels.push(c);return c};
 const locks={request(key,fn){const p=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(fn);queues.set(key,p);return p}};
 let now=100000,calls=0;
 const tabs=Array.from({length:3},()=>create({channel:channel(),locks,now:()=>now,delay:setTimeout,cancel:clearTimeout}));
 const policy={ttl:60000,load:async()=>({ok:true,n:++calls}),valid:x=>x.ok};
 const rows=await Promise.all(tabs.map(t=>t.read('comments:public:one',policy)));assert.equal(calls,1);assert(rows.every(r=>r.value.n===1&&r.at===now));
 await tabs[0].read('comments:admin:one',policy);assert.equal(calls,2);
 now+=60000;await tabs[1].read('comments:public:one',policy);assert.equal(calls,3);
 await tabs[1].read('comments:public:one',{...policy,force:true});assert.equal(calls,4);
 let failures=0;const bad={ttl:60000,load:async()=>{failures++;return{ok:false}},valid:x=>x.ok};await tabs[0].read('failure',bad);await tabs[1].read('failure',bad);assert.equal(failures,2);
 const fallback=create({channel:null,locks:null,now:()=>now});await fallback.read('key',policy);assert.equal(calls,5);
});

for(const path of ['assets/cloud-runtime-v130.js','assets/cloud-v1.1.js'])test(path+' remembered admin verifies real session once and never enters admin on invalid session',async()=>{
 const init=readFileSync(new URL('../'+path,import.meta.url),'utf8').split('\n').find(l=>l.includes('async function init()'));
 for(const [preferred,authenticated] of [['admin',true],['admin',false],['public',false]]){
  const requests=[];let hydrated=null,gate=false;
  const run=new Function('validateCacheSchema','installSaveBridge','bindUi','selectLoginMode','fetchJson','localStorage','REMEMBER_KEY','MODE_KEY','hydrate','installLazyTabBridge','showGate','setLoginError','console','currentAdmin',init+'\nreturn init')(
   async()=>{},()=>{},()=>{},()=>{},async url=>{requests.push(url);return {authenticated,user:{id:'admin'}}},{getItem:k=>k==='remember'?'1':preferred},'remember','mode',async m=>{hydrated=m},()=>{},()=>{gate=true},()=>{},{error(){}},null);
  await run();assert.deepEqual(requests,[preferred==='admin'?'/api/auth/session':'/api/health']);assert.equal(hydrated,preferred==='public'?'public':authenticated?'admin':null);assert.equal(gate,preferred==='admin'&&!authenticated);
 }
});
