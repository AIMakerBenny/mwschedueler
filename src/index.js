const SUPABASE_URL = 'https://nysxcqlewzucbpoaymbg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_H7VPUOVV6nN7QdaJKO3-lA_-SNrg4mW';
const CACHE_SCHEMA_VERSION = 3;
const PARTS = ['core','contacts','contactMeta','events','posts','miniGames','activity','clipboard','notebook'];
const CORE_KEYS = ['version','categories','dashboardNoticeUrl','selfContactId','timezones'];

let schemaPromise;

const json = (value, status = 200, extra = {}) => new Response(JSON.stringify(value), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...extra,
  },
});

function cleanError(error) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function supabaseHeaders(token = SUPABASE_KEY) {
  return {
    apikey: SUPABASE_KEY,
    authorization: `Bearer ${token}`,
  };
}

async function ensureSchema(env) {
  if (!schemaPromise) {
    schemaPromise = env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS workspace_parts (
        scope TEXT NOT NULL,
        part TEXT NOT NULL,
        data TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (scope, part)
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS image_sources (
        kind TEXT NOT NULL,
        item_key TEXT NOT NULL,
        source_url TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        content_type TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (kind, item_key)
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_workspace_parts_scope ON workspace_parts(scope)'),
    ]).catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
}

function managedImageInfo(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const u = new URL(value, 'https://local.invalid');
    if (u.hostname === 'nysxcqlewzucbpoaymbg.supabase.co' && u.pathname.endsWith('/functions/v1/contact-image')) {
      const key = (u.searchParams.get('id') || '').trim();
      if (key) return { kind: 'contact', key, version: Number(u.searchParams.get('v')) || 1, sourceUrl: value };
    }
    if (u.hostname === 'nysxcqlewzucbpoaymbg.supabase.co' && u.pathname.endsWith('/functions/v1/workspace-image')) {
      const key = (u.searchParams.get('key') || '').trim();
      if (key) return { kind: 'workspace', key, version: Number(u.searchParams.get('v')) || 1, sourceUrl: value };
    }
  } catch (_) {}
  return null;
}

function mediaUrl(kind, key, version = 1) {
  return `/media/${kind}/${encodeURIComponent(key)}?v=${Math.max(1, Number(version) || 1)}`;
}

function rewriteManagedUrls(value, mappings) {
  if (Array.isArray(value)) return value.map((item) => rewriteManagedUrls(item, mappings));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = rewriteManagedUrls(item, mappings);
    return out;
  }
  const info = managedImageInfo(value);
  if (!info) return value;
  mappings.set(`${info.kind}:${info.key}`, info);
  return mediaUrl(info.kind, info.key, info.version);
}

async function saveMappings(env, mappings) {
  if (!mappings.size) return;
  const stmts = [];
  for (const item of mappings.values()) {
    stmts.push(env.DB.prepare(`INSERT INTO image_sources(kind,item_key,source_url,version,updated_at)
      VALUES(?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(kind,item_key) DO UPDATE SET
        source_url=COALESCE(excluded.source_url,image_sources.source_url),
        version=MAX(image_sources.version,excluded.version),
        updated_at=CURRENT_TIMESTAMP`)
      .bind(item.kind, item.key, item.sourceUrl || null, Math.max(1, Number(item.version) || 1)));
  }
  await env.DB.batch(stmts);
}

