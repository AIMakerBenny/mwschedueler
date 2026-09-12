import cf57 from './cf-v57.js';

const BUILD_VERSION = 'CF MWS V 1.0.12';
const BUILD_TOKEN = 'v1.0.12';
const PLANNER_PATCH_SRC = '/assets/content-planner-v1.0.12.js?v=1.0.12';

function versionizeText(text) {
  return String(text)
    .replace(/CF MWS V\s*1\.0\.\d+/g, BUILD_VERSION)
    .replace(/CF MWS V1\.0\.\d+/g, BUILD_VERSION)
    .replace(/MAWANG Content Planner V1\.0\.\d+/g, 'MAWANG Content Planner V1.0.12')
    .replace(/\/content-planner\.html\?v=1\.0\.\d+/g, '/content-planner.html?v=1.0.12')
    .replace(/\/assets\/tools\.js\?v=1\.0\.\d+/g, '/assets/tools.js?v=1.0.12')
    .replace(/\/assets\/content-planner-host\.js\?v=1\.0\.\d+/g, '/assets/content-planner-host.js?v=1.0.12');
}

function responseWithHeaders(response, body = null, noStore = false) {
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');
  headers.set('x-mws-build', BUILD_VERSION);
  headers.set('x-mws-release', BUILD_TOKEN);
  if (noStore) {
    headers.set('cache-control', 'no-store, no-cache, must-revalidate, max-age=0');
    headers.set('pragma', 'no-cache');
    headers.set('expires', '0');
  }
  return new Response(body === null ? response.body : body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function rootVersionLockScript() {
  return `<script id="mws-v1012-version-lock">(()=>{const V='${BUILD_VERSION}';const apply=()=>{document.body?.setAttribute('data-build-version',V);document.querySelectorAll('#mwsBuildVersion,[id^="mwsBuildVersionV5"],.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]').forEach(el=>{if(el.textContent!==V)el.textContent=V})};apply();document.addEventListener('DOMContentLoaded',apply,{once:true});window.addEventListener('load',apply,{once:true});const mo=new MutationObserver(apply);mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true});let n=0;const t=setInterval(()=>{apply();if(++n>80){clearInterval(t);mo.disconnect()}},250)})();</script>`;
}

async function patchStaticResponse(response, request) {
  if (!response || response.status === 304) return response;
  const url = new URL(request.url);
  const path = url.pathname;
  const type = (response.headers.get('content-type') || '').toLowerCase();

  if (type.includes('text/html')) {
    let text = versionizeText(await response.clone().text());
    if (path === '/content-planner.html' && !text.includes('content-planner-v1.0.12.js')) {
      const tag = `<script src="${PLANNER_PATCH_SRC}"></script>`;
      text = text.includes('</body>') ? text.replace('</body>', `${tag}\n</body>`) : `${text}\n${tag}`;
    }
    if ((path === '/' || path === '/index.html') && !text.includes('mws-v1012-version-lock')) {
      const tag = rootVersionLockScript();
      text = text.includes('</body>') ? text.replace('</body>', `${tag}\n</body>`) : `${text}\n${tag}`;
    }
    return responseWithHeaders(response, text, true);
  }

  if (type.includes('javascript') || type.includes('ecmascript')) {
    const text = versionizeText(await response.clone().text());
    return responseWithHeaders(response, text, true);
  }

  return responseWithHeaders(response, null, false);
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
  body.release = BUILD_TOKEN;
  if (path === '/api/bootstrap') body.mode = 'cf-mws-v1.0.12';

  const text = JSON.stringify(body);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('content-length', String(new TextEncoder().encode(text).byteLength));
  headers.set('x-mws-build', BUILD_VERSION);
  headers.set('x-mws-release', BUILD_TOKEN);
  headers.set('cache-control', 'no-store, no-cache, must-revalidate, max-age=0');
  return new Response(text, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env, ctx) {
    let response = await cf57.fetch(request, env, ctx);
    response = await patchStaticResponse(response, request);
    return withBuildVersion(response, request);
  },
};
