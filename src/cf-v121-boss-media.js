import appWorker from './cf-v112-authfix.js';

const MAX_IMAGE_BYTES=4*1024*1024;
const SOOP_PROXY_HOST_SUFFIXES=['sooplive.com','sooplive.co.kr','afreecatv.com'];
const SOOP_PROXY_METHODS=new Set(['GET','HEAD','POST']);
const SOOP_PROXY_TIMEOUT_MS=10000;
const SOOP_PROXY_MAX_REDIRECTS=3;
const SOOP_PROXY_MAX_POST_BYTES=2*1024*1024;

function json(value,status=200,headers={}){
  return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});
}
function safeId(value){return String(value||'').replace(/[^A-Za-z0-9_-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,120)||crypto.randomUUID()}
function mediaKey(id){return `boss-${safeId(id)}`}
function mediaUrl(key){return `/media/workspace/${encodeURIComponent(key)}?v=${Date.now()}`}
function parseDataImage(value){
  if(typeof value!=='string')return null;
  const match=/^data:([^;,]+);base64,(.+)$/s.exec(value);
  if(!match)return null;
  try{
    const binary=atob(match[2]);
    if(binary.length>MAX_IMAGE_BYTES)return null;
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return {contentType:match[1]||'image/png',bytes};
  }catch(_){return null}
}
function isAllowedSoopProxyHost(hostname){
  const host=String(hostname||'').trim().toLowerCase().replace(/\.$/,'');
  if(!host||host.includes('/')||host.includes(':'))return false;
  return SOOP_PROXY_HOST_SUFFIXES.some(suffix=>host===suffix||host.endsWith(`.${suffix}`));
}
function parseAllowedSoopProxyUrl(raw){
  let target;try{target=new URL(String(raw||''))}catch(_){return null}
  if(target.protocol!=='https:'||target.username||target.password||target.port||!isAllowedSoopProxyHost(target.hostname))return null;
  return target;
}
async function fetchAllowedSoopTarget(target,method,headers,body){
  let current=target,currentMethod=method,currentBody=body;
  for(let redirects=0;redirects<=SOOP_PROXY_MAX_REDIRECTS;redirects++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort('timeout'),SOOP_PROXY_TIMEOUT_MS);
    let response;
    try{
      response=await fetch(current.toString(),{method:currentMethod,headers,body:currentMethod==='GET'||currentMethod==='HEAD'?undefined:currentBody,redirect:'manual',signal:controller.signal});
    }finally{clearTimeout(timer)}
    if(![301,302,303,307,308].includes(response.status))return response;
    const location=response.headers.get('location');
    if(!location||redirects===SOOP_PROXY_MAX_REDIRECTS)return response;
    const next=parseAllowedSoopProxyUrl(new URL(location,current).toString());
    if(!next)throw new Error('SOOP redirect target is not allowed');
    if(response.status===303||((response.status===301||response.status===302)&&currentMethod==='POST')){currentMethod='GET';currentBody=undefined;headers.delete('content-type')}
    current=next;
  }
  throw new Error('SOOP redirect limit exceeded');
}
async function handleSoopProxy(request){
  if(!SOOP_PROXY_METHODS.has(request.method))return json({error:'Method not allowed'},405,{allow:'GET, HEAD, POST'});
  const requestUrl=new URL(request.url);
  const target=parseAllowedSoopProxyUrl(requestUrl.searchParams.get('url'));
  if(!target)return json({error:'Invalid or untrusted SOOP URL'},400);
  const headers=new Headers();
  for(const name of ['accept','accept-language','content-type']){const value=request.headers.get(name);if(value)headers.set(name,value)}
  if(!headers.has('accept'))headers.set('accept','application/json,text/plain,text/html,*/*');
  headers.set('user-agent','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36');
  let body;
  if(request.method==='POST'){
    const declared=Number(request.headers.get('content-length')||0);
    if(declared>SOOP_PROXY_MAX_POST_BYTES)return json({error:'SOOP proxy request body is too large'},413);
    body=await request.arrayBuffer();
    if(body.byteLength>SOOP_PROXY_MAX_POST_BYTES)return json({error:'SOOP proxy request body is too large'},413);
  }
  try{
    const upstream=await fetchAllowedSoopTarget(target,request.method,headers,body);
    const responseHeaders=new Headers();
    for(const name of ['content-type','content-language','etag','last-modified']){const value=upstream.headers.get(name);if(value)responseHeaders.set(name,value)}
    responseHeaders.set('cache-control','no-store');
    responseHeaders.set('x-content-type-options','nosniff');
    responseHeaders.set('x-mws-soop-proxy','v1.2.3');
    return new Response(request.method==='HEAD'?null:upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
  }catch(error){
    const message=error?.name==='AbortError'?'SOOP request timed out':String(error?.message||error||'SOOP request failed');
    console.error('SOOP proxy failed',target.hostname,message);
    return json({error:message},502,{'x-mws-soop-proxy':'v1.2.3'});
  }
}
async function isAdmin(request,env,ctx){
  try{
    const url=new URL('/api/auth/session',request.url);
    const headers=new Headers();
    const cookie=request.headers.get('cookie');if(cookie)headers.set('cookie',cookie);
    const res=await appWorker.fetch(new Request(url,{method:'GET',headers}),env,ctx);
    if(!res.ok)return false;
    const body=await res.json().catch(()=>null);
    return body?.authenticated===true;
  }catch(_){return false}
}
async function putBossImage(env,bossId,bytes,contentType){
  if(!env.IMAGES)throw new Error('IMAGES binding is unavailable');
  const key=mediaKey(bossId);
  await env.IMAGES.put(`workspace/${key}`,bytes,{httpMetadata:{contentType:contentType||'image/png'},customMetadata:{source:'mws-boss-raid',updatedAt:new Date().toISOString()}});
  return mediaUrl(key);
}
async function externalizeBossImages(env,miniGames){
  if(!miniGames||typeof miniGames!=='object')return {value:miniGames,changed:false};
  const value=typeof structuredClone==='function'?structuredClone(miniGames):JSON.parse(JSON.stringify(miniGames));
  const bosses=value?.majokuBossRaid?.bosses;
  if(!Array.isArray(bosses))return {value,changed:false};
  let changed=false;
  for(let i=0;i<bosses.length;i++){
    const boss=bosses[i];if(!boss||typeof boss!=='object')continue;
    const parsed=parseDataImage(boss.image);if(!parsed)continue;
    const id=String(boss.id||`boss-${i+1}`);
    boss.image=await putBossImage(env,id,parsed.bytes,parsed.contentType);
    changed=true;
  }
  return {value,changed};
}
async function handleBossImageUpload(request,env,ctx){
  if(!(await isAdmin(request,env,ctx)))return json({error:'Admin authorization required'},401);
  let form;try{form=await request.formData()}catch(_){return json({error:'multipart/form-data required'},400)}
  const file=form.get('file');
  if(!file||typeof file.arrayBuffer!=='function')return json({error:'Image file is required'},400);
  const type=String(file.type||'');if(!type.startsWith('image/'))return json({error:'Image file only'},400);
  if(Number(file.size||0)>MAX_IMAGE_BYTES)return json({error:'Image must be 4MB or smaller'},413);
  const id=safeId(form.get('bossId')||crypto.randomUUID());
  const bytes=new Uint8Array(await file.arrayBuffer());
  const url=await putBossImage(env,id,bytes,type||'image/png');
  return json({ok:true,url,bossId:id});
}
async function rewriteSaveRequest(request,env){
  const body=await request.clone().json().catch(()=>null);
  if(!body?.parts?.miniGames)return request;
  const migrated=await externalizeBossImages(env,body.parts.miniGames);
  if(!migrated.changed)return request;
  body.parts.miniGames=migrated.value;
  const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.delete('content-length');
  return new Request(request.url,{method:request.method,headers,body:JSON.stringify(body)});
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/api/soop/proxy')return handleSoopProxy(request);
    if(url.pathname==='/api/boss-image'&&request.method==='POST')return handleBossImageUpload(request,env,ctx);
    if(url.pathname==='/api/save'&&request.method==='POST'){
      try{return appWorker.fetch(await rewriteSaveRequest(request,env),env,ctx)}catch(error){console.error('Boss image externalization failed',error);return appWorker.fetch(request,env,ctx)}
    }
    return appWorker.fetch(request,env,ctx);
  }
};
