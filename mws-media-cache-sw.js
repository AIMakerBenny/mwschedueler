'use strict';
const CACHE='mws-public-versioned-media-v1';
const MAX_BYTES=32*1024*1024;
function cacheKey(url){
  const u=new URL(url,self.location.origin);
  if(u.origin!==self.location.origin)return null;
  const contact=u.pathname.match(/^\/media\/contact\/[A-Za-z0-9_-]{1,160}$/);
  const workspace=u.pathname.match(/^\/media\/workspace\/[A-Za-z0-9_-]{1,160}$/);
  const profile=u.pathname.match(/^\/media\/mawang-profile\/[a-z0-9-]+$/);
  const portrait=u.pathname.match(/^\/assets\/mawang-archive-portraits\/[a-z0-9-]+\.(?:jpg|webp|png)$/);
  if((contact||workspace)&&/^[1-9]\d*$/.test(u.searchParams.get('v')||'')&&/^[a-f0-9]{32}$/.test(u.searchParams.get('h')||'')&&[...u.searchParams.keys()].every(k=>(contact?['v','h','r']:['v','h']).includes(k))&&u.searchParams.getAll('v').length===1&&u.searchParams.getAll('h').length===1)return {version:u.searchParams.get('v')+'-'+u.searchParams.get('h')};
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
// Never evict previously stored public revisions on an application count,
// storage percentage, or failed new write.
async function store(cache,request,response){
  try{await cache.put(request,response);return true}catch(_){return false}
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
// Only share a verified Cache Storage fill; never hand another request
// an unverified response. Cache.match honors Vary and failed fills are not reused.
const filling=new Map();
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.headers.has('range'))return;
  const key=cacheKey(request.url);if(!key)return;
  const task=(async()=>{
    let cache;
    const lookup=async()=>{try{return await cache?.match(request)}catch(_){return undefined}};
    const deliverHit=hit=>{traceDelivery(event.clientId,request.url,'service-worker-cache');return {response:hit}};
    try{cache=await caches.open(CACHE)}catch(_){}
    const hit=await lookup();if(hit)return deliverHit(hit);
    if(cache){
      while(filling.has(request.url)){await filling.get(request.url);const shared=await lookup();if(shared)return deliverHit(shared)}
      if(!filling.has(request.url)){
        let finish;const pending=new Promise(resolve=>{finish=resolve});
        filling.set(request.url,pending);
        const release=()=>{if(filling.get(request.url)===pending)filling.delete(request.url);finish()};
        try{
          const lateHit=await lookup();if(lateHit){release();return deliverHit(lateHit)}
          const response=await fetch(request);traceDelivery(event.clientId,request.url,'service-worker-fetch');
          if(canStore(response,key)){
            const save=store(cache,request,response.clone()).finally(release);
            return {response,save};
          }
          release();return {response};
        }catch(error){release();throw error}
      }
    }
    const response=await fetch(request);traceDelivery(event.clientId,request.url,'service-worker-fetch');
    return {response,save:cache&&canStore(response,key)?store(cache,request,response.clone()):null};
  })();
  event.respondWith(task.then(result=>result.response));
  event.waitUntil(task.then(result=>result.save).catch(()=>{}));
});
