import cf57 from './cf-v57.js';

const BUILD_VERSION = 'Mawang Scheduler v1.0';
const SOOP_LIVE_APIS = [
  'https://live.afreecatv.com/afreeca/player_live_api.php',
  'https://live.sooplive.com/afreeca/player_live_api.php',
  'https://live.sooplive.co.kr/afreeca/player_live_api.php',
];
const SOOP_ALLOWED_HOST_SUFFIXES = ['sooplive.com', 'sooplive.co.kr', 'afreecatv.com'];
const SOOP_API_TIMEOUT_MS = 5000;
const SOOP_WS_TIMEOUT_MS = 8000;
const SOOP_JOIN_TIMEOUT_MS = 6000;
const SOOP_INFO_CACHE_TTL_MS = 30000;
const SOOP_INFO_CACHE = new Map();

function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

function cleanError(error) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function validateSoopIdentity(streamerId, broadNo) {
  const id = String(streamerId || '').trim();
  const bno = String(broadNo || '').trim();
  if (!/^[A-Za-z0-9_]{1,64}$/.test(id)) throw new Error('Invalid SOOP streamerId.');
  if (!/^\d{1,20}$/.test(bno)) throw new Error('Invalid SOOP broadNo.');
  return { streamerId: id, broadNo: bno };
}

function soopCacheKey(identity) {
  return `${identity.streamerId}:${identity.broadNo}`;
}

function readCachedSoopInfo(identity) {
  const key = soopCacheKey(identity);
  const cached = SOOP_INFO_CACHE.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    SOOP_INFO_CACHE.delete(key);
    return null;
  }
  return cached.info;
}

function writeCachedSoopInfo(identity, info) {
  const now = Date.now();
  if (SOOP_INFO_CACHE.size > 100) {
    for (const [key, value] of SOOP_INFO_CACHE) {
      if (!value || value.expiresAt <= now) SOOP_INFO_CACHE.delete(key);
    }
    if (SOOP_INFO_CACHE.size > 100) SOOP_INFO_CACHE.delete(SOOP_INFO_CACHE.keys().next().value);
  }
  SOOP_INFO_CACHE.set(soopCacheKey(identity), {
    info,
    expiresAt: now + SOOP_INFO_CACHE_TTL_MS,
  });
}

function isAllowedSoopHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/\.$/, '');
  if (!host || host.includes('/') || host.includes(':')) return false;
  return SOOP_ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function validSoopPort(value) {
  const text = String(value ?? '').trim();
  if (!/^\d{1,5}$/.test(text)) return null;
  const port = Number(text);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return port;
}

async function fetchSoopChannel(apiUrl, identity, encodedBody) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), SOOP_API_TIMEOUT_MS);
  try {
    const requestUrl = `${apiUrl}?bjid=${encodeURIComponent(identity.streamerId)}`;
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://play.sooplive.com',
        'referer': `https://play.sooplive.com/${encodeURIComponent(identity.streamerId)}/${identity.broadNo}`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36',
        'accept': 'application/json, text/plain, */*',
      },
      body: encodedBody,
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json().catch(() => null);
    const channel = payload?.CHANNEL;
    if (!channel || typeof channel !== 'object') throw new Error('invalid response');
    return channel;
  } finally {
    clearTimeout(timer);
  }
}

function parseSoopChannel(channel, identity) {
  const result = Number(channel.RESULT);
  if (Number.isFinite(result) && result !== 1) throw new Error(`broadcast unavailable (RESULT ${result})`);

  const domain = String(channel.CHDOMAIN || '').trim().toLowerCase();
  const chatNo = String(channel.CHATNO || '').trim();
  const rawPort = validSoopPort(channel.CHPT);
  const port = rawPort && rawPort < 65535 ? rawPort + 1 : null;

  if (!isAllowedSoopHost(domain)) throw new Error('untrusted chat hostname');
  if (!/^\d{1,30}$/.test(chatNo)) throw new Error('invalid CHATNO');
  if (!port) throw new Error('invalid CHPT');

  return {
    streamerId: identity.streamerId,
    broadNo: identity.broadNo,
    domain,
    chatNo,
    port,
  };
}

