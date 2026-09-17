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

export default {
  async fetch(request, env, ctx) {
    const url=new URL(request.url);
    if(url.pathname==='/assets/cloud-v5.5.js'){
      const replacement=new URL('/assets/cloud-v1.1-loader.js?v=1.2.0',request.url);
      const response=await env.ASSETS.fetch(new Request(replacement.toString(),{method:'GET',headers:request.headers}));
      const headers=new Headers(response.headers);
      headers.set('cache-control','no-store');
      headers.set('x-mws-runtime','v1.2.0');
      headers.set('x-mws-image-policy','original-bytes-no-reencode');
      return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    }

    const response=await authWorker.fetch(request,env,ctx);
    if(request.method!=='GET'||response.status!==200)return response;
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
