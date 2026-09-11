/* CF MWS V 1.0.9 - editable tool titles, new-window tabs, focus-safe editing */
(()=>{
'use strict';
if(window.__mwsToolsUiV109)return;window.__mwsToolsUiV109=1;
const BUILD='CF MWS V 1.0.9';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const defaults={tier:'티어 게임',matrix:'2D Matrix Chart',relations:'인물 관계도'};
const sections={tier:'toolTier',matrix:'toolMatrix',relations:'toolRelations'};
let saveTimer=0;

function root(){try{return window.data?.miniGames?.toolsV1||null}catch(_){return null}}
function tool(kind){return root()?.[kind]||null}
function forceVersion(){
  try{
    document.body?.setAttribute('data-build-version',BUILD);
    $$('[id^="mwsBuildVersionV5"],#mwsBuildVersion,.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]').forEach(x=>{if(x.textContent!==BUILD)x.textContent=BUILD});
  }catch(_){ }
}
function saveNow(reason='도구 수정'){
  clearTimeout(saveTimer);
  try{if(typeof window.saveData==='function')window.saveData(reason);else if(typeof window.persist==='function')window.persist()}catch(e){console.error(e)}
}
function saveSoon(reason='도구 수정'){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>saveNow(reason),120);
}
function ensureStyle(){
  if($('#mwsToolsUiV109Style'))return;
  const s=document.createElement('style');s.id='mwsToolsUiV109Style';s.textContent=`
    .mws-tool-title-v109{display:block;width:min(560px,70vw);max-width:100%;box-sizing:border-box;border:1px solid transparent;background:transparent;color:var(--text);border-radius:9px;padding:3px 8px 4px 2px;font:inherit;font-size:24px;font-weight:900;line-height:1.25;outline:none}
    .mws-tool-title-v109:hover{border-color:var(--border);background:color-mix(in srgb,var(--input) 45%,transparent)}
    .mws-tool-title-v109:focus{border-color:var(--accent);background:var(--input);padding-left:8px}
    .mws-tool-open-v109{white-space:nowrap}
    @media(max-width:760px){.mws-tool-title-v109{width:min(100%,88vw);font-size:20px}}
  `;document.head.appendChild(s);
}
function ensureTitleState(kind){
  const t=tool(kind);if(!t)return defaults[kind];
  if(typeof t.title!=='string'||!t.title.trim())t.title=defaults[kind];
  return t.title;
}
function openTool(kind){
  try{
    const u=new URL(location.href);
    u.searchParams.set('mwsTool',sections[kind]);
    u.hash=sections[kind];
    window.open(u.toString(),'_blank','noopener');
  }catch(e){console.error(e)}
}
function patchHeader(kind){
  const sec=$('#'+sections[kind]);if(!sec)return;
  const head=$('.mws-tools-head',sec);if(!head)return;
  const left=head.firstElementChild;
  if(left){
    const h2=$('h2',left);
    let input=$('.mws-tool-title-v109',left);
    if(!input){
      input=document.createElement('input');
      input.type='text';input.className='mws-tool-title-v109';input.autocomplete='off';input.spellcheck=false;
      input.placeholder='제목';input.value=ensureTitleState(kind);
      input.addEventListener('input',()=>{const t=tool(kind);if(t)t.title=input.value});
      input.addEventListener('change',()=>{const t=tool(kind);if(t){t.title=input.value.trim()||defaults[kind];input.value=t.title;saveSoon(`${defaults[kind]} 제목 수정`)}});
      if(h2)h2.replaceWith(input);else left.prepend(input);
    }else if(document.activeElement!==input){
      const wanted=ensureTitleState(kind);if(input.value!==wanted)input.value=wanted;
    }
  }
  if(!$('.mws-tool-open-v109',head)){
    const b=document.createElement('button');b.type='button';b.className='mws-tool-btn mws-tool-open-v109';
    b.textContent=kind==='tier'?'새 티어표':'새 창';
    b.title='현재 도구를 새 브라우저 탭에서 엽니다.';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openTool(kind)});
    const saveActions=$('.mws-v108-save-actions',head);
    if(saveActions)head.insertBefore(b,saveActions);else head.appendChild(b);
  }
}

function installFocusSafeHandlers(){
  if(!window.mwsMatrixLabel?.__v109){
    const fn=(k,v)=>{const m=tool('matrix');if(m&&(k==='xLabel'||k==='yLabel'))m[k]=String(v)};fn.__v109=true;window.mwsMatrixLabel=fn;
  }
  if(!window.mwsRelSet?.__v109){
    const fn=(k,v)=>{const r=tool('relations');if(r)r[k]=String(v)};fn.__v109=true;window.mwsRelSet=fn;
  }
  if(!window.mwsTierEdit?.__v109){
    const fn=(id,k,v,now=false)=>{
      const t=tool('tier'),row=t?.tiers?.find?.(x=>String(x.id)===String(id));if(!row)return;
      row[k]=String(v);
      if(k==='color'){
        const active=document.activeElement;
        const meta=active?.closest?.('.mws-tier-meta');if(meta)meta.style.background=String(v);
        if(now)saveNow('티어 수정');
      }
    };
    fn.__v109=true;window.mwsTierEdit=fn;
  }
}
function isFocusSafeField(el){
  if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el instanceof HTMLSelectElement))return false;
  if(el.classList.contains('mws-person-search-v106'))return false;
  if(el.classList.contains('mws-tool-title-v109'))return false;
  return !!el.closest('#toolTier,#toolMatrix,#toolRelations');
}
function bindCommitHandlers(){
  if(document.documentElement.dataset.mwsV109CommitBound)return;
  document.documentElement.dataset.mwsV109CommitBound='1';
  document.addEventListener('change',e=>{
    const el=e.target;if(!isFocusSafeField(el))return;
    if(el.classList.contains('mws-axis-input'))return saveSoon('매트릭스 축 수정');
    if(el.closest('#toolRelations .mws-relation-toolbar'))return saveSoon('관계 설정');
    if(el.closest('#toolTier .mws-tier-meta'))return saveSoon('티어 수정');
  },true);
}
function patch(){
  ensureStyle();forceVersion();installFocusSafeHandlers();bindCommitHandlers();
  patchHeader('tier');patchHeader('matrix');patchHeader('relations');
}
function schedulePatch(){clearTimeout(schedulePatch.t);schedulePatch.t=setTimeout(patch,0)}
window.addEventListener('mawang:datachange',schedulePatch);
document.addEventListener('click',e=>{
  if(e.target.closest('.nav button[data-tab="toolTier"],.nav button[data-tab="toolMatrix"],.nav button[data-tab="toolRelations"]'))setTimeout(patch,35);
},true);
window.addEventListener('DOMContentLoaded',patch,{once:true});
window.addEventListener('load',patch,{once:true});
[0,100,350,900,1800,3500].forEach(ms=>setTimeout(patch,ms));
if(document.readyState!=='loading')patch();
})();
