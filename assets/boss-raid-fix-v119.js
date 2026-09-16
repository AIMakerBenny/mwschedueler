/* Mawang Scheduler v1.1.9 - Boss Raid HP apply reliability fix */
(()=>{
'use strict';
if(window.__mwsBossRaidFixV119)return;
window.__mwsBossRaidFixV119=1;

const $=id=>document.getElementById(id);
const DEFAULT_HP=500;
let applying=false;

function hostStore(){try{return parent&&parent!==window?parent.MWSBossRaidStore:null}catch(_){return null}}
function clampHp(value){return Math.max(1,Math.min(1000000,Math.floor(Number(value)||DEFAULT_HP)))}

async function applyHp(){
  if(applying)return;
  const input=$('bossHpInputV116');if(!input)return;
  const hp=clampHp(input.value);input.value=String(hp);applying=true;
  try{
    const store=hostStore();
    if(store?.get&&store?.updateBoss){
      const state=await store.get();
      const selected=String($('bossSelectV116')?.value||state?.activeBossId||'');
      if(selected)await store.updateBoss(selected,{maxHealth:hp},'레이드 보스 체력 수정');
    }
    try{
      if(typeof applyBossSettings==='function')applyBossSettings(hp);
      else if(typeof bossState!=='undefined'){
        bossState.maxHealth=hp;
        bossState.health=hp;
        bossState.running=false;
        bossState.finished=false;
        bossState.lastAttacker='';
        bossState.damage={};
        if(typeof renderBossState==='function')renderBossState();
      }
    }catch(error){console.error('Boss local HP apply failed',error)}
    input.value=String(hp);
    const btn=$('bossHpApplyV116');if(btn){btn.disabled=false;btn.textContent='체력 적용'}
  }catch(error){console.error('Boss HP apply failed',error);alert(`체력 적용 실패: ${error?.message||error}`)}
  finally{applying=false}
}

function normalizeDefaultInput(){
  const input=$('bossHpInputV116');
  if(input&&!input.matches(':focus')&&(input.value===''||Number(input.value)===100)){
    const select=$('bossSelectV116');
    if(!select||String(select.value||'')==='boss-default')input.value=String(DEFAULT_HP);
  }
  const btn=$('bossHpApplyV116');if(btn)btn.disabled=false;
}

function install(){
  const btn=$('bossHpApplyV116');
  if(btn&&!btn.dataset.v119Bound){
    btn.dataset.v119Bound='1';
    btn.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();applyHp();
    },true);
  }
  const input=$('bossHpInputV116');
  if(input&&!input.dataset.v119Bound){
    input.dataset.v119Bound='1';
    input.addEventListener('keydown',event=>{
      if(event.key!=='Enter')return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();applyHp();
    },true);
  }
  normalizeDefaultInput();
}

function boot(){
  install();
  const root=document.body||document.documentElement;
  if(root)new MutationObserver(()=>requestAnimationFrame(install)).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','value','class']});
  setInterval(install,700);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
