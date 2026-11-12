/* Mawang Scheduler Steam game integration v1.1.2 - event editor side panel */
(()=>{
'use strict';
if(window.__mwsSteamGameV111)return;
window.__mwsSteamGameV111=1;

const $=id=>document.getElementById(id);
const getData=()=>{try{return data}catch(_){return window.data||null}};
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
const appIdOf=game=>String(game?.appid??game?.appId??'').trim();
const steamUrl=id=>`https://store.steampowered.com/app/${encodeURIComponent(id)}/`;
let panelDraftGame=null;
let panelSearchAbort=null;
let panelSearchTimer=null;
let scanTimer=null;
let activeEditorEventId='';
let eventModalWasOpen=false;
let manualEditId='';


function eventById(id){return getData()?.events?.find(event=>String(event?.id||'')===String(id||''))||null}
function currentEditingEventId(){
  try{return typeof editingEventId!=='undefined'?String(editingEventId||''):''}catch(_){return ''}
}
// Legacy Steam event objects keep their original serialized shape.
function validImage(value){
  const url=String(value||'').trim();
  if(/^https:\/\/[^\s<>"']+$/i.test(url))return url;
  if(url.length<=95000&&/^data:image\/(?:webp|jpeg|png);base64,[a-z0-9+/=]+$/i.test(url))return url;
  return '';
}
function isManualGame(game){
  return game?.source==='manual'&&String(game?.id||'').startsWith('manual:');
}
function normalizeGame(game){
  if(isManualGame(game)){
    const name=String(game.name||'').trim().slice(0,100);
    if(!name)return null;
    return {source:'manual',id:String(game.id).slice(0,100),name,
      image:validImage(game.image),platform:String(game.platform||'기타').trim().slice(0,40)||'기타'};
  }
  const appid=appIdOf(game);
  if(!/^\d{1,12}$/.test(appid))return null;
  const rawImage=validImage(game?.image||game?.headerImage||'');
  return {
    appid,
    name:String(game?.name||'').trim()||`Steam App ${appid}`,
    image:rawImage||`https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(appid)}/header.jpg`,
    storeUrl:steamUrl(appid),
  };
}
function serializeGame(game){
  const g=normalizeGame(game);
  if(!g)return null;
  if(isManualGame(g))return {source:'manual',id:g.id,name:g.name,image:g.image,platform:g.platform};
  return {appid:g.appid,name:g.name,image:g.image,storeUrl:g.storeUrl};
}
function notice(title,message){
  try{if(typeof toast==='function'){toast(title,message);return}}catch(_){}
  try{alert(message)}catch(_){}
}

// The common picker merges explicitly registered manual games with Steam games
// already used by schedules. No migration or rewrite of legacy events is needed.
function gameKey(game){return isManualGame(game)?game.id:`steam:${game.appid}`;}
function libraryEntries(){
  const d=getData()||{},byKey=new Map();
  for(const raw of Array.isArray(d.gameLibrary)?d.gameLibrary:[]){
    const game=normalizeGame(raw);
    if(game)byKey.set(gameKey(game),game);
  }
  for(const event of Array.isArray(d.events)?d.events:[]){
    const game=normalizeGame(event?.steamGame);
    if(game&&!isManualGame(game)&&!byKey.has(gameKey(game)))byKey.set(gameKey(game),game);
  }
  return [...byKey.values()].sort((a,b)=>{
    const ap=isManualGame(a)?0:1,bp=isManualGame(b)?0:1;
    return ap-bp||a.name.localeCompare(b.name,'ko');
  });
}
function closeManualForm(){
  manualEditId='';
  const form=$('gameManualFormV1');
  if(form)form.hidden=true;
}
function openManualForm(game){
  if(document.body.dataset.mwsMode==='public'){
    notice('게임 라이브러리','관리자 모드에서만 게임을 등록하거나 수정할 수 있습니다.');
    return;
  }
  const form=$('gameManualFormV1');
  if(!form)return;
  const item=isManualGame(game)?normalizeGame(game):null;
  manualEditId=item?.id||'';
  form.hidden=false;
  $('gameManualNameV1').value=item?.name||'';
  $('gameManualPlatformV1').value=['PC','모바일','콘솔','웹','기타'].includes(item?.platform)?item.platform:'PC';
  $('gameManualImageUrlV1').value=item?.image?.startsWith('https://')?item.image:'';
  $('gameManualImageFileV1').value='';
  $('gameManualSaveV1').textContent=item?'수정 저장':'라이브러리 저장';
  $('gameManualNameV1').focus();
}
async function compressedGameImage(file){
  if(!file)return '';
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('PNG, JPG, WebP 이미지만 등록할 수 있습니다.');
  if(file.size>5*1024*1024)throw new Error('이미지는 5MB 이하만 등록할 수 있습니다.');
  // A small original image needs no browser decoding or transcoding.
  // This also avoids waiting for GPU image decoders for tiny PNG files.
  if(file.size<=65000){
    const original=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||''));
      reader.onerror=()=>reject(reader.error||new Error('이미지 읽기 실패'));
      reader.readAsDataURL(file);
    });
    if(validImage(original))return original;
  }
  const bitmap=await createImageBitmap(file);
  try{
    const scale=Math.min(1,420/bitmap.width,240/bitmap.height);
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    let output='';
    for(const quality of [.7,.55,.4]){
      output=canvas.toDataURL('image/webp',quality);
      if(validImage(output))return output;
    }
    throw new Error('이미지 압축 크기가 너무 큽니다. 더 작은 파일을 선택하세요.');
  }finally{bitmap.close?.();}
}
async function saveManualGameForm(){
  if(document.body.dataset.mwsMode==='public')return;
  const d=getData();
  if(!d)return;
  const name=String($('gameManualNameV1')?.value||'').trim().slice(0,100);
  const platform=String($('gameManualPlatformV1')?.value||'PC').trim().slice(0,40);
  const rawUrl=String($('gameManualImageUrlV1')?.value||'').trim();
  const file=$('gameManualImageFileV1')?.files?.[0]||null;
  if(!name){notice('게임 등록','게임 이름을 입력하세요.');return}
  if(rawUrl&&!validImage(rawUrl)){notice('게임 등록','이미지는 HTTPS 주소를 입력해 주세요.');return}
  const saveButton=$('gameManualSaveV1');
  if(saveButton)saveButton.disabled=true;
  try{
    if(!Array.isArray(d.gameLibrary))d.gameLibrary=[];
    const position=manualEditId?d.gameLibrary.findIndex(item=>item?.id===manualEditId):-1;
    if(manualEditId&&position<0)throw new Error('수정할 게임이 라이브러리에 없습니다.');
    const previous=position>=0?{...d.gameLibrary[position]}:null;
    const image=file?await compressedGameImage(file):(rawUrl||previous?.image||'');
    const item={source:'manual',id:manualEditId||`manual:${crypto.randomUUID()}`,name,platform,image};
    const stored=normalizeGame(item);
    if(!stored)throw new Error('게임 정보가 올바르지 않습니다.');
    const before=Array.isArray(d.gameLibrary)?[...d.gameLibrary]:[];
    if(position>=0)d.gameLibrary[position]=stored;
    else d.gameLibrary.push(stored);
    let saved=false;
    try{saved=typeof saveData==='function'&&saveData(position>=0?'게임 라이브러리 수정':'게임 라이브러리 추가');}
    catch(error){console.error('Game library persistence failed',error);}
    if(!saved){
      d.gameLibrary=before;
      throw new Error('로컬 저장 실패. 게임 라이브러리를 원래 상태로 유지했습니다.');
    }
    panelDraftGame=stored;
    closeManualForm();
    renderPanelPreview();
    markPanelSelected();
    renderLibraryList();
    notice('게임 라이브러리',`${name} 등록 정보가 저장되었습니다. 일정에 사용하려면 스케줄도 저장하세요.`);
  }catch(error){notice('게임 등록 실패',error?.message||String(error));}
  finally{if(saveButton)saveButton.disabled=false;}
}
function renderLibraryList(){
  const box=$('gameLibListV1');
  if(!box)return;
  const term=String($('gameLibFilterV1')?.value||'').toLocaleLowerCase().trim();
  const games=libraryEntries().filter(g=>(g.name+' '+(g.platform||'Steam')).toLocaleLowerCase().includes(term)).slice(0,80);
  if(!games.length){box.innerHTML='<div class="mws-game-search-empty-v112">등록된 게임이 없습니다. 아래에서 직접 등록하거나 Steam 게임을 검색하세요.</div>';return;}
  box.innerHTML=games.map(game=>{
    const key=gameKey(game),manual=isManualGame(game);
    const image=game.image?`<img src="${esc(game.image)}" alt="" loading="lazy">`:`<span class="mws-game-library-icon-v1">${esc(game.name.slice(0,1))}</span>`;
    const selected=gameKey(normalizeGame(panelDraftGame)||{})===key;
    return `<div class="mws-game-library-entry-v1">
      <button type="button" class="mws-game-library-choose-v1 ${selected?'selected':''}" data-game-key="${esc(key)}" aria-label="${esc(game.name)} 선택">
        ${image}<span><strong>${esc(game.name)}</strong><small>${manual?esc(game.platform):'Steam'}</small></span>
      </button>
      ${manual?`<button type="button" class="secondary mws-game-library-edit-v1" data-edit-key="${esc(key)}">수정</button>`:''}
    </div>`;
  }).join('');
  box.querySelectorAll('[data-game-key]').forEach(button=>button.addEventListener('click',()=>{
    const item=libraryEntries().find(game=>gameKey(game)===button.dataset.gameKey);
    if(!item)return;
    panelDraftGame=item;
    renderPanelPreview();markPanelSelected();renderLibraryList();
  }));
  box.querySelectorAll('[data-edit-key]').forEach(button=>button.addEventListener('click',()=>{
    const item=libraryEntries().find(game=>gameKey(game)===button.dataset.editKey);
    if(item&&isManualGame(item))openManualForm(item);
  }));
}
function installCss(){
  if($('mwsSteamGameStyleV111'))return;
  const style=document.createElement('style');
  style.id='mwsSteamGameStyleV111';
  style.textContent=`
.steam-game-slot-v110{display:none!important}
.mini-event.mws-steam-host-v111{position:relative!important;padding-right:48px!important;overflow:hidden!important}
.mini-event>.mws-steam-slot-v111{position:absolute!important;right:3px!important;top:3px!important;bottom:3px!important;width:40px!important;min-width:40px!important;height:auto!important;margin:0!important;padding:0!important;border:1px solid color-mix(in srgb,var(--accent) 68%,var(--border))!important;border-radius:7px!important;background:color-mix(in srgb,var(--panel) 86%,#000)!important;color:var(--text)!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:30!important;font-size:22px!important;font-weight:1000!important;line-height:1!important;overflow:hidden!important;cursor:pointer!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 4px 12px rgba(0,0,0,.24)!important}
.mini-event>.mws-steam-slot-v111:hover{border-color:var(--accent)!important;background:color-mix(in srgb,var(--accent) 23%,var(--panel))!important}
.mini-event>.mws-steam-slot-v111 img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
.dashboard-upcoming-card.mws-steam-host-v111{position:relative!important;padding-right:54px!important}
.dashboard-upcoming-card>.mws-steam-slot-v111{position:absolute!important;right:7px!important;top:7px!important;bottom:7px!important;width:40px!important;min-width:40px!important;padding:0!important;border:1px solid color-mix(in srgb,var(--accent) 68%,var(--border))!important;border-radius:8px!important;background:var(--input)!important;color:var(--text)!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:30!important;font-size:22px!important;font-weight:1000!important;overflow:hidden!important;cursor:pointer!important}
.dashboard-upcoming-card>.mws-steam-slot-v111 img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}

#eventModal .event-modalbox.mws-game-panel-enabled-v112{width:min(1760px,98vw)!important}
#eventModal .event-modalbox.mws-game-panel-enabled-v112 .event-modal-layout{grid-template-columns:minmax(300px,370px) minmax(560px,1fr) minmax(300px,350px)!important;gap:14px!important}
.event-game-panel-v112{min-width:0;min-height:0;border:1px solid var(--border);border-radius:14px;background:color-mix(in srgb,var(--panel) 96%,transparent);padding:14px;display:flex;flex-direction:column;overflow:hidden}
.event-game-panel-v112[hidden]{display:none!important}
.mws-game-panel-head-v112{align-items:flex-start!important;margin-bottom:13px}
.mws-game-panel-head-v112 h3{margin:0;font-size:15px}
.mws-game-panel-head-v112 .chip{font-size:9px;padding:4px 7px;white-space:nowrap}
.mws-game-preview-v112{border:1px solid var(--border);border-radius:13px;background:var(--input);overflow:hidden;flex:0 0 auto}
.mws-game-preview-v112.has-game{border-color:color-mix(in srgb,var(--accent) 58%,var(--border))}
.mws-game-preview-image-v112{display:block;width:100%;aspect-ratio:460/215;object-fit:cover;background:#080b12}
.mws-game-preview-copy-v112{padding:12px}
.mws-game-preview-name-v112{font-size:17px;line-height:1.3;font-weight:1000;word-break:keep-all}
.mws-game-preview-app-v112{margin-top:5px;font-size:9px;color:var(--muted)}
.mws-game-preview-actions-v112{display:flex;gap:7px;margin-top:10px}
.mws-game-preview-actions-v112 button{flex:1;padding:7px 9px;font-size:10px}
.mws-game-preview-empty-v112{min-height:188px;display:grid;place-items:center;padding:22px;text-align:center;color:var(--muted);font-size:11px;line-height:1.65}
.mws-game-preview-empty-mark-v112{width:48px;height:48px;margin:0 auto 10px;border:1px solid color-mix(in srgb,var(--accent) 42%,var(--border));border-radius:13px;display:grid;place-items:center;color:var(--accent);font-size:28px;font-weight:900;background:color-mix(in srgb,var(--accent) 8%,var(--input))}
.mws-game-search-section-v112{margin-top:15px;min-height:0;display:flex;flex-direction:column;flex:1}
.mws-game-search-label-v112{font-size:11px;font-weight:900;margin-bottom:7px}
.mws-game-search-row-v112{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}
.mws-game-search-row-v112 input{width:100%;min-width:0}
.mws-game-search-row-v112 button{padding-left:11px;padding-right:11px}
.mws-game-search-status-v112{min-height:24px;padding-top:7px;font-size:9px;color:var(--muted)}
.mws-game-results-v112{display:flex;flex-direction:column;gap:7px;overflow:auto;min-height:80px;max-height:330px;padding-right:3px}
.mws-game-library-v1{margin-top:14px;border-top:1px solid var(--border);padding-top:12px}
.mws-game-library-v1 h4{margin:0 0 7px;font-size:13px}
.mws-game-library-search-v1{width:100%;margin-bottom:8px;font-size:12px;min-height:34px}
.mws-game-library-list-v1{max-height:210px;overflow:auto;display:grid;gap:5px}
.mws-game-library-entry-v1{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px;align-items:stretch}
.mws-game-library-choose-v1{display:grid;grid-template-columns:48px minmax(0,1fr);align-items:center;gap:8px;min-width:0;width:100%;text-align:left;padding:5px;border:1px solid var(--border);border-radius:8px;background:var(--input);color:var(--text)}
.mws-game-library-choose-v1:hover,.mws-game-library-choose-v1.selected{border-color:var(--accent)}
.mws-game-library-choose-v1 img{width:48px;height:32px;object-fit:cover;border-radius:5px}
.mws-game-library-icon-v1{display:grid;place-items:center;width:48px;height:32px;border-radius:5px;background:var(--chip)}
.mws-game-library-choose-v1 strong{display:block;font-size:11px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.mws-game-library-choose-v1 small{display:block;font-size:10px;color:var(--muted);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.mws-game-library-edit-v1{padding:5px 7px;font-size:10px}
.mws-game-library-add-v1{width:100%;margin-top:8px;font-size:12px;padding:7px}
.mws-game-manual-form-v1{margin-top:9px;display:grid;gap:7px;padding:10px;background:var(--input);border:1px solid var(--border);border-radius:10px}
.mws-game-manual-form-v1[hidden]{display:none!important}
.mws-game-manual-form-v1 label{display:grid;gap:4px;min-width:0}
.mws-game-manual-form-v1 input,.mws-game-manual-form-v1 select{width:100%;min-width:0;font-size:12px}
.mws-game-manual-form-v1 .row{gap:6px}
.mws-game-manual-form-v1 .row button{flex:1;font-size:11px}
.mws-game-manual-hint-v1{color:var(--muted);font-size:10px;line-height:1.45}

.mws-game-result-v112{width:100%;display:grid;grid-template-columns:82px minmax(0,1fr);gap:9px;align-items:center;padding:7px;border:1px solid var(--border);border-radius:10px;background:var(--input);color:var(--text);text-align:left;cursor:pointer}
.mws-game-result-v112:hover,.mws-game-result-v112.selected{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 9%,var(--input))}
.mws-game-result-v112 img{width:82px;height:39px;object-fit:cover;border-radius:6px;background:#080b12}
.mws-game-result-v112 strong{display:block;font-size:11px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mws-game-result-v112 small{display:block;margin-top:3px;font-size:8px;color:var(--muted)}
.mws-game-search-empty-v112{padding:16px 11px;border:1px dashed var(--border);border-radius:10px;text-align:center;color:var(--muted);font-size:9px;line-height:1.55}
.mws-game-panel-bottom-v112{display:flex;justify-content:flex-end;gap:7px;margin-top:11px;padding-top:11px;border-top:1px solid color-mix(in srgb,var(--border) 72%,transparent)}
.mws-game-panel-bottom-v112 button{font-size:10px;padding:7px 9px}
#eventModal .event-modalbox.mws-game-panel-enabled-v112.repeat-panel-open .event-game-panel-v112{display:none!important}
#eventModal .event-modalbox.mws-game-panel-enabled-v112.repeat-panel-open .event-modal-layout{grid-template-columns:minmax(300px,370px) minmax(590px,1fr) minmax(320px,380px)!important}
@media(max-width:1380px){
  #eventModal .event-modalbox.mws-game-panel-enabled-v112 .event-modal-layout{grid-template-columns:minmax(270px,320px) minmax(500px,1fr) minmax(280px,310px)!important}
}
@media(max-width:1150px){
  #eventModal .event-modalbox.mws-game-panel-enabled-v112{width:min(980px,97vw)!important;overflow:auto!important}
  #eventModal .event-modalbox.mws-game-panel-enabled-v112 .event-modal-layout,
  #eventModal .event-modalbox.mws-game-panel-enabled-v112.repeat-panel-open .event-modal-layout{grid-template-columns:1fr!important}
  .event-game-panel-v112{min-height:520px;overflow:visible}
  .mws-game-results-v112{max-height:300px}
}
`;
  document.head.appendChild(style);
}

