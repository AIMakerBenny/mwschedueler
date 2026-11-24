// Isolated gallery in R2: original bytes, public reads and authenticated writes.
const PREFIX='mawang-archive/';
const PROFILE_PREFIX='mawang-archive-profile/';
const CHARACTERS=new Set('yoo mi mi-gold ye seon su su-black su-half so ae da ye-new hakka lena kokoa devil hina real wolferia mike coco azuki nyasuka chibi baby-shark baby-kuma kkomwang marorong'.split(' '));
const MAX_BYTES=32*1024*1024,MAX_PHOTOS=30;
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const TYPES=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
function signature(type,bytes){
  const b=new Uint8Array(bytes),s=(o,n)=>String.fromCharCode(...b.slice(o,o+n));
  if(type==='image/jpeg')return b.length>3&&b[0]===255&&b[1]===216&&b[2]===255;
  if(type==='image/png')return b.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v);
  if(type==='image/webp')return b.length>12&&s(0,4)==='RIFF'&&s(8,4)==='WEBP';
  if(type==='image/gif')return b.length>6&&['GIF87a','GIF89a'].includes(s(0,6));
  return b.length>16&&s(4,4)==='ftyp'&&(/avif|avis/.test(s(8,Math.min(32,b.length-8))));
}
function photo(object){
  const [character,id]=object.key.slice(PREFIX.length).split('/');
  if(!CHARACTERS.has(character)||!ID.test(id||''))return null;
  return {character,id,url:'/media/mawang-archive/'+character+'/'+id,uploaded:new Date(object.uploaded).toISOString(),size:object.size};
}
function profile(object){
  const character=object.key.slice(PROFILE_PREFIX.length);
  if(!CHARACTERS.has(character))return null;
  const revision=new Date(object.uploaded).getTime()+'-'+String(object.etag||'').replace(/[^a-f0-9]/gi,'');
  return {character,revision,url:'/media/mawang-profile/'+character+'?rev='+revision,size:object.size};
}
async function list(bucket,prefix=PREFIX){
  let cursor,objects=[];
  do{
    const result=await bucket.list({prefix,limit:1000,...(cursor?{cursor}:{})});
    objects.push(...result.objects);cursor=result.truncated?result.cursor:undefined;
  }while(cursor);
  return objects;
}
export async function handleArchiveGallery(request,env,currentAdmin){
  const path=new URL(request.url).pathname,method=request.method;
  const api=path.match(/^\/api\/mawang-gallery(?:\/([^/]+)(?:\/([^/]+))?)?$/);
  const media=path.match(/^\/media\/mawang-archive\/([^/]+)\/([^/]+)$/);
  const profileApi=path.match(/^\/api\/mawang-profile(?:\/([^/]+))?$/);
  const profileMedia=path.match(/^\/media\/mawang-profile\/([^/]+)$/);
  if(!api&&!media&&!profileApi&&!profileMedia)return null;
  const bucket=env.IMAGES;
  if(!bucket)return json({error:'사진 저장소를 사용할 수 없습니다.'},503);
  if(media||profileMedia){
    const [,character,id]=media||profileMedia;
    if(!CHARACTERS.has(character)||media&&!ID.test(id))return json({error:'잘못된 사진 주소'},400);
    if(!['GET','HEAD'].includes(method))return json({error:'Method not allowed'},405);
    const object=await bucket.get(profileMedia?PROFILE_PREFIX+character:PREFIX+character+'/'+id);
    if(!object)return json({error:'사진을 찾을 수 없습니다.'},404);
    const headers=new Headers();object.writeHttpMetadata(headers);
    headers.set('etag',object.httpEtag);headers.set('x-content-type-options','nosniff');
    // Versioned, small public portraits may be kept on disk for a day.
    // Larger originals and unversioned URLs retain short-lived caching to
    // avoid pinning potentially many 32 MB images in browser storage.
    const requestedRevision=profileMedia?new URL(request.url).searchParams.get('rev'):null;
    const canCachePortrait=profileMedia&&object.size<=2*1024*1024&&
      requestedRevision!==null&&requestedRevision===profile(object)?.revision;
    headers.set('cache-control',canCachePortrait?'public, max-age=86400, immutable':'public, max-age=300');
    headers.set('content-length',String(object.size));
    headers.set('x-mws-image-policy','original-bytes-no-reencode');
    return new Response(method==='HEAD'?null:object.body,{headers});
  }
  const [,character,id]=api||profileApi;
  if(profileApi&&!character){
    if(method!=='GET')return json({error:'Method not allowed'},405);
    // Conditional, no-store metadata revalidation. No portraits or admin
    // information are copied into a second persistent browser database.
    const profiles=(await list(bucket,PROFILE_PREFIX)).map(profile).filter(Boolean)
      .sort((a,b)=>a.character.localeCompare(b.character));
    const serialized=JSON.stringify(profiles);
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serialized));
    const tag='"'+Array.from(new Uint8Array(digest).slice(0,16),byte=>byte.toString(16).padStart(2,'0')).join('')+'"';
    const headers={'cache-control':'no-store','etag':tag,'x-content-type-options':'nosniff'};
    if(request.headers.get('if-none-match')===tag)return new Response(null,{status:304,headers});
    const response=json({profiles,maxBytes:MAX_BYTES});
    response.headers.set('etag',tag);
    return response;
  }
  if(method==='GET'&&!character){
    const [galleryObjects,profileObjects]=await Promise.all([list(bucket),list(bucket,PROFILE_PREFIX)]);
    const photos=galleryObjects.map(photo).filter(Boolean).sort((a,b)=>b.uploaded.localeCompare(a.uploaded)||b.id.localeCompare(a.id));
    return json({photos,profiles:profileObjects.map(profile).filter(Boolean),maxPhotos:MAX_PHOTOS,maxBytes:MAX_BYTES});
  }
  if(!CHARACTERS.has(character)||id&&!ID.test(id))return json({error:'잘못된 캐릭터 또는 사진'},400);
  if(profileApi?!['PUT','DELETE'].includes(method):!(method==='POST'&&!id||method==='DELETE'&&id))return json({error:'Method not allowed'},405);
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'잘못된 요청 출처'},403);
  if(!await currentAdmin(request,env))return json({error:'관리자 로그인 후 이용해 주세요.'},401);
  if(method==='DELETE'){
    await bucket.delete(profileApi?PROFILE_PREFIX+character:PREFIX+character+'/'+id);return json({ok:true,id,character});
  }
  const type=(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  if(!TYPES.has(type))return json({error:'JPG, PNG, WEBP, GIF, AVIF 사진만 등록할 수 있습니다.'},415);
  if(Number(request.headers.get('content-length'))>MAX_BYTES)return json({error:'사진은 32MB 이하만 등록할 수 있습니다.'},413);
  if(!profileApi){
    const existing=await list(bucket,PREFIX+character+'/');
    if(existing.length>=MAX_PHOTOS)return json({error:'캐릭터별 사진은 최대 30장입니다.'},409);
  }
  const bytes=await request.arrayBuffer();
  if(bytes.byteLength>MAX_BYTES)return json({error:'사진은 32MB 이하만 등록할 수 있습니다.'},413);
  if(!signature(type,bytes))return json({error:'올바른 이미지 파일이 아닙니다.'},415);
  const key=profileApi?PROFILE_PREFIX+character:PREFIX+character+'/'+crypto.randomUUID();
  const stored=await bucket.put(key,bytes,{httpMetadata:{contentType:type},customMetadata:{source:profileApi?'mawang-archive-profile':'mawang-archive-upload'}});
  if(profileApi)return json({ok:true,profile:profile(stored)});
  return json({ok:true,photo:photo(stored)},201);
}
