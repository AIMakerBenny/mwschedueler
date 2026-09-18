import appWorker from './cf-v122-cache.js';

const CHANNEL_HOST='api-channel.sooplive.co.kr';
const THUMB_HOSTS=['liveimg.sooplive.com','liveimg.sooplive.co.kr'];
const CATEGORY_URL='https://live.sooplive.com/script/locale/ko_KR/broad_category.js';
const LIVE_TTL_MS=30000;
const CATEGORY_TTL_MS=6*60*60*1000;
const BATCH_MAX=120;
const CONCURRENCY=48;
const FETCH_TIMEOUT_MS=5000;
const liveCache=new Map();
let categoryCache={at:0,categories:[]};

function json(value,status=200,headers={}){
  return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});
}
function browserHeaders(target){
  const h=new Headers({
    accept:'application/json, text/plain, */*',
    'accept-language':'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'
  });
  if(target.hostname===CHANNEL_HOST){
    h.set('origin','https://www.sooplive.co.kr');
    h.set('referer','https://www.sooplive.co.kr/');
    h.set('sec-fetch-dest','empty');h.set('sec-fetch-mode','cors');h.set('sec-fetch-site','same-site');
  }else{
    h.set('referer','https://www.sooplive.com/');
  }
  return h;
}
function parseChannelUrl(raw){
  let u;try{u=new URL(String(raw||''))}catch(_){return null}
  if(u.protocol!=='https:'||u.hostname!==CHANNEL_HOST||u.username||u.password||u.port)return null;
  if(!/^\/v1\.1\/channel\/[^/]+\/home\/section\/broad\/?$/.test(u.pathname))return null;
  return u;
}
async function fetchText(target){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
  try{
    const res=await fetch(target.toString(),{headers:browserHeaders(target),redirect:'follow',signal:controller.signal});
    const body=await res.text();
    return {url:target.href,status:res.status,contentType:res.headers.get('content-type')||'application/json; charset=utf-8',body};
  }catch(error){
    return {url:target.href,status:502,contentType:'application/json; charset=utf-8',body:JSON.stringify({error:error?.name==='AbortError'?'SOOP request timed out':String(error?.message||error||'SOOP request failed')})};
  }finally{clearTimeout(timer)}
}

function firstLiveScalar(obj,keys){
  for(const key of keys){
    const value=obj?.[key];
    if((typeof value==='string'||typeof value==='number')&&String(value).trim())return String(value).trim();
  }
  return '';
}
function normalizeLivePayload(root){
  if(!root||typeof root!=='object')return null;
  const queue=[root],seen=new Set();
  while(queue.length){
    const value=queue.shift();
    if(!value||typeof value!=='object'||seen.has(value))continue;
    seen.add(value);
    if(!Array.isArray(value)){
      const broadNo=firstLiveScalar(value,['broadNo','broad_no','bno']);
      if(broadNo){
        const viewerRaw=firstLiveScalar(value,['currentSumViewer','current_sum_viewer','total_view_cnt','viewer_cnt','viewerCount']);
        const viewer=viewerRaw!==''?Number(viewerRaw):null;
        return {
          broadNo,
          broadTitle:firstLiveScalar(value,['broadTitle','broad_title','title']),
          categoryName:firstLiveScalar(value,['categoryName','category_name','broadCategoryName','broad_category_name']),
          broadCateNo:firstLiveScalar(value,['broadCateNo','broad_cate_no','categoryNo','category_no']),
          currentSumViewer:Number.isFinite(viewer)?viewer:null
        };
      }
    }
    for(const child of Array.isArray(value)?value:Object.values(value))if(child&&typeof child==='object')queue.push(child);
  }
  return null;
}
function attachNormalizedLive(row){
  if(!row||typeof row!=='object')return row;
  let parsed=null;
  try{parsed=JSON.parse(String(row.body||''))}catch(_){}
  const live=normalizeLivePayload(parsed);
  return live?{...row,live}:row;
}
async function liveRow(target,force=false){
  const key=target.href,hit=liveCache.get(key);
  if(!force&&hit&&Date.now()-hit.at<LIVE_TTL_MS)return hit.row;
  const row=attachNormalizedLive(await fetchText(target));
  liveCache.set(key,{at:Date.now(),row});
  if(liveCache.size>240){for(const [k,v] of liveCache)if(Date.now()-v.at>120000)liveCache.delete(k)}
  return row;
}
async function mapLimit(items,limit,fn){
  const out=new Array(items.length);let next=0;
  async function worker(){for(;;){const i=next++;if(i>=items.length)return;out[i]=await fn(items[i],i)}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},()=>worker()));return out;
}
async function handleLiveBatch(request){
  let body;try{body=await request.json()}catch(_){return json({error:'JSON body required'},400)}
  const raw=Array.isArray(body?.urls)?body.urls:[];
  if(!raw.length)return json({ok:true,results:[],cachedForMs:LIVE_TTL_MS});
  if(raw.length>BATCH_MAX)return json({error:`Maximum ${BATCH_MAX} channels per batch`},413);
  const targets=[];const seen=new Set();
  for(const item of raw){const u=parseChannelUrl(item);if(!u)continue;if(seen.has(u.href))continue;seen.add(u.href);targets.push(u)}
  const force=body?.force===true;
  const started=Date.now();
  const results=await mapLimit(targets,CONCURRENCY,target=>liveRow(target,force));
  return json({ok:true,results,elapsedMs:Date.now()-started,cachedForMs:LIVE_TTL_MS,concurrency:CONCURRENCY});
}

