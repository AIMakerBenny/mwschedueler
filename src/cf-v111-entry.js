import authWorker from './cf-v112-authfix.js';

const STEAM_SCRIPT='<script src="/assets/steam-game-v111.js?v=1.1.3" data-mws-steam-v111="1"></script>';
const CALENDAR_DRAG_FIX='<link rel="stylesheet" href="/assets/calendar-drag-layout-fix.css?v=1.1.3" data-mws-calendar-drag-fix="1">';
const UI_FIX_SCRIPT='<script src="/assets/ui-fixes-v113.js?v=1.1.5" data-mws-ui-fixes-v113="1"></script>';
const MAJOKU_SIDEBAR_SCRIPT='<script src="/assets/majoku-sidebar-v113.js?v=1.1.5" data-mws-majoku-sidebar="1"></script>';
const BOSS_MANAGER_SCRIPT='<script src="/assets/boss-manager-v116.js?v=1.1.6" data-mws-boss-manager-v116="1"></script>';
const BOSS_RAID_SCRIPT='<script src="/assets/boss-raid-v116.js?v=1.1.6" data-mws-boss-raid-v116="1"></script>';

function htmlResponse(response,html,extraHeaders={}){
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  for(const [key,value] of Object.entries(extraHeaders))headers.set(key,value);
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
function appendBeforeBody(html,markup){return html.includes('</body>')?html.replace('</body>',`${markup}\n</body>`):`${html}\n${markup}`}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/assets/cloud-v5.5.js') {
      const replacement = new URL('/assets/cloud-v1.1-loader.js?v=1.1.6', request.url);
      return env.ASSETS.fetch(new Request(replacement.toString(), { method: 'GET', headers: request.headers }));
    }

    const response = await authWorker.fetch(request, env, ctx);
    if (request.method !== 'GET' || response.status !== 200) return response;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html')) return response;

    if (url.pathname === '/majoku-castle.html') {
      let html=await response.text();
      html=html.replace(/<script\s+src=["']\/assets\/majoku-sidebar-v11\d\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,'');
      html=html.replace(/<script\s+src=["']\/assets\/boss-raid-v116\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,'');
      html=appendBeforeBody(html,`${MAJOKU_SIDEBAR_SCRIPT}\n${BOSS_RAID_SCRIPT}`);
      return htmlResponse(response,html,{'x-mws-majoku-sidebar':'v1.1.5','x-mws-boss-raid':'v1.1.6'});
    }

    if (url.pathname !== '/' && url.pathname !== '/index.html') return response;

    let html = await response.text();
    html = html.replace(/<script\s+src=["']\/assets\/steam-game-v110\.js["']\s*><\/script>/gi, STEAM_SCRIPT);
    if (!html.includes('steam-game-v111.js')) html=appendBeforeBody(html,`${STEAM_SCRIPT}\n${UI_FIX_SCRIPT}`);
    else if(!html.includes('ui-fixes-v113.js')) html=appendBeforeBody(html,UI_FIX_SCRIPT);
    if(!html.includes('boss-manager-v116.js'))html=appendBeforeBody(html,BOSS_MANAGER_SCRIPT);
    if (!html.includes('calendar-drag-layout-fix.css')) html=html.includes('</head>')?html.replace('</head>',`${CALENDAR_DRAG_FIX}\n</head>`):`${CALENDAR_DRAG_FIX}\n${html}`;
    return htmlResponse(response,html,{
      'x-mws-steam-picker':'v1.1.3',
      'x-mws-calendar-drag-fix':'v1.1.3',
      'x-mws-ui-fixes':'v1.1.5',
      'x-mws-boss-manager':'v1.1.6'
    });
  },
};