function ensurePanel(){
  let panel=$('eventGamePanelV112');
  if(panel)return panel;
  const layout=document.querySelector('#eventModal .event-modal-layout');
  const info=document.querySelector('#eventModal .event-info-panel');
  if(!layout||!info)return null;

  panel=document.createElement('aside');
  panel.id='eventGamePanelV112';
  panel.className='event-game-panel-v112';
  panel.innerHTML=`
    <div class="space mws-game-panel-head-v112">
      <div><h3>게임</h3><div class="muted small" style="margin-top:4px">이 스케줄에서 플레이할 Steam 게임을 연결합니다.</div></div>
      <span class="chip">스케줄 저장 시 저장</span>
    </div>
    <div id="eventGamePreviewV112" class="mws-game-preview-v112"></div>
    <div class="mws-game-search-section-v112">
      <div class="mws-game-search-label-v112">게임 찾기</div>
      <div class="mws-game-search-row-v112">
        <input id="eventGameSearchV112" autocomplete="off" placeholder="Steam 게임 이름 검색">
        <button type="button" class="primary" id="eventGameSearchBtnV112">검색</button>
      </div>
      <div id="eventGameSearchStatusV112" class="mws-game-search-status-v112">게임 이름을 입력해 검색하세요.</div>
      <div id="eventGameResultsV112" class="mws-game-results-v112"><div class="mws-game-search-empty-v112">검색 결과가 여기에 표시됩니다.</div></div>
    </div>
    
    <section class="mws-game-library-v1" aria-label="게임 라이브러리">
      <h4>게임 라이브러리</h4>
      <input id="gameLibFilterV1" class="mws-game-library-search-v1" placeholder="등록한 게임 검색" aria-label="게임 라이브러리 검색" autocomplete="off">
      <div id="gameLibListV1" class="mws-game-library-list-v1" aria-live="polite"></div>
      <button type="button" id="gameLibAddToggleV1" class="secondary mws-game-library-add-v1">Steam 외 게임 직접 등록</button>
      <div id="gameManualFormV1" class="mws-game-manual-form-v1" hidden>
        <label>게임 이름 <input id="gameManualNameV1" maxlength="100" placeholder="예: 와우 포에버"></label>
        <label>플랫폼 <select id="gameManualPlatformV1">
          <option value="PC">PC</option><option value="모바일">모바일</option>
          <option value="콘솔">콘솔</option><option value="웹">웹</option><option value="기타">기타</option>
        </select></label>
        <label>이미지 URL <input id="gameManualImageUrlV1" inputmode="url" placeholder="https://... (선택)"></label>
        <label>또는 이미지 파일 <input id="gameManualImageFileV1" type="file" accept="image/png,image/jpeg,image/webp"></label>
        <div class="mws-game-manual-hint-v1">이미지 URL 또는 파일을 선택할 수 있습니다. 큰 이미지 파일은 압축해 라이브러리에 보관하며, 기존 일정은 변경하지 않습니다.</div>
        <div class="row"><button type="button" class="primary" id="gameManualSaveV1">라이브러리 저장</button><button type="button" class="secondary" id="gameManualCancelV1">취소</button></div>
      </div>
    </section>
    <div class="mws-game-panel-bottom-v112"><button type="button" class="secondary" id="eventGameRemoveV112">게임 연결 해제</button></div>`;
  info.insertAdjacentElement('afterend',panel);

  const input=$('eventGameSearchV112');
  input.addEventListener('input',()=>{
    clearTimeout(panelSearchTimer);
    panelSearchTimer=setTimeout(()=>searchSteam(input.value),320);
  });
  input.addEventListener('keydown',event=>{
    if(event.key==='Enter'){
      event.preventDefault();
      clearTimeout(panelSearchTimer);
      searchSteam(input.value);
    }
  });
  $('eventGameSearchBtnV112').addEventListener('click',()=>searchSteam(input.value));
  $('gameLibFilterV1').addEventListener('input',renderLibraryList);
  $('gameLibAddToggleV1').addEventListener('click',()=>openManualForm(null));
  $('gameManualCancelV1').addEventListener('click',()=>closeManualForm());
  $('gameManualSaveV1').addEventListener('click',saveManualGameForm);
  renderLibraryList();
  $('eventGameRemoveV112').addEventListener('click',()=>{
    panelDraftGame=null;
    renderPanelPreview();
    markPanelSelected();
    const status=$('eventGameSearchStatusV112');
    if(status)status.textContent='게임 연결을 해제했습니다. 스케줄 저장을 누르면 반영됩니다.';
  });
  return panel;
}

