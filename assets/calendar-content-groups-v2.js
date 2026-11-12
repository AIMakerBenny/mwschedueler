/* MWS Explicit Calendar Content Groups V2
 * Shared groups are stored in data.contentGroups; event.contentGroupId is optional.
 * Date, title, start/end, participants and other event fields are untouched.
 */
(function(root){
  'use strict';
  const selected=new Set();
  let mode=false;
  const $=id=>document.getElementById(id);
  const palette=root.mwsCalendarContinuousSeriesV1;
  function groups(){return Array.isArray(data.contentGroups)?data.contentGroups:[]}
  function find(id){return groups().find(g=>g.id===String(id||''))||null}
  function safeColor(color){return palette?.safeColor(color)||'#0f8c95'}
  function options(select,preserve){
    if(!select)return;
    const desired=preserve===undefined?select.value:String(preserve||'');
    select.replaceChildren(new Option('그룹 없음',''));
    for(const group of groups())select.add(new Option(group.name,group.id));
    select.value=find(desired)?desired:'';
  }
  /* Searchable picker for large content-group libraries. The original select remains
   * the canonical form value, preserving existing save/edit behavior.
   * Suggestions are ranked by linked event count, not guessed from schedule titles.
   */
  const pickers={
    editor:{input:'evContentGroupSearchV3',select:'evContentGroupV2',
      current:'evContentGroupCurrentV3',quick:'evContentGroupQuickV3',
      results:'evContentGroupResultsV3',hint:'evContentGroupHintV3'},
    panel:{input:'calendarGroupSearchPanelV3',select:'calendarGroupTargetV2',
      current:'calendarGroupCurrentPanelV3',quick:'calendarGroupQuickPanelV3',
      results:'calendarGroupResultsPanelV3',hint:'calendarGroupHintPanelV3'},
    manager:{input:'calendarGroupManagerSearchV4',select:'calendarGroupManageTargetV4',
      current:'calendarGroupManagerCurrentV4',quick:'calendarGroupManagerQuickV4',
      results:'calendarGroupManagerResultsV4',hint:'calendarGroupManagerHintV4'}
  };
  function normalizeSearch(value){
    return String(value||'').normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\\s+/g,' ').trim();
  }
  function rankedGroups(query=''){
    const key=normalizeSearch(query),count=new Map();
    for(const event of Array.isArray(data.events)?data.events:[]){
      const id=String(event?.contentGroupId||'');
      if(id)count.set(id,(count.get(id)||0)+1);
    }
    return groups().filter(g=>normalizeSearch(g.name).includes(key))
      .sort((a,b)=>(count.get(b.id)||0)-(count.get(a.id)||0)
        ||a.name.localeCompare(b.name,'ko-KR'));
  }
  function selectGroupFromSearch(context,id){
    const refs=pickers[context],select=$(refs.select);
    if(!select)return;
    options(select,id);
    const input=$(refs.input);
    if(input)input.value='';
    if(context==='panel')redrawSelects(id);
    else if(context==='manager')redrawSelects(undefined,id);
    else renderGroupSearch(context,false);
  }
  function makeGroupButton(group,context,variant){
    const button=document.createElement('button');
    button.type='button';
    button.className='calendar-group-option-v3 '+(variant==='quick'?'calendar-group-option-quick-v3':'');
    const choice=$(pickers[context].select)?.value||'';
    const chosen=choice===group.id;
    button.setAttribute('aria-pressed',chosen?'true':'false');
    button.title=group.name;
    const swatch=document.createElement('span');
    swatch.className='calendar-group-color-dot-v3';
    swatch.style.background=safeColor(group.color);
    const name=document.createElement('span');
    name.className='calendar-group-option-name-v3';
    name.textContent=group.name;
    const usage=data.events.filter(e=>e.contentGroupId===group.id).length;
    button.append(swatch,name);
    if(variant!=='quick'){
      const suffix=document.createElement('span');
      suffix.className='calendar-group-option-count-v3';
      suffix.textContent=usage?usage+'개 일정':'미사용';
      button.appendChild(suffix);
    }
    button.addEventListener('click',()=>selectGroupFromSearch(context,group.id));
    return button;
  }
  function renderGroupSearch(context,showResults=false){
    const ref=pickers[context];
    if(!ref)return;
    const input=$(ref.input),current=$(ref.current),
      quick=$(ref.quick),results=$(ref.results),hint=$(ref.hint);
    const select=$(ref.select);
    if(!input||!current||!quick||!results||!select)return;
    const chosen=find(select.value);
    current.replaceChildren();
    const currentMark=document.createElement('span');
    currentMark.className='calendar-group-current-mark-v3';
    if(chosen){
      const swatch=document.createElement('span');
      swatch.className='calendar-group-color-dot-v3';
      swatch.style.background=safeColor(chosen.color);
      currentMark.appendChild(swatch);
    }
    const name=document.createElement('span');
    name.className='calendar-group-current-name-v3';
    name.textContent=chosen?'현재 선택: '+chosen.name:'현재 선택: 그룹 없음';
    name.title=chosen?.name||'그룹 없음';
    currentMark.appendChild(name);
    current.appendChild(currentMark);
    if(chosen){
      const clear=document.createElement('button');
      clear.type='button';
      clear.className='calendar-group-clear-v3';
      clear.textContent='연결 해제';
      clear.addEventListener('click',()=>selectGroupFromSearch(context,''));
      current.appendChild(clear);
    }
    const query=input.value.trim();
    const ordered=rankedGroups(query);
    quick.replaceChildren();
    if(!query){
      const top=rankedGroups().slice(0,5);
      if(top.length){
        const heading=document.createElement('span');
        heading.className='calendar-group-quick-label-v3';
        heading.textContent='자주 사용';
        quick.appendChild(heading);
        top.forEach(g=>quick.appendChild(makeGroupButton(g,context,'quick')));
      }
    }
    const open=Boolean(query)||showResults;
    results.hidden=!open;
    results.replaceChildren();
    if(open){
      if(ordered.length){
        for(const group of ordered.slice(0,12)){
          results.appendChild(makeGroupButton(group,context,'result'));
        }
      }else{
        const empty=document.createElement('div');
        empty.className='calendar-group-empty-v3';
        empty.textContent=groups().length
          ?'일치하는 그룹이 없습니다. 아래에서 새 그룹을 만들 수 있습니다.'
          :'그룹이 없습니다. 아래에서 새 그룹을 만들어 주세요.';
        results.appendChild(empty);
      }
    }
    if(hint){
      hint.textContent=groups().length===0
        ?'아직 생성된 그룹이 없습니다. 새 콘텐츠 그룹 만들기를 눌러 주세요.'
        :query
          ?'검색 결과 '+ordered.length+'개'+(ordered.length>12?' · 먼저 12개를 표시합니다. 검색어를 더 입력해 주세요.':'')
          :'총 '+groups().length+'개 그룹 · 자주 사용하는 그룹을 누르거나 검색하세요.';
    }
  }
  function bindGroupPicker(context){
    const ref=pickers[context],input=$(ref.input),select=$(ref.select);
    if(!input||!select)return;
    input.addEventListener('focus',()=>renderGroupSearch(context,true));
    input.addEventListener('input',()=>renderGroupSearch(context,true));
    input.addEventListener('keydown',event=>{
      if(event.key==='Escape'){input.value='';input.blur();renderGroupSearch(context,false);return}
      if(event.key==='ArrowDown'){
        const first=$(ref.results)?.querySelector('button');
        if(first){event.preventDefault();first.focus()}
        return;
      }
      if(event.key==='Enter'){
        const first=rankedGroups(input.value).at(0);
        if(first){event.preventDefault();selectGroupFromSearch(context,first.id)}
      }
    });
    select.addEventListener('change',()=>{
      if(context==='panel')redrawSelects(select.value);
      else if(context==='manager')redrawSelects(undefined,select.value);
      else renderGroupSearch(context,false);
    });
    document.addEventListener('pointerdown',event=>{
      const box=input.closest('[data-group-search]');
      if(box&&!box.contains(event.target)&&!input.value.trim())
        $(ref.results).hidden=true;
    });
  }

  function updateSelectionUI(){
    const grid=$('calendarGrid'),section=$('calendar');
    section?.classList.toggle('calendar-group-select-active-v2',mode);
    const toggle=$('calendarGroupToggleV2'),panel=$('calendarGroupPanelV2');
    if(toggle){toggle.setAttribute('aria-pressed',mode?'true':'false');toggle.textContent=mode?'그룹 선택 종료':'연속 콘텐츠 그룹 선택'}
    if(panel)panel.hidden=!mode;
    const count=$('calendarGroupCountV2');
    if(count)count.textContent=selected.size+'개 일정 선택';
    grid?.querySelectorAll('.mini-event[data-evid]').forEach(el=>{
      const isSelected=mode&&selected.has(el.dataset.evid);
      el.classList.toggle('calendar-group-selected-v2',isSelected);
      if(mode){el.setAttribute('aria-pressed',isSelected?'true':'false');el.setAttribute('role','button');el.tabIndex=0}
      else{el.removeAttribute('aria-pressed');el.removeAttribute('role');el.removeAttribute('tabindex')}
      el.draggable=false;
      const handle=el.querySelector('.calendar-event-drag-handle-v4');
      if(handle){handle.hidden=mode;handle.draggable=!mode;}
    });
    if($('calendarGroupApplyV2'))$('calendarGroupApplyV2').disabled=!selected.size;
    if($('calendarGroupClearV2'))$('calendarGroupClearV2').disabled=!selected.size;
  }
  function toggle(){
    mode=!mode;
    if(mode){
      root.setCalendarViewModeV172?.('month');
      closeManager();
    }
    if(!mode)selected.clear();
    updateSelectionUI();
    if(typeof hideCalendarEventPreview==='function')hideCalendarEventPreview();
  }
  function selectEvent(id){
    if(!mode)return false;
    const event=data.events.find(e=>String(e.id)===String(id));
    if(!event||event.restDay)return true;
    if(selected.has(id))selected.delete(id);else selected.add(id);
    updateSelectionUI();
    return true;
  }
  function finish(){
    mode=false;selected.clear();updateSelectionUI();
  }
  function createGroup(name,color){
    const label=String(name||'').trim();
    if(!label){toast('콘텐츠 그룹','그룹 이름을 입력해 주세요');return null}
    if(label.length>64){toast('콘텐츠 그룹','그룹 이름은 64자 이내로 입력해 주세요');return null}
    if(groups().some(g=>g.name.toLocaleLowerCase('ko-KR')===label.toLocaleLowerCase('ko-KR'))){
      toast('콘텐츠 그룹','같은 이름의 그룹이 있습니다. 기존 그룹을 선택해 주세요');
      return null;
    }
    const group={id:crypto.randomUUID(),name:label,color:safeColor(color)};
    if(!Array.isArray(data.contentGroups))data.contentGroups=[];
    data.contentGroups.push(group);
    return group;
  }
  function redrawSelects(preserve,managerPreserve){
    options($('calendarGroupTargetV2'),preserve);
    options($('calendarGroupManageTargetV4'),managerPreserve);
    options($('evContentGroupV2'),$('evContentGroupV2')?.value);
    const manager=$('calendarGroupManageTargetV4')||$('calendarGroupTargetV2');
    const chosen=find(manager?.value);
    if($('calendarGroupRenameV2'))$('calendarGroupRenameV2').value=chosen?.name||'';
    if($('calendarGroupRecolorV2'))$('calendarGroupRecolorV2').value=chosen?.color||'#0f8c95';
    updateSelectionUI();
    renderGroupSearch('panel',false);
    renderGroupSearch('manager',false);
    renderGroupSearch('editor',false);
  }
  function closeManager(){
    const box=$('calendarGroupManagerPanelV4'),button=$('calendarGroupManageToggleV4');
    if(box)box.hidden=true;
    if(button)button.setAttribute('aria-expanded','false');
  }
  function toggleManager(){
    const box=$('calendarGroupManagerPanelV4'),button=$('calendarGroupManageToggleV4');
    if(!box)return;
    const opening=box.hidden;
    if(opening){
      root.setCalendarViewModeV172?.('month');
      finish();
    }
    box.hidden=!opening;
    if(button)button.setAttribute('aria-expanded',opening?'true':'false');
    if(opening){
      redrawSelects();
      $('calendarGroupManagerSearchV4')?.focus();
    }
  }
  function selectedManagedGroup(){
    return find(($('calendarGroupManageTargetV4')||$('calendarGroupTargetV2'))?.value);
  }
  function syncEditor(event){
    const sel=$('evContentGroupV2');
    options(sel,event?.contentGroupId||'');
    if($('evContentGroupSearchV3'))$('evContentGroupSearchV3').value='';
    renderGroupSearch('editor',false);
    const create=$('evContentGroupNewWrapV2');
    if(create)create.hidden=true;
    if($('evContentGroupNewNameV2'))$('evContentGroupNewNameV2').value='';
  }
  function createFromEditor(){
    const g=createGroup($('evContentGroupNewNameV2')?.value,$('evContentGroupNewColorV2')?.value);
    if(!g)return;
    saveData('콘텐츠 그룹 만들기');
    redrawSelects($('calendarGroupTargetV2')?.value);
    options($('evContentGroupV2'),g.id);
    if($('evContentGroupSearchV3'))$('evContentGroupSearchV3').value='';
    renderGroupSearch('editor',false);
    $('evContentGroupNewWrapV2').hidden=true;
    toast('콘텐츠 그룹',g.name+' 그룹을 만들었습니다');
  }
  function createFromPanel(){
    const g=createGroup($('calendarGroupNewNameV2')?.value,$('calendarGroupNewColorV2')?.value);
    if(!g)return;
    const assigned=[];
    for(const e of data.events){
      if(!e.restDay&&selected.has(String(e.id))){e.contentGroupId=g.id;assigned.push(e.id)}
    }
    finish();
    saveData('콘텐츠 그룹 만들기'+(assigned.length?' 및 '+assigned.length+'개 일정 연결':''));
    if($('calendarGroupSearchPanelV3'))$('calendarGroupSearchPanelV3').value='';
    redrawSelects(g.id);
    $('calendarGroupNewNameV2').value='';
    toast('콘텐츠 그룹',g.name+' 그룹을 만들었습니다'+(assigned.length?' · '+assigned.length+'개 일정 연결':''));
  }
  function applyToSelected(clear=false){
    const groupId=clear?'':$('calendarGroupTargetV2')?.value||'';
    if(!clear&&!find(groupId)){toast('콘텐츠 그룹','연결할 기존 그룹을 선택해 주세요');return}
    if(!selected.size){toast('콘텐츠 그룹','캘린더에서 일정을 먼저 선택해 주세요');return}
    let count=0;
    for(const e of data.events){
      if(!e.restDay&&selected.has(String(e.id))){
        e.contentGroupId=groupId;count++;
      }
    }
    finish();
    saveData(clear?'콘텐츠 그룹 연결 해제':'콘텐츠 그룹 일괄 연결');
    redrawSelects(groupId);
    toast('콘텐츠 그룹',count+'개 일정 '+(clear?'연결을 해제했습니다':'연결했습니다'));
  }
  function updateGroup(){
    const group=selectedManagedGroup();
    if(!group){toast('콘텐츠 그룹','수정할 그룹을 선택해 주세요');return}
    const name=String($('calendarGroupRenameV2')?.value||'').trim();
    if(!name||name.length>64){toast('콘텐츠 그룹','이름을 1~64자로 지정해 주세요');return}
    if(groups().some(g=>g.id!==group.id&&g.name.toLocaleLowerCase('ko-KR')===name.toLocaleLowerCase('ko-KR'))){
      toast('콘텐츠 그룹','같은 이름의 다른 그룹이 있습니다');return;
    }
    group.name=name;group.color=safeColor($('calendarGroupRecolorV2')?.value);
    saveData('콘텐츠 그룹 이름·색상 변경');
    redrawSelects(undefined,group.id);
    toast('콘텐츠 그룹',name+' 그룹을 수정했습니다');
  }
  function deleteGroup(){
    const group=selectedManagedGroup();
    if(!group)return;
    const count=data.events.filter(e=>e.contentGroupId===group.id).length;
    if(!confirm(group.name+' 그룹을 삭제하시겠습니까? 연결된 '+count+'개 일정은 삭제되지 않고 그룹 연결만 해제됩니다.'))return;
    data.contentGroups=data.contentGroups.filter(g=>g.id!==group.id);
    for(const e of data.events)if(e.contentGroupId===group.id)e.contentGroupId='';
    saveData('콘텐츠 그룹 삭제');
    redrawSelects(undefined,'');
    toast('콘텐츠 그룹','그룹을 삭제했습니다. 일정은 유지됩니다');
  }
  function init(){
    const toggleBtn=$('calendarGroupToggleV2');if(!toggleBtn)return;
    bindGroupPicker('editor');
    bindGroupPicker('panel');
    bindGroupPicker('manager');
    toggleBtn.addEventListener('click',toggle);
    $('calendarGroupManageToggleV4')?.addEventListener('click',toggleManager);
    $('calendarGroupManageCloseV4')?.addEventListener('click',closeManager);
    $('calendarGroupCancelV2')?.addEventListener('click',finish);
    $('calendarGroupApplyV2')?.addEventListener('click',()=>applyToSelected(false));
    $('calendarGroupClearV2')?.addEventListener('click',()=>applyToSelected(true));
    $('calendarGroupCreateV2')?.addEventListener('click',createFromPanel);
    $('calendarGroupUpdateV2')?.addEventListener('click',updateGroup);
    $('calendarGroupDeleteV2')?.addEventListener('click',deleteGroup);
    $('calendarGroupTargetV2')?.addEventListener('change',()=>redrawSelects($('calendarGroupTargetV2').value));
    $('evContentGroupToggleNewV2')?.addEventListener('click',()=>{
      const target=$('evContentGroupNewWrapV2');
      target.hidden=!target.hidden;
      if(!target.hidden)$('evContentGroupNewNameV2')?.focus();
    });
    $('evContentGroupCreateV2')?.addEventListener('click',createFromEditor);
    root.addEventListener('mawang:datachange',()=>redrawSelects($('calendarGroupTargetV2')?.value));
    redrawSelects('');
  }
  root.mwsCalendarContentGroupsV2=Object.freeze({
    init,groups,find,syncEditor,selectEvent,selectionActive:()=>mode,
    selectionCount:()=>selected.size,refreshCalendarSelection:updateSelectionUI,
    newGroup:createGroup,rankedGroups,renderGroupSearch,selectGroupFromSearch
  });
  init();
})(window);