async function resolveSoopChatInfo(streamerId, broadNo) {
  const identity = validateSoopIdentity(streamerId, broadNo);
  const cached = readCachedSoopInfo(identity);
  if (cached) return cached;

  const body = new URLSearchParams({
    bid: identity.streamerId,
    bno: identity.broadNo,
    type: 'live',
    confirm_adult: 'false',
    player_type: 'html5',
    stream_type: 'common',
    from_api: '0',
    mode: 'landing',
    pwd: '',
    quality: 'HD',
  }).toString();

  const attempts = SOOP_LIVE_APIS.map(async (apiUrl) => {
    try {
      const channel = await fetchSoopChannel(apiUrl, identity, body);
      return parseSoopChannel(channel, identity);
    } catch (error) {
      const suffix = error?.name === 'AbortError' ? 'timeout' : cleanError(error);
      throw new Error(`${new URL(apiUrl).hostname}: ${suffix}`);
    }
  });

  try {
    const info = await Promise.any(attempts);
    writeCachedSoopInfo(identity, info);
    return info;
  } catch (error) {
    const messages = Array.isArray(error?.errors) ? error.errors.map(cleanError).join(' | ') : cleanError(error);
    throw new Error(`SOOP chat info lookup failed: ${messages}`);
  }
}

async function handleSoopChatInfo(request) {
  let body;
  try { body = await request.json(); } catch (_) { body = null; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'JSON body required.' }, 400);

  try {
    const info = await resolveSoopChatInfo(body.streamerId, body.broadNo);
    return json({
      ok: true,
      streamerId: info.streamerId,
      broadNo: info.broadNo,
      chatNo: info.chatNo,
    });
  } catch (error) {
    return json({ error: cleanError(error) }, 502);
  }
}

function safeClose(socket, code = 1000, reason = '') {
  try {
    if (!socket || socket.readyState === 3) return;
    const safeCode = Number.isInteger(code) && code >= 1000 && code <= 4999 && ![1004, 1005, 1006, 1015].includes(code) ? code : 1000;
    socket.close(safeCode, String(reason || '').slice(0, 120));
  } catch (_) {}
}

function decodeSoopCommand(data) {
  try {
    let text = '';
    if (typeof data === 'string') text = data;
    else if (data instanceof ArrayBuffer) text = new TextDecoder().decode(data);
    else if (ArrayBuffer.isView(data)) text = new TextDecoder().decode(data.buffer);
    else return '';
    const match = text.match(/^\x1b\t(\d{4})/);
    return match ? match[1] : '';
  } catch (_) {
    return '';
  }
}

