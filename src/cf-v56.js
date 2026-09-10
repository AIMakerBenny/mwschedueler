import baseWorker from './index.js';

const CACHE_SCHEMA_VERSION = 3;

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

function makeEtag(rows) {
  const sig = rows.map((row) => `${row.part}:${Number(row.version) || 0}`).join('|') || 'empty';
  return `"cf56-${sig.replace(/[^A-Za-z0-9:_|.-]/g, '')}"`;
}

async function handleBootstrap(request, env, ctx) {
  // Reuse the existing manifest route internally so schema creation and the
  // one-time Supabase -> D1 bootstrap stay in one place. This is an internal
  // function call, not a second browser/Worker request.
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
    parts[row.part] = { part: row.part, version, data };
  }

  const etag = makeEtag(results);
  if ((request.headers.get('if-none-match') || '').trim() === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        etag,
        'cache-control': 'no-cache',
        'x-mws-backend': 'cf-v5.6-bundle',
      },
    });
  }

  return json({
    backend: 'cloudflare-d1-r2',
    mode: 'cf-v5.6-bundle',
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
    'x-mws-backend': 'cf-v5.6-bundle',
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
      try {
        return await handleBootstrap(request, env, ctx);
      } catch (error) {
        console.error('CF V5.6 bootstrap error', error);
        return json({ error: error instanceof Error ? error.message : String(error) }, 500);
      }
    }
    return baseWorker.fetch(request, env, ctx);
  },
};
