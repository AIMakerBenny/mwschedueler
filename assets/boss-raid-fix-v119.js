/* Mawang Scheduler v1.2.0 - Boss Raid HP apply reliability fix */
(()=>{
'use strict';
if(window.__mwsBossRaidFixV120)return;
window.__mwsBossRaidFixV120=1;

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
        bossState.maxHealth=hp;bossState.health=hp;bossState.running=false;bossState.finished=false;bossState.lastAttacker='';bossState.damage={};
        if(typeof renderBossState==='function')renderBossState();
      }
    }catch(error){console.error('Boss local HP apply failed',error)}
    input.value=String(hp);
    const btn=$('bossHpApplyV116');if(btn){btn.disabled=false;btn.textContent='체력 적용'}
  }catch(error){console.error('Boss HP apply failed',error);alert(`체력 적용 실패: ${error?.message||error}`)}
  finally{applying=false}
}

function install(){
  const input=$('bossHpInputV116'),btn=$('bossHpApplyV116');
  if(input&&!input.matches(':focus')&&(input.value===''||Number(input.value)===100))input.value=String(DEFAULT_HP);
  if(btn&&!btn.dataset.v120Bound){
    btn.dataset.v120Bound='1';btn.disabled=false;
    btn.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();applyHp()},true);
  }
  if(input&&!input.dataset.v120Bound){
    input.dataset.v120Bound='1';
    input.addEventListener('keydown',event=>{if(event.key!=='Enter')return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();applyHp()},true);
  }
  return Boolean(input&&btn);
}

function boot(){
  let tries=0;
  const retry=()=>{tries++;if(install()||tries>=30)return;setTimeout(retry,200)};
  retry();
  const boss=$('bossGame');
  if(boss)new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n instanceof Element)))install()}).observe(boss,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
