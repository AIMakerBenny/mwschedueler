/* Read-only calendar detail drawer and editor presentation. No storage writes. */
(function(root){
  'use strict';
  const $=id=>document.getElementById(id);
  let drawer,previousFocus,motion,layoutMotion,fitViewportNow,current=null,renderedHTML='';
  const duration=380,easing='cubic-bezier(.32,0,.2,1)';
  function stopLayoutMotion(){layoutMotion?.cancel();layoutMotion=null;document.querySelector('.calendar-layout-motion-v4')?.classList.remove('calendar-layout-motion-v4')}
  function changeLayout(open){
    const main=document.querySelector('.app>.main:has(#calendar.section.active)');
    const before=main?.getBoundingClientRect();
    stopLayoutMotion();
    document.body.classList.toggle('calendar-details-open-v2',open);
    // Commit the destination layout once, then animate only the compositor layer.
    fitViewportNow?.();
    const after=main?.getBoundingClientRect();
    if(main&&main.animate&&!reducedMotion()&&before?.width&&after?.width&&Math.abs(before.width-after.width)>1){
      main.classList.add('calendar-layout-motion-v4');
      layoutMotion=main.animate([{transform:`translateX(${before.left-after.left}px) scaleX(${before.width/after.width})`},{transform:'none'}],{duration,easing,fill:'both'});
    }
  }
  function markSelected(id){
    document.querySelectorAll('#calendarGrid .mini-event[data-evid]').forEach(node=>{
      node.classList.toggle('event-details-selected-v1',node.dataset.evid===id);
    });
  }
  function close({restoreFocus=true}={}){
    if(!drawer)return;
    const style=getComputedStyle(drawer),from=style.transform,fromOpacity=Number(style.opacity);motion?.cancel();
    changeLayout(false);
    drawer.inert=true;drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    current=null;markSelected('');
    if(restoreFocus&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    const finish=()=>{if(!current){drawer.hidden=true;motion?.cancel();motion=null;stopLayoutMotion()}};
    if(drawer.animate&&!reducedMotion()){
      motion=drawer.animate([{transform:from,opacity:fromOpacity},{transform:'translateX(104%)',opacity:0}],{duration,easing,fill:'both'});
      motion.finished.then(finish,()=>{});
    }else finish();
  }
  function ensure(){
    if(drawer)return;
    drawer=document.createElement('aside');
    drawer.id='calendarEventDetailsV1';drawer.className='event-details-drawer-v1';drawer.hidden=true;
    drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','false');
    drawer.setAttribute('aria-label','일정 상세');drawer.setAttribute('aria-hidden','true');
    drawer.innerHTML='<header class="event-details-head-v1"><span>일정 상세</span><button type="button" class="ghost" id="calendarDetailsCloseV1" aria-label="일정 상세 닫기">닫기</button></header><div class="event-details-body-v1" id="calendarDetailsBodyV1"></div><footer class="event-details-footer-v1"><button type="button" class="primary" id="calendarDetailsEditV1">수정</button></footer>';
    document.body.append(drawer);
    drawer.addEventListener('click',event=>{const button=event.target.closest('[data-detail-event-v2]');if(button)root.openCalendarEventDetailsV1?.(button.dataset.detailEventV2)});
    document.addEventListener('click',event=>{
      if(!current||drawer.contains(event.target)||event.target.closest('.mini-event[data-evid],.calendar-day-more-v2,.modal.open'))return;
      const calendarBackground=event.target.closest('#calendarGrid');
      close({restoreFocus:false});
      // Dismissing the panel must not also create a new schedule.
      if(calendarBackground){event.preventDefault();event.stopImmediatePropagation()}
    },true);
    $('calendarDetailsCloseV1').onclick=()=>close();
    $('calendarDetailsEditV1').onclick=()=>{const edit=current?.onEdit;close({restoreFocus:false});edit?.()};
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&current&&!document.querySelector('.modal.open')){
        event.preventDefault();close();
      }
    });
    root.addEventListener('mawang:datachange',()=>current?.onRefresh?.());
  }
  function reducedMotion(){return root.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true}
  function open(details){
    ensure();
    const opening=!current;
    const style=getComputedStyle(drawer),from=drawer.hidden?'translateX(104%)':style.transform,fromOpacity=drawer.hidden?0:Number(style.opacity);
    if(opening){motion?.cancel();motion=null;}
    const scroll=current?.id===details.id?$('calendarDetailsBodyV1').scrollTop:0;
    if(opening)previousFocus=document.activeElement;
    current=details;
    drawer.setAttribute('aria-label',String(details.title||'일정')+' 상세');
    // HTML is generated and escaped by the application's calendar renderer.
    if(renderedHTML!==details.html){$('calendarDetailsBodyV1').innerHTML=details.html;renderedHTML=details.html}
    $('calendarDetailsBodyV1').scrollTop=scroll;
    $('calendarDetailsEditV1').hidden=typeof details.onEdit!=='function';
    drawer.inert=false;drawer.hidden=false;drawer.setAttribute('aria-hidden','false');markSelected(details.id);
    if(opening)changeLayout(true);drawer.classList.add('open');
    if(opening&&drawer.animate&&!reducedMotion()){
      // Explicit keyframes work even when display:none and open change in one paint.
      motion=drawer.animate([{transform:from,opacity:fromOpacity},{transform:'translateX(0)',opacity:1}],{duration,easing,fill:'both'});
      const activeMotion=motion;
      activeMotion.finished.then(()=>{if(motion===activeMotion){activeMotion.cancel();motion=null;stopLayoutMotion()}},()=>{});
    }
    if(opening)$('calendarDetailsCloseV1').focus({preventScroll:true});
  }
  root.mwsCalendarDetailsV1=Object.freeze({open,close,isOpen:()=>Boolean(current)});

  function initMonthViewport(){
    const grid=$('calendarGrid');if(!grid)return;
    let frame;
    function updateViewport(){
      if(!grid.getClientRects().length||innerWidth<901)return;
      const rows=Math.max(1,Math.ceil(grid.querySelectorAll('.day[data-date]').length/7));
      const height=Math.max(240,innerHeight-grid.getBoundingClientRect().top-scrollY-24)+'px';
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
    fitViewportNow=()=>{cancelAnimationFrame(frame);updateViewport()};
    new MutationObserver(fit).observe(grid,{childList:true});
    if(typeof ResizeObserver==='function'){
      const observer=new ResizeObserver(fit);observer.observe(grid);
      const header=document.querySelector('.topbar');if(header)observer.observe(header);
      const toolbar=document.querySelector('.calendar-topbar-v4');if(toolbar)observer.observe(toolbar);
    }
    root.addEventListener('resize',fit);fit();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMonthViewport,{once:true});else initMonthViewport();

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
