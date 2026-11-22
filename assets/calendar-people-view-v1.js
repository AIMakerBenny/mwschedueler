/* Read-only date/person index over the existing Today People and event records. */
(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const monthKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  const compare=(a,b)=>String(a.start||'99:99').localeCompare(String(b.start||'99:99'));
  function build(source,month){
    const people=new Map((source.contacts||[]).filter(c=>c?.id&&String(c.id)!==String(source.selfContactId||'')).map(c=>[String(c.id),c]));
    const days=new Map(),validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&date.slice(0,7)===month;
    const person=(date,id)=>{
      id=String(id);if(!validDate(date)||!people.has(id))return null;
      if(!days.has(date))days.set(date,new Map());
      const group=days.get(date);if(!group.has(id))group.set(id,{id,contact:people.get(id),events:[],manual:false});return group.get(id);
    };
    // The manual map is authoritative. Older snapshots only have the merged map.
    const manual=source.todayPeopleManualByDate??source.todayPeopleByDate??{};
    for(const [date,ids] of Object.entries(manual))if(Array.isArray(ids)&&validDate(date))for(const id of ids){const p=person(date,id);if(p)p.manual=true}
    for(const event of source.events||[]){
      if(!event?.id||!validDate(event.date)||event.restDay||String(event.title||'').trim()==='휴방')continue;
      for(const id of new Set(Array.isArray(event.participants)?event.participants.map(String):[])){
        const p=person(event.date,id);if(p&&!p.events.some(e=>e.id===event.id))p.events.push(event);
      }
    }
    return {people,days:[...days].sort(([a],[b])=>a.localeCompare(b)).map(([date,group])=>({date,people:[...group.values()].sort((a,b)=>b.events.length-a.events.length||String(a.contact.name||'').localeCompare(String(b.contact.name||''),'ko')).map(p=>({...p,events:p.events.sort(compare) }))}))};
  }
  const panel=document.getElementById('calendarPeoplePanelV1');
  let state=null;
  function img(c){
    const address=String(c.image||'');
    const safe=/^(https?:\/\/|data:image\/(?:png|jpe?g|gif|webp|avif);base64,|\/[^/])/i.test(address);
    return `<span class="cp-avatar"><span>${esc(String(c.name||'?').slice(0,2))}</span>${safe?`<img src="${esc(address)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:''}</span>`;
  }
  function dateLabel(date){const day=new Date(date+'T12:00:00Z');return new Intl.DateTimeFormat('ko-KR',{weekday:'short',timeZone:'Asia/Seoul'}).format(day)}
  function eventLine(e){const start=e.start&&e.start!=='TBD'?String(e.start).slice(0,5):'미정';return `<button type="button" class="cp-event" data-cp-event="${esc(e.id)}" title="${esc(e.title||'일정')}"><time>${esc(start)}</time><span>${esc(e.title||'일정')}</span><span class="cp-chevron" aria-hidden="true">›</span></button>`}
  function renderDays(){
    if(!panel||!state)return;
    const filter=panel.querySelector('#calendarPeopleFilterV1').value;
    const rows=state.index.days.map(d=>({...d,people:d.people.filter(p=>!filter||p.id===filter)})).filter(d=>d.people.length);
    const unique=new Set(),events=new Set();for(const d of rows)for(const p of d.people){unique.add(p.id);for(const e of p.events)events.add(e.id)}
    panel.querySelector('#calendarPeopleMonthSummaryV1').textContent=`${state.month.slice(0,4)}년 ${Number(state.month.slice(5))}월 · ${rows.length}일 · ${unique.size}명 · 콘텐츠 ${events.size}개`;
    const list=panel.querySelector('#calendarPeopleDaysV1');
    list.innerHTML=rows.length?rows.map(d=>`<article class="cp-day${d.date===state.today?' is-today':''}"><header class="cp-date"><div class="cp-date-number"><strong>${Number(d.date.slice(8))}</strong><span>${dateLabel(d.date)}</span></div><div><span class="cp-date-full">${esc(d.date)}${d.date===state.today?' · 오늘':''}</span><b>${d.people.length}명</b></div><button type="button" class="cp-date-manage" data-cp-date="${esc(d.date)}" aria-label="${esc(d.date)} 오늘 함께한 사람 보기 및 수정">인원 보기 ›</button></header><div class="cp-people">${d.people.map(p=>`<div class="cp-person"><button type="button" class="cp-person-head" data-cp-person="${esc(p.id)}" title="${esc(p.contact.name||'이름 없음')} 기록 필터">${img(p.contact)}<span class="cp-person-name"><strong>${esc(p.contact.name||'이름 없음')}</strong><small>${p.events.length?`함께한 콘텐츠 ${p.events.length}개`:'날짜에 직접 등록'}</small></span><span class="cp-chevron" aria-hidden="true">›</span></button>${p.events.length?`<div class="cp-events">${p.events.map(eventLine).join('')}</div>`:'<div class="cp-manual">연결된 참가 콘텐츠 없음</div>'}</div>`).join('')}</div></article>`).join(''):'<div class="cp-empty">이 달에 기록된 만남이 없습니다.</div>';
  }
  function render(source,date,today){
    if(!panel)return;
    const month=monthKey(date),index=build(source,month),select=panel.querySelector('#calendarPeopleFilterV1'),old=select.value;
    state={month,today,index};
    const counts=new Map();for(const d of index.days)for(const p of d.people)counts.set(p.id,(counts.get(p.id)||0)+1);
    const options=[...index.people].sort(([a,x],[b,y])=>(counts.get(b)||0)-(counts.get(a)||0)||String(x.name||'').localeCompare(String(y.name||''),'ko'));
    select.innerHTML='<option value="">전체 인물</option>'+options.map(([id,c])=>`<option value="${esc(id)}">${esc(c.name||'이름 없음')}${counts.has(id)?` · ${counts.get(id)}일`:''}</option>`).join('');
    if(index.people.has(old))select.value=old;
    renderDays();
  }
  if(panel){
    panel.querySelector('#calendarPeopleFilterV1').addEventListener('change',renderDays);
    panel.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.dataset.cpEvent){window.openCalendarEventDetailsV1?.(button.dataset.cpEvent,button);return}
      if(button.dataset.cpDate){window.mwsCalendarDetailsV1?.close({restoreFocus:false});window.openTodayPeoplePicker?.(button.dataset.cpDate);return}
      if(button.dataset.cpPerson){const filter=panel.querySelector('#calendarPeopleFilterV1');filter.value=filter.value===button.dataset.cpPerson?'':button.dataset.cpPerson;renderDays();filter.focus({preventScroll:true})}
    });
    panel.addEventListener('error',event=>{if(event.target.tagName==='IMG')event.target.hidden=true},true);
  }
  window.mwsCalendarPeopleViewV1={build,render};
})();
