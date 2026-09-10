/* CF MWS V 1.0.3 - Content Planner category host */
(()=>{
  'use strict';
  if(window.__mwsContentPlannerHost)return;
  window.__mwsContentPlannerHost=true;

  const TAB='contentPlanner';
  const FRAME_ID='mwsContentPlannerFrame';
  const FRAME_URL='/content-planner.html?v=1.0.3';

  function installStyle(){
    if(document.getElementById('mwsContentPlannerHostStyle'))return;
    const style=document.createElement('style');
    style.id='mwsContentPlannerHostStyle';
    style.textContent=`
      #contentPlanner{padding:0!important;zoom:1!important;font-size:inherit!important;--ui-text-scale:1!important}
      #mwsContentPlannerShell{height:calc(100vh - 92px);min-height:620px;border:1px solid var(--border);border-radius:14px;overflow:hidden;background:#070a12}
      #mwsContentPlannerFrame{width:100%;height:100%;border:0;display:block;background:#070a12}
      @media(max-width:900px){#mwsContentPlannerShell{height:calc(100vh - 80px);min-height:560px}}
    `;
    document.head.appendChild(style);
  }

  function plannerContacts(){
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
    try{frame.contentWindow.postMessage({type:'mws:planner-contacts',contacts:plannerContacts()},location.origin)}catch(_){}
  }

  function loadPlanner(){
    const frame=document.getElementById(FRAME_ID);
    if(!frame)return;
    if(!frame.dataset.loaded){
      frame.dataset.loaded='1';
      frame.src=FRAME_URL;
      frame.addEventListener('load',()=>setTimeout(sendContacts,0));
    }else setTimeout(sendContacts,0);
  }

  function addSection(){
    if(document.getElementById(TAB))return;
    const main=document.querySelector('.main');
    if(!main)return;
    const section=document.createElement('section');
    section.id=TAB;
    section.className='section';
    section.innerHTML=`<div id="mwsContentPlannerShell"><iframe id="${FRAME_ID}" title="MAWANG Content Planner" referrerpolicy="same-origin" allow="clipboard-write"></iframe></div>`;
    main.appendChild(section);
  }

  function activate(){
    if(typeof window.setTab==='function'){
      try{window.setTab(TAB)}catch(_){}
    }
    const section=document.getElementById(TAB);
    if(section&&!section.classList.contains('active')){
      document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
      section.classList.add('active');
      document.querySelectorAll('.nav button[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===TAB));
    }
    const title=document.getElementById('pageTitle');
    if(title)title.textContent='컨텐츠 플래너';
    loadPlanner();
  }

  function addNav(){
    if(document.querySelector(`.nav button[data-tab="${TAB}"]`))return;
    const anchor=document.querySelector('.nav button[data-tab="posts"]');
    if(!anchor)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.dataset.tab=TAB;
    btn.title='컨텐츠 플래너';
    btn.innerHTML='<span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h4M16 14l3 3-3 3"/></svg></span><span class="nav-label">컨텐츠 플래너</span>';
    btn.addEventListener('click',activate);
    anchor.insertAdjacentElement('afterend',btn);
  }

  function install(){
    installStyle();
    addSection();
    addNav();
  }

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
