import authWorker from './cf-v120-friend.js';

const APP_VERSION='1.2.0';
const APP_LABEL=`Mawang Scheduler v ${APP_VERSION}`;
const BUILD_LABEL=`MWS V ${APP_VERSION}`;

function normalizeVersionHtml(html){
  let out=String(html||'');
  out=out.replace(/data-build-version=["'][^"']*["']/i,`data-build-version="${BUILD_LABEL}"`);
  out=out.replace(/(<div\s+id=["']mwsBuildVersion["'][^>]*>)[\s\S]*?(<\/div>)/i,`$1${APP_LABEL}$2`);
  return out;
}

function normalizeBossRaidHtml(html){
  let out=String(html||'');
  out=out.replace('<strong id="bossHpText">100 / 100</strong>','<strong id="bossHpText">500 / 500</strong>');
  out=out.replace(
`  const bossState = {
    maxHealth:100,
    health:100,
    running:false,
    finished:false,
    damage:{},
    lastAttacker:''
  };
  const bossAttackWords`,
`  const bossState = {
    maxHealth:500,
    health:500,
    running:false,
    finished:false,
    damage:{},
    lastAttacker:''
  };
  window.mwsBossRaidSetMaxHealth = function(value) {
    const hp = Math.max(1,Math.min(1000000,Math.floor(Number(value)||500)));
    applyBossSettings(hp);
    return hp;
  };
  window.mwsBossRaidGetHealthState = function() {
    return {maxHealth:bossState.maxHealth,health:bossState.health,running:bossState.running,finished:bossState.finished};
  };
  const bossAttackWords`);
  out=out.replaceAll('Number(bossState.maxHealth)||100','Number(bossState.maxHealth)||500');
  out=out.replaceAll('Number(maxHealth)||100','Number(maxHealth)||500');
  return out;
}

function normalizeBossScript(js){
  return String(js||'').replaceAll("if(id==='boss-default'&&hp===100)hp=DEFAULT_HP;",'');
}

function textResponse(response,text,extraHeaders={}){
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  for(const [key,value] of Object.entries(extraHeaders))headers.set(key,value);
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}

export default {
  async fetch(request, env, ctx) {
    const url=new URL(request.url);
    if(url.pathname==='/assets/cloud-v5.5.js'){
      const replacement=new URL('/assets/cloud-v1.1-loader.js?v=1.2.2',request.url);
      const response=await env.ASSETS.fetch(new Request(replacement.toString(),{method:'GET',headers:request.headers}));
      const headers=new Headers(response.headers);
      headers.set('cache-control','no-store');
      headers.set('x-mws-runtime','v1.2.0');
      headers.set('x-mws-image-policy','original-bytes-no-reencode');
      return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    }

    const response=await authWorker.fetch(request,env,ctx);

    if(request.method==='GET'&&response.status===200&&(url.pathname==='/assets/boss-manager-v121.js'||url.pathname==='/assets/boss-raid-v116.js')){
      const contentType=response.headers.get('content-type')||'';
      if(contentType.toLowerCase().includes('javascript')||contentType.toLowerCase().includes('text/plain')){
        return textResponse(response,normalizeBossScript(await response.text()),{'x-mws-boss-hp-policy':'configurable-default-500'});
      }
    }

    if(request.method!=='GET'||response.status!==200)return response;

    if(url.pathname==='/majoku-castle.html'){
      const contentType=response.headers.get('content-type')||'';
      if(!contentType.toLowerCase().includes('text/html'))return response;
      const html=normalizeBossRaidHtml(await response.text());
      return textResponse(response,html,{'x-mws-boss-hp-default':'500','x-mws-boss-hp-configurable':'true'});
    }

    if(url.pathname!=='/'&&url.pathname!=='/index.html')return response;
    const contentType=response.headers.get('content-type')||'';
    if(!contentType.toLowerCase().includes('text/html'))return response;

    const html=normalizeVersionHtml(await response.text());
    const headers=new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control','no-store');
    headers.set('x-mws-app-version',APP_VERSION);
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  },
};
