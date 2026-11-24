import appWorker from './cf-v121-boss-media.js';

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    const response=await appWorker.fetch(request,env,ctx);
    if(request.method==='GET'&&response.ok&&url.pathname.startsWith('/media/')&&url.searchParams.has('v')){
      const headers=new Headers(response.headers);
      // The origin knows whether the requested revision actually exists.
      // Never promote a mutable fallback or private response to immutable.
      headers.set('x-mws-image-policy','original-bytes-no-reencode');
      return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    }
    return response;
  }
};
