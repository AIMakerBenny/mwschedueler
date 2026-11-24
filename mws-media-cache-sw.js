'use strict';
const CACHE='mws-public-versioned-media-v1';
const MAX_ENTRIES=320, MAX_BYTES=32*1024*1024;
function cacheKey(url){
  const u=new URL(url,self.location.origin);
  if(u.origin!==self.location.origin)return null;
  const contact=u.pathname.match(/^\/media\/contact\/[A-Za-z0-9_-]{1,160}$/);
  const profile=u.pathname.match(/^\/media\/mawang-profile\/[a-z0-9-]+$/);
  const portrait=u.pathname.match(/^\/assets\/mawang-archive-portraits\/[a-z0-9-]+\.(?:jpg|webp|png)$/);
  if(contact&&/^[1-9]\d*$/.test(u.searchParams.get('v')||'')&&/^[a-f0-9]{32}$/.test(u.searchParams.get('h')||'')&&[...u.searchParams.keys()].every(k=>['v','h','r'].includes(k))&&u.searchParams.getAll('v').length===1&&u.searchParams.getAll('h').length===1)return {version:u.searchParams.get('v')+'-'+u.searchParams.get('h')};
  if(contact&&/^[1-9]\d*$/.test(u.searchParams.get('v')||'')&&/^\d+$/.test(u.searchParams.get('r')||'')&&[...u.searchParams.keys()].sort().join(',')==='r,v')return {version:'legacy-'+u.searchParams.get('v')};
  if(profile&&/^\d{1,15}-[a-f0-9]{0,80}$/i.test(u.searchParams.get('rev')||'')&&[...u.searchParams.keys()].length===1)return {version:u.searchParams.get('rev')};
  if(portrait&&/^archive-v\d+$/.test(u.searchParams.get('rev')||'')&&[...u.searchParams.keys()].length===1)return {static:true};
  return null;
}
function canStore(res,key){
  const type=res.headers.get('content-type')||'',size=Number(res.headers.get('content-length')||0);
  return res.status===200&&!res.redirected&&/^image\/(?:jpeg|png|webp|gif|avif)(?:;|$)/i.test(type)&&size<=MAX_BYTES&&!/no-store|private/i.test(res.headers.get('cache-control')||'')&&(key.static||res.headers.get('x-mws-cache-version')===key.version);
}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
let writes=0;
const recent=new Map();
function touch(url){
  recent.delete(url);recent.set(url,Date.now());
  if(recent.size>4096)recent.delete(recent.keys().next().value);
}
async function trim(cache,force=false){
  const estimate=await self.navigator?.storage?.estimate?.().catch(()=>null);
  // The old count is a fallback for browsers without a usable storage estimate.
  if(!force&&estimate?.quota>0&&estimate.usage<estimate.quota*0.8)return;
  const keys=await cache.keys();
  const count=force||estimate?.quota>0?Math.ceil(keys.length/10):Math.max(0,keys.length-MAX_ENTRIES);
  keys.sort((a,b)=>(recent.get(a.url)||0)-(recent.get(b.url)||0));
  for(const key of keys.slice(0,count)){await cache.delete(key);recent.delete(key.url)}
}
async function store(cache,request,response){
  try{
    // A quota failure may consume the response stream. Evict for the next read.
    await cache.put(request,response);touch(request.url);
    if(++writes%12===1)await trim(cache);
  }catch(error){if(error.name==='QuotaExceededError')await trim(cache,true).catch(()=>{})}
}
const diagnosticClients=new Map();
self.addEventListener('message',event=>{
  const source=event.source,message=event.data;
  if(!source?.id||message?.kind!=='mws-media-trace')return;
  if(message.enabled&&Number.isInteger(message.salt)){
    if(diagnosticClients.size>=16)diagnosticClients.delete(diagnosticClients.keys().next().value);
    diagnosticClients.set(source.id,{client:source,salt:message.salt});
  }else diagnosticClients.delete(source.id);
});
function traceDelivery(id,url,source){
  const session=diagnosticClients.get(id);if(!session)return;
  let hash=2166136261^session.salt;
  for(let i=0;i<url.length;i++)hash=Math.imul(hash^url.charCodeAt(i),16777619);
  try{session.client.postMessage({kind:'mws-media-delivery',id:hash>>>0,source,salt:session.salt,at:Date.now()})}catch(_){diagnosticClients.delete(id)}
}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.headers.has('range'))return;
  const key=cacheKey(request.url);if(!key)return;
  const task=(async()=>{
    let cache;
    try{cache=await caches.open(CACHE);const hit=await cache.match(request);if(hit){traceDelivery(event.clientId,request.url,'service-worker-cache');touch(request.url);return {response:hit}}}catch(_){}
    const response=await fetch(request);traceDelivery(event.clientId,request.url,'service-worker-fetch');
    return {response,save:cache&&canStore(response,key)?store(cache,request,response.clone()):null};
  })();
  event.respondWith(task.then(result=>result.response));
  event.waitUntil(task.then(result=>result.save).catch(()=>{}));
});
