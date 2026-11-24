import {exactContact,frame,imageType,MAX_ITEMS,MAX_IMAGE,MAX_REQUEST,MAX_BATCH_BYTES} from '../assets/media-batch-protocol-v5.js';
const fail=(status)=>new Response('Media batch unavailable',{status,headers:{'cache-control':'no-store'}});
async function readInput(request){
  if(!request.body)throw Error('missing body');
  const reader=request.body.getReader();let bytes=0;const parts=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_REQUEST)throw Error('request limit');parts.push(value)}
    const merged=new Uint8Array(bytes);let offset=0;for(const p of parts){merged.set(p,offset);offset+=p.length}
    return JSON.parse(new TextDecoder().decode(merged));
  }finally{try{await reader.cancel()}catch{}reader.releaseLock()}
}
export async function handleMediaBatch(request,env){
  if(env.MWS_MEDIA_BATCH_V5!=='1')return fail(404);
  if(request.method!=='POST')return fail(405);
  const origin=new URL(request.url).origin;
  if((request.headers.has('origin')&&request.headers.get('origin')!==origin)||request.headers.get('sec-fetch-site')==='cross-site')return fail(403);
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return fail(415);
  if(Number(request.headers.get('content-length')||0)>MAX_REQUEST)return fail(413);
  let entries;try{
    const input=await readInput(request);
    if(!Array.isArray(input.urls)||!input.urls.length||input.urls.length>MAX_ITEMS)return fail(400);
    entries=input.urls.map(u=>exactContact(u,origin));
    if(entries.some(e=>!e)||new Set(entries.map(e=>e.url)).size!==entries.length)return fail(400);
  }catch{return fail(400)}
  let reader=null,cancelled=false;
  async function* deliver(){
    let total=0;
    try{
      for(const entry of entries){
        if(cancelled)return;
        let obj;try{obj=await env.IMAGES.get(entry.key)}catch{yield frame({url:entry.url,status:503});continue}
        if(cancelled){await obj?.body?.cancel().catch(()=>{});return}
        if(!obj){yield frame({url:entry.url,status:404});continue}
        const headers=new Headers();obj.writeHttpMetadata(headers);
        const type=headers.get('content-type')||'',size=obj.size;
        if(!Number.isSafeInteger(size)||size<=0||size>MAX_IMAGE||total+size>MAX_BATCH_BYTES||!imageType(type)||/private|no-store/i.test(headers.get('cache-control')||'')){
          await obj.body.cancel().catch(()=>{});yield frame({url:entry.url,status:422});continue;
        }
        total+=size;reader=obj.body.getReader();let sent=0;
        yield frame({url:entry.url,status:200,size,type,version:entry.version});
        try{
          while(!cancelled){
            const {done,value}=await reader.read();if(done)break;
            sent+=value.byteLength;if(sent>size)throw Error('body length mismatch');yield value;
          }
          if(cancelled)return;if(sent!==size)throw Error('truncated object');
        }finally{try{await reader.cancel()}catch{}reader.releaseLock();reader=null}
      }
      if(!cancelled)yield frame({end:true});
    }finally{if(reader)try{await reader.cancel()}catch{}}
  }
  const iterator=deliver();
  return new Response(new ReadableStream({
    async pull(controller){try{const row=await iterator.next();if(cancelled)return;if(row.done)controller.close();else controller.enqueue(row.value)}catch(error){if(!cancelled)controller.error(error)}},
    async cancel(){cancelled=true;if(reader)try{await reader.cancel()}catch{}await iterator.return()}
  }),{headers:{'content-type':'application/x-mws-media-batch-v5','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
}
