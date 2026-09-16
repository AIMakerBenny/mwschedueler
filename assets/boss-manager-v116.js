/* Mawang Scheduler v1.2.0 - Raid Boss catalog manager */
(()=>{
'use strict';
if(window.__mwsBossManagerV120)return;
window.__mwsBossManagerV120=1;

const $=id=>document.getElementById(id);
const clone=value=>{try{return structuredClone(value)}catch(_){return JSON.parse(JSON.stringify(value))}};
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const now=()=>new Date().toISOString();
const makeId=()=>`boss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
const DEFAULT_HP=500;
const MAX_FILE_BYTES=4*1024*1024;
const DEFAULT_BOSS={id:'boss-default',name:'마왕 보스',image:'',maxHealth:DEFAULT_HP,discovered:false,defeated:false,createdAt:'',updatedAt:''};
let editorId='';
let pendingImage='';
let readyPromise=null;
let miniReady=false;
let lastRenderSignature='';

function cleanFileName(name=''){
  return String(name).replace(/\.[^.]+$/,'').replace(/^\s*\d+\s*[.\-_)\]]*\s*/,'').trim()||'새 보스';
}
function readAsDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(reader.error||new Error('이미지를 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}
function normalizeBoss(raw,index=0){
  const id=String(raw?.id||'').trim()||makeId();
  let hp=Math.floor(Number(raw?.maxHealth));
  if(!Number.isFinite(hp)||hp<1)hp=DEFAULT_HP;
  if(id==='boss-default'&&hp===100)hp=DEFAULT_HP;
  return {
    id,
    name:String(raw?.name||'').trim()||`보스 ${index+1}`,
    image:String(raw?.image||'').trim(),
    maxHealth:Math.max(1,Math.min(1000000,hp)),
    discovered:Boolean(raw?.discovered),
    defeated:Boolean(raw?.defeated),
    createdAt:String(raw?.createdAt||''),
    updatedAt:String(raw?.updatedAt||'')
  };
}
function defaultState(){return{version:1,activeBossId:DEFAULT_BOSS.id,bosses:[clone(DEFAULT_BOSS)]}}
function normalizeState(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  let bosses=(Array.isArray(src.bosses)?src.bosses:[]).map(normalizeBoss);
  if(!bosses.length)bosses=[clone(DEFAULT_BOSS)];
  const seen=new Set();
  bosses=bosses.filter(b=>!seen.has(b.id)&&seen.add(b.id));
  let activeBossId=String(src.activeBossId||'');
  if(!bosses.some(b=>b.id===activeBossId))activeBossId=bosses[0].id;
  return{version:1,activeBossId,bosses};
}
async function ensureMiniGames(){
  try{
    if(typeof data!=='undefined'&&data?.miniGames&&miniReady)return data.miniGames;
  }catch(_){}
  if(readyPromise)return readyPromise;
  readyPromise=(async()=>{
    try{if(typeof window.mwsV55EnsureParts==='function')await window.mwsV55EnsureParts('gameLadder')}catch(error){console.warn('Boss catalog miniGames load failed',error)}
    try{
      if(typeof data==='undefined'||!data||typeof data!=='object')return null;
      if(!data.miniGames||typeof data.miniGames!=='object')data.miniGames={};
      miniReady=true;
      return data.miniGames;
    }catch(_){return null}
  })().finally(()=>{readyPromise=null});
  return readyPromise;
}
async function readState(){
  const mini=await ensureMiniGames();
  if(!mini)return defaultState();
  return normalizeState(mini.majokuBossRaid);
}
async function writeState(next,reason='레이드 보스 수정'){
  const mini=await ensureMiniGames();
  const normalized=normalizeState(next);
  if(mini)mini.majokuBossRaid=clone(normalized);
  try{if(typeof saveData==='function')saveData(reason);else if(typeof window.saveData==='function')window.saveData(reason)}catch(error){console.error('Boss catalog save failed',error)}
  lastRenderSignature='';
  window.dispatchEvent(new CustomEvent('mawang:boss-catalog-change',{detail:clone(normalized)}));
  await renderManager();
  return clone(normalized);
}
async function updateBoss(id,patch,reason='레이드 보스 수정'){
  const state=await readState();
  const index=state.bosses.findIndex(b=>b.id===id);
  if(index<0)return state;
  state.bosses[index]=normalizeBoss({...state.bosses[index],...patch,updatedAt:now()},index);
  return writeState(state,reason);
}

window.MWSBossRaidStore={
  async get(){return clone(await readState())},
  async replace(next,reason){return writeState(next,reason||'레이드 보스 데이터 교체')},
  async updateBoss(id,patch,reason){return updateBoss(id,patch,reason)},
  async setActive(id){const state=await readState();if(state.bosses.some(b=>b.id===id)){state.activeBossId=id;return writeState(state,'레이드 보스 선택')}return state},
  async mark(id,flags={}){
    const state=await readState();const index=state.bosses.findIndex(b=>b.id===id);if(index<0)return state;
    const current=state.bosses[index],patch={};
    if(flags.discovered&&!current.discovered)patch.discovered=true;
    if(flags.defeated&&!current.defeated){patch.discovered=true;patch.defeated=true}
    if(!Object.keys(patch).length)return state;
    state.bosses[index]=normalizeBoss({...current,...patch,updatedAt:now()},index);
    return writeState(state,flags.defeated?'레이드 보스 격파 기록':'레이드 보스 발견 기록');
  }
};

function installStyle(){
  if($('mwsBossManagerStyleV120'))return;
  const style=document.createElement('style');style.id='mwsBossManagerStyleV120';style.textContent=`
#mwsBossManagerV116{margin-top:14px;padding:18px}
.mws-boss-manager-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}.mws-boss-manager-head h3{margin:0 0 5px;font-size:17px}.mws-boss-manager-buttons{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.mws-boss-manager-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:15px}.mws-boss-manager-row{border:1px solid var(--border);border-radius:13px;background:var(--input);padding:10px;display:grid;grid-template-columns:86px minmax(0,1fr);gap:11px;align-items:center}.mws-boss-manager-thumb{width:86px;height:70px;border-radius:9px;object-fit:contain;background:#080b12;border:1px solid var(--border)}.mws-boss-manager-thumb.empty{display:grid;place-items:center;color:var(--muted);font-size:11px;text-align:center}.mws-boss-manager-name{font-size:14px;font-weight:900;line-height:1.35}.mws-boss-manager-meta{font-size:10px;color:var(--muted);margin-top:5px}.mws-boss-manager-actions{display:flex;gap:6px;margin-top:9px;flex-wrap:wrap}.mws-boss-manager-actions button{font-size:10px;padding:6px 8px}.mws-boss-state{display:inline-flex;margin-top:6px;padding:3px 6px;border-radius:999px;border:1px solid var(--border);font-size:9px;color:var(--muted)}.mws-boss-state.discovered{color:#8fe9c5;border-color:#2c8e6d}.mws-boss-state.defeated{color:#ffd59b;border-color:#9b6d2f}.mws-boss-bulk-status{font-size:10px;color:var(--muted);min-height:14px;margin-top:8px}
#mwsBossBulkInputV120{display:none}
#mwsBossEditorModalV116{position:fixed;inset:0;z-index:12000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.72);backdrop-filter:blur(5px)}#mwsBossEditorModalV116.open{display:flex}.mws-boss-editor-box{width:min(780px,96vw);max-height:92vh;overflow:auto;border:1px solid var(--border);border-radius:18px;background:var(--sidebar);padding:20px;box-shadow:0 28px 90px rgba(0,0,0,.5)}.mws-boss-editor-grid{display:grid;grid-template-columns:240px minmax(0,1fr);gap:18px;margin-top:16px}.mws-boss-editor-preview{height:240px;border:1px solid var(--border);border-radius:14px;background:#080b12;display:grid;place-items:center;overflow:hidden;color:var(--muted);text-align:center;position:relative;transition:.14s}.mws-boss-editor-preview img{width:100%;height:100%;object-fit:contain}.mws-boss-editor-preview:after{content:'이미지를 여기로 드래그해서 추가';position:absolute;left:12px;right:12px;bottom:12px;padding:8px 10px;border:1px dashed color-mix(in srgb,var(--accent) 65%,var(--border));border-radius:9px;background:rgba(6,8,17,.78);font-size:10px;font-weight:800;pointer-events:none}.mws-boss-editor-preview.drag-over{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 24%,transparent)}.mws-boss-form{display:flex;flex-direction:column;gap:12px}.mws-boss-form label{display:flex;flex-direction:column;gap:6px;font-size:11px;color:var(--muted)}.mws-boss-form input{width:100%}.mws-boss-editor-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.mws-boss-image-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}.mws-boss-image-file{display:inline-flex;align-items:center;justify-content:center;padding:9px 11px;border:1px solid var(--border);border-radius:10px;background:var(--panel);color:var(--text);font-size:11px;cursor:pointer;white-space:nowrap}.mws-boss-image-file input{display:none}
@media(max-width:1200px){.mws-boss-manager-list{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.mws-boss-manager-list{grid-template-columns:1fr}.mws-boss-editor-grid{grid-template-columns:1fr}.mws-boss-editor-preview{height:200px}}
`;document.head.appendChild(style);
}
function stateLabel(boss){return boss.defeated?['격파 완료','defeated']:boss.discovered?['발견됨','discovered']:['미발견','']}
async function renderManager(){
  const host=$('mwsBossManagerV116');if(!host)return;
  const state=await readState();const list=$('mwsBossManagerListV116');if(!list)return;
  const signature=JSON.stringify(state);
  if(signature===lastRenderSignature)return;
  lastRenderSignature=signature;
  list.innerHTML=state.bosses.map(boss=>{const [label,cls]=stateLabel(boss);return `<div class="mws-boss-manager-row" data-id="${esc(boss.id)}">${boss.image?`<img class="mws-boss-manager-thumb" src="${esc(boss.image)}" alt="">`:'<div class="mws-boss-manager-thumb empty">기본 이미지<br>또는 이미지 미설정</div>'}<div><div class="mws-boss-manager-name">${esc(boss.name)}</div><div class="mws-boss-manager-meta">HP ${boss.maxHealth.toLocaleString()}${state.activeBossId===boss.id?' · 현재 선택':''}</div><span class="mws-boss-state ${cls}">${label}</span><div class="mws-boss-manager-actions"><button type="button" class="secondary" data-action="edit">수정</button><button type="button" class="danger" data-action="delete">삭제</button></div></div></div>`}).join('');
  list.querySelectorAll('[data-id]').forEach(row=>{
    row.querySelector('[data-action="edit"]')?.addEventListener('click',()=>openEditor(row.dataset.id));
    row.querySelector('[data-action="delete"]')?.addEventListener('click',()=>deleteBoss(row.dataset.id));
  });
}
async function deleteBoss(id){
  const state=await readState();if(state.bosses.length<=1){alert('보스는 최소 1개가 필요합니다.');return}
  const boss=state.bosses.find(b=>b.id===id);if(!boss)return;if(!confirm(`${boss.name} 보스를 삭제할까요?`))return;
  state.bosses=state.bosses.filter(b=>b.id!==id);if(state.activeBossId===id)state.activeBossId=state.bosses[0].id;await writeState(state,'레이드 보스 삭제');
}
function renderEditorPreview(){const box=$('mwsBossEditorPreviewV116');if(!box)return;box.innerHTML=pendingImage?`<img src="${esc(pendingImage)}" alt="">`:'이미지 미리보기'}
async function acceptEditorFile(file){
  if(!file||!String(file.type||'').startsWith('image/'))return;
  if(file.size>MAX_FILE_BYTES){alert('이미지는 4MB 이하 파일을 사용해 주세요.');return}
  try{
    pendingImage=await readAsDataUrl(file);
    $('mwsBossImageUrlV116').value=pendingImage;
    const name=$('mwsBossNameV116');if(name&&!name.value.trim())name.value=cleanFileName(file.name);
    renderEditorPreview();
  }catch(error){console.error('Boss image read failed',error);alert('이미지를 읽지 못했습니다.')}
}
function ensureEditor(){
  let modal=$('mwsBossEditorModalV116');if(modal)return modal;
  modal=document.createElement('div');modal.id='mwsBossEditorModalV116';modal.innerHTML=`<div class="mws-boss-editor-box"><div class="space"><div><h2 id="mwsBossEditorTitleV116" style="margin:0">레이드 보스 추가</h2><div class="muted small" style="margin-top:5px">보스 이름, 체력, 이미지를 설정합니다.</div></div><button type="button" class="secondary" id="mwsBossEditorCloseV116">닫기</button></div><div class="mws-boss-editor-grid"><div id="mwsBossEditorPreviewV116" class="mws-boss-editor-preview">이미지 미리보기</div><div class="mws-boss-form"><label>보스 이름<input id="mwsBossNameV116" maxlength="60" placeholder="보스 이름"></label><label>최대 체력<input id="mwsBossHpV116" type="number" min="1" max="1000000" step="1" value="500"></label><label>이미지 URL<div class="mws-boss-image-row"><input id="mwsBossImageUrlV116" placeholder="https://... 또는 data:image/..."><label class="mws-boss-image-file">파일 선택<input id="mwsBossImageFileV116" type="file" accept="image/*"></label></div></label><div class="muted small">파일 선택 또는 왼쪽 이미지 영역으로 드래그해서 추가할 수 있습니다. 이미지 파일은 4MB 이하를 권장합니다.</div></div></div><div class="mws-boss-editor-actions"><button type="button" class="secondary" id="mwsBossEditorCancelV116">취소</button><button type="button" class="primary" id="mwsBossEditorSaveV116">저장</button></div></div>`;
  document.body.appendChild(modal);
  const close=()=>modal.classList.remove('open');$('mwsBossEditorCloseV116').onclick=close;$('mwsBossEditorCancelV116').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
  $('mwsBossImageUrlV116').addEventListener('input',()=>{pendingImage=$('mwsBossImageUrlV116').value.trim();renderEditorPreview()});
  $('mwsBossImageFileV116').addEventListener('change',e=>{const file=e.target.files?.[0];if(file)acceptEditorFile(file)});
  const preview=$('mwsBossEditorPreviewV116'),stop=e=>{e.preventDefault();e.stopPropagation()};
  preview.addEventListener('dragenter',e=>{stop(e);preview.classList.add('drag-over')});
  preview.addEventListener('dragover',e=>{stop(e);if(e.dataTransfer)e.dataTransfer.dropEffect='copy';preview.classList.add('drag-over')});
  preview.addEventListener('dragleave',e=>{stop(e);if(!preview.contains(e.relatedTarget))preview.classList.remove('drag-over')});
  preview.addEventListener('drop',e=>{stop(e);preview.classList.remove('drag-over');const file=[...(e.dataTransfer?.files||[])].find(f=>String(f.type||'').startsWith('image/'));if(file)acceptEditorFile(file)});
  $('mwsBossEditorSaveV116').onclick=saveEditor;
  return modal;
}
async function openEditor(id=''){
  const modal=ensureEditor(),state=await readState();editorId=id;const boss=id?state.bosses.find(b=>b.id===id):null;pendingImage=String(boss?.image||'');$('mwsBossEditorTitleV116').textContent=boss?'레이드 보스 수정':'레이드 보스 추가';$('mwsBossNameV116').value=boss?.name||'';$('mwsBossHpV116').value=String(boss?.maxHealth||DEFAULT_HP);$('mwsBossImageUrlV116').value=pendingImage;$('mwsBossImageFileV116').value='';renderEditorPreview();modal.classList.add('open');setTimeout(()=>$('mwsBossNameV116').focus(),0);
}
async function saveEditor(){
  const name=$('mwsBossNameV116').value.trim();const maxHealth=Math.max(1,Math.min(1000000,Math.floor(Number($('mwsBossHpV116').value)||DEFAULT_HP)));const image=$('mwsBossImageUrlV116').value.trim()||pendingImage;if(!name){alert('보스 이름을 입력해 주세요.');return}
  const state=await readState();
  if(editorId){const index=state.bosses.findIndex(b=>b.id===editorId);if(index>=0)state.bosses[index]=normalizeBoss({...state.bosses[index],name,maxHealth,image,updatedAt:now()},index)}
  else state.bosses.push(normalizeBoss({id:makeId(),name,maxHealth,image,discovered:false,defeated:false,createdAt:now(),updatedAt:now()},state.bosses.length));
  await writeState(state,editorId?'레이드 보스 수정':'레이드 보스 추가');modalClose();
}
function modalClose(){$('mwsBossEditorModalV116')?.classList.remove('open')}
async function bulkUpload(files){
  const images=[...files].filter(file=>file&&String(file.type||'').startsWith('image/'));if(!images.length)return;
  const btn=$('mwsBossBulkUploadV120'),status=$('mwsBossBulkStatusV120'),input=$('mwsBossBulkInputV120');
  if(btn){btn.disabled=true;btn.textContent='추가 중...'}
  let added=0,skipped=0;
  try{
    const state=await readState();
    const sorted=images.sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko',{numeric:true,sensitivity:'base'}));
    for(let i=0;i<sorted.length;i++){
      const file=sorted[i];if(status)status.textContent=`${i+1} / ${sorted.length} 처리 중 · ${file.name}`;
      if(file.size>MAX_FILE_BYTES){skipped++;continue}
      try{const image=await readAsDataUrl(file);state.bosses.push(normalizeBoss({id:makeId(),name:cleanFileName(file.name),image,maxHealth:DEFAULT_HP,createdAt:now(),updatedAt:now()},state.bosses.length));added++}catch(error){console.error('Boss bulk upload read failed',file.name,error);skipped++}
    }
    if(added)await writeState(state,`레이드 보스 묶음 업로드 ${added}개`);
    if(status)status.textContent=`완료 · ${added}개 추가${skipped?` · ${skipped}개 건너뜀`:''}`;
  }catch(error){console.error('Boss bulk upload failed',error);if(status)status.textContent='묶음 업로드 실패';alert(`묶음 업로드 실패: ${error?.message||error}`)}
  finally{if(btn){btn.disabled=false;btn.textContent='묶음 업로드'}if(input)input.value=''}
}
function ensureManager(){
  installStyle();
  const existing=$('mwsBossManagerV116');if(existing){const h=existing.querySelector('.mws-boss-manager-head h3');if(h)h.textContent='레이드 보스 관리';return true}
  const exportBtn=$('exportAllBtn'),section=exportBtn?.closest('.section');if(!section)return false;
  const card=document.createElement('div');card.id='mwsBossManagerV116';card.className='card';card.innerHTML=`<div class="mws-boss-manager-head"><div><h3>레이드 보스 관리</h3><div class="muted small">레이드에 등장할 보스를 추가, 수정, 삭제합니다. 이 데이터는 전체 백업 내보내기와 가져오기에 포함됩니다.</div></div><div class="mws-boss-manager-buttons"><button type="button" class="secondary" id="mwsBossBulkUploadV120">묶음 업로드</button><input id="mwsBossBulkInputV120" type="file" accept="image/*" multiple><button type="button" class="primary" id="mwsBossAddV116">보스 추가</button></div></div><div id="mwsBossBulkStatusV120" class="mws-boss-bulk-status"></div><div id="mwsBossManagerListV116" class="mws-boss-manager-list"></div>`;
  const photoCard=section.querySelector('.contact-photo-folder-card-v416');if(photoCard)section.insertBefore(card,photoCard);else section.appendChild(card);
  $('mwsBossAddV116').addEventListener('click',()=>openEditor(''));
  $('mwsBossBulkUploadV120').addEventListener('click',()=>$('mwsBossBulkInputV120').click());
  $('mwsBossBulkInputV120').addEventListener('change',e=>bulkUpload(e.target.files||[]));
  lastRenderSignature='';renderManager();return true;
}
function boot(){
  installStyle();
  let attempts=0;
  const tryInstall=()=>{attempts++;if(ensureManager()||attempts>=20)return;setTimeout(tryInstall,250)};
  tryInstall();
  window.addEventListener('mawang:boss-catalog-change',()=>{lastRenderSignature='';renderManager()});
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-tab="importExport"], [data-tab="backup"], #exportAllBtn'))setTimeout(()=>{ensureManager();lastRenderSignature='';renderManager()},0)},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
