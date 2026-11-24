/* Generated from V5 protocol and client */
(()=>{
// Existing public media routes only. ID-based media retain their original IndexedDB policy.
const BATCH_PATH='/api/media-batch-v5', CACHE_NAME='mws-public-versioned-media-v1';
const MAX_ITEMS=256, MAX_IMAGE=32*1024*1024, MAX_HEADER=4096, MAX_REQUEST=96*1024, MAX_BATCH_BYTES=128*1024*1024;
const imageType=t=>/^image\/(?:jpeg|png|webp|gif|avif)(?:;|$)/i.test(t||'');
function exactContact(raw,origin){
  if(typeof raw!=='string'||raw.length>300||!raw.startsWith('/media/contact/'))return null;
  try{
    const u=new URL(raw,origin),m=/^\/media\/contact\/([A-Za-z0-9_-]{1,160})$/.exec(u.pathname),v=u.searchParams.get('v'),h=u.searchParams.get('h');
    if(u.origin!==origin||u.hash||!m||!/^[1-9]\d{0,9}$/.test(v||'')||!/^[a-f0-9]{32}$/.test(h||'')||[...u.searchParams.keys()].some(k=>!['v','h','r'].includes(k))||u.searchParams.getAll('v').length!==1||u.searchParams.getAll('h').length!==1||u.searchParams.getAll('r').length>1||(u.searchParams.has('r')&&!/^\d{1,10}$/.test(u.searchParams.get('r'))))return null;
    return {url:u.pathname+u.search,version:v+'-'+h,key:'contacts/'+m[1]+'/v'+v+'-'+h};
  }catch{return null}
}
function batchEntry(raw,origin){
  const contact=exactContact(raw,origin);if(contact)return {...contact,persist:true};
  if(typeof raw!=='string'||raw.length>300)return null;
  const id=/^\/media\/(achievement|wardogs)\/([A-Za-z0-9_-]{1,160})$/.exec(raw);
  if(id)return {url:raw,key:(id[1]==='achievement'?'achievements':'wardogs')+'/'+id[2],version:'id:'+id[2],persist:false};
  const workspace=/^\/media\/workspace\/((?:tag-|emoticon-|mini-)[A-Za-z0-9_-]{1,154})(\?.+)$/.exec(raw);
  if(!workspace)return null;
  const parsed=exactContact('/media/contact/'+workspace[1]+workspace[2],origin);
  if(!parsed||new URL(raw,origin).searchParams.has('r'))return null;
  return {...parsed,url:raw,key:parsed.key.replace(/^contacts\//,'workspace/'),persist:true};
}
const enc=new TextEncoder();
function frame(meta){
  const json=enc.encode(JSON.stringify(meta));
  if(json.length>MAX_HEADER)throw Error('header too large');
  const bytes=new Uint8Array(json.length+4);new DataView(bytes.buffer).setUint32(0,json.length);bytes.set(json,4);return bytes;
}
function verified(response,entry){
  return response?.status===200&&!response.redirected&&imageType(response.headers.get('content-type'))&&!/private|no-store/i.test(response.headers.get('cache-control')||'')&&response.headers.get('x-mws-cache-version')===entry.version&&Number(response.headers.get('content-length')||0)<=MAX_IMAGE;
}

// No polling. Callers submit only images already demanded by the current view.
function createMediaBatchClient({origin=location.origin,storage=caches,network=fetch,windowMs=20}={}){
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
function getDemandedContact(raw){client??=createMediaBatchClient();return client.get(raw)}
const getDemandedMedia=getDemandedContact;

self.mwsBatchGetV51=getDemandedMedia;
})();