function renderPanelPreview(){
  const box=$('eventGamePreviewV112');
  if(!box)return;
  const game=normalizeGame(panelDraftGame);
  if(!game){
    box.className='mws-game-preview-v112';
    box.innerHTML='<div class="mws-game-preview-empty-v112"><div><div class="mws-game-preview-empty-mark-v112">+</div><div>선택된 게임이 없습니다.</div><div style="margin-top:5px">아래에서 게임을 검색해 선택하세요.</div></div></div>';
    return;
  }
  box.className='mws-game-preview-v112 has-game';
  const image=game.image?`<img class="mws-game-preview-image-v112" src="${esc(game.image)}" alt="${esc(game.name)}">`:'';
  const platform=isManualGame(game)?`직접 등록 · ${esc(game.platform)}`:`Steam App ${esc(game.appid)}`;
  const link=isManualGame(game)?'':`<div class="mws-game-preview-actions-v112"><button type="button" class="secondary" id="eventGameOpenSteamV112">Steam 페이지 열기</button></div>`;
  box.innerHTML=`${image}<div class="mws-game-preview-copy-v112"><div class="mws-game-preview-name-v112">${esc(game.name)}</div><div class="mws-game-preview-app-v112">${platform}</div>${link}</div>`;
  $('eventGameOpenSteamV112')?.addEventListener('click',()=>window.open(game.storeUrl,'_blank','noopener,noreferrer'));
}

