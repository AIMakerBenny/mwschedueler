import baseWorker from './cf-v571.js';

const STEAM_APPLIST_URL='https://api.steampowered.com/ISteamApps/GetAppList/v2/';
const STEAM_DETAIL_BASE='https://store.steampowered.com/api/appdetails';
const FRONTEND_SCRIPT='<script src="/assets/steam-game-v110.js"></script>';
const APP_LIST_TTL=24*60*60;
const APP_DETAIL_TTL=7*24*60*60;
const SEARCH_LIMIT=8;
const DETAIL_CANDIDATES=14;

let appListMemory=null;
let appListMemoryExpires=0;
const detailMemory=new Map();

function json(value,status=200,headers={}){
  return new Response(JSON.stringify(value),{
    status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers},
  });
}
function cleanError(error){return error instanceof Error?error.message:String(error||'Unknown error')}
function normalized(value){return String(value||'').normalize('NFKC').trim().toLocaleLowerCase('en-US')}
function appScore(name,query){
  const n=normalized(name),q=normalized(query);
  if(!n||!q)return Number.POSITIVE_INFINITY;
  if(n===q)return 0;
  if(n.startsWith(q))return 10+Math.min(30,n.length-q.length)/10;
  const word=n.search(new RegExp(`(^|[^a-z0-9])${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`,'i'));
  if(word>=0)return 30+word;
  const pos=n.indexOf(q);
  if(pos>=0)return 60+pos+Math.min(40,n.length)/100;
  return Number.POSITIVE_INFINITY;
}
async function cachedJson(url,ttl,ctx){
  const cache=globalThis.caches?.default;
  const key=new Request(url,{method:'GET'});
  if(cache){
    const hit=await cache.match(key);
    if(hit){try{return await hit.json()}catch(_){}}
  }
  const response=await fetch(url,{headers:{accept:'application/json','user-agent':'MawangScheduler/1.1 Steam Search'}});
  if(!response.ok)throw new Error(`Steam HTTP ${response.status}`);
  const text=await response.text();
  let parsed;
  try{parsed=JSON.parse(text)}catch(_){throw new Error('Invalid Steam JSON response')}
  if(cache){
    const stored=new Response(text,{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':`public, max-age=${ttl}`}});
    try{ctx?.waitUntil?.(cache.put(key,stored))}catch(_){}
  }
  return parsed;
}
async function loadAppList(ctx){
  if(appListMemory&&Date.now()<appListMemoryExpires)return appListMemory;
  const payload=await cachedJson(STEAM_APPLIST_URL,APP_LIST_TTL,ctx);
  const apps=Array.isArray(payload?.applist?.apps)?payload.applist.apps:[];
  appListMemory=apps.filter(x=>x&&Number.isFinite(Number(x.appid))&&String(x.name||'').trim());
  appListMemoryExpires=Date.now()+30*60*1000;
  return appListMemory;
}
function rememberDetail(appid,value){
  if(detailMemory.size>500){
    const first=detailMemory.keys().next().value;
    if(first!==undefined)detailMemory.delete(first);
  }
  detailMemory.set(String(appid),{expires:Date.now()+60*60*1000,value});
}
async function loadAppDetail(app,ctx){
  const appid=String(app.appid);
  const memory=detailMemory.get(appid);
  if(memory&&memory.expires>Date.now())return memory.value;
  const url=`${STEAM_DETAIL_BASE}?appids=${encodeURIComponent(appid)}&l=koreana&cc=KR`;
  try{
    const payload=await cachedJson(url,APP_DETAIL_TTL,ctx);
    const row=payload?.[appid];
    if(row?.success&&row.data&&typeof row.data==='object'){
      const type=String(row.data.type||'').toLowerCase();
      const value={
        appid,
        name:String(row.data.name||app.name||'').trim()||String(app.name||''),
        image:String(row.data.header_image||'').trim(),
        type,
        verified:true,
      };
      rememberDetail(appid,value);
      return value;
    }
  }catch(_){}
  const fallback={
    appid,
    name:String(app.name||'').trim(),
    image:`https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(appid)}/header.jpg`,
    type:'',
    verified:false,
  };
  rememberDetail(appid,fallback);
  return fallback;
}
function shortlistApps(apps,query){
  const best=[];
  for(const app of apps){
    const score=appScore(app.name,query);
    if(!Number.isFinite(score))continue;
    best.push({app,score});
    if(best.length>=180){best.sort((a,b)=>a.score-b.score||String(a.app.name).localeCompare(String(b.app.name)));best.length=80}
  }
  best.sort((a,b)=>a.score-b.score||String(a.app.name).localeCompare(String(b.app.name)));
  return best.slice(0,DETAIL_CANDIDATES).map(x=>x.app);
}
async function handleSteamSearch(request,ctx){
  const url=new URL(request.url);
  const q=String(url.searchParams.get('q')||'').trim();
  if(q.length<2)return json({error:'Search query must be at least 2 characters.'},400);
  if(q.length>80)return json({error:'Search query is too long.'},400);
  try{
    const apps=await loadAppList(ctx);
    const candidates=shortlistApps(apps,q);
    if(!candidates.length)return json({query:q,results:[]},200,{'cache-control':'private, max-age=30'});
    const details=await Promise.all(candidates.map(app=>loadAppDetail(app,ctx)));
    let usable=details.filter(x=>x.type==='game');
    if(usable.length<SEARCH_LIMIT){
      const fallback=details.filter(x=>!x.verified&&!usable.some(y=>y.appid===x.appid));
      usable=usable.concat(fallback);
    }
    const results=usable.slice(0,SEARCH_LIMIT).map(x=>({
      appid:x.appid,
      name:x.name,
      image:x.image||`https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(x.appid)}/header.jpg`,
      storeUrl:`https://store.steampowered.com/app/${encodeURIComponent(x.appid)}/`,
    }));
    return json({query:q,results},200,{'cache-control':'private, max-age=30'});
  }catch(error){
    console.error('Steam search failed',error);
    return json({error:`Steam search failed: ${cleanError(error)}`},502);
  }
}
async function injectFrontend(response,request){
  if(!response||response.status!==200)return response;
  const url=new URL(request.url);
  if(url.pathname!=='/'&&url.pathname!=='/index.html')return response;
  const contentType=response.headers.get('content-type')||'';
  if(!contentType.toLowerCase().includes('text/html'))return response;
  const text=await response.text();
  if(text.includes('steam-game-v110.js'))return new Response(text,{status:response.status,statusText:response.statusText,headers:response.headers});
  const next=text.includes('</body>')?text.replace('</body>',`${FRONTEND_SCRIPT}\n</body>`):`${text}\n${FRONTEND_SCRIPT}`;
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('x-mws-steam-integration','v110');
  return new Response(next,{status:response.status,statusText:response.statusText,headers});
}

export default{
  async fetch(request,env,ctx){
    try{
      const url=new URL(request.url);
      if(url.pathname==='/api/steam/search'){
        if(request.method!=='GET')return json({error:'Method not allowed.'},405,{allow:'GET'});
        return handleSteamSearch(request,ctx);
      }
      const response=await baseWorker.fetch(request,env,ctx);
      return injectFrontend(response,request);
    }catch(error){
      console.error('Mawang Steam wrapper error',error);
      return json({error:cleanError(error)},500);
    }
  },
};