async function bootstrapFromSupabase(env, force = false) {
  await ensureSchema(env);
  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM workspace_parts').first();
  if (!force && Number(count?.n || 0) > 0) return { bootstrapped: false, existing: true };

  const endpoint = `${SUPABASE_URL}/rest/v1/workspace_parts?scope=eq.public&select=part,version,data&order=part.asc`;
  const response = await fetch(endpoint, { headers: supabaseHeaders() });
  if (!response.ok) throw new Error(`Supabase bootstrap failed: HTTP ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('Supabase public workspace data is empty.');

  if (force) await env.DB.batch([
    env.DB.prepare('DELETE FROM workspace_parts'),
    env.DB.prepare('DELETE FROM image_sources'),
  ]);

  const mappings = new Map();
  const stmts = [];
  for (const row of rows) {
    if (!PARTS.includes(row.part)) continue;
    const rewritten = rewriteManagedUrls(row.data, mappings);
    const dataText = JSON.stringify(rewritten ?? null);
    const version = Math.max(1, Number(row.version) || 1);
    for (const scope of ['public', 'admin']) {
      stmts.push(env.DB.prepare(`INSERT INTO workspace_parts(scope,part,data,version,updated_at)
        VALUES(?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(scope,part) DO UPDATE SET data=excluded.data,version=excluded.version,updated_at=CURRENT_TIMESTAMP`)
        .bind(scope, row.part, dataText, version));
    }
  }
  if (stmts.length) await env.DB.batch(stmts);
  await saveMappings(env, mappings);
  await env.DB.prepare(`INSERT INTO app_meta(key,value,updated_at) VALUES('bootstrapped_at',?,CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`)
    .bind(new Date().toISOString()).run();
  return { bootstrapped: true, parts: Math.floor(stmts.length / 2), imageMappings: mappings.size };
}

async function ensureBootstrap(env) {
  await ensureSchema(env);
  const row = await env.DB.prepare('SELECT 1 AS ok FROM workspace_parts LIMIT 1').first();
  if (!row) await bootstrapFromSupabase(env, false);
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

function parseDataImage(value) {
  if (typeof value !== 'string') return null;
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(value);
  if (!match) return null;
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

function r2Key(kind, key) {
  return kind === 'contact' ? `contacts/${key}` : `workspace/${key}`;
}

async function currentImageVersion(env, kind, key) {
  const row = await env.DB.prepare('SELECT version FROM image_sources WHERE kind=? AND item_key=?').bind(kind, key).first();
  return Number(row?.version) || 0;
}

async function storeDataImage(env, kind, key, dataUrl, authoritative = true) {
  const parsed = parseDataImage(dataUrl);
  if (!parsed) return dataUrl;
  const existingVersion = await currentImageVersion(env, kind, key);
  if (!authoritative && existingVersion > 0) return mediaUrl(kind, key, existingVersion);
  const version = existingVersion > 0 ? existingVersion + 1 : 1;
  await env.IMAGES.put(r2Key(kind, key), parsed.bytes, {
    httpMetadata: { contentType: parsed.contentType },
    customMetadata: { mwsVersion: String(version), source: 'mws-upload' },
  });
  await env.DB.prepare(`INSERT INTO image_sources(kind,item_key,source_url,version,content_type,updated_at)
    VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(kind,item_key) DO UPDATE SET source_url=NULL,version=excluded.version,content_type=excluded.content_type,updated_at=CURRENT_TIMESTAMP`)
    .bind(kind, key, null, version, parsed.contentType).run();
  return mediaUrl(kind, key, version);
}

async function normalizeManagedString(env, value) {
  const info = managedImageInfo(value);
  if (!info) return value;
  const mappings = new Map([[`${info.kind}:${info.key}`, info]]);
  await saveMappings(env, mappings);
  return mediaUrl(info.kind, info.key, info.version);
}

async function externalizePart(env, part, raw) {
  if (part === 'core') {
    const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const out = {};
    for (const key of CORE_KEYS) if (Object.prototype.hasOwnProperty.call(src, key)) out[key] = src[key];
    return out;
  }

  if (part === 'contacts') {
    const list = Array.isArray(raw) ? raw : [];
    const out = [];
    for (const original of list) {
      const item = original && typeof original === 'object' ? structuredClone(original) : original;
      if (!item || typeof item !== 'object') { out.push(item); continue; }
      const id = String(item.id || '').trim();
      const image = item.image;
      if (id && parseDataImage(image)) item.image = await storeDataImage(env, 'contact', id, image, true);
      else if (id) item.image = await normalizeManagedString(env, image);
      out.push(item);
    }
    return out;
  }

  if (part === 'contactMeta') {
    const out = raw && typeof raw === 'object' && !Array.isArray(raw) ? structuredClone(raw) : {};
    const banners = out.contactTagBanners && typeof out.contactTagBanners === 'object' && !Array.isArray(out.contactTagBanners)
      ? out.contactTagBanners : {};
    for (const [bannerKey, value] of Object.entries(banners)) {
      if (parseDataImage(value)) {
        const key = `tag-${await shortHash(bannerKey)}`;
        banners[bannerKey] = await storeDataImage(env, 'workspace', key, value, true);
      } else banners[bannerKey] = await normalizeManagedString(env, value);
    }
    out.contactTagBanners = banners;
    return out;
  }

  if (part === 'miniGames') {
    const games = raw && typeof raw === 'object' && !Array.isArray(raw) ? structuredClone(raw) : {};
    for (const [gameKey, game] of Object.entries(games)) {
      if (!game || typeof game !== 'object' || !Array.isArray(game.players)) continue;
      for (let i = 0; i < game.players.length; i++) {
        const player = game.players[i];
        if (!player || typeof player !== 'object') continue;
        const image = player.image;
        const contactId = String(player.contactId || '').trim();
        if (parseDataImage(image)) {
          if (contactId) player.image = await storeDataImage(env, 'contact', contactId, image, false);
          else {
            const seed = `${gameKey}:${player.id || player.name || i + 1}`;
            const key = `mini-${await shortHash(seed)}`;
            player.image = await storeDataImage(env, 'workspace', key, image, true);
          }
        } else player.image = await normalizeManagedString(env, image);
      }
    }
    return games;
  }

  if (part === 'posts') {
    return (Array.isArray(raw) ? raw : []).map((post) => {
      const out = post && typeof post === 'object' ? structuredClone(post) : post;
      if (!out || typeof out !== 'object') return out;
      for (const key of ['sourceContent','sourcePhotos','sourceAuthor','sourceAuthorId','sourceRegDate','sourceViewCount','sourceUrl']) delete out[key];
      return out;
    });
  }

  if (part === 'events') return Array.isArray(raw) ? raw : [];
  if (part === 'activity') {
    const src = raw && typeof raw === 'object' ? raw : {};
    return {
      collaborations: Array.isArray(src.collaborations) ? src.collaborations : [],
      todayPeopleByDate: src.todayPeopleByDate && typeof src.todayPeopleByDate === 'object' ? src.todayPeopleByDate : {},
      todayPeopleManualByDate: src.todayPeopleManualByDate && typeof src.todayPeopleManualByDate === 'object' ? src.todayPeopleManualByDate : {},
      targetList: Array.isArray(src.targetList) ? src.targetList : [],
    };
  }
  if (part === 'notebook') {
    const src = raw && typeof raw === 'object' ? raw : {};
    return { memos: Array.isArray(src.memos) ? src.memos : [], favoriteFolders: Array.isArray(src.favoriteFolders) ? src.favoriteFolders : [] };
  }
  if (part === 'clipboard') {
    const src = raw && typeof raw === 'object' ? raw : {};
    return { scheduleClipboard: Array.isArray(src.scheduleClipboard) ? src.scheduleClipboard : [] };
  }
  return raw ?? null;
}

async function handleManifest(env) {
  await ensureBootstrap(env);
  const { results = [] } = await env.DB.prepare('SELECT part,version FROM workspace_parts WHERE scope=? ORDER BY part').bind('public').all();
  const parts = {};
  for (const row of results) parts[row.part] = Number(row.version) || 1;
  return json({ parts, scope: 'public', cacheSchemaVersion: CACHE_SCHEMA_VERSION, backend: 'cloudflare-d1' });
}

async function handlePart(env, part) {
  if (!PARTS.includes(part)) return json({ error: 'Invalid part' }, 400);
  await ensureBootstrap(env);
  const row = await env.DB.prepare('SELECT part,version,data FROM workspace_parts WHERE scope=? AND part=?').bind('public', part).first();
  if (!row) return json({ error: 'Part not found' }, 404);
  let data;
  try { data = JSON.parse(row.data); } catch (_) { return json({ error: 'Stored data is invalid' }, 500); }
  return json({ part: row.part, version: Number(row.version) || 1, data });
}

async function handleSave(request, env) {
  const user = await verifyAdmin(request);
  if (!user) return json({ error: 'Admin authorization required' }, 401);
  await ensureBootstrap(env);

  const body = await request.json().catch(() => null);
  if (!body?.parts || typeof body.parts !== 'object' || Array.isArray(body.parts)) return json({ error: 'parts must be an object' }, 400);
  const versions = {};
  const normalized = {};

  for (const [part, raw] of Object.entries(body.parts)) {
    if (!PARTS.includes(part)) return json({ error: `Invalid part: ${part}` }, 400);
    const value = await externalizePart(env, part, raw);
    const current = await env.DB.prepare('SELECT version FROM workspace_parts WHERE scope=? AND part=?').bind('public', part).first();
    const version = Math.max(1, Number(current?.version) || 0) + 1;
    const text = JSON.stringify(value ?? null);
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO workspace_parts(scope,part,data,version,updated_at) VALUES('public',?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(scope,part) DO UPDATE SET data=excluded.data,version=excluded.version,updated_at=CURRENT_TIMESTAMP`).bind(part, text, version),
      env.DB.prepare(`INSERT INTO workspace_parts(scope,part,data,version,updated_at) VALUES('admin',?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(scope,part) DO UPDATE SET data=excluded.data,version=excluded.version,updated_at=CURRENT_TIMESTAMP`).bind(part, text, version),
    ]);
    versions[part] = version;
    normalized[part] = value;
  }

  await env.DB.prepare(`INSERT INTO app_meta(key,value,updated_at) VALUES('last_saved_at',?,CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`).bind(new Date().toISOString()).run();
  return json({ versions, normalized, savedBy: user.id });
}

