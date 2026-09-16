/* Mawang Scheduler v1.1.6 - Majoku Boss Raid multi-boss catalog */
(()=>{
'use strict';
if(window.__mwsBossRaidV116)return;
window.__mwsBossRaidV116=1;

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fallbackImage=$('bossImage')?.getAttribute('src')||'';
let catalog={version:1,activeBossId:'boss-default',bosses:[{id:'boss-default',name:'마왕 보스',image:'',maxHealth:100,discovered:false,defeated:false}]};
let activeBossId='boss-default';
let lastFinishedBossId='';
let applying=false;
let lastCatalogSignature='';

function hostStore(){try{return parent&&parent!==window?parent.MWSBossRaidStore:null}catch(_){return null}}
function normalizeBoss(raw,index=0){return{id:String(raw?.id||`boss-${index}`),name:String(raw?.name||`보스 ${index+1}`),image:String(raw?.image||''),maxHealth:Math.max(1,Math.min(1000000,Math.floor(Number(raw?.maxHealth)||100))),discovered:Boolean(raw?.discovered),defeated:Boolean(raw?.defeated)}}
function normalizeCatalog(raw){let bosses=(Array.isArray(raw?.bosses)?raw.bosses:[]).map(normalizeBoss);if(!bosses.length)bosses=[normalizeBoss({id:'boss-default',name:'마왕 보스',maxHealth:100})];let active=String(raw?.activeBossId||'');if(!bosses.some(b=>b.id===active))active=bosses[0].id;return{version:1,activeBossId:active,bosses}}
function currentBoss(){return catalog.bosses.find(b=>b.id===activeBossId)||catalog.bosses[0]||null}
function storeSignature(value=catalog){try{return JSON.stringify(value)}catch(_){return''}}

async function loadCatalog(force=false){
  const store=hostStore();
  if(store?.get){
    try{
      const next=normalizeCatalog(await store.get());
      const sig=storeSignature(next);
      if(force||sig!==lastCatalogSignature){catalog=next;activeBossId=next.activeBossId;lastCatalogSignature=sig;renderBossSelect();renderCodex();applyCurrentBoss(false)}
      return catalog;
    }catch(error){console.warn('Boss catalog load failed',error)}
  }
  try{
    const local=JSON.parse(localStorage.getItem('mwsBossRaidCatalogV116')||'null');
    if(local){catalog=normalizeCatalog(local);activeBossId=catalog.activeBossId;lastCatalogSignature=storeSignature(catalog)}
  }catch(_){}
  renderBossSelect();renderCodex();applyCurrentBoss(false);return catalog;
}
async function persistLocal(){try{localStorage.setItem('mwsBossRaidCatalogV116',JSON.stringify(catalog))}catch(_){}}
async function setActiveBoss(id){
  if(!catalog.bosses.some(b=>b.id===id))return;
  activeBossId=id;catalog.activeBossId=id;lastFinishedBossId='';
  const store=hostStore();
  if(store?.setActive){try{catalog=normalizeCatalog(await store.setActive(id));activeBossId=catalog.activeBossId;lastCatalogSignature=storeSignature(catalog)}catch(error){console.warn('Boss selection save failed',error)}}else await persistLocal();
  renderBossSelect();applyCurrentBoss(bossGameActive());renderCodex();
}
async function markBoss(flags={}){
  const boss=currentBoss();if(!boss)return;
  const patch={};if(flags.discovered&&!boss.discovered)patch.discovered=true;if(flags.defeated&&!boss.defeated){patch.discovered=true;patch.defeated=true}if(!Object.keys(patch).length)return;
  Object.assign(boss,patch);
  const store=hostStore();
  if(store?.mark){try{catalog=normalizeCatalog(await store.mark(boss.id,patch));activeBossId=catalog.activeBossId;lastCatalogSignature=storeSignature(catalog)}catch(error){console.warn('Boss collection mark failed',error)}}else await persistLocal();
  renderCodex();
}
async function saveBossHp(value){
  const boss=currentBoss();if(!boss)return;
  const hp=Math.max(1,Math.min(1000000,Math.floor(Number(value)||boss.maxHealth||100)));
  boss.maxHealth=hp;
  const store=hostStore();
  if(store?.updateBoss){try{catalog=normalizeCatalog(await store.updateBoss(boss.id,{maxHealth:hp},'레이드 보스 체력 수정'));activeBossId=catalog.activeBossId;lastCatalogSignature=storeSignature(catalog)}catch(error){console.warn('Boss HP save failed',error)}}else await persistLocal();
  try{if(typeof applyBossSettings==='function')applyBossSettings(hp);else{bossState.maxHealth=hp;bossState.health=hp;renderBossState()}}catch(error){console.warn('Boss HP apply failed',error)}
  renderBossSelect();renderCodex();
}
function bossGameActive(){return $('bossGame')?.classList.contains('active')===true}

function installStyle(){
  if($('mwsBossRaidStyleV116'))return;
  const style=document.createElement('style');style.id='mwsBossRaidStyleV116';style.textContent=`
.mws-boss-config-v116{display:grid;grid-template-columns:minmax(190px,1.25fr) minmax(120px,.65fr) auto;gap:8px;align-items:end;margin-top:11px;max-width:660px}.mws-boss-config-v116 label{display:flex;flex-direction:column;gap:5px;font-size:10px;color:var(--muted)}.mws-boss-config-v116 select,.mws-boss-config-v116 input{width:100%;height:38px;padding:8px 10px;border:1px solid var(--border);border-radius:9px;background:var(--input);color:var(--text)}.mws-boss-config-v116 .btn{height:38px}.mws-boss-stage-name-v116{position:absolute;top:38px;left:50%;transform:translateX(-50%);z-index:4;max-width:80%;font-size:18px;font-weight:950;text-align:center;color:var(--text);text-shadow:0 4px 18px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mwsBossCodexModalV116{position:fixed;inset:0;z-index:5000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(1,3,10,.78);backdrop-filter:blur(7px)}#mwsBossCodexModalV116.open{display:flex}.mws-boss-codex-box-v116{width:min(1120px,96vw);max-height:90vh;overflow:auto;border:1px solid #4d3e78;border-radius:22px;background:linear-gradient(180deg,#101426,#080b14);padding:22px;box-shadow:0 30px 90px rgba(0,0,0,.6)}.mws-boss-codex-head-v116{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.mws-boss-codex-head-v116 h2{margin:0;font-size:24px}.mws-boss-codex-count-v116{margin-top:6px;color:var(--muted);font-size:12px}.mws-boss-codex-grid-v116{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px}.mws-boss-codex-card-v116{min-height:250px;border:1px solid var(--border);border-radius:15px;background:var(--input);padding:12px;display:flex;flex-direction:column}.mws-boss-codex-card-v116.known{border-color:#514687;background:linear-gradient(180deg,rgba(77,60,121,.2),var(--input))}.mws-boss-codex-art-v116{height:170px;border-radius:11px;background:#070a12;display:grid;place-items:center;overflow:hidden;border:1px solid color-mix(in srgb,var(--border) 80%,#000)}.mws-boss-codex-art-v116 img{width:100%;height:100%;object-fit:contain}.mws-boss-codex-question-v116{font-size:86px;line-height:1;font-weight:950;color:#59627c;text-shadow:0 0 25px rgba(139,92,246,.18)}.mws-boss-codex-name-v116{margin-top:10px;font-size:15px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mws-boss-codex-meta-v116{margin-top:5px;font-size:10px;color:var(--muted)}.mws-boss-codex-badge-v116{display:inline-flex;align-self:flex-start;margin-top:8px;padding:4px 7px;border-radius:999px;border:1px solid #2d8a69;color:#8ee6c2;background:rgba(54,179,126,.08);font-size:9px;font-weight:900}.mws-boss-codex-badge-v116.defeated{border-color:#a67735;color:#ffd79f;background:rgba(241,184,90,.08)}
@media(max-width:1000px){.mws-boss-codex-grid-v116{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:720px){.mws-boss-config-v116{grid-template-columns:1fr}.mws-boss-codex-grid-v116{grid-template-columns:repeat(2,minmax(0,1fr))}.mws-boss-codex-art-v116{height:140px}}@media(max-width:440px){.mws-boss-codex-grid-v116{grid-template-columns:1fr}}
`;document.head.appendChild(style);
}

function ensureUi(){
  installStyle();
  const actions=$('bossResetBtn')?.closest('.boss-actions');
  if(actions&&!$('bossCodexBtnV116')){const btn=document.createElement('button');btn.id='bossCodexBtnV116';btn.className='btn';btn.type='button';btn.textContent='도감';btn.addEventListener('click',openCodex);actions.prepend(btn)}
  const control=$('bossStatusText')?.parentElement;
  if(control&&!$('bossConfigV116')){const box=document.createElement('div');box.id='bossConfigV116';box.className='mws-boss-config-v116';box.innerHTML=`<label>보스 선택<select id="bossSelectV116"></select></label><label>보스 체력<input id="bossHpInputV116" type="number" min="1" max="1000000" step="1"></label><button id="bossHpApplyV116" class="btn" type="button">체력 적용</button>`;control.appendChild(box);$('bossSelectV116').addEventListener('change',e=>setActiveBoss(e.target.value));$('bossHpApplyV116').addEventListener('click',()=>saveBossHp($('bossHpInputV116').value));$('bossHpInputV116').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();saveBossHp(e.target.value)}})}
  const stage=$('bossStage');if(stage&&!$('bossStageNameV116')){const name=document.createElement('div');name.id='bossStageNameV116';name.className='mws-boss-stage-name-v116';stage.appendChild(name)}
  ensureCodex();renderBossSelect();
}
function ensureCodex(){
  let modal=$('mwsBossCodexModalV116');if(modal)return modal;
  modal=document.createElement('div');modal.id='mwsBossCodexModalV116';modal.setAttribute('aria-hidden','true');modal.innerHTML=`<div class="mws-boss-codex-box-v116"><div class="mws-boss-codex-head-v116"><div><h2>레이드 보스 도감</h2><div id="mwsBossCodexCountV116" class="mws-boss-codex-count-v116"></div></div><button id="mwsBossCodexCloseV116" class="btn" type="button">닫기</button></div><div id="mwsBossCodexGridV116" class="mws-boss-codex-grid-v116"></div></div>`;document.body.appendChild(modal);$('mwsBossCodexCloseV116').onclick=closeCodex;modal.addEventListener('click',e=>{if(e.target===modal)closeCodex()});return modal;
}
function openCodex(){renderCodex();const modal=ensureCodex();modal.classList.add('open');modal.setAttribute('aria-hidden','false')}
function closeCodex(){const modal=$('mwsBossCodexModalV116');if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
function renderCodex(){
  const grid=$('mwsBossCodexGridV116');if(!grid)return;const known=catalog.bosses.filter(b=>b.discovered||b.defeated).length;const count=$('mwsBossCodexCountV116');if(count)count.textContent=`수집 ${known} / ${catalog.bosses.length}`;
  grid.innerHTML=catalog.bosses.map((boss,index)=>{const knownBoss=boss.discovered||boss.defeated;const image=boss.image||((boss.id==='boss-default'||index===0)?fallbackImage:'');return knownBoss?`<div class="mws-boss-codex-card-v116 known"><div class="mws-boss-codex-art-v116">${image?`<img src="${esc(image)}" alt="${esc(boss.name)}">`:'<div class="mws-boss-codex-question-v116">?</div>'}</div><div class="mws-boss-codex-name-v116">${esc(boss.name)}</div><div class="mws-boss-codex-meta-v116">HP ${boss.maxHealth.toLocaleString()}</div><span class="mws-boss-codex-badge-v116${boss.defeated?' defeated':''}">${boss.defeated?'격파 완료':'발견됨'}</span></div>`:`<div class="mws-boss-codex-card-v116"><div class="mws-boss-codex-art-v116"><div class="mws-boss-codex-question-v116">?</div></div><div class="mws-boss-codex-name-v116">???</div><div class="mws-boss-codex-meta-v116">아직 발견하지 못한 보스</div></div>`}).join('');
}
function renderBossSelect(){
  const select=$('bossSelectV116'),input=$('bossHpInputV116');const boss=currentBoss();if(select){select.innerHTML=catalog.bosses.map(b=>`<option value="${esc(b.id)}"${b.id===activeBossId?' selected':''}>${esc(b.name)}</option>`).join('');select.disabled=safeRunning()}if(input&&boss&&!input.matches(':focus')){input.value=String(boss.maxHealth);input.disabled=safeRunning()}const apply=$('bossHpApplyV116');if(apply)apply.disabled=safeRunning();const name=$('bossStageNameV116');if(name&&boss)name.textContent=boss.name;
}
function safeRunning(){try{return Boolean(bossState?.running)}catch(_){return false}}
function applyCurrentBoss(discover=false){
  if(applying)return;const boss=currentBoss();if(!boss)return;applying=true;
  try{
    const image=boss.image||((boss.id==='boss-default'||catalog.bosses.indexOf(boss)===0)?fallbackImage:'');
    if($('bossImage')){$('bossImage').src=image||fallbackImage;$('bossImage').alt=boss.name}
    const label=$('bossStageNameV116');if(label)label.textContent=boss.name;
    if(!safeRunning()){
      try{bossState.maxHealth=boss.maxHealth;bossState.health=boss.maxHealth;bossState.finished=false;bossState.lastAttacker='';bossState.damage={};renderBossState()}catch(error){console.warn('Boss state apply failed',error)}
    }
    renderBossSelect();if(discover)markBoss({discovered:true});
  }finally{applying=false}
}

function syncRunningState(){
  ensureUi();const boss=currentBoss();if(!boss)return;
  const running=safeRunning();renderBossSelect();
  if(bossGameActive()&&!boss.discovered)markBoss({discovered:true});
  try{
    if(bossState.finished&&bossState.health<=0&&lastFinishedBossId!==boss.id){lastFinishedBossId=boss.id;markBoss({defeated:true})}
    if(!bossState.finished&&lastFinishedBossId===boss.id)lastFinishedBossId='';
  }catch(_){}
  syncControllerHook();
}
function syncControllerHook(){
  try{
    if(typeof bossControllerWindow==='undefined'||!bossControllerWindow||bossControllerWindow.closed)return;
    const doc=bossControllerWindow.document;if(!doc)return;const detail=doc.querySelector('.detail');if(detail&&detail.textContent.includes('보스 이미지는'))detail.textContent='현재 선택한 보스의 체력을 수정합니다. 적용하면 레이드 진행 상태와 딜량이 초기화됩니다.';
    const apply=doc.getElementById('bossControllerApply');if(apply&&!apply.dataset.v116){apply.dataset.v116='1';apply.addEventListener('click',()=>setTimeout(()=>{try{saveBossHp(bossState.maxHealth)}catch(_){}},0))}
  }catch(_){}
}
function bindRaidButtons(){
  const start=$('bossStartBtn');if(start&&!start.dataset.v116){start.dataset.v116='1';start.addEventListener('click',()=>{const boss=currentBoss();if(!boss)return;try{bossState.maxHealth=boss.maxHealth;bossState.health=boss.maxHealth}catch(_){}markBoss({discovered:true})},true)}
  const reset=$('bossResetBtn');if(reset&&!reset.dataset.v116){reset.dataset.v116='1';reset.addEventListener('click',()=>setTimeout(()=>applyCurrentBoss(false),0))}
}
function bindSectionObserver(){const boss=$('bossGame');if(!boss||boss.dataset.v116Observed)return;boss.dataset.v116Observed='1';new MutationObserver(()=>{if(bossGameActive()){applyCurrentBoss(true);renderCodex()}}).observe(boss,{attributes:true,attributeFilter:['class']})}
function bindParentEvents(){try{parent.addEventListener('mawang:boss-catalog-change',()=>loadCatalog(true))}catch(_){}window.addEventListener('storage',event=>{if(event.key==='mwsBossRaidCatalogV116')loadCatalog(true)})}

async function boot(){
  installStyle();ensureUi();bindRaidButtons();bindSectionObserver();bindParentEvents();await loadCatalog(true);if(bossGameActive())applyCurrentBoss(true);setInterval(syncRunningState,500);setInterval(()=>loadCatalog(false),2500)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
