/* WARDOGS Phase 144 - single reliable manager frame image layer */
(()=>{
'use strict';
if(window.__mwsWardogsManagerV122)return;
window.__mwsWardogsManagerV122=true;

const CLASS_META=Object.freeze([
  {id:'assault',label:'ASSAULT'},
  {id:'medic',label:'MEDIC'},
  {id:'recon',label:'RECON'},
  {id:'support',label:'SUPPORT'},
  {id:'driver',label:'DRIVER'},
  {id:'pilot',label:'PILOT'}
]);
const CLASS_RANK=new Map(CLASS_META.map((item,index)=>[item.id,index]));

const CLASS_FRAMES=Object.freeze({
  assault:'assets/wardogs-frames/assault.webp?v=phase150',
  medic:'assets/wardogs-frames/medic.webp?v=phase150',
  recon:'assets/wardogs-frames/recon.webp?v=phase150',
  support:'assets/wardogs-frames/support.webp?v=phase150',
  driver:'assets/wardogs-frames/driver.webp?v=phase150',
  pilot:'assets/wardogs-frames/pilot.webp?v=phase150'
});

let modal=null;
let selectedId='';
let selectedContactId='';
let draftPortraitSource='contact';
let draftPortraitX=50;
let draftPortraitY=50;
let draftPortraitScale=1;
let portraitPointerId=0;
let portraitPointerStartClientX=0;
let portraitPointerStartClientY=0;
let portraitPointerStartX=50;
let portraitPointerStartY=50;
let pendingFile=null;
let pendingPreviewUrl='';
let existingPreviewUrl='';
let previewToken=0;
let busy=false;
let draftDirty=false;
let lastFocus=null;
let orderClass='assault';
let dragCardId='';
let dragClassId='';
let pointerOrderId=0;
let pointerSourceId='';
let pointerTargetId='';
let pointerAfter=false;
let pointerMoved=false;
let pointerStartY=0;
let suppressCardClickUntil=0;

function isAdmin(){return document.body?.dataset?.mwsMode==='admin'}
function state(){
  const api=window.mwsWardogsDataV119;
  return api?.get?.()||{schemaVersion:1,cards:[]};
}
function cards(){
  return (state().cards||[]).slice().sort((a,b)=>{
    const ca=CLASS_RANK.get(String(a?.classId||''))??99;
    const cb=CLASS_RANK.get(String(b?.classId||''))??99;
    return ca-cb||(Number(a?.order)||0)-(Number(b?.order)||0)||String(a?.createdAt||'').localeCompare(String(b?.createdAt||''));
  });
}
function cardById(id){return cards().find(card=>String(card?.id||'')===String(id||''))||null}
function classCards(classId=orderClass){
  const id=String(classId||'').trim().toLowerCase();
  return cards().filter(card=>card.classId===id);
}
function contactLink(value){return window.mwsWardogsDataV119?.resolveContactLink?.(value)||{contactId:String(value?.contactId||value||''),linked:false,orphaned:true,contact:null}}
function media(){return window.mwsWardogsMediaV1}
function createId(){
  const shared=window.mwsWardogsDataV119?.createId;
  if(typeof shared==='function')return shared();
  return 'wdc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
}
function clsLabel(id){return CLASS_META.find(item=>item.id===id)?.label||String(id||'').toUpperCase()}
function esc(value=''){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]))}
function cloneWardogs(){return JSON.parse(JSON.stringify(state()))}
function setBusy(next){
  busy=Boolean(next);
  modal?.querySelector('.wardogs-manager-editor-v122')?.classList.toggle('is-busy',busy);
  modal?.querySelectorAll('button,input,select').forEach(el=>{
    if(el.matches('[data-wardogs-manager-close]'))return;
    el.disabled=busy||(!isAdmin()&&el.matches('[data-wardogs-manager-write]'));
  });
}
function setStatus(message='',kind=''){
  const el=modal?.querySelector('[data-wardogs-manager-status]');
  if(!el)return;
  el.textContent=message||'WARDOGS 카드 정보를 관리합니다.';
  el.className='wardogs-manager-status-v122'+(kind?' '+kind:'');
}
function clearObjectUrl(name){
  const value=name==='pending'?pendingPreviewUrl:existingPreviewUrl;
  if(value){try{URL.revokeObjectURL(value)}catch(_){}}
  if(name==='pending')pendingPreviewUrl='';
  else existingPreviewUrl='';
}
function clearPendingFile(){
  pendingFile=null;
  clearObjectUrl('pending');
  const input=modal?.querySelector('[data-wardogs-manager-file]');
  if(input)input.value='';
}
function markDirty(){draftDirty=true}

