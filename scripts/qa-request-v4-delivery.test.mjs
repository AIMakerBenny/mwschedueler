import test from 'node:test';
import assert from 'node:assert/strict';
import '../assets/media-v4-delivery.js';
const M=globalThis.MWSMediaV4;
const bytes=i=>new Uint8Array([137,80,78,71,13,10,26,10,i%256,Math.floor(i/256)]);
const url=i=>'/media/contact/qa'+i+'?v=1&h='+String(i+1).padStart(32,'0')+'&r=2';
async function fixture(n){
 const entries=[],objects=new Map(),packs=[];
 for(let i=0;i<n;i++){const b=bytes(i),sha256=await M.digest(b);entries.push({url:url(i),sha256,type:'image/png',bytes:b.length});objects.set('/v4/objects/'+sha256,{b,type:'image/png'})}
 for(let i=0;i+4<=n;i+=4){const es=entries.slice(i,i+4),b=new Uint8Array(40),members=es.map((e,j)=>{b.set(bytes(i+j),j*10);return {url:e.url,offset:j*10}}),sha256=await M.digest(b);packs.push({sha256,bytes:b.length,members});objects.set('/v4/packs/'+sha256,{b,type:'application/octet-stream'})}
 return {catalog:{schema:1,origin:'https://media.example.test',entries,packs},objects}
}
const req=u=>new Request('https://scheduler.example.test'+u);
test('strict origin, exact contact allowlist and private paths',async()=>{
 assert.equal(M.origin('https://x.r2.dev'),'');assert.equal(M.origin('https://x.workers.dev'),'');assert.equal(M.origin('https://x.test/path'),'');assert.equal(M.origin('https://user@x.test'),'');
 const f=await fixture(4);let calls=0;const d=M.create(f.catalog,{fetcher:async()=>{calls++;throw Error('unexpected')}});
 for(const u of ['/media/workspace/private?v=1&h='+'a'.repeat(32),'/media/achievement/id',url(99),url(0)+'&v=2'])assert.equal(await d(req(u)),null);
 assert.equal(calls,0);assert.equal(M.create(null),null);
});
for(const n of [10,50,100,300,500,1000,2000])test('approved scale '+n,async()=>{
 const f=await fixture(n);let calls=0,pack=0,download=0;
 const d=M.create(f.catalog,{windowMs:1,fetcher:async(u,opts)=>{assert.equal(opts.credentials,'omit');assert.equal(opts.redirect,'error');calls++;if(u.includes('/packs/'))pack++;const x=f.objects.get(new URL(u).pathname);download+=x.b.length;return new Response(x.b,{headers:{'content-type':x.type,'content-length':String(x.b.length)}})}});
 for(let i=0;i<n;i+=40){const rs=await Promise.all(f.catalog.entries.slice(i,i+40).map(e=>d(req(e.url))));assert(rs.every(r=>r?.status===200));for(const r of rs)assert.equal((await r.arrayBuffer()).byteLength,10)}
 assert.equal(pack,Math.floor(n/4));assert.equal(calls,Math.floor(n/4)+n%4);assert.equal(download,n*10);
});
test('sparse demand fetches only one object; corrupt bundle uses verified individual bytes; missing revision never maps',async()=>{
 const f=await fixture(4);const paths=[];const d=M.create(f.catalog,{windowMs:1,fetcher:async(u)=>{const p=new URL(u).pathname;paths.push(p);const x=f.objects.get(p);return new Response(p.includes('/packs/')?new Uint8Array(x.b.length):x.b,{headers:{'content-type':x.type}})}});
 assert((await d(req(url(0)))).ok);assert.equal(paths.length,1);assert(paths[0].includes('/objects/'));
 assert((await Promise.all(f.catalog.entries.map(e=>d(req(e.url))))).every(x=>x?.ok));
 assert.equal(paths.filter(p=>p.includes('/packs/')).length,1);
 assert.equal(await d(req(url(0).replace('v=1','v=2'))),null);
});
test('invalid data and unavailable CDN return null for canonical fallback; negative retry cooldown',async()=>{
 const f=await fixture(4);let calls=0;const d=M.create(f.catalog,{windowMs:1,fetcher:async()=>{calls++;return new Response(new Uint8Array(10),{headers:{'content-type':'image/png'}})}});
 assert.equal(await d(req(url(0))),null);assert.equal(await d(req(url(0))),null);assert.equal(calls,1);
 const bad=structuredClone(f.catalog);bad.packs[0].members[1].offset=0;assert.equal(M.create(bad),null);
});

test('allowlisted exact workspace banner/emoticon/minigame and character profile revisions',async()=>{
 const f=await fixture(1),base=f.catalog.entries[0],hash='a'.repeat(32);
 const urls=['/media/workspace/tag-'+hash+'?v=2&h='+hash,'/media/workspace/emoticon-'+hash+'?v=2&h='+hash,'/media/workspace/mini-'+hash+'?v=2&h='+hash,'/media/mawang-profile/yoo?rev=1234-abcd'];
 f.catalog.entries=urls.map(url=>({...base,url}));
 const d=M.create(f.catalog,{fetcher:async()=>new Response(bytes(0),{headers:{'content-type':'image/png'}})});
 const rs=await Promise.all(urls.map(u=>d(req(u))));assert(rs.every(r=>r?.ok));
 assert.equal(rs[0].headers.get('x-mws-cache-version'),'2-'+hash);assert.equal(rs[3].headers.get('x-mws-cache-version'),'1234-abcd');
 assert.equal(await d(req('/media/workspace/private?v=2&h='+hash)),null);
 assert.equal(await d(req('/media/mawang-profile/yoo?rev=1235-abcd')),null);
});
