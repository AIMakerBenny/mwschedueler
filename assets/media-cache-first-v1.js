(()=>{
'use strict';
if(window.__mwsCacheFirstMediaV1)return;
window.__mwsCacheFirstMediaV1=true;
window.mwsCacheFirstCalendarV1=true;
const CACHE='mws-public-versioned-media-v1';
let started=false;
const ready=async()=>{
  if(!('serviceWorker' in navigator)||!('caches' in window)||!window.isSecureContext)return false;
  try{
    await navigator.serviceWorker.register('/mws-media-cache-sw.js'+(document.querySelector('meta[name="mws-media-batch-v5"]')?.content==='1'?'?batch=51':''),{scope:'/',updateViaCache:'none'});
    if(navigator.serviceWorker.controller)return true;
    return await new Promise(resolve=>{let t;const done=()=>{clearTimeout(t);navigator.serviceWorker.removeEventListener('controllerchange',changed);resolve(Boolean(navigator.serviceWorker.controller))};const changed=()=>done();navigator.serviceWorker.addEventListener('controllerchange',changed);t=setTimeout(done,4000);if(navigator.serviceWorker.controller)done()});
  }catch(_){return false}
};
async function warm(urls,limit){
  if(document.hidden||navigator.connection?.saveData||/^(slow-2g|2g)$/.test(navigator.connection?.effectiveType||''))return 0;
  let cache;try{cache=await caches.open(CACHE)}catch(_){return 0}
  const missing=[];
  for(const raw of [...new Set(urls)]){
    if(!raw)continue;
    const url=new URL(raw,location.href);if(url.origin!==location.origin)continue;
    try{if(!await cache.match(url.href))missing.push(url.href)}catch(_){}
    if(missing.length>=limit)break;
  }
  let count=0;
  if(document.querySelector('meta[name="mws-media-batch-v5"]')?.content==='1'&&missing.length&&missing.every(raw=>new URL(raw).pathname.startsWith('/media/contact/'))){
    try{
      const {getDemandedMedia}=await import('/assets/media-batch-client-v5.js');
      const rows=await Promise.all(missing.map(raw=>{const u=new URL(raw);return getDemandedMedia(u.pathname+u.search)}));
      return rows.filter(Boolean).length;
    }catch{return 0} // Optional preload must never fan out on failure.
  }
  for(let i=0;i<missing.length&&!document.hidden;i+=3){
    await Promise.all(missing.slice(i,i+3).map(async url=>{try{const res=await fetch(url,{mwsTrace:{module:'media-cache-first-v1',automatic:true,retry:false},cache:'default',credentials:'same-origin',signal:AbortSignal.timeout(8000)});if(res.ok){await res.arrayBuffer();count++}}catch(_){}}));
  }
  return count;
}
async function start(){
  if(started)return;started=true;
  // Never delay the calendar or critical UI for media preparation.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const controlled=await ready();
  let characterUrls=[];
  try{characterUrls=await window.mwsPrepareCharacterMediaV1?.()||[]}catch(_){}
  if(!controlled)return;
  // Previously cached URLs are skipped. At most 12 missing character images
  // and 8 favorite/recent-calendar contact portraits per session.
  let contacts=[];
  try{const all=Array.isArray(data.contacts)?data.contacts:[];const ids=new Set((data.events||[]).filter(e=>e.date>=new Date(Date.now()-86400000*7).toISOString().slice(0,10)&&e.date<=new Date(Date.now()+86400000*14).toISOString().slice(0,10)).flatMap(e=>Array.isArray(e.participants)?e.participants:[]));contacts=all.filter(c=>c.favorite||ids.has(c.id)).map(c=>c.image).filter(x=>/^\/media\/contact\/[A-Za-z0-9_-]+\?v=[1-9]\d*&h=[a-f0-9]{32}(?:&r=\d+)?$/.test(x||''))}catch(_){}
  if(document.querySelector('meta[name="mws-public-media-origin"]'))contacts=[];
  const [characters,portraits]=await Promise.all([warm(characterUrls,12),warm(contacts,8)]);
  window.__mwsMediaPreloadStatsV1={characters,portraits};
}
function schedule(){window.__mwsMediaPreloadPromiseV1||=start().catch(()=>{})}
if(window.__mwsAppReadyV130)schedule();else window.addEventListener('mws:app-ready',schedule,{once:true});
})();
