/* V4: approved immutable public contact objects only. No API polling or storage eviction. */
(function(g){
'use strict';
const TYPES=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);
const HEX=/^[a-f0-9]{64}$/;
const CONTACT=/^\/media\/contact\/[A-Za-z0-9_-]{1,160}\?v=([1-9]\d*)&h=([a-f0-9]{32})(?:&r=\d+)?$/;
const MAX_OBJECT=32*1024*1024, MAX_PACK=4*1024*1024;
function canonical(raw){return typeof raw==='string'&&CONTACT.test(raw)?raw:null}
function origin(raw,local=false){
 try{const u=new URL(raw);if(u.username||u.password||u.pathname!=='/'||u.search||u.hash)return '';
 if(local&&u.protocol==='http:'&&u.hostname==='127.0.0.1')return u.origin;
 if(u.protocol!=='https:'||!u.hostname.includes('.')||/(^|\.)(r2\.dev|workers\.dev)$/.test(u.hostname))return '';
 return u.origin}catch(_){return ''}
}
function validEntry(e){return e&&canonical(e.url)&&HEX.test(e.sha256)&&TYPES.has(e.type)&&Number.isSafeInteger(e.bytes)&&e.bytes>0&&e.bytes<=MAX_OBJECT}
function validate(c,local=false){
 const base=origin(c?.origin,local);
 if(!base||c?.schema!==1||!Array.isArray(c.entries)||!Array.isArray(c.packs))return null;
 const entries=new Map(),packs=new Map();
 for(const e of c.entries){if(!validEntry(e)||entries.has(e.url))throw Error('invalid public catalog entry');entries.set(e.url,{url:e.url,sha256:e.sha256,type:e.type,bytes:e.bytes})}
 for(const p of c.packs){
  if(!p||!HEX.test(p.sha256)||!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>MAX_PACK||!Array.isArray(p.members)||p.members.length<4||packs.has(p.sha256))throw Error('invalid pack');
  let pos=0;const members=[];
  for(const m of p.members){const e=entries.get(m.url);if(!e||e.pack||m.offset!==pos)throw Error('invalid pack member');e.pack=p.sha256;e.offset=pos;pos+=e.bytes;members.push(e)}
  if(pos!==p.bytes)throw Error('invalid pack length');
  packs.set(p.sha256,{sha256:p.sha256,bytes:p.bytes,members});
 }
 return {base,entries,packs};
}
async function digest(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('')}
async function readExact(response,n){
 if(!response.ok||response.status!==200||response.redirected)throw Error('invalid response');
 const declared=response.headers.get('content-length');if(declared!==null&&Number(declared)!==n)throw Error('incorrect length');
 if(!response.body)throw Error('missing body');
 const r=response.body.getReader(),out=new Uint8Array(n);let pos=0;
 try{while(true){const {done,value}=await r.read();if(done)break;if(pos+value.length>n)throw Error('oversized body');out.set(value,pos);pos+=value.length}
 if(pos!==n)throw Error('truncated body');return out}
 catch(e){try{await r.cancel()}catch(_){}throw e}finally{r.releaseLock()}
}
function response(e,bytes){const m=CONTACT.exec(e.url);return new Response(bytes,{headers:{'content-type':e.type,'content-length':String(e.bytes),'cache-control':'public, max-age=31536000, immutable','x-mws-cache-version':m[1]+'-'+m[2],'x-mws-image-policy':'original-bytes-no-reencode','x-content-type-options':'nosniff'}})}
function create(c,{fetcher=fetch,local=false,windowMs=12,now=Date.now}={}){
 let cat;try{cat=validate(c,local)}catch(_){return null}if(!cat)return null;
 const waiting=new Map(),negative=new Map();let packCooldown=0;
 const get=async(path,n,hash,type)=>{
  const r=await fetcher(cat.base+path,{method:'GET',mode:'cors',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',cache:'default',signal:AbortSignal.timeout(8000)});
  if(type&&(r.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!==type)throw Error('wrong media type');
  const bytes=await readExact(r,n);if(await digest(bytes)!==hash)throw Error('checksum mismatch');return bytes;
 };
 async function direct(e){
  for(const [key,at] of negative)if(now()-at>=60000)negative.delete(key);
  if(negative.has(e.sha256))return null;
  try{return response(e,await get('/v4/objects/'+e.sha256,e.bytes,e.sha256,e.type))}
  catch(_){negative.set(e.sha256,now());return null}
 }
 async function flush(pack,rows){
  waiting.delete(pack.sha256);
  const demand=new Map(rows.map(x=>[x.e.url,x.e]));
  const bytes=[...demand.values()].reduce((n,e)=>n+e.bytes,0);
  let payload=null;
  if(now()>=packCooldown&&demand.size>=4&&bytes/pack.bytes>=0.8){
   try{
    payload=await get('/v4/packs/'+pack.sha256,pack.bytes,pack.sha256,'application/octet-stream');
    for(const e of demand.values())if(await digest(payload.subarray(e.offset,e.offset+e.bytes))!==e.sha256)throw Error('member checksum');
   }catch(_){payload=null;packCooldown=now()+60000}
  }
  await Promise.all(rows.map(async row=>{try{row.resolve(payload?response(row.e,payload.slice(row.e.offset,row.e.offset+row.e.bytes)):await direct(row.e))}catch(_){row.resolve(null)}}));
 }
 return async function deliver(request){
  if(request.method!=='GET'||request.headers.has('authorization')||request.headers.has('range'))return null;
  const u=new URL(request.url),e=cat.entries.get(u.pathname+u.search);if(!e||u.hash)return null;
  const p=cat.packs.get(e.pack);
  if(!p||now()<packCooldown)return direct(e);
  return new Promise(resolve=>{
   let rows=waiting.get(p.sha256);if(!rows){rows=[];waiting.set(p.sha256,rows);setTimeout(()=>{flush(p,rows).catch(()=>rows.forEach(r=>r.resolve(null)))},windowMs)}
   rows.push({e,resolve});
  });
 };
}
g.MWSMediaV4=Object.freeze({canonical,origin,validate,digest,create,MAX_PACK,MAX_OBJECT});
})(globalThis);