async function handleSoopWebSocket(request) {
  if ((request.headers.get('upgrade') || '').toLowerCase() !== 'websocket') {
    return json({ error: 'WebSocket upgrade required.' }, 426, { upgrade: 'websocket' });
  }

  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';
  let info;
  try {
    info = await resolveSoopChatInfo(url.searchParams.get('streamerId'), url.searchParams.get('broadNo'));
  } catch (error) {
    return json({ error: cleanError(error) }, 502);
  }

  const upstreamUrl = `https://${info.domain}:${info.port}/Websocket/${encodeURIComponent(info.streamerId)}`;
  let upstreamResponse;
  const wsController = new AbortController();
  const wsTimer = setTimeout(() => wsController.abort('timeout'), SOOP_WS_TIMEOUT_MS);
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Origin': 'https://play.sooplive.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36',
        'Sec-WebSocket-Protocol': 'chat',
      },
      signal: wsController.signal,
    });
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'timeout' : cleanError(error);
    return json({ error: `SOOP WebSocket connection failed: ${reason}` }, 502);
  } finally {
    clearTimeout(wsTimer);
  }

  const upstream = upstreamResponse.webSocket;
  if (!upstream || upstreamResponse.status !== 101) {
    try { upstream?.close?.(); } catch (_) {}
    return json({ error: `SOOP WebSocket upgrade failed. HTTP ${upstreamResponse.status}` }, 502);
  }

  const pair = new WebSocketPair();
  const client = pair[0];
  const server = pair[1];
  server.accept({ allowHalfOpen: true });
  upstream.accept({ allowHalfOpen: true });

  const debugSend = (stage, detail = '') => {
    if (!debug || server.readyState !== 1) return;
    try { server.send(JSON.stringify({ type: 'majoku-soop-debug', stage, detail, at: Date.now() })); } catch (_) {}
  };

  const F = '\x0c';
  const ESC = '\x1b\t';
  const connectPacket = `${ESC}000100000600${F}${F}${F}16${F}`;
  const joinByteSize = new TextEncoder().encode(info.chatNo).length + 6;
  const joinPacket = `${ESC}0002${String(joinByteSize).padStart(6,'0')}00${F}${info.chatNo}${F}${F}${F}${F}${F}`;
  const pingPacket = `${ESC}000000000100${F}`;

  let joined = false;
  let pingId = null;
  let joinTimeoutId = null;
  let debugPacketCount = 0;

  const clearProtocolTimers = () => {
    if (joinTimeoutId) clearTimeout(joinTimeoutId);
    if (pingId) clearInterval(pingId);
    joinTimeoutId = null;
    pingId = null;
  };

  try {
    upstream.send(connectPacket);
    debugSend('CONNECT_SENT');
    upstream.send(joinPacket);
    debugSend('JOIN_SENT');
  } catch (_) {
    debugSend('HANDSHAKE_SEND_FAILED');
    safeClose(server, 1011, 'SOOP handshake failed');
  }

  joinTimeoutId = setTimeout(() => {
    if (joined) return;
    debugSend('JOIN_TIMEOUT');
    safeClose(upstream, 1011, 'SOOP join timeout');
    safeClose(server, 1011, 'SOOP join timeout');
  }, SOOP_JOIN_TIMEOUT_MS);

  pingId = setInterval(() => {
    try { if (upstream.readyState === 1) upstream.send(pingPacket); } catch (_) {}
  }, 60000);

  server.addEventListener('message', (event) => {
    const command = decodeSoopCommand(event.data);
    if (command === '0000' || command === '0001' || command === '0002') return;
    try { if (upstream.readyState === 1) upstream.send(event.data); } catch (_) { safeClose(server, 1011, 'upstream send failed'); }
  });

  upstream.addEventListener('message', (event) => {
    const command = decodeSoopCommand(event.data);
    if (command === '0002' && !joined) {
      joined = true;
      if (joinTimeoutId) clearTimeout(joinTimeoutId);
      joinTimeoutId = null;
      debugSend('JOIN_ACK');
    }
    if (debug && debugPacketCount < 30) {
      debugPacketCount += 1;
      debugSend('UPSTREAM_PACKET', command || 'UNKNOWN');
    }
    if (command === '0005') debugSend('CHAT_PACKET');
    try { if (server.readyState === 1) server.send(event.data); } catch (_) { safeClose(upstream, 1011, 'client send failed'); }
  });

  server.addEventListener('close', (event) => {
    clearProtocolTimers();
    safeClose(upstream, event.code, event.reason);
  });
  upstream.addEventListener('close', (event) => {
    debugSend('UPSTREAM_CLOSE', `${event.code || ''}:${event.reason || ''}`);
    clearProtocolTimers();
    safeClose(server, event.code, event.reason);
  });
  server.addEventListener('error', () => {
    clearProtocolTimers();
    safeClose(upstream, 1011, 'client websocket error');
  });
  upstream.addEventListener('error', () => {
    debugSend('UPSTREAM_ERROR');
    clearProtocolTimers();
    safeClose(server, 1011, 'upstream websocket error');
  });

  return new Response(null, { status: 101, webSocket: client });
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
  if (path === '/api/bootstrap') body.mode = 'mawang-scheduler-v1.0';

  const text = JSON.stringify(body);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('content-length', String(new TextEncoder().encode(text).byteLength));
  headers.set('x-mws-build', BUILD_VERSION);
  return new Response(text, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;

    if (path === '/api/soop/chat-info' && request.method === 'POST') {
      return handleSoopChatInfo(request);
    }
    if (path === '/api/soop/ws' && request.method === 'GET') {
      return handleSoopWebSocket(request);
    }

    const response = await cf57.fetch(request, env, ctx);
    return withBuildVersion(response, request);
  },
};