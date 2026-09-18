/* Mawang Scheduler v1.3.0 - mobile calendar day detail sheet */
(()=>{
'use strict';
if(window.__mwsMobileCalendarDayDetailV130)return;
window.__mwsMobileCalendarDayDetailV130=true;

const calendar=document.getElementById('calendar');
const grid=document.getElementById('calendarGrid');
if(!calendar||!grid)return;

const SHEET_ID='mwsMobileCalendarDayDetailV130';
let selectedDate='';
let decorateQueued=false;

function getData(){
  try{return data||{}}catch(_){return window.data||{}}
}
function esc(value=''){
  return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}
function isMobile(){
  return document.body.dataset.deviceMode==='mobile'||document.body.dataset.resolution==='mobile';
}
function isMobileMonth(){
  return isMobile()&&calendar.classList.contains('active')&&calendar.dataset.mobileCalendarView==='month';
}
function eventList(){
  try{
    if(typeof activeEvents==='function')return activeEvents();
  }catch(_){}
  return (getData().events||[]).filter(event=>event&&!event.completed);
}
function eventsForDate(date){
  return eventList().filter(event=>event?.date===date).sort((a,b)=>{
    if(a.restDay&&!b.restDay)return-1;
    if(!a.restDay&&b.restDay)return 1;
    const at=a.start==='TBD'?'99:99':String(a.start||'99:99');
    const bt=b.start==='TBD'?'99:99':String(b.start||'99:99');
    return at.localeCompare(bt);
  });
}
function eventById(id){
  return (getData().events||[]).find(event=>String(event?.id||'')===String(id||''))||null;
}
function dateLabel(date){
  const parsed=new Date(date+'T12:00:00');
  if(Number.isNaN(parsed.getTime()))return date;
  return new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(parsed);
}
function timeLabel(event){
  if(event?.restDay)return '하루 종일';
  const start=event?.start&&event.start!=='TBD'?event.start:'미정';
  const end=event?.end&&event.end!=='TBD'?event.end:'';
  return end&&start!=='미정'?start+' - '+end:start;
}
function categoryName(event){
  const row=(getData().categories||[]).find(item=>String(item?.id||'')===String(event?.categoryId||''));
  return String(row?.name||'').trim();
}
function participantItems(event){
  const d=getData();
  const contacts=new Map((d.contacts||[]).map(person=>[String(person?.id||''),person]));
  return (event?.participants||[]).map(id=>{
    const person=contacts.get(String(id));
    if(!person)return null;
    return {
      id:String(id),
      name:String(person.name||'이름 없음'),
      image:String(person.image||'').trim(),
      status:event?.participantStatuses?.[id]==='planned'?'예정':'확정'
    };
  }).filter(Boolean);
}
function initials(name){
  return String(name||'?').trim().slice(0,2)||'?';
}
function participantVisuals(event){
  const rows=participantItems(event);
  if(!rows.length)return '<span class="mws-mobile-day-none-v130">등록된 참가자 없음</span>';
  return rows.map(person=>`<span class="mws-mobile-day-person-v130">
    <span class="mws-mobile-day-person-avatar-v130">${person.image?`<img src="${esc(person.image)}" alt="${esc(person.name)}" data-mws-fallback-name="${esc(person.name)}" loading="lazy">`:`<span>${esc(initials(person.name))}</span>`}</span>
    <span class="mws-mobile-day-person-copy-v130"><strong>${esc(person.name)}</strong><small>${esc(person.status)}</small></span>
  </span>`).join('');
}
function gameVisual(event){
  const game=event?.steamGame&&typeof event.steamGame==='object'?event.steamGame:null;
  const name=String(game?.name||'').trim();
  if(!name)return '<span class="mws-mobile-day-none-v130">연결된 게임 없음</span>';
  const image=String(game?.image||game?.headerImage||'').trim();
  const appid=String(game?.appid??game?.appId??'').trim();
  return `<span class="mws-mobile-day-game-v130">
    ${image?`<img class="mws-mobile-day-game-image-v130" src="${esc(image)}" alt="${esc(name)}" loading="lazy">`:'<span class="mws-mobile-day-game-placeholder-v130">GAME</span>'}
    <span class="mws-mobile-day-game-copy-v130"><strong>${esc(name)}</strong>${appid?`<small>Steam App ${esc(appid)}</small>`:''}</span>
  </span>`;
}
function replaceBrokenDetailImage(target){
  if(!(target instanceof HTMLImageElement))return;
  if(target.classList.contains('mws-mobile-day-game-image-v130')){
    const fallback=document.createElement('span');
    fallback.className='mws-mobile-day-game-placeholder-v130';
    fallback.textContent='GAME';
    target.replaceWith(fallback);
    return;
  }
  const avatar=target.closest('.mws-mobile-day-person-avatar-v130');
  if(!avatar)return;
  const fallback=document.createElement('span');
  fallback.textContent=initials(target.dataset.mwsFallbackName||target.alt||'?');
  target.replaceWith(fallback);
}
function syncNavOffset(root=document.getElementById(SHEET_ID)){
  if(!root)return;
  const nav=document.querySelector('.mws-mobile-tabs');
  const rect=nav?.getBoundingClientRect?.();
  const height=rect&&rect.height>0?Math.ceil(rect.height):68;
  root.style.setProperty('--mws-mobile-nav-offset-v130',height+'px');
}
function ensureSheet(){
  let root=document.getElementById(SHEET_ID);
  if(root)return root;
  root=document.createElement('div');
  root.id=SHEET_ID;
  root.className='mws-mobile-calendar-day-detail-v130';
  root.setAttribute('aria-hidden','true');
  root.innerHTML=`
    <div class="mws-mobile-day-backdrop-v130" data-mws-day-close="1"></div>
    <section class="mws-mobile-day-sheet-v130" role="dialog" aria-modal="false" aria-labelledby="mwsMobileDayTitleV130">
      <div class="mws-mobile-day-handle-v130" aria-hidden="true"></div>
      <div class="mws-mobile-day-head-v130">
        <div>
          <div class="mws-mobile-day-kicker-v130">CONTENTS</div>
          <h2 id="mwsMobileDayTitleV130"></h2>
          <div id="mwsMobileDayCountV130" class="mws-mobile-day-count-v130"></div>
        </div>
        <button type="button" class="mws-mobile-day-close-v130" data-mws-day-close="1" aria-label="닫기">×</button>
      </div>
      <div id="mwsMobileDayListV130" class="mws-mobile-day-list-v130"></div>
    </section>`;
  document.body.appendChild(root);
  syncNavOffset(root);

  root.addEventListener('error',event=>{
    replaceBrokenDetailImage(event.target);
  },true);

  root.addEventListener('click',event=>{
    const close=event.target.closest?.('[data-mws-day-close]');
    if(close){closeSheet();return}
    const card=event.target.closest?.('[data-mws-event-id]');
    if(!card)return;
    const id=card.dataset.mwsEventId;
    if(!id||!eventById(id))return;
    event.preventDefault();
    event.stopPropagation();
    closeSheet();
    requestAnimationFrame(()=>{
      try{
        if(typeof window.openEvent==='function')window.openEvent(id);
        else if(typeof openEvent==='function')openEvent(id);
      }catch(error){console.error('Mobile calendar event editor open failed',error)}
    });
  });
  return root;
}
function renderSheet(){
  const root=ensureSheet();
  const events=eventsForDate(selectedDate);
  const title=root.querySelector('#mwsMobileDayTitleV130');
  const count=root.querySelector('#mwsMobileDayCountV130');
  const list=root.querySelector('#mwsMobileDayListV130');
  if(title)title.textContent=dateLabel(selectedDate);
  if(count)count.textContent=events.length?events.length+'개의 컨텐츠':'등록된 컨텐츠 없음';
  if(!list)return;
  if(!events.length){
    list.innerHTML='<div class="mws-mobile-day-empty-v130">이 날짜에는 등록된 컨텐츠가 없습니다.</div>';
    return;
  }
  list.innerHTML=events.map(event=>{
    const color=event.restDay?'#e85d75':String(event.color||'#64748b');
    const category=categoryName(event);
    const description=String(event.description||'').trim();
    return `<button type="button" class="mws-mobile-day-event-v130" data-mws-event-id="${esc(event.id)}" style="--mws-day-event-color:${esc(color)}">
      <span class="mws-mobile-day-event-title-v130">${esc(event.restDay?'휴방':event.title||'제목 없음')}</span>
      <span class="mws-mobile-day-event-time-v130">${esc(timeLabel(event))}</span>
      ${event.restDay?'':`<span class="mws-mobile-day-event-section-v130">
        <b>참가자</b>
        <span class="mws-mobile-day-people-v130">${participantVisuals(event)}</span>
      </span>
      <span class="mws-mobile-day-event-section-v130">
        <b>게임</b>
        ${gameVisual(event)}
      </span>
      <span class="mws-mobile-day-event-row-v130"><b>환경</b><span>${esc(event.device||'미정')}${category?' · '+esc(category):''}</span></span>
      ${description?`<span class="mws-mobile-day-event-description-v130">${esc(description)}</span>`:''}`}
      <span class="mws-mobile-day-event-action-v130">눌러서 수정</span>
    </button>`;
  }).join('');
}
function openSheet(date){
  if(!isMobileMonth()||!date)return;
  selectedDate=date;
  const root=ensureSheet();
  syncNavOffset(root);
  renderSheet();
  root.classList.add('open');
  root.setAttribute('aria-hidden','false');
  document.body.classList.add('mws-mobile-day-detail-open-v130');
}
function closeSheet(){
  const root=document.getElementById(SHEET_ID);
  if(root){
    root.classList.remove('open');
    root.setAttribute('aria-hidden','true');
  }
  document.body.classList.remove('mws-mobile-day-detail-open-v130');
}
function decorateGrid(){
  decorateQueued=false;
  const mobile=isMobileMonth();

  grid.querySelectorAll('.day[data-date]').forEach(day=>{
    const miniEvents=[...day.querySelectorAll(':scope > .mini-event[data-evid]')];

    for(const child of [...day.children]){
      const keep=child.classList.contains('daynum')||child.classList.contains('mini-event');
      child.classList.toggle('mws-mobile-calendar-extra-v130',mobile&&!keep);
    }

    miniEvents.forEach((node,index)=>{
      const main=node.querySelector('.mini-event-main');
      node.classList.toggle('mws-mobile-event-hidden-v130',mobile&&index>=2);
      if(!main)return;
      if(!main.dataset.mwsMobileOriginalText)main.dataset.mwsMobileOriginalText=main.textContent||'';
      if(mobile){
        const event=eventById(node.dataset.evid);
        main.textContent=event?.restDay?'휴방':String(event?.title||'컨텐츠');
        node.setAttribute('draggable','false');
      }else{
        main.textContent=main.dataset.mwsMobileOriginalText;
        node.classList.remove('mws-mobile-event-hidden-v130');
        node.setAttribute('draggable','true');
      }
    });

    if(!mobile){
      day.removeAttribute('data-mobile-more');
      return;
    }
    const count=eventsForDate(day.dataset.date).length;
    day.dataset.mobileMore=count>2?'+'+(count-2):'';
    day.setAttribute('aria-label',dateLabel(day.dataset.date)+(count?' · 컨텐츠 '+count+'개':' · 컨텐츠 없음'));
  });
}
function queueDecorate(){
  if(decorateQueued)return;
  decorateQueued=true;
  requestAnimationFrame(decorateGrid);
}

document.addEventListener('click',event=>{
  if(!isMobileMonth())return;
  const target=event.target;
  if(!(target instanceof Element))return;
  const day=target.closest('#calendarGrid .day[data-date]');
  if(!day||!calendar.contains(day))return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openSheet(day.dataset.date);
},true);

document.addEventListener('click',event=>{
  const target=event.target;
  if(!(target instanceof Element))return;
  const navigationAction=target.closest('.mws-mobile-tabs [data-mobile-tab], .mobile-nav-toggle, .sidebar [data-tab]');
  if(!navigationAction)return;
  const root=document.getElementById(SHEET_ID);
  if(root?.classList.contains('open'))closeSheet();
},true);

document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeSheet();
});

new MutationObserver(queueDecorate).observe(grid,{childList:true,subtree:true});
new MutationObserver(()=>{
  if(!isMobileMonth())closeSheet();
  queueDecorate();
}).observe(document.body,{attributes:true,attributeFilter:['data-device-mode','data-resolution']});
new MutationObserver(()=>{
  if(!isMobileMonth())closeSheet();
  queueDecorate();
}).observe(calendar,{attributes:true,attributeFilter:['class','data-mobile-calendar-view']});

window.addEventListener('mawang:datachange',()=>{
  queueDecorate();
  const root=document.getElementById(SHEET_ID);
  if(root?.classList.contains('open')&&selectedDate)renderSheet();
});
window.addEventListener('mws:post-login-ui-ready',queueDecorate);
window.addEventListener('resize',()=>syncNavOffset(),{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(()=>syncNavOffset(),0),{passive:true});
queueDecorate();
})();