async function handleMedia(request, env, ctx, kind, key) {
  if (!['contact', 'workspace'].includes(kind) || !/^[A-Za-z0-9_-]{1,160}$/.test(key)) return new Response('Invalid media key', { status: 400 });
  await ensureBootstrap(env);
  const objectKey = r2Key(kind, key);
  let object = await env.IMAGES.get(objectKey);

  if (!object) {
    const source = await env.DB.prepare('SELECT source_url,version,content_type FROM image_sources WHERE kind=? AND item_key=?').bind(kind, key).first();
    if (!source?.source_url) return new Response('Not found', { status: 404 });
    const upstream = await fetch(source.source_url, { headers: { 'user-agent': 'MAWANG-Cloudflare-Migration/5.5' } });
    if (!upstream.ok) return new Response('Image migration source unavailable', { status: 502 });
    const bytes = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || source.content_type || 'application/octet-stream';
    const version = Math.max(1, Number(source.version) || 1);
    await env.IMAGES.put(objectKey, bytes, {
      httpMetadata: { contentType },
      customMetadata: { mwsVersion: String(version), source: 'supabase-lazy-migration' },
    });
    object = await env.IMAGES.get(objectKey);
    if (!object) return new Response('Image migration failed', { status: 500 });
  }

  const requestedVersion = new URL(request.url).searchParams.get('v');
  const storedVersion = object.customMetadata?.mwsVersion;
  const immutable = Boolean(storedVersion && requestedVersion && storedVersion === requestedVersion);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('cache-control', immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=300, stale-while-revalidate=86400');
  return new Response(object.body, { headers });
}

async function handleHealth(env) {
  await ensureSchema(env);
  const parts = await env.DB.prepare('SELECT COUNT(*) AS n FROM workspace_parts').first();
  const images = await env.DB.prepare('SELECT COUNT(*) AS n FROM image_sources').first();
  const boot = await env.DB.prepare("SELECT value FROM app_meta WHERE key='bootstrapped_at'").first();
  return json({ ok: true, env: env.MWS_ENV || 'cloudflare', backend: 'D1 + R2', workspaceRows: Number(parts?.n || 0), imageMappings: Number(images?.n || 0), bootstrappedAt: boot?.value || null });
}

async function handleRebootstrap(request, env) {
  const user = await verifyAdmin(request);
  if (!user) return json({ error: 'Admin authorization required' }, 401);
  const result = await bootstrapFromSupabase(env, true);
  return json({ ok: true, ...result });
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === '/api/health' && request.method === 'GET') return handleHealth(env);
      if (path === '/api/manifest' && request.method === 'GET') return handleManifest(env);
      if (path.startsWith('/api/parts/') && request.method === 'GET') return handlePart(env, decodeURIComponent(path.slice('/api/parts/'.length)));
      if (path === '/api/save' && request.method === 'POST') return handleSave(request, env);
      if (path === '/api/rebootstrap' && request.method === 'POST') return handleRebootstrap(request, env);

      const media = path.match(/^\/media\/(contact|workspace)\/([^/]+)$/);
      if (media && request.method === 'GET') return handleMedia(request, env, ctx, media[1], decodeURIComponent(media[2]));

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error('MAWANG Cloudflare V5.5 Worker error', error);
      return json({ error: cleanError(error) }, 500);
    }
  },
};
