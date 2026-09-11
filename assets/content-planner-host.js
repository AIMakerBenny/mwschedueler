/* CF MWS V 1.0.4 - Content Planner category integration + scale-safe UI */
(()=>{
  'use strict';
  if(window.__mwsContentPlannerHostV104)return;
  window.__mwsContentPlannerHostV104=true;

  const BUILD='CF MWS V 1.0.4';
  const TAB='contentPlanner';
  const FRAME_ID='mwsContentPlannerFrame';
  const FRAME_URL='/content-planner.html?v=1.0.4';

  function forceVersionV104(){
    try{
      if(document.body?.__mwsV101BuildObserver){document.body.__mwsV101BuildObserver.disconnect();document.body.__mwsV101BuildObserver=null}
      const labels=document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]');
      labels.forEach(label=>{if(label.__mwsV101BuildObserver){label.__mwsV101BuildObserver.disconnect();label.__mwsV101BuildObserver=null}if(label.textContent!==BUILD)label.textContent=BUILD});
      document.body?.setAttribute('data-build-version',BUILD);
    }catch(_){}
  }

  function ensureStyle(){
    if(document.getElementById('mwsContentPlannerHostStyleV104'))return;
    const style=document.createElement('style');
    style.id='mwsContentPlannerHostStyleV104';
    style.textContent=`
      #contentPlanner{padding:0!important;zoom:1!important;font-size:inherit!important;--ui-text-scale:1!important;overflow:hidden!important}
      #mwsContentPlannerShell{height:calc(100vh - 92px);min-height:560px;border:1px solid var(--border);border-radius:14px;overflow:hidden;background:#070a12}
      #mwsContentPlannerFrame{display:block;width:100%;height:100%;border:0;background:#070a12}

      #dashboard .dashboard-kpi-grid-local{grid-template-columns:repeat(auto-fit,minmax(calc(185px * var(--ui-text-scale,1)),1fr))!important;align-items:stretch!important}
      #dashboard .dashboard-kpi-grid-local>.card,#dashboard .dashboard-kpi-grid-local>button.card{height:auto!important;min-height:calc(82px * var(--ui-text-scale,1))!important;overflow:visible!important;padding:calc(15px * var(--ui-text-scale,1))!important}
      #dashboard .dashboard-my-profile-v3{height:auto!important;min-height:calc(82px * var(--ui-text-scale,1))!important;overflow:visible!important}
      #dashboard .dashboard-my-profile-kicker-v3{font-size:calc(10px * var(--ui-text-scale,1))!important;line-height:1.35!important}
      #dashboard .dashboard-my-profile-row-v3 strong{font-size:calc(15px * var(--ui-text-scale,1))!important;line-height:1.35!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
      #dashboard .dashboard-my-profile-row-v3 small{font-size:calc(10px * var(--ui-text-scale,1))!important;line-height:1.35!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}

      #calendarGrid.calendar{grid-auto-rows:auto!important;align-items:stretch!important}
      #calendarGrid .day{height:auto!important;min-height:calc(155px * var(--ui-text-scale,1))!important;overflow:visible!important;padding:calc(8px * var(--ui-text-scale,1))!important;padding-bottom:calc(44px * var(--ui-text-scale,1))!important}
      #calendarGrid .daynum{font-size:calc(12px * var(--ui-text-scale,1))!important;line-height:1.25!important}
      #calendarGrid .mini-event{height:auto!important;min-height:calc(30px * var(--ui-text-scale,1))!important;font-size:calc(11.5px * var(--ui-text-scale,1))!important;line-height:1.35!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;padding:calc(6px * var(--ui-text-scale,1)) calc(7px * var(--ui-text-scale,1))!important}
      #calendarGrid .mini-event-main,#calendarGrid .mini-event-people{font-size:inherit!important;line-height:1.35!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}

      #sniper .sniper-name{font-size:calc(19px * var(--ui-text-scale,1))!important;line-height:1.25!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
      #sniper .sniper-meta,#sniper .sniper-activity-note{font-size:calc(12px * var(--ui-text-scale,1))!important;line-height:1.45!important}
      #sniper .sniper-last-days{font-size:calc(25px * var(--ui-text-scale,1))!important;line-height:1.2!important}
      #sniper .contact-card{height:auto!important;min-height:calc(118px * var(--ui-text-scale,1))!important}
      #sniper .sniper-row{min-height:calc(90px * var(--ui-text-scale,1))!important;align-items:center!important}

      #targets .target-grid{grid-template-columns:repeat(auto-fit,minmax(calc(330px * var(--ui-text-scale,1)),1fr))!important;align-items:stretch!important}
      #targets .target-person-card,#targets .target-add-card{height:auto!important;min-height:calc(305px * var(--ui-text-scale,1))!important}
      #targets .target-person-card{padding:calc(14px * var(--ui-text-scale,1))!important}
      #targets .target-person-name{font-size:calc(20px * var(--ui-text-scale,1))!important;line-height:1.24!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
      #targets .target-info-main{font-size:calc(12px * var(--ui-text-scale,1))!important;line-height:1.45!important}
      #targets .target-info-label,#targets .target-info-sub,#targets .target-upcoming-meta,#targets .target-no-upcoming{font-size:calc(10px * var(--ui-text-scale,1))!important;line-height:1.4!important}
      #targets .target-gap-value{font-size:calc(24px * var(--ui-text-scale,1))!important}
      #targets .target-info-cell{height:auto!important;min-height:calc(67px * var(--ui-text-scale,1))!important}

      #friendFinder .friend-finder-grid-v5{grid-template-columns:repeat(auto-fit,minmax(calc(270px * var(--ui-text-scale,1)),1fr))!important;align-items:stretch!important}
      #friendFinder .friend-finder-card-v5{height:auto!important;min-height:calc(118px * var(--ui-text-scale,1))!important;padding:calc(14px * var(--ui-text-scale,1))!important}
      #friendFinder .friend-finder-name-v5{font-size:calc(18px * var(--ui-text-scale,1))!important;line-height:1.3!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;padding-right:calc(58px * var(--ui-text-scale,1))!important}
      #friendFinder .friend-finder-state-v5{font-size:calc(12px * var(--ui-text-scale,1))!important;line-height:1.4!important;height:auto!important;min-height:1.5em!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
      #friendFinder .friend-finder-tags-v5 .chip{font-size:calc(10px * var(--ui-text-scale,1))!important}

      .recent-person-title-v55{font-size:calc(17px * var(--ui-text-scale,1))!important;line-height:1.3!important}
      .recent-person-name-v55{font-size:calc(25px * var(--ui-text-scale,1))!important;line-height:1.25!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
      .recent-person-candidate-v55 strong{font-size:calc(13px * var(--ui-text-scale,1))!important;line-height:1.35!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
      .recent-person-candidate-v55 small,.recent-person-history-date-v55,.recent-person-history-meta-v55{font-size:calc(10px * var(--ui-text-scale,1))!important;line-height:1.4!important}
      .recent-person-history-main-v55 strong{font-size:calc(13px * var(--ui-text-scale,1))!important;line-height:1.35!important}
      .recent-person-stats-v55>div,.recent-person-history-row-v55,.recent-person-candidate-v55{height:auto!important;min-height:max-content!important}

      @media(max-width:900px){#mwsContentPlannerShell{height:calc(100vh - 78px);min-height:500px}}
    `;
    document.head.appendChild(style);
  }

  function contactsForPlanner(){
    try{return (Array.isArray(data?.contacts)?data.contacts:[]).map(c=>({id:String(c?.id||''),name:String(c?.name||''),labels:Array.isArray(c?.labels)?c.labels.map(String):[],image:typeof c?.image==='string'?c.image:'',notes:typeof c?.notes==='string'?c.notes:''})).filter(c=>c.id&&c.name)}catch(_){return []}
  }

  function sendContacts(){const frame=document.getElementById(FRAME_ID);if(!frame?.contentWindow)return;try{frame.contentWindow.postMessage({type:'mws:planner-contacts',contacts:contactsForPlanner()},location.origin)}catch(error){console.warn('Content Planner contact sync failed',error)}}

  function ensureSection(){
    const duplicates=[...document.querySelectorAll(`#${TAB}`)];if(duplicates.length>1)duplicates.slice(1).forEach(x=>x.remove());
    let section=document.getElementById(TAB);if(section)return section;const main=document.querySelector('.main');if(!main)return null;section=document.createElement('section');section.id=TAB;section.className='section';section.innerHTML=`<div id="mwsContentPlannerShell"><iframe id="${FRAME_ID}" title="MAWANG Content Planner" referrerpolicy="same-origin" allow="clipboard-write"></iframe></div>`;main.appendChild(section);return section
  }

  function loadFrame(){const frame=document.getElementById(FRAME_ID);if(!frame)return;if(frame.dataset.mwsLoaded==='1'){setTimeout(sendContacts,0);return}frame.dataset.mwsLoaded='1';frame.addEventListener('load',()=>setTimeout(sendContacts,0));frame.src=FRAME_URL}

  function activate(){
    ensureSection();if(typeof window.setTab==='function'){try{window.setTab(TAB)}catch(error){console.warn('Content Planner setTab failed',error)}}const section=document.getElementById(TAB);if(section&&!section.classList.contains('active')){document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s===section));document.querySelectorAll('.nav button[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===TAB))}const title=document.getElementById('pageTitle');if(title)title.textContent='컨텐츠 플래너';loadFrame()
  }

  function ensureNav(){
    const existing=[...document.querySelectorAll(`.nav button[data-tab="${TAB}"]`)];let button=existing.shift()||null;existing.forEach(x=>x.remove());const posts=document.querySelector('.nav button[data-tab="posts"]');if(!posts)return;if(!button){button=document.createElement('button');button.type='button';button.dataset.tab=TAB;button.title='컨텐츠 플래너';button.innerHTML='<span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h4M15 15l2 2 3-4"/></svg></span><span class="nav-label">컨텐츠 플래너</span>';button.addEventListener('click',event=>{event.preventDefault();activate()})}posts.insertAdjacentElement('afterend',button)
  }

  function install(){forceVersionV104();ensureStyle();ensureSection();ensureNav()}

  window.addEventListener('message',event=>{if(event.origin!==location.origin)return;const frame=document.getElementById(FRAME_ID);if(!frame||event.source!==frame.contentWindow)return;if(event.data?.type==='mws:planner-request-contacts')sendContacts()});
  window.addEventListener('mawang:datachange',()=>setTimeout(()=>{forceVersionV104();sendContacts()},0));

  install();[100,300,800,1600,3000].forEach(ms=>setTimeout(install,ms));
  setTimeout(()=>{forceVersionV104();const label=document.querySelector('[id^="mwsBuildVersionV5"],#mwsBuildVersion,[class*="sidebar-build-version"]');if(label&&!label.__mwsV104BuildObserver){const o=new MutationObserver(()=>{if(label.textContent!==BUILD)forceVersionV104()});o.observe(label,{childList:true,characterData:true,subtree:true});label.__mwsV104BuildObserver=o}},3200);
})();