function markPanelSelected(){
  const game=normalizeGame(panelDraftGame);
  document.querySelectorAll('#eventGameResultsV112 .mws-game-result-v112').forEach(node=>node.classList.toggle('selected',!!game&&node.dataset.appid===game.appid));
}

function renderSearchResults(items,message=''){
  const box=$('eventGameResultsV112');
  const status=$('eventGameSearchStatusV112');
  if(!box)return;
  if(message){
    if(status)status.textContent=message;
    box.innerHTML=`<div class="mws-game-search-empty-v112">${esc(message)}</div>`;
    return;
  }
  const games=(Array.isArray(items)?items:[]).map(normalizeGame).filter(Boolean);
  if(status)status.textContent=games.length?`${games.length}개 검색 결과`:'검색 결과 없음';
  if(!games.length){
    box.innerHTML='<div class="mws-game-search-empty-v112">검색 결과가 없습니다.</div>';
    return;
  }
  box.innerHTML=games.map(game=>`<button type="button" class="mws-game-result-v112" data-appid="${esc(game.appid)}"><img src="${esc(game.image)}" alt="" loading="lazy"><span><strong>${esc(game.name)}</strong><small>Steam App ${esc(game.appid)}</small></span></button>`).join('');
  box.querySelectorAll('[data-appid]').forEach(button=>button.addEventListener('click',()=>{
    const game=games.find(item=>item.appid===button.dataset.appid);
    if(!game)return;
    panelDraftGame=game;
    renderPanelPreview();
    markPanelSelected();
    if(status)status.textContent=`${game.name} 선택됨. 스케줄 저장을 누르면 반영됩니다.`;
  }));
  markPanelSelected();
}

