// Isolated gallery in R2: original bytes, public reads and authenticated writes.
const PREFIX='mawang-archive/';
const CHARACTERS=new Set('yoo mi ye seon su so ae da ye-new hakka lena kokoa devil hina real wolferia mike coco azuki nyasuka chibi baby-shark baby-kuma'.split(' '));
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
  if(!api&&!media)return null;
  const bucket=env.IMAGES;
  if(!bucket)return json({error:'사진 저장소를 사용할 수 없습니다.'},503);
  if(media){
    const [,character,id]=media;
    if(!CHARACTERS.has(character)||!ID.test(id))return json({error:'잘못된 사진 주소'},400);
    if(!['GET','HEAD'].includes(method))return json({error:'Method not allowed'},405);
    const object=await bucket.get(PREFIX+character+'/'+id);
    if(!object)return json({error:'사진을 찾을 수 없습니다.'},404);
    const headers=new Headers();object.writeHttpMetadata(headers);
    headers.set('etag',object.httpEtag);headers.set('x-content-type-options','nosniff');
    headers.set('cache-control','public, max-age=300');headers.set('content-length',String(object.size));
    headers.set('x-mws-image-policy','original-bytes-no-reencode');
    return new Response(method==='HEAD'?null:object.body,{headers});
  }
  const [,character,id]=api;
  if(method==='GET'&&!character){
    const photos=(await list(bucket)).map(photo).filter(Boolean).sort((a,b)=>b.uploaded.localeCompare(a.uploaded)||b.id.localeCompare(a.id));
    return json({photos,maxPhotos:MAX_PHOTOS,maxBytes:MAX_BYTES});
  }
  if(!CHARACTERS.has(character)||id&&!ID.test(id))return json({error:'잘못된 캐릭터 또는 사진'},400);
  if(!(method==='POST'&&!id||method==='DELETE'&&id))return json({error:'Method not allowed'},405);
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'잘못된 요청 출처'},403);
  if(!await currentAdmin(request,env))return json({error:'관리자 로그인 후 이용해 주세요.'},401);
  if(method==='DELETE'){
    await bucket.delete(PREFIX+character+'/'+id);return json({ok:true,id});
  }
  const type=(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  if(!TYPES.has(type))return json({error:'JPG, PNG, WEBP, GIF, AVIF 사진만 등록할 수 있습니다.'},415);
  if(Number(request.headers.get('content-length'))>MAX_BYTES)return json({error:'사진은 32MB 이하만 등록할 수 있습니다.'},413);
  const existing=await list(bucket,PREFIX+character+'/');
  if(existing.length>=MAX_PHOTOS)return json({error:'캐릭터별 사진은 최대 30장입니다.'},409);
  const bytes=await request.arrayBuffer();
  if(bytes.byteLength>MAX_BYTES)return json({error:'사진은 32MB 이하만 등록할 수 있습니다.'},413);
  if(!signature(type,bytes))return json({error:'올바른 이미지 파일이 아닙니다.'},415);
  const key=PREFIX+character+'/'+crypto.randomUUID();
  const stored=await bucket.put(key,bytes,{httpMetadata:{contentType:type},customMetadata:{source:'mawang-archive-upload'}});
  return json({ok:true,photo:photo(stored)},201);
}
