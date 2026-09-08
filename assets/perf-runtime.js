/* MAWANG Scheduler performance runtime. No visible UI/feature changes. */
(()=>{
  'use strict';
  const perf=window.__mwsPerfMetrics=window.__mwsPerfMetrics||Object.create(null);
  function record(name,ms){const p=perf[name]||{count:0,total:0,max:0,last:0,avg:0};p.count++;p.total+=ms;p.last=ms;p.max=Math.max(p.max,ms);p.avg=p.total/p.count;perf[name]=p}
  window.mwsPerformanceSnapshot=()=>JSON.parse(JSON.stringify(perf));

  let historyCache=null,lastMapCache=null,upcomingCache=null,upcomingMapCache=null,searchKeyCache=new Map(),cacheDay='';
  function invalidate(){historyCache=null;lastMapCache=null;upcomingCache=null;upcomingMapCache=null;searchKeyCache=new Map();cacheDay=''}
  window.mwsInvalidatePerformanceCaches=invalidate;

  const baseNormalized=typeof normalizedCollaborationHistory==='function'?normalizedCollaborationHistory:null;
  if(baseNormalized){
    normalizedCollaborationHistory=function(){
      const day=todayKST();if(historyCache&&cacheDay===day)return historyCache;
      cacheDay=day;historyCache=baseNormalized();lastMapCache=null;return historyCache;
    };
  }
  function lastMap(){
    const day=todayKST();if(lastMapCache&&cacheDay===day)return lastMapCache;
    const map=new Map();for(const row of normalizedCollaborationHistory())for(const id of row.participants||[])if(!map.has(id))map.set(id,row);
    lastMapCache=map;cacheDay=day;return map;
  }
  if(typeof getLastCollab==='function')getLastCollab=id=>lastMap().get(id)||null;

  const baseUpcoming=typeof upcomingEvents==='function'?upcomingEvents:null;
  if(baseUpcoming){
    upcomingEvents=function(){const day=todayKST();if(upcomingCache&&cacheDay===day)return upcomingCache;cacheDay=day;upcomingCache=baseUpcoming();upcomingMapCache=null;return upcomingCache};
  }
  function upcomingMap(){
    if(upcomingMapCache)return upcomingMapCache;
    const map=new Map();for(const row of upcomingEvents())for(const id of row.participants||[]){if(!map.has(id))map.set(id,[]);const a=map.get(id);if(a.length<8)a.push(row)}
    return upcomingMapCache=map;
  }
  if(typeof upcomingEventsForContact==='function')upcomingEventsForContact=id=>upcomingMap().get(id)||[];

  if(typeof contactMatches==='function')contactMatches=function(c,q){
    const needle=String(q||'').toLocaleLowerCase('ko-KR');if(!needle)return true;
    let key=searchKeyCache.get(c.id);if(key===undefined){key=(String(c.name||'')+' '+(c.labels||[]).join(' ')+' '+String(c.notes||'')).toLocaleLowerCase('ko-KR');searchKeyCache.set(c.id,key)}
    return key.includes(needle);
  };

  const style=document.createElement('style');style.id='mws-performance-runtime-style';style.textContent='.contact-card{content-visibility:auto;contain-intrinsic-size:auto 170px}.contact-card[hidden]{display:none!important}';document.head.appendChild(style);

  function tuneImages(root=document){
    const imgs=root.querySelectorAll?root.querySelectorAll('img[loading="lazy"]'):[];
    for(const img of imgs)if(!img.hasAttribute('decoding'))img.decoding='async';
  }
  tuneImages();
  const imageObserver=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1){if(n.matches?.('img[loading="lazy"]')&&!n.hasAttribute('decoding'))n.decoding='async';tuneImages(n)}});
  imageObserver.observe(document.body,{childList:true,subtree:true});

  function installGridDelegation(grid){
    if(!grid||grid.dataset.mwsPerfDelegated==='1')return;grid.dataset.mwsPerfDelegated='1';
    grid.addEventListener('click',e=>{const card=e.target.closest('.contact-card[data-contact-id]');if(card&&grid.contains(card))openContact(card.dataset.contactId)});
    grid.addEventListener('dragstart',e=>{const card=e.target.closest('.contact-card[data-contact-id]');if(!card||!grid.contains(card))return;e.stopPropagation();e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/contact-id',card.dataset.contactId);e.dataTransfer.setData('text/plain',card.dataset.contactId);card.classList.add('dragging')});
    grid.addEventListener('dragend',e=>e.target.closest('.contact-card[data-contact-id]')?.classList.remove('dragging'));
  }
  function applyContactSearch(){
    if(typeof contactView!=='undefined'&&contactView!=='cards')return false;
    const grid=document.getElementById('contactGrid');if(!grid)return false;
    const cards=[...grid.querySelectorAll('.contact-card[data-contact-id]')];if(!cards.length)return false;
    const q=(document.getElementById('contactSearch')?.value||'').trim().toLocaleLowerCase('ko-KR');let visible=0;
    for(const card of cards){const c=contact(card.dataset.contactId),show=Boolean(c&&contactMatches(c,q));card.hidden=!show;if(show)visible++}
    const empty=grid.querySelector('.mws-contact-search-empty');if(empty)empty.hidden=visible!==0;return true;
  }
  window.mwsApplyContactSearch=applyContactSearch;

  const optimizedRenderContacts=function(){
    const started=performance.now(),input=document.getElementById('contactSearch'),q=input?.value||'';
    if(input)input.value='';let arr=filteredContacts();if(input)input.value=q;
    if(data.selfContactId)arr=[...arr].sort((a,b)=>(a.id===data.selfContactId?-1:b.id===data.selfContactId?1:0));
    const grid=document.getElementById('contactGrid');if(!grid)return;installGridDelegation(grid);
    if(!window.__mwsContactSearchRender){renderContactTagSidebar();renderContactTagBanner()}
    const latest=lastMap(),upMap=upcomingMap();
    grid.innerHTML=arr.map(c=>{
      const last=latest.get(c.id)||null,upcoming=upMap.get(c.id)||[],isSelf=c.id===data.selfContactId;
      const avatar=c.image?`<img class="contact-card-avatar-lg" loading="lazy" decoding="async" src="${c.image}">`:`<div class="contact-card-avatar-lg">${esc(initials(c.name))}</div>`;
      return `<div class="contact-card ${isSelf?'is-self':''} ${c.pendingSetup?'pending-card':''} ${upcoming.length?'has-upcoming':''}" draggable="true" data-contact-id="${c.id}"><div class="contact-card-core">${avatar}<div class="contact-card-info"><div class="contact-card-name-row"><div class="contact-card-name">${esc(c.name)}</div>${isSelf?'<span class="contact-self-badge">본인</span>':''}${upcoming.length?`<span class="upcoming-count-badge">UPCOMING ${upcoming.length}</span>`:''}</div><div class="contact-card-tags">${(c.labels||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join('')||'<span class="muted small">태그 없음</span>'}</div><div class="contact-card-last">${last?`최근 컨텐츠: <strong style="color:var(--text)">${esc(last.title)}</strong><br>${formatDateWeekday(last.date)} · ${daysSince(last.date)}일 전`:'합방 기록 없음'}</div><div class="contact-card-actions">${c.stationUrl?`<button type="button" class="station-link" onclick="event.stopPropagation();openContactStation('${c.id}')">방송국 열기</button>`:''}${c.pendingSetup?'<span class="chip">신규 추가</span>':''}</div></div></div>${contactUpcomingPopover(c)}</div>`
    }).join('')+'<div class="empty mws-contact-search-empty" hidden>연락처가 없습니다</div>';
    applyContactSearch();record('contacts.render',performance.now()-started);
  };
  renderContacts=optimizedRenderContacts;window.renderContacts=optimizedRenderContacts;

  let searchTimer=0;const search=document.getElementById('contactSearch');
  function searchNow(){window.__mwsContactSearchRender=true;try{if(!applyContactSearch()){if(typeof mwsRenderActiveContactView==='function')mwsRenderActiveContactView();else renderContacts()}}finally{window.__mwsContactSearchRender=false}}
  if(search){search.oninput=e=>{if(e?.isComposing)return;clearTimeout(searchTimer);searchTimer=setTimeout(searchNow,80)};search.oncompositionend=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(searchNow,0)}}

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
    record('app.renderActive',performance.now()-started);return true;
  }
  const baseRenderAll=typeof renderAll==='function'?renderAll:null;
  if(baseRenderAll){renderAll=function(reason){invalidate();const s=performance.now(),out=saveDepth?renderActiveAfterSave(reason):baseRenderAll(reason);record(saveDepth?'app.renderScoped':'app.renderAll',performance.now()-s);return out};window.renderAll=renderAll}
  const baseSaveData=typeof saveData==='function'?saveData:null;
  if(baseSaveData){saveData=function(reason){invalidate();const s=performance.now();saveDepth++;try{return baseSaveData(reason)}finally{saveDepth--;record('app.saveData',performance.now()-s)}};window.saveData=saveData}
  const baseSetTab=typeof setTab==='function'?setTab:null;
  if(baseSetTab){setTab=function(tab){const out=baseSetTab(tab);if(tab==='settings')try{renderSettings()}catch(_){};return out};window.setTab=setTab}
  window.addEventListener('mawang:datachange',invalidate);
})();
