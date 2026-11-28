/* Anchored calendar detail popover and editor presentation. No storage writes. */
(function(root){
  'use strict';
  const $=id=>document.getElementById(id);
  let drawer,previousFocus,motion,current=null,anchor=null,renderedHTML='',motionGeneration=0,positionFrame=0;
  const clamp=(value,min,max)=>Math.min(Math.max(value,min),Math.max(min,max));
  function visibleAnchor(node){
    if(!node?.getClientRects().length)return false;
    const r=node.getBoundingClientRect(),list=node.closest('.calendar-day-events-v2'),clip=list?.getBoundingClientRect();
    return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<document.documentElement.clientWidth&&(!clip?.height||r.bottom>clip.top&&r.top<clip.bottom);
  }
  function findAnchor(id){
    if(!id.startsWith('day:')){
      const personEvent=[...document.querySelectorAll('#calendarPeoplePanelV1 [data-cp-event]')].find(el=>el.dataset.cpEvent===id&&visibleAnchor(el));
      if(personEvent)return personEvent;
    }
    const nodes=id.startsWith('day:')?document.querySelectorAll('#calendarGrid .day[data-date]'):document.querySelectorAll('#calendarGrid .mini-event[data-evid]');
    const node=[...nodes].find(el=>(id.startsWith('day:')?el.dataset.date===id.slice(4):el.dataset.evid===id)&&visibleAnchor(el));
    return id.startsWith('day:')?(node?.querySelector('.calendar-day-more-v2:not([hidden])')||node):node;
  }
  function place(){
    if(!current||drawer.hidden)return;
    if(!anchor?.isConnected)anchor=findAnchor(String(current.id));
    const rect=anchor?.getBoundingClientRect(),gap=8,pad=12;
    const w=drawer.offsetWidth,h=drawer.offsetHeight,vw=document.documentElement.clientWidth,vh=innerHeight;
    let x=(vw-w)/2,y=(vh-h)/2;
    if(rect&&rect.width&&rect.height){
      const right=vw-rect.right-pad,left=rect.left-pad;
      if(right>=w+gap||left>=w+gap){
        x=right>=w+gap?rect.right+gap:rect.left-w-gap;
        y=rect.top-12;
      }else{
        x=rect.left+(rect.width-w)/2;
        const below=vh-rect.bottom-pad,above=rect.top-pad;
        y=below>=h+gap?rect.bottom+gap:above>=h+gap?rect.top-h-gap:(vh-h)/2;
      }
    }
    drawer.style.left=clamp(x,pad,vw-w-pad)+'px';
    drawer.style.top=clamp(y,pad,vh-h-pad)+'px';
  }
  function queuePlace(event){
    if(!current||(event?.target instanceof Node&&drawer.contains(event.target)))return;
    cancelAnimationFrame(positionFrame);
    positionFrame=requestAnimationFrame(place);
  }
  function playMotion(open,from,finish){
    const generation=++motionGeneration;
    // Read the current composited offset before cancelling an interrupted motion.
    // The fixed anchor's left/top and measured layout dimensions never animate.
    const previousOffset=motion?getComputedStyle(drawer).translate:null;
    motion?.cancel();motion=null;
    const complete=()=>{if(generation!==motionGeneration)return;motion?.cancel();motion=null;finish?.()};
    // Standalone calendar pages and browser fixtures may load before the
    // workspace preference controller. Respect OS motion in that case only.
    if(!drawer.animate||(root.mwsMotionReduced?.()??root.matchMedia?.('(prefers-reduced-motion: reduce)').matches)){complete();return}
    const source=anchor?.getBoundingClientRect(),panel=drawer.getBoundingClientRect();
    const x=source&&panel.left>=source.right-1?-10:source&&panel.right<=source.left+1?10:0;
    const y=x?0:source&&panel.bottom<=source.top+1?8:-8;
    const offset=x+'px '+y+'px';
    const start=previousOffset&&previousOffset!=='none'?previousOffset:open?offset:'0px 0px';
    motion=drawer.animate([{opacity:from,translate:start},{opacity:open?1:0,translate:open?'0px 0px':offset}],{duration:open?240:140,easing:open?'cubic-bezier(.2,.75,.25,1)':'ease-in',fill:'both'});
    motion.finished.then(complete,()=>{});
  }
  function markSelected(id){
    document.querySelectorAll('#calendarGrid .mini-event[data-evid]').forEach(node=>{
      const selected=node.dataset.evid===id;
      node.classList.toggle('event-details-selected-v1',selected);
      node.setAttribute('aria-expanded',String(selected));
    });
    document.querySelectorAll('#calendarAgendaV1 :is([data-agenda-event],[data-agenda-track])').forEach(node=>{
      const selected=(node.dataset.agendaEvent||node.dataset.agendaTrack)===id;
      node.classList.toggle('mws-agenda-selected-v1',selected);
      node.setAttribute('aria-expanded',String(selected));
    });
  }
  function close({restoreFocus=true}={}){
    if(!drawer||!current)return;
    const from=Number(getComputedStyle(drawer).opacity);
    drawer.inert=true;drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    current=null;markSelected('');
    playMotion(false,from,()=>{
      if(!current){drawer.hidden=true;anchor=null;if(restoreFocus&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true})}
    });
  }
  function ensure(){
    if(drawer)return;
    drawer=document.createElement('aside');
    drawer.id='calendarEventDetailsV1';drawer.className='event-details-popover-v2';drawer.hidden=true;drawer.inert=true;
    drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','false');
    drawer.setAttribute('aria-label','일정 상세');drawer.setAttribute('aria-hidden','true');
    drawer.innerHTML='<header class="event-details-head-v1"><button type="button" class="event-details-action-v2" id="calendarDetailsEditV1" aria-label="일정 수정" title="수정"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z"/></svg></button><button type="button" class="event-details-action-v2" id="calendarDetailsCloseV1" aria-label="일정 상세 닫기" title="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><div class="event-details-body-v1" id="calendarDetailsBodyV1"></div>';
    document.body.append(drawer);
    drawer.addEventListener('click',event=>{const button=event.target.closest('[data-detail-event-v2]');if(button)root.openCalendarEventDetailsV1?.(button.dataset.detailEventV2)});
    document.addEventListener('click',event=>{
      if(!current||drawer.contains(event.target)||event.target.closest('.mini-event[data-evid],.calendar-day-more-v2,[data-cp-event],#calendarAgendaV1 [data-agenda-event],#calendarAgendaV1 [data-agenda-track],.modal.open'))return;
      const calendarBackground=event.target.closest('#calendarGrid');
      close({restoreFocus:false});
      // Dismissing the panel must not also create a new schedule.
      // A date-number click is an explicit Today People action, not a
      // background schedule-create click. Let the dedicated picker receive it.
      if(calendarBackground&&!event.target.closest('[data-calendar-people-date]')){event.preventDefault();event.stopImmediatePropagation()}
    },true);
    $('calendarDetailsCloseV1').onclick=()=>close();
    $('calendarDetailsEditV1').onclick=()=>{const edit=current?.onEdit;close({restoreFocus:false});edit?.()};
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&current&&!document.querySelector('.modal.open')){
        event.preventDefault();close();
      }
    });
    root.addEventListener('mawang:datachange',()=>current?.onRefresh?.());
    root.addEventListener('resize',queuePlace,{passive:true});
    document.addEventListener('scroll',queuePlace,{capture:true,passive:true});
    if(typeof ResizeObserver==='function')new ResizeObserver(()=>queuePlace()).observe(drawer);
  }
  function open(details){
    ensure();
    const opening=!current;
    const from=drawer.hidden?0:Number(getComputedStyle(drawer).opacity);
    const scroll=current?.id===details.id?$('calendarDetailsBodyV1').scrollTop:0;
    const nextAnchor=details.anchor||findAnchor(String(details.id));
    if(opening||nextAnchor&&current?.id!==details.id)previousFocus=nextAnchor||document.activeElement;
    if(nextAnchor)anchor=nextAnchor;
    else if(opening)anchor=null;
    current=details;
    drawer.setAttribute('aria-label',String(details.title||'일정')+' 상세');
    // HTML is generated and escaped by the application's calendar renderer.
    if(renderedHTML!==details.html){
      $('calendarDetailsBodyV1').innerHTML=details.html;
      for(const image of $('calendarDetailsBodyV1').querySelectorAll('img'))image.decoding='async';
      renderedHTML=details.html;
    }
    $('calendarDetailsBodyV1').scrollTop=scroll;
    $('calendarDetailsEditV1').hidden=typeof details.onEdit!=='function';
    drawer.inert=false;drawer.hidden=false;drawer.setAttribute('aria-hidden','false');markSelected(details.id);
    drawer.classList.add('open');
    drawer.style.setProperty('--event-detail-color',details.color||anchor?.style.getPropertyValue('--content-group-color')||'var(--accent)');
    place();
    if(opening){
      playMotion(true,from,()=>{$('calendarDetailsCloseV1').focus({preventScroll:true})});
    }
  }
  root.mwsCalendarDetailsV1=Object.freeze({open,close,isOpen:()=>Boolean(current),currentId:()=>current?String(current.id):''});
  // Mount the hidden popover shell once, so opening only populates content.
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();

  function initMonthViewport(){
    const grid=$('calendarGrid');if(!grid)return;
    let frame;
    function updateViewport(){
      if(!grid.getClientRects().length||innerWidth<901)return;
      const rows=Math.max(1,Math.ceil(grid.querySelectorAll('.day[data-date]').length/7));
      // Reserve the actual shell and panel bottom gutters, which vary by theme
      // and resolution. The grid's border box already includes its own padding.
      const px=value=>Number.parseFloat(value)||0;
      let bottomSpace=px(getComputedStyle(grid).marginBottom)+2;
      for(let node=grid.parentElement;node&&node!==document.documentElement;node=node.parentElement){
        const style=getComputedStyle(node);
        bottomSpace+=px(style.paddingBottom)+px(style.borderBottomWidth)+px(style.marginBottom);
      }
      const height=Math.max(240,innerHeight-grid.getBoundingClientRect().top-scrollY-Math.max(24,bottomSpace))+'px';
      if(grid.style.getPropertyValue('--calendar-week-count-v2')!==String(rows))grid.style.setProperty('--calendar-week-count-v2',rows);
      if(grid.style.getPropertyValue('--calendar-month-height-v2')!==height)grid.style.setProperty('--calendar-month-height-v2',height);
      const measurements=[...grid.querySelectorAll('.day[data-date]')].map(day=>{
        const list=day.querySelector('.calendar-day-events-v2');if(!list)return null;
        return {day,number:day.querySelector('.daynum'),count:list.querySelectorAll('.mini-event').length,overflow:list.scrollHeight>list.clientHeight+2};
      }).filter(Boolean);
      for(const {day,number,count,overflow} of measurements){
        let more=number?.querySelector('.calendar-day-more-v2');
        if(!more&&count){
          more=document.createElement('button');more.type='button';more.className='calendar-day-more-v2';number.append(more);
          more.title='이 날짜 일정 전체 보기';
          more.onclick=event=>{event.stopPropagation();root.openCalendarDayDetailsV2?.(day.dataset.date)};
        }
        if(more){
          const text=count+'개',label=day.dataset.date+' 일정 '+count+'개 전체 보기';
          if(more.textContent!==text)more.textContent=text;
          if(more.getAttribute('aria-label')!==label)more.setAttribute('aria-label',label);
          if(more.hidden===overflow)more.hidden=!overflow;
        }
      }
    }
    function fit(){cancelAnimationFrame(frame);frame=requestAnimationFrame(updateViewport)}
    new MutationObserver(fit).observe(grid,{childList:true});
    if(typeof ResizeObserver==='function'){
      const observer=new ResizeObserver(fit);observer.observe(grid);
      const header=document.querySelector('.topbar');if(header)observer.observe(header);
      const toolbar=document.querySelector('.calendar-topbar-v4');if(toolbar)observer.observe(toolbar);
    }
    root.addEventListener('resize',fit);root.addEventListener('mws:calendar-group-layout-v2',fit);fit();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMonthViewport,{once:true});else initMonthViewport();

  // The copy shelf is a non-modal overlay. Its contents and drag handlers remain
  // in the calendar, but its visibility never participates in month geometry.
  function initCopyTrayV4(){
    const section=$('calendar'),button=$('calendarCopyTrayToggleV4'),tray=$('calendarCopyTray'),closeButton=$('calendarCopyTrayCloseV4');
    if(!section||!button||!tray)return;
    const isOpen=()=>tray.classList.contains('is-open');
    const available=()=>section.classList.contains('active')&&(!section.dataset.calendarViewMode||section.dataset.calendarViewMode==='month')&&(document.body.dataset.deviceMode!=='mobile'||!section.dataset.mobileCalendarView||section.dataset.mobileCalendarView==='month');
    function position(){if(isOpen())tray.style.setProperty('--calendar-copy-tray-top-v4',Math.max(12,button.getBoundingClientRect().bottom+8)+'px')}
    function setOpen(open,restoreFocus=false){
      open=Boolean(open&&available());
      tray.classList.toggle('is-open',open);tray.hidden=!open;tray.setAttribute('aria-hidden',String(!open));tray.inert=!open;
      button.setAttribute('aria-expanded',String(open));
      if(open)position();else if(restoreFocus)button.focus({preventScroll:true});
    }
    button.addEventListener('click',()=>setOpen(!isOpen()));
    closeButton?.addEventListener('click',()=>setOpen(false,true));
    document.addEventListener('click',event=>{if(isOpen()&&!tray.contains(event.target)&&!button.contains(event.target))setOpen(false)});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&isOpen()){setOpen(false,true)}});
    root.addEventListener('resize',position,{passive:true});root.addEventListener('scroll',position,{passive:true});
    new MutationObserver(()=>{if(!available())setOpen(false)}).observe(section,{attributes:true,attributeFilter:['class','data-calendar-view-mode','data-mobile-calendar-view']});
    setOpen(false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCopyTrayV4,{once:true});else initCopyTrayV4();

})(window);