function clampPortrait(value,min,max,fallback){
  const n=Number(value);
  if(!Number.isFinite(n))return fallback;
  return Math.min(max,Math.max(min,n));
}
function currentEditorClass(){
  return String(modal?.querySelector('[data-wardogs-manager-class]')?.value||orderClass||'assault').toLowerCase();
}
function renderPortraitFrame(){
  const layer=modal?.querySelector('[data-wardogs-manager-frame]');
  if(!layer)return;
  const classId=currentEditorClass();
  const frameSrc=CLASS_FRAMES[classId]||CLASS_FRAMES.assault;
  layer.dataset.wardogsManagerFrame=classId;
  if(layer.getAttribute('src')!==frameSrc)layer.setAttribute('src',frameSrc);
  layer.hidden=false;
}
function renderPortraitGeometryControls(){
  const zoom=modal?.querySelector('[data-wardogs-manager-portrait-scale]');
  const value=modal?.querySelector('[data-wardogs-manager-portrait-scale-value]');
  if(zoom)zoom.value=String(draftPortraitScale);
  if(value)value.textContent=Math.round(draftPortraitScale*100)+'%';
}
function applyDraftPortraitGeometry(img){
  if(!img)return;
  img.classList.add('wardogs-manager-portrait-image-v137');
  img.style.setProperty('--wd-manager-portrait-x',draftPortraitX+'%');
  img.style.setProperty('--wd-manager-portrait-y',draftPortraitY+'%');
  img.style.setProperty('--wd-manager-portrait-scale',String(draftPortraitScale));
}
function refreshDraftPortraitGeometry(){
  modal?.querySelectorAll('.wardogs-manager-portrait-image-v137').forEach(applyDraftPortraitGeometry);
  renderPortraitGeometryControls();
}
function setDraftPortraitGeometry(next,{dirty=true}={}){
  if(Object.prototype.hasOwnProperty.call(next,'x'))draftPortraitX=clampPortrait(next.x,0,100,50);
  if(Object.prototype.hasOwnProperty.call(next,'y'))draftPortraitY=clampPortrait(next.y,0,100,50);
  if(Object.prototype.hasOwnProperty.call(next,'scale'))draftPortraitScale=clampPortrait(next.scale,0.25,3,1);
  refreshDraftPortraitGeometry();
  if(dirty)markDirty();
}
function resetDraftPortraitGeometry(){
  if(busy||!isAdmin())return;
  setDraftPortraitGeometry({x:50,y:50,scale:1});
  setStatus('사진 위치와 확대를 중앙 기본값으로 초기화했습니다.','warn');
}
function portraitPointerCleanup(){
  const drop=modal?.querySelector('[data-wardogs-manager-drop]');
  if(drop&&portraitPointerId){
    try{drop.releasePointerCapture?.(portraitPointerId)}catch(_){}
  }
  portraitPointerId=0;
  drop?.classList.remove('is-positioning-v137');
}
function handlePortraitPointerDown(event){
  const drop=modal?.querySelector('[data-wardogs-manager-drop]');
  if(!drop||busy||!isAdmin()||event.button>0||!drop.classList.contains('has-portrait-v137'))return;
  portraitPointerId=event.pointerId;
  portraitPointerStartClientX=event.clientX;
  portraitPointerStartClientY=event.clientY;
  portraitPointerStartX=draftPortraitX;
  portraitPointerStartY=draftPortraitY;
  drop.classList.add('is-positioning-v137');
  try{drop.setPointerCapture?.(event.pointerId)}catch(_){}
  event.preventDefault();
}
function handlePortraitPointerMove(event){
  const drop=modal?.querySelector('[data-wardogs-manager-drop]');
  if(!drop||!portraitPointerId||event.pointerId!==portraitPointerId)return;
  const rect=drop.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const dx=(event.clientX-portraitPointerStartClientX)/rect.width*100;
  const dy=(event.clientY-portraitPointerStartClientY)/rect.height*100;
  setDraftPortraitGeometry({x:portraitPointerStartX-dx,y:portraitPointerStartY-dy});
  event.preventDefault();
}
function handlePortraitPointerEnd(event){
  if(!portraitPointerId||event.pointerId!==portraitPointerId)return;
  portraitPointerCleanup();
}
function updateCount(){
  const chip=document.getElementById('wardogsManageCount');
  if(chip)chip.textContent=`${cards().length}장`;
}
function managerModeReady(){
  return isAdmin()&&window.mwsWardogsDataV119&&window.mwsWardogsMediaV1;
}
async function waitForWardogsPart(){
  if(typeof window.mwsV55EgressReport!=='function')return true;
  for(let i=0;i<60;i++){
    try{
      if(window.mwsV55EgressReport()?.loadedParts?.includes('wardogs'))return true;
    }catch(_){}
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  return false;
}
function normalizeStateInPlace(){
  const root=state();
  const normalized=window.mwsWardogsDataV119?.normalize?.(root);
  if(normalized){root.schemaVersion=normalized.schemaVersion;root.cards=normalized.cards}
  return root;
}
async function callSave(reason){
  let saved=true;
  if(typeof window.saveData==='function')saved=window.saveData(reason);
  else{
    try{if(typeof saveData==='function')saved=saveData(reason)}catch(_){saved=false}
  }
  if(saved===false)throw new Error('로컬 데이터 반영에 실패했습니다.');
  if(isAdmin()&&typeof window.mwsV55SaveNow==='function'){
    const cloudOk=await window.mwsV55SaveNow();
    if(!cloudOk)throw new Error('Cloudflare D1 저장에 실패했습니다.');
  }
  return true;
}
async function restoreSnapshot(snapshot){
  try{
    const root=state();
    root.schemaVersion=Number(snapshot?.schemaVersion)||1;
    root.cards=Array.isArray(snapshot?.cards)?JSON.parse(JSON.stringify(snapshot.cards)):[];
    if(typeof window.saveData==='function')window.saveData('WARDOGS 카드 변경 롤백');
    if(isAdmin()&&typeof window.mwsV55SaveNow==='function')await window.mwsV55SaveNow();
  }catch(error){console.error('WARDOGS manager rollback failed',error)}
}
function referencedImage(id){
  id=String(id||'');if(!id)return false;
  return cards().some(card=>String(card?.imageId||'')===id||String(card?.portraitImageId||'')===id);
}
async function cleanupImageIfUnused(id){
  id=String(id||'');if(!id||referencedImage(id))return false;
  try{return await media()?.remove?.(id)}
  catch(error){console.warn('WARDOGS unreferenced media cleanup failed',id,error);return false}
}
async function imageDimensions(blob){
  if(typeof createImageBitmap!=='function')return {width:0,height:0};
  try{
    const bitmap=await createImageBitmap(blob);
    const result={width:Number(bitmap.width)||0,height:Number(bitmap.height)||0};
    try{bitmap.close?.()}catch(_){}
    return result;
  }catch(_){return {width:0,height:0}}
}

function renderClassTabs(){
  const root=modal;if(!root)return;
  root.querySelectorAll('[data-wardogs-manager-order-class]').forEach(btn=>{
    const classId=String(btn.dataset.wardogsManagerOrderClass||'');
    const count=classCards(classId).length;
    btn.classList.toggle('active',classId===orderClass);
    btn.setAttribute('aria-pressed',classId===orderClass?'true':'false');
    const countEl=btn.querySelector('[data-wardogs-manager-class-count]');
    if(countEl)countEl.textContent=String(count);
  });
}
function listHtml(){
  const list=classCards(orderClass);
  if(!list.length)return `<div class="wardogs-manager-empty-list-v122">${esc(clsLabel(orderClass))} 클래스에 등록된 카드가 없습니다.</div>`;
  const canDrag=isAdmin()&&list.length>1;
  return list.map(card=>{
    const link=contactLink(card);
    const name=link.linked?String(link.contact?.name||'이름 없음'):`연결 끊김 · ${String(card.contactId||'ID 없음')}`;
    const stateClass=link.orphaned?'orphan':(card.active===false?'off':'');
    const stateText=link.orphaned?'ORPHAN':(card.active===false?'OFF':'ACTIVE');
    return `<button type="button" class="wardogs-manager-item-v122 ${selectedId===card.id?'active':''}" data-wardogs-manager-card="${esc(card.id)}" data-wardogs-manager-card-class="${esc(card.classId)}" draggable="${canDrag?'true':'false'}">
      <span class="wardogs-manager-drag-handle-v123" data-wardogs-manager-touch-handle aria-label="카드 순서 이동 핸들">⋮⋮</span>
      <span><span class="wardogs-manager-item-name-v122">${esc(name)}</span><span class="wardogs-manager-item-meta-v122">${esc(clsLabel(card.classId))} · ORDER ${Number(card.order)||0}</span></span>
      <span class="wardogs-manager-item-state-v122 ${stateClass}">${stateText}</span>
    </button>`;
  }).join('');
}
function clearOrderDropMarkers(){
  modal?.querySelectorAll('.wardogs-manager-item-v122.drop-before,.wardogs-manager-item-v122.drop-after,.wardogs-manager-item-v122.dragging,.wardogs-manager-item-v122.touch-ordering').forEach(el=>el.classList.remove('drop-before','drop-after','dragging','touch-ordering'));
}
function setOrderClass(classId){
  const next=String(classId||'').trim().toLowerCase();
  if(!CLASS_RANK.has(next)||busy)return;
  orderClass=next;
  renderList();
  setStatus(`${clsLabel(orderClass)} 클래스 카드만 표시 중입니다. 같은 클래스 안에서 드래그해 순서를 변경할 수 있습니다.`);
}
function handleOrderDragStart(event){
  const btn=event.currentTarget;
  const card=cardById(btn?.dataset?.wardogsManagerCard);
  if(!isAdmin()||busy||!card||card.classId!==orderClass||classCards(orderClass).length<2){event.preventDefault();return}
  if(draftDirty){
    event.preventDefault();
    setStatus('편집 중인 변경사항을 먼저 저장하거나 취소한 뒤 순서를 변경해 주세요.','warn');
    return;
  }
  dragCardId=card.id;
  dragClassId=card.classId;
  try{event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',card.id)}catch(_){}
  requestAnimationFrame(()=>btn.classList.add('dragging'));
}
function handleOrderDragOver(event){
  const target=cardById(event.currentTarget?.dataset?.wardogsManagerCard);
  if(!dragCardId||!target||target.id===dragCardId||target.classId!==dragClassId||target.classId!==orderClass)return;
  event.preventDefault();
  try{event.dataTransfer.dropEffect='move'}catch(_){}
  modal?.querySelectorAll('.wardogs-manager-item-v122.drop-before,.wardogs-manager-item-v122.drop-after').forEach(el=>el.classList.remove('drop-before','drop-after'));
  const rect=event.currentTarget.getBoundingClientRect();
  event.currentTarget.classList.add(event.clientY>rect.top+rect.height/2?'drop-after':'drop-before');
}
async function persistClassOrder(sourceId,targetId,after){
  if(busy||!isAdmin())return false;
  const source=cardById(sourceId),target=cardById(targetId);
  if(!source||!target||source.id===target.id||source.classId!==target.classId||source.classId!==orderClass)return false;
  const snapshot=cloneWardogs();
  const ordered=classCards(orderClass).map(card=>card.id);
  const from=ordered.indexOf(source.id),targetIndex=ordered.indexOf(target.id);
  if(from<0||targetIndex<0)return false;
  ordered.splice(from,1);
  let insertAt=ordered.indexOf(target.id)+(after?1:0);
  insertAt=Math.max(0,Math.min(ordered.length,insertAt));
  ordered.splice(insertAt,0,source.id);
  const before=classCards(orderClass).map(card=>card.id).join('|');
  const next=ordered.join('|');
  if(before===next)return true;

  setBusy(true);
  setStatus(`${clsLabel(orderClass)} 클래스 순서를 저장하는 중입니다.`,'warn');
  try{
    const rootState=state(),now=new Date().toISOString(),rank=new Map(ordered.map((id,index)=>[id,index]));
    rootState.cards.forEach(card=>{
      if(card.classId===orderClass&&rank.has(card.id)){
        card.order=rank.get(card.id);
        card.updatedAt=now;
      }
    });
    normalizeStateInPlace();
    await callSave('WARDOGS 카드 순서 변경');
    renderList();
    setStatus(`${clsLabel(orderClass)} 클래스 순서를 저장했습니다.`,'ok');
    return true;
  }catch(error){
    console.error('WARDOGS class order save failed',error);
    await restoreSnapshot(snapshot);
    renderList();
    setStatus(error?.message||'WARDOGS 카드 순서 저장에 실패했습니다.','error');
    return false;
  }finally{setBusy(false)}
}
function handleOrderDrop(event){
  const target=cardById(event.currentTarget?.dataset?.wardogsManagerCard);
  if(!dragCardId||!target||target.classId!==dragClassId)return;
  event.preventDefault();
  const after=event.currentTarget.classList.contains('drop-after');
  const sourceId=dragCardId;
  dragCardId='';dragClassId='';
  clearOrderDropMarkers();
  void persistClassOrder(sourceId,target.id,after);
}
function handleOrderDragEnd(){
  dragCardId='';dragClassId='';
  clearOrderDropMarkers();
}
function touchPointerSupported(event){
  return event?.pointerType==='touch'||event?.pointerType==='pen';
}
function touchOrderCleanup(handle=null){
  if(handle&&pointerOrderId){
    try{if(handle.hasPointerCapture?.(pointerOrderId))handle.releasePointerCapture(pointerOrderId)}catch(_){}
  }
  pointerOrderId=0;
  pointerSourceId='';
  pointerTargetId='';
  pointerAfter=false;
  pointerMoved=false;
  pointerStartY=0;
  dragCardId='';
  dragClassId='';
  clearOrderDropMarkers();
  document.body.classList.remove('mws-wardogs-touch-ordering-v127');
}
function autoScrollTouchOrder(clientY){
  const pane=modal?.querySelector('.wardogs-manager-list-pane-v122');
  if(!pane)return;
  const rect=pane.getBoundingClientRect();
  const edge=Math.min(72,Math.max(42,rect.height*.18));
  let delta=0;
  if(clientY<rect.top+edge)delta=-Math.max(5,Math.round((rect.top+edge-clientY)/5));
  else if(clientY>rect.bottom-edge)delta=Math.max(5,Math.round((clientY-(rect.bottom-edge))/5));
  if(delta)pane.scrollBy({top:delta,left:0,behavior:'auto'});
}
function updateTouchOrderTarget(clientX,clientY){
  autoScrollTouchOrder(clientY);
  const hit=document.elementFromPoint(clientX,clientY)?.closest?.('[data-wardogs-manager-card]');
  const target=hit?cardById(hit.dataset.wardogsManagerCard):null;
  if(!target||target.id===pointerSourceId||target.classId!==dragClassId||target.classId!==orderClass)return;
  modal?.querySelectorAll('.wardogs-manager-item-v122.drop-before,.wardogs-manager-item-v122.drop-after').forEach(el=>el.classList.remove('drop-before','drop-after'));
  const rect=hit.getBoundingClientRect();
  pointerTargetId=target.id;
  pointerAfter=clientY>rect.top+rect.height/2;
  hit.classList.add(pointerAfter?'drop-after':'drop-before');
}
function handleTouchOrderPointerDown(event){
  if(!touchPointerSupported(event))return;
  const handle=event.currentTarget;
  const btn=handle?.closest?.('[data-wardogs-manager-card]');
  const card=btn?cardById(btn.dataset.wardogsManagerCard):null;
  if(!isAdmin()||busy||!card||card.classId!==orderClass||classCards(orderClass).length<2)return;
  if(draftDirty){
    event.preventDefault();
    event.stopPropagation();
    setStatus('편집 중인 변경사항을 먼저 저장하거나 취소한 뒤 순서를 변경해 주세요.','warn');
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  pointerOrderId=event.pointerId;
  pointerSourceId=card.id;
  pointerTargetId='';
  pointerAfter=false;
  pointerMoved=false;
  pointerStartY=event.clientY;
  dragCardId=card.id;
  dragClassId=card.classId;
  try{handle.setPointerCapture?.(event.pointerId)}catch(_){}
  document.body.classList.add('mws-wardogs-touch-ordering-v127');
  btn.classList.add('dragging','touch-ordering');
  setStatus(`${clsLabel(orderClass)} 카드를 위/아래로 이동한 뒤 손가락을 놓으세요.`,'warn');
}
function handleTouchOrderPointerMove(event){
  if(!touchPointerSupported(event)||event.pointerId!==pointerOrderId||!pointerSourceId)return;
  event.preventDefault();
  event.stopPropagation();
  if(Math.abs(event.clientY-pointerStartY)>=4)pointerMoved=true;
  updateTouchOrderTarget(event.clientX,event.clientY);
}
function handleTouchOrderPointerUp(event){
  if(!touchPointerSupported(event)||event.pointerId!==pointerOrderId||!pointerSourceId)return;
  event.preventDefault();
  event.stopPropagation();
  const handle=event.currentTarget;
  const sourceId=pointerSourceId;
  const targetId=pointerTargetId;
  const after=pointerAfter;
  const moved=pointerMoved&&Boolean(targetId)&&targetId!==sourceId;
  suppressCardClickUntil=Date.now()+450;
  touchOrderCleanup(handle);
  if(moved)void persistClassOrder(sourceId,targetId,after);
  else setStatus(`${clsLabel(orderClass)} 클래스 카드만 표시 중입니다. 이동할 카드의 핸들을 위/아래로 드래그하세요.`);
}
function handleTouchOrderPointerCancel(event){
  if(event.pointerId!==pointerOrderId)return;
  event.preventDefault();
  event.stopPropagation();
  touchOrderCleanup(event.currentTarget);
  setStatus(`${clsLabel(orderClass)} 카드 순서 이동을 취소했습니다.`,'warn');
}
function renderList(){
  const box=modal?.querySelector('[data-wardogs-manager-list]');
  if(box)box.innerHTML=listHtml();
  box?.querySelectorAll('[data-wardogs-manager-card]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(Date.now()<suppressCardClickUntil)return;
      selectCard(btn.dataset.wardogsManagerCard);
    });
    btn.addEventListener('dragstart',handleOrderDragStart);
    btn.addEventListener('dragover',handleOrderDragOver);
    btn.addEventListener('drop',handleOrderDrop);
    btn.addEventListener('dragend',handleOrderDragEnd);
    const handle=btn.querySelector('[data-wardogs-manager-touch-handle]');
    handle?.addEventListener('pointerdown',handleTouchOrderPointerDown);
    handle?.addEventListener('pointermove',handleTouchOrderPointerMove);
    handle?.addEventListener('pointerup',handleTouchOrderPointerUp);
    handle?.addEventListener('pointercancel',handleTouchOrderPointerCancel);
  });
  renderClassTabs();
  const modalCount=modal?.querySelector('[data-wardogs-manager-modal-count]');
  if(modalCount)modalCount.textContent=`${cards().length}장`;
  updateCount();
}
function selectedContactHtml(){
  const link=contactLink(selectedContactId);
  if(!selectedContactId)return '<span><strong>연락처 미선택</strong><small>아래 검색에서 WARDOGS 인원을 선택하세요.</small></span>';
  if(!link.linked)return `<span><strong>연결이 끊긴 연락처</strong><small>${esc(selectedContactId)}</small></span>`;
  return `<span><strong>${esc(link.contact?.name||'이름 없음')}</strong><small>ID · ${esc(link.contactId)}</small></span>`;
}
function renderSelectedContact(){
  const box=modal?.querySelector('[data-wardogs-manager-selected-contact]');
  if(box)box.innerHTML=selectedContactHtml();
}
function renderContactResults(){
  const root=modal;if(!root)return;
  const query=root.querySelector('[data-wardogs-manager-search]')?.value||'';
  const box=root.querySelector('[data-wardogs-manager-search-results]');
  if(!box)return;
  const list=window.mwsWardogsDataV119?.searchContacts?.(query,{limit:40})||[];
  box.innerHTML=list.length?list.map(contact=>`<button type="button" class="wardogs-manager-contact-result-v122" data-wardogs-manager-contact="${esc(contact.id)}">
      <span><strong>${esc(contact.name||'이름 없음')}</strong><small>${esc((contact.labels||[]).join(' · ')||'라벨 없음')}</small></span><span>선택</span>
    </button>`).join(''):'<div class="wardogs-manager-empty-list-v122">검색 결과가 없습니다.</div>';
  box.querySelectorAll('[data-wardogs-manager-contact]').forEach(btn=>btn.addEventListener('click',()=>{
    selectedContactId=String(btn.dataset.wardogsManagerContact||'');
    markDirty();
    renderSelectedContact();
    renderContactResults();
    if(draftPortraitSource==='contact')void renderExistingPreview(currentDraftCard(),++previewToken);
  }));
}
function renderPortraitSourceControls(){
  modal?.querySelectorAll('[data-wardogs-manager-source]').forEach(btn=>{
    const active=String(btn.dataset.wardogsManagerSource||'')===draftPortraitSource;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',active?'true':'false');
  });
}
function setPortraitSource(source,{dirty=true}={}){
  const next=source==='custom'?'custom':'contact';
  if(draftPortraitSource===next){renderPortraitSourceControls();return}
  draftPortraitSource=next;
  if(dirty)markDirty();
  renderPortraitSourceControls();
  void renderExistingPreview(currentDraftCard(),++previewToken);
  setStatus(next==='contact'?'연락처 프로필 이미지를 사용합니다.':'WARDOGS 전용 커스텀 이미지를 사용합니다.',dirty?'warn':'');
}
async function renderExistingPreview(card,token){
  const drop=modal?.querySelector('[data-wardogs-manager-drop]');
  const stateEl=modal?.querySelector('[data-wardogs-manager-drop-state]');
  if(!drop||!stateEl)return;
  clearObjectUrl('existing');
  portraitPointerCleanup();
  drop.classList.remove('has-portrait-v137');
  drop.querySelectorAll('.wardogs-manager-portrait-image-v137').forEach(img=>img.remove());
  renderPortraitSourceControls();
  renderPortraitFrame();
  renderPortraitGeometryControls();

  if(draftPortraitSource==='contact'){
    const link=contactLink(selectedContactId||card||'');
    const contact=link?.contact||null;
    const imageUrl=String(contact?.image||'').trim();
    if(!link?.linked){
      stateEl.hidden=false;
      stateEl.innerHTML='<strong>연락처 미선택</strong>먼저 WARDOGS 인원과 연결할 연락처를 선택하세요.';
      return;
    }
    if(!imageUrl){
      stateEl.hidden=false;
      stateEl.innerHTML='<strong>연락처 이미지 없음</strong>연락처에 프로필 이미지를 등록하면 자동으로 사용됩니다.';
      return;
    }
    const img=document.createElement('img');
    img.alt=`${String(contact?.name||'WARDOGS')} 연락처 이미지`;
    img.draggable=false;
    img.dataset.contactId=String(link.contactId||'');
    applyDraftPortraitGeometry(img);
    drop.classList.add('has-portrait-v137');
    const ready=()=>{if(token===previewToken)stateEl.hidden=true};
    img.onload=ready;
    img.onerror=()=>{
      if(token!==previewToken)return;
      stateEl.hidden=false;
      stateEl.innerHTML='<strong>연락처 이미지 오류</strong>현재 프로필 이미지를 불러오지 못했습니다.';
    };
    stateEl.hidden=true;
    drop.appendChild(img);
    img.src=imageUrl;
    if(img.complete&&img.naturalWidth>0)queueMicrotask(ready);
    return;
  }

  if(pendingFile){
    clearObjectUrl('pending');
    pendingPreviewUrl=URL.createObjectURL(pendingFile);
    const img=document.createElement('img');
    img.alt='선택한 WARDOGS 커스텀 이미지 미리보기';
    img.draggable=false;
    applyDraftPortraitGeometry(img);
    drop.classList.add('has-portrait-v137');
    const ready=()=>{if(token===previewToken)stateEl.hidden=true};
    img.onload=ready;
    img.onerror=()=>{
      if(token!==previewToken)return;
      stateEl.hidden=false;
      stateEl.innerHTML='<strong>커스텀 이미지 오류</strong>선택한 이미지를 불러오지 못했습니다.';
    };
    stateEl.hidden=true;
    drop.appendChild(img);
    img.src=pendingPreviewUrl;
    if(img.complete&&img.naturalWidth>0)queueMicrotask(ready);
    return;
  }

  const imageId=String(card?.portraitImageId||card?.imageId||'').trim();
  if(!imageId){
    stateEl.hidden=false;
    stateEl.innerHTML='<strong>커스텀 이미지 없음</strong>이미지를 드래그하거나 아래 버튼으로 파일을 선택하세요.';
    return;
  }
  try{
    const blob=await media()?.getBlob?.(imageId);
    if(token!==previewToken)return;
    if(!(blob instanceof Blob)){
      stateEl.hidden=false;
      stateEl.innerHTML='<strong>커스텀 이미지 없음</strong>등록된 이미지 파일을 찾지 못했습니다.';
      return;
    }
    existingPreviewUrl=URL.createObjectURL(blob);
    const img=document.createElement('img');
    img.alt='WARDOGS 커스텀 이미지';
    img.draggable=false;
    applyDraftPortraitGeometry(img);
    drop.classList.add('has-portrait-v137');
    const ready=()=>{if(token===previewToken)stateEl.hidden=true};
    img.onload=ready;
    img.onerror=()=>{
      if(token!==previewToken)return;
      stateEl.hidden=false;
      stateEl.innerHTML='<strong>커스텀 이미지 오류</strong>등록된 이미지를 불러오지 못했습니다.';
    };
    stateEl.hidden=true;
    drop.appendChild(img);
    img.src=existingPreviewUrl;
    if(img.complete&&img.naturalWidth>0)queueMicrotask(ready);
  }catch(error){
    console.warn('WARDOGS manager portrait preview failed',error);
    if(token===previewToken){
      stateEl.hidden=false;
      stateEl.innerHTML='<strong>커스텀 이미지 오류</strong>등록된 이미지를 불러오지 못했습니다.';
    }
  }
}
function currentDraftCard(){return selectedId?cardById(selectedId):null}
function renderEditor(){
  const root=modal;if(!root)return;
  const card=currentDraftCard();
  selectedContactId=card?String(card.contactId||''):selectedContactId;
  draftPortraitSource=card?.portraitSource==='custom'?'custom':'contact';
  draftPortraitX=clampPortrait(card?.portraitPositionX,0,100,50);
  draftPortraitY=clampPortrait(card?.portraitPositionY,0,100,50);
  draftPortraitScale=clampPortrait(card?.portraitScale,0.25,3,1);
  root.querySelector('[data-wardogs-manager-title]').textContent=card?'WARDOGS 카드 수정':'새 WARDOGS 카드';
  root.querySelector('[data-wardogs-manager-class]').value=card?.classId||orderClass;
  root.querySelector('[data-wardogs-manager-active]').checked=card?card.active!==false:true;
  root.querySelector('[data-wardogs-manager-delete]').hidden=!card;
  root.querySelector('[data-wardogs-manager-save]').textContent=card?'변경 저장':'카드 추가';
  root.querySelector('[data-wardogs-manager-search]').value='';
  renderSelectedContact();
  renderContactResults();
  renderPortraitSourceControls();
  renderPortraitGeometryControls();
  renderPortraitFrame();
  const token=++previewToken;
  void renderExistingPreview(card,token);
  setBusy(busy);
}
function resetDraftForNew(){
  selectedId='';
  selectedContactId='';
  draftPortraitSource='contact';
  draftPortraitX=50;draftPortraitY=50;draftPortraitScale=1;
  portraitPointerCleanup();
  draftDirty=false;
  clearPendingFile();
  renderList();
  renderEditor();
  setStatus('새 카드에 연결할 연락처와 클래스를 선택하세요. 이미지는 연락처 프로필을 기본으로 사용합니다.');
}
function selectCard(id){
  if(busy)return;
  if(draftDirty&&!window.confirm('저장하지 않은 변경사항을 버리고 다른 카드를 열까요?'))return;
  selectedId=String(id||'');
  selectedContactId='';
  draftDirty=false;
  clearPendingFile();
  renderList();
  renderEditor();
  const card=cardById(selectedId),link=contactLink(card||'');
  setStatus(link.orphaned?'연결된 연락처가 삭제되었습니다. 다른 연락처로 재연결할 수 있습니다.':'카드 정보를 수정할 수 있습니다.',link.orphaned?'warn':'');
}
function validateFile(file){
  if(!(file instanceof File))return '이미지 파일을 선택해 주세요.';
  if(!String(file.type||'').toLowerCase().startsWith('image/'))return '이미지 파일만 등록할 수 있습니다.';
  const limit=Math.max(1,Number(media()?.maxBytes)||32*1024*1024);
  if(file.size<1)return '빈 파일은 등록할 수 없습니다.';
  if(file.size>limit)return 'WARDOGS 카드 이미지는 32MB 이하만 등록할 수 있습니다.';
  return '';
}
function setPendingFile(file){
  const error=validateFile(file);
  if(error){setStatus(error,'error');return false}
  pendingFile=file;
  draftPortraitSource='custom';
  markDirty();
  renderPortraitSourceControls();
  void renderExistingPreview(currentDraftCard(),++previewToken);
  setStatus('커스텀 이미지가 선택되었습니다. 저장하면 WARDOGS 전용 이미지로 Cloudflare R2에 반영됩니다.','warn');
  return true;
}
async function saveDraft(){
  if(busy||!isAdmin())return;
  const root=modal;
  const classId=String(root?.querySelector('[data-wardogs-manager-class]')?.value||'');
  const active=root?.querySelector('[data-wardogs-manager-active]')?.checked!==false;
  const portraitSource=draftPortraitSource==='custom'?'custom':'contact';
  const existing=currentDraftCard();
  if(!selectedContactId){setStatus('연결할 연락처를 선택해 주세요.','error');return}
  if(!CLASS_RANK.has(classId)){setStatus('WARDOGS 클래스를 선택해 주세요.','error');return}

  const fallbackCustomId=String(existing?.portraitImageId||existing?.imageId||'').trim();
  if(portraitSource==='custom'&&!pendingFile&&!fallbackCustomId){
    setStatus('커스텀 이미지를 사용할 경우 이미지 파일을 선택해 주세요.','error');
    return;
  }
  const duplicate=cards().find(card=>card.id!==selectedId&&card.contactId===selectedContactId&&card.classId===classId);
  if(duplicate){setStatus('같은 연락처와 클래스 조합의 카드가 이미 있습니다.','error');return}

  const snapshot=cloneWardogs();
  const previousImageId=String(existing?.imageId||'');
  const previousPortraitImageId=String(existing?.portraitImageId||'');
  let uploadedPortraitId='';
  setBusy(true);
  setStatus('WARDOGS 카드를 저장하는 중입니다.','warn');
  try{
    let portraitImageId=previousPortraitImageId;
    if(portraitSource==='custom'){
      if(pendingFile){
        const dimensions=await imageDimensions(pendingFile);
        const result=await media().put(pendingFile,dimensions);
        portraitImageId=String(result?.id||'');
        uploadedPortraitId=portraitImageId;
        if(!portraitImageId)throw new Error('업로드된 커스텀 이미지 ID를 확인할 수 없습니다.');
      }else if(!portraitImageId&&previousImageId){
        portraitImageId=previousImageId;
      }
    }

    const rootState=state();
    const now=new Date().toISOString();
    if(existing){
      const target=rootState.cards.find(card=>card.id===selectedId);
      if(!target)throw new Error('수정할 카드를 찾을 수 없습니다.');
      const classChanged=target.classId!==classId;
      let nextOrder=Number(target.order)||0;
      if(classChanged){
        const targetOrders=rootState.cards.filter(card=>card.id!==target.id&&card.classId===classId).map(card=>Number(card.order)||0);
        nextOrder=targetOrders.length?Math.max(...targetOrders)+1:0;
      }
      Object.assign(target,{
        contactId:selectedContactId,
        classId,
        imageId:previousImageId,
        portraitSource,
        portraitImageId,
        portraitPositionX:draftPortraitX,
        portraitPositionY:draftPortraitY,
        portraitScale:draftPortraitScale,
        active,
        order:nextOrder,
        updatedAt:now
      });
    }else{
      const classOrders=rootState.cards.filter(card=>card.classId===classId).map(card=>Number(card.order)||0);
      rootState.cards.push({
        id:createId(),
        contactId:selectedContactId,
        classId,
        imageId:'',
        portraitSource,
        portraitImageId,
        portraitPositionX:draftPortraitX,
        portraitPositionY:draftPortraitY,
        portraitScale:draftPortraitScale,
        order:classOrders.length?Math.max(...classOrders)+1:0,
        active,
        createdAt:now,
        updatedAt:now
      });
    }

    normalizeStateInPlace();
    await callSave(existing?'WARDOGS 카드 수정':'WARDOGS 카드 추가');
    if(previousPortraitImageId&&uploadedPortraitId&&previousPortraitImageId!==uploadedPortraitId){
      await cleanupImageIfUnused(previousPortraitImageId);
    }
    const savedCard=cards().find(card=>card.contactId===selectedContactId&&card.classId===classId)||null;
    selectedId=String(savedCard?.id||selectedId||'');
    orderClass=classId;
    draftDirty=false;
    clearPendingFile();
    renderList();
    renderEditor();
    setStatus(existing?'WARDOGS 카드 변경사항을 저장했습니다.':'WARDOGS 카드를 추가했습니다.','ok');
  }catch(error){
    console.error('WARDOGS manager save failed',error);
    await restoreSnapshot(snapshot);
    if(uploadedPortraitId)await cleanupImageIfUnused(uploadedPortraitId);
    setStatus(error?.message||'WARDOGS 카드 저장에 실패했습니다.','error');
  }finally{setBusy(false)}
}
async function deleteCard(){
  if(busy||!isAdmin())return;
  const card=currentDraftCard();if(!card)return;
  const link=contactLink(card);
  const name=link.linked?String(link.contact?.name||'이름 없음'):String(card.contactId||'연결 끊김');
  if(!window.confirm(`${name} · ${clsLabel(card.classId)} 카드를 삭제하시겠습니까?`))return;
  const snapshot=cloneWardogs();
  const oldImageId=String(card.imageId||'');
  const oldPortraitImageId=String(card.portraitImageId||'');
  setBusy(true);setStatus('WARDOGS 카드를 삭제하는 중입니다.','warn');
  try{
    const rootState=state();
    rootState.cards=rootState.cards.filter(item=>item.id!==card.id);
    normalizeStateInPlace();
    await callSave('WARDOGS 카드 삭제');
    await cleanupImageIfUnused(oldImageId);
    if(oldPortraitImageId&&oldPortraitImageId!==oldImageId)await cleanupImageIfUnused(oldPortraitImageId);
    selectedId='';selectedContactId='';draftPortraitSource='contact';draftDirty=false;clearPendingFile();
    renderList();renderEditor();
    setStatus('WARDOGS 카드를 삭제했습니다.','ok');
  }catch(error){
    console.error('WARDOGS manager delete failed',error);
    await restoreSnapshot(snapshot);
    setStatus(error?.message||'WARDOGS 카드 삭제에 실패했습니다.','error');
  }finally{setBusy(false)}
}
function ensureModal(){
  if(modal?.isConnected)return modal;
  const root=document.createElement('div');
  root.id='wardogsManagerModalV122';
  root.className='wardogs-manager-modal-v122';
  root.hidden=true;
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','wardogsManagerTitleV122');
  root.innerHTML=`
    <div class="wardogs-manager-dialog-v122" role="document">
      <div class="wardogs-manager-head-v122">
        <div><div class="wardogs-manager-kicker-v122">WARDOGS PERSONNEL CARD CONTROL</div><h2 id="wardogsManagerTitleV122">WARDOGS 카드 관리</h2></div>
        <button type="button" class="ghost wardogs-manager-close-v122" data-wardogs-manager-close aria-label="WARDOGS 카드 관리 닫기">×</button>
      </div>
      <div class="wardogs-manager-layout-v122">
        <aside class="wardogs-manager-list-pane-v122">
          <div class="wardogs-manager-list-head-v122"><strong>등록 카드</strong><span class="chip" data-wardogs-manager-modal-count>0장</span></div>
          <button type="button" class="primary wardogs-manager-add-v122" data-wardogs-manager-new data-wardogs-manager-write>+ 새 카드</button>
          <div class="wardogs-manager-class-tabs-v123" data-wardogs-manager-class-tabs aria-label="정렬할 WARDOGS 클래스">
            ${CLASS_META.map(item=>`<button type="button" data-wardogs-manager-order-class="${item.id}" aria-pressed="false"><span>${item.label}</span><b data-wardogs-manager-class-count>0</b></button>`).join('')}
          </div>
          <div class="wardogs-manager-order-note-v123">같은 클래스 안에서 카드를 드래그해 표시 순서를 변경합니다.</div>
          <div class="wardogs-manager-list-v122" data-wardogs-manager-list></div>
        </aside>
        <section class="wardogs-manager-editor-v122">
          <div class="wardogs-manager-status-v122" data-wardogs-manager-status>WARDOGS 카드 정보를 관리합니다.</div>
          <div class="space" style="margin-bottom:14px"><div><div class="wardogs-manager-kicker-v122">CARD EDITOR</div><h3 data-wardogs-manager-title style="margin:4px 0 0">새 WARDOGS 카드</h3></div></div>
          <div class="wardogs-manager-form-v122">
            <div class="wardogs-manager-fields-v122">
              <div class="wardogs-manager-field-v122">
                <label>연결 연락처</label>
                <div class="wardogs-manager-contact-selected-v122" data-wardogs-manager-selected-contact></div>
              </div>
              <div class="wardogs-manager-field-v122">
                <label for="wardogsManagerContactSearchV122">연락처 검색</label>
                <input id="wardogsManagerContactSearchV122" data-wardogs-manager-search placeholder="이름, 라벨, 메모 또는 초성 검색" autocomplete="off">
                <div class="wardogs-manager-search-results-v122" data-wardogs-manager-search-results></div>
              </div>
              <div class="wardogs-manager-field-v122">
                <label for="wardogsManagerClassV122">클래스</label>
                <select id="wardogsManagerClassV122" data-wardogs-manager-class data-wardogs-manager-write>
                  ${CLASS_META.map(item=>`<option value="${item.id}">${item.label}</option>`).join('')}
                </select>
              </div>
              <label class="wardogs-manager-active-v122"><input type="checkbox" data-wardogs-manager-active data-wardogs-manager-write checked> <span><strong>활성 카드</strong><br><small>비활성으로 저장하면 향후 갤러리에서 숨길 수 있습니다.</small></span></label>
            </div>
            <div class="wardogs-manager-media-v122">
              <div class="wardogs-manager-source-label-v133">이미지 소스</div>
              <div class="wardogs-manager-source-v133" data-wardogs-manager-source-group>
                <button type="button" data-wardogs-manager-source="contact" data-wardogs-manager-write aria-pressed="true"><strong>연락처 이미지</strong><small>기본 · 자동 연결</small></button>
                <button type="button" data-wardogs-manager-source="custom" data-wardogs-manager-write aria-pressed="false"><strong>커스텀 이미지</strong><small>WARDOGS 전용</small></button>
              </div>
              <div class="wardogs-manager-drop-v122" data-wardogs-manager-drop>
                <img class="wardogs-manager-frame-v140" data-wardogs-manager-frame alt="" draggable="false" aria-hidden="true">
                <div class="wardogs-manager-drop-state-v122" data-wardogs-manager-drop-state><strong>연락처 이미지</strong>선택한 연락처의 프로필 이미지를 자동으로 사용합니다.</div>
              </div>
              <div class="wardogs-manager-portrait-tools-v137">
                <div class="wardogs-manager-portrait-help-v137"><strong>사진 구도 조절</strong><span>미리보기 사진을 마우스 또는 터치로 드래그해 위치를 이동합니다.</span></div>
                <label class="wardogs-manager-portrait-scale-v137"><span>확대</span><input type="range" min="0.25" max="3" step="0.05" value="1" data-wardogs-manager-portrait-scale data-wardogs-manager-write><output data-wardogs-manager-portrait-scale-value>100%</output></label>
                <button type="button" class="secondary wardogs-manager-portrait-reset-v137" data-wardogs-manager-portrait-reset data-wardogs-manager-write>중앙 / 100% 초기화</button>
              </div>
              <input type="file" accept="image/*" hidden data-wardogs-manager-file data-wardogs-manager-write>
              <div class="wardogs-manager-media-actions-v122">
                <button type="button" class="secondary" data-wardogs-manager-pick data-wardogs-manager-write>커스텀 이미지 선택 / 교체</button>
              </div>
              <div class="wardogs-manager-media-note-v122">연락처 이미지는 원본 연락처를 그대로 참조합니다. 커스텀 이미지만 WARDOGS 전용 R2 이미지로 저장합니다.</div>
            </div>
          </div>
          <div class="wardogs-manager-actions-v122">
            <div><button type="button" class="ghost wardogs-manager-danger-v122" data-wardogs-manager-delete data-wardogs-manager-write hidden>카드 삭제</button></div>
            <div><button type="button" class="secondary" data-wardogs-manager-close>닫기</button><button type="button" class="primary" data-wardogs-manager-save data-wardogs-manager-write>카드 추가</button></div>
          </div>
        </section>
      </div>
    </div>`;
  document.body.appendChild(root);
  modal=root;

  root.querySelectorAll('[data-wardogs-manager-close]').forEach(btn=>btn.addEventListener('click',closeManager));
  root.querySelector('[data-wardogs-manager-new]')?.addEventListener('click',()=>{
    if(draftDirty&&!window.confirm('저장하지 않은 변경사항을 버리고 새 카드를 만들까요?'))return;
    resetDraftForNew();
  });
  root.querySelector('[data-wardogs-manager-class-tabs]')?.addEventListener('click',event=>{
    const btn=event.target.closest?.('[data-wardogs-manager-order-class]');
    if(btn)setOrderClass(btn.dataset.wardogsManagerOrderClass);
  });
  root.querySelector('[data-wardogs-manager-search]')?.addEventListener('input',renderContactResults);
  root.querySelector('[data-wardogs-manager-class]')?.addEventListener('change',()=>{markDirty();renderPortraitFrame()});
  root.querySelector('[data-wardogs-manager-active]')?.addEventListener('change',markDirty);
  root.querySelectorAll('[data-wardogs-manager-source]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!busy&&isAdmin())setPortraitSource(String(btn.dataset.wardogsManagerSource||'contact'));
  }));
  root.querySelector('[data-wardogs-manager-portrait-scale]')?.addEventListener('input',event=>{
    if(!busy&&isAdmin())setDraftPortraitGeometry({scale:event.currentTarget.value});
  });
  root.querySelector('[data-wardogs-manager-portrait-reset]')?.addEventListener('click',resetDraftPortraitGeometry);
  root.querySelector('[data-wardogs-manager-save]')?.addEventListener('click',()=>void saveDraft());
  root.querySelector('[data-wardogs-manager-delete]')?.addEventListener('click',()=>void deleteCard());
  const fileInput=root.querySelector('[data-wardogs-manager-file]');
  root.querySelector('[data-wardogs-manager-pick]')?.addEventListener('click',()=>{if(!busy&&isAdmin()){fileInput.value='';fileInput.click()}});
  fileInput?.addEventListener('change',()=>{const file=Array.from(fileInput.files||[]).find(item=>String(item.type||'').startsWith('image/'));if(file)setPendingFile(file)});
  const drop=root.querySelector('[data-wardogs-manager-drop]');
  drop?.addEventListener('pointerdown',handlePortraitPointerDown);
  drop?.addEventListener('pointermove',handlePortraitPointerMove);
  drop?.addEventListener('pointerup',handlePortraitPointerEnd);
  drop?.addEventListener('pointercancel',handlePortraitPointerEnd);
  ['dragenter','dragover'].forEach(type=>drop?.addEventListener(type,event=>{event.preventDefault();if(isAdmin()&&!busy)drop.classList.add('dragover')}));
  ['dragleave','drop'].forEach(type=>drop?.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('dragover')}));
  drop?.addEventListener('drop',event=>{if(!isAdmin()||busy)return;const file=Array.from(event.dataTransfer?.files||[]).find(item=>String(item.type||'').startsWith('image/'));if(file)setPendingFile(file)});
  return root;
}
async function openManager(){
  const root=ensureModal();
  lastFocus=document.activeElement;
  root.hidden=false;
  document.body.classList.add('mws-wardogs-manager-open-v122');
  setStatus('WARDOGS 데이터를 불러오는 중입니다.','warn');
  setBusy(true);
  const loaded=await waitForWardogsPart();
  setBusy(false);
  if(!loaded){setStatus('WARDOGS cloud part를 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.','error');return}
  if(!isAdmin()){
    resetDraftForNew();
    setStatus('WARDOGS 카드 관리는 Admin 로그인에서만 저장할 수 있습니다.','warn');
    setBusy(false);
    root.querySelectorAll('[data-wardogs-manager-write]').forEach(el=>el.disabled=true);
    return;
  }
  resetDraftForNew();
  setStatus('새 카드를 추가하거나 왼쪽 목록에서 기존 카드를 선택하세요.');
}
function closeManager(){
  if(!modal||modal.hidden||busy)return;
  if(draftDirty&&!window.confirm('저장하지 않은 변경사항이 있습니다. 관리창을 닫을까요?'))return;
  draftDirty=false;selectedId='';selectedContactId='';draftPortraitSource='contact';draftPortraitX=50;draftPortraitY=50;draftPortraitScale=1;dragCardId='';dragClassId='';portraitPointerCleanup();touchOrderCleanup();clearPendingFile();clearObjectUrl('existing');previewToken++;
  modal.hidden=true;document.body.classList.remove('mws-wardogs-manager-open-v122');
  if(lastFocus?.isConnected)setTimeout(()=>lastFocus.focus(),0);
  lastFocus=null;
}
function bindEntry(){
  const btn=document.getElementById('wardogsManageBtn');
  if(!btn||btn.dataset.mwsWardogsManagerBound==='1')return false;
  btn.dataset.mwsWardogsManagerBound='1';
  btn.addEventListener('click',()=>void openManager());
  updateCount();
  return true;
}
function syncShell(){
  updateCount();
  const modalCount=modal?.querySelector('[data-wardogs-manager-modal-count]');
  if(modalCount)modalCount.textContent=`${cards().length}장`;
  if(modal&&!modal.hidden){renderList()}
}
window.mwsOpenWardogsManagerV122=openManager;
window.mwsCloseWardogsManagerV122=closeManager;
window.mwsWardogsPersistClassOrderV123=persistClassOrder;
window.__mwsWardogsOrderingV123='class-scoped-dnd';
window.__mwsWardogsTouchOrderingV127='pointer-events-touch-pen';
window.__mwsWardogsPortraitManagerV133='contact-default-custom-override';
window.__mwsWardogsPortraitAdjustV137='drag-position-zoom-frame-preview';
window.__mwsWardogsPortraitCanvasV138='quarter-scale-contain-black-no-loading-overlay';
window.__mwsWardogsManagerFrameV140='img-layer-class-frame';
window.__mwsWardogsManagerFrameV144='single-img-frame-no-overlay';
window.__mwsWardogsFrameSourcesV150='user-source-rebuild-cache-busted';
window.addEventListener('mawang:datachange',event=>{
  if(String(event?.detail?.reason||'').startsWith('WARDOGS')){
    syncShell();
    if(modal&&!modal.hidden&&!busy&&selectedId&&!cardById(selectedId))resetDraftForNew();
  }
});
window.addEventListener('mws:wardogs-media-ready',syncShell);
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&modal&&!modal.hidden){event.preventDefault();closeManager()}
});
window.addEventListener('beforeunload',()=>{clearPendingFile();clearObjectUrl('existing')},{once:true});
bindEntry();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindEntry,{once:true});
})();
