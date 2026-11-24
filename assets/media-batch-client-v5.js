import {batchEntry,verified,imageType,BATCH_PATH,CACHE_NAME,MAX_ITEMS,MAX_IMAGE,MAX_HEADER} from './media-batch-protocol-v5.js';
// No polling. Callers submit only images already demanded by the current view.
export function createMediaBatchClient({origin=location.origin,storage=caches,network=fetch,windowMs=20}={}){
  const pending=new Map();let timer=null,active=false;
  const cacheLookup=async(cache,entry)=>{try{if(!entry.persist)return null;const hit=await cache?.match(new URL(entry.url,origin).href);return verified(hit,entry)?hit:null}catch{return null}};
  function get(raw){
    const entry=batchEntry(raw,origin);if(!entry)return Promise.resolve(null);
    if(pending.has(entry.url))return pending.get(entry.url).promise.then(r=>r?.clone()||null);
    let resolve;const promise=new Promise(r=>{resolve=r});pending.set(entry.url,{entry,promise,resolve,queued:true});
    schedule();return promise.then(r=>r?.clone()||null);
  }
  function schedule(){if(timer===null&&!active&&[...pending.values()].some(r=>r.queued))timer=setTimeout(()=>{timer=null;void flush()},windowMs)}
  function finish(row,response){if(pending.get(row.entry.url)===row)pending.delete(row.entry.url);row.resolve(response)}
  async function flush(){
    if(active)return;active=true;
    const rows=[...pending.values()].filter(r=>r.queued).slice(0,MAX_ITEMS);
    for(const r of rows)r.queued=false;
    let cache;
    try{
      try{cache=await storage.open(CACHE_NAME)}catch{}
      const hits=await Promise.all(rows.map(r=>cacheLookup(cache,r.entry)));
      const missing=new Map();
      rows.forEach((row,i)=>{if(hits[i])finish(row,hits[i]);else missing.set(row.entry.url,row)});
      if(!missing.size)return;
      const abort=new AbortController();let reader;
      const timed=async(p)=>{let timeout;try{return await Promise.race([p,new Promise((_,reject)=>{timeout=setTimeout(()=>{abort.abort();reject(Error('media batch timeout'))},20000)})])}finally{clearTimeout(timeout)}};
      try{
        const response=await timed(network(new URL(BATCH_PATH,origin).href,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({urls:[...missing.keys()]}),credentials:'same-origin',cache:'no-store',redirect:'error',signal:abort.signal}));
        if(!response.ok||response.redirected||response.headers.get('content-type')!=='application/x-mws-media-batch-v5'||!response.body)throw Error('bad batch');
        reader=response.body.getReader();let chunk=new Uint8Array(0),offset=0;
        async function read(n){
          const out=new Uint8Array(n);let pos=0;
          while(pos<n){
            if(offset===chunk.length){const r=await timed(reader.read());if(r.done)throw Error('truncated batch');chunk=r.value;offset=0;if(!chunk.length)continue}
            const take=Math.min(n-pos,chunk.length-offset);out.set(chunk.subarray(offset,offset+take),pos);pos+=take;offset+=take;
          }return out;
        }
        while(true){
          const n=new DataView((await read(4)).buffer).getUint32(0);if(n<2||n>MAX_HEADER)throw Error('invalid frame');
          const meta=JSON.parse(new TextDecoder().decode(await read(n)));
          if(meta.end===true)break;
          const row=missing.get(meta.url);if(!row)throw Error('unknown frame');
          if(meta.status!==200){missing.delete(meta.url);finish(row,meta.status===404&&!row.entry.persist?new Response(null,{status:404}):null);continue}
          if(meta.version!==row.entry.version||!imageType(meta.type)||!Number.isSafeInteger(meta.size)||meta.size<=0||meta.size>MAX_IMAGE)throw Error('invalid media metadata');
          const bytes=await read(meta.size);
          const result=new Response(bytes,{headers:{'content-type':meta.type,'content-length':String(meta.size),'cache-control':'public, max-age=31536000, immutable','x-mws-cache-version':meta.version}});
          try{if(row.entry.persist)await cache?.put(new URL(row.entry.url,origin).href,result.clone())}catch{}
          missing.delete(meta.url);finish(row,result);
        }
      }catch{}finally{abort.abort();try{await reader?.cancel()}catch{}for(const row of missing.values())finish(row,null)}
    }catch{for(const row of rows)if(pending.get(row.entry.url)===row)finish(row,null)}
    finally{active=false;schedule()}
  }
  return {get};
}
let client;
export function getDemandedContact(raw){client??=createMediaBatchClient();return client.get(raw)}
export const getDemandedMedia=getDemandedContact;
