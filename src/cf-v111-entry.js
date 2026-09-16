import authWorker from './cf-v112-authfix.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/assets/cloud-v5.5.js') {
      const replacement = new URL('/assets/cloud-v1.1-loader.js?v=1.1.1', request.url);
      return env.ASSETS.fetch(new Request(replacement.toString(), { method: 'GET', headers: request.headers }));
    }
    return authWorker.fetch(request, env, ctx);
  },
};