async function searchSteam(query){
  const q=String(query||'').trim();
  if(q.length<2){renderSearchResults([],'게임 이름을 2글자 이상 입력하세요.');return}
  if(panelSearchAbort)panelSearchAbort.abort();
  panelSearchAbort=new AbortController();
  renderSearchResults([],'Steam에서 검색 중...');
  try{
    const response=await fetch(`/api/steam/search?q=${encodeURIComponent(q)}`,{headers:{accept:'application/json'},signal:panelSearchAbort.signal,cache:'no-store'});
    const body=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(body?.error||`HTTP ${response.status}`);
    renderSearchResults(body?.results||[]);
  }catch(error){
    if(error?.name==='AbortError')return;
    console.error('Steam search failed',error);
    renderSearchResults([],'Steam 검색에 실패했습니다. 다시 시도해 주세요.');
  }
}

function resetPanelSearch(){
  if(panelSearchAbort)panelSearchAbort.abort();
  panelSearchAbort=null;
  clearTimeout(panelSearchTimer);
  const input=$('eventGameSearchV112');
  if(input)input.value='';
  const status=$('eventGameSearchStatusV112');
  if(status)status.textContent='게임 이름을 입력해 검색하세요.';
  const results=$('eventGameResultsV112');
  if(results)results.innerHTML='<div class="mws-game-search-empty-v112">검색 결과가 여기에 표시됩니다.</div>';
}