/* Optional wide-screen agenda; one live calendar dataset, no fetch or save.
   Default month geometry is untouched. The existing event popover owns details. */
(()=>{
  const grid=document.getElementById('calendarGrid'),month=document.getElementById('calendarMonthPanelV172'),toggle=document.getElementById('calendarAgendaToggleV1'),panel=document.getElementById('calendarAgendaV1');
  if(!grid||!month||!toggle||!panel)return;
  const q=s=>panel.querySelector(s),dateInput=q('[data-agenda-date]'),list=q('[data-agenda-list]'),heading=q('[data-agenda-heading]'),count=q('[data-agenda-count]'),prev=q('[data-agenda-prev]'),next=q('[data-agenda-next]'),todayButton=q('[data-agenda-today]');
  const wide=matchMedia('(min-width:1700px)'),section=month.closest('#calendar');
  let selected='',opened=false,lastSignature='',dateSignature='',hoverId='',focusId='',linkedNodes=[];
  const allowed=()=>section?.classList.contains('active')&&wide.matches&&document.body.dataset.deviceMode!=='mobile'&&document.body.dataset.resolution!=='mobile'&&month.classList.contains('active')&&!month.hidden;
  const dates=()=>[...grid.querySelectorAll('.day:not(.out)[data-date]')].map(e=>e.dataset.date);
  const dateToday=()=>typeof todayKST==='function'?todayKST():new Date(Date.now()+9*3600000).toISOString().slice(0,10);
  function mark(){
    for(const node of grid.querySelectorAll('.mws-agenda-date-v1'))node.classList.remove('mws-agenda-date-v1');
    if(opened)for(const day of grid.querySelectorAll('.day[data-date]'))if(day.dataset.date===selected)day.classList.add('mws-agenda-date-v1');
  }
  function timeLabel(e){
    if(e.restDay)return '휴방';
    const format=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(t||''))?String(t):'';
    const start=format(e.start),end=format(e.end);
    return start&&end?start+' - '+end:start||'시간 미정';
  }
  function render(){
    if(!opened||!allowed())return;
    const days=dates();if(!days.length)return;
    const today=dateToday();
    if(!days.includes(selected))selected=days.includes(today)?today:days[0];
    const dayKey=days.join(',');
    if(dayKey!==dateSignature){
      dateSignature=dayKey;
      const options=document.createDocumentFragment(),format=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short',timeZone:'UTC'});
      for(const day of days){const option=document.createElement('option');option.value=day;option.textContent=format.format(new Date(day+'T00:00:00Z'));options.append(option)}
      dateInput.replaceChildren(options);
    }
    dateInput.value=selected;
    prev.disabled=selected===days[0];next.disabled=selected===days.at(-1);todayButton.disabled=!days.includes(today)||selected===today;
    const items=(typeof activeEvents==='function'?activeEvents():[]).filter(e=>e.date===selected).slice().sort((a,b)=>Number(!!b.restDay)-Number(!!a.restDay)||String(a.start||'99:99').replace('TBD','99:99').localeCompare(String(b.start||'99:99').replace('TBD','99:99')));
    const colors=new Map([...grid.querySelectorAll('.mini-event[data-evid]')].map(el=>[el.dataset.evid,el.style.getPropertyValue('--content-group-color')]));
    const view=items.map(e=>({id:String(e.id),title:e.restDay?'휴방':String(e.title||'제목 없음'),time:timeLabel(e),device:e.restDay?'':String(e.device||''),people:Array.isArray(e.participants)?e.participants.length:0,color:colors.get(String(e.id))||'',rest:!!e.restDay}));
    heading.textContent=new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'long',timeZone:'UTC'}).format(new Date(selected+'T00:00:00Z'));
    count.textContent=items.length+'개 일정';
    mark();
    const time=window.mwsCalendarAgendaTimeV1?.summarize(items);
    const sig=JSON.stringify([selected,view,time]);if(sig===lastSignature){syncLinks();return}lastSignature=sig;
    renderTime(time,view);
    const focused=list.contains(document.activeElement)?document.activeElement.dataset.agendaEvent:'',scrollTop=list.scrollTop;
    const fragment=document.createDocumentFragment();
    for(const item of view){
      const button=document.createElement('button');button.type='button';button.className='mws-agenda-event-v1';button.dataset.agendaEvent=item.id;
      button.setAttribute('aria-haspopup','dialog');
      const isSelected=window.mwsCalendarDetailsV1?.currentId()===item.id;
      button.setAttribute('aria-expanded',String(isSelected));button.classList.toggle('mws-agenda-selected-v1',isSelected);
      if(/^#[0-9a-f]{3,8}$/i.test(item.color))button.style.setProperty('--agenda-event-color',item.color);
      const meta=document.createElement('span');meta.className='mws-agenda-event-meta-v1';
      const time=document.createElement('time');time.textContent=item.time;meta.append(time);
      if(item.device){const device=document.createElement('span');device.textContent=item.device;meta.append(device)}
      const title=document.createElement('strong');title.textContent=item.title;
      button.append(meta,title);
      if(!item.rest&&item.people){const people=document.createElement('small');people.textContent='참가자 '+item.people+'명';button.append(people)}
      fragment.append(button);
    }
    if(!view.length){const empty=document.createElement('div');empty.className='mws-agenda-empty-v1';empty.textContent='등록된 일정이 없습니다.';fragment.append(empty)}
    list.replaceChildren(fragment);list.scrollTop=scrollTop;syncLinks();
    if(focused)[...list.querySelectorAll('[data-agenda-event]')].find(el=>el.dataset.agendaEvent===focused)?.focus({preventScroll:true});
  }
  function renderTime(time,view){
    const section=q('[data-agenda-time-section]'),tracks=q('[data-agenda-tracks]'),total=q('[data-agenda-duration]'),note=q('[data-agenda-time-note]');
    if(!section||!tracks||!total||!note)return;
    section.hidden=!time||!time.count;
    tracks.replaceChildren();
    if(!time||!time.count){total.textContent='';note.textContent='';return}
    const duration=n=>Math.floor(n/60)+'시간 '+n%60+'분';
    total.textContent=time.entries.length?duration(time.minutes):'시간 미정';
    note.textContent=[time.unknown?'시간 미정 '+time.unknown+'개':'',time.overnight?'다음 날 종료 '+time.overnight+'개':'','등록 시간 기준 · 중복 합산'].filter(Boolean).join(' · ');
    const byId=new Map(view.map(item=>[item.id,item]));
    for(const e of time.entries){
      const item=byId.get(e.id);if(!item)continue;
      const row=document.createElement('button');row.type='button';row.className='mws-agenda-track-v1';row.dataset.agendaTrack=e.id;
      row.setAttribute('aria-haspopup','dialog');
      const isSelected=window.mwsCalendarDetailsV1?.currentId()===e.id;
      row.setAttribute('aria-expanded',String(isSelected));row.classList.toggle('mws-agenda-selected-v1',isSelected);
      const label=item.title+' '+item.time+(e.spill?' 다음 날 종료':'');row.title=label;row.setAttribute('aria-label',label);
      const bar=document.createElement('span');bar.className='mws-agenda-track-bar-v1';bar.style.left=e.start/14.4+'%';bar.style.width=(e.end-e.start)/14.4+'%';
      if(/^#[0-9a-f]{3,8}$/i.test(item.color))bar.style.setProperty('--agenda-event-color',item.color);
      if(e.spill)bar.classList.add('is-overnight');
      row.append(bar);tracks.append(row);
    }
  }
  // One matching identity, paint-only linking between real calendar cards,
  // agenda cards and timeline rows. No scroll jumps, timers or data requests.
  function eventId(node){
    if(!(node instanceof Element))return '';
    const target=node.closest('.mini-event[data-evid],[data-agenda-event],[data-agenda-track]');
    if(!target||(!grid.contains(target)&&!panel.contains(target)))return '';
    return target.dataset.evid||target.dataset.agendaEvent||target.dataset.agendaTrack||'';
  }
  function syncLinks(){
    for(const node of linkedNodes)node.classList.remove('mws-agenda-link-v1');
    linkedNodes=[];
    const id=opened&&(hoverId||focusId);if(!id)return;
    const items=[...grid.querySelectorAll('.mini-event[data-evid]'),...panel.querySelectorAll('[data-agenda-event],[data-agenda-track]')];
    linkedNodes=items.filter(node=>(node.dataset.evid||node.dataset.agendaEvent||node.dataset.agendaTrack)===id);
    if(!linkedNodes.some(node=>panel.contains(node))){linkedNodes=[];return}
    for(const node of linkedNodes)node.classList.add('mws-agenda-link-v1');
  }
  for(const surface of [grid,panel]){
    surface.addEventListener('pointerover',e=>{
      if(!opened||e.pointerType==='touch'||e.buttons)return;
      const id=eventId(e.target);if(hoverId!==id){hoverId=id;syncLinks()}
    });
    surface.addEventListener('pointerout',e=>{
      if(!opened||e.pointerType==='touch')return;
      const id=eventId(e.relatedTarget);if(hoverId!==id){hoverId=id;syncLinks()}
    });
    surface.addEventListener('focusin',e=>{
      if(!opened)return;
      const id=eventId(e.target);if(focusId!==id){focusId=id;syncLinks()}
    });
    surface.addEventListener('focusout',e=>{
      if(!opened)return;
      const id=eventId(e.relatedTarget);if(focusId!==id){focusId=id;syncLinks()}
    });
  }
  function setOpen(value,{focus=false}={}){
    const nextOpen=!!value&&allowed();if(opened===nextOpen)return;
    opened=nextOpen;lastSignature='';
    month.classList.toggle('mws-agenda-open-v1',opened);panel.hidden=!opened;toggle.setAttribute('aria-expanded',String(opened));toggle.title=opened?'일정 목록 닫기':'일정 목록 열기';toggle.setAttribute('aria-label',toggle.title);
    window.mwsCalendarDetailsV1?.close({restoreFocus:false});
    if(opened){render();if(focus)dateInput.focus({preventScroll:true})}
    else{hoverId='';focusId='';syncLinks();mark();if(focus&&allowed())toggle.focus({preventScroll:true})}
  }
  function selectDate(value){if(!opened||!dates().includes(value))return;const changed=value!==selected;if(changed){hoverId='';focusId=''}selected=value;render();if(changed)list.scrollTop=0}
  function step(n){const days=dates();selectDate(days[days.indexOf(selected)+n])}
  toggle.addEventListener('click',()=>setOpen(!opened));
  q('[data-agenda-close]').addEventListener('click',()=>setOpen(false,{focus:true}));
  dateInput.addEventListener('change',()=>{selectDate(dateInput.value);dateInput.value=selected});
  prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));todayButton.addEventListener('click',()=>selectDate(dateToday()));
  list.addEventListener('click',e=>{const button=e.target.closest('[data-agenda-event]');if(button&&list.contains(button))window.openCalendarEventDetailsV1?.(button.dataset.agendaEvent,button)});
  q('[data-agenda-tracks]')?.addEventListener('click',e=>{const track=e.target.closest('[data-agenda-track]');if(!track)return;const row=[...list.querySelectorAll('[data-agenda-event]')].find(el=>el.dataset.agendaEvent===track.dataset.agendaTrack);if(row){row.scrollIntoView({block:'nearest',behavior:'instant'});row.focus({preventScroll:true});window.openCalendarEventDetailsV1?.(row.dataset.agendaEvent,row)}});
  grid.addEventListener('click',e=>{
    if(!opened||e.defaultPrevented||e.ctrlKey||e.target.closest('button,a')||month.closest('.calendar-group-select-active-v2'))return;
    const event=e.target.closest('.mini-event[data-evid]');if(event)selectDate(event.closest('.day')?.dataset.date);
  },true);
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'&&!window.mwsCalendarDetailsV1?.isOpen()){e.stopPropagation();setOpen(false,{focus:true})}});
  new MutationObserver(()=>{if(opened)render()}).observe(grid,{childList:true});
  new MutationObserver(()=>{if(opened&&!allowed())setOpen(false)}).observe(month,{attributes:true,attributeFilter:['class','hidden']});
  if(section)new MutationObserver(()=>{if(opened&&!allowed())setOpen(false)}).observe(section,{attributes:true,attributeFilter:['class']});
  new MutationObserver(()=>{if(opened&&!allowed())setOpen(false)}).observe(document.body,{attributes:true,attributeFilter:['data-device-mode','data-resolution']});
  wide.addEventListener('change',()=>{if(opened&&!allowed())setOpen(false)});
})();
