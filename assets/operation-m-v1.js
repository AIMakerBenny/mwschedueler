import {ROSTER,ROLE_NAMES,TIERS,SCORE,normalizeState,syncContacts,matchContact,balancedDraft,teamStats} from './operation-m-model-v1.js?v=1';
const root=document.getElementById('operationM');
if(root){
const KEY='mws.operationM.simulation.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{return normalizeState(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){return normalizeState(null)}};
let state=read(),tab='roster',selected='',dragName='',picker='',query='',notice='',lastSignature='',saveFailed=false;
let configDraft=null,configSaving=false,workspaceReady=false,workspaceLoading=false,workspaceError=false;
let arrived='',revealDraft=false,layoutFrame=0,queue=[],guided=false,rankLock=false,rankTimer=0;
const RANK_STYLE={S:'holo',A:'gold',B:'crystal',C:'steel',D:'silver'};
const RANK_NAMES={S:'HOLOGRAPHIC',A:'GOLD',B:'CRYSTAL',C:'STEEL',D:'SILVER'};
const RANK_ART={
S:'<path d="M24 2 30 16 46 24 30 30 24 46 17 31 2 24 17 17Z" fill="currentColor" opacity=".22"/><path d="M24 3 30 16 45 24 30 30 24 45 17 31 3 24 17 17Z M24 3V45M3 24H45M17 17 30 30M30 16 17 31"/><path d="m6 6 7 2-5 5ZM42 6l-7 2 5 5ZM6 42l7-2-5-5ZM42 42l-7-2 5-5Z" fill="currentColor"/>',
A:'<path d="M24 7 36 18 24 40 12 18Z" fill="currentColor" opacity=".25"/><path d="M24 7 36 18 24 40 12 18ZM12 18H36M24 7V40"/><path d="M8 11C0 27 10 39 20 42M40 11c8 16-2 28-12 31M5 20l6 5M7 30l8 3M43 20l-6 5M41 30l-8 3"/>',
B:'<path d="M14 6H34L44 19 24 44 4 19Z" fill="currentColor" opacity=".24"/><path d="M14 6H34L44 19 24 44 4 19ZM4 19H44M14 6 24 44 34 6M14 6l10 13L34 6"/>',
C:'<path d="M24 5 41 11V25C41 34 31 40 24 44 17 40 7 34 7 25V11Z" fill="currentColor" opacity=".22"/><path d="M24 5 41 11V25C41 34 31 40 24 44 17 40 7 34 7 25V11ZM24 12 34 16V25L24 35 14 25V16Z"/>',
D:'<circle cx="24" cy="24" r="17" fill="currentColor" opacity=".14"/><circle cx="24" cy="24" r="17"/><path d="M24 14 33 24 24 34 15 24Z"/>'
};
const crest=t=>'<svg class="op-rank-crest" aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">'+(RANK_ART[t]||'')+'</svg>';
const rarity=t=>'<span class="op-rarity-art" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b></span>';
const DEFAULT_ROLES=['대월향','우왁굳','천양','머독','고세구!']; // confirmed by the current Admin screenshot
const CONFIG_KEY='operationMV1';
const admin=()=>document.body.dataset.mwsMode==='admin'&&window.__mwsAppReadyV130===true;
const report=()=>window.mwsV55EgressReport?.();
const canConfigure=()=>admin()&&workspaceReady&&report()?.loadedParts?.includes('miniGames')&&Number.isInteger(report()?.manifest?.parts?.miniGames)&&typeof window.mwsV55SaveNow==='function';
let contacts=[],byId=new Map(),missing=[];
const getData=()=>{try{return typeof data!=='undefined'?data:window.data}catch(_){return window.data}};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));saveFailed=false}catch(_){saveFailed=true}}
function readConfig(){
  const raw=getData()?.miniGames?.[CONFIG_KEY];
  const clean=normalizeState(raw);
  if(!raw){
    syncContacts(clean,contacts);
    const used=new Set(Object.values(clean.links));
    clean.roles=DEFAULT_ROLES.map(n=>{const c=matchContact(n,contacts),id=c?String(c.id):'';if(!id||used.has(id))return '';used.add(id);return id});
  }
  return{links:clean.links,roles:clean.roles};
}
function sync(){
  contacts=(getData()?.contacts||[]).filter(c=>c&&c.id!=null&&c.name);
  byId=new Map(contacts.map(c=>[String(c.id),c]));
  const config=readConfig(),old=state.links;
  for(const n of ROSTER)if(old[n]&&old[n]!==config.links[n]){delete state.tiers[n];state.teams=[]}
  const changed=JSON.stringify(old)!==JSON.stringify(config.links)||JSON.stringify(state.roles)!==JSON.stringify(config.roles);
  state.links=config.links;state.roles=config.roles;
  missing=ROSTER.filter(n=>!byId.has(state.links[n]));
  if(missing.length&&state.teams.length){state.teams=[];save()}
  if(changed)save();
}
async function enter(){
  if(!root.classList.contains('active'))return;
  if(report()?.loadedParts?.includes('miniGames')){workspaceReady=true;workspaceError=false;render();return}
  if(workspaceLoading)return;
  workspaceLoading=true;workspaceError=false;render();
  try{workspaceReady=typeof window.mwsV55EnsureParts==='function'&&await window.mwsV55EnsureParts('toolTier')===true;workspaceError=!workspaceReady}
  catch(_){workspaceReady=false;workspaceError=true}
  finally{workspaceLoading=false;render()}
}
const current=n=>byId.get(state.links[n]);
const display=n=>current(n)?.name||n;
const available=()=>workspaceReady&&!missing.length&&ROSTER.every(n=>TIERS.includes(state.tiers[n]));
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
  const styled=(kind==='tier'||kind==='result')&&tier;
  return '<button type="button" class="op-player '+(selected===n?'op-selected ':'')+(!c?'op-unlinked':'')+(arrived===n&&kind==='tier'?' op-arrived':'')+'" '+(styled?'data-tier="'+tier+'" data-rarity="'+RANK_STYLE[tier]+'" ':'')+'data-op-player="'+esc(n)+'" draggable="'+(kind==='tier'&&!!c)+'" aria-label="'+esc(name+(tier?' '+tier+' 티어':' 미분류')+(!c?' 연락처 연결 필요':''))+'" '+(kind==='tier'?'aria-pressed="'+(selected===n)+'"':'data-op-result="1"')+'>'+photo(c,name)+(styled?rarity(tier)+'<span class="op-chip" data-tier="'+tier+'">'+crest(tier)+tier+'</span>':'')+'<span class="op-player-name">'+esc(name)+'</span>'+(!c?'<span class="op-link-mark">연결 필요</span>':'')+'</button>';
}
function row(t){
  const members=ROSTER.filter(n=>state.tiers[n]===t);
  return '<div class="op-tier-row" data-count="'+members.length+'" data-op-drop="'+t+'" data-tier="'+t+'"><button type="button" data-op-tier="'+t+'" class="op-tier-label" aria-label="'+t+' 티어로 이동">'+crest(t)+'<span class="op-rank-heading"><strong>'+t+'</strong><span>'+RANK_NAMES[t]+'</span></span><span class="op-rank-meta"><b>'+members.length+'명</b><small>'+SCORE[t]+'점</small></span></button><div class="op-player-grid">'+members.map(n=>player(n)).join('')+(!members.length?'<button type="button" class="op-empty" data-op-tier="'+t+'" aria-label="'+t+' 티어에 참가자 배치"><span class="op-slot-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="op-empty-center">'+crest(t)+'<span>'+(selected?'선택한 참가자 배치':'참가자 배치')+'</span></span></button>':'')+'</div></div>';
}
function roster(){
  const host=byId.get(state.roles[0]);
  return '<div class="op-roster"><div class="op-block-head"><h2>감독</h2><span class="op-host">'+photo(host,host?.name||'주최자')+'<span>주최자 · '+esc(host?.name||'미지정')+'</span></span></div><div class="op-coaches">'+state.roles.slice(1).map((id,i)=>{const c=byId.get(id);return '<article class="op-coach" data-team="'+i+'">'+photo(c,c?.name||'감독')+'<div><small>감독 '+(i+1)+'</small><strong>'+esc(c?.name||'미지정')+'</strong></div></article>'}).join('')+'</div><div class="op-block-head"><h2>참가자 <small>'+ (20-missing.length)+' / 20</small></h2>'+'</div><div class="op-roster-grid">'+ROSTER.map(n=>player(n,'roster')).join('')+'</div><div class="op-roster-next">'+button('start-guided','다음 · 티어표 →','class="op-primary"')+'</div></div>';
}
function adminConfig(){
  if(!configDraft||!canConfigure())return '';
  const slot=(label,id,key)=>{const c=byId.get(id);return '<button class="op-admin-slot" type="button" data-op-config="'+esc(key)+'">'+photo(c,c?.name||label)+'<span><small>'+esc(label)+'</small><strong>'+esc(c?.name||'연락처 선택')+'</strong></span></button>'};
  return '<div class="op-overlay"><div class="op-config" role="dialog" aria-modal="true" aria-label="오퍼 M 인물 설정"><div class="op-config-head"><h2>인물 설정</h2>'+button('close-config','닫기',configSaving?'disabled':'')+'</div><h3>주최자 및 감독</h3><div class="op-config-roles">'+configDraft.roles.map((id,i)=>slot(i?'감독 '+i:'주최자',id,'role:'+i)).join('')+'</div><h3>참가자 20명</h3><div class="op-config-players">'+ROSTER.map(n=>slot(n,configDraft.links[n],n)).join('')+'</div><div class="op-config-footer"><span>'+esc(notice||'저장하면 모든 방문자에게 동일하게 표시됩니다.')+'</span>'+button('save-config',configSaving?'저장 중':'설정 저장','class="op-primary" '+(configSaving?'disabled':''))+'</div>'+pickerHtml()+'</div></div>';
}
function pickerHtml(){
  if(!picker||!configDraft||!canConfigure())return '';
  const role=picker.startsWith('role:'),idx=role?Number(picker.slice(5)):-1;
  const used=new Set([...Object.entries(configDraft.links).filter(([n])=>n!==picker).map(([,id])=>id),...configDraft.roles.filter((_,i)=>i!==idx)]);
  const q=query.trim().toLocaleLowerCase('ko-KR');
  const list=q?contacts.filter(c=>String(c.name).toLocaleLowerCase('ko-KR').includes(q)).slice(0,40):[];
  return '<div class="op-picker" role="dialog" aria-label="연락처 연결"><div class="op-picker-top"><strong>'+esc(role?(idx?'감독 '+idx:'주최자'):picker)+' 연락처 연결</strong>'+button('close-picker','닫기')+'</div><input type="search" data-op-search placeholder="연락처 이름 검색" value="'+esc(query)+'" aria-label="연락처 이름 검색"><div class="op-picker-results">'+(list.length?list.map(c=>'<button type="button" data-op-link="'+esc(c.id)+'">'+photo(c,c.name)+'<span>'+esc(c.name)+(used.has(String(c.id))?' · 교환':'')+'</span></button>').join(''):'<span>'+(q?'검색 결과 없음':'이름을 입력하세요')+'</span>')+'</div></div>';
}
function startGuided(){
  queue=ROSTER.filter(n=>current(n)&&!state.tiers[n]);
  for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}
  tab='tier';guided=queue.length>0;selected='';notice='';render();
}
function guidedBoard(){
  queue=queue.filter(n=>current(n)&&!state.tiers[n]);
  if(!queue.length){guided=false;return tierBoard()}
  const n=queue[0],name=display(n),done=ROSTER.filter(x=>state.tiers[x]).length;
  return '<div class="op-guided"><div class="op-guided-top"><span>참가자 '+(done+1)+' / 20</span><div class="op-guided-track"><i style="width:'+(done*5)+'%"></i></div>'+button('exit-guided','전체 티어표')+'</div><div class="op-guided-stage"><article class="op-reveal-card" data-op-current="'+esc(n)+'">'+photo(current(n),name)+'<strong>'+esc(name)+'</strong></article></div><div class="op-guided-ranks">'+TIERS.map(t=>'<button type="button" class="op-guide-rank" data-op-assign="'+t+'" data-tier="'+t+'"><strong>'+crest(t)+t+'</strong><small>'+ROSTER.filter(x=>state.tiers[x]===t).length+'명</small></button>').join('')+'</div></div>';
}
function tierBoard(){
  const unassigned=ROSTER.filter(n=>!state.tiers[n]);

  return '<div class="op-tier-workspace"><div class="op-pool '+(!unassigned.length?'op-pool-empty':'')+'" data-count="'+unassigned.length+'" data-op-drop=""><div class="op-block-head"><h2>미분류 <small>'+unassigned.length+'</small></h2><div class="op-pool-actions">'+(unassigned.length?button('start-guided','한 장씩 분류'):'')+button('reset','초기화')+'<button type="button" data-op-tier="" '+(!selected?'disabled':'')+'>미분류로 이동</button></div></div>'+(unassigned.length?'<div class="op-player-grid">'+unassigned.map(n=>player(n)).join('')+'</div>':'')+'</div><div class="op-board" data-layout="columns">'+TIERS.map(row).join('')+'</div></div>';
}
async function saveConfig(){
  if(!canConfigure()||!configDraft||configSaving)return;
  const ids=[...ROSTER.map(n=>configDraft.links[n]),...configDraft.roles];
  if(ids.some(id=>!id||!byId.has(id))||new Set(ids).size!==25){notice='주최자, 감독 및 참가자 25명을 중복 없이 연결하세요.';render();return}
  configSaving=true;notice='';render();
  const d=getData();d.miniGames[CONFIG_KEY]={links:{...configDraft.links},roles:[...configDraft.roles]};
  try{
    window.saveData('오퍼 M 인물 설정');
    const ok=await window.mwsV55SaveNow();
    if(ok){configDraft=null;picker='';notice='공용 인물 설정 저장 완료';}
    else notice='온라인 저장을 확인하지 못했습니다. 기존 저장 상태를 확인해 주세요.';
  }catch(_){notice='온라인 저장 실패';}
  finally{configSaving=false;render()}
}
function results(){
  if(!state.teams.length)return '<div class="op-teams">'+state.roles.slice(1).map((id,i)=>{const c=byId.get(id);return '<article class="op-team" data-team="'+i+'"><header>'+photo(c,c?.name||'감독')+'<div><small>TEAM '+String.fromCharCode(65+i)+'</small><strong>'+esc(c?.name||'감독 '+(i+1))+'</strong></div><b>0/5</b></header><div class="op-empty-team">배정 대기</div></article>'}).join('')+'</div><div class="op-result-cta">'+button('tab-tier','티어표에서 참가자 분류하기')+'</div>';
  const stats=state.teams.map(t=>teamStats(t,state.tiers));
  return '<div class="op-teams '+(revealDraft?'op-reveal':'')+'">'+state.teams.map((team,i)=>{
    const c=byId.get(state.roles[i+1]),s=stats[i];
    return '<article class="op-team" data-team="'+i+'"><header>'+photo(c,c?.name||'감독')+'<div><small>TEAM '+String.fromCharCode(65+i)+'</small><strong>'+esc(c?.name||'감독 '+(i+1))+'</strong></div><b>'+s.score+'점</b></header><div class="op-team-players">'+team.map(n=>player(n,'result')).join('')+'</div><footer>'+TIERS.map(t=>'<span data-tier="'+t+'">'+t+' '+s.counts[t]+'</span>').join('')+'</footer></article>'
  }).join('')+'</div>';
}
function render(){
  if(!root.classList.contains('active'))return;
  if(!workspaceReady){
    root.innerHTML='<div class="op-shell"><div class="op-result-empty">'+(workspaceError?'인물 설정을 불러오지 못했습니다. '+button('retry','다시 시도'):'참가자 정보를 불러오는 중…')+'</div></div>';return;
  }
  if(rankLock)return;
  sync();const assigned=ROSTER.filter(n=>TIERS.includes(state.tiers[n])).length;
  const action=tab==='roster'||guided?'':button('draft',state.teams.length?'다시 자동 드래프트':'자동 드래프트','class="op-primary" '+(!available()?'disabled':''));
  const scoreSpread=state.teams.length?Math.max(...state.teams.map(t=>teamStats(t,state.tiers).score))-Math.min(...state.teams.map(t=>teamStats(t,state.tiers).score)):null;
  const status=notice||(saveFailed?'브라우저 저장 불가':missing.length?'연락처 미연결 '+missing.length+'명 · 관리자 설정이 필요합니다.':selected?display(selected)+' 선택 · 티어를 누르세요.':'');
  root.innerHTML='<div class="op-shell" data-view="'+tab+'"><div class="op-toolbar"><span class="op-page-label">오퍼 M</span><nav class="op-tabs" aria-label="오퍼 M 도구">'+[['roster','참가자'],['tier','티어표'],['result','가상 드래프트']].map(([id,label])=>button('tab-'+id,label,'aria-pressed="'+(tab===id)+'"')).join('')+'</nav><div class="op-actions">'+(tab==='tier'?'<span class="op-progress">'+assigned+' / 20</span>':tab==='result'&&scoreSpread!==null?'<span class="op-progress">점수 차이 <b>'+scoreSpread+'</b></span>':'')+action+(canConfigure()?button('open-config','인물 설정','class="op-settings" aria-label="관리자 인물 설정"'):'')+'</div></div>'+(status?'<div class="op-status" role="status">'+esc(status)+'</div>':'')+(tab==='roster'?roster():tab==='tier'?(guided?guidedBoard():tierBoard()):results())+adminConfig()+'</div>';
  lastSignature=signature();
  arrived='';revealDraft=false;
  measureLayout();
  if(layoutFrame)cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(measureLayout);
}
function measureLayout(){
  if(!root.classList.contains('active'))return;
  const area=root.querySelector('.op-teams,.op-board,.op-guided');if(!area)return;
  const rect=area.getBoundingClientRect(),rootRect=root.getBoundingClientRect(),scale=root.offsetWidth?rootRect.width/root.offsetWidth:1;
  const access=document.getElementById('mwsAccessTools'),accessRect=access?.getBoundingClientRect();
  const bottom=accessRect&&accessRect.height&&accessRect.top>0?Math.min(innerHeight-14,accessRect.top-10):innerHeight-18;
  const available=Math.max(180,(bottom-Math.max(0,rect.top))/(scale||1));
  root.style.setProperty('--op-available',Math.floor(available)+'px');
  root.style.setProperty('--op-workspace-height',Math.max(240,Math.floor((bottom-Math.max(0,rootRect.top))/(scale||1)))+'px');
}
function scheduleMeasure(){if(layoutFrame)cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(measureLayout)}
window.addEventListener('resize',scheduleMeasure);
if(typeof ResizeObserver==='function'){let lastWidth=-1;new ResizeObserver(()=>{if(root.clientWidth!==lastWidth){lastWidth=root.clientWidth;scheduleMeasure()}}).observe(root)}
function signature(){return JSON.stringify(ROSTER.map(n=>{const c=current(n);return[c?.id,c?.name,c?.image]}).concat(state.roles.map(id=>{const c=byId.get(id);return[c?.id,c?.name,c?.image]})))}
function move(n,t){
  if(!ROSTER.includes(n)||!current(n)||(t&&!TIERS.includes(t)))return;
  if(t)state.tiers[n]=t;else delete state.tiers[n];
  state.teams=[];selected='';notice='';arrived=n;save();render();
}
function showPicker(n){picker=n;query='';render();root.querySelector('[data-op-search]')?.focus()}
root.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!root.contains(b))return;
  const n=b.dataset.opPlayer;
  if(n){if(b.dataset.opResult||tab!=='tier'||!current(n))return;selected=selected===n?'':n;notice='';render();[...root.querySelectorAll('[data-op-player]')].find(x=>x.dataset.opPlayer===n)?.focus({preventScroll:true});return}
  if(b.hasAttribute('data-op-tier')){if(selected)move(selected,b.dataset.opTier);return}
  if(b.dataset.opConfig&&configDraft&&canConfigure()&&!configSaving){showPicker(b.dataset.opConfig);return}
  if(b.dataset.opLink&&picker&&configDraft&&canConfigure()&&!configSaving){
    const id=b.dataset.opLink,role=picker.startsWith('role:'),idx=role?Number(picker.slice(5)):-1;
    if(!byId.has(id))return;
    const previous=role?configDraft.roles[idx]:configDraft.links[picker];
    for(const n of ROSTER)if(n!==picker&&configDraft.links[n]===id){if(previous)configDraft.links[n]=previous;else delete configDraft.links[n]}
    configDraft.roles=configDraft.roles.map((x,i)=>i!==idx&&x===id?(previous||''):x);
    if(role)configDraft.roles[idx]=id;else configDraft.links[picker]=id;
    picker='';query='';notice='';render();return;
  }
  if(b.dataset.opAssign&&guided&&queue.length&&TIERS.includes(b.dataset.opAssign)){if(e.detail>1||rankLock)return;const n=queue.shift(),t=b.dataset.opAssign;if(!current(n)||state.tiers[n]){render();return}state.tiers[n]=t;state.teams=[];save();rankLock=true;const card=root.querySelector('.op-reveal-card');if(card){card.dataset.tier=t;card.dataset.rarity=RANK_STYLE[t];card.classList.add('op-rank-confirm');card.insertAdjacentHTML('beforeend',rarity(t)+'<span class="op-confirm-rank">'+crest(t)+t+'</span>')}root.querySelectorAll('[data-op-assign]').forEach(x=>x.disabled=true);const finish=()=>{rankLock=false;rankTimer=0;if(!queue.length)guided=false;render()};rankTimer=setTimeout(finish,matchMedia('(prefers-reduced-motion: reduce)').matches?0:{S:650,A:500,B:400,C:300,D:240}[t]);return}
  if(rankLock){clearTimeout(rankTimer);rankTimer=0;rankLock=false;}
  switch(b.dataset.opAction){
    case 'start-guided':startGuided();break;
    case 'exit-guided':guided=false;render();break;
    case 'retry':void enter();break;
    case 'tab-roster':guided=false;tab='roster';selected='';notice='';render();break;
    case 'tab-tier':guided=false;tab='tier';selected='';notice='';render();break;
    case 'tab-result':guided=false;tab='result';selected='';notice='';render();break;
    case 'open-config':if(canConfigure()){configDraft={links:{...state.links},roles:[...state.roles]};notice='';render();root.querySelector('.op-config-head button')?.focus()}break;
    case 'close-config':if(!configSaving){configDraft=null;picker='';notice='';render()}break;
    case 'save-config':void saveConfig();break;
    case 'close-picker':picker='';query='';render();break;
    case 'reset':if(!confirm('20명의 티어와 가상 팀 결과를 초기화할까요?'))return;state.tiers={};state.teams=[];guided=false;selected='';notice='';save();render();break;
    case 'draft':sync();if(!available())return;state.teams=balancedDraft(state.tiers);tab='result';revealDraft=true;notice='';save();render();break;
  }
});
root.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement)e.target.style.visibility='hidden'},true);
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&picker){picker='';query='';render()}else if(e.key==='Escape'&&configDraft&&!configSaving){configDraft=null;notice='';render()}});
root.addEventListener('input',e=>{
  if(!e.target.hasAttribute('data-op-search'))return;
  query=e.target.value;const box=root.querySelector('.op-picker-results'),temp=document.createElement('div');temp.innerHTML=pickerHtml();box.replaceChildren(...temp.querySelector('.op-picker-results').childNodes);
});
root.addEventListener('dragstart',e=>{const b=e.target.closest('[data-op-player]');if(!b||!current(b.dataset.opPlayer)||b.dataset.opResult)return;dragName=b.dataset.opPlayer;e.dataTransfer.setData('text/plain',dragName);e.dataTransfer.effectAllowed='move';b.classList.add('op-dragging')});
root.addEventListener('dragover',e=>{const r=e.target.closest('[data-op-drop]');if(!r||!dragName)return;e.preventDefault();e.dataTransfer.dropEffect='move';root.querySelectorAll('.op-drop-active').forEach(x=>{if(x!==r)x.classList.remove('op-drop-active')});r.classList.add('op-drop-active')});
root.addEventListener('drop',e=>{const r=e.target.closest('[data-op-drop]');if(!r||!dragName)return;e.preventDefault();const n=dragName;dragName='';move(n,r.dataset.opDrop)});
root.addEventListener('dragend',()=>{dragName='';root.querySelectorAll('.op-drop-active,.op-dragging').forEach(x=>x.classList.remove('op-drop-active','op-dragging'))});
window.addEventListener('mws:workspace-tab-v1',e=>{if(e.detail?.tab==='operationM'){const title=document.getElementById('pageTitle');if(title)title.textContent='오퍼 M';void enter()}else{clearTimeout(rankTimer);rankTimer=0;rankLock=false;tab='roster';guided=false;selected='';picker='';configDraft=null}});
window.addEventListener('mws:app-ready',()=>{workspaceReady=false;configDraft=null;picker='';if(root.classList.contains('active'))void enter()});
window.addEventListener('mawang:datachange',()=>window.mwsOperationM?.refresh());
window.mwsOperationM={render,refresh(){if(!root.classList.contains('active')||!workspaceReady)return;sync();if(signature()!==lastSignature)render()}};
if(root.classList.contains('active'))void enter();
}
