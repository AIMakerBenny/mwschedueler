import cf57 from './cf-v57.js';

const BUILD_VERSION = 'CF MWS V 1.0.12';
const PLANNER_PATCH_SRC = '/assets/content-planner-v1.0.12.js?v=1.0.12';

function textResponse(response, text) {
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');
  headers.set('cache-control', 'no-cache');
  return new Response(text, { status: response.status, headers });
}

async function patchStaticResponse(response, request) {
  if (!response || response.status === 304) return response;
  const path = new URL(request.url).pathname;
  const type = response.headers.get('content-type') || '';

  if (path === '/content-planner.html' && type.includes('text/html')) {
    let text = await response.clone().text();
    text = text.replace('MAWANG Content Planner V1.0.11', 'MAWANG Content Planner V1.0.12');
    if (!text.includes('content-planner-v1.0.12.js')) {
      const tag = `<script src="${PLANNER_PATCH_SRC}"></script>`;
      text = text.includes('</body>') ? text.replace('</body>', `${tag}\n</body>`) : `${text}\n${tag}`;
    }
    return textResponse(response, text);
  }

  if ((path === '/' || path === '/index.html') && type.includes('text/html')) {
    const text = (await response.clone().text()).replaceAll('CF MWS V 1.0.11', BUILD_VERSION);
    return textResponse(response, text);
  }

  if (path === '/assets/content-planner-host.js' && type.includes('javascript')) {
    let text = await response.clone().text();
    text = text.replaceAll('CF MWS V 1.0.11', BUILD_VERSION)
      .replaceAll('/content-planner.html?v=1.0.11', '/content-planner.html?v=1.0.12')
      .replaceAll('/assets/tools.js?v=1.0.11', '/assets/tools.js?v=1.0.12');
    return textResponse(response, text);
  }

  if (path === '/assets/tools.js' && type.includes('javascript')) {
    const text = (await response.clone().text()).replaceAll('CF MWS V 1.0.11', BUILD_VERSION);
    return textResponse(response, text);
  }

  return response;
}

async function withBuildVersion(response, request) {
  if (!response) return response;
  const path = new URL(request.url).pathname;
  if (path !== '/api/bootstrap' && path !== '/api/health') return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json') || response.status === 304) return response;

  let body;
  try { body = await response.clone().json(); } catch (_) { return response; }
  if (!body || typeof body !== 'object') return response;

  body.build = BUILD_VERSION;
  if (path === '/api/bootstrap') body.mode = 'cf-mws-v1.0.12';

  const text = JSON.stringify(body);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('content-length', String(new TextEncoder().encode(text).byteLength));
  headers.set('x-mws-build', BUILD_VERSION);
  return new Response(text, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    let response = await cf57.fetch(request, env, ctx);
    response = await patchStaticResponse(response, request);
    return withBuildVersion(response, request);
  },
};
