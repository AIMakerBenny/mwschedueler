/* Mawang Scheduler v1.6.21 - Achievement gallery runtime, Phase 90 */
(()=>{
'use strict';
if(window.__mwsAchievementGalleryRuntimeV1621)return;
window.__mwsAchievementGalleryRuntimeV1621=true;

let renderToken=0;
let objectUrls=[];

function cards(){
  try{
    const value=typeof window.mwsGetAchievementCardsV1621==='function'
      ? window.mwsGetAchievementCardsV1621()
      : window.data?.achievementCards;
    return Array.isArray(value)?value.slice().sort((a,b)=>(Number(a?.order)||0)-(Number(b?.order)||0)):[];
  }catch(_){return[]}
}
function clearObjectUrls(){
  for(const url of objectUrls){try{URL.revokeObjectURL(url)}catch(_){}}
  objectUrls=[];
}
function text(value,fallback){const out=String(value??'').trim();return out||fallback}
function makeTile(card){
  const tile=document.createElement('article');
  tile.className='achievement-card-tile';
  tile.dataset.achievementCardId=String(card?.id||'');

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

  tile.append(thumb,caption);
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
    objectUrls.push(url);
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
async function render(){
  const section=document.getElementById('achievements');
  const grid=document.getElementById('achievementGallery');
  const empty=document.getElementById('achievementEmptyState');
  const count=document.getElementById('achievementCountChip');
  if(!section||!grid||!empty||!count)return false;

  const token=++renderToken;
  clearObjectUrls();
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
window.addEventListener('mawang:datachange',()=>{
  if(document.getElementById('achievements')?.classList.contains('active'))render();
});
window.addEventListener('mws:achievement-media-ready',()=>{
  if(document.getElementById('achievements')?.classList.contains('active'))render();
});
window.addEventListener('beforeunload',clearObjectUrls,{once:true});
if(document.getElementById('achievements')?.classList.contains('active'))render();
})();
