import authWorker from './cf-v120-friend.js';

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
    return authWorker.fetch(request,env,ctx);
  },
};