function syncEditorPanel(force=false){
  const panel=ensurePanel();
  const modal=$('eventModal');
  const box=modal?.querySelector('.event-modalbox');
  if(!panel||!modal||!box)return;
  const isOpen=modal.classList.contains('open');
  if(!isOpen){
    activeEditorEventId='';
    box.classList.remove('mws-game-panel-enabled-v112');
    return;
  }

  const id=currentEditingEventId();
  const event=id?eventById(id):null;
  const isRest=Boolean(event?.restDay);
  panel.hidden=isRest;
  box.classList.toggle('mws-game-panel-enabled-v112',!isRest);
  if(isRest)return;

  if(force||activeEditorEventId!==id){
    activeEditorEventId=id;
    panelDraftGame=normalizeGame(event?.steamGame);
    resetPanelSearch();
    closeManualForm();
    renderPanelPreview();
    renderLibraryList();
  }
}

function applyDraftFallback(beforeIds,editingId,serialized){
  const modal=$('eventModal');
  if(modal?.classList.contains('open'))return;
  const current=getData();
  if(!current?.events)return;
  const targets=[];
  if(editingId){
    const edited=eventById(editingId);
    if(edited)targets.push(edited);
  }
  for(const event of current.events){
    if(!beforeIds.has(String(event?.id||'')))targets.push(event);
  }
  const unique=[...new Map(targets.map(event=>[event.id,event])).values()];
  if(!unique.length)return;
  for(const event of unique)event.steamGame=serialized?{...serialized}:null;
  try{if(typeof saveData==='function')saveData('Steam 게임 설정')}catch(error){console.error('Steam fallback save failed',error)}
}

