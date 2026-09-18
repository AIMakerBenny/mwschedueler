/* MAWANG Scheduler performance runtime. No visible UI/feature changes. */
(()=>{
  'use strict';
  const perf=window.__mwsPerfMetrics=window.__mwsPerfMetrics||Object.create(null);
  function record(name,ms){const p=perf[name]||{count:0,total:0,max:0,last:0,avg:0};p.count++;p.total+=ms;p.last=ms;p.max=Math.max(p.max,ms);p.avg=p.total/p.count;perf[name]=p}
  window.mwsPerformanceSnapshot=()=>JSON.parse(JSON.stringify(perf));

  let historyCache=null,lastMapCache=null,upcomingCache=null,upcomingMapCache=null,historyCacheDay='',upcomingCacheDay='';
  function invalidate(){historyCache=null;lastMapCache=null;upcomingCache=null;upcomingMapCache=null;historyCacheDay='';upcomingCacheDay=''}
  window.mwsInvalidatePerformanceCaches=invalidate;

  const baseNormalized=typeof normalizedCollaborationHistory==='function'?normalizedCollaborationHistory:null;
  function cachedHistory(){
    const day=todayKST();
    if(historyCache&&historyCacheDay===day)return historyCache;
    historyCacheDay=day;
    historyCache=baseNormalized?baseNormalized():[];
    lastMapCache=null;
    return historyCache;
  }
  function lastMap(){
    const day=todayKST();
    if(lastMapCache&&historyCacheDay===day)return lastMapCache;
    const map=new Map();
    for(const row of cachedHistory())for(const id of row.participants||[])if(!map.has(id))map.set(id,row);
    lastMapCache=map;
    return map;
  }

  const baseUpcoming=typeof upcomingEvents==='function'?upcomingEvents:null;
  function cachedUpcoming(){
    const day=todayKST();
    if(upcomingCache&&upcomingCacheDay===day)return upcomingCache;
    upcomingCacheDay=day;
    upcomingCache=baseUpcoming?baseUpcoming():[];
    upcomingMapCache=null;
    return upcomingCache;
  }
  function upcomingMap(){
    const day=todayKST();
    if(upcomingMapCache&&upcomingCacheDay===day)return upcomingMapCache;
    const map=new Map();
    for(const row of cachedUpcoming())for(const id of row.participants||[]){
      if(!map.has(id))map.set(id,[]);
      const a=map.get(id);
      if(a.length<8)a.push(row);
    }
    upcomingMapCache=map;
    return map;
  }
  const style=document.createElement('style');style.id='mws-performance-runtime-style';style.textContent='.contact-card{content-visibility:auto;contain-intrinsic-size:auto 170px}.contact-card[hidden]{display:none!important}.mws-boss-row-v121{content-visibility:auto;contain-intrinsic-size:auto 58px}';document.head.appendChild(style);

  function tuneLazyImages(root=document){
    const imgs=root.querySelectorAll?root.querySelectorAll('img[loading="lazy"]'):[];
    for(const img of imgs)if(!img.hasAttribute('decoding'))img.decoding='async';
  }
  let imageTunePending=false;
  function scheduleImageTune(){
    if(imageTunePending)return;imageTunePending=true;
    const run=()=>{imageTunePending=false;tuneLazyImages(document)};
    if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:1200});else setTimeout(run,80);
  }
  scheduleImageTune();

  function applyContactSearch(){
    if(typeof contactView!=='undefined'&&contactView!=='cards')return false;
    const grid=document.getElementById('contactGrid');if(!grid)return false;
    const cards=[...grid.querySelectorAll('.contact-card[data-contact-id]')];if(!cards.length)return false;
    const q=(document.getElementById('contactSearch')?.value||'').trim().toLocaleLowerCase('ko-KR');let visible=0;
    for(const card of cards){const c=contact(card.dataset.contactId),show=Boolean(c&&contactMatches(c,q));card.hidden=!show;if(show)visible++}
    const empty=grid.querySelector('.mws-contact-search-empty');if(empty)empty.hidden=visible!==0;return true;
  }
  window.mwsApplyContactSearch=applyContactSearch;

  let searchTimer=0;const search=document.getElementById('contactSearch');
  function searchNow(){window.__mwsContactSearchRender=true;try{if(!applyContactSearch()){if(typeof mwsRenderActiveContactView==='function')mwsRenderActiveContactView();else renderContacts()}}finally{window.__mwsContactSearchRender=false}}
  if(search){search.oninput=e=>{clearTimeout(searchTimer);searchTimer=setTimeout(searchNow,e?.isComposing?0:80)};search.oncompositionend=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(searchNow,0)}}

  let saveDepth=0;
  function renderActiveAfterSave(reason){
    const started=performance.now();
    document.body.dataset.theme=data.theme||'neon';
    try{updateUpcomingAccent()}catch(_){}try{applyBackground()}catch(_){}
    const active=document.querySelector('.section.active')?.id||'dashboard';
    try{
      if(active==='calendar')renderCalendar();
      else if(active==='worldtime')renderWorldTime();
      else if(active==='sniper'){sniperViewMode==='ranking'?renderCollabRanking():renderSniperList()}
      else if(active==='targets')renderTargetList();
      else if(active==='memos'){memoViewMode==='favorites'?renderFavoriteSchedules():renderMemoLibrary()}
      else if(active==='dashboard'){renderDashboard();renderReminders()}
      else if(active==='contacts'){renderContactFilters();if(contactView==='pending')renderPendingContacts();else if(contactView==='incomplete'&&typeof renderIncompleteContacts==='function')renderIncompleteContacts();else if(contactView==='favorite'&&typeof renderFavoriteContactsV574==='function')renderFavoriteContactsV574();else renderContacts()}
      else if(active==='posts')renderPosts();
      else if(active==='gameLadder')renderLadder();
      else if(active==='gameRps')renderRps();
      else if(active==='gamePachinko')renderPachinko();
      else if(active==='gameMultiDraw')renderMultiDraw();
      else if(active==='settings'){renderSettings();try{updateFullBackupAssetStatus()}catch(_){}}
    }catch(e){console.error('활성 화면 갱신 실패',active,e)}
    try{updateStorageStatus(true)}catch(_){}
    const status=document.getElementById('syncStatusText');if(status)status.textContent='전체 화면 동기화';
    scheduleImageTune();record('app.renderActive',performance.now()-started);return true;
  }
  const baseRenderAll=typeof renderAll==='function'?renderAll:null;
  if(baseRenderAll){renderAll=function(reason){invalidate();const s=performance.now(),out=saveDepth?renderActiveAfterSave(reason):baseRenderAll(reason);record(saveDepth?'app.renderScoped':'app.renderAll',performance.now()-s);scheduleImageTune();return out};window.renderAll=renderAll}
  const baseSaveData=typeof saveData==='function'?saveData:null;
  if(baseSaveData){saveData=function(reason){invalidate();const s=performance.now();saveDepth++;try{return baseSaveData(reason)}finally{saveDepth--;record('app.saveData',performance.now()-s)}};window.saveData=saveData}
  const baseSetTab=typeof setTab==='function'?setTab:null;
  if(baseSetTab){setTab=function(tab){const out=baseSetTab(tab);if(tab==='settings')try{renderSettings()}catch(_){};scheduleImageTune();return out};window.setTab=setTab}
  window.addEventListener('mawang:datachange',()=>{invalidate();scheduleImageTune()});
})();
