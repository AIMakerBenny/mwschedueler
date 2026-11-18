/* Read-only calendar detail drawer and editor presentation. No storage writes. */
(function(root){
  'use strict';
  const $=id=>document.getElementById(id);
  let drawer,previousFocus,hideTimer,current=null;
  function markSelected(id){
    document.querySelectorAll('#calendarGrid .mini-event[data-evid]').forEach(node=>{
      node.classList.toggle('event-details-selected-v1',node.dataset.evid===id);
    });
  }
  function close({restoreFocus=true}={}){
    if(!drawer)return;
    clearTimeout(hideTimer);
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    current=null;markSelected('');
    if(restoreFocus&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    hideTimer=setTimeout(()=>{if(!current)drawer.hidden=true},180);
  }
  function ensure(){
    if(drawer)return;
    drawer=document.createElement('aside');
    drawer.id='calendarEventDetailsV1';drawer.className='event-details-drawer-v1';drawer.hidden=true;
    drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','false');
    drawer.setAttribute('aria-label','일정 상세');drawer.setAttribute('aria-hidden','true');
    drawer.innerHTML='<header class="event-details-head-v1"><span>일정 상세</span><button type="button" class="ghost" id="calendarDetailsCloseV1" aria-label="일정 상세 닫기">닫기</button></header><div class="event-details-body-v1" id="calendarDetailsBodyV1"></div><footer class="event-details-footer-v1"><button type="button" class="primary" id="calendarDetailsEditV1">수정</button></footer>';
    document.body.append(drawer);
    $('calendarDetailsCloseV1').onclick=()=>close();
    $('calendarDetailsEditV1').onclick=()=>{const edit=current?.onEdit;close({restoreFocus:false});edit?.()};
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&current&&!document.querySelector('.modal.open')){
        event.preventDefault();close();
      }
    });
    root.addEventListener('mawang:datachange',()=>{if(current)close({restoreFocus:false})});
  }
  function open(details){
    ensure();clearTimeout(hideTimer);
    if(!current)previousFocus=document.activeElement;
    current=details;
    drawer.setAttribute('aria-label',String(details.title||'일정')+' 상세');
    // HTML is generated and escaped by the application's calendar renderer.
    $('calendarDetailsBodyV1').innerHTML=details.html;
    $('calendarDetailsBodyV1').scrollTop=0;
    drawer.hidden=false;drawer.setAttribute('aria-hidden','false');markSelected(details.id);
    requestAnimationFrame(()=>{if(current){drawer.classList.add('open');$('calendarDetailsCloseV1').focus({preventScroll:true})}});
  }
  root.mwsCalendarDetailsV1=Object.freeze({open,close,isOpen:()=>Boolean(current)});

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