function installSaveHook(){
  const button=$('saveEventBtn');
  if(!button||button.__mwsGamePanelSaveHookV112)return;
  const coreHandler=button.onclick;
  if(typeof coreHandler!=='function')return;
  button.__mwsGamePanelSaveHookV112=1;
  button.onclick=function(event){
    const modal=$('eventModal');
    const panel=$('eventGamePanelV112');
    if(!modal?.classList.contains('open')||panel?.hidden)return coreHandler.call(this,event);

    const beforeIds=new Set((getData()?.events||[]).map(item=>String(item?.id||'')));
    const editingId=currentEditingEventId();
    const serialized=serializeGame(panelDraftGame);
    let originalApply=null;
    let patched=false;
    try{
      if(typeof applyEventPayloadWithRepeat==='function'){
        originalApply=applyEventPayloadWithRepeat;
        const wrapped=function(payload,id){
          if(payload&&typeof payload==='object')payload.steamGame=serialized?{...serialized}:null;
          return originalApply(payload,id);
        };
        applyEventPayloadWithRepeat=wrapped;
        patched=true;
      }
      return coreHandler.call(this,event);
    }finally{
      if(patched&&originalApply)applyEventPayloadWithRepeat=originalApply;
      if(!patched)setTimeout(()=>applyDraftFallback(beforeIds,editingId,serialized),0);
    }
  };
}

