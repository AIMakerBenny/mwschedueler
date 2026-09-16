/* Mawang Scheduler v1.1.9 - Boss Raid manager bulk upload and drag-drop enhancements */
(()=>{
'use strict';
if(window.__mwsBossToolsV119)return;
window.__mwsBossToolsV119=1;

const $=id=>document.getElementById(id);
const DEFAULT_HP=500;
const MAX_FILE_BYTES=4*1024*1024;
const MIGRATION_KEY='mwsBossDefaultHpMigratedV119';
const makeId=()=>`boss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
const now=()=>new Date().toISOString();

function cleanFileName(name=''){
  return String(name)
    .replace(/\.[^.]+$/,'')
    .replace(/^\s*\d+\s*[.\-_)\]]*\s*/,'')
    .trim()||'새 보스';
}
function readAsDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(reader.error||new Error('이미지를 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}
function store(){return window.MWSBossRaidStore||null}
function toast(title,msg){try{if(typeof window.toast==='function'){window.toast(title,msg);return}}catch(_){}try{console.info(title,msg)}catch(_){}}

function installStyle(){
  if($('mwsBossToolsStyleV119'))return;
  const style=document.createElement('style');
  style.id='mwsBossToolsStyleV119';
  style.textContent=`
.mws-boss-manager-buttons-v119{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#mwsBossBulkUploadV119{white-space:nowrap}
#mwsBossBulkInputV119{display:none}
#mwsBossEditorPreviewV116{position:relative;transition:border-color .14s,background .14s,box-shadow .14s}
#mwsBossEditorPreviewV116.mws-boss-drop-ready-v119:after{content:'이미지를 여기로 드래그해서 추가';position:absolute;inset:auto 12px 12px;z-index:3;padding:9px 11px;border:1px dashed color-mix(in srgb,var(--accent) 72%,var(--border));border-radius:10px;background:rgba(6,8,17,.78);color:var(--text);font-size:11px;font-weight:850;text-align:center;pointer-events:none}
#mwsBossEditorPreviewV116.mws-boss-drop-over-v119{border-color:var(--accent)!important;background:color-mix(in srgb,var(--accent) 11%,#080b12)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 24%,transparent)}
#mwsBossBulkStatusV119{font-size:10px;color:var(--muted);min-height:14px;margin-top:8px}
`;
  document.head.appendChild(style);
}

async function migrateDefaultHp(){
  if(localStorage.getItem(MIGRATION_KEY)==='1')return;
  const api=store();if(!api?.get||!api?.replace)return;
  try{
    const state=await api.get();
    if(!state?.bosses?.length)return;
    let changed=false;
    const bosses=state.bosses.map(boss=>{
      if(String(boss?.id||'')==='boss-default'&&Number(boss?.maxHealth)===100){changed=true;return {...boss,maxHealth:DEFAULT_HP,updatedAt:now()}}
      return boss;
    });
    if(changed)await api.replace({...state,bosses},'기본 레이드 보스 체력 500 적용');
    localStorage.setItem(MIGRATION_KEY,'1');
  }catch(error){console.error('Boss default HP migration failed',error)}
}

async function bulkUpload(files){
  const api=store();
  if(!api?.get||!api?.replace){alert('레이드 보스 저장소를 아직 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');return}
  const images=[...files].filter(file=>file&&String(file.type||'').startsWith('image/'));
  if(!images.length)return;
  const button=$('mwsBossBulkUploadV119');
  const status=$('mwsBossBulkStatusV119');
  const old=button?.textContent||'묶음 업로드';
  if(button){button.disabled=true;button.textContent='추가 중...'}
  let added=0,skipped=0;
  try{
    const state=await api.get();
    const next={...state,bosses:Array.isArray(state?.bosses)?[...state.bosses]:[]};
    const sorted=[...images].sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko',{numeric:true,sensitivity:'base'}));
    for(let i=0;i<sorted.length;i++){
      const file=sorted[i];
      if(status)status.textContent=`${i+1} / ${sorted.length} 처리 중 · ${file.name}`;
      if(file.size>MAX_FILE_BYTES){skipped++;continue}
      try{
        const image=await readAsDataUrl(file);
        next.bosses.push({id:makeId(),name:cleanFileName(file.name),image,maxHealth:DEFAULT_HP,discovered:false,defeated:false,createdAt:now(),updatedAt:now()});
        added++;
      }catch(error){console.error('Boss bulk image read failed',file.name,error);skipped++}
    }
    if(added)await api.replace(next,`레이드 보스 묶음 업로드 ${added}개`);
    if(status)status.textContent=`완료 · ${added}개 추가${skipped?` · ${skipped}개 건너뜀`:''}`;
    toast('레이드 보스 묶음 업로드',`${added}개 보스를 추가했습니다.${skipped?` ${skipped}개 파일은 형식 또는 용량 문제로 건너뛰었습니다.`:''}`);
  }catch(error){console.error('Boss bulk upload failed',error);if(status)status.textContent='묶음 업로드 실패';alert(`묶음 업로드 실패: ${error?.message||error}`)}
  finally{if(button){button.disabled=false;button.textContent=old}const input=$('mwsBossBulkInputV119');if(input)input.value=''}
}

function enhanceManager(){
  const host=$('mwsBossManagerV116');if(!host)return false;
  const heading=host.querySelector('.mws-boss-manager-head h3');
  if(heading&&heading.textContent.trim()!=='레이드 보스 관리')heading.textContent='레이드 보스 관리';

  const add=$('mwsBossAddV116');
  if(add&&!$('mwsBossBulkUploadV119')){
    let wrap=add.parentElement;
    if(!wrap?.classList.contains('mws-boss-manager-buttons-v119')){
      wrap=document.createElement('div');wrap.className='mws-boss-manager-buttons-v119';add.parentElement?.insertBefore(wrap,add);wrap.appendChild(add);
    }
    const bulk=document.createElement('button');bulk.type='button';bulk.id='mwsBossBulkUploadV119';bulk.className='secondary';bulk.textContent='묶음 업로드';
    const input=document.createElement('input');input.type='file';input.id='mwsBossBulkInputV119';input.accept='image/*';input.multiple=true;
    bulk.addEventListener('click',()=>input.click());
    input.addEventListener('change',()=>bulkUpload(input.files||[]));
    wrap.appendChild(bulk);wrap.appendChild(input);
    const status=document.createElement('div');status.id='mwsBossBulkStatusV119';host.querySelector('.mws-boss-manager-head')?.after(status);
  }
  return true;
}

async function acceptEditorFile(file){
  if(!file||!String(file.type||'').startsWith('image/'))return;
  if(file.size>MAX_FILE_BYTES){alert('이미지는 4MB 이하 파일을 사용해 주세요.');return}
  try{
    const dataUrl=await readAsDataUrl(file);
    const imageUrl=$('mwsBossImageUrlV116');
    if(imageUrl){imageUrl.value=dataUrl;imageUrl.dispatchEvent(new Event('input',{bubbles:true}))}
    const name=$('mwsBossNameV116');if(name&&!name.value.trim())name.value=cleanFileName(file.name);
  }catch(error){console.error('Boss drag image failed',error);alert('이미지를 읽지 못했습니다.')}
}

function enhanceEditor(){
  const modal=$('mwsBossEditorModalV116');const preview=$('mwsBossEditorPreviewV116');if(!modal||!preview)return false;
  preview.classList.add('mws-boss-drop-ready-v119');
  if(!preview.dataset.v119DropBound){
    preview.dataset.v119DropBound='1';
    const stop=e=>{e.preventDefault();e.stopPropagation()};
    preview.addEventListener('dragenter',e=>{stop(e);preview.classList.add('mws-boss-drop-over-v119')});
    preview.addEventListener('dragover',e=>{stop(e);if(e.dataTransfer)e.dataTransfer.dropEffect='copy';preview.classList.add('mws-boss-drop-over-v119')});
    preview.addEventListener('dragleave',e=>{stop(e);if(!preview.contains(e.relatedTarget))preview.classList.remove('mws-boss-drop-over-v119')});
    preview.addEventListener('drop',e=>{stop(e);preview.classList.remove('mws-boss-drop-over-v119');const file=[...(e.dataTransfer?.files||[])].find(f=>String(f.type||'').startsWith('image/'));if(file)acceptEditorFile(file)});
  }
  if(modal.classList.contains('open')){
    const title=$('mwsBossEditorTitleV116')?.textContent||'';
    const hp=$('mwsBossHpV116');
    if(/추가/.test(title)&&hp&&(hp.value===''||Number(hp.value)===100))hp.value=String(DEFAULT_HP);
  }
  return true;
}

function scan(){installStyle();enhanceManager();enhanceEditor()}
function boot(){
  scan();migrateDefaultHp();
  const root=document.body||document.documentElement;
  if(root)new MutationObserver(()=>requestAnimationFrame(scan)).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('mawang:boss-catalog-change',()=>requestAnimationFrame(scan));
  setInterval(()=>{scan();migrateDefaultHp()},1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
