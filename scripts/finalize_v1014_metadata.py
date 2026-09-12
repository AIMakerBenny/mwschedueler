from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='<div id="mwsBuildVersion" class="sidebar-build-version-v53" aria-label="현재 버전">TEST V5.4</div>'
new='<div id="mwsBuildVersion" class="sidebar-build-version-v53" aria-label="현재 버전">CF MWS V 1.0.14</div>'
if s.count(old)!=1: raise SystemExit(f'version label match: {s.count(old)}')
p.write_text(s.replace(old,new,1),encoding='utf-8')
Path('README.md').write_text('''# MAWANG Scheduler

MAWANG Scheduler web app.

- Production branch: `cloudflare-production`
- Production is served through Cloudflare Workers and Static Assets
- `index.html` is the production frontend entry point
- Worker entry: `src/cf-v571.js`
- Current release: CF MWS V1.0.14
- Admin changes use the online shared workspace
- Public mode uses the same app features in a non-persistent session sandbox
- Theme, background, global text scale, per-page text scale, resolution and other presentation preferences are device-local

V1.0.14 updates Content Planner interaction, participant scaling, independent brush and eraser sizes, image drag and drop, and custom emoticon management.
''',encoding='utf-8')
