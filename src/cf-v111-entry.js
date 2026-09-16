import authWorker from './cf-v112-authfix.js';

const STEAM_SCRIPT='<script src="/assets/steam-game-v111.js?v=1.1.2" data-mws-steam-v111="1"></script>';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/assets/cloud-v5.5.js') {
      const replacement = new URL('/assets/cloud-v1.1-loader.js?v=1.1.2', request.url);
      return env.ASSETS.fetch(new Request(replacement.toString(), { method: 'GET', headers: request.headers }));
    }

    const response = await authWorker.fetch(request, env, ctx);
    if (request.method !== 'GET' || (url.pathname !== '/' && url.pathname !== '/index.html') || response.status !== 200) return response;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html')) return response;

    let html = await response.text();
    html = html.replace(/<script\s+src=["']\/assets\/steam-game-v110\.js["']\s*><\/script>/gi, STEAM_SCRIPT);
    if (!html.includes('steam-game-v111.js')) {
      html = html.includes('</body>') ? html.replace('</body>', `${STEAM_SCRIPT}\n</body>`) : `${html}\n${STEAM_SCRIPT}`;
    }
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control','no-store');
    headers.set('x-mws-steam-picker','v1.1.2');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  },
};
