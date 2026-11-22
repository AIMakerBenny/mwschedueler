/* Mawang Scheduler v1.6.21 - workspace organization runtime, Phase 176 */
(()=>{
'use strict';
if(window.__mwsWorkspaceUiV176)return;
window.__mwsWorkspaceUiV176=true;

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const uid=()=>{try{return crypto.randomUUID()}catch(_){return 'mws-'+Date.now()+'-'+Math.random().toString(36).slice(2)}};
const KST_FORMATTER=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});

function rootData(){
  try{return typeof data!=='undefined'?data:window.data}catch(_){return window.data||null}
}
function save(reason){
  try{
    const fn=window.saveData||(typeof saveData==='function'?saveData:null);
    return typeof fn==='function'?fn(reason):false;
  }catch(error){
    console.error('Workspace save failed',error);
    return false;
  }
}
function formatCreatedAt(value){
  try{return KST_FORMATTER.format(new Date(value))}catch(_){return String(value||'')}
}

/* Dashboard > World Time */
let baseSetTabV176=null;
let baseDashboardModeV176=null;
function dashboardModeButtons(){return [...document.querySelectorAll('#dashboard .dashboard-mode-tab')]}
function activateDashboardModeV176(mode){
  const next=['overview','reminders','worldtime'].includes(mode)?mode:'overview';
  if(next!=='worldtime'&&typeof baseDashboardModeV176==='function'){
    baseDashboardModeV176(next);
  }else{
    try{window.dashboardMode=next}catch(_){}
    dashboardModeButtons().forEach(button=>button.classList.toggle('active',button.dataset.dashboardMode===next));
    $('dashboardOverviewMode')?.classList.toggle('active',next==='overview');
    $('dashboardReminderMode')?.classList.toggle('active',next==='reminders');
  }
  const world=$('worldtime');
  world?.classList.toggle('active',next==='worldtime');
  if(next==='worldtime'){
    dashboardModeButtons().forEach(button=>{
      const active=button.dataset.dashboardMode==='worldtime';
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
    $('dashboardOverviewMode')?.classList.remove('active');
    $('dashboardReminderMode')?.classList.remove('active');
    try{window.renderWorldTime?.()}catch(_){try{renderWorldTime()}catch(__){}}
  }else{
    dashboardModeButtons().forEach(button=>button.setAttribute('aria-selected',button.classList.contains('active')?'true':'false'));
  }
}
function installDashboardWorldTimeV176(){
  const dashboard=$('dashboard'),world=$('worldtime'),reminder=$('dashboardReminderMode');
  if(!dashboard||!world)return false;
  if(world.parentElement!==dashboard){
    world.classList.remove('section');
    world.classList.add('dashboard-mode-panel','mws-dashboard-worldtime-v176');
    world.classList.remove('active');
    if(reminder?.parentElement===dashboard)reminder.insertAdjacentElement('afterend',world);
    else dashboard.appendChild(world);
  }
  if(!baseDashboardModeV176&&typeof window.setDashboardMode==='function')baseDashboardModeV176=window.setDashboardMode.bind(window);
  dashboardModeButtons().forEach(button=>{
    button.onclick=event=>{
      event.preventDefault();
      activateDashboardModeV176(button.dataset.dashboardMode);
    };
  });
  return true;
}

/* Friend Finder > Target List */
function friendFinderNavButtonV176(){
  const nav=document.querySelector('.nav-scroll')||document.querySelector('.sidebar .nav');
  if(!nav)return null;
  let button=nav.querySelector('button[data-tab="friendFinder"]');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.dataset.tab='friendFinder';
    button.title='친구 찾기';
    button.innerHTML='<span class="nav-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M13 20a4.5 4.5 0 0 1 8 0"/></svg></span><span class="nav-label">친구 찾기</span>';
    const sniper=nav.querySelector('button[data-tab="sniper"]');
    const memos=nav.querySelector('button[data-tab="memos"]');
    if(sniper)sniper.insertAdjacentElement('afterend',button);
    else if(memos)nav.insertBefore(button,memos);
    else nav.appendChild(button);
  }
  button.hidden=true;
  button.style.setProperty('display','none','important');
  button.onclick=event=>{event.preventDefault();window.setTab?.('friendFinder')};
  return button;
}
function friendTabsMarkupV176(active){
  return `<div class="mws-friend-tabs-v176" role="tablist" aria-label="친구 찾기 보기">
    <button type="button" class="mws-friend-tab-v176 ${active==='friendFinder'?'active':''}" data-friend-view-v176="friendFinder" role="tab" aria-selected="${active==='friendFinder'?'true':'false'}">친구 찾기</button>
    <button type="button" class="mws-friend-tab-v176 ${active==='targets'?'active':''}" data-friend-view-v176="targets" role="tab" aria-selected="${active==='targets'?'true':'false'}">저격 리스트</button>
  </div>`;
}
function bindFriendTabsV176(root){
  root.querySelectorAll('[data-friend-view-v176]').forEach(button=>{
    button.onclick=()=>window.setTab?.(button.dataset.friendViewV176);
  });
}
/* Contacts owns the former standalone recent/friend routes. Keep their sections
   and underlying renderers intact, including the nested target list. */
const contactRoutesV176=['contacts','sniper','friendFinder','targets'];
const contactViewsV176=[['contacts','연락처'],['sniper','최근 만난 사람'],['friendFinder','친구 찾기']];
function contactViewV176(tab){return tab==='targets'?'friendFinder':tab}
function syncContactNavigationV176(tab){
  const grouped=contactRoutesV176.includes(tab);
  const nav=document.querySelector('.nav-scroll')||document.querySelector('.sidebar .nav');
  if(grouped){
    nav?.querySelector('button[data-tab="contacts"]')?.classList.add('active');
    const title=$('pageTitle');
    if(title&&title.textContent!=='연락처')title.textContent='연락처';
  }
  nav?.querySelectorAll('button[data-tab="sniper"],button[data-tab="friendFinder"]').forEach(button=>{
    button.hidden=true;
    if(button.style.getPropertyValue('display')!=='none'||button.style.getPropertyPriority('display')!=='important')button.style.setProperty('display','none','important');
    button.classList.remove('active');
  });
  document.querySelectorAll('[data-contact-view-v176]').forEach(button=>{
    const selected=grouped&&button.dataset.contactViewV176===contactViewV176(tab);
    button.classList.toggle('active',selected);
    button.setAttribute('aria-selected',String(selected));
  });
}
function installContactTabsV176(){
  for(const id of contactRoutesV176){
    const section=$(id);
    if(!section||section.querySelector('.mws-contact-tabs-v176'))continue;
    const tabs=document.createElement('div');
    tabs.className='mws-contact-tabs-v176';
    tabs.setAttribute('role','tablist');
    tabs.setAttribute('aria-label','연락처 보기');
    for(const [target,label] of contactViewsV176){
      const button=document.createElement('button');
      button.type='button';
      button.className='mws-contact-tab-v176';
      button.dataset.contactViewV176=target;
      button.setAttribute('role','tab');
      button.setAttribute('aria-selected','false');
      button.textContent=label;
      button.onclick=()=>window.setTab?.(target);
      tabs.append(button);
    }
    section.prepend(tabs);
  }
  syncContactNavigationV176(document.querySelector('.section.active')?.id||'');
}
function installFriendTargetsV176(){
  const targets=$('targets');
  const friend=$('friendFinder');
  document.querySelectorAll('.nav button[data-tab="targets"]').forEach(button=>button.remove());
  friendFinderNavButtonV176();
  if(!targets)return false;
  if(!targets.querySelector('.mws-friend-tabs-v176')){
    targets.insertAdjacentHTML('afterbegin',friendTabsMarkupV176('targets'));
    bindFriendTabsV176(targets);
  }
  if(friend&&!friend.querySelector('.mws-friend-tabs-v176')){
    friend.insertAdjacentHTML('afterbegin',friendTabsMarkupV176('friendFinder'));
    bindFriendTabsV176(friend);
  }
  const active=document.querySelector('.section.active')?.id||'';
  document.querySelectorAll('.mws-friend-tabs-v176').forEach(tabs=>{
    tabs.querySelectorAll('[data-friend-view-v176]').forEach(button=>{
      const selected=button.dataset.friendViewV176===active;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-selected',selected?'true':'false');
    });
  });
  installContactTabsV176();
  return Boolean(friend);
}

/* Notebook > Patch Notes / Suggestions */
let notebookViewV176='';
let composerTypeV176='patch';
function ensureNotebookDataV176(){
  const d=rootData();
  if(!d)return null;
  if(!Array.isArray(d.patchNotes))d.patchNotes=[];
  if(!Array.isArray(d.suggestions))d.suggestions=[];
  return d;
}
function cardListV176(type){
  const d=ensureNotebookDataV176();
  return type==='patch'?(d?.patchNotes||[]):(d?.suggestions||[]);
}
function renderNotebookCardsV176(type){
  const list=$(type==='patch'?'patchNoteCardsV176':'suggestionCardsV176');
  if(!list)return;
  const rows=[...cardListV176(type)].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  const markup=rows.length?rows.map(item=>`
    <article class="mws-note-card-v176">
      <div class="mws-note-card-head-v176">
        <strong>${esc(item.author||'작성자 미상')}</strong>
        <time datetime="${esc(item.createdAt||'')}">${esc(formatCreatedAt(item.createdAt))}</time>
      </div>
      <div class="mws-note-card-content-v176">${esc(item.content||'')}</div>
    </article>`).join(''):`<div class="mws-note-empty-v176">${type==='patch'?'등록된 패치노트가 없습니다.':'등록된 건의가 없습니다.'}</div>`;
  // Do not replace existing cards or notify mutation observers for unchanged data.
  if(notebookMarkupV176.get(list)===markup&&list.childElementCount)return;
  list.innerHTML=markup;
  notebookMarkupV176.set(list,markup);
}
const notebookMarkupV176=new WeakMap();
function setNotebookViewV176(view){
  notebookViewV176=['patch','suggestions'].includes(view)?view:'';
  const builtInIds=['memoLibraryView','memoFavoritesView'];
  if(notebookViewV176){
    builtInIds.forEach(id=>$(id)?.classList.remove('active'));
    document.querySelectorAll('.memo-section-tab').forEach(button=>button.classList.toggle('active',button.dataset.memoView===notebookViewV176));
    $('memoPatchViewV176')?.classList.toggle('active',notebookViewV176==='patch');
    $('memoSuggestionViewV176')?.classList.toggle('active',notebookViewV176==='suggestions');
    renderNotebookCardsV176(notebookViewV176==='patch'?'patch':'suggestions');
  }else{
    $('memoPatchViewV176')?.classList.remove('active');
    $('memoSuggestionViewV176')?.classList.remove('active');
  }
}
async function openComposerV176(type){
  try{await window.mwsV55EnsureParts?.('memos')}catch(_){}
  ensureNotebookDataV176();
  composerTypeV176=type==='suggestions'?'suggestions':'patch';
  const modal=$('memoEntryComposerV176');
  if(!modal)return;
  const title=$('memoComposerTitleV176');
  if(title)title.textContent=composerTypeV176==='patch'?'신규 패치':'새 건의';
  const author=$('memoComposerAuthorV176'),content=$('memoComposerContentV176');
  if(author)author.value='';
  if(content)content.value='';
  modal.classList.add('open');
  document.body.classList.add('modal-active');
  setTimeout(()=>author?.focus(),0);
}
function closeComposerV176(){$('memoEntryComposerV176')?.classList.remove('open');document.body.classList.remove('modal-active')}
function saveComposerV176(){
  const author=String($('memoComposerAuthorV176')?.value||'').trim();
  const content=String($('memoComposerContentV176')?.value||'').trim();
  if(!author)return window.toast?.('작성자','작성자 이름을 입력해 주세요.');
  if(!content)return window.toast?.('내용','내용을 입력해 주세요.');
  const d=ensureNotebookDataV176();
  if(!d)return;
  const row={id:uid(),author,content,createdAt:new Date().toISOString()};
  if(composerTypeV176==='patch')d.patchNotes.push(row);
  else d.suggestions.push(row);
  save(composerTypeV176==='patch'?'패치노트 추가':'건의함 추가');
  closeComposerV176();
  renderNotebookCardsV176(composerTypeV176);
  window.toast?.(composerTypeV176==='patch'?'패치노트':'건의함','새 항목을 등록했습니다.');
}
function installNotebookViewsV176(){
  const section=$('memos'),tabs=section?.querySelector('.memo-section-tabs');
  if(!section||!tabs)return false;
  let patchTab=$('memoPatchTabV176');
  if(!patchTab){
    patchTab=document.createElement('button');
    patchTab.type='button';patchTab.id='memoPatchTabV176';
    patchTab.className='memo-section-tab';patchTab.dataset.memoView='patch';patchTab.textContent='패치노트';
    tabs.appendChild(patchTab);
  }
  let suggestionTab=$('memoSuggestionTabV176');
  if(!suggestionTab){
    suggestionTab=document.createElement('button');
    suggestionTab.type='button';suggestionTab.id='memoSuggestionTabV176';
    suggestionTab.className='memo-section-tab';suggestionTab.dataset.memoView='suggestions';suggestionTab.textContent='건의함';
    tabs.appendChild(suggestionTab);
  }
  if(!$('memoPatchViewV176')){
    section.insertAdjacentHTML('beforeend',`
      <div id="memoPatchViewV176" class="memo-section-view mws-note-view-v176">
        <div class="toolbar mws-note-toolbar-v176"><div><div class="mws-note-title-v176">패치노트</div><div class="subtle">MWS 변경사항을 작성자와 함께 기록합니다. 작성 날짜는 자동으로 저장됩니다.</div></div><button type="button" class="primary" id="newPatchNoteBtnV176">신규 패치</button></div>
        <div id="patchNoteCardsV176" class="mws-note-card-grid-v176"></div>
      </div>
      <div id="memoSuggestionViewV176" class="memo-section-view mws-note-view-v176">
        <div class="toolbar mws-note-toolbar-v176"><div><div class="mws-note-title-v176">건의함</div><div class="subtle">작성자와 건의 내용을 카드 형태로 기록합니다. 작성 날짜는 자동으로 저장됩니다.</div></div><button type="button" class="primary" id="newSuggestionBtnV176">새 건의</button></div>
        <div id="suggestionCardsV176" class="mws-note-card-grid-v176"></div>
      </div>`);
  }
  if(!$('memoEntryComposerV176')){
    document.body.insertAdjacentHTML('beforeend',`
      <div id="memoEntryComposerV176" class="modal" aria-hidden="true">
        <div class="modalbox mws-note-composer-v176">
          <div class="space"><div><h2 id="memoComposerTitleV176">신규 패치</h2><div class="muted small">작성 날짜는 저장 시 자동으로 기록됩니다.</div></div><button type="button" class="ghost" id="memoComposerCloseV176">닫기</button></div>
          <div class="field"><label>작성자</label><input id="memoComposerAuthorV176" autocomplete="name" placeholder="작성자 이름"></div>
          <div class="field"><label>내용</label><textarea id="memoComposerContentV176" rows="10" placeholder="내용을 입력해 주세요"></textarea></div>
          <div class="mws-note-composer-actions-v176"><button type="button" class="secondary" id="memoComposerCancelV176">취소</button><button type="button" class="primary" id="memoComposerSaveV176">등록</button></div>
        </div>
      </div>`);
  }
  patchTab.onclick=()=>setNotebookViewV176('patch');
  suggestionTab.onclick=()=>setNotebookViewV176('suggestions');
  ['memoLibraryTab','memoFavoritesTab'].forEach(id=>{
    const button=$(id);
    if(button&&!button.dataset.mwsWorkspaceV176){
      button.dataset.mwsWorkspaceV176='1';
      button.addEventListener('click',()=>setNotebookViewV176(''));
    }
  });
  $('newPatchNoteBtnV176').onclick=()=>openComposerV176('patch');
  $('newSuggestionBtnV176').onclick=()=>openComposerV176('suggestions');
  $('memoComposerCloseV176').onclick=closeComposerV176;
  $('memoComposerCancelV176').onclick=closeComposerV176;
  $('memoComposerSaveV176').onclick=saveComposerV176;
  const modal=$('memoEntryComposerV176');
  modal.onclick=event=>{if(event.target===modal)closeComposerV176()};
  renderNotebookCardsV176('patch');
  renderNotebookCardsV176('suggestions');
  const nav=document.querySelector('.nav button[data-tab="memos"]');
  if(nav){nav.title='수첩';const label=nav.querySelector('.nav-label');if(label&&label.textContent!=='수첩')label.textContent='수첩'}
  return true;
}

/* Content Planner visible name -> Drawing Board */
function enforceDrawingBoardLabelV176(){
  const button=document.querySelector('.nav button[data-tab="contentPlanner"]');
  if(button){button.title='그림판';const label=button.querySelector('.nav-label');if(label&&label.textContent!=='그림판')label.textContent='그림판'}
  if(document.getElementById('contentPlanner')?.classList.contains('active')){
    const title=$('pageTitle');if(title&&title.textContent!=='그림판')title.textContent='그림판';
  }
}

/* The legacy sidebar organizer moves the game divider after the notebook.
   Re-anchor the standalone achievement entry and chat game after all loaders. */
function enforceExhibitionNavigationV176(){
  const nav=document.querySelector('.nav-scroll');
  if(!nav)return;
  const button=id=>nav.querySelector('button[data-tab="'+id+'"]');
  const memo=button('memos'),achievement=button('achievements'),gacha=button('gameMultiDraw'),chat=button('gameMajoku');
  const timeline=button('careerTimeline');
  if(memo&&timeline&&memo.nextElementSibling!==timeline)memo.after(timeline);
  const beforeAchievement=timeline||memo;
  if(beforeAchievement&&achievement&&beforeAchievement.nextElementSibling!==achievement)beforeAchievement.after(achievement);
  if(gacha&&chat&&gacha.nextElementSibling!==chat)gacha.after(chat);
  if(chat){
    if(chat.title!=='채팅연동게임')chat.title='채팅연동게임';
    const label=chat.querySelector('.nav-label');
    if(label&&label.textContent!=='채팅연동게임')label.textContent='채팅연동게임';
  }
  if($('gameMajoku')?.classList.contains('active')){
    const title=$('pageTitle');if(title&&title.textContent!=='채팅연동게임')title.textContent='채팅연동게임';
  }
}
function syncGroupedNavigationV176(tab){
  installContactTabsV176();
  syncContactNavigationV176(tab);
  document.querySelectorAll('.mws-friend-tabs-v176').forEach(tabs=>{
    tabs.querySelectorAll('[data-friend-view-v176]').forEach(button=>{
      const selected=button.dataset.friendViewV176===tab;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-selected',selected?'true':'false');
    });
  });
  enforceDrawingBoardLabelV176();
  enforceExhibitionNavigationV176();
}

function installSetTabBridgeV176(){
  if(window.__mwsWorkspaceSetTabBridgeV176)return;
  if(typeof window.setTab!=='function')return;
  window.__mwsWorkspaceSetTabBridgeV176=true;
  baseSetTabV176=window.setTab;
  const wrapped=function(tab){
    if(tab==='friendFinder'&&!$('friendFinder')){
      window.mwsEnsureFriendFinderV5?.();
      if(!$('friendFinder')){
        if(typeof toast==='function')toast('친구 찾기','친구 찾기를 준비 중입니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
    }
    if(tab==='worldtime'){
      const result=baseSetTabV176.call(this,'dashboard');
      installDashboardWorldTimeV176();
      activateDashboardModeV176('worldtime');
      return result;
    }
    const result=baseSetTabV176.apply(this,arguments);
    if(tab==='dashboard')installDashboardWorldTimeV176();
    syncGroupedNavigationV176(tab);
    return result;
  };
  window.setTab=wrapped;
  try{setTab=wrapped}catch(_){}
  friendFinderNavButtonV176();
}

let installQueued=false;
function installAllV176(){
  installQueued=false;
  installDashboardWorldTimeV176();
  installFriendTargetsV176();
  installNotebookViewsV176();
  enforceDrawingBoardLabelV176();
  enforceExhibitionNavigationV176();
  installSetTabBridgeV176();
}
function queueInstallV176(){
  if(installQueued||document.hidden)return;
  installQueued=true;
  requestAnimationFrame(installAllV176);
}

// The workspace owns navigation and section shells, not the changing contents
// of calendars, mini-games, clocks, live cards or notebook result lists.
const workspaceShellV176='.nav,.nav-scroll,.main,#dashboard,#worldtime,#memos,#contacts,#sniper,#friendFinder,#targets,.dashboard-mode-tabs,.memo-section-tabs';
const observer=new MutationObserver(records=>{
  if(records.some(record=>record.target instanceof Element&&record.target.matches(workspaceShellV176)))queueInstallV176();
});
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueInstallV176()});
window.addEventListener('mws:parts-loaded',event=>{
  if((event?.detail?.parts||[]).includes('notebook')){
    ensureNotebookDataV176();
    renderNotebookCardsV176('patch');
    renderNotebookCardsV176('suggestions');
  }
  queueInstallV176();
});
window.addEventListener('mawang:datachange',event=>{
  const reason=String(event?.detail?.reason||'');
  if(reason.includes('패치노트')||reason.includes('건의함')){
    renderNotebookCardsV176('patch');
    renderNotebookCardsV176('suggestions');
  }
  queueInstallV176();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('memoEntryComposerV176')?.classList.contains('open'))closeComposerV176()});
window.__mwsWorkspaceUiMarkerV176='dashboard-worldtime-friend-target-notebook-cards-drawing-board';
installAllV176();
})();
