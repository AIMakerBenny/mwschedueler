/* Mawang Scheduler v1.6.21 - Achievement gallery/detail runtime, Phase 91 */
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
          <div class="achievement-detail-card">
            <div class="achievement-detail-card-placeholder">앞면 이미지가 등록되지 않았습니다.</div>
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
  root.addEventListener('click',event=>{if(event.target===root)closeDetail()});
  document.body.appendChild(root);
  detailModal=root;
  return root;
}
async function loadDetailFront(card,root,token){
  const frame=root.querySelector('.achievement-detail-card');
  const placeholder=root.querySelector('.achievement-detail-card-placeholder');
  if(!frame||!placeholder)return;
  frame.querySelector('img')?.remove();
  frame.classList.remove('has-image');
  placeholder.textContent=card?.frontImageId?'카드 이미지를 불러오는 중입니다.':'앞면 이미지가 등록되지 않았습니다.';
  const imageId=String(card?.frontImageId||'');
  if(!imageId)return;
  const media=window.mwsAchievementMediaV1;
  if(!media?.getBlob){
    placeholder.textContent='카드 이미지 저장소를 불러오지 못했습니다.';
    return;
  }
  try{
    const blob=await media.getBlob(imageId);
    if(token!==detailToken)return;
    if(!(blob instanceof Blob)){
      placeholder.textContent='등록된 카드 이미지를 찾을 수 없습니다.';
      return;
    }
    const url=URL.createObjectURL(blob);
    if(token!==detailToken){URL.revokeObjectURL(url);return}
    detailObjectUrls.push(url);
    const img=document.createElement('img');
    img.alt=`${text(card?.gameName,'업적')} 카드 앞면`;
    img.decoding='async';
    img.src=url;
    img.onload=()=>{if(token===detailToken)frame.classList.add('has-image')};
    img.onerror=()=>{if(token===detailToken)placeholder.textContent='카드 이미지를 표시할 수 없습니다.'};
    frame.appendChild(img);
  }catch(error){
    console.warn('Achievement detail image load failed',imageId,error);
    if(token===detailToken)placeholder.textContent='카드 이미지를 불러오지 못했습니다.';
  }
}
function openDetail(id){
  const card=cardById(id);
  if(!card)return false;
  const root=ensureDetailModal();
  const token=++detailToken;
  clearDetailObjectUrls();
  detailLastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  root.querySelector('[data-achievement-detail="game"]').textContent=text(card.gameName,'게임 이름 없음');
  root.querySelector('[data-achievement-detail="content"]').textContent=text(card.contentName,'컨텐츠 이름 없음');
  root.querySelector('[data-achievement-detail="description"]').textContent=text(card.description,'등록된 설명이 없습니다.');
  root.querySelector('#achievementDetailTitle').textContent=text(card.contentName,'업적 카드');
  root.hidden=false;
  document.body.classList.add('mws-achievement-modal-open');
  loadDetailFront(card,root,token);
  setTimeout(()=>root.querySelector('.achievement-detail-close')?.focus(),0);
  return true;
}
function closeDetail(){
  if(!detailModal||detailModal.hidden)return;
  detailToken++;
  detailModal.hidden=true;
  document.body.classList.remove('mws-achievement-modal-open');
  clearDetailObjectUrls();
  const focus=detailLastFocus;
  detailLastFocus=null;
  if(focus?.isConnected)setTimeout(()=>focus.focus(),0);
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
window.addEventListener('mawang:datachange',()=>{
  if(document.getElementById('achievements')?.classList.contains('active'))render();
  if(detailModal&&!detailModal.hidden){
    const activeId=detailLastFocus?.closest?.('[data-achievement-card-id]')?.dataset?.achievementCardId;
    if(activeId&&!cardById(activeId))closeDetail();
  }
});
window.addEventListener('mws:achievement-media-ready',()=>{
  if(document.getElementById('achievements')?.classList.contains('active'))render();
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&detailModal&&!detailModal.hidden){event.preventDefault();closeDetail()}
});
window.addEventListener('beforeunload',()=>{
  clearGalleryObjectUrls();
  clearDetailObjectUrls();
},{once:true});
if(document.getElementById('achievements')?.classList.contains('active'))render();
})();
