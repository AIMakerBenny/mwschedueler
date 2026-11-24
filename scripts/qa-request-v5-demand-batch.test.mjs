import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleMediaBatch} from '../src/media-batch-v5.js';
import {createMediaBatchClient} from '../assets/media-batch-client-v5.js';
import {CACHE_NAME,MAX_ITEMS} from '../assets/media-batch-protocol-v5.js';
const origin='https://fixture.invalid',token='a'.repeat(32);
const url=(i,v=1)=>'/media/contact/qa'+i+'?v='+v+'&h='+token+'&r=2';
const payload=(i,n=1024)=>new Uint8Array(n).fill(i%251);
function setup({size=1024,missing=[],privateIds=[],truncated=[],failCache=false}={}){
 let calls=0,reads=0,bytes=0;const saved=new Map(),seen=[];
 const env={MWS_MEDIA_BATCH_V5:'1',IMAGES:{async get(key){
   reads++;seen.push(key);const m=/qa(\d+)\/v(\d+)-/.exec(key);assert(m);const i=Number(m[1]);if(missing.includes(i))return null;
   const data=payload(i,size);let offset=0;
   return {size:data.length,writeHttpMetadata(h){h.set('content-type','image/png');if(privateIds.includes(i))h.set('cache-control','private')},body:new ReadableStream({pull(c){if(offset>=data.length||(truncated.includes(i)&&offset>=size/2)){c.close();return}const n=Math.min(8192,data.length-offset);c.enqueue(data.subarray(offset,offset+n));offset+=n;bytes+=n}})};
 }}};
 const storage={async open(name){assert.equal(name,CACHE_NAME);return {async match(k){return saved.get(k)?.clone()},async put(k,r){if(failCache)throw Error('quota');const b=await r.arrayBuffer();saved.set(k,new Response(b,{headers:r.headers}))}}}};
 const network=async(u,opts)=>{calls++;return handleMediaBatch(new Request(u,opts),env)};
 const newClient=()=>createMediaBatchClient({origin,storage,network,windowMs:1});
 return {env,newClient,saved,seen,counts:()=>({calls,reads,bytes})};
}
for(const count of [0,1,8,102,200,256,470])test('cold and warm '+count,async()=>{
 const s=setup(),c=s.newClient(),urls=Array.from({length:count},(_,i)=>url(i));
 const start=performance.now(),rows=await Promise.all(urls.map(c.get));
 for(let i=0;i<count;i++)assert.deepEqual(new Uint8Array(await rows[i].arrayBuffer()),payload(i));
 assert.deepEqual(s.counts(),{calls:Math.ceil(count/MAX_ITEMS),reads:count,bytes:count*1024});
 assert.equal(s.saved.size,count);
 const warm=s.newClient();await Promise.all(urls.map(warm.get));assert.equal(s.counts().calls,Math.ceil(count/MAX_ITEMS));
 console.log('V5_BATCH_SCALE '+JSON.stringify({count,cold:s.counts().calls,warm:0,r2:count,bytes:count*1024,localElapsedMs:Math.round(performance.now()-start)}));
});
test('only missing revisions and concurrent duplicate',async()=>{
 const s=setup(),c=s.newClient();await Promise.all([0,1,2].map(i=>c.get(url(i))));
 await Promise.all([c.get(url(0)),c.get(url(1,2)),c.get(url(1,2)),c.get(url(3))]);
 assert.deepEqual(s.counts(),{calls:2,reads:5,bytes:5120});assert.equal(s.saved.size,5);
});
test('missing and private object isolated, no persistence',async()=>{
 const s=setup({missing:[1],privateIds:[2]}),c=s.newClient();
 const rows=await Promise.all([0,1,2,3].map(i=>c.get(url(i))));
 assert(rows[0]);assert.equal(rows[1],null);assert.equal(rows[2],null);assert(rows[3]);assert.equal(s.saved.size,2);assert.equal(s.counts().calls,1);
});
test('interrupted frame preserves completed entries, next batch only misses',async()=>{
 const s=setup({size:16384,truncated:[2]}),c=s.newClient();
 const rows=await Promise.all([0,1,2,3].map(i=>c.get(url(i))));
 assert(rows[0]);assert(rows[1]);assert.equal(rows[2],null);assert.equal(rows[3],null);assert.equal(s.saved.size,2);
 await Promise.all([c.get(url(0)),c.get(url(1))]);assert.equal(s.counts().calls,1);
});
test('quota failure still delivers all bytes',async()=>{
 const s=setup({failCache:true}),c=s.newClient();const r=await c.get(url(2));assert.deepEqual(new Uint8Array(await r.arrayBuffer()),payload(2));assert.equal(s.saved.size,0);
});
test('malformed, disabled, cross-origin and oversized requests rejected before R2',async()=>{
 const s=setup(),make=(urls,headers={})=>new Request(origin+'/api/media-batch-v5',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify({urls})});
 for(const u of ['https://other.invalid/a','/media/workspace/tag-1?v=1&h='+token,'/media/contact/qa0?v=1&v=2&h='+token,'/media/contact/qa0?v=1','/media/contact/../qa0?v=1&h='+token])assert.equal((await handleMediaBatch(make([u]),s.env)).status,400);
 assert.equal((await handleMediaBatch(make([url(1),url(1)]),s.env)).status,400);
 assert.equal((await handleMediaBatch(make(Array.from({length:257},(_,i)=>url(i))),s.env)).status,400);
 assert.equal((await handleMediaBatch(make([url(1)],{origin:'https://other.invalid'}),s.env)).status,403);
 assert.equal((await handleMediaBatch(make([url(1)]),{...s.env,MWS_MEDIA_BATCH_V5:'0'})).status,404);
 assert.equal(s.counts().reads,0);
});
test('102 images of 512KiB delivered without server aggregate buffering',async()=>{
 const s=setup({size:512*1024}),c=s.newClient();
 const rows=await Promise.all(Array.from({length:102},(_,i)=>c.get(url(i))));
 assert(rows.every(Boolean));assert.equal(s.counts().calls,1);assert.equal(s.counts().reads,102);assert.equal(s.counts().bytes,102*512*1024);
 for(let i=0;i<102;i++){const b=new Uint8Array(await rows[i].arrayBuffer());assert.equal(b.length,512*1024);assert.equal(b[0],i%251);assert.equal(b.at(-1),i%251)}
 console.log('V5_BATCH_LARGE '+JSON.stringify(s.counts()));
});
