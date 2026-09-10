/* MAWANG Scheduler CF MWS V 1.0.2 - automatic Today People from same-day event participants */
(()=>{
  'use strict';
  if(window.__mwsTestV53AutoTodayPeople)return;
  window.__mwsTestV53AutoTodayPeople=true;

  const VERSION='CF MWS V 1.0.2';
  let installed=false;
  let pickerState=null;
  let markingAutoRows=false;

  function validDateKey(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))}
  function cloneIdMap(src){
    const out={};
    if(!src||typeof src!=='object'||Array.isArray(src))return out;
    for(const [date,ids] of Object.entries(src)){
      if(!validDateKey(date)||!Array.isArray(ids))continue;
      out[date]=[...new Set(ids.map(String).filter(Boolean))];
    }
    return out;
  }
  function personExists(id){
    if(!id)return false;
    try{return typeof contact==='function'&&Boolean(contact(String(id)))}catch(_){return false}
  }
  function selfId(){try{return String(data?.selfContactId||'')}catch(_){return''}}
  function allowedId(id){const value=String(id||'');return Boolean(value&&value!==selfId()&&personExists(value))}

  function ensureV53Data(){
    if(typeof data==='undefined'||!data||typeof data!=='object')return false;
    if(!data.todayPeopleByDate||typeof data.todayPeopleByDate!=='object'||Array.isArray(data.todayPeopleByDate))data.todayPeopleByDate={};
    data.todayPeopleByDate=cloneIdMap(data.todayPeopleByDate);
    if(!data.todayPeopleManualByDate||typeof data.todayPeopleManualByDate!=='object'||Array.isArray(data.todayPeopleManualByDate)){
      data.todayPeopleManualByDate=cloneIdMap(data.todayPeopleByDate);
    }else data.todayPeopleManualByDate=cloneIdMap(data.todayPeopleManualByDate);
    return true;
  }

  function autoIdsForDate(date){
    if(!ensureV53Data()||!validDateKey(date))return [];
    const ids=new Set();
    for(const event of Array.isArray(data.events)?data.events:[]){
      if(!event||event.restDay||String(event.date||'')!==date||String(event.title||'').trim()==='휴방')continue;
      for(const raw of Array.isArray(event.participants)?event.participants:[]){
        const id=String(raw||'');
        if(allowedId(id))ids.add(id);
      }
    }
    return [...ids];
  }
  function manualIdsForDate(date){
    if(!ensureV53Data())return [];
    return (data.todayPeopleManualByDate[date]||[]).map(String).filter(allowedId);
  }
  function syncDate(date){
    if(!ensureV53Data()||!validDateKey(date))return [];
    const merged=[...new Set([...manualIdsForDate(date),...autoIdsForDate(date)])];
    if(merged.length)data.todayPeopleByDate[date]=merged;
    else delete data.todayPeopleByDate[date];
    return merged;
  }
  function syncAll(){
    if(!ensureV53Data())return;
    const dates=new Set([...Object.keys(data.todayPeopleByDate),...Object.keys(data.todayPeopleManualByDate)]);
    for(const event of Array.isArray(data.events)?data.events:[])if(validDateKey(event?.date))dates.add(String(event.date));
    for(const date of dates)syncDate(date);
  }
  window.mwsV53SyncTodayPeople=syncAll;
  window.mwsV53AutoTodayPeopleIds=autoIdsForDate;

  function setVersionLabel(){
    document.body?.setAttribute('data-build-version',VERSION);
    document.querySelectorAll('[id^="mwsBuildVersionV5"], .sidebar-build-version-v52, .sidebar-build-version-v53, [class*="sidebar-build-version"]').forEach(label=>{
      if(label.textContent!==VERSION)label.textContent=VERSION;
    });
  }
  function updateCopy(){
    setVersionLabel();
    const dash=document.querySelector('.dashboard-today-people-card-local .dashboard-insight-head-v55 .subtle');
    if(dash&&dash.textContent!=='오늘 컨텐츠의 참가자가 자동으로 포함됩니다. 필요한 인원은 직접 추가할 수도 있습니다.')dash.textContent='오늘 컨텐츠의 참가자가 자동으로 포함됩니다. 필요한 인원은 직접 추가할 수도 있습니다.';
    const modalSub=document.querySelector('#todayPeopleModal .today-people-picker-side-local .muted.small');
    if(modalSub&&modalSub.textContent!=='컨텐츠 참가자는 자동으로 포함됩니다. 그 외 인원은 여기서 직접 추가할 수 있습니다.')modalSub.textContent='컨텐츠 참가자는 자동으로 포함됩니다. 그 외 인원은 여기서 직접 추가할 수 있습니다.';
    const contactSub=document.querySelector('#contactTogetherDaysPanel .space .muted.small');
    if(contactSub&&contactSub.textContent!=='캘린더의 오늘 함께한 사람 기록을 최신순으로 표시합니다.')contactSub.textContent='캘린더의 오늘 함께한 사람 기록을 최신순으로 표시합니다.';
    const recentSub=document.querySelector('#sniperTodayPeopleView .today-people-recent-toolbar-local .subtle');
    if(recentSub&&recentSub.textContent!=='컨텐츠 참가자 자동 기록과 직접 등록한 기록을 합쳐 마지막 만난 날짜와 함께한 횟수를 확인합니다.')recentSub.textContent='컨텐츠 참가자 자동 기록과 직접 등록한 기록을 합쳐 마지막 만난 날짜와 함께한 횟수를 확인합니다.';
  }

  function markAutoPickerRows(){
    if(markingAutoRows||!pickerState)return;
    markingAutoRows=true;
    try{
      const auto=new Set(autoIdsForDate(pickerState.date));
      document.querySelectorAll('#todayPeoplePickerList .today-people-picker-row-local[data-id]').forEach(row=>{
        const id=String(row.dataset.id||'');
        const isAuto=auto.has(id);
        if(row.hasAttribute('data-auto-v53')!==isAuto)row.toggleAttribute('data-auto-v53',isAuto);
        if(isAuto){
          const title='이 날짜의 컨텐츠 참가자로 자동 포함됩니다.';
          if(row.title!==title)row.title=title;
          const state=row.lastElementChild;
          if(state&&state.textContent!=='자동')state.textContent='자동';
        }
      });
    }finally{
      markingAutoRows=false;
    }
  }

  function selectedFromState(){return pickerState?new Set(pickerState.selected):new Set()}
  function confirmPickerV53(){
    if(!pickerState)return;
    const date=pickerState.date;
    ensureV53Data();
    const auto=new Set(autoIdsForDate(date));
    const previousManual=new Set(manualIdsForDate(date));
    const selected=selectedFromState();
    const manual=[];
    for(const id of selected){
      if(!allowedId(id))continue;
      if(!auto.has(id)||previousManual.has(id))manual.push(id);
    }
    if(manual.length)data.todayPeopleManualByDate[date]=[...new Set(manual)];
    else delete data.todayPeopleManualByDate[date];
    const effective=syncDate(date);
    try{
      if(typeof saveData==='function')saveData('오늘 함께한 사람 수정');
    }catch(e){console.error('CF MWS V 1.0.2 Today People save failed',e)}
    document.getElementById('todayPeopleModal')?.classList.remove('open');
    pickerState=null;
    try{if(typeof toast==='function')toast('오늘 함께한 사람',`${date} · ${effective.length}명 저장`)}catch(_){}
  }

  function preparePicker(date){
    const normalized=validDateKey(date)?String(date):(typeof todayKST==='function'?todayKST():new Date().toISOString().slice(0,10));
    const selected=new Set(syncDate(normalized));
    pickerState={date:normalized,selected};
    const modal=document.getElementById('todayPeopleModal');
    const list=document.getElementById('todayPeoplePickerList');
    const confirm=document.getElementById('todayPeoplePickerConfirm');
    if(list&&!list.dataset.v53Bound){
      list.dataset.v53Bound='1';
      list.addEventListener('click',event=>{
        const row=event.target.closest('.today-people-picker-row-local[data-id]');
        if(!row||!pickerState)return;
        const id=String(row.dataset.id||'');
        if(autoIdsForDate(pickerState.date).includes(id)){
          event.preventDefault();event.stopImmediatePropagation();markAutoPickerRows();return;
        }
        if(pickerState.selected.has(id))pickerState.selected.delete(id);else pickerState.selected.add(id);
      },true);
      let observerQueued=false;
      const observer=new MutationObserver(mutations=>{
        if(!pickerState||observerQueued)return;
        if(!mutations.some(m=>m.type==='childList'&&(m.addedNodes.length||m.removedNodes.length)))return;
        observerQueued=true;
        queueMicrotask(()=>{
          observerQueued=false;
          markAutoPickerRows();
        });
      });
      observer.observe(list,{childList:true,subtree:false});
    }
    if(confirm)confirm.onclick=confirmPickerV53;
    if(modal)modal.dataset.v53Date=normalized;
    updateCopy();
    queueMicrotask(markAutoPickerRows);
  }

  function install(){
    if(installed)return;
    if(typeof data==='undefined'||typeof window.openTodayPeoplePicker!=='function'||typeof window.saveData!=='function'||typeof window.renderAll!=='function')return;
    installed=true;

    syncAll();

    const baseSave=window.saveData;
    const wrappedSave=function(){syncAll();return baseSave.apply(this,arguments)};
    window.saveData=wrappedSave;
    try{saveData=wrappedSave}catch(_){}

    const baseRenderAll=window.renderAll;
    const wrappedRenderAll=function(){syncAll();const out=baseRenderAll.apply(this,arguments);queueMicrotask(updateCopy);return out};
    window.renderAll=wrappedRenderAll;
    try{renderAll=wrappedRenderAll}catch(_){}

    const baseOpen=window.openTodayPeoplePicker;
    window.openTodayPeoplePicker=function(date){
      const normalized=validDateKey(date)?String(date):(typeof todayKST==='function'?todayKST():new Date().toISOString().slice(0,10));
      syncDate(normalized);
      const out=baseOpen.apply(this,arguments);
      preparePicker(normalized);
      return out;
    };
    try{openTodayPeoplePicker=window.openTodayPeoplePicker}catch(_){}

    try{if(typeof renderAll==='function')renderAll('CF MWS V 1.0.2 자동 함께한 사람 동기화')}catch(e){console.error('CF MWS V 1.0.2 initial render',e)}
    updateCopy();
    window.dispatchEvent(new CustomEvent('mawang:v102-ready'));
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    try{install()}catch(e){console.error('CF MWS V 1.0.2 install failed',e)}
    if(installed||tries>240)clearInterval(timer);
  },50);
})();
