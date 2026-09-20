/* WARDOGS Phase 125 - class gallery + card detail */
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
let detailModal=null;
let detailImageUrl='';
let detailCardId='';
let detailLastFocus=null;
let detailToken=0;

function revokeGalleryUrls(){
  while(galleryObjectUrls.length){
    const url=galleryObjectUrls.pop();
    try{URL.revokeObjectURL(url)}catch(_){}
  }
}
function classMeta(id){return CLASSES.find(item=>item.id===id)||CLASSES[0]}
function dataApi(){return window.mwsWardogsDataV119}
function mediaApi(){return window.mwsWardogsMediaV1}
function cardById(id){
  const key=String(id||'');
  return dataApi()?.get?.()?.cards?.find?.(card=>String(card?.id||'')===key)||null;
}
function safeHttpUrl(raw){
  const value=String(raw||'').trim();
  if(!value)return '';
  try{
    const url=new URL(value,/^https?:\/\//i.test(value)?undefined:'https://example.invalid/');
    if(!/^https?:$/i.test(url.protocol))return '';
    if(url.hostname==='example.invalid')return '';
    return url.href;
  }catch(_){return ''}
}
function revokeDetailImageUrl(){
  if(detailImageUrl){try{URL.revokeObjectURL(detailImageUrl)}catch(_){}detailImageUrl=''}
}
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
  article.setAttribute('role','button');
  article.tabIndex=0;
  article.setAttribute('aria-label',`${String(contact?.name||'이름 없음')} ${classMeta(card?.classId).name} WARDOGS 카드 상세 보기`);
  article.addEventListener('click',()=>void openDetail(card.id,article));
  article.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();
    void openDetail(card.id,article);
  });

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
function ensureDetailModal(){
  if(detailModal?.isConnected)return detailModal;
  const root=document.createElement('div');
  root.id='wardogsDetailModalV125';
  root.className='wardogs-detail-modal-v125';
  root.hidden=true;
  root.setAttribute('role','dialog');
  root.setAttribute('aria-modal','true');
  root.setAttribute('aria-labelledby','wardogsDetailNameV125');
  root.innerHTML=`
    <div class="wardogs-detail-dialog-v125" role="document">
      <div class="wardogs-detail-head-v125">
        <div><span>WARDOGS PERSONNEL RECORD</span><strong id="wardogsDetailClassV125">CLASS // --</strong></div>
        <button type="button" class="wardogs-detail-close-v125" data-wardogs-detail-close aria-label="WARDOGS 상세 닫기">×</button>
      </div>
      <div class="wardogs-detail-layout-v125">
        <section class="wardogs-detail-media-v125">
          <div class="wardogs-detail-media-frame-v125" data-wardogs-detail-media>
            <div class="wardogs-detail-media-state-v125" data-wardogs-detail-media-state><span>IMAGE LINK</span><strong>LOADING</strong></div>
          </div>
        </section>
        <aside class="wardogs-detail-info-v125">
          <div class="wardogs-detail-kicker-v125">LINKED CONTACT</div>
          <h2 id="wardogsDetailNameV125">-</h2>
          <div class="wardogs-detail-tags-v125" data-wardogs-detail-tags></div>
          <div class="wardogs-detail-grid-v125">
            <div><span>CONTACT ID</span><strong data-wardogs-detail-contact-id>-</strong></div>
            <div><span>WARDOGS CLASS</span><strong data-wardogs-detail-class>-</strong></div>
            <div><span>DISPLAY ORDER</span><strong data-wardogs-detail-order>-</strong></div>
            <div><span>CARD STATUS</span><strong data-wardogs-detail-status>ACTIVE</strong></div>
          </div>
          <div class="wardogs-detail-section-v125">
            <span class="wardogs-detail-label-v125">방송국 주소</span>
            <a class="wardogs-detail-link-v125" data-wardogs-detail-station target="_blank" rel="noopener noreferrer" hidden></a>
            <div class="wardogs-detail-empty-v125" data-wardogs-detail-station-empty>등록된 주소 없음</div>
          </div>
          <div class="wardogs-detail-section-v125">
            <span class="wardogs-detail-label-v125">연락처 메모</span>
            <div class="wardogs-detail-notes-v125" data-wardogs-detail-notes>등록된 메모 없음</div>
          </div>
        </aside>
      </div>
    </div>`;
  document.body.appendChild(root);
  root.querySelectorAll('[data-wardogs-detail-close]').forEach(btn=>btn.addEventListener('click',closeDetail));
  root.addEventListener('click',event=>{if(event.target===root)closeDetail()});
  detailModal=root;
  return root;
}
async function loadDetailImage(card,token){
  const root=ensureDetailModal();
  const frame=root.querySelector('[data-wardogs-detail-media]');
  const stateEl=root.querySelector('[data-wardogs-detail-media-state]');
  if(!frame||!stateEl)return;
  frame.querySelector('img')?.remove();
  revokeDetailImageUrl();
  stateEl.hidden=false;
  stateEl.innerHTML='<span>IMAGE LINK</span><strong>LOADING</strong>';
  const imageId=String(card?.imageId||'').trim();
  if(!imageId){stateEl.innerHTML='<span>NO MEDIA</span><strong>IMAGE MISSING</strong>';return}
  try{
    const blob=await mediaApi()?.getBlob?.(imageId);
    if(token!==detailToken||detailCardId!==card.id)return;
    if(!(blob instanceof Blob)){stateEl.innerHTML='<span>NO MEDIA</span><strong>IMAGE MISSING</strong>';return}
    const url=URL.createObjectURL(blob);
    if(token!==detailToken||detailCardId!==card.id){URL.revokeObjectURL(url);return}
    detailImageUrl=url;
    const img=document.createElement('img');
    img.alt=`WARDOGS ${String(dataApi()?.findContact?.(card.contactId)?.name||'카드')} 상세 이미지`;
    img.decoding='async';
    img.draggable=false;
    img.src=url;
    img.onload=()=>{if(token===detailToken){stateEl.hidden=true;frame.classList.add('has-image')}};
    img.onerror=()=>{if(token===detailToken){stateEl.hidden=false;stateEl.innerHTML='<span>MEDIA ERROR</span><strong>LOAD FAILED</strong>'}};
    frame.appendChild(img);
  }catch(error){
    console.warn('WARDOGS detail media load failed',imageId,error);
    if(token===detailToken)stateEl.innerHTML='<span>MEDIA ERROR</span><strong>LOAD FAILED</strong>';
  }
}
async function openDetail(cardId,opener=null){
  const card=cardById(cardId);
  const link=card?dataApi()?.resolveContactLink?.(card):null;
  if(!card||card.active===false||!link?.linked)return false;
  const contact=link.contact;
  const root=ensureDetailModal();
  detailCardId=card.id;
  detailLastFocus=opener||document.activeElement;
  const token=++detailToken;

  root.querySelector('#wardogsDetailClassV125').textContent=`CLASS // ${classMeta(card.classId).code}`;
  root.querySelector('#wardogsDetailNameV125').textContent=String(contact?.name||'이름 없음');
  root.querySelector('[data-wardogs-detail-contact-id]').textContent=String(card.contactId||'-');
  root.querySelector('[data-wardogs-detail-class]').textContent=classMeta(card.classId).name;
  root.querySelector('[data-wardogs-detail-order]').textContent=String(Number(card.order)||0).padStart(2,'0');
  root.querySelector('[data-wardogs-detail-status]').textContent=card.active===false?'INACTIVE':'ACTIVE';

  const tags=root.querySelector('[data-wardogs-detail-tags]');
  tags.replaceChildren();
  const labels=Array.isArray(contact?.labels)?contact.labels.filter(Boolean):[];
  if(labels.length){
    for(const label of labels){
      const chip=document.createElement('span');
      chip.textContent=String(label);
      tags.appendChild(chip);
    }
  }else{
    const chip=document.createElement('span');
    chip.className='empty';
    chip.textContent='NO LABELS';
    tags.appendChild(chip);
  }

  const station=root.querySelector('[data-wardogs-detail-station]');
  const stationEmpty=root.querySelector('[data-wardogs-detail-station-empty]');
  const stationUrl=safeHttpUrl(contact?.stationUrl);
  if(stationUrl){
    station.href=stationUrl;
    station.textContent=String(contact?.stationUrl||stationUrl);
    station.hidden=false;
    stationEmpty.hidden=true;
  }else{
    station.removeAttribute('href');
    station.textContent='';
    station.hidden=true;
    stationEmpty.hidden=false;
  }
  root.querySelector('[data-wardogs-detail-notes]').textContent=String(contact?.notes||'').trim()||'등록된 메모 없음';

  root.hidden=false;
  document.body.classList.add('mws-wardogs-detail-open-v125');
  root.querySelector('[data-wardogs-detail-close]')?.focus();
  void loadDetailImage(card,token);
  return true;
}
function closeDetail(){
  if(!detailModal||detailModal.hidden)return;
  detailToken++;
  detailCardId='';
  revokeDetailImageUrl();
  detailModal.querySelector('[data-wardogs-detail-media]')?.classList.remove('has-image');
  detailModal.hidden=true;
  document.body.classList.remove('mws-wardogs-detail-open-v125');
  const focus=detailLastFocus;
  detailLastFocus=null;
  if(focus?.isConnected)setTimeout(()=>focus.focus(),0);
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
window.mwsOpenWardogsDetailV125=openDetail;
window.mwsCloseWardogsDetailV125=closeDetail;
window.__mwsWardogsDetailV125='linked-contact-card-detail';

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

window.addEventListener('mws:app-ready',init);
window.addEventListener('mws:cloud-runtime-v130-ready',init);
window.addEventListener('mws:parts-loaded',event=>{
  const parts=Array.isArray(event?.detail?.parts)?event.detail.parts:[];
  if(parts.includes('wardogs'))void renderGallery();
});
window.addEventListener('mawang:datachange',event=>{
  if(!String(event?.detail?.reason||'').startsWith('WARDOGS'))return;
  if(detailCardId){
    const card=cardById(detailCardId);
    const link=card?dataApi()?.resolveContactLink?.(card):null;
    if(!card||card.active===false||!link?.linked)closeDetail();
  }
  void renderGallery();
});
window.addEventListener('mws:wardogs-media-ready',()=>void renderGallery());
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&detailModal&&!detailModal.hidden){event.preventDefault();closeDetail()}
});
window.addEventListener('beforeunload',()=>{revokeGalleryUrls();revokeDetailImageUrl()},{once:true});
})();