from pathlib import Path
import json


def replace_once(path, old, new):
    p = Path(path)
    s = p.read_text(encoding='utf-8')
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{path}: expected one match, found {n}: {old[:100]!r}')
    p.write_text(s.replace(old, new, 1), encoding='utf-8')

# Canvas export/save fix.
p = Path('content-planner.html')
s = p.read_text(encoding='utf-8')
s = s.replace('<title>MAWANG Content Planner V1.0.17</title>', '<title>MAWANG Content Planner · Mawang Scheduler v1.0</title>')
old = "function loadRasterImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}"
new = """function canvasSafeImageSrcV10(src){const raw=String(src||'');try{const u=new URL(raw,location.href),m=/^\\/(contacts|workspace)\\/([^/?#]+)$/.exec(u.pathname);if(/\\.r2\\.dev$/i.test(u.hostname)&&m){const kind=m[1]==='contacts'?'contact':'workspace';return `/media/${kind}/${m[2]}${u.search||''}`}}catch(_){}return raw}
function loadRasterImage(src){return new Promise((resolve,reject)=>{const im=new Image(),raw=canvasSafeImageSrcV10(src);try{const u=new URL(raw,location.href);if(u.origin!==location.origin&&!/^data:|^blob:/i.test(raw))im.crossOrigin='anonymous'}catch(_){}im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('이미지를 안전하게 불러오지 못했습니다.'));im.src=raw})}
function safeCanvasPreviewDataUrlV10(canvas){try{return canvas.toDataURL('image/png',.88)}catch(err){console.warn('Canvas preview export skipped so the plan can still be saved',err);return ''}}"""
if s.count(old) != 1:
    raise SystemExit(f'content-planner loadRasterImage target count={s.count(old)}')
s = s.replace(old, new, 1)
old = "const canvas=await renderBoardToCanvas(),preview=canvas.toDataURL('image/png',.88),existingId=state.activeProposalId||''"
new = "const canvas=await renderBoardToCanvas(),preview=safeCanvasPreviewDataUrlV10(canvas),existingId=state.activeProposalId||''"
if s.count(old) != 1:
    raise SystemExit(f'content-planner preview target count={s.count(old)}')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# Same-origin read-only R2 media endpoint for Canvas rasterization.
p = Path('src/cf-v57.js')
s = p.read_text(encoding='utf-8')
s = s.replace("const BUILD_VERSION = 'CF V5.7';", "const BUILD_VERSION = 'Mawang Scheduler v1.0';")
anchor = "function mediaSignature(base) {\n"
helper = """async function handleManagedMediaV10(env, kind, key) {
  if (!['contact', 'workspace'].includes(kind) || !/^[A-Za-z0-9_-]{1,160}$/.test(key)) return new Response('Invalid media key', { status: 400 });
  const folder = kind === 'contact' ? 'contacts' : 'workspace';
  const object = await env.IMAGES.get(`${folder}/${key}`);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  if (object.writeHttpMetadata) object.writeHttpMetadata(headers);
  if (!headers.has('content-type')) headers.set('content-type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('access-control-allow-origin', '*');
  if (object.httpEtag) headers.set('etag', object.httpEtag);
  return new Response(object.body, { status: 200, headers });
}

"""
if anchor not in s:
    raise SystemExit('cf-v57 media anchor missing')
s = s.replace(anchor, helper + anchor, 1)
old_route = """    if (path.startsWith('/media/')) {
      return json({
        error: 'Legacy Worker media route is disabled in CF V5.7.',
        code: 'MWS_LEGACY_MEDIA_DISABLED',
      }, 410, { 'cache-control': 'no-store' });
    }
"""
new_route = """    if (request.method === 'GET' && path.startsWith('/media/')) {
      const match = /^\\/media\\/(contact|workspace)\\/([^/?#]+)$/.exec(path);
      if (!match) return new Response('Invalid media path', { status: 400 });
      let key = match[2];
      try { key = decodeURIComponent(key); } catch (_) {}
      return handleManagedMediaV10(env, match[1], key);
    }
"""
if s.count(old_route) != 1:
    raise SystemExit(f'cf-v57 media route target count={s.count(old_route)}')
