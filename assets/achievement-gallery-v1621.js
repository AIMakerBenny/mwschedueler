/* Mawang Scheduler v1.6.21 - Achievement manager runtime, Phase 95 */
(()=>{
'use strict';
if(window.__mwsAchievementGalleryRuntimeV1621)return;
window.__mwsAchievementGalleryRuntimeV1621=true;

let renderToken=0;
let galleryObjectUrls=[];
let detailObjectUrls=[];
let detailToken=0;
let detailModal=null;
let detailLastFocus=null;
let detailCardId='';
let detailRotation={x:0,y:0};
let detailDrag=null;
let managerModal=null;
let managerLastFocus=null;
let managerSelectedId='';
let managerDirty=false;
let managerSelectedId='';

function cards(){
  try{
    const value=typeof window.mwsGetAchievementCardsV1621==='function'
      ? window.mwsGetAchievementCardsV1621()
      : window.data?.achievementCards;
    return Array.isArray(value)?value.slice().sort((a,b)=>(Number(a?.order)||0)-(Number(b?.order)||0)):[];
  }catch(_){return[]}
}
function cardById(id){return cards().find(card=>String(card?.id||'')===String(id||''))||null}
function revokeAll(list){
  while(list.length){
    const url=list.pop();
    try{URL.revokeObjectURL(url)}catch(_){}
  }
}
function clearGalleryObjectUrls(){revokeAll(galleryObjectUrls)}
function clearDetailObjectUrls(){revokeAll(detailObjectUrls)}
function text(value,fallback){const out=String(value??'').trim();return out||fallback}
function clamp(value,min,max){return Math.max(min,Math.min(max,value))}

function makeTile(card){
  const tile=document.createElement('article');
  tile.className='achievement-card-tile';
  tile.dataset.achievementCardId=String(card?.id||'');

  const button=document.createElement('button');
  button.type='button';
  button.className='achievement-card-open';
  button.setAttribute('aria-label',`${text(card?.gameName,'게임 이름 없음')} · ${text(card?.contentName,'컨텐츠 이름 없음')} 업적 카드 열기`);

  const thumb=document.createElement('div');
  thumb.className='achievement-card-thumb';

  const placeholder=document.createElement('div');
  placeholder.className='achievement-card-placeholder';
  placeholder.textContent=card?.frontImageId?'카드 이미지를 불러오는 중입니다.':'앞면 이미지가 등록되지 않았습니다.';
  thumb.appendChild(placeholder);

  const caption=document.createElement('div');
  caption.className='achievement-card-caption';
  const game=document.createElement('strong');
  game.className='achievement-card-game';
  game.textContent=text(card?.gameName,'게임 이름 없음');
  const content=document.createElement('span');
  content.className='achievement-card-content';
  content.textContent=text(card?.contentName,'컨텐츠 이름 없음');
  caption.append(game,content);

  button.append(thumb,caption);
  button.addEventListener('click',()=>openDetail(card?.id));
  tile.appendChild(button);
  return {tile,thumb,placeholder};
}
async function loadFront(card,view,token){
  const imageId=String(card?.frontImageId||'');
  if(!imageId)return;
  const media=window.mwsAchievementMediaV1;
  if(!media?.getBlob){
    view.placeholder.textContent='카드 이미지 저장소를 불러오지 못했습니다.';
    return;
  }
  try{
    const blob=await media.getBlob(imageId);
    if(token!==renderToken)return;
    if(!(blob instanceof Blob)){
      view.placeholder.textContent='등록된 카드 이미지를 찾을 수 없습니다.';
      return;
    }
    const url=URL.createObjectURL(blob);
    if(token!==renderToken){URL.revokeObjectURL(url);return}
    galleryObjectUrls.push(url);
    const img=document.createElement('img');
    img.alt=text(card?.gameName,'업적 카드');
    img.loading='lazy';
    img.decoding='async';
    img.src=url;
    img.onload=()=>{if(token===renderToken)view.thumb.classList.add('has-image')};
    img.onerror=()=>{if(token===renderToken)view.placeholder.textContent='카드 이미지를 표시할 수 없습니다.'};
    view.thumb.appendChild(img);
  }catch(error){
    console.warn('Achievement card image load failed',imageId,error);
    if(token===renderToken)view.placeholder.textContent='카드 이미지를 불러오지 못했습니다.';
  }
}

function applyDetailRotation(root=detailModal){
  const card=root?.querySelector('[data-achievement-card3d]');
  if(!card)return;
  card.style.transform=`rotateX(${detailRotation.x.toFixed(2)}deg) rotateY(${detailRotation.y.toFixed(2)}deg)`;
  card.dataset.rotateX=String(Math.round(detailRotation.x));
  card.dataset.rotateY=String(Math.round(detailRotation.y));
}
function resetDetailRotation(){
  detailRotation={x:0,y:0};
  detailDrag=null;
  detailModal?.querySelector('[data-achievement-stage]')?.classList.remove('dragging');
  applyDetailRotation();
}
const TOUCH_DRAG_THRESHOLD=10;
const TOUCH_HORIZONTAL_RATIO=1.18;
function activateDetailDrag(stage,event){
  detailDrag.mode='rotate';
  stage.classList.add('dragging');
  if(detailDrag.pointerType==='touch')stage.classList.add('touch-dragging');
  try{stage.setPointerCapture(event.pointerId)}catch(_){}
}
function beginDetailDrag(event){
  const pointerType=event.pointerType||'mouse';
  if(!['mouse','touch','pen'].includes(pointerType))return;
  if(pointerType==='mouse'&&event.button!==0)return;
  if(pointerType==='pen'&&event.button!==0)return;
  const stage=event.currentTarget;
  detailDrag={
    pointerId:event.pointerId,
    pointerType,
    mode:pointerType==='touch'?'pending':'rotate',
    startX:event.clientX,
    startY:event.clientY,
    rotateX:detailRotation.x,
    rotateY:detailRotation.y
  };
  if(pointerType==='touch')return;
  event.preventDefault();
  activateDetailDrag(stage,event);
}
function moveDetailDrag(event){
  if(!detailDrag||event.pointerId!==detailDrag.pointerId)return;
  const stage=event.currentTarget;
  const dx=event.clientX-detailDrag.startX;
  const dy=event.clientY-detailDrag.startY;
  if(detailDrag.pointerType==='touch'&&detailDrag.mode==='pending'){
    const ax=Math.abs(dx),ay=Math.abs(dy);
    if(Math.max(ax,ay)<TOUCH_DRAG_THRESHOLD)return;
    if(ay>ax){
      detailDrag.mode='scroll';
      return;
    }
    if(ax<ay*TOUCH_HORIZONTAL_RATIO)return;
    activateDetailDrag(stage,event);
  }
  if(detailDrag.mode!=='rotate')return;
  event.preventDefault();
  if(detailDrag.pointerType==='touch'){
    detailRotation.x=clamp(detailDrag.rotateX-clamp(dy,-90,90)*.16,-22,22);
    detailRotation.y=clamp(detailDrag.rotateY+dx*.52,-360,360);
  }else{
    detailRotation.x=clamp(detailDrag.rotateX-dy*.34,-35,35);
    detailRotation.y=detailDrag.rotateY+dx*.58;
  }
  applyDetailRotation();
}
function endDetailDrag(event){
  if(!detailDrag||event.pointerId!==detailDrag.pointerId)return;
  const stage=event.currentTarget;
  try{if(stage.hasPointerCapture?.(event.pointerId))stage.releasePointerCapture(event.pointerId)}catch(_){}
  detailDrag=null;
  stage.classList.remove('dragging','touch-dragging');
}

function ensureDetailModal(){
  if(detailModal?.isConnected)return detailModal;
  const root=document.createElement('div');
  root.id='achievementDetailModal';
  root.className='achievement-detail-modal';
  root.hidden=true;
  root.setAttribute('role','dialog');
  root.setAttribute('aria-modal','true');
  root.setAttribute('aria-labelledby','achievementDetailTitle');
  root.innerHTML=`
    <div class="achievement-detail-dialog" role="document">
      <button type="button" class="achievement-detail-close" aria-label="업적 상세 닫기">×</button>
      <div class="achievement-detail-layout">
        <div class="achievement-detail-visual">
          <div class="achievement-detail-stage" data-achievement-stage>
            <div class="achievement-detail-card achievement-detail-card3d" data-achievement-card3d aria-label="업적 카드 3D 뷰어">
              <div class="achievement-detail-face achievement-detail-front">
                <div class="achievement-detail-card-placeholder">앞면 이미지가 등록되지 않았습니다.</div>
              </div>
              <div class="achievement-detail-face achievement-detail-back">
                <div class="achievement-detail-back-default">
                  <span>MAWANG</span>
                  <b>ACHIEVEMENT</b>
                  <small>CARD COLLECTION</small>
                </div>
                <div class="achievement-detail-back-placeholder">뒷면 이미지를 불러오는 중입니다.</div>
              </div>
            </div>
          </div>
          <div class="achievement-detail-controls">
            <span class="achievement-detail-hint"><span class="achievement-detail-hint-mouse">마우스로 드래그해 카드를 회전하세요.</span><span class="achievement-detail-hint-touch">카드를 좌우로 밀어 회전하세요. 위아래 스크롤은 그대로 사용할 수 있습니다.</span></span>
            <button type="button" class="achievement-detail-reset">정면 보기</button>
          </div>
        </div>
        <aside class="achievement-detail-info">
          <div class="achievement-detail-kicker">ACHIEVEMENT CARD</div>
          <h2 id="achievementDetailTitle">업적</h2>
          <dl class="achievement-detail-fields">
            <div>
              <dt>게임 이름</dt>
              <dd data-achievement-detail="game"></dd>
            </div>
            <div>
              <dt>컨텐츠 이름</dt>
              <dd data-achievement-detail="content"></dd>
            </div>
            <div class="achievement-detail-description-row">
              <dt>설명</dt>
              <dd data-achievement-detail="description"></dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>`;
  root.querySelector('.achievement-detail-close')?.addEventListener('click',closeDetail);
  root.querySelector('.achievement-detail-reset')?.addEventListener('click',resetDetailRotation);
  const stage=root.querySelector('[data-achievement-stage]');
  stage?.addEventListener('pointerdown',beginDetailDrag);
  stage?.addEventListener('pointermove',moveDetailDrag);
  stage?.addEventListener('pointerup',endDetailDrag);
  stage?.addEventListener('pointercancel',endDetailDrag);
  stage?.addEventListener('lostpointercapture',event=>{
    if(detailDrag&&event.pointerId===detailDrag.pointerId){
      detailDrag=null;
      stage.classList.remove('dragging','touch-dragging');
    }
  });
  stage?.addEventListener('dblclick',event=>{if(!event.pointerType||event.pointerType==='mouse')resetDetailRotation()});
  root.addEventListener('dragstart',event=>{
    if(event.target.closest?.('[data-achievement-card3d]'))event.preventDefault();
  });
  root.addEventListener('click',event=>{if(event.target===root)closeDetail()});
  document.body.appendChild(root);
  detailModal=root;
  return root;
}
async function loadDetailFaceImage(imageId,face,placeholder,alt,token){
  if(!imageId)return false;
  const media=window.mwsAchievementMediaV1;
  if(!media?.getBlob){
    placeholder.textContent='카드 이미지 저장소를 불러오지 못했습니다.';
    return false;
  }
  try{
    const blob=await media.getBlob(imageId);
    if(token!==detailToken)return false;
    if(!(blob instanceof Blob)){
      placeholder.textContent='등록된 카드 이미지를 찾을 수 없습니다.';
      return false;
    }
    const url=URL.createObjectURL(blob);
    if(token!==detailToken){URL.revokeObjectURL(url);return false}
    detailObjectUrls.push(url);
    const img=document.createElement('img');
    img.alt=alt;
    img.decoding='async';
    img.draggable=false;
    img.src=url;
    img.onload=()=>{
      if(token!==detailToken)return;
      face.classList.remove('loading-image');
      face.classList.add('has-image');
    };
    img.onerror=()=>{
      if(token!==detailToken)return;
      face.classList.remove('loading-image');
      placeholder.textContent='카드 이미지를 표시할 수 없습니다.';
    };
    face.appendChild(img);
    return true;
  }catch(error){
    console.warn('Achievement detail face load failed',imageId,error);
    if(token===detailToken){
      face.classList.remove('loading-image');
      placeholder.textContent='카드 이미지를 불러오지 못했습니다.';
    }
    return false;
  }
}
async function loadDetailFaces(card,root,token){
  const front=root.querySelector('.achievement-detail-front');
  const back=root.querySelector('.achievement-detail-back');
  const frontPlaceholder=root.querySelector('.achievement-detail-card-placeholder');
  const backPlaceholder=root.querySelector('.achievement-detail-back-placeholder');
  if(!front||!back||!frontPlaceholder||!backPlaceholder)return;

  front.querySelector('img')?.remove();
  back.querySelector('img')?.remove();
  front.classList.remove('has-image','loading-image');
  back.classList.remove('has-image','loading-image');
  frontPlaceholder.textContent=card?.frontImageId?'카드 이미지를 불러오는 중입니다.':'앞면 이미지가 등록되지 않았습니다.';
  backPlaceholder.textContent=card?.backImageId?'뒷면 이미지를 불러오는 중입니다.':'';

  const pending=[];
  if(card?.frontImageId){
    front.classList.add('loading-image');
    pending.push(loadDetailFaceImage(
      String(card.frontImageId),
      front,
      frontPlaceholder,
      `${text(card?.gameName,'업적')} 카드 앞면`,
      token
    ));
  }
  if(card?.backImageId){
    back.classList.add('loading-image');
    pending.push(loadDetailFaceImage(
      String(card.backImageId),
      back,
      backPlaceholder,
      `${text(card?.gameName,'업적')} 카드 뒷면`,
      token
    ));
  }
  await Promise.allSettled(pending);
}
function openDetail(id){
  const card=cardById(id);
  if(!card)return false;
  const root=ensureDetailModal();
  const token=++detailToken;
  clearDetailObjectUrls();
  detailLastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  detailCardId=String(card.id||'');
  root.querySelector('[data-achievement-detail="game"]').textContent=text(card.gameName,'게임 이름 없음');
  root.querySelector('[data-achievement-detail="content"]').textContent=text(card.contentName,'컨텐츠 이름 없음');
  root.querySelector('[data-achievement-detail="description"]').textContent=text(card.description,'등록된 설명이 없습니다.');
  root.querySelector('#achievementDetailTitle').textContent=text(card.contentName,'업적 카드');
  root.hidden=false;
  document.body.classList.add('mws-achievement-modal-open');
  resetDetailRotation();
  loadDetailFaces(card,root,token);
  setTimeout(()=>root.querySelector('.achievement-detail-close')?.focus(),0);
  return true;
}
function closeDetail(){
  if(!detailModal||detailModal.hidden)return;
  detailToken++;
  detailModal.hidden=true;
  document.body.classList.remove('mws-achievement-modal-open');
  detailDrag=null;
  detailCardId='';
  clearDetailObjectUrls();
  const focus=detailLastFocus;
  detailLastFocus=null;
  if(focus?.isConnected)setTimeout(()=>focus.focus(),0);
}

function achievementApi(){return window.mwsAchievementCardsV1621||null}
function updateManagerCount(){
  const count=document.getElementById('achievementManageCount');
  if(count)count.textContent=`${cards().length}장`;
}
function managerSelectedCard(){return managerSelectedId?cardById(managerSelectedId):null}
function managerSetStatus(message,tone='muted'){
  const status=managerModal?.querySelector('[data-achievement-manager-status]');
  if(!status)return;
  status.textContent=message;
  status.dataset.tone=tone;
}
function managerMarkDirty(dirty=true){
  managerDirty=Boolean(dirty);
  const save=managerModal?.querySelector('[data-achievement-manager-save]');
  if(save)save.disabled=!managerSelectedId||!managerDirty;
  if(managerDirty)managerSetStatus('저장하지 않은 변경사항이 있습니다.','warn');
}
function managerFieldValues(){
  if(!managerModal)return null;
  return {
    gameName:managerModal.querySelector('[data-achievement-field="gameName"]')?.value||'',
    contentName:managerModal.querySelector('[data-achievement-field="contentName"]')?.value||'',
    description:managerModal.querySelector('[data-achievement-field="description"]')?.value||''
  };
}
function fillManagerEditor(card){
  if(!managerModal)return;
  const editor=managerModal.querySelector('.achievement-manager-editor');
  const empty=managerModal.querySelector('.achievement-manager-editor-empty');
  const game=managerModal.querySelector('[data-achievement-field="gameName"]');
  const content=managerModal.querySelector('[data-achievement-field="contentName"]');
  const description=managerModal.querySelector('[data-achievement-field="description"]');
  const remove=managerModal.querySelector('[data-achievement-manager-delete]');
  const save=managerModal.querySelector('[data-achievement-manager-save]');
  const frontState=managerModal.querySelector('[data-achievement-image-state="front"]');
  const backState=managerModal.querySelector('[data-achievement-image-state="back"]');
  const has=Boolean(card);
  if(editor)editor.hidden=!has;
  if(empty)empty.hidden=has;
  if(remove)remove.disabled=!has;
  if(save)save.disabled=true;
  if(game)game.value=card?.gameName||'';
  if(content)content.value=card?.contentName||'';
  if(description)description.value=card?.description||'';
  if(frontState)frontState.textContent=card?.frontImageId?'등록됨':'없음';
  if(backState)backState.textContent=card?.backImageId?'등록됨':'없음';
  managerDirty=false;
  managerSetStatus(has?'카드를 선택했습니다.':'새 카드를 추가하거나 목록에서 카드를 선택하세요.');
}
function renderManagerList(){
  if(!managerModal)return;
  const list=managerModal.querySelector('[data-achievement-manager-list]');
  const total=managerModal.querySelector('[data-achievement-manager-count]');
  if(!list||!total)return;
  const items=cards();
  total.textContent=`${items.length}장`;
  updateManagerCount();

  if(managerSelectedId&&!items.some(card=>String(card.id)===managerSelectedId))managerSelectedId='';
  if(!managerSelectedId&&items.length)managerSelectedId=String(items[0].id||'');

  list.replaceChildren();
  if(!items.length){
    const empty=document.createElement('div');
    empty.className='achievement-manager-list-empty';
    empty.textContent='등록된 업적 카드가 없습니다.';
    list.appendChild(empty);
  }else{
    for(const card of items){
      const id=String(card.id||'');
      const button=document.createElement('button');
      button.type='button';
      button.className='achievement-manager-list-item';
      button.dataset.achievementManagerCardId=id;
      button.classList.toggle('active',id===managerSelectedId);
      button.setAttribute('aria-pressed',String(id===managerSelectedId));

      const order=document.createElement('span');
      order.className='achievement-manager-list-order';
      order.textContent=String((Number(card.order)||0)+1).padStart(2,'0');

      const copy=document.createElement('span');
      copy.className='achievement-manager-list-copy';
      const game=document.createElement('strong');
      game.textContent=text(card.gameName,'게임 이름 없음');
      const content=document.createElement('small');
      content.textContent=text(card.contentName,'컨텐츠 이름 없음');
      copy.append(game,content);

      const media=document.createElement('span');
      media.className='achievement-manager-list-media';
      media.textContent=card.frontImageId?'CARD':'EMPTY';

      button.append(order,copy,media);
      button.addEventListener('click',()=>{
        if(managerDirty&&!confirm('저장하지 않은 변경사항이 있습니다. 다른 카드로 이동할까요?'))return;
        managerSelectedId=id;
        renderManagerList();
      });
      list.appendChild(button);
    }
  }
  fillManagerEditor(managerSelectedCard());
}
function ensureManagerModal(){
  if(managerModal?.isConnected)return managerModal;
  const root=document.createElement('div');
  root.id='achievementManagerModal';
  root.className='achievement-manager-modal';
  root.hidden=true;
  root.setAttribute('role','dialog');
  root.setAttribute('aria-modal','true');
  root.setAttribute('aria-labelledby','achievementManagerTitle');
  root.innerHTML=`
    <div class="achievement-manager-dialog" role="document">
      <div class="achievement-manager-head">
        <div>
          <div class="achievement-manager-kicker">ACHIEVEMENT MANAGEMENT</div>
          <h2 id="achievementManagerTitle">업적 카드 관리</h2>
          <p>카드를 추가하고 기본 정보를 편집할 수 있습니다. 이미지 추가와 순서 드래그는 다음 단계에서 연결됩니다.</p>
        </div>
        <button type="button" class="achievement-manager-close" aria-label="업적 카드 관리 닫기">×</button>
      </div>
      <div class="achievement-manager-toolbar">
        <div>
          <strong>카드 목록</strong>
          <span class="chip" data-achievement-manager-count>0장</span>
        </div>
        <button type="button" class="primary" data-achievement-manager-add>새 카드 추가</button>
      </div>
      <div class="achievement-manager-workspace">
        <aside class="achievement-manager-list" data-achievement-manager-list aria-label="업적 카드 목록"></aside>
        <section class="achievement-manager-editor-wrap">
          <div class="achievement-manager-editor-empty">새 카드를 추가하거나 왼쪽 목록에서 카드를 선택하세요.</div>
          <form class="achievement-manager-editor" hidden>
            <div class="achievement-manager-editor-title">
              <div>
                <span>카드 정보</span>
                <strong>기본 정보 편집</strong>
              </div>
              <button type="button" class="danger" data-achievement-manager-delete>카드 삭제</button>
            </div>
            <label class="achievement-manager-field">
              <span>게임 이름</span>
              <input type="text" maxlength="120" data-achievement-field="gameName" placeholder="게임 이름">
            </label>
            <label class="achievement-manager-field">
              <span>컨텐츠 이름</span>
              <input type="text" maxlength="160" data-achievement-field="contentName" placeholder="컨텐츠 이름">
            </label>
            <label class="achievement-manager-field">
              <span>설명</span>
              <textarea rows="7" maxlength="3000" data-achievement-field="description" placeholder="카드에 표시할 설명"></textarea>
            </label>
            <div class="achievement-manager-media-state">
              <div><span>앞면 이미지</span><strong data-achievement-image-state="front">없음</strong></div>
              <div><span>뒷면 이미지</span><strong data-achievement-image-state="back">없음</strong></div>
            </div>
            <div class="achievement-manager-editor-actions">
              <span data-achievement-manager-status data-tone="muted">카드를 선택했습니다.</span>
              <button type="submit" class="primary" data-achievement-manager-save disabled>변경사항 저장</button>
            </div>
          </form>
        </section>
      </div>
    </div>`;

  root.querySelector('.achievement-manager-close')?.addEventListener('click',closeManager);
  root.addEventListener('click',event=>{if(event.target===root)closeManager()});
  root.querySelector('[data-achievement-manager-add]')?.addEventListener('click',()=>{
    const api=achievementApi();
    if(!api?.create){managerSetStatus('카드 저장 기능을 불러오지 못했습니다.','error');return}
    if(managerDirty&&!confirm('저장하지 않은 변경사항을 버리고 새 카드를 추가할까요?'))return;
    const result=api.create({});
    if(!result?.ok){managerSetStatus('새 카드를 추가하지 못했습니다.','error');return}
    managerSelectedId=String(result.card?.id||'');
    managerDirty=false;
    renderManagerList();
    managerSetStatus(result.saved===false?'카드는 추가됐지만 저장 공간을 확인해 주세요.':'새 카드를 추가했습니다.',result.saved===false?'warn':'success');
    setTimeout(()=>root.querySelector('[data-achievement-field="gameName"]')?.focus(),0);
  });

  const editor=root.querySelector('.achievement-manager-editor');
  editor?.addEventListener('input',event=>{
    if(event.target.matches?.('[data-achievement-field]'))managerMarkDirty(true);
  });
  editor?.addEventListener('submit',event=>{
    event.preventDefault();
    const api=achievementApi();
    const card=managerSelectedCard();
    if(!api?.update||!card){managerSetStatus('저장할 카드를 찾을 수 없습니다.','error');return}
    const result=api.update(card.id,managerFieldValues()||{});
    if(!result?.ok){managerSetStatus('카드 정보를 저장하지 못했습니다.','error');return}
    managerSelectedId=String(result.card?.id||card.id);
    managerDirty=false;
    renderManagerList();
    managerSetStatus(result.saved===false?'변경했지만 저장 공간을 확인해 주세요.':'카드 정보를 저장했습니다.',result.saved===false?'warn':'success');
  });
  root.querySelector('[data-achievement-manager-delete]')?.addEventListener('click',()=>{
    const api=achievementApi();
    const card=managerSelectedCard();
    if(!api?.remove||!card)return;
    const label=[card.gameName,card.contentName].filter(Boolean).join(' · ')||'이 카드';
    if(!confirm(`${label}를 삭제할까요?\n이미지 파일 정리는 이후 이미지 관리 단계에서 처리됩니다.`))return;
    const result=api.remove(card.id);
    if(!result?.ok){managerSetStatus('카드를 삭제하지 못했습니다.','error');return}
    managerSelectedId='';
    managerDirty=false;
    renderManagerList();
    managerSetStatus(result.saved===false?'카드는 삭제됐지만 저장 공간을 확인해 주세요.':'카드를 삭제했습니다.',result.saved===false?'warn':'success');
  });

  document.body.appendChild(root);
  managerModal=root;
  return root;
}
function syncManagerShellCount(){
  updateManagerCount();
  if(!managerModal||managerModal.hidden)return;
  const modalCount=managerModal.querySelector('[data-achievement-manager-count]');
  if(modalCount)modalCount.textContent=`${cards().length}장`;
  if(!managerDirty)renderManagerList();
}
function openManager(){
  const root=ensureManagerModal();
  if(detailModal&&!detailModal.hidden)closeDetail();
  managerLastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  if(!managerSelectedId&&cards().length)managerSelectedId=String(cards()[0].id||'');
  renderManagerList();
  root.hidden=false;
  document.body.classList.add('mws-achievement-manager-open');
  setTimeout(()=>root.querySelector('.achievement-manager-close')?.focus(),0);
  return true;
}
function closeManager(){
  if(!managerModal||managerModal.hidden)return;
  if(managerDirty&&!confirm('저장하지 않은 변경사항이 있습니다. 관리창을 닫을까요?'))return;
  managerDirty=false;
  managerModal.hidden=true;
  document.body.classList.remove('mws-achievement-manager-open');
  const focus=managerLastFocus;
  managerLastFocus=null;
  if(focus?.isConnected)setTimeout(()=>focus.focus(),0);
}
function bindManagerEntry(){
  const button=document.getElementById('achievementManageBtn');
  if(!button||button.dataset.mwsAchievementManagerBound==='1')return false;
  button.dataset.mwsAchievementManagerBound='1';
  button.addEventListener('click',openManager);
  updateManagerCount();
  return true;
}

async function render(){
  const section=document.getElementById('achievements');
  const grid=document.getElementById('achievementGallery');
  const empty=document.getElementById('achievementEmptyState');
  const count=document.getElementById('achievementCountChip');
  if(!section||!grid||!empty||!count)return false;

  const token=++renderToken;
  clearGalleryObjectUrls();
  const list=cards();
  count.textContent=`${list.length}장`;
  grid.replaceChildren();
  empty.hidden=list.length>0;
  grid.hidden=list.length===0;
  if(!list.length)return true;

  const pending=[];
  for(const card of list){
    const view=makeTile(card);
    grid.appendChild(view.tile);
    pending.push(loadFront(card,view,token));
  }
  await Promise.allSettled(pending);
  try{window.mwsScheduleImageTune?.()}catch(_){}
  return token===renderToken;
}

window.mwsRenderAchievementGalleryV1621=render;
window.mwsOpenAchievementDetailV1621=openDetail;
window.mwsCloseAchievementDetailV1621=closeDetail;
window.mwsResetAchievementCardV1621=resetDetailRotation;
window.mwsOpenAchievementManagerV1621=openManager;
window.mwsCloseAchievementManagerV1621=closeManager;
window.addEventListener('mawang:datachange',event=>{
  if(document.getElementById('achievements')?.classList.contains('active'))render();
  if(detailModal&&!detailModal.hidden&&detailCardId&&!cardById(detailCardId))closeDetail();
  syncManagerShellCount();
  if(managerModal&&!managerModal.hidden&&String(event?.detail?.reason||'').startsWith('업적 카드'))renderManager();
});
window.addEventListener('mws:achievement-media-ready',()=>{
  if(document.getElementById('achievements')?.classList.contains('active'))render();
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  if(managerModal&&!managerModal.hidden){event.preventDefault();closeManager();return}
  if(detailModal&&!detailModal.hidden){event.preventDefault();closeDetail()}
});
window.addEventListener('beforeunload',()=>{
  clearGalleryObjectUrls();
  clearDetailObjectUrls();
},{once:true});
bindManagerEntry();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindManagerEntry,{once:true});
if(document.getElementById('achievements')?.classList.contains('active'))render();
})();
