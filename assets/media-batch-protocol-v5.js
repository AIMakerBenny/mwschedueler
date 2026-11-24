// Existing public media routes only. ID-based media retain their original IndexedDB policy.
export const BATCH_PATH='/api/media-batch-v5', CACHE_NAME='mws-public-versioned-media-v1';
export const MAX_ITEMS=256, MAX_IMAGE=32*1024*1024, MAX_HEADER=4096, MAX_REQUEST=96*1024, MAX_BATCH_BYTES=128*1024*1024;
export const imageType=t=>/^image\/(?:jpeg|png|webp|gif|avif)(?:;|$)/i.test(t||'');
export function exactContact(raw,origin){
  if(typeof raw!=='string'||raw.length>300||!raw.startsWith('/media/contact/'))return null;
  try{
    const u=new URL(raw,origin),m=/^\/media\/contact\/([A-Za-z0-9_-]{1,160})$/.exec(u.pathname),v=u.searchParams.get('v'),h=u.searchParams.get('h');
    if(u.origin!==origin||u.hash||!m||!/^[1-9]\d{0,9}$/.test(v||'')||!/^[a-f0-9]{32}$/.test(h||'')||[...u.searchParams.keys()].some(k=>!['v','h','r'].includes(k))||u.searchParams.getAll('v').length!==1||u.searchParams.getAll('h').length!==1||u.searchParams.getAll('r').length>1||(u.searchParams.has('r')&&!/^\d{1,10}$/.test(u.searchParams.get('r'))))return null;
    return {url:u.pathname+u.search,version:v+'-'+h,key:'contacts/'+m[1]+'/v'+v+'-'+h};
  }catch{return null}
}
export function batchEntry(raw,origin){
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
export function frame(meta){
  const json=enc.encode(JSON.stringify(meta));
  if(json.length>MAX_HEADER)throw Error('header too large');
  const bytes=new Uint8Array(json.length+4);new DataView(bytes.buffer).setUint32(0,json.length);bytes.set(json,4);return bytes;
}
export function verified(response,entry){
  return response?.status===200&&!response.redirected&&imageType(response.headers.get('content-type'))&&!/private|no-store/i.test(response.headers.get('cache-control')||'')&&response.headers.get('x-mws-cache-version')===entry.version&&Number(response.headers.get('content-length')||0)<=MAX_IMAGE;
}
