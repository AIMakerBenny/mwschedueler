'use strict';
const CACHE='mws-public-versioned-media-v1';
const MAX_BYTES=32*1024*1024;
// Registration URL opt-in permits rollback without clearing existing cache.
const BATCH_ENABLED=new URL(self.location.href||self.location.origin).searchParams.get('batch')==='51';
if(BATCH_ENABLED)importScripts('/assets/media-batch-sw-runtime-v51.js');
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
// LIVE images are mutable. Keep them in a separate, short-lived cache.
// Reuse verified public bytes only within the origin's existing 60s policy.
const LIVE_CACHE='mws-public-live-thumb-v3',LIVE_TTL=60000;
const liveFills=new Map(),liveFailures=new Map();
let nextLiveSweep=0;
function liveThumbKey(url){
  const u=new URL(url,self.location.origin);
  return u.origin===self.location.origin&&u.pathname==='/api/soop/live-thumb'&&[...u.searchParams.keys()].join(',')==='bno'&&/^\d{3,20}$/.test(u.searchParams.get('bno')||'')?u.href:null;
}
function validLiveThumb(res){
  return res?.status===200&&!res.redirected&&/^image\/(?:jpeg|png|webp|gif|avif)(?:;|$)/i.test(res.headers.get('content-type')||'')&&/\bpublic\b/i.test(res.headers.get('cache-control')||'')&&!/no-store|private|no-cache/i.test(res.headers.get('cache-control')||'')&&/\bmax-age=60\b/.test(res.headers.get('cache-control')||'');
}
function freshLiveThumb(res,now=Date.now()){
  const at=Number(res?.headers.get('x-mws-live-cached-at'));
  return validLiveThumb(res)&&Number.isFinite(at)&&at>0&&at<=now&&now-at<LIVE_TTL;
}
async function sweepLiveThumbs(cache,now){
  // Expire transient frames only; never touch the persistent portrait cache.
  if(!cache||now<nextLiveSweep)return;
  nextLiveSweep=now+LIVE_TTL;
  try{for(const key of await cache.keys()){const row=await cache.match(key);if(!freshLiveThumb(row,now))await cache.delete(key)}}catch(_){}
}
async function readLiveThumb(request,id){
  const key=liveThumbKey(request.url);
  let cache;try{cache=await caches.open(LIVE_CACHE)}catch(_){}
  const lookup=async()=>{try{const row=await cache?.match(request);return freshLiveThumb(row)?row:null}catch(_){return null}};
  const cached=await lookup();
  if(cached){traceDelivery(id,key,'service-worker-cache');return {response:cached,save:sweepLiveThumbs(cache,Date.now())}}
  for(const [url,at] of liveFailures)if(Date.now()-at>=LIVE_TTL)liveFailures.delete(url);
  const failed=()=>new Response('SOOP live thumbnail temporarily unavailable',{status:502,headers:{'cache-control':'no-store','retry-after':'60'}});
  if(liveFailures.has(key)){traceDelivery(id,key,'service-worker-cache');return {response:failed()}}
  while(liveFills.has(key)){
    await liveFills.get(key);
    const hit=await lookup();
    if(hit){traceDelivery(id,key,'service-worker-cache');return {response:hit}}
    if(liveFailures.has(key)){traceDelivery(id,key,'service-worker-cache');return {response:failed()}}
  }
  let finish;const pending=new Promise(resolve=>{finish=resolve});
  liveFills.set(key,pending);
  const release=()=>{if(liveFills.get(key)===pending)liveFills.delete(key);finish()};
  try{
    const response=await fetch(request,{cache:'no-store'});
    traceDelivery(id,key,'service-worker-fetch');
    if(response.status===502||response.status===503)liveFailures.set(key,Date.now());
    if(cache&&validLiveThumb(response)){
      const headers=new Headers(response.headers);headers.set('x-mws-live-cached-at',String(Date.now()));
      const stored=new Response(response.clone().body,{status:200,headers});
      const save=store(cache,request,stored).finally(release).then(()=>sweepLiveThumbs(cache,Date.now()));
      return {response,save};
    }
    release();return {response,save:sweepLiveThumbs(cache,Date.now())};
  }catch(error){release();throw error}
}
const filling=new Map();
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.headers.has('range'))return;
  if(liveThumbKey(request.url)&&!request.headers.has('authorization')){
    const task=readLiveThumb(request,event.clientId);
    event.respondWith(task.then(result=>result.response));
    event.waitUntil(task.then(result=>result.save).catch(()=>{}));return;
  }
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
          let response=null;
          if(BATCH_ENABLED&&!request.headers.has('authorization')&&!request.headers.has('if-none-match')&&!request.headers.has('if-modified-since')){
            const u=new URL(request.url);response=await self.mwsBatchGetV51(u.pathname+u.search);
          }
          if(response){release();traceDelivery(event.clientId,request.url,'service-worker-fetch');return {response}}
          response=await fetch(request);traceDelivery(event.clientId,request.url,'service-worker-fetch');
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
