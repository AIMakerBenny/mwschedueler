import baseWorker from './index.js';

const CACHE_SCHEMA_VERSION = 3;
const BUILD_VERSION = 'CF V5.7';

function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

function mediaBase(env) {
  const raw = String(env.MWS_R2_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return '';
    return url.toString().replace(/\/+$/, '');
  } catch (_) {
    return '';
  }
}

function mediaConfigError() {
  return json({
    error: 'R2 public media domain is not configured.',
    code: 'MWS_R2_PUBLIC_BASE_URL_REQUIRED',
    build: BUILD_VERSION,
  }, 503, { 'x-mws-media-mode': 'r2-public-required' });
}

function mediaSignature(base) {
  try {
    const u = new URL(base);
    return `${u.hostname}${u.pathname}`.replace(/[^A-Za-z0-9]/g, '').slice(-40) || 'media';
  } catch (_) {
    return 'media';
  }
}

function makeEtag(rows, base) {
  const sig = rows.map((row) => `${row.part}:${Number(row.version) || 0}`).join('|') || 'empty';
  const clean = sig.replace(/[^A-Za-z0-9:_|.-]/g, '');
  return `"cf57-${mediaSignature(base)}-${clean}"`;
}

function directMediaUrl(value, base) {
  if (typeof value !== 'string' || !value || !base) return value;
  let u;
  try { u = new URL(value, 'https://mws.invalid'); } catch (_) { return value; }
  const match = /^\/media\/(contact|workspace)\/([^/?#]+)$/.exec(u.pathname);
  if (!match) return value;
  let key = match[2];
  try { key = decodeURIComponent(key); } catch (_) {}
  const folder = match[1] === 'contact' ? 'contacts' : 'workspace';
  const q = new URLSearchParams();
  const version = u.searchParams.get('v');
  if (version) q.set('v', version);
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return `${base}/${folder}/${encodeURIComponent(key)}${suffix}`;
}

function rewriteMediaUrls(value, base) {
  if (Array.isArray(value)) return value.map((item) => rewriteMediaUrls(item, base));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = rewriteMediaUrls(item, base);
    return out;
  }
  return directMediaUrl(value, base);
}

async function rewriteJsonResponse(response, base) {
  if (!response || !response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) return response;
  let body;
  try { body = await response.clone().json(); } catch (_) { return response; }
  const rewritten = rewriteMediaUrls(body, base);
  const text = JSON.stringify(rewritten);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('content-length', String(new TextEncoder().encode(text).byteLength));
  headers.set('x-mws-media-mode', 'r2-public-direct');
  return new Response(text, { status: response.status, headers });
}

async function handleBootstrap(request, env, ctx, base) {
  const probeUrl = new URL(request.url);
  probeUrl.pathname = '/api/manifest';
  probeUrl.search = '';
  const probe = await baseWorker.fetch(new Request(probeUrl.toString(), { method: 'GET' }), env, ctx);
  if (!probe.ok) return probe;

  const { results = [] } = await env.DB.prepare(
    "SELECT part, version, data FROM workspace_parts WHERE scope='public' ORDER BY part"
  ).all();

  const versions = {};
  const parts = {};
  for (const row of results) {
    let data = null;
    try { data = JSON.parse(row.data); } catch (_) { data = null; }
    const version = Number(row.version) || 1;
    versions[row.part] = version;
    parts[row.part] = { part: row.part, version, data: rewriteMediaUrls(data, base) };
  }

  const etag = makeEtag(results, base);
  if ((request.headers.get('if-none-match') || '').trim() === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        etag,
        'cache-control': 'no-cache',
        'x-mws-backend': 'cf-v5.7-bundle',
        'x-mws-media-mode': 'r2-public-direct',
      },
    });
  }

  return json({
    backend: 'cloudflare-d1-r2',
    mode: 'cf-v5.7-bundle',
    build: BUILD_VERSION,
    mediaMode: 'r2-public-direct',
    mediaBaseUrl: base,
    cacheSchemaVersion: CACHE_SCHEMA_VERSION,
    globalVersion: etag.slice(1, -1),
    manifest: {
      parts: versions,
      scope: 'public',
      cacheSchemaVersion: CACHE_SCHEMA_VERSION,
      backend: 'cloudflare-d1',
    },
    parts,
  }, 200, {
    etag,
    'x-mws-backend': 'cf-v5.7-bundle',
    'x-mws-media-mode': 'r2-public-direct',
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const base = mediaBase(env);

    if (path.startsWith('/media/')) {
      return json({
        error: 'Legacy Worker media route is disabled in CF V5.7.',
        code: 'MWS_LEGACY_MEDIA_DISABLED',
      }, 410, { 'cache-control': 'no-store' });
    }

    if (path === '/api/health' && request.method === 'GET') {
      const response = await baseWorker.fetch(request, env, ctx);
      if (!response.ok) return response;
      let body = {};
      try { body = await response.json(); } catch (_) {}
      return json({
        ...body,
        build: BUILD_VERSION,
        mediaMode: base ? 'r2-public-direct' : 'unconfigured',
        mediaBaseConfigured: Boolean(base),
      });
    }

    if (path.startsWith('/api/') && !base) return mediaConfigError();

    if (request.method === 'GET' && path === '/api/bootstrap') {
      try {
        return await handleBootstrap(request, env, ctx, base);
      } catch (error) {
        console.error('CF V5.7 bootstrap error', error);
        return json({ error: error instanceof Error ? error.message : String(error) }, 500);
      }
    }

    const response = await baseWorker.fetch(request, env, ctx);
    if ((request.method === 'GET' && path.startsWith('/api/parts/')) ||
        (request.method === 'POST' && path === '/api/save')) {
      return rewriteJsonResponse(response, base);
    }
    return response;
  },
};
