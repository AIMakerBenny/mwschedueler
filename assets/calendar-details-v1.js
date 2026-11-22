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
    motion?.cancel();motion=null;
    const complete=()=>{if(generation!==motionGeneration)return;motion?.cancel();motion=null;finish?.()};
    if(!drawer.animate||root.mwsMotionReduced?.()){complete();return}
    motion=drawer.animate([{opacity:from},{opacity:open?1:0}],{duration:open?150:110,easing:'ease-out',fill:'both'});
    motion.finished.then(complete,()=>{});
  }
  function markSelected(id){
    document.querySelectorAll('#calendarGrid .mini-event[data-evid]').forEach(node=>{
      const selected=node.dataset.evid===id;
      node.classList.toggle('event-details-selected-v1',selected);
      node.setAttribute('aria-expanded',String(selected));
    });
  }
  function close({restoreFocus=true}={}){
    if(!drawer||!current)return;
    const from=Number(getComputedStyle(drawer).opacity);
    drawer.inert=true;drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    current=null;anchor=null;markSelected('');
    playMotion(false,from,()=>{
      if(!current){drawer.hidden=true;if(restoreFocus&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true})}
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
      if(!current||drawer.contains(event.target)||event.target.closest('.mini-event[data-evid],.calendar-day-more-v2,.modal.open'))return;
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
  root.mwsCalendarDetailsV1=Object.freeze({open,close,isOpen:()=>Boolean(current)});
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
    root.addEventListener('resize',fit);fit();
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
      tray.classList.toggle('is-open',open);tray.setAttribute('aria-hidden',String(!open));tray.inert=!open;
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

  let tools,mode='game';
  function selectTool(value){
    mode=value==='organize'?'organize':'game';
    if(!tools)return;
    tools.dataset.toolView=mode;
    tools.querySelectorAll('[data-editor-tool-v6]').forEach(button=>{
      const selected=button.dataset.editorToolV6===mode;
      button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
    });
  }
  function detailsWrap(field,label,className){
    if(!field||field.parentElement?.classList.contains(className))return;
    const details=document.createElement('details');details.className=className+' field full';
    const summary=document.createElement('summary');summary.textContent=label;
    field.before(details);details.append(summary,field);
  }
  function arrange(){
    const box=document.querySelector('#eventModal .event-modalbox');
    const layout=box?.querySelector('.event-modal-layout');
    const info=layout?.querySelector('.event-info-panel');
    const memo=box?.querySelector('.event-memo-panel');
    if(!box||!layout||!info||!memo)return;
    if(!box.classList.contains('mws-event-editor-v6')){
      box.classList.add('mws-event-editor-v6');
      tools=document.createElement('aside');tools.className='event-editor-tools-v6';
      tools.innerHTML='<div class="event-editor-tool-tabs-v6" role="tablist" aria-label="일정 부가 정보"><button type="button" id="eventEditorGameTabV6" data-editor-tool-v6="game" aria-controls="eventGamePanelV112" role="tab" aria-selected="true">게임</button><button type="button" id="eventEditorOrganizeTabV6" data-editor-tool-v6="organize" aria-controls="eventOrganizerPaneV6" role="tab" aria-selected="false">그룹·메모</button></div>';
      memo.id='eventOrganizerPaneV6';memo.setAttribute('role','tabpanel');memo.setAttribute('aria-labelledby','eventEditorOrganizeTabV6');
      layout.append(tools);tools.append(memo);
      for(const button of tools.querySelectorAll('[data-editor-tool-v6]')){
        button.onclick=()=>selectTool(button.dataset.editorToolV6);
        button.onkeydown=event=>{
          if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
            event.preventDefault();selectTool(event.key==='Home'?'game':event.key==='End'?'organize':mode==='game'?'organize':'game');
            tools.querySelector('[aria-selected="true"]').focus();
          }
        };
      }
      const actions=info.querySelector('.event-actions');if(actions)box.append(actions);
      const form=info.querySelector(':scope > .formgrid');
      if(form){
        const heading=document.createElement('h3');heading.className='event-editor-heading-v6';heading.textContent='기본 정보';form.prepend(heading);
        detailsWrap(form.querySelector('.event-datetime-quick-v177'),'시간 빠른 입력','event-editor-quick-v6');
        const advanced=document.createElement('details');advanced.className='event-editor-advanced-v6 field full';
        const summary=document.createElement('summary');summary.textContent='상세 내용 · 공지 · 반복 설정';
        const fields=document.createElement('div');fields.className='formgrid';advanced.append(summary,fields);
        for(const id of ['evUrl','evDescription','checklistEditor','evReminder','evRepeatButton']){
          const field=$(id)?.closest('.field');if(field&&form.contains(field))fields.append(field);
        }
        form.append(advanced);
        const checklistLabel=$('checklistEditor')?.parentElement.querySelector('label');if(checklistLabel)checklistLabel.textContent='체크리스트';
      }
      selectTool('game');
    }
    const game=$('eventGamePanelV112');
    if(game){
      game.setAttribute('role','tabpanel');game.setAttribute('aria-labelledby','eventEditorGameTabV6');
      if(game.parentElement!==tools)tools.append(game);
    }
  }
  function reset(){
    arrange();selectTool('game');
    document.querySelectorAll('#eventModal .event-editor-quick-v6,#eventModal .event-editor-advanced-v6').forEach(node=>node.open=false);
  }
  function init(){
    arrange();
    const layout=document.querySelector('#eventModal .event-modal-layout');
    if(layout)new MutationObserver(()=>arrange()).observe(layout,{childList:true});
  }
  root.mwsEventEditorLayoutV6=Object.freeze({init,reset,selectTool});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
