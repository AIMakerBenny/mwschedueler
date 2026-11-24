// Only invoked on the opt-in release, before Service Worker control.
import './media-v4-delivery.js';
import './media-v4-catalog.js';
const M=globalThis.MWSMediaV4, catalog=globalThis.MWS_PUBLIC_MEDIA_V4_CATALOG;
let validated=null;try{validated=M.validate(catalog)}catch(_){}
const deliver=M.create(catalog), pending=new Map();
export async function readPublicContactV4(raw){
 if(!deliver||!validated?.entries.has(raw)||!raw.startsWith('/media/contact/'))return null;
 if(pending.has(raw))return pending.get(raw);
 const task=(async()=>{
  const u=new URL(raw,location.origin);let cache;
  try{cache=await caches.open('mws-public-versioned-media-v1');
   const hit=await cache.match(u.href);
   if(hit?.status===200&&hit.headers.get('x-mws-cache-version')===M.revision(raw)&&!/(private|no-store)/i.test(hit.headers.get('cache-control')||'')&&hit.headers.get('content-type')===validated.entries.get(raw).type)return await hit.blob();
  }catch(_){}
  // A newly controlling SW can now serve the canonical request without the
  // page issuing a competing direct fetch. No canonical network call here.
  if(navigator.serviceWorker?.controller)return null;
  const response=await deliver(new Request(u.href,{credentials:'same-origin'}));
  if(!response)return null;
  const blob=await response.clone().blob();
  try{await cache?.put(u.href,response)}catch(_){}
  return blob;
 })().catch(()=>null).finally(()=>pending.delete(raw));
 pending.set(raw,task);return task;
}
