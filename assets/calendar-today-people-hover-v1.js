/* One floating preview for the entire month; no day-cell participant rail. */
(()=>{
  'use strict';
  const grid=document.getElementById('calendarGrid');
  const calendar=document.getElementById('calendar');
  if(!grid||!calendar||grid.dataset.peopleHoverReady)return;
  grid.dataset.peopleHoverReady='1';
  const selector='[data-calendar-people-date]';
  let popup=null,anchor=null;
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el};
  function hide(){
    if(anchor)anchor.removeAttribute('aria-describedby');
    anchor=null;if(popup)popup.hidden=true;
  }
  function people(date){
    if(typeof data==='undefined'||!data)return [];
    // Reuse the indexed activity map, excluding self and missing contacts.
    const ids=new Set((data.todayPeopleByDate?.[date]||[]).map(String));
    return (data.contacts||[]).filter(c=>c&&c.id!==data.selfContactId&&ids.has(String(c.id)));
  }
  function show(button){
    if(!calendar.classList.contains('active')||document.querySelector('.modal.open')||document.body.classList.contains('calendar-pointer-template-dragging')||document.body.classList.contains('calendar-copy-source-dragging'))return;
    if(anchor===button&&!popup?.hidden)return;
    hide();
    if(!popup){popup=make('div');popup.id='calendarPeopleHoverV1';popup.setAttribute('role','tooltip');popup.hidden=true;document.body.append(popup)}
    const found=people(button.dataset.calendarPeopleDate);
    popup.replaceChildren(make('strong','','오늘 함께한 사람 · '+found.length+'명'));
    if(found.length){
      const list=make('div','calendar-people-names-v1');
      for(const person of found.slice(0,12)){
        const row=make('div','calendar-people-person-v1');
        const fallback=()=>make('span','calendar-people-avatar-v1',String(person.name||'?').slice(0,2));
        if(person.image){const img=make('img');img.alt='';img.src=person.image;img.decoding='async';img.addEventListener('error',()=>img.replaceWith(fallback()),{once:true});row.append(img)}else row.append(fallback());
        row.append(make('span','',person.name||'이름 없음'));list.append(row);
      }
      popup.append(list);
    }
    popup.append(make('small','',found.length>12?`외 ${found.length-12}명 · 날짜 클릭하여 전체 보기`:'날짜 클릭하여 등록 및 수정'));
    popup.hidden=false;anchor=button;button.setAttribute('aria-describedby',popup.id);
    const r=button.getBoundingClientRect(),w=popup.offsetWidth,h=popup.offsetHeight;
    popup.style.left=Math.max(10,Math.min(innerWidth-w-10,r.left+(r.width-w)/2))+'px';
    popup.style.top=Math.max(10,Math.min(innerHeight-h-10,r.bottom+7+h<=innerHeight-10?r.bottom+7:r.top-h-7))+'px';
  }
  const buttonFrom=e=>e.target instanceof Element?e.target.closest(selector):null;
  grid.addEventListener('pointerover',e=>{const button=buttonFrom(e);if(button&&e.pointerType!=='touch')show(button)});
  grid.addEventListener('pointerout',e=>{const button=buttonFrom(e);if(button&&anchor===button&&!button.contains(e.relatedTarget))hide()});
  grid.addEventListener('focusin',e=>{const button=buttonFrom(e);if(button&&button.matches(':focus-visible'))show(button)});
  grid.addEventListener('focusout',e=>{if(buttonFrom(e)===anchor)hide()});
  // Capture before the existing day click handler, including keyboard activation.
  grid.addEventListener('click',e=>{const button=buttonFrom(e);if(!button)return;e.preventDefault();e.stopImmediatePropagation();hide();window.mwsCalendarDetailsV1?.close({restoreFocus:false});if(typeof window.openTodayPeoplePicker==='function')window.openTodayPeoplePicker(button.dataset.calendarPeopleDate)},true);
  grid.addEventListener('pointerleave',hide);grid.addEventListener('pointerdown',hide);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});
  window.addEventListener('scroll',hide,{passive:true,capture:true});window.addEventListener('resize',hide,{passive:true});
  new MutationObserver(hide).observe(grid,{childList:true});
  new MutationObserver(hide).observe(calendar,{attributes:true,attributeFilter:['class','data-calendar-view-mode','data-mobile-calendar-view']});
})();
