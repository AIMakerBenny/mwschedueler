import appWorker from './cf-v112-authfix.js';

const MAX_IMAGE_BYTES=4*1024*1024;

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
    if(url.pathname==='/api/boss-image'&&request.method==='POST')return handleBossImageUpload(request,env,ctx);
    if(url.pathname==='/api/save'&&request.method==='POST'){
      try{return appWorker.fetch(await rewriteSaveRequest(request,env),env,ctx)}catch(error){console.error('Boss image externalization failed',error);return appWorker.fetch(request,env,ctx)}
    }
    return appWorker.fetch(request,env,ctx);
  }
};
