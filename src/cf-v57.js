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

function internalMediaUrl(value, base) {
  if (typeof value !== 'string' || !value || !base) return value;
  let u, b;
  try { u = new URL(value); b = new URL(base); } catch (_) { return value; }
  if (u.origin !== b.origin) return value;
  const prefix = b.pathname.replace(/\/$/, '');
  let rest = u.pathname;
  if (prefix && prefix !== '/') {
    if (!rest.startsWith(`${prefix}/`)) return value;
    rest = rest.slice(prefix.length);
  }
  const match = /^\/(contacts|workspace)\/([^/?#]+)$/.exec(rest);
  if (!match) return value;
  let key = match[2];
  try { key = decodeURIComponent(key); } catch (_) {}
  const kind = match[1] === 'contacts' ? 'contact' : 'workspace';
  const q = new URLSearchParams();
  const version = u.searchParams.get('v');
  if (version) q.set('v', version);
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return `/media/${kind}/${encodeURIComponent(key)}${suffix}`;
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

function rewriteDirectUrlsToInternal(value, base) {
  if (Array.isArray(value)) return value.map((item) => rewriteDirectUrlsToInternal(item, base));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = rewriteDirectUrlsToInternal(item, base);
    return out;
  }
  return internalMediaUrl(value, base);
}

function parseDataImageV117(value) {
  if (typeof value !== 'string') return null;
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(value);
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { contentType: match[1] || 'application/octet-stream', bytes };
}

async function shortHashV117(value) {
  const bytes = new TextEncoder().encode(String(value));
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...hash].slice(0, 16).map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function storeEmoticonV117(env, seed, dataUrl) {
  const parsed = parseDataImageV117(dataUrl);
  if (!parsed) return dataUrl;
  const key = `emoticon-${await shortHashV117(seed)}`;
  const row = await env.DB.prepare('SELECT version FROM image_sources WHERE kind=? AND item_key=?').bind('workspace', key).first();
  const version = Math.max(1, Number(row?.version) || 0) + 1;
  await env.IMAGES.put(`workspace/${key}`, parsed.bytes, {
    httpMetadata: { contentType: parsed.contentType },
    customMetadata: { mwsVersion: String(version), source: 'mws-emoticon-upload' },
  });
  await env.DB.prepare(`INSERT INTO image_sources(kind,item_key,source_url,version,content_type,updated_at)
    VALUES('workspace',?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(kind,item_key) DO UPDATE SET source_url=NULL,version=excluded.version,content_type=excluded.content_type,updated_at=CURRENT_TIMESTAMP`)
    .bind(key, null, version, parsed.contentType).run();
  return `/media/workspace/${encodeURIComponent(key)}?v=${version}`;
}

async function externalizeEmoticonsV117(env, body) {
  const list = body?.parts?.contactMeta?.emoticons;
  if (!Array.isArray(list)) return;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || typeof item !== 'object') continue;
    if (parseDataImageV117(item.src)) {
      const seed = String(item.id || item.name || `item-${i + 1}`);
      item.src = await storeEmoticonV117(env, seed, item.src);
    }
  }
}

async function normalizedSaveRequest(request, env, base) {
  let body;
  try { body = await request.clone().json(); } catch (_) { return request; }
  await externalizeEmoticonsV117(env, body);
  const rewritten = rewriteDirectUrlsToInternal(body, base);
  const headers = new Headers(request.headers);
  headers.set('content-type', 'application/json');
  return new Request(request.url, {
    method: request.method,
    headers,
    body: JSON.stringify(rewritten),
  });
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

    const forwarded = request.method === 'POST' && path === '/api/save'
      ? await normalizedSaveRequest(request, env, base)
      : request;
    const response = await baseWorker.fetch(forwarded, env, ctx);
    if ((request.method === 'GET' && path.startsWith('/api/parts/')) ||
        (request.method === 'POST' && path === '/api/save')) {
      return rewriteJsonResponse(response, base);
    }
    return response;
  },
};
