import cf57 from './cf-v57.js';

const BUILD_VERSION = 'CF MWS V 1.0.3';

const PLANNER_INTEGRATION = `
<style id="mws-content-planner-host-style">
#contentPlanner{padding:0!important}
#mwsContentPlannerShell{height:calc(100vh - 116px);min-height:620px;border:1px solid var(--border);border-radius:14px;overflow:hidden;background:#070a12}
#mwsContentPlannerFrame{width:100%;height:100%;border:0;display:block;background:#070a12}
@media(max-width:900px){#mwsContentPlannerShell{height:calc(100vh - 105px);min-height:560px}}
</style>
<script id="mws-content-planner-host">
(()=>{
  'use strict';
  if(window.__mwsContentPlannerHost)return;
  window.__mwsContentPlannerHost=true;

  const TAB='contentPlanner';
  const FRAME_ID='mwsContentPlannerFrame';

  function plannerContacts(){
    try{
      return (Array.isArray(data?.contacts)?data.contacts:[]).map(c=>({
        id:String(c?.id||''),
        name:String(c?.name||''),
        labels:Array.isArray(c?.labels)?c.labels.map(String):[],
        image:typeof c?.image==='string'?c.image:''
      })).filter(c=>c.id&&c.name);
    }catch(_){return []}
  }

  function sendContacts(){
    const frame=document.getElementById(FRAME_ID);
    if(!frame?.contentWindow)return;
    try{frame.contentWindow.postMessage({type:'mws:planner-contacts',contacts:plannerContacts()},location.origin)}catch(_){}
  }

  function loadPlanner(){
    const frame=document.getElementById(FRAME_ID);
    if(!frame)return;
    if(!frame.src){
      frame.src='/content-planner.html?v=1.0.3';
      frame.addEventListener('load',()=>setTimeout(sendContacts,0),{once:true});
    }else setTimeout(sendContacts,0);
  }

  function addNav(){
    if(document.querySelector('.nav button[data-tab="'+TAB+'"]'))return;
    const anchor=document.querySelector('.nav button[data-tab="posts"]');
    if(!anchor)return;
    const btn=document.createElement('button');
    btn.dataset.tab=TAB;
    btn.title='컨텐츠 플래너';
    btn.innerHTML='<span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h4M16 14l3 3-3 3"/></svg></span><span class="nav-label">컨텐츠 플래너</span>';
    btn.onclick=()=>{try{setTab(TAB)}catch(_){};loadPlanner()};
    anchor.insertAdjacentElement('afterend',btn);
  }

  function addSection(){
    if(document.getElementById(TAB))return;
    const main=document.querySelector('.main');
    if(!main)return;
    const sec=document.createElement('section');
    sec.id=TAB;
    sec.className='section';
    sec.innerHTML='<div id="mwsContentPlannerShell"><iframe id="'+FRAME_ID+'" title="MAWANG Content Planner" referrerpolicy="same-origin" allow="clipboard-write"></iframe></div>';
    main.appendChild(sec);
  }

  function wrapTab(){
    const base=window.setTab;
    if(typeof base!=='function'||base.__mwsPlannerHost)return;
    const wrapped=function(tab){
      const out=base.apply(this,arguments);
      if(tab===TAB){
        const title=document.getElementById('pageTitle');
        if(title)title.textContent='컨텐츠 플래너';
        loadPlanner();
      }
      return out;
    };
    wrapped.__mwsPlannerHost=true;
    wrapped.__mwsPlannerBase=base;
    window.setTab=wrapped;
    try{setTab=wrapped}catch(_){}
  }

  function install(){
    addNav();
    addSection();
    wrapTab();
  }

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const frame=document.getElementById(FRAME_ID);
    if(!frame||event.source!==frame.contentWindow)return;
    if(event.data?.type==='mws:planner-request-contacts')sendContacts();
  });
  window.addEventListener('mawang:datachange',()=>setTimeout(sendContacts,0));

  install();
  [100,300,800,1600].forEach(ms=>setTimeout(install,ms));
})();
<\/script>`;

async function withPlannerIntegration(response, request) {
  if (!response) return response;
  const url = new URL(request.url);
  if (url.pathname !== '/' && url.pathname !== '/index.html') return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let text;
  try { text = await response.text(); } catch (_) { return response; }
  if (!text.includes('</body>')) return response;
  if (!text.includes('mws-content-planner-host')) {
    text = text.replace('</body>', `${PLANNER_INTEGRATION}\n</body>`);
  }

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('content-length', String(new TextEncoder().encode(text).byteLength));
  headers.set('x-mws-build', BUILD_VERSION);
  return new Response(text, { status: response.status, headers });
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
  if (path === '/api/bootstrap') body.mode = 'cf-v5.7.1-bundle';

  const text = JSON.stringify(body);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('content-length', String(new TextEncoder().encode(text).byteLength));
  headers.set('x-mws-build', BUILD_VERSION);
  return new Response(text, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const response = await cf57.fetch(request, env, ctx);
    const versioned = await withBuildVersion(response, request);
    return withPlannerIntegration(versioned, request);
  },
};
