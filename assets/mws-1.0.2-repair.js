/* MWS Version 1.0.2 - planner persistence + stable version label repair */
(()=>{
  'use strict';
  if(window.__mws102Repair)return;
  window.__mws102Repair=true;

  const BUILD='MWS Version 1.0.2';
  const $=id=>document.getElementById(id);
  let reloading=false;
  let repairTimer=0;
  let navObserver=null;

  function hideLegacyVersionLabels(){
    document.querySelectorAll('.sidebar [class*="sidebar-build-version"],.sidebar [id*="BuildVersion"]').forEach(el=>{
      if(el.id==='mwsProductVersionLabel')return;
      el.style.setProperty('display','none','important');
      el.setAttribute('aria-hidden','true');
    });
  }

  function stableVersionLabel(){
    hideLegacyVersionLabels();
    const save=$('mwsSidebarSaveBtn');
    if(!save)return null;
    let label=$('mwsProductVersionLabel');
    if(!label){
      label=document.createElement('div');
      label.id='mwsProductVersionLabel';
      label.className='mws-product-version-label';
      label.setAttribute('aria-label','현재 버전');
      save.before(label);
    }
    label.textContent=BUILD;
    label.style.cssText='display:block!important;flex:0 0 auto;text-align:center;margin:8px 0 4px;color:var(--muted);opacity:.82;font-size:10px;font-weight:900;letter-spacing:.12em;line-height:1.25;user-select:none;background:none;border:0;box-shadow:none;padding:0';
    document.body?.setAttribute('data-mws-product-build',BUILD);
    return label;
  }

  function activatePlannerFallback(){
    document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='planner'));
    document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id==='planner'));
    const title=$('pageTitle');
    if(title)title.textContent='컨텐츠 플래너';
    const add=$('newEventBtn');
    if(add)add.style.display='none';
    try{window.applyPageTextScalesV54?.()}catch(_){}
  }

  function plannerClick(event){
    event?.preventDefault?.();
    event?.stopPropagation?.();
    try{
      if(typeof window.setTab==='function')window.setTab('planner');
    }catch(err){console.warn('MWS 1.0.2 planner setTab fallback',err)}
    queueMicrotask(()=>{
      if(!$('planner')?.classList.contains('active'))activatePlannerFallback();
    });
  }

  function makePlannerButton(){
    const btn=document.createElement('button');
    btn.type='button';
    btn.dataset.tab='planner';
    btn.title='컨텐츠 플래너';
    btn.innerHTML='<span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h5M8 16h3"/><path d="m15 15 4-4 2 2-4 4-3 1z"/></svg></span><span class="nav-label">컨텐츠 플래너</span>';
    btn.addEventListener('click',plannerClick);
    return btn;
  }

  function ensurePlannerNav(){
    const nav=document.querySelector('.nav-scroll')||document.querySelector('.sidebar .nav');
    if(!nav)return null;
    let btn=nav.querySelector('button[data-tab="planner"]');
    if(!btn){
      btn=makePlannerButton();
      const posts=nav.querySelector('button[data-tab="posts"]');
      const memos=nav.querySelector('button[data-tab="memos"]');
      if(posts)posts.after(btn);
      else if(memos)memos.before(btn);
      else nav.appendChild(btn);
    }else if(!btn.dataset.mws102RepairBound){
      btn.addEventListener('click',plannerClick);
    }
    btn.dataset.mws102RepairBound='1';

    /* Requested position: immediately under 게시글 and above 수첩 when both exist. */
    const posts=nav.querySelector('button[data-tab="posts"]');
    if(posts && posts.nextElementSibling!==btn)posts.after(btn);
    return btn;
  }

  function reloadPlannerRuntime(){
    if(reloading)return;
    reloading=true;
    try{window.__mwsVersion102=0}catch(_){}
    const old=$('mws102RepairReload');
    old?.remove();
    const s=document.createElement('script');
    s.id='mws102RepairReload';
    s.src='assets/mws-1.0.2.js?v=1.0.2-repair-3';
    s.async=false;
    s.onload=()=>{reloading=false;scheduleRepair(20)};
    s.onerror=()=>{reloading=false;console.error('MWS 1.0.2 planner runtime repair reload failed')};
    document.body.appendChild(s);
  }

  function ensurePlanner(){
    const section=$('planner');
    if(!section){
      reloadPlannerRuntime();
      return false;
    }
    const nav=ensurePlannerNav();
    if(!nav)return false;
    stableVersionLabel();
    window.__mws102PlannerReady=true;
    return true;
  }

  function scheduleRepair(delay=0){
    clearTimeout(repairTimer);
    repairTimer=setTimeout(()=>{
      try{ensurePlanner()}catch(err){console.error('MWS 1.0.2 repair failed',err)}
    },delay);
  }

  function installObservers(){
    if(document.body && !navObserver){
      navObserver=new MutationObserver(()=>scheduleRepair(0));
      navObserver.observe(document.body,{childList:true,subtree:true});
    }
    window.addEventListener('mawang:datachange',()=>scheduleRepair(0));
    window.addEventListener('mws:cloud-ready',()=>scheduleRepair(0));
    window.addEventListener('mws:product-ready',()=>scheduleRepair(0));
    window.addEventListener('mws:planner-ready',()=>scheduleRepair(0));
    [0,100,300,700,1500,3000,6000,10000].forEach(ms=>setTimeout(()=>scheduleRepair(0),ms));
  }

  function init(){
    installObservers();
    scheduleRepair(0);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