s = s.replace(old_route, new_route, 1)
s = s.replace('cf-v5.7-bundle', 'mawang-scheduler-v1.0')
s = s.replace('CF V5.7 bootstrap error', 'Mawang Scheduler v1.0 bootstrap error')
p.write_text(s, encoding='utf-8')

# One release identity.
p = Path('src/cf-v571.js')
s = p.read_text(encoding='utf-8')
s = s.replace("const BUILD_VERSION = 'CF MWS V 1.0.17';", "const BUILD_VERSION = 'Mawang Scheduler v1.0';")
s = s.replace("body.mode = 'cf-mws-v1.0.17';", "body.mode = 'mawang-scheduler-v1.0';")
p.write_text(s, encoding='utf-8')

p = Path('assets/content-planner-host.js')
s = p.read_text(encoding='utf-8')
s = s.replace('/* CF MWS V 1.0.17 - consolidated Content Planner host + single tools bundle */', '/* Mawang Scheduler v1.0 - Content Planner host */')
s = s.replace("const BUILD='CF MWS V 1.0.17';", "const BUILD='Mawang Scheduler v1.0';")
s = s.replace("const FRAME_URL='/content-planner.html?v=1.0.17';", "const FRAME_URL='/content-planner.html?v=1.0';")
s = s.replace("const TOOLS_URL='/assets/tools.js?v=1.0.17';", "const TOOLS_URL='/assets/tools.js?v=1.0';")
p.write_text(s, encoding='utf-8')

p = Path('index.html')
s = p.read_text(encoding='utf-8')
s = s.replace('data-build-version="CF MWS V 1.0.17"', 'data-build-version="Mawang Scheduler v1.0"')
s = s.replace('CF MWS V 1.0.17', 'Mawang Scheduler v1.0')
s = s.replace('?v=1.0.17', '?v=1.0')
p.write_text(s, encoding='utf-8')

p = Path('assets/tools.js')
s = p.read_text(encoding='utf-8')
s = s.replace('CF MWS V 1.0.17', 'Mawang Scheduler v1.0').replace('V1.0.17', 'v1.0').replace('v=1.0.17', 'v=1.0')
p.write_text(s, encoding='utf-8')

p = Path('assets/cloud-v5.5.js')
s = p.read_text(encoding='utf-8')
s = s.replace('/* MAWANG Scheduler TEST V5.5 - Cloudflare D1/R2 incremental backend */', '/* Mawang Scheduler v1.0 - Cloudflare D1/R2 data layer */', 1)
p.write_text(s, encoding='utf-8')

pkg = Path('package.json')
obj = json.loads(pkg.read_text(encoding='utf-8'))
obj['version'] = '1.0.0'
pkg.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

runtime = ['index.html', 'content-planner.html', 'assets/content-planner-host.js', 'assets/tools.js', 'src/cf-v571.js', 'src/cf-v57.js', 'assets/cloud-v5.5.js']
joined = '\n'.join(Path(x).read_text(encoding='utf-8') for x in runtime)
assert 'CF MWS V 1.0.17' not in joined
assert 'v=1.0.17' not in joined
assert 'Mawang Scheduler v1.0' in joined
planner = Path('content-planner.html').read_text(encoding='utf-8')
assert 'canvasSafeImageSrcV10' in planner
assert 'safeCanvasPreviewDataUrlV10' in planner
assert "preview=safeCanvasPreviewDataUrlV10(canvas)" in planner
worker = Path('src/cf-v57.js').read_text(encoding='utf-8')
assert 'handleManagedMediaV10' in worker
assert 'MWS_LEGACY_MEDIA_DISABLED' not in worker
print('Mawang Scheduler v1.0 patch assertions passed')
