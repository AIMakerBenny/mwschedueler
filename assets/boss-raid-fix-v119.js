/* Mawang Scheduler v1.2.0 - Boss Raid configurable HP reliability fix */
(()=>{
'use strict';
if(window.__mwsBossRaidFixV122)return;
window.__mwsBossRaidFixV122=1;

const $=id=>document.getElementById(id);
const DEFAULT_HP=500;
let applying=false;
let suppressClickUntil=0;

function hostStore(){try{return parent&&parent!==window?parent.MWSBossRaidStore:null}catch(_){return null}}
function clampHp(value){const n=Math.floor(Number(value));return Number.isFinite(n)&&n>=1?Math.min(1000000,n):DEFAULT_HP}
function applyLocalHp(hp){
  try{
    if(typeof window.mwsBossRaidSetMaxHealth==='function')return window.mwsBossRaidSetMaxHealth(hp);
    if(typeof applyBossSettings==='function'){applyBossSettings(hp);return hp}
  }catch(error){console.error('Boss local HP apply failed',error)}
  return hp;
}

async function selectedBossHp(){
  const store=hostStore();
  if(!store?.get)return null;
  try{
    const state=await store.get();
    const selected=String($('bossSelectV116')?.value||state?.activeBossId||'');
    const boss=state?.bosses?.find?.(item=>String(item?.id||'')===selected);
    return boss?clampHp(boss.maxHealth):null;
  }catch(_){return null}
}

async function syncSelectedBossHp(){
  const hp=await selectedBossHp();if(!hp)return;
  const input=$('bossHpInputV116');
  if(input&&!input.matches(':focus'))input.value=String(hp);
  applyLocalHp(hp);
}

async function applyHp(rawValue){
  if(applying)return;
  const input=$('bossHpInputV116');if(!input)return;
  const hp=clampHp(rawValue??input.value);input.value=String(hp);applying=true;
  try{
    const store=hostStore();
    if(store?.get&&store?.updateBoss){
      const state=await store.get();
      const selected=String($('bossSelectV116')?.value||state?.activeBossId||'');
      if(selected)await store.updateBoss(selected,{maxHealth:hp},'레이드 보스 체력 수정');
    }
    applyLocalHp(hp);
    input.value=String(hp);
    input.dataset.manualBossHp=String(hp);
    const btn=$('bossHpApplyV116');if(btn){btn.disabled=false;btn.textContent='체력 적용'}
  }catch(error){console.error('Boss HP apply failed',error);alert(`체력 적용 실패: ${error?.message||error}`)}
  finally{applying=false}
}

function install(){
  const input=$('bossHpInputV116'),btn=$('bossHpApplyV116'),select=$('bossSelectV116');
  if(input&&!input.matches(':focus')&&input.value==='')input.value=String(DEFAULT_HP);

  if(btn&&!btn.dataset.v122Bound){
    btn.dataset.v122Bound='1';btn.disabled=false;
    btn.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      const raw=input?.value;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      suppressClickUntil=Date.now()+500;
      applyHp(raw);
    },true);
    btn.addEventListener('click',event=>{
      if(Date.now()>suppressClickUntil)return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    },true);
  }

  if(input&&!input.dataset.v122Bound){
    input.dataset.v122Bound='1';
    input.addEventListener('keydown',event=>{
      if(event.key!=='Enter')return;
      const raw=input.value;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      applyHp(raw);
    },true);
  }

  if(select&&!select.dataset.v122Bound){
    select.dataset.v122Bound='1';
    select.addEventListener('change',()=>setTimeout(syncSelectedBossHp,80));
  }
  return Boolean(input&&btn&&select);
}

function boot(){
  let tries=0;
  const retry=()=>{
    tries++;
    if(install()){
      setTimeout(syncSelectedBossHp,100);
      return;
    }
    if(tries<30)setTimeout(retry,200);
  };
  retry();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
