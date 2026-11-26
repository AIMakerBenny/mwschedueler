import {ROSTER,ROLE_NAMES,TIERS,SCORE,normalizeState,syncContacts,matchContact,balancedDraft,teamStats} from './operation-m-model-v1.js?v=1';
const root=document.getElementById('operationM');
if(root){
const KEY='mws.operationM.simulation.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{return normalizeState(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){return normalizeState(null)}};
let state=read(),tab='tier',selected='',dragName='',picker='',query='',notice='',lastSignature='',saveFailed=false;
let contacts=[],byId=new Map(),missing=[];
const getData=()=>{try{return typeof data!=='undefined'?data:window.data}catch(_){return window.data}};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));saveFailed=false}catch(_){saveFailed=true}}
function sync(){
  contacts=(getData()?.contacts||[]).filter(c=>c&&c.id!=null&&c.name);
  const before=JSON.stringify(state.links),result=syncContacts(state,contacts);byId=result.byId;missing=result.missing;
  if(before!==JSON.stringify(state.links))save();
}
const current=n=>byId.get(state.links[n]);
const display=n=>current(n)?.name||n;
const available=()=>!missing.length&&ROSTER.every(n=>TIERS.includes(state.tiers[n]));
const button=(action,label,extra='')=>'<button type="button" data-op-action="'+action+'" '+extra+'>'+label+'</button>';
function photo(c,name){
  const src=String(c?.image||c?.avatar||c?.profileImage||'');
  let attrs='';
  if(src&&/^(?:\/media\/contact\/|https?:\/\/|blob:|data:image\/)/i.test(src)){
    if(typeof mwsDeferredContactAttrsV1==='function')attrs=mwsDeferredContactAttrsV1(src);
    else attrs='src="'+esc(src)+'"';
  }
  return '<span class="op-portrait"><span class="op-initial">'+esc(String(name).slice(0,2))+'</span>'+(attrs?'<img '+attrs+' alt="" decoding="async" loading="lazy" width="112" height="112">':'')+'</span>';
}
function player(n,kind='tier'){
  const c=current(n),name=display(n),tier=state.tiers[n]||'';
  return '<button type="button" class="op-player '+(selected===n?'op-selected ':'')+(!c?'op-unlinked':'')+'" data-op-player="'+esc(n)+'" draggable="'+(kind==='tier'&&!!c)+'" aria-label="'+esc(name+(tier?' '+tier+' 티어':' 미분류')+(!c?' 연락처 연결 필요':''))+'" '+(kind==='tier'?'aria-pressed="'+(selected===n)+'"':'data-op-result="1"')+'>'+photo(c,name)+(tier&&kind==='result'?'<span class="op-chip" data-tier="'+tier+'">'+tier+'</span>':'')+'<span class="op-player-name">'+esc(name)+'</span>'+(!c?'<span class="op-link-mark">연결 필요</span>':'')+'</button>';
}
function row(t){
  const members=ROSTER.filter(n=>(state.tiers[n]||'')===t);
  return '<div class="op-tier-row" data-op-drop="'+t+'" data-tier="'+(t||'U')+'"><button type="button" data-op-tier="'+t+'" class="op-tier-label" aria-label="'+(t?t+' 티어로 이동':'미분류로 이동')+'"><strong>'+(t||'미분류')+'</strong><small>'+members.length+'명'+(t?' · '+SCORE[t]+'점':'')+'</small></button><div class="op-player-grid">'+members.map(n=>player(n)).join('')+(!members.length?'<div class="op-empty">여기에 참가자 배치</div>':'')+'</div></div>';
}
function roles(){
  const candidates=ROLE_NAMES.map(n=>matchContact(n,contacts)).filter(Boolean);
  const ids=new Set(Object.values(state.links));
  return '<details class="op-role-box"><summary>주최자 및 감독 지정 <span>'+state.roles.filter(id=>byId.has(id)).length+' / 5</span></summary><div class="op-role-grid">'+state.roles.map((id,i)=>{
    const c=byId.get(id),opts=[...candidates];if(c&&!opts.some(x=>String(x.id)===id))opts.push(c);
    return '<label>'+photo(c,c?.name||(i?'감독':'주최자'))+'<span>'+(i?'감독 '+i:'주최자')+'</span><select data-op-role="'+i+'" aria-label="'+(i?'감독 '+i:'주최자')+'"><option value="">미지정</option>'+opts.filter(x=>!ids.has(String(x.id))).map(x=>'<option value="'+esc(x.id)+'" '+(String(x.id)===id?'selected':'')+(state.roles.some((other,j)=>j!==i&&other===String(x.id))?' disabled':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label>';
  }).join('')+'</div></details>';
}
function pickerHtml(){
  if(!picker)return '';
  const used=new Set([...Object.entries(state.links).filter(([n])=>n!==picker).map(([,id])=>id),...state.roles]);
  const q=query.trim().toLocaleLowerCase('ko-KR');
  const list=q?contacts.filter(c=>!used.has(String(c.id))&&String(c.name).toLocaleLowerCase('ko-KR').includes(q)).slice(0,40):[];
  return '<div class="op-picker" role="dialog" aria-label="연락처 연결"><div class="op-picker-top"><strong>'+esc(picker)+' 연락처 연결</strong>'+button('close-picker','닫기')+'</div><input type="search" data-op-search placeholder="연락처 이름 검색" value="'+esc(query)+'" aria-label="연락처 이름 검색"><div class="op-picker-results">'+(list.length?list.map(c=>'<button type="button" data-op-link="'+esc(c.id)+'">'+esc(c.name)+'</button>').join(''):'<span>'+(q?'검색 결과 없음':'이름을 입력하세요')+'</span>')+'</div></div>';
}
function results(){
  if(!state.teams.length)return '<div class="op-result-empty">티어표에서 20명 모두 분류한 뒤 자동 드래프트를 실행하세요.</div>';
  const stats=state.teams.map(t=>teamStats(t,state.tiers)),spread=Math.max(...stats.map(x=>x.score))-Math.min(...stats.map(x=>x.score));
  return '<div class="op-result-summary"><span>팀당 5명</span><span>최대 점수 차이 <b>'+spread+'</b></span><span>각 티어 인원 차이 최대 1명</span></div><div class="op-teams">'+state.teams.map((team,i)=>{
    const c=byId.get(state.roles[i+1]),s=stats[i];
    return '<article class="op-team" data-team="'+i+'"><header>'+photo(c,c?.name||'감독')+'<div><small>TEAM '+String.fromCharCode(65+i)+'</small><strong>'+esc(c?.name||'감독 '+(i+1))+'</strong></div><b>'+s.score+'점</b></header><div class="op-team-players">'+team.map(n=>player(n,'result')).join('')+'</div><footer>'+TIERS.map(t=>'<span data-tier="'+t+'">'+t+' '+s.counts[t]+'</span>').join('')+'</footer></article>'
  }).join('')+'</div>';
}
function render(){
  if(!root.classList.contains('active'))return;
  sync();const assigned=ROSTER.filter(n=>TIERS.includes(state.tiers[n])).length;
  const roleOpen=root.querySelector('.op-role-box')?.open;
  root.innerHTML='<div class="op-shell"><div class="op-top"><div><div class="op-eyebrow">OPERATION M</div><div class="op-meta"><span>연락처 '+(20-missing.length)+'/20</span><span>티어 '+assigned+'/20</span><span>4팀 · 팀당 5명</span></div></div><div class="op-actions">'+button('refresh','연락처 다시 연결')+button('draft',state.teams.length?'다시 자동 드래프트':'자동 드래프트','class="op-primary" '+(!available()?'disabled':''))+'</div></div><nav class="op-tabs" aria-label="오퍼 M 도구">'+button('tab-tier','티어표','aria-pressed="'+(tab==='tier')+'"')+button('tab-result','가상 드래프트','aria-pressed="'+(tab==='result')+'"')+'</nav>'+roles()+'<div class="op-status" role="status">'+esc(notice||(saveFailed?'브라우저 저장 불가 · 새로고침 시 초기화될 수 있습니다':missing.length?'연락처 미연결 '+missing.length+'명 · 해당 카드를 눌러 연결하세요.':selected?display(selected)+' 선택 · 원하는 티어 행을 누르세요.':'이 브라우저에만 저장되는 모의 팀 구성입니다.'))+'</div>'+(tab==='tier'?'<div class="op-board">'+TIERS.map(row).join('')+row('')+'</div><div class="op-bottom">'+button('reset','티어 초기화')+'<span>카드를 끌어 배치하거나 카드 선택 후 티어를 누르세요.</span></div>':results())+pickerHtml()+'</div>';
  if(roleOpen)root.querySelector('.op-role-box').open=true;
  lastSignature=signature();
}
function signature(){return JSON.stringify(ROSTER.map(n=>{const c=current(n);return[c?.id,c?.name,c?.image]}).concat(state.roles.map(id=>{const c=byId.get(id);return[c?.id,c?.name,c?.image]})))}
function move(n,t){
  if(!ROSTER.includes(n)||!current(n)||(t&&!TIERS.includes(t)))return;
  if(t)state.tiers[n]=t;else delete state.tiers[n];
  state.teams=[];selected='';notice='';save();render();
}
function showPicker(n){picker=n;query='';render();root.querySelector('[data-op-search]')?.focus()}
root.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!root.contains(b))return;
  const n=b.dataset.opPlayer;
  if(n){if(b.dataset.opResult)return;if(!current(n)){showPicker(n);return}selected=selected===n?'':n;notice='';render();return}
  if(b.hasAttribute('data-op-tier')){if(selected)move(selected,b.dataset.opTier);return}
  if(b.dataset.opLink&&picker){
    const id=b.dataset.opLink;if(!byId.has(id)||Object.entries(state.links).some(([n,x])=>n!==picker&&x===id)||state.roles.includes(id))return;
    state.links[picker]=id;state.teams=[];picker='';query='';notice='';save();render();return;
  }
  switch(b.dataset.opAction){
    case 'tab-tier':tab='tier';notice='';render();break;
    case 'tab-result':tab='result';notice='';render();break;
    case 'close-picker':picker='';query='';render();break;
    case 'refresh':notice='현재 불러온 연락처로 다시 연결했습니다.';render();break;
    case 'reset':if(!confirm('20명의 티어와 가상 팀 결과를 초기화할까요?'))return;state.tiers={};state.teams=[];selected='';notice='';save();render();break;
    case 'draft':sync();if(!available())return;state.teams=balancedDraft(state.tiers);tab='result';notice='티어 균형을 만족하는 모의 팀이 구성되었습니다.';save();render();break;
  }
});
root.addEventListener('change',e=>{
  if(!e.target.hasAttribute('data-op-role'))return;
  const i=Number(e.target.dataset.opRole),id=e.target.value;
  if(id&&(!byId.has(id)||Object.values(state.links).includes(id)||state.roles.some((x,j)=>j!==i&&x===id)))return;
  state.roles[i]=id;save();render();
});
root.addEventListener('input',e=>{
  if(!e.target.hasAttribute('data-op-search'))return;
  query=e.target.value;const box=root.querySelector('.op-picker-results'),temp=document.createElement('div');temp.innerHTML=pickerHtml();box.replaceChildren(...temp.querySelector('.op-picker-results').childNodes);
});
root.addEventListener('dragstart',e=>{const b=e.target.closest('[data-op-player]');if(!b||!current(b.dataset.opPlayer)||b.dataset.opResult)return;dragName=b.dataset.opPlayer;e.dataTransfer.setData('text/plain',dragName);e.dataTransfer.effectAllowed='move';b.classList.add('op-dragging')});
root.addEventListener('dragover',e=>{const r=e.target.closest('[data-op-drop]');if(!r||!dragName)return;e.preventDefault();e.dataTransfer.dropEffect='move';root.querySelectorAll('.op-drop-active').forEach(x=>{if(x!==r)x.classList.remove('op-drop-active')});r.classList.add('op-drop-active')});
root.addEventListener('drop',e=>{const r=e.target.closest('[data-op-drop]');if(!r||!dragName)return;e.preventDefault();const n=dragName;dragName='';move(n,r.dataset.opDrop)});
root.addEventListener('dragend',()=>{dragName='';root.querySelectorAll('.op-drop-active,.op-dragging').forEach(x=>x.classList.remove('op-drop-active','op-dragging'))});
window.addEventListener('mws:workspace-tab-v1',e=>{if(e.detail?.tab==='operationM'){const title=document.getElementById('pageTitle');if(title)title.textContent='오퍼 M';render()}});
window.addEventListener('mws:app-ready',()=>{if(root.classList.contains('active'))render()});
window.mwsOperationM={render,refresh(){if(!root.classList.contains('active'))return;sync();if(signature()!==lastSignature)render()}};
if(root.classList.contains('active'))render();
}
