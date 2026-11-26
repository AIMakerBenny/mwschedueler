import {ROSTER,ROLE_NAMES,TIERS,SCORE,normalizeState,syncContacts,matchContact,balancedDraft,teamStats} from './operation-m-model-v1.js?v=1';
const root=document.getElementById('operationM');
if(root){
const KEY='mws.operationM.simulation.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{return normalizeState(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){return normalizeState(null)}};
let state=read(),tab='roster',selected='',dragName='',picker='',query='',notice='',lastSignature='',saveFailed=false;
let configDraft=null,configSaving=false,workspaceReady=false,workspaceLoading=false,workspaceError=false;
let arrived='',layoutFrame=0,queue=[],guided=false,choosingMode=false,rankLock=false,rankTimer=0;
let lastView='',guidedHistory=[],lastMove=null;
let rankPhaseTimers=[];
let draftRun=null,draftRender=false;
const draftLater=(run,ms,fn)=>{run.timers.push(setTimeout(()=>{if(draftRun===run&&root.classList.contains('active'))fn()},ms))};
function clearRankMotion(){clearTimeout(rankTimer);rankTimer=0;rankPhaseTimers.forEach(clearTimeout);rankPhaseTimers=[];root.querySelectorAll('.op-rank-beam').forEach(x=>x.remove())}
function rankAfter(ms,fn){rankPhaseTimers.push(setTimeout(fn,ms))}
let deckPhase='pick',deckTimer=0,deckEpoch=0,fastDraw=false,skipMotion=false;
function stopShuffle(){clearTimeout(deckTimer);deckTimer=0;deckEpoch++;if(deckPhase==='shuffle')deckPhase='pick'}
const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let dragCard=null,dragOrigin=null;
const boardCards=()=>[...root.querySelectorAll('.op-tier-workspace .op-player')];
const findBoardCard=n=>boardCards().find(c=>c.dataset.opPlayer===n);
const RANK_STYLE={S:'holo',A:'gold',B:'crystal',C:'steel',D:'silver'};
const RANK_ART={
S:'<path d="M24 2 30 16 46 24 30 30 24 46 17 31 2 24 17 17Z" fill="currentColor" opacity=".22"/><path d="M24 3 30 16 45 24 30 30 24 45 17 31 3 24 17 17Z M24 3V45M3 24H45M17 17 30 30M30 16 17 31"/><path d="m6 6 7 2-5 5ZM42 6l-7 2 5 5ZM6 42l7-2-5-5ZM42 42l-7-2 5-5Z" fill="currentColor"/>',
A:'<path d="M24 7 36 18 24 40 12 18Z" fill="currentColor" opacity=".25"/><path d="M24 7 36 18 24 40 12 18ZM12 18H36M24 7V40"/><path d="M8 11C0 27 10 39 20 42M40 11c8 16-2 28-12 31M5 20l6 5M7 30l8 3M43 20l-6 5M41 30l-8 3"/>',
B:'<path d="M14 6H34L44 19 24 44 4 19Z" fill="currentColor" opacity=".24"/><path d="M14 6H34L44 19 24 44 4 19ZM4 19H44M14 6 24 44 34 6M14 6l10 13L34 6"/>',
C:'<path d="M24 5 41 11V25C41 34 31 40 24 44 17 40 7 34 7 25V11Z" fill="currentColor" opacity=".22"/><path d="M24 5 41 11V25C41 34 31 40 24 44 17 40 7 34 7 25V11ZM24 12 34 16V25L24 35 14 25V16Z"/>',
D:'<circle cx="24" cy="24" r="17" fill="currentColor" opacity=".14"/><circle cx="24" cy="24" r="17"/><path d="M24 14 33 24 24 34 15 24Z"/>'
};
const crest=t=>'<svg class="op-rank-crest" aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">'+(RANK_ART[t]||'')+'</svg>';
const rarity=()=>'<span class="op-rarity-art" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b><em class="op-card-particles"></em></span>';
const cardBadge=(t,large=false)=>'<span class="'+(large?'op-confirm-rank':'op-chip')+'" data-tier="'+t+'">'+crest(t)+t+'</span>';
const cardBack=()=>'<span class="op-card-back" aria-hidden="true"><svg viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="110" height="140" rx="9" stroke="currentColor" stroke-width="1.2"/><rect x="10" y="10" width="100" height="130" rx="6" stroke="currentColor" opacity=".45"/><path d="M15 35 15 15 35 15M85 15H105V35M15 115V135H35M85 135H105V115M60 16 102 75 60 134 18 75Z" stroke="currentColor" opacity=".68"/><circle cx="60" cy="75" r="31" stroke="currentColor"/><circle cx="60" cy="75" r="25" stroke="currentColor" stroke-dasharray="2 3"/><path d="M35 87V59L60 78 85 59V87M43 86V73L60 87 77 73V86M60 37 65 45 60 53 55 45ZM60 97 65 105 60 113 55 105Z" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 75 23 69 29 75 23 81ZM91 75 97 69 103 75 97 81Z" fill="currentColor"/></svg></span>';
function cardFace(c,name,t='',large=false){
  return '<span class="op-card-front">'+photo(c,name)+rarity()+(t?cardBadge(t,large):'')+'<span class="op-player-name" title="'+esc(name)+'">'+esc(name)+'</span>'+(!c?'<span class="op-link-mark">연결 필요</span>':'')+'</span>';
}
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
  for(const n of ROSTER)if(old[n]&&old[n]!==config.links[n]){delete state.tiers[n];state.teams=[];lastMove=null}
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
  return '<button type="button" class="op-player op-card '+(selected===n?'op-selected ':'')+(!c?'op-unlinked':'')+(arrived===n&&kind==='tier'?' op-arrived':'')+'" '+(styled?'data-tier="'+tier+'" data-rarity="'+RANK_STYLE[tier]+'" ':'data-rarity="neutral" ')+'data-op-player="'+esc(n)+'" draggable="'+(kind==='tier'&&!!c)+'" aria-label="'+esc(name+(tier?' '+tier+' 티어':' 미분류')+(!c?' 연락처 연결 필요':''))+'" '+(kind==='tier'?'aria-pressed="'+(selected===n)+'"':'data-op-result="1"')+'>'+cardFace(c,name,styled?tier:'')+'</button>';
}
function emptySlot(t){return '<button type="button" class="op-empty" data-op-tier="'+t+'" aria-label="'+t+' 티어에 참가자 배치"><span class="op-slot-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="op-empty-center">'+crest(t)+'</span></button>';}
function row(t){
  const members=ROSTER.filter(n=>state.tiers[n]===t);
  const count=members.length;
  return '<div class="op-tier-row" data-count="'+members.length+'" data-op-drop="'+t+'" data-tier="'+t+'"><button type="button" data-op-tier="'+t+'" class="op-tier-label" aria-label="'+t+' 티어로 이동">'+crest(t)+'<span class="op-rank-heading"><strong>'+t+'</strong></span><span class="op-rank-meta"><b>'+members.length+'명</b><small>'+SCORE[t]+'점</small></span></button><div class="op-player-grid" '+(count?'tabindex="0" aria-label="'+t+' 티어 참가자 '+count+'명"':'')+'>'+members.map(n=>player(n)).join('')+(!members.length?emptySlot(t):'')+'</div></div>';
}
function roster(){
  const host=byId.get(state.roles[0]);
  return '<div class="op-roster"><div class="op-block-head"><h2>감독</h2><span class="op-host">'+photo(host,host?.name||'주최자')+'<span>주최자 · '+esc(host?.name||'미지정')+'</span></span></div><div class="op-coaches">'+state.roles.slice(1).map((id,i)=>{const c=byId.get(id),name=c?.name||'미지정';return '<article class="op-coach" data-team="'+i+'" style="--op-order:'+i+'">'+photo(c,name)+'<div class="op-coach-plate"><strong title="'+esc(name)+'">'+esc(name)+'</strong></div><span class="op-coach-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></span></article>'}).join('')+'</div><div class="op-block-head"><h2>참가자 <small>'+(20-missing.length)+' / 20</small></h2></div><div class="op-roster-grid">'+ROSTER.map(n=>player(n,'roster')).join('')+'</div><div class="op-roster-next">'+button('choose-mode','다음','class="op-primary"')+'</div></div>';
}
function modePreview(mode){
  if(mode==='guided')return '<span class="op-mode-preview op-mode-preview-guided" aria-hidden="true"><span class="op-preview-stack">'+[0,1,2].map(i=>'<span class="op-preview-card op-preview-back" style="--op-i:'+i+'">'+cardBack()+'</span>').join('')+'<span class="op-preview-card op-preview-draw"><span class="op-preview-portrait"></span><span class="op-preview-plate"></span></span></span></span>';
  return '<span class="op-mode-preview op-mode-preview-list" aria-hidden="true"><span class="op-preview-board">'+TIERS.map(t=>'<span class="op-preview-row" data-tier="'+t+'"><span>'+crest(t)+t+'</span><i></i><i></i><i></i></span>').join('')+'<span class="op-preview-token op-preview-token-one"></span><span class="op-preview-token op-preview-token-two"></span></span></span>';
}
function modeChoice(){
  return '<section class="op-mode-choice" aria-label="티어 분류 방식 선택"><div class="op-mode-options">'+[['guided','한 장씩 분류','카드를 한 장씩 공개하고 티어를 결정합니다.','start-guided'],['list','전체 목록 분류','원하는 참가자를 자유롭게 티어에 배치합니다.','start-list']].map(([mode,title,description,action])=>'<button type="button" class="op-mode-card" data-mode="'+mode+'" data-op-action="'+action+'">'+modePreview(mode)+'<span class="op-mode-caption"><strong>'+title+'</strong><span>'+description+'</span></span></button>').join('')+'</div><div class="op-mode-back">'+button('tab-roster','참가자 목록')+'</div></section>';
}
function chooseMode(){
  stopShuffle();tab='tier';guided=false;choosingMode=true;selected='';notice='';render();
  root.querySelector('.op-mode-card')?.focus({preventScroll:true});
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
function shuffleDeck(){
  stopShuffle();
  queue=ROSTER.filter(n=>current(n)&&!state.tiers[n]);
  for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}
  deckPhase=skipMotion||reducedMotion()?'pick':'shuffle';render();
  if(deckPhase==='shuffle'){const epoch=deckEpoch;deckTimer=setTimeout(()=>{if(epoch!==deckEpoch||!guided||!root.classList.contains('active'))return;deckTimer=0;deckPhase='pick';render();if(fastDraw&&queue.length)drawCard(Math.floor(Math.random()*queue.length))},1050)}
  else if(fastDraw&&queue.length)drawCard(Math.floor(Math.random()*queue.length));
}
function startGuided(){
  tab='tier';choosingMode=false;guided=ROSTER.some(n=>current(n)&&!state.tiers[n]);guidedHistory=[];selected='';notice=guided?'':'분류할 미분류 참가자가 없습니다.';fastDraw=false;skipMotion=false;
  if(guided)shuffleDeck();else render();
}
function drawCard(i){
  if(!guided||deckPhase!=='pick'||rankLock||!Number.isInteger(i)||i<0||i>=queue.length)return;
  const n=queue[i];if(!current(n)||state.tiers[n]){shuffleDeck();return}
  const slot=root.querySelector('[data-op-draw="'+i+'"]'),r=slot?.getBoundingClientRect(),stage=root.querySelector('.op-guided-stage')?.getBoundingClientRect();
  const scale=root.offsetWidth?root.getBoundingClientRect().width/root.offsetWidth:1;
  queue.splice(i,1);queue.unshift(n);deckPhase='reveal';render();
  const card=root.querySelector('.op-reveal-card');
  if(r&&stage&&card&&!skipMotion&&!reducedMotion()&&card.animate){
    const dest=card.getBoundingClientRect(),dx=(r.left+r.width/2-dest.left-dest.width/2)/(scale||1),dy=(r.top+r.height/2-dest.top-dest.height/2)/(scale||1);
    card.animate([{transform:'translate('+dx+'px,'+dy+'px) scale(.55)'},{transform:'none'}],{duration:360,easing:'cubic-bezier(.2,.7,.2,1)'});
  }
}
function deckMarkup(shuffling){
  const count=queue.length;
  return '<div class="op-deck '+(shuffling?'op-deck-shuffling':'op-deck-pick')+'" aria-label="'+(shuffling?'카드 섞는 중':'카드 선택')+'">'+queue.map((_,i)=>{const group=i%2===0?-1:1,offset=(i-(count-1)/2);const style='--op-i:'+i+';--op-group:'+group+';--op-offset:'+offset+';--op-stagger:'+Math.min(i*9,150)+'ms';return shuffling?'<span class="op-deck-card" style="'+style+'">'+cardBack()+'</span>':'<button type="button" class="op-deck-card" style="'+style+'" data-op-draw="'+i+'" aria-label="카드 '+(i+1)+' 선택">'+cardBack()+'</button>'}).join('')+'</div>';
}
function completedTray(){
  return '<div class="op-completed-tray" aria-label="분류 완료">'+TIERS.map(t=>'<span class="op-completed-slot" data-tier="'+t+'" data-op-completed="'+t+'">'+crest(t)+'<strong>'+t+'</strong><b>'+ROSTER.filter(n=>state.tiers[n]===t).length+'</b></span>').join('')+'</div>';
}
function guidedBoard(){
  queue=queue.filter(n=>current(n)&&!state.tiers[n]);
  if(!queue.length){stopShuffle();guided=false;return tierBoard()}
  const n=queue[0],name=display(n),done=ROSTER.filter(x=>state.tiers[x]).length,reveal=deckPhase==='reveal',shuffling=deckPhase==='shuffle';
  const controls=button('undo-guided','이전',guidedHistory.length&&!shuffling?'':'disabled')+button('choose-mode','방식 변경')+button('exit-guided','전체 티어표');
  const deckControls='<div class="op-deck-controls">'+button('shuffle-guided','다시 섞기',deckPhase==='pick'?'':'disabled')+button('draw-random','무작위 공개',deckPhase==='pick'?'':'disabled')+button('toggle-fast','빠른 진행','aria-pressed="'+fastDraw+'" '+(shuffling?'disabled':''))+button('skip-guided','연출 건너뛰기','aria-pressed="'+skipMotion+'"')+'</div>';
  return '<div class="op-guided '+(skipMotion?'op-skip-motion ':'')+'op-deck-phase-'+deckPhase+'"><div class="op-guided-top"><span class="op-guided-count">'+done+' / 20</span><div class="op-guided-track" role="progressbar" aria-label="분류 진행률" aria-valuenow="'+done+'" aria-valuemin="0" aria-valuemax="20"><i style="width:'+(done*5)+'%"></i></div>'+controls+'</div><div class="op-guided-stage"><div class="op-stage-halo" aria-hidden="true"></div>'+(reveal?'<div class="op-deck-reserve" aria-hidden="true">'+Array.from({length:Math.min(5,queue.length-1)},(_,i)=>'<span style="--op-i:'+i+'">'+cardBack()+'</span>').join('')+'</div><article class="op-reveal-card op-card" data-rarity="neutral" data-op-current="'+esc(n)+'">'+cardFace(current(n),name)+cardBack()+'</article>':deckMarkup(shuffling))+'</div>'+completedTray()+deckControls+'<div class="op-guided-ranks" '+(!reveal?'hidden':'')+'>'+TIERS.map((t,i)=>'<button type="button" class="op-guide-rank" data-op-assign="'+t+'" data-tier="'+t+'" aria-keyshortcuts="'+(i+1)+'" '+(!reveal?'disabled':'')+'><span class="op-keyhint">'+(i+1)+'</span><strong>'+crest(t)+t+'</strong><small>'+ROSTER.filter(x=>state.tiers[x]===t).length+'명</small></button>').join('')+'</div><span class="op-deck-remaining" aria-live="polite">남은 카드 '+queue.length+'장</span></div>';
}
function confirmRank(t,source){
  if(rankLock||!guided||deckPhase!=='reveal'||!queue.length||!TIERS.includes(t))return;
  const n=queue[0],card=root.querySelector('.op-reveal-card'),panel=root.querySelector('.op-guided');
  if(!current(n)||state.tiers[n]||!card||!panel)return;
  queue.shift();state.tiers[n]=t;state.teams=[];guidedHistory.push(n);save();rankLock=true;
  const motion=!skipMotion&&!reducedMotion(),charge=motion?120:0,hold=motion?{S:650,A:500,B:400,C:300,D:240}[t]:0,flight=motion?220:0;
  root.querySelectorAll('[data-op-assign]').forEach(x=>x.disabled=true);source.classList.add('op-rank-chosen');
  const target=panel.querySelector('[data-op-completed="'+t+'"]');
  const finish=()=>{clearRankMotion();rankLock=false;deckPhase='pick';if(!queue.length)guided=false;render();if(guided&&fastDraw)drawCard(Math.floor(Math.random()*queue.length))};
  const apply=()=>{
    if(!rankLock||!card.isConnected)return;
    card.dataset.tier=t;card.dataset.rarity=RANK_STYLE[t];card.classList.remove('op-rank-charging');card.classList.add('op-rank-confirm');card.querySelector('.op-card-front')?.insertAdjacentHTML('beforeend',cardBadge(t,true));
  };
  const send=()=>{
    if(!rankLock||!card.isConnected)return;
    if(!motion||!target){finish();return}
    const r=card.getBoundingClientRect(),d=target.getBoundingClientRect(),scale=root.offsetWidth?root.getBoundingClientRect().width/root.offsetWidth:1,dx=(d.left+d.width/2-r.left-r.width/2)/(scale||1),dy=(d.top+d.height/2-r.top-r.height/2)/(scale||1);
    card.classList.add('op-rank-flight');
    if(card.animate)card.animate([{transform:'none',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) scale(.16)',opacity:.1}],{duration:flight,easing:'cubic-bezier(.4,.1,.6,1)',fill:'forwards'});
    target.classList.add('op-completed-impact');
    target.querySelector('b').textContent=String(ROSTER.filter(x=>state.tiers[x]===t).length);
    panel.querySelector('.op-guided-count').textContent=ROSTER.filter(x=>state.tiers[x]).length+' / 20';
    const track=panel.querySelector('.op-guided-track'),done=ROSTER.filter(x=>state.tiers[x]).length;track.setAttribute('aria-valuenow',done);track.querySelector('i').style.width=(done*5)+'%';
    rankTimer=setTimeout(finish,flight);
  };
  if(!motion){apply();rankTimer=setTimeout(finish,0);return}
  card.classList.add('op-rank-charging');const a=source.getBoundingClientRect(),b=card.getBoundingClientRect(),p=panel.getBoundingClientRect(),scale=root.offsetWidth?root.getBoundingClientRect().width/root.offsetWidth:1;
  const x=(a.left+a.width/2-p.left)/(scale||1),y=(a.top+a.height/2-p.top)/(scale||1),dx=(b.left+b.width/2-a.left-a.width/2)/(scale||1),dy=(b.top+b.height/2-a.top-a.height/2)/(scale||1);
  const beam=document.createElement('span');beam.className='op-rank-beam';beam.dataset.tier=t;beam.setAttribute('aria-hidden','true');beam.style.cssText='left:'+x+'px;top:'+y+'px;width:'+Math.hypot(dx,dy)+'px;--op-angle:'+Math.atan2(dy,dx)+'rad';panel.append(beam);
  rankAfter(charge,()=>{beam.remove();apply()});rankAfter(charge+hold,send);
}
function tierBoard(){
  const unassigned=ROSTER.filter(n=>!state.tiers[n]);

  return '<div class="op-tier-workspace"><div class="op-pool '+(!unassigned.length?'op-pool-empty':'')+'" data-count="'+unassigned.length+'" data-op-drop=""><div class="op-block-head"><h2>미분류 <small>'+unassigned.length+'</small></h2><div class="op-pool-actions">'+button('choose-mode','방식 변경')+(lastMove?button('undo-move','되돌리기'):'')+button('reset','초기화')+'<button type="button" data-op-tier="" '+(!selected?'disabled':'')+'>미분류로 이동</button></div></div>'+(unassigned.length?'<div class="op-player-grid">'+unassigned.map(n=>player(n)).join('')+'</div>':'')+'</div><div class="op-board" data-layout="columns">'+TIERS.map(row).join('')+'</div></div>';
}
async function saveConfig(){
  if(!canConfigure()||!configDraft||configSaving)return;
  const ids=[...ROSTER.map(n=>configDraft.links[n]),...configDraft.roles];
  if(ids.some(id=>!id||!byId.has(id))||new Set(ids).size!==25){notice='주최자, 감독 및 참가자 25명을 중복 없이 연결하세요.';render();return}
  configSaving=true;notice='';render();
  const d=getData();d.miniGames[CONFIG_KEY]={links:{...configDraft.links},roles:[...configDraft.roles]};
  let saved=false;
  try{
    window.saveData('오퍼 M 인물 설정');
    const ok=await window.mwsV55SaveNow();
    if(ok){configDraft=null;picker='';notice='';saved=true;}
    else notice='온라인 저장을 확인하지 못했습니다. 기존 저장 상태를 확인해 주세요.';
  }catch(_){notice='온라인 저장 실패';}
  finally{configSaving=false;render();if(saved&&root.classList.contains('active'))feedback('공용 인물 설정 저장 완료');}
}
function teamHeader(i,score){
  const c=byId.get(state.roles[i+1]),name=c?.name||'감독 '+(i+1);
  return '<header>'+photo(c,name)+'<div class="op-team-identity"><strong title="'+esc(name)+'">'+esc(name)+'</strong></div><b data-op-team-score>'+score+'점</b></header>';
}
function teamFooter(stats){
  return '<footer>'+TIERS.map(t=>'<span data-tier="'+t+'" aria-label="'+t+' 티어 '+stats.counts[t]+'명">'+crest(t)+'<span>'+t+'</span><b>'+stats.counts[t]+'</b></span>').join('')+'</footer>';
}
function results(){
  const animating=!!draftRun;
  const stats=state.teams.map(t=>teamStats(t,state.tiers));
  if(!state.teams.length)return '<div class="op-teams">'+state.roles.slice(1).map((id,i)=>'<article class="op-team" data-team="'+i+'">'+teamHeader(i,0)+'<div class="op-team-players op-team-placeholder" aria-hidden="true">'+Array.from({length:5},()=>'<span class="op-team-slot"></span>').join('')+'</div>'+teamFooter(teamStats([],state.tiers))+'</article>').join('')+'</div><div class="op-result-cta">'+button('tab-tier','티어표에서 참가자 분류하기')+'</div>';
  return '<div class="op-teams '+(animating?'op-draft-animating':'')+'">'+state.teams.map((team,i)=>{
    const currentStats=animating?teamStats([],state.tiers):stats[i];
    return '<article class="op-team" data-team="'+i+'">'+teamHeader(i,currentStats.score)+'<div class="op-team-players">'+team.map(n=>player(n,'result')).join('')+'</div>'+teamFooter(currentStats)+'</article>'
  }).join('')+'</div>';
}
function feedback(message,kind='success'){
  let region=root.querySelector('.op-feedback');
  if(!region){region=document.createElement('div');region.className='op-feedback';region.setAttribute('role','status');root.append(region)}
  clearTimeout(feedbackTimer);region.dataset.kind=kind;region.textContent=message;region.classList.remove('op-feedback-visible');void region.offsetWidth;region.classList.add('op-feedback-visible');
  feedbackTimer=setTimeout(()=>region.remove(),2200);
}
let feedbackTimer=0;
function resultText(){
  return state.teams.map((team,i)=>{
    const coach=byId.get(state.roles[i+1]),stats=teamStats(team,state.tiers);
    return (coach?.name||'감독 '+(i+1))+' 팀 - '+stats.score+'점\n'+team.map(n=>display(n)+' - '+state.tiers[n]+' 티어').join('\n')+'\n'+TIERS.map(t=>t+' '+stats.counts[t]+'명').join(' / ');
  }).join('\n\n');
}
async function copyResults(){
  if(draftRun||state.teams.length!==4||root.querySelector('.op-copy-overlay'))return;
  const value=resultText();let copied=false;
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);copied=true}}catch(_){}
  if(!copied){const field=document.createElement('textarea');field.value=value;field.className='op-copy-temp';field.setAttribute('readonly','');root.append(field);field.select();try{copied=document.execCommand('copy')}catch(_){}field.remove()}
  if(copied){if(root.classList.contains('active')&&tab==='result')feedback('팀 명단 복사 완료');return}
  if(!root.classList.contains('active')||tab!=='result')return;
  const overlay=document.createElement('div');overlay.className='op-overlay op-copy-overlay';overlay.innerHTML='<div class="op-copy-dialog" role="dialog" aria-modal="true" aria-label="팀 명단 복사"><div class="op-config-head"><strong>팀 명단 복사</strong>'+button('close-copy','닫기')+'</div><textarea readonly aria-label="팀 명단"></textarea></div>';
  root.append(overlay);const field=overlay.querySelector('textarea');field.value=value;field.focus();field.select();feedback('자동 복사를 사용할 수 없습니다. 명단을 선택해 복사하세요.','error');
}
function updateTeamScore(run,panel,stats,n){
  const score=panel.querySelector('[data-op-team-score]'),delta=SCORE[state.tiers[n]]||0;
  score.textContent=stats.score+'점';
  if(!reducedMotion()&&delta){
    score.animate?.([{transform:'translateY(3px) scale(.94)',filter:'brightness(1.6)'},{transform:'translateY(-2px) scale(1.1)'},{transform:'none',filter:'none'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
    const gain=document.createElement('span');gain.className='op-score-gain';gain.textContent='+'+delta;gain.setAttribute('aria-hidden','true');score.parentElement.append(gain);draftLater(run,300,()=>gain.remove());
  }
  panel.querySelectorAll('footer [data-tier]').forEach(x=>{const count=stats.counts[x.dataset.tier],label=x.querySelector('b');if(label&&label.textContent!==String(count)){label.textContent=String(count);x.setAttribute('aria-label',x.dataset.tier+' 티어 '+count+'명');if(!reducedMotion())x.animate?.([{transform:'scale(.94)',filter:'brightness(1.6)'},{transform:'none',filter:'none'}],{duration:220})}});
}
function draftScale(){return root.offsetWidth?root.getBoundingClientRect().width/root.offsetWidth||1:1}
function draftPoint(r){const o=root.getBoundingClientRect(),z=draftScale();return{x:(r.left+r.width/2-o.left)/z,y:(r.top+r.height/2-o.top)/z,w:r.width/z,h:r.height/z}}
function draftCenter(){
  const o=root.getBoundingClientRect(),z=draftScale(),top=Math.max(o.top,0),bottom=Math.min(o.bottom,innerHeight-35);
  return{x:root.clientWidth/2,y:Math.max(95,(top+Math.max(top+150,bottom))/2/z-o.top/z)};
}
function draftLayer(run){
  run.layer?.remove();const layer=document.createElement('div');layer.className='op-draft-layer';layer.setAttribute('aria-hidden','true');root.append(layer);run.layer=layer;return layer;
}
function draftCard(run,point,source=null){
  const c=document.createElement('div');c.className='op-draft-token';c.style.cssText='left:'+point.x+'px;top:'+point.y+'px;width:'+point.w+'px;height:'+point.h+'px;';
  if(source){const face=source.querySelector('.op-card-front')?.cloneNode(true);if(face)c.append(face)}
  c.insertAdjacentHTML('beforeend',cardBack());run.layer.append(c);return c;
}
function draftAnimation(run,c,frames,options){const effect=c.animate(frames,options);run.animations.push(effect);return effect}
function draftPhase(run,phase){run.phase=phase;root.querySelector('.op-shell')?.setAttribute('data-draft-phase',phase)}
function finishDraft(show=true){
  const run=draftRun;if(!run)return;
  run.timers.forEach(clearTimeout);run.animations.forEach(a=>a.cancel());run.layer?.remove();draftRun=null;root.classList.remove('op-drafting');root.querySelectorAll('.op-draft-source').forEach(c=>c.classList.remove('op-draft-source'));
  if(show){tab='result';render()}
}
function startDraft(){
  if(draftRun||rankLock||configDraft)return;sync();if(!available())return;
  const oldCards=new Map([...root.querySelectorAll('.op-board .op-player,.op-team .op-player')].map(c=>[c.dataset.opPlayer,c]));
  const teams=balancedDraft(state.tiers);
  if(teams.length!==4||teams.some(t=>t.length!==5)||new Set(teams.flat()).size!==20)return;
  state.teams=teams;lastMove=null;choosingMode=false;guided=false;notice='';save();
  if(reducedMotion()||typeof root.animate!=='function'||document.hidden){tab='result';render();return}
  clearHover();const run={timers:[],animations:[],layer:null,phase:'collect',dealt:[[],[],[],[]]};draftRun=run;root.classList.add('op-drafting');draftPhase(run,'collect');
  const draft=root.querySelector('[data-op-action="draft"]');if(draft)draft.disabled=true;
  root.querySelector('[data-op-action="copy-results"]')?.remove();root.querySelector('.op-actions')?.insertAdjacentHTML('beforeend',button('skip-draft','연출 건너뛰기','class="op-skip-draft"'));
  draftLayer(run);const center=draftCenter();
  ROSTER.forEach((n,i)=>{
    const source=oldCards.get(n),r=source?.getBoundingClientRect(),clip=source?.closest('.op-player-grid')?.getBoundingClientRect(),visible=r&&r.width&&r.height&&r.bottom>0&&r.top<innerHeight&&(!clip||r.bottom>clip.top&&r.top<clip.bottom);
    const point=visible?draftPoint(r):{x:center.x+(i%5-2)*36,y:center.y+75,w:80,h:104};
    const token=draftCard(run,point,visible?source:null);token.dataset.tier=state.tiers[n];
    if(visible)source.classList.add('op-draft-source');
    token.classList.add('op-draft-collect-token');
    const dx=center.x-point.x+(i%2?1:-1)*(i%5)*2,dy=center.y-point.y-i*.55;
    draftAnimation(run,token,[{transform:'translate(-50%,-50%) rotate(0deg) scale(1)'},{transform:'translate(-50%,-50%) translate('+dx+'px,'+dy+'px) rotate('+(i%5-2)*3+'deg) scale(.72)'}],{duration:400,easing:'cubic-bezier(.3,.7,.3,1)',fill:'forwards'});
  });
  draftLater(run,400,()=>shuffleDraft(run));
}
function shuffleDraft(run){
  tab='result';draftRender=true;render();draftRender=false;draftPhase(run,'shuffle');draftLayer(run);
  const center=draftCenter(),width=Math.min(115,Math.max(65,root.clientWidth/8)),height=width*1.29;
  for(let i=0;i<20;i++){
    const c=draftCard(run,{...center,w:width,h:height});c.classList.add('op-draft-back-only');
    const group=i%2?1:-1,stagger=i*5;
    draftAnimation(run,c,[
      {transform:'translate(-50%,-50%) translateY('+(-i*.5)+'px)'},
      {offset:.32,transform:'translate(-50%,-50%) translateX('+(group*width*.82)+'px) rotate('+(-group*20)+'deg)'},
      {offset:.65,transform:'translate(-50%,-50%) translate('+(-group*width*.64)+'px,'+(group*height*.18)+'px) rotate('+(group*15)+'deg)'},
      {transform:'translate(-50%,-50%) translateY('+(-i*.5)+'px)'}
    ],{duration:900,delay:stagger,easing:'ease-in-out',fill:'both'});
  }
  draftLater(run,1000,()=>{draftPhase(run,'highlight');root.querySelector('.op-teams')?.classList.add('op-draft-highlight');draftLater(run,300,()=>dealDraft(run))});
}
function dealDraft(run){
  draftPhase(run,'deal');root.querySelector('.op-teams')?.classList.remove('op-draft-highlight');
  const center=draftCenter(),stack=[...run.layer.children],targets=[...root.querySelectorAll('.op-team .op-player')],byName=new Map(targets.map(c=>[c.dataset.opPlayer,c]));
  const order=[];for(let j=0;j<5;j++)for(let t=0;t<4;t++)order.push([t,state.teams[t][j]]);
  order.forEach(([team,n],i)=>draftLater(run,i*90,()=>{
    const target=byName.get(n),token=stack.pop();if(!target||!token)return;
    const d=draftPoint(target.getBoundingClientRect()),w=token.offsetWidth||95,h=token.offsetHeight||120,dx=d.x-center.x,dy=d.y-center.y;
    token.getAnimations().forEach(a=>a.cancel());token.classList.add('op-draft-deal-token');
    draftAnimation(run,token,[{transform:'translate(-50%,-50%) scale(1)',opacity:1},{offset:.65,transform:'translate(-50%,-50%) translate('+dx*.82+'px,'+dy*.82+'px) scale(.85) rotateY(0deg)',opacity:1},{transform:'translate(-50%,-50%) translate('+dx+'px,'+dy+'px) scale('+d.w/w+','+d.h/h+') rotateY(85deg)',opacity:.1}],{duration:280,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});
    draftLater(run,280,()=>{
      token.remove();target.classList.add('op-draft-dealt');run.dealt[team].push(n);
      const panel=root.querySelector('.op-team[data-team="'+team+'"]'),stats=teamStats(run.dealt[team],state.tiers);
      if(!panel)return;updateTeamScore(run,panel,stats,n);
      if(run.dealt[team].length===5)panel.classList.add('op-draft-team-complete');
    });
  }));
  draftLater(run,2100,()=>{draftPhase(run,'complete');root.querySelector('.op-teams')?.classList.add('op-draft-all-complete');draftLater(run,900,()=>finishDraft(true))});
}
function render(){
  if(!root.classList.contains('active'))return;
  if(!workspaceReady){
    clearHover();
    root.innerHTML='<div class="op-shell"><div class="op-result-empty">'+(workspaceError?'인물 설정을 불러오지 못했습니다. '+button('retry','다시 시도'):'<span class="op-loading-indicator" aria-hidden="true"></span>참가자 정보를 불러오는 중…')+'</div></div>';return;
  }
  if(rankLock||draftRun&&!draftRender)return;
  const view=tab+(choosingMode?':choice':guided?':guided':'');
  const entering=lastView!==view;
  const scrolls=lastView===view?Object.fromEntries([...root.querySelectorAll('.op-tier-row')].map(r=>[r.dataset.tier,r.querySelector('.op-player-grid')?.scrollTop||0])):{};
  lastView=view;
  sync();const assigned=ROSTER.filter(n=>TIERS.includes(state.tiers[n])).length;
  const action=tab==='roster'||guided||choosingMode?'':button('draft',state.teams.length?'다시 자동 드래프트':'자동 드래프트','class="op-primary" '+(!available()||draftRun?'disabled':''))+(draftRun?button('skip-draft','연출 건너뛰기','class="op-skip-draft"'):tab==='result'&&state.teams.length===4?button('copy-results','명단 복사'):'');
  const scoreSpread=state.teams.length?Math.max(...state.teams.map(t=>teamStats(t,state.tiers).score))-Math.min(...state.teams.map(t=>teamStats(t,state.tiers).score)):null;
  const status=notice||(saveFailed?'브라우저 저장 불가':missing.length?'연락처 미연결 '+missing.length+'명 · 관리자 설정이 필요합니다.':'');
  const previousTab=root.querySelector('.op-tabs [aria-pressed="true"]')?.getBoundingClientRect();
  clearHover();
  root.innerHTML='<div class="op-shell'+(entering?' op-view-enter':'')+'" data-view="'+tab+'"><div class="op-toolbar"><span class="op-page-label">오퍼 M</span><nav class="op-tabs" aria-label="오퍼 M 도구">'+[['roster','참가자'],['tier','티어표'],['result','가상 드래프트']].map(([id,label])=>button('tab-'+id,label,'aria-pressed="'+(tab===id)+'"')).join('')+'</nav><div class="op-actions">'+(tab==='tier'?'<span class="op-progress">'+assigned+' / 20</span>':tab==='result'&&!draftRun&&scoreSpread!==null?'<span class="op-progress">점수 차이 <b>'+scoreSpread+'</b></span>':'')+action+(canConfigure()?button('open-config','인물 설정','class="op-settings" aria-label="관리자 인물 설정"'):'')+'</div></div>'+(status?'<div class="op-status" role="status">'+esc(status)+'</div>':'')+(tab==='roster'?roster():tab==='tier'?(choosingMode?modeChoice():guided?guidedBoard():tierBoard()):results())+adminConfig()+'</div>';
  for(const r of root.querySelectorAll('.op-tier-row')){const g=r.querySelector('.op-player-grid');if(g&&scrolls[r.dataset.tier])g.scrollTop=scrolls[r.dataset.tier]}
  updateSelection();
  animateTab(previousTab);
  lastSignature=signature();
  const moved=arrived;
  arrived='';
  measureLayout();
  if(layoutFrame)cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(()=>{measureLayout();if(moved&&tab==='tier'&&!guided){const card=[...root.querySelectorAll('.op-board .op-player,.op-pool .op-player')].find(x=>x.dataset.opPlayer===moved);if(card){const grid=card.closest('.op-player-grid');if(grid&&grid.scrollHeight>grid.clientHeight){const r=card.getBoundingClientRect(),g=grid.getBoundingClientRect();if(r.bottom>g.bottom)grid.scrollTop+=r.bottom-g.bottom+8;else if(r.top<g.top)grid.scrollTop-=g.top-r.top+8}card.focus({preventScroll:true})}}});
}
function measureLayout(){
  if(!root.classList.contains('active'))return;
  const area=root.querySelector('.op-teams,.op-board,.op-guided');if(!area)return;
  const rect=area.getBoundingClientRect(),rootRect=root.getBoundingClientRect(),scale=root.offsetWidth?rootRect.width/root.offsetWidth||1:1;
  const access=document.getElementById('mwsAccessTools'),accessRect=access?.getBoundingClientRect(),viewport=window.visualViewport;
  const viewportBottom=viewport?Math.min(innerHeight,viewport.offsetTop+viewport.height):innerHeight;
  const bottom=accessRect&&accessRect.height&&accessRect.top>0?Math.min(viewportBottom-14,accessRect.top-10):viewportBottom-18;
  // Relative coordinates remain stable when a long board is scrolled off the viewport.
  const rootTop=Math.max(0,rootRect.top),areaTop=rootTop+Math.max(0,rect.top-rootRect.top);
  const available=Math.max(180,(bottom-areaTop)/scale);
  const set=(key,value)=>{const next=Math.floor(value)+'px';if(root.style.getPropertyValue(key)!==next)root.style.setProperty(key,next)};
  set('--op-available',available);set('--op-workspace-height',Math.max(240,(bottom-rootTop)/scale));
  if(area.classList.contains('op-guided')){
    const stage=area.querySelector('.op-guided-stage'),card=area.querySelector('.op-reveal-card'),width=stage?.clientWidth||area.clientWidth;
    const style=getComputedStyle(area),stageStyle=stage?getComputedStyle(stage):null;
    const gap=parseFloat(style.rowGap)||0,padding=(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0);
    const children=[...area.children].filter(el=>!el.hidden&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).position!=='absolute');
    const chrome=children.filter(el=>el!==stage).reduce((sum,el)=>sum+el.getBoundingClientRect().height/scale,0)+gap*Math.max(0,children.length-1)+padding;
    const stagePadding=stageStyle?(parseFloat(stageStyle.paddingTop)||0)+(parseFloat(stageStyle.paddingBottom)||0):0;
    const cardChrome=card?Math.max(32,card.offsetHeight-(card.querySelector('.op-portrait')?.offsetHeight||0)):44;
    set('--op-guided-card',Math.max(132,Math.min(560,width-24,available-chrome-stagePadding-cardChrome-10)));
  }
}
function scheduleMeasure(){if(layoutFrame)cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(()=>{layoutFrame=0;measureLayout()})}
window.addEventListener('resize',scheduleMeasure);
window.visualViewport?.addEventListener('resize',scheduleMeasure);
if(typeof ResizeObserver==='function'){let lastWidth=-1;new ResizeObserver(()=>{if(root.classList.contains('active')&&root.clientWidth!==lastWidth){lastWidth=root.clientWidth;scheduleMeasure()}}).observe(root)}
function signature(){return JSON.stringify(ROSTER.map(n=>{const c=current(n);return[c?.id,c?.name,c?.image]}).concat(state.roles.map(id=>{const c=byId.get(id);return[c?.id,c?.name,c?.image]})))}
function updateSelection(){
  root.querySelectorAll('.op-player[aria-pressed]').forEach(b=>{const on=b.dataset.opPlayer===selected,was=b.classList.contains('op-selected');b.classList.toggle('op-selected',on);b.setAttribute('aria-pressed',String(on));if(on!==was&&!reducedMotion()){b.querySelector('.op-card-front')?.animate?.(on?[{filter:'brightness(1.25)',transform:'scale(.97)'},{filter:'none',transform:'none'}]:[{opacity:.82},{opacity:1}],{duration:180,easing:'ease-out'})}});
  const board=root.querySelector('.op-board');if(board)board.classList.toggle('op-awaiting-drop',!!selected);
  root.querySelector('.op-pool')?.classList.toggle('op-awaiting-drop',!!selected);
  const back=root.querySelector('.op-pool [data-op-tier=""]');if(back)back.disabled=!selected;
  const progress=root.querySelector('.op-progress');if(progress&&tab==='tier'&&!guided){progress.textContent=selected?display(selected)+' · 티어 선택':ROSTER.filter(n=>TIERS.includes(state.tiers[n])).length+' / 20'}
}
function refreshBoard(n,from,to){
  const pool=root.querySelector('.op-pool'),board=root.querySelector('.op-board'),card=findBoardCard(n);
  if(!pool||!board||!card){arrived=n;render();return}
  clearHover();const cards=boardCards(),animate=!reducedMotion()&&typeof card.animate==='function';
  cards.forEach(c=>{c.getAnimations?.().filter(a=>a.id==='op-board-flip').forEach(a=>a.cancel());c.classList.remove('op-tilt','op-dragging','op-arrived')});
  const before=animate?new Map(cards.map(c=>[c,c.getBoundingClientRect()])):null;
  const getRegion=t=>t?[...board.querySelectorAll('.op-tier-row')].find(r=>r.dataset.tier===t):pool;
  const source=getRegion(from),target=getRegion(to);
  if(!source||!target){arrived=n;render();return}
  let grid=target.querySelector('.op-player-grid');
  if(!grid){grid=document.createElement('div');grid.className='op-player-grid';target.append(grid)}
  grid.querySelector('.op-empty')?.remove();
  const next=[...grid.querySelectorAll('.op-player')].find(c=>ROSTER.indexOf(c.dataset.opPlayer)>ROSTER.indexOf(n));
  grid.insertBefore(card,next||null);
  card.dataset.rarity=to?RANK_STYLE[to]:'neutral';
  if(to)card.dataset.tier=to;else delete card.dataset.tier;
  card.setAttribute('aria-label',display(n)+(to?' '+to+' 티어':' 미분류'));
  card.querySelector('.op-chip')?.remove();
  if(to)card.querySelector('.op-card-front')?.insertAdjacentHTML('beforeend',cardBadge(to));
  for(const t of new Set([from,to])){
    const region=getRegion(t),g=region.querySelector('.op-player-grid'),count=g?.querySelectorAll('.op-player').length||0;
    region.dataset.count=String(count);
    if(t){region.querySelector('.op-rank-meta b').textContent=count+'명';pulseCount(region.querySelector('.op-rank-meta b'));if(count){g.tabIndex=0;g.setAttribute('aria-label',t+' 티어 참가자 '+count+'명')}else{g.removeAttribute('tabindex');g.removeAttribute('aria-label');g.innerHTML=emptySlot(t)}}
    else{region.classList.toggle('op-pool-empty',!count);region.querySelector('h2 small').textContent=String(count);pulseCount(region.querySelector('h2 small'));if(!count)g?.remove()}
  }
  const actions=pool.querySelector('.op-pool-actions'),undo=actions.querySelector('[data-op-action="undo-move"]');
  if(lastMove&&!undo)actions.querySelector('[data-op-action="reset"]').insertAdjacentHTML('beforebegin',button('undo-move','되돌리기'));
  else if(!lastMove)undo?.remove();
  const draft=root.querySelector('[data-op-action="draft"]');if(draft){draft.disabled=!available();draft.textContent=state.teams.length?'다시 자동 드래프트':'자동 드래프트'}
  root.querySelectorAll('.op-drop-active').forEach(x=>x.classList.remove('op-drop-active'));
  updateSelection();measureLayout();
  const movedGrid=card.closest('.op-player-grid');
  if(movedGrid&&movedGrid.scrollHeight>movedGrid.clientHeight){const r=card.getBoundingClientRect(),g=movedGrid.getBoundingClientRect();if(r.bottom>g.bottom)movedGrid.scrollTop+=r.bottom-g.bottom+8;else if(r.top<g.top)movedGrid.scrollTop-=g.top-r.top+8}
  card.focus({preventScroll:true});
  if(before)for(const c of cards){const old=before.get(c),now=c.getBoundingClientRect();if(!old||!now.width||!now.height)continue;const scale=root.offsetWidth?root.getBoundingClientRect().width/root.offsetWidth:1,dx=(old.left-now.left)/(scale||1),dy=(old.top-now.top)/(scale||1),sx=old.width/now.width,sy=old.height/now.height;if(Math.abs(dx)+Math.abs(dy)<1&&Math.abs(sx-1)+Math.abs(sy-1)<.02)continue;const effect=c.animate([{transformOrigin:'top left',transform:'translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')'},{transformOrigin:'top left',transform:'none'}],{duration:c===card?300:220,easing:'cubic-bezier(.2,.75,.2,1)'});effect.id='op-board-flip'}
  if(animate){card.classList.add('op-board-confirm');card.querySelector('.op-card-front')?.addEventListener('animationend',()=>card.classList.remove('op-board-confirm'),{once:true});}
}
function move(n,t){
  if(!ROSTER.includes(n)||!current(n)||(t&&!TIERS.includes(t))||guided||choosingMode||configDraft)return;
  const from=state.tiers[n]||'';
  if(from===t){selected='';updateSelection();return}
  lastMove={n,from,to:t};
  if(t)state.tiers[n]=t;else delete state.tiers[n];
  state.teams=[];selected='';notice='';save();refreshBoard(n,from,t);
}
function showPicker(n){picker=n;query='';render();root.querySelector('[data-op-search]')?.focus()}
// Only the hovered portrait moves; pointer position is never used for game state.
const hoverFine=matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
let hoverCard=null,hoverFrame=0,hoverPoint=null,hoverRect=null;
function clearHover(){
  if(hoverFrame)cancelAnimationFrame(hoverFrame);hoverFrame=0;hoverPoint=null;hoverRect=null;
  if(hoverCard){hoverCard.classList.remove('op-tilt');for(const key of ['--op-rx','--op-ry','--op-light-x','--op-light-y'])hoverCard.style.removeProperty(key);hoverCard=null}
}
function pulseCount(el){if(!reducedMotion())el?.animate?.([{transform:'translateY(2px)',opacity:.65},{transform:'translateY(-2px)',opacity:1},{transform:'none'}],{duration:200,easing:'ease-out'})}
function animateTab(previous){
  if(!previous||reducedMotion())return;
  const tabs=root.querySelector('.op-tabs'),active=tabs?.querySelector('[aria-pressed="true"]');if(!active)return;
  const next=active.getBoundingClientRect(),parent=tabs.getBoundingClientRect(),scale=draftScale();
  if(Math.abs(previous.left-next.left)+Math.abs(previous.top-next.top)<2)return;
  const indicator=document.createElement('span');indicator.className='op-tab-travel';indicator.setAttribute('aria-hidden','true');indicator.style.cssText='left:'+((next.left-parent.left)/scale)+'px;top:'+((next.bottom-parent.top)/scale-3)+'px;width:'+(next.width/scale)+'px';tabs.append(indicator);
  const anim=indicator.animate?.([{transform:'translate('+((previous.left-next.left)/scale)+'px,'+((previous.top-next.top)/scale)+'px) scaleX('+previous.width/next.width+')',opacity:1},{transform:'none',opacity:1},{opacity:0}],{duration:240,easing:'cubic-bezier(.2,.75,.2,1)'});if(anim)anim.onfinish=()=>indicator.remove();else indicator.remove();
}
root.addEventListener('pointermove',e=>{
  if(!hoverFine.matches||dragName||draftRun||rankLock)return;
  const card=e.target.closest('.op-player[data-rarity]');if(!card||!root.contains(card)){clearHover();return}
  if(hoverCard!==card){clearHover();hoverCard=card;hoverRect=card.getBoundingClientRect()}
  hoverPoint={x:e.clientX,y:e.clientY};if(hoverFrame)return;
  hoverFrame=requestAnimationFrame(()=>{hoverFrame=0;const c=hoverCard,r=hoverRect,p=hoverPoint;if(!c?.isConnected||!r?.width||!r.height||!p)return;
    const x=Math.max(0,Math.min(1,(p.x-r.left)/r.width)),y=Math.max(0,Math.min(1,(p.y-r.top)/r.height));
    c.style.setProperty('--op-rx',((.5-y)*9).toFixed(2)+'deg');c.style.setProperty('--op-ry',((x-.5)*9).toFixed(2)+'deg');c.style.setProperty('--op-light-x',(x*100).toFixed(1)+'%');c.style.setProperty('--op-light-y',(y*100).toFixed(1)+'%');c.classList.add('op-tilt');
  });
});
root.addEventListener('pointerout',e=>{if(hoverCard&&!hoverCard.contains(e.relatedTarget))clearHover()});
root.addEventListener('pointerleave',clearHover);
root.addEventListener('scroll',clearHover,true);
window.addEventListener('resize',clearHover);
root.addEventListener('click',e=>{
  const b=e.target.closest('button');if(draftRun){const action=b?.dataset.opAction;if(action==='skip-draft'){finishDraft(true);return}if(!['tab-roster','tab-tier','tab-result'].includes(action))return;finishDraft(false)}if(b?.hasAttribute('data-op-draw')&&root.contains(b)){drawCard(Number(b.dataset.opDraw));return}if(!b||!root.contains(b)){const target=e.target.closest('.op-tier-row');if(target&&selected&&!rankLock)move(selected,target.dataset.tier);else if(e.target.closest('.op-pool')&&selected&&!rankLock)move(selected,'');return;}
  const n=b.dataset.opPlayer;
  if(n){if(b.dataset.opResult||tab!=='tier'||!current(n))return;selected=selected===n?'':n;notice='';updateSelection();return}
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
  if(b.dataset.opAssign){if(e.detail<=1)confirmRank(b.dataset.opAssign,b);return}
  if(rankLock&&b.dataset.opAction==='skip-guided'){clearRankMotion();rankLock=false;skipMotion=true;deckPhase='pick';if(!queue.length)guided=false;render();if(guided&&fastDraw)drawCard(Math.floor(Math.random()*queue.length));return}
  if(rankLock){if(!['choose-mode','exit-guided','tab-roster','tab-tier','tab-result'].includes(b.dataset.opAction))return;clearRankMotion();rankLock=false;deckPhase='pick';}
  switch(b.dataset.opAction){
    case 'choose-mode':chooseMode();break;
    case 'start-guided':lastMove=null;startGuided();break;
    case 'shuffle-guided':if(guided&&deckPhase==='pick')shuffleDeck();break;
    case 'draw-random':if(guided&&deckPhase==='pick')drawCard(Math.floor(Math.random()*queue.length));break;
    case 'toggle-fast':if(guided){fastDraw=!fastDraw;if(fastDraw&&deckPhase==='pick')drawCard(Math.floor(Math.random()*queue.length));else render()}break;
    case 'skip-guided':if(guided){skipMotion=!skipMotion;if(skipMotion&&deckPhase==='shuffle'){stopShuffle();render();if(fastDraw)drawCard(Math.floor(Math.random()*queue.length))}else render()}break;
    case 'start-list':stopShuffle();choosingMode=false;guided=false;tab='tier';selected='';notice='';render();break;
    case 'undo-move':{const m=lastMove;lastMove=null;if(m&&current(m.n)&&(state.tiers[m.n]||'')===m.to){if(m.from)state.tiers[m.n]=m.from;else delete state.tiers[m.n];state.teams=[];selected='';save();refreshBoard(m.n,m.to,m.from)}break;}
    case 'exit-guided':stopShuffle();choosingMode=false;guided=false;render();break;
    case 'undo-guided':{const n=guidedHistory.pop();if(n){stopShuffle();delete state.tiers[n];state.teams=[];queue=[n,...queue.filter(x=>x!==n)];guided=true;deckPhase='reveal';save();render()}break;}
    case 'retry':void enter();break;
    case 'tab-roster':stopShuffle();choosingMode=false;guided=false;tab='roster';selected='';notice='';render();break;
    case 'tab-tier':stopShuffle();choosingMode=false;guided=false;tab='tier';selected='';notice='';render();break;
    case 'tab-result':stopShuffle();choosingMode=false;guided=false;tab='result';selected='';notice='';render();break;
    case 'open-config':if(canConfigure()){configDraft={links:{...state.links},roles:[...state.roles]};notice='';render();root.querySelector('.op-config-head button')?.focus()}break;
    case 'close-config':if(!configSaving){configDraft=null;picker='';notice='';render()}break;
    case 'save-config':void saveConfig();break;
    case 'close-picker':picker='';query='';render();break;
    case 'reset':if(!confirm('20명의 티어와 가상 팀 결과를 초기화할까요?'))return;stopShuffle();state.tiers={};state.teams=[];lastMove=null;choosingMode=false;guided=false;selected='';notice='';save();render();break;
    case 'draft':startDraft();break;
    case 'copy-results':void copyResults();break;
    case 'close-copy':root.querySelector('.op-copy-overlay')?.remove();root.querySelector('[data-op-action="copy-results"]')?.focus({preventScroll:true});break;
  }
});
root.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement)e.target.style.visibility='hidden'},true);
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.querySelector('.op-copy-overlay')){root.querySelector('.op-copy-overlay')?.remove();root.querySelector('[data-op-action="copy-results"]')?.focus({preventScroll:true})}else if(e.key==='Escape'&&dragName){clearDrag(true)}else if(e.key==='Escape'&&picker){picker='';query='';render()}else if(e.key==='Escape'&&configDraft&&!configSaving){configDraft=null;notice='';render()}else if(e.key==='Escape'&&selected){selected='';updateSelection()}});
window.addEventListener('keydown',e=>{if(!root.classList.contains('active')||!guided||deckPhase!=='reveal'||rankLock||configDraft||e.repeat||e.ctrlKey||e.altKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||'')||e.target?.isContentEditable)return;const i=Number(e.key)-1;if(/^[1-5]$/.test(e.key)&&TIERS[i]){e.preventDefault();root.querySelector('[data-op-assign="'+TIERS[i]+'"]')?.click()}});
root.addEventListener('input',e=>{
  if(!e.target.hasAttribute('data-op-search'))return;
  query=e.target.value;const box=root.querySelector('.op-picker-results'),temp=document.createElement('div');temp.innerHTML=pickerHtml();box.replaceChildren(...temp.querySelector('.op-picker-results').childNodes);
});
function clearDrag(cancelled=false){
  const c=dragCard;dragName='';dragCard=null;dragOrigin=null;
  root.querySelectorAll('.op-drop-active,.op-dragging,.op-drag-source').forEach(x=>x.classList.remove('op-drop-active','op-dragging','op-drag-source'));
  if(cancelled&&c?.isConnected&&!reducedMotion()&&c.animate)c.animate([{transform:'translateY(-5px) scale(1.035)',opacity:.5},{transform:'none',opacity:1}],{duration:190,easing:'ease-out'});
}
root.addEventListener('dragstart',e=>{const b=e.target.closest('[data-op-player]');if(!b||!current(b.dataset.opPlayer)||b.dataset.opResult||guided||choosingMode||configDraft||tab!=='tier'){e.preventDefault();return}dragName=b.dataset.opPlayer;dragCard=b;dragOrigin=b.closest('[data-op-drop]');e.dataTransfer.setData('text/plain',dragName);e.dataTransfer.effectAllowed='move';b.classList.remove('op-tilt');requestAnimationFrame(()=>{if(dragCard===b){b.classList.add('op-dragging');dragOrigin?.classList.add('op-drag-source')}})});
root.addEventListener('dragover',e=>{const r=e.target.closest('[data-op-drop]');if(!r||!dragName)return;e.preventDefault();e.dataTransfer.dropEffect='move';root.querySelectorAll('.op-drop-active').forEach(x=>{if(x!==r)x.classList.remove('op-drop-active')});r.classList.add('op-drop-active')});
root.addEventListener('drop',e=>{const r=e.target.closest('[data-op-drop]');if(!r||!dragName)return;e.preventDefault();const n=dragName,t=r.dataset.opDrop;clearDrag(false);move(n,t)});
root.addEventListener('dragleave',e=>{const r=e.target.closest('[data-op-drop]');if(r&&!r.contains(e.relatedTarget))r.classList.remove('op-drop-active')});
root.addEventListener('dragend',()=>clearDrag(!!dragName));
window.addEventListener('mws:workspace-tab-v1',e=>{if(e.detail?.tab==='operationM'){const title=document.getElementById('pageTitle');if(title)title.textContent='오퍼 M';void enter()}else{clearHover();finishDraft(false);stopShuffle();clearDrag(false);clearRankMotion();rankLock=false;tab='roster';choosingMode=false;guided=false;selected='';picker='';configDraft=null}});
window.addEventListener('mws:app-ready',()=>{finishDraft(false);workspaceReady=false;configDraft=null;picker='';if(root.classList.contains('active'))void enter()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)return;clearHover();if(draftRun)finishDraft(true);if(rankLock){clearRankMotion();rankLock=false;deckPhase='pick';if(!queue.length)guided=false;render()}if(deckPhase==='shuffle'){stopShuffle();if(guided)render()}});
window.addEventListener('mawang:datachange',()=>window.mwsOperationM?.refresh());
window.mwsOperationM={render,refresh(){if(!root.classList.contains('active')||!workspaceReady)return;sync();if(signature()!==lastSignature){finishDraft(false);render()}}};
if(root.classList.contains('active'))void enter();
}
