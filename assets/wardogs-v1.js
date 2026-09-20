/* WARDOGS Phase 117 - tactical shell class tabs */
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
  const current=CLASSES.find(item=>item.id===next)||CLASSES[0];
  const title=root.querySelector('#wardogsClassStageTitle');
  const code=root.querySelector('#wardogsClassStageCode');
  const empty=root.querySelector('#wardogsClassEmptyText');
  if(title)title.textContent=current.name;
  if(code)code.textContent=`CLASS // ${current.code}`;
  if(empty)empty.textContent=`${current.label} 클래스에 등록된 WARDOGS 카드가 없습니다.`;
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
  init
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

window.addEventListener('mws:app-ready',init);
window.addEventListener('mws:cloud-runtime-v130-ready',init);
})();
