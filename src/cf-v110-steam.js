import baseWorker from './cf-v571.js';

const STEAM_SUGGEST_URL='https://store.steampowered.com/search/suggest';
const FRONTEND_SCRIPT='<script src="/assets/steam-game-v110.js"></script>';
const SEARCH_LIMIT=8;
const SEARCH_TIMEOUT_MS=8000;

function json(value,status=200,headers={}){
  return new Response(JSON.stringify(value),{
    status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers},
  });
}
function cleanError(error){return error instanceof Error?error.message:String(error||'Unknown error')}
function decodeHtml(value){
  return String(value||'')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)||0))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)||0))
    .replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&nbsp;/gi,' ');
}
function plainText(value){return decodeHtml(String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim())}
function attrValue(attrs,name){
  const safe=String(name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const match=String(attrs||'').match(new RegExp(`${safe}\\s*=\\s*["']([^"']*)["']`,'i'));
  return match?decodeHtml(match[1]):'';
}
function parseSuggestions(html){
  const out=[];
  const seen=new Set();
  const anchor=/<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while((match=anchor.exec(String(html||'')))&&out.length<SEARCH_LIMIT){
    const attrs=match[1]||'';
    const appid=attrValue(attrs,'data-ds-appid');
    if(!/^\d{1,12}$/.test(appid)||seen.has(appid))continue;
    const body=match[2]||'';
    const nameMatch=body.match(/<[^>]*class=["'][^"']*\bmatch_name\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);
    const name=plainText(nameMatch?.[1]||'');
    if(!name)continue;
    const imageMatch=body.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
    const image=decodeHtml(imageMatch?.[1]||'')||`https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(appid)}/header.jpg`;
    const href=attrValue(attrs,'href')||`https://store.steampowered.com/app/${encodeURIComponent(appid)}/`;
    seen.add(appid);
    out.push({appid,name,image,storeUrl:href});
  }
  return out;
}
async function handleSteamSearch(request){
  const requestUrl=new URL(request.url);
  const q=String(requestUrl.searchParams.get('q')||'').trim();
  if(q.length<2)return json({error:'Search query must be at least 2 characters.'},400);
  if(q.length>80)return json({error:'Search query is too long.'},400);
  const suggest=new URL(STEAM_SUGGEST_URL);
  suggest.searchParams.set('term',q);
  suggest.searchParams.set('f','games');
  suggest.searchParams.set('cc','KR');
  suggest.searchParams.set('l','koreana');
  suggest.searchParams.set('realm','1');
  suggest.searchParams.set('origin','https://store.steampowered.com');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort('timeout'),SEARCH_TIMEOUT_MS);
  try{
    const response=await fetch(suggest.toString(),{
      headers:{accept:'text/html,application/xhtml+xml','user-agent':'Mozilla/5.0 MawangScheduler/1.1'},
      signal:controller.signal,
    });
    if(!response.ok)throw new Error(`Steam HTTP ${response.status}`);
    const html=await response.text();
    const results=parseSuggestions(html);
    return json({query:q,results},200,{'cache-control':'private, max-age=60'});
  }catch(error){
    const message=error?.name==='AbortError'?'Steam search timed out':cleanError(error);
    console.error('Steam search failed',error);
    return json({error:`Steam search failed: ${message}`},502);
  }finally{
    clearTimeout(timer);
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
        return handleSteamSearch(request);
      }
      const response=await baseWorker.fetch(request,env,ctx);
      return injectFrontend(response,request);
    }catch(error){
      console.error('Mawang Steam wrapper error',error);
      return json({error:cleanError(error)},500);
    }
  },
};
