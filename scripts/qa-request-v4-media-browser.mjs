// Real Chromium; two loopback origins stand in for scheduler and public CDN.
// Counters are fixture HTTP requests, not actual Cloudflare billing metrics.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
assert.equal(process.env.MWS_QA_OFFLINE,'1','Offline fixture only');
const hash=b=>createHash('sha256').update(b).digest('hex');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf2sAAAAASUVORK5CYII=','base64');
const url=(i,v=1)=>'/media/contact/qa'+i+'?v='+v+'&h='+String(i+1+v*10000).padStart(32,'0')+'&r=2';
const entries=[],packs=[],objects=new Map(),canonical=new Map();
const add=(i,v=1)=>{const b=Buffer.concat([png,Buffer.from(':'+i+':'+v)]),sha256=hash(b),e={url:url(i,v),sha256,type:'image/png',bytes:b.length};entries.push(e);objects.set('/v4/objects/'+sha256,{b,type:e.type});canonical.set(e.url,b);return e};
for(let i=0;i<2000;i++)add(i);
for(let i=0;i<2000;i+=4){const group=entries.slice(i,i+4);let offset=0;const members=group.map(e=>{const m={url:e.url,offset};offset+=e.bytes;return m});const b=Buffer.concat(group.map(e=>canonical.get(e.url))),sha256=hash(b);packs.push({sha256,bytes:b.length,members});objects.set('/v4/packs/'+sha256,{b,type:'application/octet-stream'})}
const changed=Array.from({length:10},(_,i)=>add(i,2));const fresh=add(2001);
const broken=add(2002),unavailable=add(2003);
let corrupt=new Set(),failed=new Set(),counts={worker:0,cdn:0,packs:0,bytes:0};
const snapshot=()=>({...counts}),delta=before=>Object.fromEntries(Object.keys(counts).map(k=>[k,counts[k]-before[k]]));
const listen=s=>new Promise(r=>s.listen(0,'127.0.0.1',r));
const close=s=>new Promise(r=>s.close(r));
const cdn=createServer((req,res)=>{
 const path=new URL(req.url,'http://127.0.0.1').pathname;counts.cdn++;if(path.includes('/packs/'))counts.packs++;
 const x=objects.get(path);
 res.setHeader('access-control-allow-origin','*');res.setHeader('cache-control','no-store');
 if(!x||failed.has(path)){res.writeHead(503).end();return}
 const b=corrupt.has(path)?Buffer.alloc(x.b.length):x.b;counts.bytes+=b.length;
 res.writeHead(200,{'content-type':x.type,'content-length':b.length}).end(b);
});
const dir=await mkdtemp(join(tmpdir(),'mws-v4-media-'));
const sw=(await readFile(new URL('../mws-media-cache-sw.js',import.meta.url),'utf8')).replace('V4_PUBLIC_MEDIA_ENABLED=false','V4_PUBLIC_MEDIA_ENABLED=true').replace('create(self.MWS_PUBLIC_MEDIA_V4_CATALOG)','create(self.MWS_PUBLIC_MEDIA_V4_CATALOG,{local:true})');
assert(sw.includes('{local:true}'));
const runtime=await readFile(new URL('../assets/media-v4-delivery.js',import.meta.url));
let catalog;
const app=createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1');
 if(u.pathname==='/'){res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'}).end('<!doctype html><title>V4 local fixture</title><main>Calendar fixture</main><script>navigator.serviceWorker.register("/mws-media-cache-sw.js")</script>');return}
 if(u.pathname==='/mws-media-cache-sw.js'){res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'}).end(sw);return}
 if(u.pathname==='/assets/media-v4-delivery.js'){res.writeHead(200,{'content-type':'text/javascript'}).end(runtime);return}
 if(u.pathname==='/assets/media-v4-catalog.js'){res.writeHead(200,{'content-type':'text/javascript'}).end('globalThis.MWS_PUBLIC_MEDIA_V4_CATALOG='+JSON.stringify(catalog)+';');return}
 if(u.pathname.startsWith('/media/')){
  counts.worker++;const b=canonical.get(u.pathname+u.search)||png;
  res.writeHead(200,{'content-type':'image/png','content-length':b.length,'cache-control':'public, max-age=31536000, immutable','x-mws-cache-version':u.searchParams.get('v')+'-'+u.searchParams.get('h')}).end(b);return
 }
 res.writeHead(404).end();
});
let browser;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,label)=>{for(let i=0;i<300;i++){if(await fn())return;await wait(50)}throw Error(label)};
const name='mws-public-versioned-media-v1';
const size=()=>browser.evaluate('(async()=> (await (await caches.open('+JSON.stringify(name)+')).keys()).length)()');
const clear=()=>browser.evaluate('caches.delete('+JSON.stringify(name)+')');
const fetchAll=async(rows,target=browser)=>{
 let ms=0;
 for(let i=0;i<rows.length;i+=40){
  const group=rows.slice(i,i+40).map(e=>e.url);
  ms+=await target.evaluate('(async()=>{const t=performance.now();await Promise.all('+JSON.stringify(group)+'.map(async u=>{const r=await fetch(u,{cache:"reload"});if(!r.ok||!(await r.blob()).size)throw Error("image fetch failed")}));return performance.now()-t})()');
 }
 return ms;
};
try{
 await listen(cdn);catalog={schema:1,origin:'http://127.0.0.1:'+cdn.address().port,entries,packs};await listen(app);
 const origin='http://127.0.0.1:'+app.address().port+'/';
 const open=async()=>{browser=await launchCalendarBrowser(dir);await browser.navigate(origin,1280,720);await until(()=>browser.evaluate('!!navigator.serviceWorker.controller'),'SW control');await browser.enablePerformance()};
 await open();
 for(const n of [10,50,100,300,500,1000,2000]){
  await clear();const before=snapshot(),rows=entries.slice(0,n),coldMs=await fetchAll(rows);
  await until(async()=>await size()===n,'Cold cache not populated: '+n);
  const cold=delta(before);assert.equal(cold.worker,0);assert(cold.cdn<=n&&cold.cdn>0);
  const warmBefore=snapshot(),warmMs=await fetchAll(rows);assert.equal(delta(warmBefore).cdn,0);assert.equal(delta(warmBefore).worker,0);
  const heap=await browser.performanceMetrics();
  console.log('V4_MEDIA_BROWSER_SCALE '+JSON.stringify({images:n,cold,warm:delta(warmBefore),coldMs,warmMs,cacheEntries:await size(),pageJsHeapBytes:heap.JSHeapUsedSize,fixture:true}));
 }
 const beforeRestart=snapshot();await browser.close();browser=null;await open();assert.equal(await size(),2000);
 await fetchAll(entries.slice(0,2000));assert.equal(delta(beforeRestart).cdn,0);assert.equal(delta(beforeRestart).worker,0);
 const restart=delta(beforeRestart);
 const sibling=await browser.sibling(origin);await until(()=>sibling.evaluate('!!navigator.serviceWorker.controller'),'second tab control');
 const beforeChange=snapshot();await Promise.all([fetchAll(changed.slice(0,1)),fetchAll(changed.slice(0,1),sibling)]);
 await until(async()=>await size()===2001,'changed cache');assert.equal(delta(beforeChange).cdn,1);assert.equal(delta(beforeChange).worker,0);
 const beforeMany=snapshot();await fetchAll(changed);await fetchAll([fresh]);await until(async()=>await size()===2011,'new cache');
 assert.equal(delta(beforeMany).cdn,10);assert.equal(delta(beforeMany).worker,0);
 const beforeFallback=snapshot();
 corrupt.add('/v4/objects/'+broken.sha256);failed.add('/v4/objects/'+unavailable.sha256);
 await fetchAll([broken,unavailable]);await until(async()=>await size()===2013,'fallback cache');
 assert.equal(delta(beforeFallback).worker,2);assert.equal(delta(beforeFallback).cdn,2);
 const beforeWarm=snapshot();await fetchAll([broken,unavailable]);assert.equal(delta(beforeWarm).worker,0);assert.equal(delta(beforeWarm).cdn,0);
 const displayMs=await browser.evaluate('(async()=>{const t=performance.now();const i=new Image();i.src='+JSON.stringify(entries[0].url)+';await i.decode();return performance.now()-t})()');
 console.log('V4_MEDIA_BROWSER_DELTA '+JSON.stringify({restart,changedOne:1,changedNineAndNew:delta(beforeMany),fallback:delta(beforeFallback),displayMs,fixture:true}));
 await browser.closeTarget(sibling.targetId);
}finally{if(browser)await browser.close();await close(app);await close(cdn);await rm(dir,{recursive:true,force:true})}
