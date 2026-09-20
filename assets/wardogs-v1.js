/* WARDOGS Phase 124 - class gallery renderer */
(()=>{
'use strict';
if(window.__mwsWardogsV117)return;
window.__mwsWardogsV117=true;

const CLASSES=Object.freeze([
  {id:'assault',name:'ASSAULT',code:'ASLT',label:'Assault'},
  {id:'medic',name:'MEDIC',code:'MED',label:'Medic'},
  {id:'recon',name:'RECON',code:'RCN',label:'Recon'},
  {id:'support',name:'SUPPORT',code:'SUP',label:'Support'},
  {id:'driver',name:'DRIVER',code:'DRV',label:'Driver'},
  {id:'pilot',name:'PILOT',code:'PLT',label:'Pilot'}
]);

let activeClass='assault';
let renderToken=0;
let galleryObjectUrls=[];

function revokeGalleryUrls(){
  while(galleryObjectUrls.length){
    const url=galleryObjectUrls.pop();
    try{URL.revokeObjectURL(url)}catch(_){}
  }
}
function classMeta(id){return CLASSES.find(item=>item.id===id)||CLASSES[0]}
function dataApi(){return window.mwsWardogsDataV119}
function mediaApi(){return window.mwsWardogsMediaV1}
function linkedActiveCards(classId){
  const api=dataApi();
  if(!api?.getCards)return [];
  return api.getCards(classId,{activeOnly:true}).filter(card=>api.resolveContactLink?.(card)?.linked===true);
}
function updateClassCounts(){
  const api=dataApi();
  const root=document.getElementById('wardogs');
  if(!root||!api?.getCards)return;
  for(const item of CLASSES){
    const button=root.querySelector(`[data-wardogs-class="${item.id}"]`);
    if(!button)continue;
    let countEl=button.querySelector('.wd-class-count-v124');
    if(!countEl){
      countEl=document.createElement('span');
      countEl.className='wd-class-count-v124';
      button.appendChild(countEl);
    }
    countEl.textContent=String(linkedActiveCards(item.id).length).padStart(2,'0');
  }
}
function makeGalleryCard(card){
  const api=dataApi();
  const link=api?.resolveContactLink?.(card);
  const contact=link?.contact||null;
  const article=document.createElement('article');
  article.className='wardogs-gallery-card-v124';
  article.dataset.wardogsCardId=String(card?.id||'');
  article.dataset.wardogsContactId=String(card?.contactId||'');

  const visual=document.createElement('div');
  visual.className='wardogs-gallery-visual-v124';

  const placeholder=document.createElement('div');
  placeholder.className='wardogs-gallery-placeholder-v124';
  placeholder.innerHTML='<span>IMAGE LINK</span><strong>LOADING</strong>';
  visual.appendChild(placeholder);

  const footer=document.createElement('div');
  footer.className='wardogs-gallery-footer-v124';

  const identity=document.createElement('div');
  identity.className='wardogs-gallery-identity-v124';
  const name=document.createElement('strong');
  name.textContent=String(contact?.name||'이름 없음');
  const meta=document.createElement('span');
  meta.textContent=`${classMeta(card?.classId).name} // ${String(card?.order??0).padStart(2,'0')}`;
  identity.append(name,meta);

  const state=document.createElement('span');
  state.className='wardogs-gallery-state-v124';
  state.textContent='ACTIVE';

  footer.append(identity,state);
  article.append(visual,footer);
  return {article,visual,placeholder};
}
async function loadGalleryImage(card,view,token){
  const imageId=String(card?.imageId||'').trim();
  if(!imageId){
    view.placeholder.innerHTML='<span>NO MEDIA</span><strong>IMAGE MISSING</strong>';
    return;
  }
  const media=mediaApi();
  if(!media?.getBlob){
    view.placeholder.innerHTML='<span>MEDIA OFFLINE</span><strong>STORE UNAVAILABLE</strong>';
    return;
  }
  try{
    const blob=await media.getBlob(imageId);
    if(token!==renderToken)return;
    if(!(blob instanceof Blob)){
      view.placeholder.innerHTML='<span>NO MEDIA</span><strong>IMAGE MISSING</strong>';
      return;
    }
    const url=URL.createObjectURL(blob);
    if(token!==renderToken){URL.revokeObjectURL(url);return}
    galleryObjectUrls.push(url);
    const img=document.createElement('img');
    img.alt='WARDOGS '+String(dataApi()?.findContact?.(card.contactId)?.name||'카드');
    img.loading='lazy';
    img.decoding='async';
    img.draggable=false;
    img.src=url;
    img.onload=()=>{
      if(token===renderToken){
        view.visual.classList.add('has-image');
        view.placeholder.hidden=true;
      }
    };
    img.onerror=()=>{
      if(token===renderToken){
        view.placeholder.hidden=false;
        view.placeholder.innerHTML='<span>MEDIA ERROR</span><strong>LOAD FAILED</strong>';
      }
    };
    view.visual.appendChild(img);
  }catch(error){
    console.warn('WARDOGS gallery media load failed',imageId,error);
    if(token===renderToken)view.placeholder.innerHTML='<span>MEDIA ERROR</span><strong>LOAD FAILED</strong>';
  }
}
async function renderGallery(){
  const root=document.getElementById('wardogs');
  const grid=root?.querySelector('#wardogsGalleryV124');
  const empty=root?.querySelector('#wardogsEmptyV124');
  const count=root?.querySelector('#wardogsPersonnelCountV124');
  if(!root||!grid||!empty||!count)return false;

  const token=++renderToken;
  revokeGalleryUrls();
  const list=linkedActiveCards(activeClass);
  count.textContent=`PERSONNEL ${String(list.length).padStart(3,'0')}`;
  updateClassCounts();
  grid.replaceChildren();
  grid.hidden=list.length===0;
  empty.hidden=list.length>0;

  const current=classMeta(activeClass);
  const emptyText=root.querySelector('#wardogsClassEmptyText');
  if(emptyText)emptyText.textContent=`${current.label} 클래스에 표시할 활성 WARDOGS 카드가 없습니다.`;

  if(!list.length)return true;

  const pending=[];
  for(const card of list){
    const view=makeGalleryCard(card);
    grid.appendChild(view.article);
    pending.push(loadGalleryImage(card,view,token));
  }
  await Promise.allSettled(pending);
  return token===renderToken;
}

function setClass(next){
  if(!CLASSES.some(item=>item.id===next))next='assault';
  activeClass=next;
  const root=document.getElementById('wardogs');
  if(!root)return;
  root.dataset.wardogsActiveClass=next;
  root.querySelectorAll('[data-wardogs-class]').forEach(btn=>{
    const active=btn.dataset.wardogsClass===next;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-selected',active?'true':'false');
    btn.tabIndex=active?0:-1;
  });
  const current=classMeta(next);
  const title=root.querySelector('#wardogsClassStageTitle');
  const code=root.querySelector('#wardogsClassStageCode');
  if(title)title.textContent=current.name;
  if(code)code.textContent=`CLASS // ${current.code}`;
  void renderGallery();
}

function onKeydown(event){
  const button=event.target.closest?.('[data-wardogs-class]');
  if(!button||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const index=CLASSES.findIndex(item=>item.id===button.dataset.wardogsClass);
  if(index<0)return;
  event.preventDefault();
  let next=index;
  if(event.key==='ArrowLeft')next=(index-1+CLASSES.length)%CLASSES.length;
  if(event.key==='ArrowRight')next=(index+1)%CLASSES.length;
  if(event.key==='Home')next=0;
  if(event.key==='End')next=CLASSES.length-1;
  setClass(CLASSES[next].id);
  document.querySelector(`[data-wardogs-class="${CLASSES[next].id}"]`)?.focus();
}

function init(){
  const root=document.getElementById('wardogs');
  if(!root||root.dataset.wardogsTabsBoundV117==='1')return;
  root.dataset.wardogsTabsBoundV117='1';
  root.querySelectorAll('[data-wardogs-class]').forEach(btn=>{
    btn.addEventListener('click',()=>setClass(btn.dataset.wardogsClass));
    btn.addEventListener('keydown',onKeydown);
  });
  setClass(activeClass);
}

window.mwsWardogsV117=Object.freeze({
  classes:CLASSES,
  setClass,
  getActiveClass:()=>activeClass,
  init,
  renderGallery
});
window.mwsRenderWardogsGalleryV124=renderGallery;
window.__mwsWardogsGalleryV124='active-linked-order-preserving';

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

window.addEventListener('mws:app-ready',init);
window.addEventListener('mws:cloud-runtime-v130-ready',init);
window.addEventListener('mws:parts-loaded',event=>{
  const parts=Array.isArray(event?.detail?.parts)?event.detail.parts:[];
  if(parts.includes('wardogs'))void renderGallery();
});
window.addEventListener('mawang:datachange',event=>{
  if(String(event?.detail?.reason||'').startsWith('WARDOGS'))void renderGallery();
});
window.addEventListener('mws:wardogs-media-ready',()=>void renderGallery());
window.addEventListener('beforeunload',revokeGalleryUrls,{once:true});
})();