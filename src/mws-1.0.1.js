import cf57 from './cf-v57.js';

const BUILD_VERSION = 'MWS Version 1.0.1';
const SUPABASE_URL = 'https://nysxcqlewzucbpoaymbg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_H7VPUOVV6nN7QdaJKO3-lA_-SNrg4mW';

const json = (value, status = 200, extra = {}) => new Response(JSON.stringify(value), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-mws-build': BUILD_VERSION,
    ...extra,
  },
});

function cleanError(error) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function supabaseHeaders(token = SUPABASE_KEY) {
  return { apikey: SUPABASE_KEY, authorization: `Bearer ${token}` };
}

async function verifyAdmin(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: supabaseHeaders(token) });
  if (!userRes.ok) return null;
  const user = await userRes.json();
  if (!user?.id) return null;

  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`, {
    headers: supabaseHeaders(token),
  });
  if (!profileRes.ok) return null;
  const rows = await profileRes.json();
  return Array.isArray(rows) && rows.length === 1 ? user : null;
}

async function ensurePlannerTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS workspace_parts (
    scope TEXT NOT NULL,
    part TEXT NOT NULL,
    data TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (scope, part)
  )`).run();
}

function parseDataBlob(value) {
  if (typeof value !== 'string') return null;
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(value);
  if (!match) return null;
  const type = String(match[1] || '').toLowerCase();
  if (!type.startsWith('image/') && !type.startsWith('video/')) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { contentType: match[1] || 'application/octet-stream', bytes };
}

async function shortHash(value) {
  const bytes = new TextEncoder().encode(String(value));
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...hash].slice(0, 16).map((x) => x.toString(16).padStart(2, '0')).join('');
}

function publicMediaBase(env) {
  return String(env.MWS_R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
}

async function storePlannerBlob(env, value, path) {
  const parsed = parseDataBlob(value);
  if (!parsed) return value;
  const fingerprint = `${path}:${value.length}:${value.slice(0, 256)}:${value.slice(-128)}`;
  const key = `planner-${await shortHash(fingerprint)}`;
  await env.IMAGES.put(`workspace/${key}`, parsed.bytes, {
    httpMetadata: { contentType: parsed.contentType },
    customMetadata: { source: 'mws-planner', build: BUILD_VERSION },
  });
  const base = publicMediaBase(env);
  if (!base) throw new Error('MWS_R2_PUBLIC_BASE_URL is not configured.');
  return `${base}/workspace/${encodeURIComponent(key)}?v=1`;
}

async function externalizePlannerMedia(env, value, path = 'root') {
  if (typeof value === 'string') return await storePlannerBlob(env, value, path);
  if (Array.isArray(value)) {
    const out = [];
    for (let i = 0; i < value.length; i++) out.push(await externalizePlannerMedia(env, value[i], `${path}[${i}]`));
    return out;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = await externalizePlannerMedia(env, item, `${path}.${key}`);
    return out;
  }
  return value;
}

async function handlePlannerGet(env) {
  await ensurePlannerTable(env);
  const row = await env.DB.prepare('SELECT data,version FROM workspace_parts WHERE scope=? AND part=?')
    .bind('public', 'planner').first();
  if (!row) return json({ version: 0, data: { draft: null, proposals: [] }, build: BUILD_VERSION });
  let data;
  try { data = JSON.parse(row.data); } catch (_) { return json({ error: 'Stored planner data is invalid.' }, 500); }
  return json({ version: Number(row.version) || 1, data, build: BUILD_VERSION });
}

async function handlePlannerSave(request, env) {
  const user = await verifyAdmin(request);
  if (!user) return json({ error: 'Admin authorization required.' }, 401);
  await ensurePlannerTable(env);

  let body;
  try { body = await request.json(); } catch (_) { return json({ error: 'Invalid JSON body.' }, 400); }
  const raw = body?.data;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return json({ error: 'Planner data is required.' }, 400);

  const normalized = await externalizePlannerMedia(env, raw, 'planner');
  const text = JSON.stringify(normalized);
  if (new TextEncoder().encode(text).byteLength > 8 * 1024 * 1024) {
    return json({ error: 'Planner data is too large after media externalization.' }, 413);
  }

  const current = await env.DB.prepare('SELECT MAX(version) AS version FROM workspace_parts WHERE part=?')
    .bind('planner').first();
  const version = Math.max(1, Number(current?.version) || 0) + 1;
  await env.DB.batch(['public', 'admin'].map((scope) => env.DB.prepare(`INSERT INTO workspace_parts(scope,part,data,version,updated_at)
    VALUES(?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(scope,part) DO UPDATE SET data=excluded.data,version=excluded.version,updated_at=CURRENT_TIMESTAMP`)
    .bind(scope, 'planner', text, version)));

  return json({ ok: true, version, data: normalized, build: BUILD_VERSION });
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
  if (path === '/api/bootstrap') body.mode = 'mws-1.0.1-bundle';

  const text = JSON.stringify(body);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('content-length', String(new TextEncoder().encode(text).byteLength));
  headers.set('x-mws-build', BUILD_VERSION);
  return new Response(text, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/api/planner') {
        if (request.method === 'GET') return await handlePlannerGet(env);
        if (request.method === 'POST') return await handlePlannerSave(request, env);
        return json({ error: 'Method not allowed.' }, 405, { allow: 'GET, POST' });
      }
      const response = await cf57.fetch(request, env, ctx);
      return await withBuildVersion(response, request);
    } catch (error) {
      console.error('MWS Version 1.0.1 worker error', error);
      return json({ error: cleanError(error), build: BUILD_VERSION }, 500);
    }
  },
};
