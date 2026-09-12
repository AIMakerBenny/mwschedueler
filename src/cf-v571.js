import cf57 from './cf-v57.js';

const BUILD_VERSION = 'CF MWS V 1.0.11';

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
  if (path === '/api/bootstrap') body.mode = 'cf-mws-v1.0.11';

  const text = JSON.stringify(body);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('content-length', String(new TextEncoder().encode(text).byteLength));
  headers.set('x-mws-build', BUILD_VERSION);
  return new Response(text, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const response = await cf57.fetch(request, env, ctx);
    return withBuildVersion(response, request);
  },
};
