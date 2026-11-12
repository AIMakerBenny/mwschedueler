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
      el.draggable=!mode;
    });
    if($('calendarGroupApplyV2'))$('calendarGroupApplyV2').disabled=!selected.size;
    if($('calendarGroupClearV2'))$('calendarGroupClearV2').disabled=!selected.size;
  }
  function toggle(){
    mode=!mode;
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
  function redrawSelects(preserve){
    options($('calendarGroupTargetV2'),preserve);
    options($('evContentGroupV2'),$('evContentGroupV2')?.value);
    const manager=$('calendarGroupTargetV2');
    const chosen=find(manager?.value);
    if($('calendarGroupRenameV2'))$('calendarGroupRenameV2').value=chosen?.name||'';
    if($('calendarGroupRecolorV2'))$('calendarGroupRecolorV2').value=chosen?.color||'#0f8c95';
    updateSelectionUI();
  }
  function syncEditor(event){
    const sel=$('evContentGroupV2');
    options(sel,event?.contentGroupId||'');
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
    const group=find($('calendarGroupTargetV2')?.value);
    if(!group){toast('콘텐츠 그룹','수정할 그룹을 선택해 주세요');return}
    const name=String($('calendarGroupRenameV2')?.value||'').trim();
    if(!name||name.length>64){toast('콘텐츠 그룹','이름을 1~64자로 지정해 주세요');return}
    if(groups().some(g=>g.id!==group.id&&g.name.toLocaleLowerCase('ko-KR')===name.toLocaleLowerCase('ko-KR'))){
      toast('콘텐츠 그룹','같은 이름의 다른 그룹이 있습니다');return;
    }
    group.name=name;group.color=safeColor($('calendarGroupRecolorV2')?.value);
    saveData('콘텐츠 그룹 이름·색상 변경');
    redrawSelects(group.id);
    toast('콘텐츠 그룹',name+' 그룹을 수정했습니다');
  }
  function deleteGroup(){
    const group=find($('calendarGroupTargetV2')?.value);
    if(!group)return;
    const count=data.events.filter(e=>e.contentGroupId===group.id).length;
    if(!confirm(group.name+' 그룹을 삭제하시겠습니까? 연결된 '+count+'개 일정은 삭제되지 않고 그룹 연결만 해제됩니다.'))return;
    data.contentGroups=data.contentGroups.filter(g=>g.id!==group.id);
    for(const e of data.events)if(e.contentGroupId===group.id)e.contentGroupId='';
    saveData('콘텐츠 그룹 삭제');
    redrawSelects('');
    toast('콘텐츠 그룹','그룹을 삭제했습니다. 일정은 유지됩니다');
  }
  function init(){
    const toggleBtn=$('calendarGroupToggleV2');if(!toggleBtn)return;
    toggleBtn.addEventListener('click',toggle);
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
    newGroup:createGroup
  });
  init();
})(window);
