import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('workspace cache shares only exact immutable revisions; wrapper preserves authoritative cache policy',async()=>{
 const auth=read('src/cf-v111-auth.js'),start=auth.indexOf('async function handleMedia('),end=auth.indexOf('const ACHIEVEMENT_MEDIA_MAX_BYTES',start);
 const token='a'.repeat(32);
 const object={body:new Uint8Array([1]),httpEtag:'fixture',writeHttpMetadata:h=>h.set('content-type','image/png')};
 const keys=new Set(['workspace/qa/v1-'+token,'workspace/qa']);
 const env={IMAGES:{get:async key=>keys.has(key)?object:null}};
 const handler=new Function('cleanMediaToken','currentImageRecord','tokenFromImageSource','r2VersionedKey','r2Key',auth.slice(start,end)+'\nreturn handleMedia')(
  v=>/^[a-f0-9]{32}$/.test(v||'')?v:'',async()=>null,()=>'',(kind,key,ver,h='')=>kind+'/'+key+'/v'+ver+(h?'-'+h:''),(kind,key)=>kind+'/'+key);
 const raw=read('src/cf-v122-cache.js').replace(/^import[^\n]+\n/,'').replace('export default','return');
 const wrapper=new Function('appWorker',raw)({fetch:(req,env)=>handler(req,env,'workspace','qa')});
 const get=(query)=>wrapper.fetch(new Request('https://fixture.invalid/media/workspace/qa?'+query),env,{});
 const exact=await get('v=1&h='+token);assert.equal(exact.headers.get('x-mws-cache-version'),'1-'+token);assert.match(exact.headers.get('cache-control'),/immutable/);
 const wrong=await get('v=2&h='+token);assert.equal(wrong.headers.get('cache-control'),'no-store');assert.equal(wrong.headers.get('x-mws-cache-version'),null);
 const malformed=await get('v=2&h=bad');assert.equal(malformed.headers.get('cache-control'),'no-store');
 const mutable=await get('v=2');assert.equal(mutable.headers.get('cache-control'),'public, max-age=300');
});
test('confirmed workspace save invalidates stale cross-tab startup without polling or broadcasting data',async()=>{
 const helper=read('assets/public-read-sharing-v1.js');
 const create=new Function(helper.slice(helper.indexOf('function createPublicReadSharing'),helper.indexOf('let channel=null'))+'\nreturn createPublicReadSharing')();
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const channels=[],queues=new Map();
 const channel=()=>{const c={postMessage(m){for(const p of channels)if(p!==c)queueMicrotask(()=>p.onmessage?.({data:structuredClone(m)}))}};channels.push(c);return c};
 const locks={request(key,fn){const p=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(fn);queues.set(key,p);return p}};
 let calls=0,version=1,now=100000;
 const tabs=Array.from({length:3},()=>create({channel:channel(),locks,storage,now:()=>now}));
 const policy={ttl:8000,load:async()=>{calls++;return {version}},valid:v=>Number.isInteger(v.version)};
 assert.equal((await tabs[0].readWorkspace('startup',policy)).value.version,1);
 assert.equal((await tabs[1].readWorkspace('startup',policy)).value.version,1);assert.equal(calls,1);
 version=2;assert(tabs[2].invalidateWorkspace());assert.equal(calls,1,'Invalidation emitted a request');
 const fresh=await Promise.all(tabs.map(t=>t.readWorkspace('startup',policy)));
 assert(fresh.every(r=>r.value.version===2));assert.equal(calls,2);
 const disabled=create({channel:channel(),locks,storage:null,now:()=>now});
 await disabled.readWorkspace('startup',policy);await disabled.readWorkspace('startup',policy);assert.equal(calls,4);
});