function validBroadcastNo(raw){
  const value=String(raw||'').trim();
  return /^\d{3,20}$/.test(value)?value:'';
}
async function fetchLiveThumb(target){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
  try{
    const headers=browserHeaders(target);
    headers.set('accept','image/avif,image/webp,image/apng,image/*,*/*;q=0.8');
    headers.set('referer','https://www.sooplive.com/');
    const res=await fetch(target,{headers,redirect:'follow',signal:controller.signal});
    const type=String(res.headers.get('content-type')||'').toLowerCase();
    if(!res.ok||!type.startsWith('image/'))return null;
    return new Response(res.body,{status:200,headers:{
      'content-type':type,
      'cache-control':'public, max-age=5, s-maxage=10',
      'x-content-type-options':'nosniff'
    }});
  }catch(_){return null}
  finally{clearTimeout(timer)}
}
async function handleLiveThumb(request){
  const url=new URL(request.url),bno=validBroadcastNo(url.searchParams.get('bno'));
  if(!bno)return json({error:'Invalid broadcast number'},400);
  for(const host of THUMB_HOSTS){
    const response=await fetchLiveThumb(new URL(`https://${host}/m/${encodeURIComponent(bno)}`));
    if(response)return response;
  }
  return json({error:'SOOP live thumbnail unavailable'},502);
}

function scalar(obj,keys){for(const k of keys){const v=obj?.[k];if((typeof v==='string'||typeof v==='number')&&String(v).trim())return String(v).trim()}return''}
function flattenCategories(root){
  const found=new Map(),seen=new Set();
  const nameKeys=['CATE_NAME','cate_name','CATEGORY_NAME','category_name','categoryName','name','NAME','title','TITLE'];
  const idKeys=['CATE_NO','cate_no','CATEGORY_NO','category_no','categoryNo','id','ID','idx','IDX'];
  const walk=value=>{
    if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);
    if(!Array.isArray(value)){
      const name=scalar(value,nameKeys),id=scalar(value,idKeys);
      if(name&&id&&name.length<100&&id.length<40)found.set(`${id}|${name}`,{id,name});
    }
    for(const child of Array.isArray(value)?value:Object.values(value))if(child&&typeof child==='object')walk(child);
  };
  walk(root);
  return [...found.values()].sort((a,b)=>a.name.localeCompare(b.name,'ko'));
}
function parseCategoryScript(text){
  const source=String(text||'');
  const match=source.match(/var\s+szBroadCategory\s*=\s*([\s\S]*?);\s*(?:\r?\n|$)/);
  if(!match)throw new Error('SOOP category payload format changed');
  let root;try{root=JSON.parse(match[1])}catch(_){throw new Error('SOOP category JSON parse failed')}
  const categories=flattenCategories(root);
  if(!categories.length)throw new Error('SOOP category list is empty');
  return categories;
}
async function loadCategories(force=false){
  if(!force&&categoryCache.categories.length&&Date.now()-categoryCache.at<CATEGORY_TTL_MS)return categoryCache.categories;
  const target=new URL(CATEGORY_URL),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
  try{
    const headers=browserHeaders(target);headers.set('accept','text/javascript,text/plain,*/*');
    const res=await fetch(target,{headers,signal:controller.signal});
    if(!res.ok)throw new Error(`SOOP category HTTP ${res.status}`);
    const categories=parseCategoryScript(await res.text());
    categoryCache={at:Date.now(),categories};return categories;
  }finally{clearTimeout(timer)}
}
async function handleCategories(request){
  try{
    const force=new URL(request.url).searchParams.get('force')==='1';
    const categories=await loadCategories(force);
    return json({ok:true,categories,cachedForMs:CATEGORY_TTL_MS,source:'soop-broad-category'});
  }catch(error){return json({ok:false,error:String(error?.message||error||'SOOP category request failed')},502)}
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/api/soop/live-batch'&&request.method==='POST')return handleLiveBatch(request);
    if(url.pathname==='/api/soop/live-thumb'&&request.method==='GET')return handleLiveThumb(request);
    if(url.pathname==='/api/soop/categories'&&request.method==='GET')return handleCategories(request);
    return appWorker.fetch(request,env,ctx);
  }
};
