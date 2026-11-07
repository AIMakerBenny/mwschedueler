/* SOOP station metadata for MWS contact autofill.
 * Fixed upstream hosts and a strict SOOP ID prevent arbitrary URL proxying.
 * No external profile image is stored until the user saves a contact.
 */
const SOOP_API_HOSTS=['chapi.sooplive.com','chapi.afreecatv.com'];
const CACHE_TTL_MS=60000;
const MAX_IMAGE_BYTES=5*1024*1024;
const stationCache=new Map();

export function parseSoopStationId(value){
  const id=String(value||'').trim();
  return /^[A-Za-z0-9_]{2,40}$/.test(id)?id:null;
}
function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'
  }});
}
function trustedImageUrl(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  let url;
  try{url=new URL(raw.startsWith('//')?'https:'+raw:raw)}catch(_){return ''}
  if(url.protocol!=='https:'||url.username||url.password||url.port)return '';
  const host=url.hostname.toLowerCase();
  if(!['sooplive.com','sooplive.co.kr','afreecatv.com','afreecatv.co.kr']
    .some(base=>host===base||host.endsWith('.'+base)))return '';
  return url.href;
}
export function parseSoopStationResponse(root,id){
  const station=root?.station;
  if(!station||typeof station!=='object'||Array.isArray(station))return null;
  const returnedId=String(station.user_id||station.bj_id||root.user_id||'').trim();
  if(returnedId&&returnedId.toLowerCase()!==id.toLowerCase())return null;
  const name=String(station.user_nick||'').trim();
  if(!name||name.length>120)return null;
  const upstreamImage=trustedImageUrl(root.profile_image||station.profile_image||'');
  return {id,name,stationUrl:'https://www.sooplive.com/station/'+encodeURIComponent(id),
    upstreamImage,hasProfile:Boolean(upstreamImage)};
}
async function getWithDeadline(fetchImpl,url,headers){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try{return await fetchImpl(url,{method:'GET',headers,redirect:'error',signal:controller.signal})}
  finally{clearTimeout(timer)}
}
async function lookupStation(id,fetchImpl){
  // Cache only real Worker fetches; isolated mock clients must not share a response.
  const cacheable=fetchImpl===globalThis.fetch;
  const key=id.toLowerCase(),hit=cacheable?stationCache.get(key):null;
  if(hit&&Date.now()-hit.at<CACHE_TTL_MS)return hit.data;
  let lastError=null;
  for(const host of SOOP_API_HOSTS){
    try{
      const url='https://'+host+'/api/'+encodeURIComponent(id)+'/station';
      const response=await getWithDeadline(fetchImpl,url,{
        accept:'application/json','referer':'https://www.sooplive.com/',
        'user-agent':'Mozilla/5.0 (compatible; MawangScheduler/1.0)'
      });
      if(!response.ok){lastError=new Error('SOOP station HTTP '+response.status);continue}
      const data=await response.json();
      const normalized=parseSoopStationResponse(data,id);
      if(!normalized){lastError=new Error('SOOP station information is missing or malformed');continue}
      if(cacheable)stationCache.set(key,{at:Date.now(),data:normalized});
      return normalized;
    }catch(error){lastError=error}
  }
  throw new Error(lastError?.message||'SOOP station request failed');
}
export async function handleSoopContactRoute(request,fetchImpl=globalThis.fetch){
  const url=new URL(request.url);
  const isAvatar=url.pathname==='/api/soop/contact-avatar';
  if(!['/api/soop/contact-station','/api/soop/contact-avatar'].includes(url.pathname))
    return json({ok:false,error:'Not found'},404);
  if(request.method!=='GET')return json({ok:false,error:'Method not allowed'},405);
  const id=parseSoopStationId(url.searchParams.get('id'));
  if(!id)return json({ok:false,error:'SOOP ID 형식이 올바르지 않습니다.'},400);
  let station;
  try{station=await lookupStation(id,fetchImpl)}
  catch(error){
    console.error('SOOP contact station lookup failed',String(error?.message||error));
    return json({ok:false,error:'SOOP 방송국 정보를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.'},502);
  }
  if(!isAvatar)return json({ok:true,id:station.id,name:station.name,
    stationUrl:station.stationUrl,hasProfile:station.hasProfile,
    avatarUrl:station.hasProfile?'/api/soop/contact-avatar?id='+encodeURIComponent(id):''});
  if(!station.upstreamImage)return json({ok:false,error:'프로필 사진이 제공되지 않습니다.'},404);
  try{
    const response=await getWithDeadline(fetchImpl,station.upstreamImage,{
      accept:'image/avif,image/webp,image/png,image/jpeg,image/gif,image/*;q=0.8',
      referer:'https://www.sooplive.com/'
    });
    if(!response.ok)return json({ok:false,error:'SOOP 프로필 사진 조회 실패'},502);
    const mime=(response.headers.get('content-type')||'').split(';')[0].toLowerCase().trim();
    if(!['image/jpeg','image/png','image/webp','image/gif'].includes(mime))
      return json({ok:false,error:'지원하지 않는 프로필 이미지 형식'},415);
    const length=Number(response.headers.get('content-length')||0);
    if(length>MAX_IMAGE_BYTES)return json({ok:false,error:'프로필 이미지 크기가 너무 큽니다.'},413);
    const bytes=await response.arrayBuffer();
    if(!bytes.byteLength||bytes.byteLength>MAX_IMAGE_BYTES)
      return json({ok:false,error:'프로필 이미지 크기가 올바르지 않습니다.'},413);
    return new Response(bytes,{status:200,headers:{
      'content-type':mime,'cache-control':'private,max-age=300','x-content-type-options':'nosniff'
    }});
  }catch(error){
    console.error('SOOP contact profile image failed',String(error?.message||error));
    return json({ok:false,error:'프로필 이미지를 가져오지 못했습니다.'},502);
  }
}
