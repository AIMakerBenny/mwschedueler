/* Mawang Scheduler v1.2.1 - compact Raid Boss manager with R2 image upload */
(()=>{
'use strict';
if(window.__mwsBossManagerV121)return;
window.__mwsBossManagerV121=1;

const $=id=>document.getElementById(id);
const clone=value=>{try{return structuredClone(value)}catch(_){return JSON.parse(JSON.stringify(value))}};
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const now=()=>new Date().toISOString();
const makeId=()=>`boss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
const DEFAULT_HP=500;
const MAX_FILE_BYTES=4*1024*1024;
const DEFAULT_BOSS={id:'boss-default',name:'마왕 보스',image:'',maxHealth:DEFAULT_HP,discovered:false,defeated:false,createdAt:'',updatedAt:''};
let readyPromise=null,miniReady=false,editorId='',pendingImage='',pendingFile=null,previewObjectUrl='',migrationPromise=null;

function cleanFileName(name=''){return String(name).replace(/\.[^.]+$/,'').replace(/^\s*\d+\s*[.\-_)\]]*\s*/,'').trim()||'새 보스'}
function normalizeBoss(raw,index=0){
  const id=String(raw?.id||'').trim()||makeId();let hp=Math.floor(Number(raw?.maxHealth));
  if(!Number.isFinite(hp)||hp<1)hp=DEFAULT_HP;if(id==='boss-default'&&hp===100)hp=DEFAULT_HP;
  return {id,name:String(raw?.name||'').trim()||`보스 ${index+1}`,image:String(raw?.image||'').trim(),maxHealth:Math.max(1,Math.min(1000000,hp)),discovered:Boolean(raw?.discovered),defeated:Boolean(raw?.defeated),createdAt:String(raw?.createdAt||''),updatedAt:String(raw?.updatedAt||'')};
}
function normalizeState(raw){
  const src=raw&&typeof raw==='object'?raw:{};let bosses=(Array.isArray(src.bosses)?src.bosses:[]).map(normalizeBoss);if(!bosses.length)bosses=[clone(DEFAULT_BOSS)];
  const seen=new Set();bosses=bosses.filter(b=>!seen.has(b.id)&&seen.add(b.id));let activeBossId=String(src.activeBossId||'');if(!bosses.some(b=>b.id===activeBossId))activeBossId=bosses[0].id;
  return {version:1,activeBossId,bosses};
}
async function ensureMiniGames(){
  try{if(typeof data!=='undefined'&&data?.miniGames&&miniReady)return data.miniGames}catch(_){}
  if(readyPromise)return readyPromise;
  readyPromise=(async()=>{
    try{if(typeof window.mwsV55EnsureParts==='function')await window.mwsV55EnsureParts('gameLadder')}catch(error){console.warn('Boss catalog miniGames load failed',error)}
    try{if(typeof data==='undefined'||!data||typeof data!=='object')return null;if(!data.miniGames||typeof data.miniGames!=='object')data.miniGames={};miniReady=true;return data.miniGames}catch(_){return null}
  })().finally(()=>{readyPromise=null});
  return readyPromise;
}
async function readState(){const mini=await ensureMiniGames();const state=normalizeState(mini?.majokuBossRaid);scheduleLegacyMigration(state);return state}
function lightweightSignature(state){return `${state.activeBossId}|${state.bosses.map(b=>`${b.id}:${b.name}:${b.maxHealth}:${b.discovered?1:0}:${b.defeated?1:0}:${b.image?1:0}`).join('|')}`}
async function writeState(next,reason='레이드 보스 수정',forceCloud=false){
  const mini=await ensureMiniGames(),state=normalizeState(next);if(mini)mini.majokuBossRaid=state;
  try{if(typeof saveData==='function')saveData(reason);else if(typeof window.saveData==='function')window.saveData(reason)}catch(error){console.error('Boss catalog save failed',error)}
  if(forceCloud&&typeof window.mwsV55SaveNow==='function')setTimeout(()=>window.mwsV55SaveNow().catch?.(()=>{}),30);
  window.dispatchEvent(new CustomEvent('mawang:boss-catalog-change',{detail:{version:1,activeBossId:state.activeBossId,bosses:state.bosses.map(b=>({...b}))}}));
  await renderSummary();renderManagerModalList();return state;
}
async function updateBoss(id,patch,reason='레이드 보스 수정'){const state=await readState(),i=state.bosses.findIndex(b=>b.id===id);if(i<0)return state;state.bosses[i]=normalizeBoss({...state.bosses[i],...patch,updatedAt:now()},i);return writeState(state,reason)}
window.MWSBossRaidStore={
  async get(){return clone(await readState())},
  async replace(next,reason){return writeState(next,reason||'레이드 보스 데이터 교체')},
  async updateBoss(id,patch,reason){return updateBoss(id,patch,reason)},
  async setActive(id){const state=await readState();if(state.bosses.some(b=>b.id===id)){state.activeBossId=id;return writeState(state,'레이드 보스 선택')}return state},
  async mark(id,flags={}){const state=await readState(),i=state.bosses.findIndex(b=>b.id===id);if(i<0)return state;const current=state.bosses[i],patch={};if(flags.discovered&&!current.discovered)patch.discovered=true;if(flags.defeated&&!current.defeated){patch.discovered=true;patch.defeated=true}if(!Object.keys(patch).length)return state;state.bosses[i]=normalizeBoss({...current,...patch,updatedAt:now()},i);return writeState(state,flags.defeated?'레이드 보스 격파 기록':'레이드 보스 발견 기록')}
};

async function uploadBossFile(file,bossId){
  if(!file||!String(file.type||'').startsWith('image/'))throw new Error('이미지 파일만 사용할 수 있습니다.');
  if(file.size>MAX_FILE_BYTES)throw new Error('이미지는 4MB 이하 파일을 사용해 주세요.');
  const form=new FormData();form.append('bossId',bossId);form.append('file',file,file.name||'boss.png');
  const res=await fetch('/api/boss-image',{method:'POST',credentials:'same-origin',body:form});let body=null;try{body=await res.json()}catch(_){}
  if(!res.ok||!body?.url)throw new Error(body?.error||`이미지 업로드 실패 HTTP ${res.status}`);return String(body.url);
}
function dataUrlToBlob(dataUrl){
  const m=/^data:([^;,]+);base64,(.+)$/s.exec(String(dataUrl||''));if(!m)return null;try{const bin=atob(m[2]),arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new Blob([arr],{type:m[1]||'image/png'})}catch(_){return null}
}
function idleYield(){return new Promise(resolve=>{if('requestIdleCallback'in window)requestIdleCallback(()=>resolve(),{timeout:250});else setTimeout(resolve,12)})}
function scheduleLegacyMigration(state){
  if(migrationPromise||document.body?.dataset?.mwsMode!=='admin')return;
  const legacy=state.bosses.filter(b=>/^data:image\//i.test(b.image));if(!legacy.length)return;
  migrationPromise=(async()=>{
    let changed=false;const mini=await ensureMiniGames();if(!mini)return;
    const current=normalizeState(mini.majokuBossRaid);
    for(const boss of current.bosses){
      if(!/^data:image\//i.test(boss.image))continue;await idleYield();const blob=dataUrlToBlob(boss.image);if(!blob)continue;
      try{const file=new File([blob],`${cleanFileName(boss.name)}.png`,{type:blob.type||'image/png'});boss.image=await uploadBossFile(file,boss.id);changed=true}catch(error){console.warn('Legacy boss image migration failed',boss.name,error);break}
    }
    if(changed)await writeState(current,'레이드 보스 이미지 최적화',true);
  })().finally(()=>{migrationPromise=null});
}

function installStyle(){
  if($('mwsBossManagerStyleV121'))return;const style=document.createElement('style');style.id='mwsBossManagerStyleV121';style.textContent=`
#mwsBossManagerV121{margin-top:14px;padding:18px}.mws-boss-summary-head{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.mws-boss-summary-actions{display:flex;gap:8px;flex-wrap:wrap}.mws-boss-summary-meta{display:flex;gap:8px;align-items:center;margin-top:10px;color:var(--muted);font-size:11px}.mws-boss-count-chip{display:inline-flex;padding:5px 9px;border:1px solid var(--border);border-radius:999px;background:var(--chip);color:var(--text);font-weight:800}
#mwsBossBulkInputV121{display:none}
#mwsBossManagerModalV121,#mwsBossEditorModalV121{position:fixed;inset:0;z-index:12000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.72);backdrop-filter:blur(5px)}#mwsBossManagerModalV121.open,#mwsBossEditorModalV121.open{display:flex}.mws-boss-modal-box{width:min(980px,96vw);max-height:90vh;overflow:auto;border:1px solid var(--border);border-radius:18px;background:var(--sidebar);padding:20px;box-shadow:0 28px 90px rgba(0,0,0,.55)}.mws-boss-list-v121{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:16px}.mws-boss-row-v121{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px;border:1px solid var(--border);border-radius:11px;background:var(--input)}.mws-boss-row-name{font-size:13px;font-weight:900}.mws-boss-row-meta{font-size:10px;color:var(--muted);margin-top:4px}.mws-boss-row-actions{display:flex;gap:6px}.mws-boss-row-actions button{font-size:10px;padding:6px 8px}.mws-boss-state{display:inline-flex;margin-left:6px;padding:2px 6px;border:1px solid var(--border);border-radius:999px;font-size:9px;color:var(--muted)}.mws-boss-state.discovered{color:#8fe9c5;border-color:#2c8e6d}.mws-boss-state.defeated{color:#ffd59b;border-color:#9b6d2f}
.mws-boss-editor-box{width:min(780px,96vw);max-height:92vh;overflow:auto;border:1px solid var(--border);border-radius:18px;background:var(--sidebar);padding:20px}.mws-boss-editor-grid{display:grid;grid-template-columns:240px minmax(0,1fr);gap:18px;margin-top:16px}.mws-boss-editor-preview{height:240px;border:1px solid var(--border);border-radius:14px;background:#080b12;display:grid;place-items:center;overflow:hidden;color:var(--muted);text-align:center;position:relative}.mws-boss-editor-preview img{width:100%;height:100%;object-fit:contain}.mws-boss-editor-preview:after{content:'이미지를 여기로 드래그해서 추가';position:absolute;left:12px;right:12px;bottom:12px;padding:8px;border:1px dashed var(--accent);border-radius:9px;background:rgba(6,8,17,.8);font-size:10px;font-weight:800;pointer-events:none}.mws-boss-editor-preview.drag-over{border-color:var(--accent)}.mws-boss-form{display:flex;flex-direction:column;gap:12px}.mws-boss-form label{display:flex;flex-direction:column;gap:6px;font-size:11px;color:var(--muted)}.mws-boss-form input{width:100%}.mws-boss-image-row{display:grid;grid-template-columns:1fr auto;gap:8px}.mws-boss-image-file{display:inline-flex;align-items:center;justify-content:center;padding:9px 11px;border:1px solid var(--border);border-radius:10px;background:var(--panel);color:var(--text);cursor:pointer;white-space:nowrap}.mws-boss-image-file input{display:none}.mws-boss-editor-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.mws-boss-status-v121{min-height:16px;margin-top:8px;color:var(--muted);font-size:10px}
@media(max-width:760px){.mws-boss-list-v121{grid-template-columns:1fr}.mws-boss-editor-grid{grid-template-columns:1fr}.mws-boss-editor-preview{height:200px}}
`;document.head.appendChild(style)
}
function stateLabel(boss){return boss.defeated?['격파 완료','defeated']:boss.discovered?['발견됨','discovered']:['미발견','']}
async function renderSummary(){const host=$('mwsBossManagerV121');if(!host)return;const state=await readState();const count=$('mwsBossCountV121');if(count)count.textContent=`${state.bosses.length}개`;const current=$('mwsBossCurrentV121'),boss=state.bosses.find(b=>b.id===state.activeBossId);if(current)current.textContent=boss?`현재 선택 · ${boss.name}`:'현재 선택 없음'}
async function renderManagerModalList(){const list=$('mwsBossListV121');if(!list)return;const state=await readState();const sig=lightweightSignature(state);if(list.dataset.sig===sig)return;list.dataset.sig=sig;list.innerHTML=state.bosses.map(b=>{const [label,cls]=stateLabel(b);return `<div class="mws-boss-row-v121" data-id="${esc(b.id)}"><div><div class="mws-boss-row-name">${esc(b.name)} <span class="mws-boss-state ${cls}">${label}</span></div><div class="mws-boss-row-meta">HP ${b.maxHealth.toLocaleString()}${state.activeBossId===b.id?' · 현재 선택':''}</div></div><div class="mws-boss-row-actions"><button type="button" class="secondary" data-action="edit">수정</button><button type="button" class="danger" data-action="delete">삭제</button></div></div>`}).join('');list.querySelectorAll('[data-id]').forEach(row=>{row.querySelector('[data-action="edit"]')?.addEventListener('click',()=>openEditor(row.dataset.id));row.querySelector('[data-action="delete"]')?.addEventListener('click',()=>deleteBoss(row.dataset.id))})}
function ensureManagerModal(){let modal=$('mwsBossManagerModalV121');if(modal)return modal;modal=document.createElement('div');modal.id='mwsBossManagerModalV121';modal.innerHTML=`<div class="mws-boss-modal-box"><div class="space"><div><h2 style="margin:0">레이드 보스 관리</h2><div class="muted small" style="margin-top:5px">이미지는 목록에 표시하지 않고, 수정 창에서만 불러옵니다.</div></div><button type="button" class="secondary" id="mwsBossManagerCloseV121">닫기</button></div><div id="mwsBossListV121" class="mws-boss-list-v121"></div></div>`;document.body.appendChild(modal);$('mwsBossManagerCloseV121').onclick=()=>modal.classList.remove('open');modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});return modal}
async function openManagerModal(){const modal=ensureManagerModal();await renderManagerModalList();modal.classList.add('open')}
function revokePreviewUrl(){if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=''}}
function renderEditorPreview(){const box=$('mwsBossEditorPreviewV121');if(!box)return;revokePreviewUrl();let src=pendingImage;if(pendingFile){previewObjectUrl=URL.createObjectURL(pendingFile);src=previewObjectUrl}box.innerHTML=src?`<img src="${esc(src)}" alt="">`:'이미지 미리보기'}
function acceptEditorFile(file){if(!file||!String(file.type||'').startsWith('image/'))return;if(file.size>MAX_FILE_BYTES){alert('이미지는 4MB 이하 파일을 사용해 주세요.');return}pendingFile=file;const name=$('mwsBossNameV121');if(name&&!name.value.trim())name.value=cleanFileName(file.name);renderEditorPreview()}
function ensureEditor(){let modal=$('mwsBossEditorModalV121');if(modal)return modal;modal=document.createElement('div');modal.id='mwsBossEditorModalV121';modal.innerHTML=`<div class="mws-boss-editor-box"><div class="space"><div><h2 id="mwsBossEditorTitleV121" style="margin:0">레이드 보스 수정</h2><div class="muted small" style="margin-top:5px">보스 이름, 체력, 이미지를 수정합니다.</div></div><button type="button" class="secondary" id="mwsBossEditorCloseV121">닫기</button></div><div class="mws-boss-editor-grid"><div id="mwsBossEditorPreviewV121" class="mws-boss-editor-preview">이미지 미리보기</div><div class="mws-boss-form"><label>보스 이름<input id="mwsBossNameV121" maxlength="60"></label><label>최대 체력<input id="mwsBossHpV121" type="number" min="1" max="1000000" step="1" value="500"></label><label>이미지 URL<div class="mws-boss-image-row"><input id="mwsBossImageUrlV121" placeholder="https://..."><label class="mws-boss-image-file">파일 선택<input id="mwsBossImageFileV121" type="file" accept="image/*"></label></div></label><div class="muted small">이미지 파일은 R2에 저장되어 스케줄 데이터에 큰 base64 이미지가 남지 않습니다.</div><div id="mwsBossEditorStatusV121" class="mws-boss-status-v121"></div></div></div><div class="mws-boss-editor-actions"><button type="button" class="secondary" id="mwsBossEditorCancelV121">취소</button><button type="button" class="primary" id="mwsBossEditorSaveV121">저장</button></div></div>`;document.body.appendChild(modal);
  const close=()=>{modal.classList.remove('open');pendingFile=null;revokePreviewUrl()};$('mwsBossEditorCloseV121').onclick=close;$('mwsBossEditorCancelV121').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
  $('mwsBossImageUrlV121').addEventListener('input',e=>{pendingImage=e.target.value.trim();pendingFile=null;renderEditorPreview()});$('mwsBossImageFileV121').addEventListener('change',e=>acceptEditorFile(e.target.files?.[0]));
  const preview=$('mwsBossEditorPreviewV121'),stop=e=>{e.preventDefault();e.stopPropagation()};preview.addEventListener('dragenter',e=>{stop(e);preview.classList.add('drag-over')});preview.addEventListener('dragover',e=>{stop(e);if(e.dataTransfer)e.dataTransfer.dropEffect='copy';preview.classList.add('drag-over')});preview.addEventListener('dragleave',e=>{stop(e);if(!preview.contains(e.relatedTarget))preview.classList.remove('drag-over')});preview.addEventListener('drop',e=>{stop(e);preview.classList.remove('drag-over');acceptEditorFile([...(e.dataTransfer?.files||[])].find(f=>String(f.type||'').startsWith('image/')))});$('mwsBossEditorSaveV121').onclick=saveEditor;return modal}
async function openEditor(id=''){const modal=ensureEditor(),state=await readState(),boss=id?state.bosses.find(b=>b.id===id):null;editorId=id;pendingFile=null;pendingImage=String(boss?.image||'');$('mwsBossEditorTitleV121').textContent=boss?'레이드 보스 수정':'레이드 보스 추가';$('mwsBossNameV121').value=boss?.name||'';$('mwsBossHpV121').value=String(boss?.maxHealth||DEFAULT_HP);$('mwsBossImageUrlV121').value=pendingImage;$('mwsBossImageFileV121').value='';$('mwsBossEditorStatusV121').textContent='';renderEditorPreview();modal.classList.add('open');setTimeout(()=>$('mwsBossNameV121')?.focus(),0)}
async function saveEditor(){const name=$('mwsBossNameV121').value.trim();if(!name)return alert('보스 이름을 입력해 주세요.');const hp=Math.max(1,Math.min(1000000,Math.floor(Number($('mwsBossHpV121').value)||DEFAULT_HP))),state=await readState();let id=editorId||makeId(),image=$('mwsBossImageUrlV121').value.trim()||pendingImage;const status=$('mwsBossEditorStatusV121'),btn=$('mwsBossEditorSaveV121');try{if(btn)btn.disabled=true;if(pendingFile){if(status)status.textContent='이미지 업로드 중...';image=await uploadBossFile(pendingFile,id)}if(editorId){const i=state.bosses.findIndex(b=>b.id===editorId);if(i>=0)state.bosses[i]=normalizeBoss({...state.bosses[i],name,maxHealth:hp,image,updatedAt:now()},i)}else state.bosses.push(normalizeBoss({id,name,maxHealth:hp,image,createdAt:now(),updatedAt:now()},state.bosses.length));await writeState(state,editorId?'레이드 보스 수정':'레이드 보스 추가',true);$('mwsBossEditorModalV121').classList.remove('open');pendingFile=null;revokePreviewUrl();ensureManagerModal();renderManagerModalList()}catch(error){console.error(error);if(status)status.textContent=error?.message||String(error);alert(error?.message||String(error))}finally{if(btn)btn.disabled=false}}
async function deleteBoss(id){const state=await readState();if(state.bosses.length<=1)return alert('보스는 최소 1개가 필요합니다.');const boss=state.bosses.find(b=>b.id===id);if(!boss||!confirm(`${boss.name} 보스를 삭제할까요?`))return;state.bosses=state.bosses.filter(b=>b.id!==id);if(state.activeBossId===id)state.activeBossId=state.bosses[0].id;await writeState(state,'레이드 보스 삭제',true);renderManagerModalList()}
async function bulkUpload(files){const images=[...files].filter(f=>String(f.type||'').startsWith('image/'));if(!images.length)return;const btn=$('mwsBossBulkUploadV121'),status=$('mwsBossBulkStatusV121');if(btn)btn.disabled=true;let added=0,skipped=0;try{const state=await readState(),sorted=images.sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko',{numeric:true,sensitivity:'base'}));let index=0;const worker=async()=>{while(index<sorted.length){const i=index++,file=sorted[i],id=makeId();if(status)status.textContent=`${i+1} / ${sorted.length} 업로드 중 · ${file.name}`;if(file.size>MAX_FILE_BYTES){skipped++;continue}try{const image=await uploadBossFile(file,id);state.bosses.push(normalizeBoss({id,name:cleanFileName(file.name),image,maxHealth:DEFAULT_HP,createdAt:now(),updatedAt:now()},state.bosses.length));added++}catch(error){console.warn('Boss bulk upload failed',file.name,error);skipped++}}};await Promise.all([worker(),worker(),worker()]);if(added)await writeState(state,`레이드 보스 묶음 업로드 ${added}개`,true);if(status)status.textContent=`완료 · ${added}개 추가${skipped?` · ${skipped}개 건너뜀`:''}`}catch(error){console.error(error);if(status)status.textContent='묶음 업로드 실패';alert(error?.message||String(error))}finally{if(btn)btn.disabled=false;const input=$('mwsBossBulkInputV121');if(input)input.value=''}}
function ensureSummary(){installStyle();if($('mwsBossManagerV121'))return true;const exportBtn=$('exportAllBtn'),section=exportBtn?.closest('.section');if(!section)return false;document.getElementById('mwsBossManagerV116')?.remove();const card=document.createElement('div');card.id='mwsBossManagerV121';card.className='card';card.innerHTML=`<div class="mws-boss-summary-head"><div><h3 style="margin:0">레이드 보스 관리</h3><div class="muted small" style="margin-top:5px">보스 이미지는 목록에 펼쳐두지 않고 수정 창에서만 불러옵니다.</div><div class="mws-boss-summary-meta"><span id="mwsBossCountV121" class="mws-boss-count-chip">0개</span><span id="mwsBossCurrentV121"></span></div></div><div class="mws-boss-summary-actions"><button type="button" class="secondary" id="mwsBossBulkUploadV121">묶음 업로드</button><input id="mwsBossBulkInputV121" type="file" accept="image/*" multiple><button type="button" class="secondary" id="mwsBossManageV121">수정</button><button type="button" class="primary" id="mwsBossAddV121">보스 추가</button></div></div><div id="mwsBossBulkStatusV121" class="mws-boss-status-v121"></div>`;const photo=section.querySelector('.contact-photo-folder-card-v416');if(photo)section.insertBefore(card,photo);else section.appendChild(card);$('mwsBossManageV121').onclick=openManagerModal;$('mwsBossAddV121').onclick=()=>openEditor('');$('mwsBossBulkUploadV121').onclick=()=>$('mwsBossBulkInputV121').click();$('mwsBossBulkInputV121').onchange=e=>bulkUpload(e.target.files||[]);renderSummary();return true}
function boot(){installStyle();let tries=0;const install=()=>{tries++;if(ensureSummary()||tries>=24)return;setTimeout(install,250)};install();window.addEventListener('mawang:boss-catalog-change',()=>{renderSummary();renderManagerModalList()});document.addEventListener('click',e=>{if(e.target?.closest?.('[data-tab="export"], [data-tab="importExport"], [data-tab="backup"], #exportAllBtn'))setTimeout(()=>{ensureSummary();renderSummary()},0)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
