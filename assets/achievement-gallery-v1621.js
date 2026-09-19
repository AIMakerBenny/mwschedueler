/* Mawang Scheduler v1.6.21 - Achievement reference-safe media manager runtime, Phase 98 */
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
let managerObjectUrls=[];
let managerMediaToken=0;
let managerImageBusy=false;
let managerDragId='';

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
const TOUCH_DRAG_THRESHOLD=8;
const TOUCH_HORIZONTAL_RATIO=1.18;
const TOUCH_ROTATE_X_PER_PX=.28;
const TOUCH_ROTATE_Y_PER_PX=1.18;
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
    detailRotation.x=clamp(detailDrag.rotateX-clamp(dy,-120,120)*TOUCH_ROTATE_X_PER_PX,-32,32);
    detailRotation.y=detailDrag.rotateY+dx*TOUCH_ROTATE_Y_PER_PX;
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

function updateManagerCount(){
  const count=document.getElementById('achievementManageCount');
  if(count)count.textContent=`${cards().length}장`;
}
function managerApi(){return window.mwsAchievementCardsV1621||null}
function setManagerStatus(message,tone=''){
  const el=managerModal?.querySelector('[data-achievement-manager-status]');
  if(!el)return;
  el.textContent=String(message||'');
  el.dataset.tone=tone;
}
function managerMedia(){return window.mwsAchievementMediaV1||null}
function managerImageField(kind){return kind==='back'?'backImageId':'frontImageId'}
function managerImageLabel(kind){return kind==='back'?'뒷면':'앞면'}
function clearManagerObjectUrls(){revokeAll(managerObjectUrls)}
function syncManagerMediaControls(card=managerCurrentCard()){
  const root=managerModal;
  if(!root)return;
  root.querySelectorAll('[data-achievement-manager-pick],[data-achievement-manager-file],[data-achievement-manager-cleanup]').forEach(control=>{control.disabled=managerImageBusy});
  root.querySelectorAll('[data-achievement-manager-remove]').forEach(control=>{
    const kind=String(control.dataset.achievementManagerRemove||'front')==='back'?'back':'front';
    control.disabled=managerImageBusy||!String(card?.[managerImageField(kind)]||'');
  });
}
function setManagerImageBusy(busy){
  managerImageBusy=Boolean(busy);
  const root=managerModal;
  if(!root)return;
  root.classList.toggle('is-media-busy',managerImageBusy);
  syncManagerMediaControls();
}
function managerDraftPatch(){
  const root=ensureManagerModal();
  return {
    gameName:root.querySelector('[data-achievement-manager-game]')?.value||'',
    contentName:root.querySelector('[data-achievement-manager-content]')?.value||'',
    description:root.querySelector('[data-achievement-manager-description]')?.value||''
  };
}
async function managerImageDimensions(blob){
  if(typeof createImageBitmap!=='function')return {width:0,height:0};
  try{
    const bitmap=await createImageBitmap(blob);
    const dimensions={width:Math.max(0,Number(bitmap.width)||0),height:Math.max(0,Number(bitmap.height)||0)};
    try{bitmap.close?.()}catch(_){}
    return dimensions;
  }catch(_){return {width:0,height:0}}
}
async function renderManagerMediaPreview(card,kind,token){
  const root=managerModal;
  const preview=root?.querySelector(`[data-achievement-manager-preview="${kind}"]`);
  const state=preview?.querySelector('[data-achievement-manager-preview-state]');
  if(!preview||!state)return;
  preview.querySelector('img')?.remove();
  preview.classList.remove('has-image','is-loading');
  const imageId=String(card?.[managerImageField(kind)]||'');
  state.textContent=imageId?`${managerImageLabel(kind)} 이미지를 불러오는 중입니다.`:`${managerImageLabel(kind)} 이미지가 등록되지 않았습니다.`;
  if(!imageId)return;
  const media=managerMedia();
  if(!media?.getBlob){state.textContent='카드 이미지 저장소를 불러오지 못했습니다.';return}
  preview.classList.add('is-loading');
  try{
    const blob=await media.getBlob(imageId);
    if(token!==managerMediaToken)return;
    if(!(blob instanceof Blob)){
      preview.classList.remove('is-loading');
      state.textContent='등록된 카드 이미지를 찾을 수 없습니다.';
      return;
    }
    const url=URL.createObjectURL(blob);
    if(token!==managerMediaToken){URL.revokeObjectURL(url);return}
    managerObjectUrls.push(url);
    const img=document.createElement('img');
    img.alt=`${text(card?.gameName,'업적 카드')} ${managerImageLabel(kind)} 미리보기`;
    img.decoding='async';
    img.draggable=false;
    img.src=url;
    img.onload=()=>{if(token===managerMediaToken){preview.classList.remove('is-loading');preview.classList.add('has-image')}};
    img.onerror=()=>{if(token===managerMediaToken){preview.classList.remove('is-loading');state.textContent='이미지를 표시할 수 없습니다.'}};
    preview.appendChild(img);
  }catch(error){
    console.warn('Achievement manager preview load failed',imageId,error);
    if(token===managerMediaToken){preview.classList.remove('is-loading');state.textContent='이미지를 불러오지 못했습니다.'}
  }
}
function renderManagerMediaPreviews(card){
  const token=++managerMediaToken;
  clearManagerObjectUrls();
  void Promise.allSettled([renderManagerMediaPreview(card,'front',token),renderManagerMediaPreview(card,'back',token)]);
}
function openManagerFilePicker(kind){
  if(managerImageBusy)return;
  const input=managerModal?.querySelector(`[data-achievement-manager-file="${kind}"]`);
  if(!input)return;
  input.value='';
  input.click();
}
function managerImageFile(files){
  return Array.from(files||[]).find(file=>file instanceof File&&String(file.type||'').toLowerCase().startsWith('image/'))||null;
}
function managerImageMaxBytes(){
  return Math.max(1,Number(window.mwsAchievementPackageLimitsV1621?.maxImageBytes)||32*1024*1024);
}
function managerReferencedMediaIds(){
  const ids=new Set();
  for(const card of cards()){
    const front=String(card?.frontImageId||'');
    const back=String(card?.backImageId||'');
    if(front)ids.add(front);
    if(back)ids.add(back);
  }
  return ids;
}
async function cleanupUnreferencedManagerMedia(ids){
  const media=managerMedia();
  if(!media?.remove)return {removed:0,kept:0,failed:0};
  const referenced=managerReferencedMediaIds();
  const unique=[...new Set(Array.from(ids||[],id=>String(id||'')).filter(Boolean))];
  let removed=0,kept=0,failed=0;
  for(const id of unique){
    if(referenced.has(id)){kept++;continue}
    try{await media.remove(id);removed++}
    catch(error){failed++;console.warn('Achievement orphan media cleanup failed',id,error)}
  }
  return {removed,kept,failed};
}
async function cleanupManagerOrphans(){
  if(managerImageBusy)return false;
  const media=managerMedia();
  if(!media?.listIds||!media?.remove){setManagerStatus('카드 이미지 저장소를 불러오지 못했습니다.','error');return false}
  if(!window.confirm('어떤 업적 카드에서도 사용하지 않는 이미지 파일을 정리하시겠습니까?'))return false;
  setManagerImageBusy(true);
  setManagerStatus('미사용 이미지를 확인하는 중입니다.','warn');
  try{
    const ids=await media.listIds();
    const result=await cleanupUnreferencedManagerMedia(ids);
    if(result.failed){
      setManagerStatus(`미사용 이미지 ${result.removed}개를 정리했고 ${result.failed}개는 삭제하지 못했습니다.`,'warn');
    }else{
      setManagerStatus(result.removed?`미사용 이미지 ${result.removed}개를 정리했습니다.`:'정리할 미사용 이미지가 없습니다.','ok');
    }
    return result.failed===0;
  }catch(error){
    console.error('Achievement orphan media scan failed',error);
    setManagerStatus('미사용 이미지 정리에 실패했습니다.','error');
    return false;
  }finally{setManagerImageBusy(false)}
}
async function removeManagerImage(kind){
  kind=kind==='back'?'back':'front';
  if(managerImageBusy)return false;
  const card=managerCurrentCard();
  const api=managerApi();
  if(!card||!api?.update){setManagerStatus('이미지를 해제할 카드를 선택해 주세요.','error');return false}
  const field=managerImageField(kind);
  const label=managerImageLabel(kind);
  const oldId=String(card?.[field]||'');
  if(!oldId){setManagerStatus(`${label} 이미지가 등록되어 있지 않습니다.`,'warn');return false}
  if(!window.confirm(`${label} 이미지 등록을 해제하시겠습니까?`))return false;
  setManagerImageBusy(true);
  setManagerStatus(`${label} 이미지 등록을 해제하는 중입니다.`,'warn');
  try{
    const result=api.update(card.id,{...managerDraftPatch(),[field]:''});
    if(!result?.ok||result.saved!==true)throw new Error('Achievement metadata detach failed');
    managerDirty=false;
    const cleanup=await cleanupUnreferencedManagerMedia([oldId]);
    if(managerSelectedId===String(card.id||''))renderManager();
    if(cleanup.failed){
      setManagerStatus(`${label} 이미지 등록은 해제했지만 파일 정리는 완료하지 못했습니다.`,'warn');
    }else if(cleanup.kept){
      setManagerStatus(`${label} 이미지 등록을 해제했습니다. 같은 파일을 사용하는 다른 카드는 유지됩니다.`,'ok');
    }else{
      setManagerStatus(`${label} 이미지 등록을 해제하고 미사용 파일도 정리했습니다.`,'ok');
    }
    return true;
  }catch(error){
    console.error('Achievement image detach failed',error);
    setManagerStatus(`${label} 이미지 등록 해제에 실패했습니다. 기존 이미지는 유지됩니다.`,'error');
    return false;
  }finally{setManagerImageBusy(false)}
}
async function replaceManagerImage(kind,file){
  kind=kind==='back'?'back':'front';
  if(!(file instanceof File)||!String(file.type||'').toLowerCase().startsWith('image/')){
    setManagerStatus('이미지 파일만 등록할 수 있습니다.','error');
    return false;
  }
  if(file.size>managerImageMaxBytes()){
    setManagerStatus('업적 카드 이미지는 한 장당 32MB 이하만 등록할 수 있습니다.','error');
    return false;
  }
  const card=managerCurrentCard();
  const api=managerApi();
  const media=managerMedia();
  if(!card||!api?.update){setManagerStatus('이미지를 등록할 카드를 선택해 주세요.','error');return false}
  if(!media?.put||!media?.remove){setManagerStatus('카드 이미지 저장소를 불러오지 못했습니다.','error');return false}
  if(managerImageBusy)return false;
  const cardId=String(card.id||'');
  const field=managerImageField(kind);
  const label=managerImageLabel(kind);
  let createdId='';
  setManagerImageBusy(true);
  setManagerStatus(`${label} 이미지를 저장하는 중입니다.`,'warn');
  try{
    const {width,height}=await managerImageDimensions(file);
    const stored=await media.put(file,{kind,width,height});
    createdId=String(stored?.id||'');
    if(!createdId)throw new Error('Achievement media id was not created');
    const latest=cardById(cardId);
    if(!latest)throw new Error('Achievement card no longer exists');
    const previousImageId=String(latest?.[field]||'');
    const patch={...managerDraftPatch(),[field]:createdId};
    const result=api.update(cardId,patch);
    if(!result?.ok||result.saved!==true)throw new Error('Achievement metadata commit failed');
    managerDirty=false;
    const cleanup=await cleanupUnreferencedManagerMedia([previousImageId]);
    if(managerSelectedId===cardId)renderManager();
    if(cleanup.failed)setManagerStatus(`${label} 이미지는 저장했지만 이전 파일 정리는 완료하지 못했습니다.`,'warn');
    else setManagerStatus(`${label} 이미지를 저장했습니다.`,'ok');
    return true;
  }catch(error){
    if(createdId){
      try{await media.remove(createdId)}catch(cleanupError){console.warn('Unreferenced achievement media rollback failed',createdId,cleanupError)}
    }
    console.error('Achievement image replacement failed',error);
    setManagerStatus(`${label} 이미지 저장에 실패했습니다. 기존 이미지는 유지됩니다.`,'error');
    return false;
  }finally{setManagerImageBusy(false)}
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
          <p>카드를 추가하고 내용을 편집하거나 목록에서 순서를 변경할 수 있습니다.</p>
        </div>
        <button type="button" class="achievement-manager-close" aria-label="업적 카드 관리 닫기">×</button>
      </div>
      <div class="achievement-manager-shell achievement-manager-workspace">
        <aside class="achievement-manager-list-panel">
          <div class="achievement-manager-list-head">
            <div>
              <strong>카드 목록</strong>
              <span class="chip achievement-manager-shell-count" data-achievement-manager-count>0장</span>
            </div>
            <div class="achievement-manager-list-tools">
              <button type="button" class="secondary achievement-manager-cleanup" data-achievement-manager-cleanup>미사용 이미지 정리</button>
              <button type="button" class="primary achievement-manager-add" data-achievement-manager-add>새 카드</button>
            </div>
          </div>
          <div class="achievement-manager-list" data-achievement-manager-list></div>
        </aside>
        <section class="achievement-manager-editor-panel">
          <div class="achievement-manager-editor-empty" data-achievement-manager-empty>
            <div class="achievement-manager-shell-icon" aria-hidden="true">◆</div>
            <strong>편집할 카드를 선택하세요.</strong>
            <span>새 카드를 추가하거나 왼쪽 목록에서 기존 카드를 선택할 수 있습니다.</span>
          </div>
          <form class="achievement-manager-editor" data-achievement-manager-editor hidden>
            <div class="achievement-manager-editor-heading">
              <div>
                <div class="achievement-manager-kicker">CARD DETAILS</div>
                <h3 data-achievement-manager-editor-title>업적 카드</h3>
              </div>
              <span class="chip" data-achievement-manager-order>#1</span>
            </div>
            <label class="achievement-manager-field">
              <span>게임 이름</span>
              <input type="text" maxlength="120" data-achievement-manager-game placeholder="게임 이름">
            </label>
            <label class="achievement-manager-field">
              <span>컨텐츠 이름</span>
              <input type="text" maxlength="160" data-achievement-manager-content placeholder="컨텐츠 이름">
            </label>
            <label class="achievement-manager-field achievement-manager-description-field">
              <span>설명</span>
              <textarea rows="8" maxlength="4000" data-achievement-manager-description placeholder="업적 카드 설명"></textarea>
            </label>
            <div class="achievement-manager-media-grid">
              <section class="achievement-manager-media-card">
                <div class="achievement-manager-media-head"><strong>앞면 이미지</strong><span>2:3 권장</span></div>
                <div class="achievement-manager-dropzone" data-achievement-manager-drop="front" tabindex="0">
                  <div class="achievement-manager-media-preview" data-achievement-manager-preview="front"><span data-achievement-manager-preview-state>앞면 이미지가 등록되지 않았습니다.</span></div>
                  <div class="achievement-manager-media-actions">
                    <button type="button" class="secondary" data-achievement-manager-pick="front">파일 선택</button>
                    <button type="button" class="secondary achievement-manager-image-remove" data-achievement-manager-remove="front">등록 해제</button>
                    <small class="achievement-manager-media-hint">PC에서는 이미지를 끌어다 놓을 수 있습니다. · 이미지당 32MB 이하</small>
                  </div>
                  <input type="file" accept="image/*" data-achievement-manager-file="front" hidden>
                </div>
              </section>
              <section class="achievement-manager-media-card">
                <div class="achievement-manager-media-head"><strong>뒷면 이미지</strong><span>2:3 권장</span></div>
                <div class="achievement-manager-dropzone" data-achievement-manager-drop="back" tabindex="0">
                  <div class="achievement-manager-media-preview" data-achievement-manager-preview="back"><span data-achievement-manager-preview-state>뒷면 이미지가 등록되지 않았습니다.</span></div>
                  <div class="achievement-manager-media-actions">
                    <button type="button" class="secondary" data-achievement-manager-pick="back">파일 선택</button>
                    <button type="button" class="secondary achievement-manager-image-remove" data-achievement-manager-remove="back">등록 해제</button>
                    <small class="achievement-manager-media-hint">PC에서는 이미지를 끌어다 놓을 수 있습니다. · 이미지당 32MB 이하</small>
                  </div>
                  <input type="file" accept="image/*" data-achievement-manager-file="back" hidden>
                </div>
              </section>
            </div>
            <div class="achievement-manager-editor-actions">
              <button type="button" class="secondary achievement-manager-delete" data-achievement-manager-delete>삭제</button>
              <button type="submit" class="primary" data-achievement-manager-save>저장</button>
            </div>
          </form>
          <div class="achievement-manager-status" data-achievement-manager-status aria-live="polite"></div>
        </section>
      </div>
    </div>`;
  root.querySelector('.achievement-manager-close')?.addEventListener('click',closeManager);
  root.querySelector('[data-achievement-manager-add]')?.addEventListener('click',createManagerCard);
  root.querySelector('[data-achievement-manager-cleanup]')?.addEventListener('click',()=>{void cleanupManagerOrphans()});
  root.querySelector('[data-achievement-manager-delete]')?.addEventListener('click',deleteManagerCard);
  root.querySelector('[data-achievement-manager-editor]')?.addEventListener('submit',saveManagerCard);
  root.querySelector('[data-achievement-manager-editor]')?.addEventListener('input',event=>{
    if(!event.target.matches?.('[data-achievement-manager-game],[data-achievement-manager-content],[data-achievement-manager-description]'))return;
    managerDirty=true;
    setManagerStatus('저장하지 않은 변경사항이 있습니다.','warn');
  });
  root.querySelectorAll('[data-achievement-manager-pick]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      openManagerFilePicker(String(button.dataset.achievementManagerPick||'front'));
    });
  });
  root.querySelectorAll('[data-achievement-manager-remove]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      void removeManagerImage(String(button.dataset.achievementManagerRemove||'front'));
    });
  });
  root.querySelectorAll('[data-achievement-manager-file]').forEach(input=>{
    input.addEventListener('change',()=>{
      const kind=String(input.dataset.achievementManagerFile||'front');
      const file=managerImageFile(input.files);
      input.value='';
      if(file)void replaceManagerImage(kind,file);
    });
  });
  root.querySelectorAll('[data-achievement-manager-drop]').forEach(drop=>{
    const kind=String(drop.dataset.achievementManagerDrop||'front');
    drop.addEventListener('click',event=>{
      if(event.target.closest?.('[data-achievement-manager-pick],[data-achievement-manager-remove]'))return;
      openManagerFilePicker(kind);
    });
    drop.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      event.preventDefault();
      openManagerFilePicker(kind);
    });
    drop.addEventListener('dragenter',event=>{
      if(managerImageBusy||!Array.from(event.dataTransfer?.types||[]).includes('Files'))return;
      event.preventDefault();
      drop.classList.add('is-dragover');
    });
    drop.addEventListener('dragover',event=>{
      if(managerImageBusy||!Array.from(event.dataTransfer?.types||[]).includes('Files'))return;
      event.preventDefault();
      if(event.dataTransfer)event.dataTransfer.dropEffect='copy';
      drop.classList.add('is-dragover');
    });
    drop.addEventListener('dragleave',event=>{
      if(event.relatedTarget&&drop.contains(event.relatedTarget))return;
      drop.classList.remove('is-dragover');
    });
    drop.addEventListener('drop',event=>{
      event.preventDefault();
      drop.classList.remove('is-dragover');
      if(managerImageBusy)return;
      const file=managerImageFile(event.dataTransfer?.files);
      if(!file){setManagerStatus('드롭한 파일에서 이미지를 찾지 못했습니다.','error');return}
      void replaceManagerImage(kind,file);
    });
  });
  root.addEventListener('click',event=>{if(event.target===root)closeManager()});
  document.body.appendChild(root);
  managerModal=root;
  return root;
}
function managerCurrentCard(){
  return managerSelectedId?cardById(managerSelectedId):null;
}
function clearManagerDropMarkers(){
  managerModal?.querySelectorAll('.achievement-manager-list-item').forEach(item=>item.classList.remove('dragging','drop-before','drop-after'));
}
function moveManagerCard(id,targetIndex){
  if(managerImageBusy){setManagerStatus('이미지 저장이 끝난 뒤 순서를 변경해 주세요.','warn');return false}
  const api=managerApi();
  const list=cards();
  const fromIndex=list.findIndex(card=>String(card.id||'')===String(id||''));
  const nextIndex=Math.max(0,Math.min(list.length-1,Math.floor(Number(targetIndex)||0)));
  if(fromIndex<0||fromIndex===nextIndex)return false;
  if(!api?.move){setManagerStatus('카드 순서 저장 기능을 불러오지 못했습니다.','error');return false}
  if(managerDirty&&!window.confirm('저장하지 않은 변경사항을 버리고 카드 순서를 변경할까요?'))return false;
  managerDirty=false;
  const result=api.move(id,nextIndex);
  if(!result?.ok||result.saved!==true){
    setManagerStatus('카드 순서를 저장하지 못했습니다. 기존 순서를 유지합니다.','error');
    return false;
  }
  managerSelectedId=String(managerSelectedId||id);
  renderManager();
  setManagerStatus('카드 순서를 저장했습니다.','ok');
  return true;
}
function moveManagerCardBy(id,delta){
  const list=cards();
  const index=list.findIndex(card=>String(card.id||'')===String(id||''));
  if(index<0)return false;
  return moveManagerCard(id,index+Number(delta||0));
}
function renderManagerList(){
  const root=ensureManagerModal();
  const listEl=root.querySelector('[data-achievement-manager-list]');
  if(!listEl)return;
  const list=cards();
  listEl.replaceChildren();
  if(!list.length){
    const empty=document.createElement('div');
    empty.className='achievement-manager-list-empty';
    empty.textContent='등록된 업적 카드가 없습니다.';
    listEl.appendChild(empty);
    return;
  }
  list.forEach((card,index)=>{
    const id=String(card.id||'');
    const item=document.createElement('div');
    item.className='achievement-manager-list-item';
    item.dataset.achievementManagerCardId=id;
    item.classList.toggle('active',id===managerSelectedId);

    const handle=document.createElement('span');
    handle.className='achievement-manager-drag-handle';
    handle.draggable=true;
    handle.title='드래그해서 순서 변경';
    handle.setAttribute('aria-label','드래그해서 카드 순서 변경');
    handle.textContent='잡기';

    const select=document.createElement('button');
    select.type='button';
    select.className='achievement-manager-list-select';
    const order=document.createElement('span');
    order.className='achievement-manager-list-order';
    order.textContent=String(index+1).padStart(2,'0');
    const copy=document.createElement('span');
    copy.className='achievement-manager-list-copy';
    const game=document.createElement('strong');
    game.textContent=text(card.gameName,'게임 이름 없음');
    const content=document.createElement('small');
    content.textContent=text(card.contentName,'컨텐츠 이름 없음');
    copy.append(game,content);
    select.append(order,copy);
    select.addEventListener('click',()=>selectManagerCard(id));

    const controls=document.createElement('span');
    controls.className='achievement-manager-move-controls';
    const up=document.createElement('button');
    up.type='button';
    up.className='achievement-manager-move-button';
    up.textContent='위';
    up.disabled=index===0;
    up.setAttribute('aria-label','카드를 위로 이동');
    up.addEventListener('click',event=>{event.stopPropagation();moveManagerCardBy(id,-1)});
    const down=document.createElement('button');
    down.type='button';
    down.className='achievement-manager-move-button';
    down.textContent='아래';
    down.disabled=index===list.length-1;
    down.setAttribute('aria-label','카드를 아래로 이동');
    down.addEventListener('click',event=>{event.stopPropagation();moveManagerCardBy(id,1)});
    controls.append(up,down);

    handle.addEventListener('dragstart',event=>{
      if(managerImageBusy){event.preventDefault();setManagerStatus('이미지 저장이 끝난 뒤 순서를 변경해 주세요.','warn');return}
      managerDragId=id;
      item.classList.add('dragging');
      if(event.dataTransfer){
        event.dataTransfer.effectAllowed='move';
        event.dataTransfer.setData('text/plain',id);
      }
    });
    handle.addEventListener('dragend',()=>{
      managerDragId='';
      clearManagerDropMarkers();
    });
    item.addEventListener('dragover',event=>{
      if(!managerDragId||managerDragId===id)return;
      event.preventDefault();
      if(event.dataTransfer)event.dataTransfer.dropEffect='move';
      const rect=item.getBoundingClientRect();
      const after=event.clientY>rect.top+rect.height/2;
      item.classList.toggle('drop-before',!after);
      item.classList.toggle('drop-after',after);
    });
    item.addEventListener('dragleave',event=>{
      if(event.relatedTarget&&item.contains(event.relatedTarget))return;
      item.classList.remove('drop-before','drop-after');
    });
    item.addEventListener('drop',event=>{
      if(!managerDragId||managerDragId===id)return;
      event.preventDefault();
      const movingId=managerDragId;
      const current=cards();
      const fromIndex=current.findIndex(entry=>String(entry.id||'')===movingId);
      const overIndex=current.findIndex(entry=>String(entry.id||'')===id);
      const rect=item.getBoundingClientRect();
      let insertIndex=overIndex+(event.clientY>rect.top+rect.height/2?1:0);
      if(fromIndex<insertIndex)insertIndex--;
      insertIndex=Math.max(0,Math.min(current.length-1,insertIndex));
      managerDragId='';
      clearManagerDropMarkers();
      moveManagerCard(movingId,insertIndex);
    });

    item.append(handle,select,controls);
    listEl.appendChild(item);
  });
}
function renderManagerEditor(){
  const root=ensureManagerModal();
  const empty=root.querySelector('[data-achievement-manager-empty]');
  const editor=root.querySelector('[data-achievement-manager-editor]');
  const card=managerCurrentCard();
  if(!empty||!editor)return;
  if(!card){
    managerMediaToken++;
    clearManagerObjectUrls();
    empty.hidden=false;
    editor.hidden=true;
    return;
  }
  empty.hidden=true;
  editor.hidden=false;
  root.querySelector('[data-achievement-manager-editor-title]').textContent=text(card.contentName,'업적 카드');
  root.querySelector('[data-achievement-manager-order]').textContent=`#${Number(card.order||0)+1}`;
  root.querySelector('[data-achievement-manager-game]').value=String(card.gameName||'');
  root.querySelector('[data-achievement-manager-content]').value=String(card.contentName||'');
  root.querySelector('[data-achievement-manager-description]').value=String(card.description||'');
  renderManagerMediaPreviews(card);
  syncManagerMediaControls(card);
}
function renderManager(){
  const list=cards();
  if(managerSelectedId&&!list.some(card=>String(card.id||'')===managerSelectedId))managerSelectedId='';
  if(!managerSelectedId&&list.length)managerSelectedId=String(list[0].id||'');
  syncManagerShellCount();
  renderManagerList();
  renderManagerEditor();
}
function selectManagerCard(id){
  if(managerImageBusy){setManagerStatus('이미지 저장이 끝난 뒤 다른 카드를 선택해 주세요.','warn');return}
  const next=String(id||'');
  if(next===managerSelectedId)return;
  if(managerDirty&&!window.confirm('저장하지 않은 변경사항이 있습니다. 다른 카드로 이동할까요?'))return;
  managerDirty=false;
  managerSelectedId=next;
  setManagerStatus('');
  renderManagerList();
  renderManagerEditor();
}
function createManagerCard(){
  if(managerImageBusy){setManagerStatus('이미지 저장이 끝난 뒤 새 카드를 추가해 주세요.','warn');return}
  const api=managerApi();
  if(!api?.create){setManagerStatus('카드 저장 기능을 불러오지 못했습니다.','error');return}
  if(managerDirty&&!window.confirm('저장하지 않은 변경사항을 버리고 새 카드를 추가할까요?'))return;
  managerDirty=false;
  const result=api.create({gameName:'',contentName:'새 업적 카드',description:''});
  if(!result?.ok){setManagerStatus('새 카드를 만들지 못했습니다.','error');return}
  managerSelectedId=String(result.card?.id||'');
  renderManager();
  setManagerStatus(result.saved?'새 업적 카드를 추가했습니다.':'카드는 추가했지만 브라우저 저장 공간을 확인해 주세요.',result.saved?'ok':'warn');
  setTimeout(()=>managerModal?.querySelector('[data-achievement-manager-game]')?.focus(),0);
}
function saveManagerCard(event){
  event?.preventDefault();
  if(managerImageBusy){setManagerStatus('이미지 저장이 끝난 뒤 다시 저장해 주세요.','warn');return}
  const card=managerCurrentCard();
  const api=managerApi();
  if(!card||!api?.update){setManagerStatus('저장할 카드를 선택해 주세요.','error');return}
  const root=ensureManagerModal();
  const patch={
    gameName:root.querySelector('[data-achievement-manager-game]').value,
    contentName:root.querySelector('[data-achievement-manager-content]').value,
    description:root.querySelector('[data-achievement-manager-description]').value
  };
  const result=api.update(card.id,patch);
  if(!result?.ok){setManagerStatus('업적 카드를 저장하지 못했습니다.','error');return}
  managerDirty=false;
  renderManager();
  setManagerStatus(result.saved?'업적 카드 정보를 저장했습니다.':'변경사항은 화면에 반영했지만 브라우저 저장 공간을 확인해 주세요.',result.saved?'ok':'warn');
}
function deleteManagerCard(){void deleteManagerCardAsync()}
async function deleteManagerCardAsync(){
  if(managerImageBusy){setManagerStatus('이미지 저장이 끝난 뒤 카드를 삭제해 주세요.','warn');return}
  const card=managerCurrentCard();
  const api=managerApi();
  if(!card||!api?.remove){setManagerStatus('삭제할 카드를 선택해 주세요.','error');return}
  const label=text(card.contentName,text(card.gameName,'이 업적 카드'));
  if(!window.confirm(`"${label}" 카드를 삭제하시겠습니까?`))return;
  const previousIndex=cards().findIndex(item=>String(item.id||'')===String(card.id||''));
  const mediaIds=[String(card.frontImageId||''),String(card.backImageId||'')].filter(Boolean);
  const result=api.remove(card.id);
  if(!result?.ok||result.saved!==true){setManagerStatus('업적 카드를 삭제하지 못했습니다. 기존 카드는 유지됩니다.','error');return}
  managerDirty=false;
  const cleanup=await cleanupUnreferencedManagerMedia(mediaIds);
  const list=cards();
  const next=list[Math.min(Math.max(previousIndex,0),Math.max(list.length-1,0))]||null;
  managerSelectedId=next?String(next.id||''):'';
  renderManager();
  setManagerStatus(result.saved?'업적 카드를 삭제했습니다.':'카드는 삭제했지만 브라우저 저장 공간을 확인해 주세요.',result.saved?'ok':'warn');
  if(cleanup.failed)setManagerStatus('업적 카드는 삭제했지만 일부 미사용 이미지 파일은 정리하지 못했습니다.','warn');
}
function syncManagerShellCount(){
  const count=cards().length;
  updateManagerCount();
  if(managerModal){
    const modalCount=managerModal.querySelector('[data-achievement-manager-count]');
    if(modalCount)modalCount.textContent=`${count}장`;
  }
}
function openManager(){
  const root=ensureManagerModal();
  if(detailModal&&!detailModal.hidden)closeDetail();
  managerLastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  renderManager();
  setManagerStatus('');
  root.hidden=false;
  document.body.classList.add('mws-achievement-manager-open');
  setTimeout(()=>{
    const target=managerSelectedId
      ?root.querySelector(`[data-achievement-manager-card-id="${CSS.escape(managerSelectedId)}"]`)
      :root.querySelector('[data-achievement-manager-add]');
    target?.focus();
  },0);
  return true;
}
function closeManager(){
  if(!managerModal||managerModal.hidden)return;
  if(managerImageBusy){setManagerStatus('이미지 저장이 끝난 뒤 관리창을 닫아 주세요.','warn');return}
  if(managerDirty&&!window.confirm('저장하지 않은 변경사항이 있습니다. 관리창을 닫을까요?'))return;
  managerDirty=false;
  managerDragId='';
  clearManagerDropMarkers();
  managerMediaToken++;
  clearManagerObjectUrls();
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
  clearManagerObjectUrls();
},{once:true});
bindManagerEntry();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindManagerEntry,{once:true});
if(document.getElementById('achievements')?.classList.contains('active'))render();
})();