function openEditorAtGame(eventId){
  const event=eventById(eventId);
  if(!event||event.restDay)return;
  try{
    if(typeof window.openEvent==='function')window.openEvent(eventId);
    else if(typeof openEvent==='function')openEvent(eventId);
  }catch(error){
    console.error('Open event editor failed',error);
    return;
  }
  setTimeout(()=>{
    syncEditorPanel(true);
    $('eventGameSearchV112')?.focus();
  },0);
}
window.openSteamGamePickerV111=openEditorAtGame;

function ensureSlot(host,eventId){
  if(!host)return;
  const event=eventById(eventId);
  if(!event||event.restDay)return;
  host.classList.add('mws-steam-host-v111');
  let button=host.querySelector(':scope > .mws-steam-slot-v111');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='mws-steam-slot-v111';
    host.appendChild(button);
  }
  // The calendar now renders the button before this module boots, so attach
  // handlers to both pre-rendered and dynamically created slots exactly once.
  if(!button.__mwsSteamSlotHandlersV1){
    button.__mwsSteamSlotHandlersV1=true;
    button.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation()});
    button.addEventListener('mousedown',ev=>{ev.preventDefault();ev.stopPropagation()});
    button.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openEditorAtGame(button.dataset.eventId)});
  }
  button.dataset.eventId=String(eventId);
  const game=normalizeGame(event.steamGame);
  const signature=game?`${game.id||game.appid}|${game.name}|${game.image}|${game.platform||''}`:'empty';
  button.classList.toggle('linked',!!game);
  button.setAttribute('aria-label',game?`${game.name} 게임 수정`:'게임 추가');
  button.title=game?`${game.name} - 게임 수정`:'게임 추가';
  if(button.dataset.mwsSteamSignature!==signature){
    button.dataset.mwsSteamSignature=signature;
    button.innerHTML=game?(game.image?`<img src="${esc(game.image)}" alt="">`:esc(game.name.slice(0,1))):'+';
  }
}

function scan(){
  scanTimer=null;
  if(document.hidden)return;
  const current=getData();
  if(current?.events){
    document.querySelectorAll('.mini-event[data-evid]').forEach(node=>ensureSlot(node,node.dataset.evid));
    document.querySelectorAll('#upcomingDashboard .dashboard-upcoming-card[data-event-id]').forEach(node=>ensureSlot(node,node.dataset.eventId));
  }
  installSaveHook();
  renderLibraryList();
  const modal=$('eventModal');
  const open=Boolean(modal?.classList.contains('open'));
  if(open&&!eventModalWasOpen)syncEditorPanel(true);
  else if(open){
    const id=currentEditingEventId();
    if(id!==activeEditorEventId)syncEditorPanel(true);
  }
  if(!open&&eventModalWasOpen)syncEditorPanel(false);
  eventModalWasOpen=open;
}
function scheduleScan(){
  if(document.hidden||scanTimer)return;
  scanTimer=setTimeout(scan,0);
}
function observeScanRoot(root,flag,options){
  if(!root||root[flag])return;
  root[flag]=1;
  new MutationObserver(scheduleScan).observe(root,options);
}

function boot(){
  installCss();
  ensurePanel();
  installSaveHook();
  scheduleScan();
  observeScanRoot($('calendarGrid'),'__mwsSteamGridObserverV111',{childList:true});
  observeScanRoot($('upcomingDashboard'),'__mwsSteamDashboardObserverV111',{childList:true});
  observeScanRoot($('eventModal'),'__mwsSteamModalObserverV111',{attributes:true,attributeFilter:['class']});
  window.addEventListener('mawang:datachange',scheduleScan);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleScan()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
