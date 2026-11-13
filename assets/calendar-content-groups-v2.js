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

  // The D1 core could previously lose group definitions while events retained
  // their original contentGroupId values. Never generate replacement IDs.
  function orphanGroupCounts(){
    const known=new Set(groups().map(group=>String(group.id||'')));
    const byId=new Map();
    for(const e of Array.isArray(data.events)?data.events:[]){
      const id=String(e?.contentGroupId||'').trim();
      if(!id||known.has(id))continue;
      if(!byId.has(id))byId.set(id,{id,count:0,titles:[]});
      const item=byId.get(id);
      item.count++;
      const title=String(e?.title||'').trim();
      if(title&&item.titles.length<3&&!item.titles.includes(title))item.titles.push(title);
    }
    return [...byId.values()].sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id));
  }
  function groupWriteStatus(message,failed=false){
    for(const hostId of ['calendarGroupPanelV2','calendarGroupManagerPanelV4']){
      const host=$(hostId);
      if(!host)continue;
      let status=host.querySelector('.calendar-group-persist-status-v1');
      if(!status){
        status=document.createElement('div');
        status.className='calendar-group-persist-status-v1';
        host.prepend(status);
      }
      status.textContent=String(message||'');
      status.hidden=!message;
      status.classList.toggle('error',Boolean(failed));
    }
    if(failed){
      const globalStatus=$('syncStatusText');
      if(globalStatus)globalStatus.textContent='콘텐츠 그룹 저장 실패';
    }
  }
  function canWriteGroup(){
    const ready=document.body.dataset.mwsMode==='admin'&&root.__mwsAppReadyV130===true;
    if(!ready){
      groupWriteStatus('관리자 데이터 로딩이 끝나기 전에는 그룹을 수정할 수 없습니다.',true);
      toast('콘텐츠 그룹','관리자 로그인을 완료한 뒤 다시 시도해 주세요.');
    }
    return ready;
  }
  async function persistGroupChange(reason,verifyEventIds=[]){
    if(document.body.dataset.mwsMode!=='admin'||root.__mwsAppReadyV130!==true){
      groupWriteStatus('관리자 로그인과 데이터 불러오기가 완료된 후 저장해 주세요.',true);
      toast('콘텐츠 그룹 저장 실패','관리자 데이터 로딩 상태를 확인해 주세요.');
      return false;
    }
    if(typeof saveData!=='function'||typeof root.mwsV55SaveNow!=='function'){
      groupWriteStatus('온라인 저장 기능을 사용할 수 없습니다. 이 페이지에서 이동하지 마세요.',true);
      toast('콘텐츠 그룹 저장 실패','온라인 저장 기능을 사용할 수 없습니다.');
      return false;
    }
    const expectedGroups=groups().map(g=>({id:g.id,name:g.name,color:g.color}));
    const eventMap=new Map((Array.isArray(data.events)?data.events:[]).map(e=>[String(e.id),String(e.contentGroupId||'')]));
    groupWriteStatus('Cloudflare D1에 저장하고 검증하는 중...');
    try{
      saveData(reason);
      const saved=await root.mwsV55SaveNow();
      if(!saved)throw new Error('온라인 저장 요청이 완료되지 않았습니다.');
      const coreResponse=await fetch('/api/parts/core',{credentials:'same-origin',cache:'no-store'});
      if(!coreResponse.ok)throw new Error('서버 그룹 목록을 검증하지 못했습니다. HTTP '+coreResponse.status);
      const coreRow=await coreResponse.json();
      const serverGroups=Array.isArray(coreRow?.data?.contentGroups)?coreRow.data.contentGroups:[];
      for(const expected of expectedGroups){
        const actual=serverGroups.find(g=>g.id===expected.id);
        if(!actual||actual.name!==expected.name||actual.color!==expected.color)
          throw new Error('그룹 정의가 서버에 반영되지 않았습니다.');
      }
      // A deleted group must also be absent from the core.
      const expectedIds=new Set(expectedGroups.map(g=>g.id));
      if(serverGroups.some(g=>!expectedIds.has(g.id)))
        throw new Error('서버 그룹 목록이 현재 편집 내용과 일치하지 않습니다.');
      if(verifyEventIds.length){
        const eventsResponse=await fetch('/api/parts/events',{credentials:'same-origin',cache:'no-store'});
        if(!eventsResponse.ok)throw new Error('서버 일정 연결을 검증하지 못했습니다. HTTP '+eventsResponse.status);
        const eventsRow=await eventsResponse.json();
        const remote=new Map((Array.isArray(eventsRow?.data)?eventsRow.data:[]).map(e=>[String(e.id),String(e.contentGroupId||'')]));
        for(const id of verifyEventIds){
          if(!remote.has(String(id))||remote.get(String(id))!==eventMap.get(String(id)))
            throw new Error('일정 그룹 연결이 서버에 반영되지 않았습니다.');
        }
      }
      groupWriteStatus('Cloudflare D1 저장 및 재조회 완료');
      return true;
    }catch(error){
      const message=String(error?.message||error);
      groupWriteStatus('온라인 저장 실패. 새로고침하지 말고 다시 저장하세요. '+message,true);
      toast('콘텐츠 그룹 저장 실패',message);
      console.error('Content group save verification failed',error);
      return false;
    }
  }
  function renderOrphanRecovery(){
    const orphans=orphanGroupCounts();
    for(const [hostId,boxId] of [
      ['calendarGroupPanelV2','calendarGroupRecoveryPanelV1'],
      ['calendarGroupManagerPanelV4','calendarGroupManagerRecoveryV1']
    ]){
      const host=$(hostId);
      if(!host)continue;
      let box=$(boxId);
      if(!box){
        box=document.createElement('div');
        box.id=boxId;
        box.className='calendar-group-recovery-v1';
        host.appendChild(box);
      }
      box.hidden=!orphans.length;
      box.replaceChildren();
      if(!orphans.length)continue;
      const h=document.createElement('h4');
      h.textContent='기존 그룹 연결 복구 - '+orphans.length+'개 그룹';
      const p=document.createElement('p');
      p.textContent='기존 일정 '+orphans.reduce((n,item)=>n+item.count,0)+'개에 그룹 ID가 남아 있습니다. 그룹 이름과 색상을 직접 확인하고 복구하면 기존 일정 연결이 유지됩니다. 새 그룹 ID는 만들지 않습니다.';
      box.append(h,p);
      for(const orphan of orphans){
        const row=document.createElement('div');
        row.className='calendar-group-recovery-row-v1';
        const label=document.createElement('div');
        label.className='calendar-group-recovery-label-v1';
        label.textContent='미복구 그룹 - '+orphan.count+'개 일정 · ID '+orphan.id.slice(0,8);
        const preview=document.createElement('div');
        preview.className='calendar-group-recovery-preview-v1';
        preview.textContent='연결된 일정 예시: '+(orphan.titles.join(' / ')||'제목 없음');
        const controls=document.createElement('div');
        controls.className='calendar-group-recovery-controls-v1';
        const name=document.createElement('input');
        name.type='text';name.maxLength=64;
        name.placeholder='확인한 기존 그룹 이름';
        name.setAttribute('aria-label','미복구 그룹 '+orphan.id.slice(0,8)+' 이름');
        const color=document.createElement('input');
        color.type='color';color.value='#0f8c95';
        color.title='복구할 그룹 색상';
        const button=document.createElement('button');
        button.type='button';button.className='secondary';
        button.textContent='원래 ID로 복구';
        button.addEventListener('click',async()=>{
          const title=name.value.trim();
          if(!title||title.length>64){toast('그룹 복구','그룹 이름을 1~64자로 입력해 주세요.');return}
          if(find(orphan.id)){redrawSelects();return}
          if(groups().some(g=>g.name.toLocaleLowerCase('ko-KR')===title.toLocaleLowerCase('ko-KR'))){
            toast('그룹 복구','동일한 이름이 이미 있습니다. 기존 그룹을 확인해 주세요.');return;
          }
          if(document.body.dataset.mwsMode!=='admin'||root.__mwsAppReadyV130!==true){
            toast('그룹 복구','관리자 데이터 로딩이 끝난 후 복구해 주세요.');return;
          }
          button.disabled=true;
          data.contentGroups.push({id:orphan.id,name:title,color:safeColor(color.value)});
          redrawSelects();
          const ok=await persistGroupChange('기존 콘텐츠 그룹 ID 복구');
          if(ok){
            redrawSelects();
            toast('그룹 복구',title+' - 기존 '+orphan.count+'개 일정 연결 유지, 서버 저장 완료');
          }
          button.disabled=false;
        });
        controls.append(name,color,button);
        row.append(label,preview,controls);
        box.appendChild(row);
      }
    }
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
    renderOrphanRecovery();
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
    root.mwsEventSidebarTabsV5?.reset();
    const sel=$('evContentGroupV2');
    options(sel,event?.contentGroupId||'');
    if($('evContentGroupSearchV3'))$('evContentGroupSearchV3').value='';
    renderGroupSearch('editor',false);
    const create=$('evContentGroupNewWrapV2');
    if(create)create.hidden=true;
    if($('evContentGroupNewNameV2'))$('evContentGroupNewNameV2').value='';
  }
  async function createFromEditor(){
    if(!canWriteGroup())return;
    const g=createGroup($('evContentGroupNewNameV2')?.value,$('evContentGroupNewColorV2')?.value);
    if(!g)return;
    const saved=await persistGroupChange('콘텐츠 그룹 만들기');
    redrawSelects($('calendarGroupTargetV2')?.value);
    options($('evContentGroupV2'),g.id);
    if($('evContentGroupSearchV3'))$('evContentGroupSearchV3').value='';
    renderGroupSearch('editor',false);
    $('evContentGroupNewWrapV2').hidden=true;
    if(saved)toast('콘텐츠 그룹',g.name+' 그룹을 만들고 온라인 저장을 확인했습니다');
  }
  async function createFromPanel(){
    if(!canWriteGroup())return;
    const g=createGroup($('calendarGroupNewNameV2')?.value,$('calendarGroupNewColorV2')?.value);
    if(!g)return;
    const assigned=[];
    for(const e of data.events){
      if(!e.restDay&&selected.has(String(e.id))){e.contentGroupId=g.id;assigned.push(e.id)}
    }
    finish();
    const saved=await persistGroupChange('콘텐츠 그룹 만들기'+(assigned.length?' 및 '+assigned.length+'개 일정 연결':''),assigned);
    if($('calendarGroupSearchPanelV3'))$('calendarGroupSearchPanelV3').value='';
    redrawSelects(g.id);
    $('calendarGroupNewNameV2').value='';
    if(saved)toast('콘텐츠 그룹',g.name+' 그룹 온라인 저장 완료'+(assigned.length?' · '+assigned.length+'개 일정 연결':''));
  }
  async function applyToSelected(clear=false){
    if(!canWriteGroup())return;
    const groupId=clear?'':$('calendarGroupTargetV2')?.value||'';
    if(!clear&&!find(groupId)){toast('콘텐츠 그룹','연결할 기존 그룹을 선택해 주세요');return}
    if(!selected.size){toast('콘텐츠 그룹','캘린더에서 일정을 먼저 선택해 주세요');return}
    let count=0;
    const modified=[];
    for(const e of data.events){
      if(!e.restDay&&selected.has(String(e.id))){
        e.contentGroupId=groupId;count++;modified.push(e.id);
      }
    }
    finish();
    const saved=await persistGroupChange(clear?'콘텐츠 그룹 연결 해제':'콘텐츠 그룹 일괄 연결',modified);
    redrawSelects(groupId);
    if(saved)toast('콘텐츠 그룹',count+'개 일정 '+(clear?'연결 해제':'그룹 연결')+' 온라인 저장 완료');
  }
  async function updateGroup(){
    if(!canWriteGroup())return;
    const group=selectedManagedGroup();
    if(!group){toast('콘텐츠 그룹','수정할 그룹을 선택해 주세요');return}
    const name=String($('calendarGroupRenameV2')?.value||'').trim();
    if(!name||name.length>64){toast('콘텐츠 그룹','이름을 1~64자로 지정해 주세요');return}
    if(groups().some(g=>g.id!==group.id&&g.name.toLocaleLowerCase('ko-KR')===name.toLocaleLowerCase('ko-KR'))){
      toast('콘텐츠 그룹','같은 이름의 다른 그룹이 있습니다');return;
    }
    group.name=name;group.color=safeColor($('calendarGroupRecolorV2')?.value);
    const saved=await persistGroupChange('콘텐츠 그룹 이름·색상 변경');
    redrawSelects(undefined,group.id);
    if(saved)toast('콘텐츠 그룹',name+' 그룹 수정 및 온라인 저장 완료');
  }
  async function deleteGroup(){
    if(!canWriteGroup())return;
    const group=selectedManagedGroup();
    if(!group)return;
    const count=data.events.filter(e=>e.contentGroupId===group.id).length;
    if(!confirm(group.name+' 그룹을 삭제하시겠습니까? 연결된 '+count+'개 일정은 삭제되지 않고 그룹 연결만 해제됩니다.'))return;
    const modified=data.events.filter(e=>e.contentGroupId===group.id).map(e=>e.id);
    data.contentGroups=data.contentGroups.filter(g=>g.id!==group.id);
    for(const e of data.events)if(e.contentGroupId===group.id)e.contentGroupId='';
    const saved=await persistGroupChange('콘텐츠 그룹 삭제',modified);
    redrawSelects(undefined,'');
    if(saved)toast('콘텐츠 그룹','그룹 정의와 연결 해제 온라인 저장 완료. 일정은 유지됩니다');
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
    root.addEventListener('mws:app-ready',()=>redrawSelects($('calendarGroupTargetV2')?.value));
    root.addEventListener('mws:parts-loaded',()=>redrawSelects($('calendarGroupTargetV2')?.value));
    redrawSelects('');
  }
  root.mwsCalendarContentGroupsV2=Object.freeze({
    init,groups,find,syncEditor,selectEvent,selectionActive:()=>mode,
    selectionCount:()=>selected.size,refreshCalendarSelection:updateSelectionUI,
    newGroup:createGroup,rankedGroups,renderGroupSearch,selectGroupFromSearch
  });
  init();
})(window);
