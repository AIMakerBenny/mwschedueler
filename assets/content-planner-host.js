/* CF MWS V 1.0.4 - Content Planner category integration */
(()=>{
  'use strict';
  if(window.__mwsContentPlannerHostV104)return;
  window.__mwsContentPlannerHostV104=true;

  const TAB='contentPlanner';
  const FRAME_ID='mwsContentPlannerFrame';
  const FRAME_URL='/content-planner.html?v=1.0.4';

  function ensureStyle(){
    if(document.getElementById('mwsContentPlannerHostStyleV104'))return;
    const style=document.createElement('style');
    style.id='mwsContentPlannerHostStyleV104';
    style.textContent=`
      #contentPlanner{padding:0!important;zoom:1!important;font-size:inherit!important;--ui-text-scale:1!important;overflow:hidden!important}
      #mwsContentPlannerShell{height:calc(100vh - 92px);min-height:560px;border:1px solid var(--border);border-radius:14px;overflow:hidden;background:#070a12}
      #mwsContentPlannerFrame{display:block;width:100%;height:100%;border:0;background:#070a12}
      @media(max-width:900px){#mwsContentPlannerShell{height:calc(100vh - 78px);min-height:500px}}
    `;
    document.head.appendChild(style);
  }

  function contactsForPlanner(){
    try{
      return (Array.isArray(data?.contacts)?data.contacts:[]).map(c=>({
        id:String(c?.id||''),
        name:String(c?.name||''),
        labels:Array.isArray(c?.labels)?c.labels.map(String):[],
        image:typeof c?.image==='string'?c.image:'',
        notes:typeof c?.notes==='string'?c.notes:''
      })).filter(c=>c.id&&c.name);
    }catch(_){return []}
  }

  function sendContacts(){
    const frame=document.getElementById(FRAME_ID);
    if(!frame?.contentWindow)return;
    try{frame.contentWindow.postMessage({type:'mws:planner-contacts',contacts:contactsForPlanner()},location.origin)}
    catch(error){console.warn('Content Planner contact sync failed',error)}
  }

  function ensureSection(){
    const duplicates=[...document.querySelectorAll(`#${TAB}`)];
    if(duplicates.length>1)duplicates.slice(1).forEach(x=>x.remove());
    let section=document.getElementById(TAB);
    if(section)return section;
    const main=document.querySelector('.main');
    if(!main)return null;
    section=document.createElement('section');
    section.id=TAB;
    section.className='section';
    section.innerHTML=`<div id="mwsContentPlannerShell"><iframe id="${FRAME_ID}" title="MAWANG Content Planner" referrerpolicy="same-origin" allow="clipboard-write"></iframe></div>`;
    main.appendChild(section);
    return section;
  }

  function loadFrame(){
    const frame=document.getElementById(FRAME_ID);
    if(!frame)return;
    if(frame.dataset.mwsLoaded==='1'){
      setTimeout(sendContacts,0);
      return;
    }
    frame.dataset.mwsLoaded='1';
    frame.addEventListener('load',()=>setTimeout(sendContacts,0));
    frame.src=FRAME_URL;
  }

  function activate(){
    ensureSection();
    if(typeof window.setTab==='function'){
      try{window.setTab(TAB)}catch(error){console.warn('Content Planner setTab failed',error)}
    }
    const section=document.getElementById(TAB);
    if(section&&!section.classList.contains('active')){
      document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s===section));
      document.querySelectorAll('.nav button[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===TAB));
    }
    const title=document.getElementById('pageTitle');
    if(title)title.textContent='컨텐츠 플래너';
    loadFrame();
  }

  function ensureNav(){
    const existing=[...document.querySelectorAll(`.nav button[data-tab="${TAB}"]`)];
    let button=existing.shift()||null;
    existing.forEach(x=>x.remove());
    const posts=document.querySelector('.nav button[data-tab="posts"]');
    const notebook=document.querySelector('.nav button[data-tab="memos"]');
    if(!posts)return;
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.dataset.tab=TAB;
      button.title='컨텐츠 플래너';
      button.innerHTML='<span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h4M15 15l2 2 3-4"/></svg></span><span class="nav-label">컨텐츠 플래너</span>';
      button.addEventListener('click',event=>{event.preventDefault();activate()});
    }
    posts.insertAdjacentElement('afterend',button);
    if(notebook)button.insertAdjacentElement('afterend',notebook);
  }

  function install(){ensureStyle();ensureSection();ensureNav()}

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const frame=document.getElementById(FRAME_ID);
    if(!frame||event.source!==frame.contentWindow)return;
    if(event.data?.type==='mws:planner-request-contacts')sendContacts();
  });
  window.addEventListener('mawang:datachange',()=>setTimeout(sendContacts,0));

  install();
  [100,300,800,1600,3000].forEach(ms=>setTimeout(install,ms));
})();
