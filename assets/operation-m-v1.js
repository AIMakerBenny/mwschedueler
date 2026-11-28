import {ROSTER,ROLE_NAMES,TIERS,SCORE,normalizeState,syncContacts,matchContact,balancedDraft,teamStats,rosterContactName} from './operation-m-model-v1.js?v=2';
const root=document.getElementById('operationM');
if(root){
const KEY='mws.operationM.simulation.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{return normalizeState(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){return normalizeState(null)}};
let state=read(),tab='command',selected='',dragName='',picker='',query='',notice='',lastSignature='',saveFailed=false;
let configDraft=null,configSaving=false,configBaseline=null,configArt={},configDiscard=false,configPending=false,configNotice='',workspaceReady=false,workspaceLoading=false,workspaceError=false;
let arrived='',layoutFrame=0,queue=[],guided=false,choosingMode=false,rankLock=false,rankTimer=0;
let lastView='',guidedHistory=[],lastMove=null;
let guidedResume=null,workspaceLoadEpoch=0,workspaceWasActive=root.classList.contains('active'),resumeOnEnter=false;
let resetDialog=null,resetSettle=null,resetHold=false,pendingRefresh=false,lastPermission=false,commandImageKeys=new Map();
let rankEffects=[],rankClock=0,rankCompletion=null;
let draftRun=null,draftRender=false;
const draftLater=(run,ms,fn)=>{run.timers.push(setTimeout(()=>{if(draftRun===run&&root.classList.contains('active'))fn()},ms))};
function clearRankMotion(){clearTimeout(rankTimer);rankTimer=0;cancelAnimationFrame(rankClock);rankClock=0;rankEffects.forEach(a=>a.cancel());rankEffects=[];rankCompletion=null;root.querySelectorAll('.op-rank-beam').forEach(x=>x.remove())}
// Absolute offsets on a common clock. No chained holds or per-tier speed differences.
const MOTION=Object.freeze({shuffle:3000,draw:470,flipStart:250,flip:440,rankEnd:1160,flightStart:780,flight:380,portraitStart:0,portraitEnd:250,materialStart:0,nameStart:0,badgeStart:0});
function onTimeline(node,frames,opts,origin,collection){
  const a=node.animate(frames,{fill:'both',...opts});collection.push(a);
  if(origin!=null)a.startTime=origin;
  return a;
}
let deckPhase='pick',deckEpoch=0,paused=false,deckEffects=[],deckTimers=[],rebuildingGuided=false,guidedMode='full',motionTrace=[];
function motionPreference(){return 'full'}
function markMotion(phase,tier=''){motionTrace.push({phase,tier,mode:guidedMode,at:performance.now()});if(motionTrace.length>512)motionTrace.shift()}
function canSkipGuided(){return ['shuffle','draw','flip','confirm'].includes(deckPhase)}
const guidedFull=()=>guidedMode==='full';
function stopShuffle(){
  deckEpoch++;deckEffects.forEach(a=>a.cancel());deckEffects=[];deckTimers.forEach(clearTimeout);deckTimers=[];
  if(['shuffle','draw','flip'].includes(deckPhase))deckPhase='pick';
}
const liveDeck=epoch=>epoch===deckEpoch&&guided&&tab==='tier'&&root.classList.contains('active');
function deckWait(ms,epoch,fn){deckTimers.push(setTimeout(()=>{if(liveDeck(epoch))fn()},ms))}
function deckAnimate(node,frames,opts){const a=node.animate(frames,opts);deckEffects.push(a);return a}

const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const interfaceMotionReduced=()=>reducedMotion()||window.mwsMotionReduced?.()===true;
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
// Confirmed lineup is independent of the legacy simulation and contact settings.
const ART_KEY='operationMArtV1';
const SQUADS=Object.freeze([
  {id:'mudok',name:'머독',coach:'에스카',color:'#f0444d',members:['마왕0216','김웰로','다키','베베리','물초코']},
  {id:'gosegu',name:'고세구',coach:'쪼이',color:'#268df8',members:['뽀린걸','깡담비','박재박','거대별','햇비']},
  {id:'cheonyang',name:'천양',coach:'dg98',color:'#ffb326',members:['리냐_LIN…','난워니','유키라','최또','스위데']},
  {id:'wakgood',name:'우왁굳',coach:'감블러',color:'#b454f2',members:['카푸','고여름_','양지팡','카린야','카노미☆']}
].map(t=>Object.freeze({...t,members:Object.freeze(t.members)})));
const teamByName=name=>SQUADS.find(t=>t.name===String(name).replace(/!$/,''));
const SHORT_NAMES=Object.freeze({'마왕0216':'마왕','리냐_LIN…':'리냐','고여름_':'고여름','카노미☆':'카노'});
const rosterAlias=n=>n==='카린야'?'카린아':SHORT_NAMES[n]||rosterContactName(n);
// Preserve intentional short labels only when the connected contact still matches
// that roster identity. Other names are shown exactly as saved in Contacts.
function agentName(n,links=state.links){const c=confirmedProfile(n,links);if(!c)return rosterAlias(n);if(n==='양지팡'&&c.name===n)return rosterContactName(n);const alias=rosterAlias(n);if(alias!==n){const norm=x=>String(x).normalize('NFKC').trim().toLowerCase();const key=x=>norm(x).replace(/[\s_!☆…\.\-]/g,'');const matches=n.endsWith('…')?key(c.name).startsWith(key(n)):key(c.name)===key(n);if(matches||norm(c.name)===norm(alias))return alias}return c.name}
const squadFor=n=>SQUADS.find(t=>t.members.includes(n));
const commanderUrl=t=>'/assets/operation-m-commander-'+t.id+'.avif?v=18';
let activeSquad='',activeAgent='',artBusy=false,artNotice='';
function agentArt(n){
  const p=getData()?.miniGames?.[ART_KEY]?.players;
  const src=String(Array.isArray(p)?p.find(x=>x?.id===n)?.image||'':'');
  return /^(?:\/media\/workspace\/[A-Za-z0-9_-]+(?:\?v=\d+(?:&h=[a-f0-9]{32})?)?$|data:image\/(?:webp|png|jpeg|avif);base64,[A-Za-z0-9+/=]+$)/.test(src)?src:'';
}
function commanderPortrait(c,name){
  const t=teamByName(name);
  return t?'<span class="op-portrait op-commander-only"><img src="'+commanderUrl(t)+'" alt="" decoding="async" width="512" height="512"></span>':photo(c,name);
}
function tacticalPortrait(n,large=false,preview=undefined){
  const src=preview===undefined?agentArt(n):preview;
  return '<span class="op-agent-portrait'+(large?' op-agent-large':'')+'"><svg class="op-agent-silhouette" aria-hidden="true" viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="34" r="18"/><path d="M14 88c0-23 16-37 36-37s36 14 36 37z"/></svg>'+(src?'<img src="'+esc(src)+'" alt="" decoding="async" loading="'+(large?'eager':'lazy')+'">':'')+'</span>';
}
function squadStyle(t){return ' style="--squad:'+t.color+'"'}
// Shared, single-piece tactical geometry. These are decorative, not military status data.
const squadCode=t=>['A','B','C','D'][SQUADS.indexOf(t)];
function tacEmblem(){
  return '<svg class="op-command-emblem" aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M18 43V21l14 10 14-10v22M24 42V31l8 6 8-6v11" stroke-width="4"/><path d="M9 17C-1 40 15 55 32 58 49 55 65 40 55 17M8 26l8 5M10 36l9 4M16 45l10 3M56 26l-8 5M54 36l-9 4M48 45l-10 3M14 13l3 6M50 13l-3 6"/><path d="m32 3 2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="currentColor" stroke="none"/><path d="m19 6 1 3 4 1-3 2 1 3-3-2-3 2 1-3-3-2 4-1zM45 6l1 3 4 1-3 2 1 3-3-2-3 2 1-3-3-2 4-1z" fill="currentColor" stroke="none"/></svg>';
}
// Original decorative team emblems, not official team logos.
const TEAM_MARKS={
 mudok:'M12 88 26 64 15 42 35 46 30 22 47 35 53 12 66 31 84 23 80 38 107 38 119 49 105 60 88 56 100 67 77 67 68 81 50 96 37 75 12 88ZM26 64l24-9 13-16 17-1M53 12l10 27 20 8 24-9M80 48l9-3 7 5M50 55l13 14 14-2M37 75l13-20 0 41M68 81l-5-12 25-13',
 gosegu:'M8 46 24 30 51 21 72 10 69 28 87 20 82 34 105 34 119 46 106 58 105 48 85 47 73 59 65 81 43 94 45 74 23 80 31 60 8 46ZM24 30l27 6 21-26M31 60l20-24 31-2M51 36l22 23 12-12M82 40l8-2 6 5M45 74l28-15M65 81l-20-7',
 cheonyang:'M11 47 25 24 44 26 48 10 65 23 84 16 91 34 108 36 117 50 106 63 90 64 86 83 65 96 46 87 30 92 31 73 12 64 11 47ZM25 24l15 19 8-33M65 23l-12 20 31-27M40 43l13 0 19 17 18 4M53 43l16-10 22 1M76 43l9 2 5 5M72 60l-12 14 5 22M31 73l9-30M46 87l14-13 26 9M90 64l16-1',
 wakgood:'M12 16 46 32 62 22 85 30 111 12 105 49 94 64 91 78 64 96 40 78 29 63 18 49 12 16ZM18 49l28-17 16 20 23-22 20 19M29 63l17-31M94 64 85 30M34 53l16 5-8 8M91 53l-17 5 9 8M50 58l12-6 12 6M42 66l20 13 21-13M40 78l22 1 2 17M91 78l-29 1'
};
function teamMark(t){return '<svg class="op-team-mark" aria-hidden="true" viewBox="0 0 124 100" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="'+TEAM_MARKS[t.id]+'"/><path d="M4 10V4H22M102 4h18v16M120 80v16h-18M22 96H4V80" opacity=".6"/></svg>'}
function tacFrame(){return '<svg class="op-armor-frame" aria-hidden="true" viewBox="0 0 800 320" preserveAspectRatio="none" fill="none"><path class="op-armor-outline" d="M17 2H783L798 17V303L783 318H17L2 303V17Z"/><path class="op-armor-inner" d="M23 8H777L792 23V297L777 312H23L8 297V23Z"/><path class="op-armor-corners" d="M3 57V18L18 3H83M717 317H782L797 302V263M717 3H782L797 18V57M3 263V302L18 317H83"/><path class="op-armor-sheen" d="M115 317H685M115 3H685"/><path class="op-armor-stripes" d="M741 312l12-12m0 12 12-12m0 12 12-12M23 20 35 8m0 12L47 8m0 12L59 8"/></svg>'}
// Confirmed roster uses the contact's own profile, not dedicated artwork or simulated draft assignments.
// All views resolve the explicitly connected contact ID, never a second name search.
function confirmedProfile(n,links=state.links){return byId.get(String(links[n]||''))||null}
const photoSource=c=>String(c?.image||c?.avatar||c?.profileImage||'');
function profilePortrait(n,layout='row',links=state.links){
  const c=confirmedProfile(n,links),markup=photo(c,agentName(n,links));
  return markup.replace('class="op-portrait"','class="op-portrait'+(layout==='row'?'':' op-agent-portrait op-profile-portrait')+'" data-op-profile-for="'+esc(n)+'" data-op-profile-layout="'+layout+'"');
}
function portraitCaption(n){return agentArt(n)||photoSource(confirmedProfile(n))?'':confirmedProfile(n)?'연락처 사진 없음':'연락처 연결 필요'}
function dossierPortrait(n){
  return agentArt(n)?tacticalPortrait(n,true).replace('class="op-agent-portrait op-agent-large"','class="op-agent-portrait op-agent-large" data-op-dossier-for="'+esc(n)+'"'):profilePortrait(n,'dossier').replace('data-op-profile-for=','data-op-dossier-for=');
}
function commandImageKey(n,dossier=false){
  const c=confirmedProfile(n);
  return JSON.stringify([c?.id,agentName(n),dossier&&agentArt(n)?agentArt(n):photoSource(c)]);
}
function snapshotCommandImages(){
  commandImageKeys=new Map(ROSTER.map(n=>[n,commandImageKey(n)]));
  if(activeAgent)commandImageKeys.set('dossier:'+activeAgent,commandImageKey(activeAgent,true));
}
function refreshCommandImages(){
  const view=root.querySelector('.op-command-workspace');if(!view)return false;
  for(const node of view.querySelectorAll('[data-op-profile-for],[data-op-dossier-for]')){
    const n=node.dataset.opDossierFor||node.dataset.opProfileFor,dossier=!!node.dataset.opDossierFor,key=dossier?'dossier:'+n:n;
    const next=commandImageKey(n,dossier);
    if(commandImageKeys.get(key)!==next){
      const tmp=document.createElement('template');tmp.innerHTML=dossier?dossierPortrait(n):profilePortrait(n,node.dataset.opProfileLayout);
      node.replaceWith(tmp.content.firstElementChild);
    }
  }
  for(const button of view.querySelectorAll('.op-agent-row,.op-agent-tile,.op-agent-switch')){const name=agentName(button.dataset.opAgent),label=button.querySelector('strong');if(label&&label.textContent!==name)label.textContent=name;if(button.hasAttribute('aria-label'))button.setAttribute('aria-label',name+' 요원 정보')}
  if(activeAgent){const title=view.querySelector('.op-agent-identity h2');if(title&&title.textContent!==agentName(activeAgent))title.textContent=agentName(activeAgent);const caption=view.querySelector('.op-instrument-caption');if(caption&&caption.textContent!==portraitCaption(activeAgent))caption.textContent=portraitCaption(activeAgent);const text=view.querySelector('.op-art-upload-text');if(text&&!artBusy)text.textContent=agentArt(activeAgent)?'전용 이미지 변경':'전용 이미지 추가'}
  snapshotCommandImages();return true;
}
function tacticalMember(t,n,i){
  return '<button type="button" class="op-agent-row" data-op-agent="'+esc(n)+'" aria-label="'+esc(agentName(n))+' 요원 정보">'+profilePortrait(n)+'<span class="op-agent-row-name"><strong>'+esc(agentName(n))+'</strong><small>#'+squadCode(t)+(i+1)+'</small></span><span class="op-tac-arrow" aria-hidden="true">›</span></button>';
}
function commanderArt(t){
  return '<div class="op-commander-art"><span class="op-tac-reticle" aria-hidden="true"></span><img src="'+commanderUrl(t)+'" alt="" decoding="async" width="512" height="512"></div>';
}
function tacticalBackdrop(t){
  // Inert original instrument geometry. All depth planes stay mounted.
  return '<div class="op-tactical-depth" aria-hidden="true"><svg class="op-tactical-terrain" viewBox="0 0 600 320" preserveAspectRatio="xMidYMid slice" fill="none"><g stroke="currentColor" stroke-width=".9"><path d="M-50 76Q55 28 145 79T345 63T630 38M-40 93Q55 45 145 96T345 80T640 55M-30 111Q55 63 145 114T345 98T650 73M-20 129Q55 81 145 132T345 116T660 91M-20 147Q55 99 145 150T345 134T660 109M-20 165Q55 117 145 168T345 152T660 127M-20 183Q55 135 145 186T345 170T660 145M-20 201Q55 153 145 204T345 188T660 163"/><path stroke-dasharray="4 7" d="M60 285 156 170 272 232 460 90 590 125M155 0V320M430 0V320"/><circle cx="156" cy="170" r="22"/><circle cx="156" cy="170" r="35"/><circle cx="460" cy="90" r="40"/><path d="M146 170h20m-10-10v20M450 90h20m-10-10v20M25 18H80M25 18V50M575 302H520M575 302V270"/></g><g fill="currentColor"><circle cx="156" cy="170" r="3"/><circle cx="272" cy="232" r="3"/><circle cx="460" cy="90" r="3"/></g></svg><span class="op-tactical-plating"></span><span class="op-tactical-sight"></span><span class="op-tactical-scan"></span><span class="op-tactical-edge"></span></div>';
}
function squadCard(t){
  return '<article class="op-squad-card" data-op-confirmed-team="'+t.id+'"'+squadStyle(t)+'>'+tacFrame()+'<div class="op-squad-hero">'+tacticalBackdrop(t)+'<span class="op-hero-hud" aria-hidden="true"></span>'+commanderArt(t)+'<div class="op-squad-title"><small>COMMANDER / '+squadCode(t)+'</small><span class="op-squad-link">'+tacEmblem()+'<strong>'+esc(t.name)+' 팀</strong></span><span class="op-squad-coach"><span>코치</span><b>'+esc(t.coach)+'</b></span></div>'+teamMark(t)+'<button type="button" class="op-squad-hit" data-op-squad="'+t.id+'" aria-label="'+esc(t.name)+' 팀 상세"><span class="op-team-entry">팀 정보 <span aria-hidden="true">›</span></span></button></div><div class="op-squad-roster"><div class="op-roster-caption"><span>요원 명단</span><span>05</span></div>'+t.members.map((n,i)=>tacticalMember(t,n,i)).join('')+'</div></article>';
}
function commandOverview(){
  return '<section class="op-command-workspace op-command-overview"><div class="op-command-heading"><div class="op-console-banks" aria-hidden="true"><span><i></i><i></i><i></i></span><span><i></i><i></i><i></i></span></div><div class="op-brief-title"><span class="op-tac-kicker">OPERATION M / COMMAND CENTER</span><h2>작전 현황</h2></div><div class="op-command-map" aria-hidden="true"><svg viewBox="0 0 480 80" preserveAspectRatio="xMidYMid meet" fill="none"><path d="M12 49 30 23 62 14 90 29 112 13 149 20 165 39 138 43 121 58 93 51 72 72 55 60 42 42 12 49ZM190 22 220 12 246 19 267 12 296 28 337 14 371 27 401 20 445 35 463 54 423 61 399 45 370 48 349 66 319 52 289 57 275 40 242 44 226 67 204 53 190 22Z" fill="#4489aa" fill-opacity=".12" stroke="#5287a0" stroke-dasharray="2 3"/><path d="M24 40H456M240 4V76M68 19 150 54 240 26 330 58 416 20" stroke="#58829b" stroke-opacity=".55" stroke-dasharray="3 4"/><g stroke="#9ad2e8"><circle cx="68" cy="19" r="3"/><circle cx="150" cy="54" r="3"/><circle cx="330" cy="58" r="3"/><circle cx="416" cy="20" r="3"/><path d="M217 28v-8h8m30 0h8v8m0 24v8h-8m-30 0h-8v-8"/></g><path d="M225 49V30l15 12 15-12v19" stroke="#b6d9e7" stroke-width="3"/></svg></div><span class="op-brief-code">TEAM 04 / AGENT 20</span></div><div class="op-command-grid">'+SQUADS.map(squadCard).join('')+'</div><div class="op-command-footer"><span class="op-tac-dot"></span><strong>팀 편성 완료</strong><span class="op-command-divider"></span><span>팀 <b>4</b></span><span class="op-command-divider"></span><span>참가자 <b>20</b>명</span><span class="op-command-divider"></span><span>코치 <b>4</b>명</span><span class="op-footer-stripes" aria-hidden="true"></span></div></section>';
}
function commanderNameplate(t){
  return '<span class="op-command-nameplate">'+tacEmblem()+'<span><small>COMMANDER</small><strong>'+esc(t.name)+'</strong></span></span>';
}
function commandSquad(t){
  return '<section class="op-command-workspace op-squad-detail"'+squadStyle(t)+'><div class="op-detail-nav">'+button('command-back','작전 현황')+'<span>팀 정보</span><div class="op-squad-switch">'+SQUADS.map(s=>'<button type="button" data-op-squad="'+s.id+'" aria-pressed="'+(s.id===t.id)+'"'+squadStyle(s)+'>'+esc(s.name)+'</button>').join('')+'</div></div><div class="op-squad-detail-body"><div class="op-command-banner op-layer-panel">'+tacFrame()+tacticalBackdrop(t)+teamMark(t)+commanderArt(t)+'<div class="op-banner-title"><span class="op-tac-kicker">SQUAD / '+squadCode(t)+'</span><h2>'+esc(t.name)+' 팀</h2><div class="op-squad-coach"><span>코치</span><b>'+esc(t.coach)+'</b></div></div></div><div class="op-team-dossiers op-layer-panel"><div class="op-roster-caption"><span>소속 요원</span><span>05 / 05</span></div><div class="op-team-agent-grid">'+t.members.map((n,i)=>'<button type="button" class="op-agent-tile" data-op-agent="'+esc(n)+'" aria-label="'+esc(agentName(n))+' 요원 정보">'+teamMark(t)+profilePortrait(n,'tile')+'<span class="op-tile-id">#'+squadCode(t)+(i+1)+'</span><span class="op-agent-tile-plaque"><strong>'+esc(agentName(n))+'</strong><span class="op-tac-arrow" aria-hidden="true">›</span></span>'+tacFrame()+'</button>').join('')+'</div></div></div></section>';
}
function commandAgent(t,n){
  const i=t.members.indexOf(n),src=agentArt(n);
  return '<section class="op-command-workspace op-agent-detail"'+squadStyle(t)+'><div class="op-detail-nav">'+button('command-team-back','팀으로')+'<span>요원 정보</span><div class="op-detail-step"><button type="button" data-op-agent="'+esc(t.members[(i+4)%5])+'" data-op-step="prev" aria-label="이전 요원">‹</button><span class="op-detail-position" aria-live="polite">'+(i+1)+' / 5</span><button type="button" data-op-agent="'+esc(t.members[(i+1)%5])+'" data-op-step="next" aria-label="다음 요원">›</button></div></div><div class="op-agent-dossier"><div class="op-dossier-portrait op-layer-panel">'+tacFrame()+tacticalBackdrop(t)+teamMark(t)+'<div class="op-portrait-instrument">'+dossierPortrait(n)+'<span class="op-instrument-caption">'+esc(portraitCaption(n))+'</span></div>'+(canConfigure()?'<label class="op-art-upload"><span class="op-art-upload-text">'+(artBusy?'저장 중…':src?'전용 이미지 변경':'전용 이미지 추가')+'</span><input type="file" accept="image/png,image/jpeg,image/webp,image/avif" data-op-agent-upload="'+esc(n)+'" '+(artBusy?'disabled':'')+'></label>':'')+'</div><div class="op-dossier-content op-layer-panel">'+tacticalBackdrop(t)+'<div class="op-agent-identity">'+tacEmblem()+'<div><span class="op-tac-kicker">PERSONNEL FILE / '+squadCode(t)+(i+1)+'</span><h2>'+esc(agentName(n))+'</h2></div></div><div class="op-dossier-fields"><div><small>소속 팀</small><strong>'+esc(t.name)+' 팀</strong></div><div><small>담당 코치</small><strong>'+esc(t.coach)+'</strong></div></div><button type="button" class="op-dossier-command op-layer-panel" data-op-squad="'+t.id+'" aria-label="'+esc(t.name)+' 팀 상세">'+tacFrame()+tacticalBackdrop(t)+commanderArt(t)+commanderNameplate(t)+'<span class="op-team-entry">팀 정보 <span class="op-tac-arrow" aria-hidden="true">›</span></span></button>'+(artNotice?'<div class="op-art-notice" role="status">'+esc(artNotice)+'</div>':'')+'</div></div><div class="op-dossier-squad op-layer-panel"><div class="op-roster-caption"><span>팀 요원 전환</span><span>05</span></div><div class="op-agent-switch-grid">'+t.members.map((p,j)=>'<button type="button" class="op-agent-switch'+(p===n?' is-current':'')+'" data-op-agent="'+esc(p)+'" aria-pressed="'+(p===n)+'">'+profilePortrait(p,'switch')+'<span><small>#'+squadCode(t)+(j+1)+'</small><strong>'+esc(agentName(p))+'</strong></span></button>').join('')+'</div></div></section>';
}
function commandView(){
  if(activeAgent){const t=squadFor(activeAgent);if(t)return commandAgent(t,activeAgent)}
  const t=SQUADS.find(x=>x.id===activeSquad);
  return t?commandSquad(t):commandOverview();
}
// Keep the armor, team data, nav and all five switch nodes mounted during agent changes.
// A change of team, permission, or data refresh still uses the complete view renderer.
function patchAgentDetail(t,n){
  const view=root.querySelector('.op-agent-detail'),i=t.members.indexOf(n);
  if(!view||i<0||!view.querySelector('.op-dossier-portrait .op-armor-frame'))return false;
  const draft=document.createElement('template');draft.innerHTML=commandAgent(t,n);
  const next=draft.content;
  const pairs=['.op-portrait-instrument .op-agent-portrait','.op-portrait-instrument .op-instrument-caption','.op-agent-identity h2','.op-agent-identity .op-tac-kicker','.op-detail-position'];
  if(pairs.some(sel=>!view.querySelector(sel)||!next.querySelector(sel)))return false;
  const oldUpload=view.querySelector('.op-art-upload'),newUpload=next.querySelector('.op-art-upload');
  // Update existing content nodes except the artwork itself, which has independent load state.
  for(const sel of pairs){
    const a=view.querySelector(sel),b=next.querySelector(sel);
    if(sel.endsWith('.op-agent-portrait')){a.replaceWith(b)}else a.textContent=b.textContent;
  }
  if(oldUpload&&newUpload){oldUpload.replaceWith(newUpload)}
  else if(oldUpload)oldUpload.remove();
  else if(newUpload)view.querySelector('.op-dossier-portrait').append(newUpload);
  view.querySelector('.op-art-notice')?.remove();
  for(const step of ['prev','next']){
    const b=view.querySelector('[data-op-step="'+step+'"]');
    b.dataset.opAgent=t.members[(i+(step==='prev'?4:1))%5];
  }
  for(const b of view.querySelectorAll('.op-agent-switch')){
    const current=b.dataset.opAgent===n;b.classList.toggle('is-current',current);b.setAttribute('aria-pressed',String(current));
  }
  commandImageKeys.set('dossier:'+n,commandImageKey(n,true));
  measureLayout();scheduleMeasure();
  return true;
}
const commandTransitions=new Set();
function stopCommandTransitions(){for(const a of commandTransitions)a.cancel();commandTransitions.clear()}
function animateCommandForeground(sameAgent,squad,agent){
  stopCommandTransitions();
  if(interfaceMotionReduced())return;
  // Only changed foreground elements animate; armor geometry stays fully visible.
  const selectors=sameAgent?['.op-portrait-instrument .op-agent-portrait','.op-agent-identity h2','.op-agent-identity .op-tac-kicker']:
    agent?['.op-portrait-instrument .op-agent-portrait','.op-agent-identity h2','.op-dossier-command .op-command-nameplate']:
    squad?['.op-command-banner .op-commander-art img','.op-banner-title','.op-agent-tile .op-agent-portrait']:
    ['.op-squad-hero .op-commander-art img','.op-squad-title'];
  for(const selector of selectors)for(const node of root.querySelectorAll(selector)){
    if(!node.animate)continue;
    const a=node.animate([{opacity:.55,translate:'0 5px'},{opacity:1,translate:'0 0'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'});
    commandTransitions.add(a);const clear=()=>commandTransitions.delete(a);a.onfinish=clear;a.oncancel=clear;
  }
}
function goCommand(squad='',agent='',origin=null){
  if(tab==='command'&&activeSquad===squad&&activeAgent===agent)return;
  const previousAgent=tab==='command'?activeAgent:'',sameAgentView=!!(previousAgent&&agent&&activeSquad===squad);
  const keepTeamSwitch=origin?.closest('.op-squad-switch')&&!!squad&&!agent;
  const keepAgentSwitch=origin?.closest('.op-agent-switch-grid')&&sameAgentView;
  const step=origin?.dataset.opStep;
  const main=root.closest('.main'),scroll=main?.scrollTop||0;
  suspendGuided();finishDraft(false);stopShuffle();clearRankMotion();stopCommandTransitions();rankLock=false;guided=false;choosingMode=false;selected='';tab='command';activeSquad=squad;activeAgent=agent;artNotice='';
  const patched=sameAgentView&&squadFor(agent)&&patchAgentDetail(squadFor(agent),agent);
  if(!patched)render();
  const heading=root.querySelector('.op-command-workspace h2');
  let focus=null;
  if(step&&sameAgentView)focus=root.querySelector('[data-op-step="'+step+'"]');
  if(keepAgentSwitch)focus=root.querySelector('.op-agent-switch.is-current');
  if(keepTeamSwitch)focus=root.querySelector('.op-squad-switch [aria-pressed="true"]');
  if(focus)focus.focus({preventScroll:true});
  else if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
  if(main)main.scrollTop=sameAgentView||keepTeamSwitch?scroll:0;
  animateCommandForeground(!!patched,squad,agent);
}
async function prepareAgentImage(file){
  if(!/^image\/(png|jpeg|webp|avif)$/.test(file.type)||file.size>12*1024*1024)throw Error('PNG, JPG, WebP, AVIF 이미지 12MB 이하만 등록할 수 있습니다.');
  const url=URL.createObjectURL(file);
  try{
    const im=new Image();im.src=url;await im.decode();if(!im.naturalWidth||!im.naturalHeight)throw Error('이미지를 읽을 수 없습니다.');
    const canvas=document.createElement('canvas'),ratio=Math.min(1,768/Math.max(im.naturalWidth,im.naturalHeight));canvas.width=Math.max(1,Math.round(im.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(im.naturalHeight*ratio));
    canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);let result=canvas.toDataURL('image/webp',.84);
    if(result.length>260000)result=canvas.toDataURL('image/webp',.62);
    if(result.length>400000)throw Error('이미지가 너무 큽니다. 더 작은 이미지를 선택하세요.');
    return result;
  }finally{URL.revokeObjectURL(url)}
}
async function saveAgentImage(n,file){
  if(!canConfigure()||artBusy||configSaving||!squadFor(n)||!file)return;
  if(configDraft){if(!configPending)await stageConfigImage(n,file);return}
  artBusy=true;artNotice='';render();
  let d,prior,next;
  try{
    const image=await prepareAgentImage(file);if(!canConfigure())throw Error('관리자 연결을 확인하세요.');
    d=getData();prior=d.miniGames[ART_KEY];const players=(Array.isArray(prior?.players)?prior.players:[]).filter(p=>p&&p.id!==n&&squadFor(p.id));
    // No contactId: the existing server media pipeline stores this as workspace artwork.
    next={...prior,players:[...players,{id:n,image}]};d.miniGames[ART_KEY]=next;
    window.saveData('오퍼 M 요원 사진');if(!await window.mwsV55SaveNow())throw Error('온라인 저장을 확인하지 못했습니다.');
    artNotice='요원 사진 저장 완료';
  }catch(err){artNotice=next?'온라인 저장 미확인 · 공용 저장 복구 기능에서 재시도하세요.':err.message||'사진 등록 실패';}
  finally{artBusy=false;render()}
}

const admin=()=>document.body.dataset.mwsMode==='admin'&&window.__mwsAppReadyV130===true;
const report=()=>window.mwsV55EgressReport?.();
const canConfigure=()=>admin()&&workspaceReady&&report()?.loadedParts?.includes('miniGames')&&Number.isInteger(report()?.manifest?.parts?.miniGames)&&typeof window.mwsV55SaveNow==='function';
let contacts=[],byId=new Map(),missing=[];
const getData=()=>{try{return typeof data!=='undefined'?data:window.data}catch(_){return window.data}};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));saveFailed=false}catch(_){saveFailed=true}}
function readConfig(){
  const raw=getData()?.miniGames?.[CONFIG_KEY];
  const clean=normalizeState(raw||{links:state.links,roles:state.roles});
  // Fill only previously unlinked slots from unique canonical names. Explicit IDs remain authoritative.
  syncContacts(clean,contacts);
  if(!raw){
    const used=new Set([...Object.values(clean.links),...clean.roles].filter(Boolean));
    for(const n of ROSTER)if(!clean.links[n]&&rosterAlias(n)!==n){
      const alias=matchContact(rosterAlias(n),contacts),key=String(n).normalize('NFKC').trim().toLowerCase().replace(/[\s_!☆…\.\-]/g,'');
      const hasOriginal=contacts.some(c=>{const name=String(c.name).normalize('NFKC').trim().toLowerCase().replace(/[\s_!☆…\.\-]/g,'');return n.endsWith('…')?name.startsWith(key):name===key});
      if(!hasOriginal&&alias&&!used.has(String(alias.id))){clean.links[n]=String(alias.id);used.add(String(alias.id))}
    }
    clean.roles=DEFAULT_ROLES.map((n,i)=>{if(clean.roles[i])return clean.roles[i];const c=matchContact(n,contacts),id=c?String(c.id):'';if(!id||used.has(id))return '';used.add(id);return id});
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
function showEnteredWorkspace(){
  if(!root.classList.contains('active'))return;
  if(!workspaceReady){render();return}
  if(resumeOnEnter){
    resumeOnEnter=false;
    if(tab==='tier'&&guidedResume&&resumeGuided())return;
    render();return;
  }
  if(root.querySelector('.op-shell[data-view]'))refreshView();else render();
}
async function enter(){
  if(!root.classList.contains('active'))return;
  workspaceWasActive=true;
  if(report()?.loadedParts?.includes('miniGames')){if(workspaceLoading){++workspaceLoadEpoch;workspaceLoading=false}workspaceReady=true;workspaceError=false;showEnteredWorkspace();return}
  if(workspaceLoading)return;
  const epoch=++workspaceLoadEpoch;
  workspaceLoading=true;workspaceError=false;render();
  try{const ok=typeof window.mwsV55EnsureParts==='function'&&await window.mwsV55EnsureParts('toolTier')===true;if(epoch!==workspaceLoadEpoch)return;workspaceReady=ok;workspaceError=!ok}
  catch(_){if(epoch!==workspaceLoadEpoch)return;workspaceReady=false;workspaceError=true}
  finally{if(epoch===workspaceLoadEpoch){workspaceLoading=false;showEnteredWorkspace()}}
}
const current=n=>byId.get(state.links[n]);
const display=n=>{const name=current(n)?.name;return name&&!(n==='양지팡'&&name===n)?name:rosterContactName(n)};
const available=()=>workspaceReady&&!missing.length&&ROSTER.every(n=>TIERS.includes(state.tiers[n]));
const button=(action,label,extra='')=>'<button type="button" data-op-action="'+action+'" '+extra+'>'+label+'</button>';
function photo(c,name){
  const src=photoSource(c);
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
  return '<div class="op-roster"><div class="op-block-head"><h2>감독</h2><span class="op-host">'+photo(host,host?.name||'주최자')+'<span>주최자 · '+esc(host?.name||'미지정')+'</span></span></div><div class="op-coaches">'+state.roles.slice(1).map((id,i)=>{const c=byId.get(id),name=c?.name||'미지정';return '<article class="op-coach op-layer-panel" data-team="'+i+'" style="--op-order:'+i+(teamByName(name)?';--team:'+teamByName(name).color:'')+'">'+tacFrame()+commanderPortrait(c,name)+'<div class="op-coach-plate"><small>COMMANDER</small><strong title="'+esc(name)+'">'+esc(name)+'</strong>'+tacEmblem()+'</div><span class="op-coach-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></span></article>'}).join('')+'</div><div class="op-block-head"><h2>참가자 <small>'+(20-missing.length)+' / 20</small></h2></div><div class="op-roster-grid">'+ROSTER.map(n=>player(n,'roster')).join('')+'</div><div class="op-roster-next">'+button('choose-mode','다음 단계','class="op-primary"')+'</div></div>';
}
function modePreview(mode){
  if(mode==='guided')return '<span class="op-mode-preview op-mode-preview-guided" aria-hidden="true"><span class="op-preview-stack">'+[0,1,2].map(i=>'<span class="op-preview-card op-preview-back" style="--op-i:'+i+'">'+cardBack()+'</span>').join('')+'<span class="op-preview-card op-preview-draw"><span class="op-preview-portrait"></span><span class="op-preview-plate"></span></span></span></span>';
  return '<span class="op-mode-preview op-mode-preview-list" aria-hidden="true"><span class="op-preview-board">'+TIERS.map(t=>'<span class="op-preview-row" data-tier="'+t+'"><span>'+crest(t)+t+'</span><i></i><i></i><i></i></span>').join('')+'<span class="op-preview-token op-preview-token-one"></span><span class="op-preview-token op-preview-token-two"></span></span></span>';
}
function modeChoice(){
  return '<section class="op-mode-choice" aria-label="티어 분류 방식 선택"><div class="op-mode-options">'+[['guided','한 장씩 분류','카드를 한 장씩 공개하고 티어를 결정합니다.','start-guided'],['list','전체 목록 분류','원하는 참가자를 자유롭게 티어에 배치합니다.','start-list']].map(([mode,title,description,action])=>'<button type="button" class="op-mode-card" data-mode="'+mode+'" data-op-action="'+action+'">'+tacFrame()+modePreview(mode)+'<span class="op-mode-caption"><strong>'+title+'</strong><span>'+description+'</span></span></button>').join('')+'</div></section>';
}
function chooseMode(focus=false){
  guidedResume=null;stopShuffle();tab='tier';guided=false;choosingMode=true;selected='';notice='';render();
  if(focus)root.querySelector('.op-mode-card')?.focus({preventScroll:true});
}
function sameConfig(a,b){return !!a&&!!b&&ROSTER.every(n=>(a.links[n]||'')===(b.links[n]||''))&&a.roles.every((id,i)=>id===b.roles[i])}
function configLinksChanged(){return !!configDraft&&!sameConfig(configDraft,configBaseline?.links)}
function configDirty(){return configLinksChanged()||Object.keys(configArt).length>0||configPending}
function clearConfig(){
  const dialog=root.querySelector('.op-config');
  if(dialog?.open)dialog.close();
  dialog?.remove();
  configDraft=null;configBaseline=null;configArt={};configDiscard=false;configPending=false;configNotice='';picker='';query='';
}
function openConfig(){
  if(!canConfigure()||configDraft||guided||draftRun||rankLock)return;
  const links=readConfig();
  configDraft={links:{...links.links},roles:[...links.roles]};
  configBaseline={links:JSON.parse(JSON.stringify(configDraft)),art:Object.fromEntries(ROSTER.map(n=>[n,agentArt(n)]))};
  configArt={};configDiscard=false;configPending=false;configNotice='';picker='';query='';
  renderConfig({focus:'[data-op-action="close-config"]'});
}
function closeConfig(force=false){
  if(configSaving||artBusy)return;
  if(!force&&configDirty()){configDiscard=true;picker='';renderConfig({focus:'[data-op-action="keep-config"]'});return}
  clearConfig();notice='';render();
  root.querySelector('[data-op-action="open-config"]')?.focus({preventScroll:true});
}
function closePicker(){
  const old=picker;picker='';query='';renderConfig({key:old});
}
async function stageConfigImage(n,file){
  artBusy=true;configNotice='';renderConfig();
  try{
    const image=await prepareAgentImage(file);
    if(!configDraft||!canConfigure())throw Error('관리자 연결을 확인하세요.');
    if(image===configBaseline.art[n]){delete configArt[n];configNotice='기존 이미지와 동일합니다.'}else{configArt[n]=image;configNotice='이미지 준비 완료 · 설정 저장을 누르면 적용됩니다.'}
  }catch(err){configNotice=err.message||'이미지 준비 실패';}
  finally{artBusy=false;renderConfig({upload:n})}
}
function adminConfig(){
  const busy=configSaving||artBusy,disabled=busy?'disabled':'',editDisabled=busy||configPending?'disabled':'';
  const slot=(label,id,key)=>{
    const c=byId.get(id),changed=key.startsWith('role:')?id!==configBaseline.links.roles[Number(key.slice(5))]:id!==configBaseline.links.links[key];
    return '<button class="op-admin-slot'+(changed?' is-edited':'')+'" type="button" data-op-config="'+esc(key)+'" '+editDisabled+'>'+(key.startsWith('role:')?commanderPortrait(c,c?.name||label):photo(c,c?.name||label))+'<span>'+(key.startsWith('role:')||label!==c?.name?'<small>'+esc(label)+'</small>':'')+'<strong>'+esc(c?.name||'연락처 선택')+'</strong></span></button>';
  };
  const changedCount=Object.keys(configArt).length;
  const ids=[...ROSTER.map(n=>configDraft.links[n]),...configDraft.roles];
  const validLinks=ids.every(id=>id&&byId.has(id))&&new Set(ids).size===25;
  return tacFrame()+'<div class="op-config-main" '+(picker||configDiscard?'inert':'')+'><header class="op-config-head"><h2 class="op-config-title">'+tacEmblem()+'인물 설정</h2>'+button('close-config','닫기',disabled)+'</header><nav class="op-config-jump" aria-label="설정 영역 이동">'+button('config-jump-links','인물 연결',disabled)+button('config-jump-art','전용 이미지',disabled)+'</nav><div class="op-config-scroll"><section class="op-config-section op-config-links" tabindex="-1" aria-label="공통 연락처 연결"><div class="op-config-section-head"><h3>공통 연락처 연결</h3><span>'+(validLinks?'연결 확인':'미연결 항목 확인')+'</span></div><h4>주최자 및 감독</h4><div class="op-config-roles">'+configDraft.roles.map((id,i)=>slot(i?'감독 '+i:'주최자',id,'role:'+i)).join('')+'</div><h4>참가자 20명</h4><div class="op-config-players">'+SQUADS.map(t=>'<section class="op-link-team"'+squadStyle(t)+'><header>'+esc(t.name)+' 팀</header>'+t.members.map(n=>slot(rosterAlias(n),configDraft.links[n],n)).join('')+'</section>').join('')+'</div></section><section class="op-config-section op-config-art" tabindex="-1" aria-label="오퍼 M 전용 이미지"><div class="op-config-section-head"><h3>요원 상세 이미지</h3><span>'+(changedCount?changedCount+'장 변경 준비':'전용 이미지는 선택 사항')+'</span></div><div class="op-art-config-grid">'+SQUADS.map(t=>'<section class="op-art-config-team"'+squadStyle(t)+'><header>'+commanderPortrait(null,t.name)+'<span><strong>'+esc(t.name)+' 팀</strong><small>코치 · '+esc(t.coach)+'</small></span></header>'+t.members.map(n=>{
    const staged=Object.hasOwn(configArt,n),src=staged?configArt[n]:agentArt(n),contact=confirmedProfile(n,configDraft.links);
    const preview=src?tacticalPortrait(n,false,src):profilePortrait(n,'config',configDraft.links);
    const sourceLabel=staged?(src?'변경 저장 대기':'프로필 복귀 대기'):src?'전용 이미지':photoSource(contact)?'연락처 프로필':contact?'프로필 없음':'연락처 미연결';
    return '<div class="op-art-config-entry'+(staged?' is-edited':'')+'"><label class="op-art-config-slot">'+preview+'<span><strong>'+esc(agentName(n,configDraft.links))+'</strong><small>'+sourceLabel+'</small></span><input type="file" aria-label="'+esc(agentName(n))+' 이미지 등록 또는 변경" accept="image/png,image/jpeg,image/webp,image/avif" data-op-agent-upload="'+esc(n)+'" '+editDisabled+'></label>'+'<div class="op-art-actions">'+(staged&&!configPending?button('undo-art','취소','data-op-art-undo="'+esc(n)+'" aria-label="'+esc(agentName(n))+' 이미지 변경 취소" '+disabled):src&&!configPending?button('remove-art','프로필 복귀','data-op-art-remove="'+esc(n)+'" aria-label="'+esc(agentName(n))+' 전용 이미지 제거" '+disabled):'')+'</div></div>';
  }).join('')+'</section>').join('')+'</div></section></div><footer class="op-config-footer"><span role="status" aria-live="polite">'+esc(busy?(configSaving?'온라인 저장 중…':'이미지 준비 중…'):configNotice||(configDirty()?'저장되지 않은 변경사항이 있습니다.':'변경사항 없음'))+'</span>'+button('save-config',configSaving?'저장 중':configPending?'저장 다시 시도':'설정 저장','class="op-primary" '+(busy||!configDirty()?'disabled':''))+'</footer></div>'+pickerHtml()+(configDiscard?'<div class="op-config-submodal"><section class="op-config-confirm op-layer-panel" role="group" aria-labelledby="op-config-discard-title">'+tacFrame()+'<h3 id="op-config-discard-title">'+(configPending?'온라인 저장 미확인':'저장하지 않은 변경사항')+'</h3><p>'+(configPending?'이미 전송한 저장 요청은 취소할 수 없습니다. 닫으면 공용 저장 복구 기능에서 계속 관리됩니다.':'저장하지 않은 연락처 연결 및 이미지 변경을 취소할까요?')+'</p><div>'+button('keep-config','계속 편집')+button('discard-config',configPending?'닫기':'변경사항 버리기','class="op-danger"')+'</div></section></div>':'');
}
function renderConfig(target={}){
  if(!configDraft||!canConfigure()||!root.classList.contains('active'))return;
  let dialog=root.querySelector('.op-config');
  const oldScroll=dialog?.querySelector('.op-config-scroll')?.scrollTop||0;
  const focused=document.activeElement,key=target.key||focused?.dataset?.opConfig,upload=target.upload||focused?.dataset?.opAgentUpload;
  if(!dialog){
    dialog=document.createElement('dialog');dialog.className='op-config op-layer-panel';
    dialog.setAttribute('aria-label','오퍼 M 인물 설정');
    dialog.addEventListener('cancel',e=>{
      e.preventDefault();
      if(configSaving||artBusy)return;
      if(configDiscard){configDiscard=false;renderConfig({focus:'[data-op-action="close-config"]'})}
      else if(picker)closePicker();else closeConfig();
    });
    root.querySelector('.op-shell').append(dialog);
  }
  dialog.innerHTML=adminConfig();
  const scroll=dialog.querySelector('.op-config-scroll');if(scroll)scroll.scrollTop=oldScroll;
  if(!dialog.open)dialog.showModal();
  let node=target.focus?dialog.querySelector(target.focus):key?[...dialog.querySelectorAll('[data-op-config]')].find(x=>x.dataset.opConfig===key):upload?[...dialog.querySelectorAll('[data-op-agent-upload]')].find(x=>x.dataset.opAgentUpload===upload):null;
  if(!node||node.disabled||node.closest('[inert]'))node=dialog.querySelector(configDiscard?'[data-op-action="keep-config"]':picker?'[data-op-search]':'[data-op-action="close-config"]:not(:disabled)')||dialog;
  node.focus({preventScroll:true});
}
function handleConfigClick(e,b){
  if(!configDraft)return false;
  const dialog=root.querySelector('.op-config');
  if(!b||!dialog?.contains(b))return true;
  if(configSaving||artBusy)return true;
  const action=b.dataset.opAction;
  if(configDiscard){
    if(action==='keep-config'){configDiscard=false;renderConfig({focus:'[data-op-action="close-config"]'})}
    if(action==='discard-config')closeConfig(true);
    return true;
  }
  if(picker){
    if(action==='close-picker'){closePicker();return true}
    if(!b.dataset.opLink)return true;
    const id=b.dataset.opLink,role=picker.startsWith('role:'),idx=role?Number(picker.slice(5)):-1;
    if(!byId.has(id))return true;
    const previous=role?configDraft.roles[idx]:configDraft.links[picker];
    for(const n of ROSTER)if(n!==picker&&configDraft.links[n]===id){if(previous)configDraft.links[n]=previous;else delete configDraft.links[n]}
    configDraft.roles=configDraft.roles.map((x,i)=>i!==idx&&x===id?(previous||''):x);
    if(role)configDraft.roles[idx]=id;else configDraft.links[picker]=id;
    configNotice='';closePicker();return true;
  }
  if(action==='config-jump-links'||action==='config-jump-art'){
    const scroll=dialog.querySelector('.op-config-scroll'),section=dialog.querySelector(action==='config-jump-art'?'.op-config-art':'.op-config-links');
    if(scroll&&section){const top=scroll.scrollTop+section.getBoundingClientRect().top-scroll.getBoundingClientRect().top;scroll.scrollTo({top,behavior:interfaceMotionReduced()||Math.abs(top-scroll.scrollTop)>scroll.clientHeight?'instant':'smooth'});section.focus({preventScroll:true})}return true;
  }
  if(b.dataset.opConfig&&!configPending){showPicker(b.dataset.opConfig);return true}
  if(action==='remove-art'&&b.dataset.opArtRemove&&!configPending){const n=b.dataset.opArtRemove;if(agentArt(n)){configArt[n]='';configNotice='연락처 프로필 복귀 준비 완료';renderConfig({upload:n})}return true}
  if(action==='undo-art'&&b.dataset.opArtUndo&&!configPending){const n=b.dataset.opArtUndo;delete configArt[n];configNotice='';renderConfig({upload:n});return true}
  if(action==='close-config')closeConfig();
  if(action==='save-config')void saveConfig();
  return true;
}
function openResetDialog(trigger){
  if(resetDialog&&!resetDialog.open)resetSettle?.();
  if(resetDialog||configDraft)return;
  const wasGuided=guided;
  // Resolve only the in-flight transition before mounting the modal. Classification
  // already committed by confirmRank is retained; the next card cannot auto-draw.
  resetHold=true;
  if(guided&&canSkipGuided())skipGuidedMotion();
  const dialog=document.createElement('dialog');resetDialog=dialog;
  dialog.className='op-reset-dialog op-layer-panel';
  dialog.setAttribute('aria-labelledby','op-reset-title');
  dialog.setAttribute('aria-describedby','op-reset-description');
  dialog.innerHTML=tacFrame()+'<form method="dialog" class="op-reset-body"><header>'+tacEmblem()+'<h2 id="op-reset-title">드래프트 초기화</h2></header><p id="op-reset-description">20명의 티어와 가상 팀 결과를 초기화합니다. 실제 확정 팀 편성, 인물 연결과 등록된 이미지는 유지됩니다.</p><footer><button type="submit" value="cancel" autofocus>취소</button><button type="submit" value="reset" class="op-reset-confirm">초기화</button></footer></form>';
  root.append(dialog);
  const settle=()=>{
    if(resetDialog!==dialog)return;
    const confirmed=dialog.returnValue==='reset';resetDialog=null;resetSettle=null;resetHold=false;dialog.remove();
    if(!confirmed){
      if(trigger?.isConnected)trigger.focus({preventScroll:true});
      if(guided&&!paused&&deckPhase==='pick'&&!document.hidden)drawCard(0);
      flushPendingRefresh();return;
    }
    stopShuffle();clearRankMotion();rankLock=false;deckPhase='pick';
    guidedResume=null;state.tiers={};state.teams=[];lastMove=null;guidedHistory=[];choosingMode=false;selected='';notice='';save();
    if(wasGuided)startGuided();else{guided=false;render()}
  };
  // Real form submissions settle in the same task; native close/Escape remain supported.
  resetSettle=settle;
  dialog.addEventListener('click',e=>{const b=e.target.closest('button[type=submit]');if(!b||!dialog.contains(b))return;e.preventDefault();dialog.close(b.value);settle()});
  dialog.addEventListener('submit',e=>{e.preventDefault();dialog.close(e.submitter?.value||'cancel');settle()});
  dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.close('cancel');settle()});
  dialog.addEventListener('close',settle,{once:true});
  dialog.showModal();
}
function pickerHtml(){
  if(!picker||!configDraft||!canConfigure())return '';
  const role=picker.startsWith('role:'),idx=role?Number(picker.slice(5)):-1;
  const used=new Set([...Object.entries(configDraft.links).filter(([n])=>n!==picker).map(([,id])=>id),...configDraft.roles.filter((_,i)=>i!==idx)]);
  const q=query.trim().toLocaleLowerCase('ko-KR');
  const list=q?contacts.filter(c=>String(c.name).toLocaleLowerCase('ko-KR').includes(q)).slice(0,40):[];
  return '<div class="op-config-submodal"><div class="op-picker op-layer-panel" role="group" aria-label="연락처 연결">'+tacFrame()+'<div class="op-picker-top"><strong>'+esc(role?(idx?'감독 '+idx:'주최자'):rosterAlias(picker))+' 연락처 연결</strong>'+button('close-picker','닫기')+'</div><input type="search" data-op-search placeholder="연락처 이름 검색" value="'+esc(query)+'" aria-label="연락처 이름 검색"><div class="op-picker-results">'+(list.length?list.map(c=>'<button type="button" data-op-link="'+esc(c.id)+'">'+photo(c,c.name)+'<span>'+esc(c.name)+(used.has(String(c.id))?' · 교환':'')+'</span></button>').join(''):'<span>'+(q?'검색 결과 없음':'이름을 입력하세요')+'</span>')+'</div></div></div>';
}
function shuffleDeck(){
  stopShuffle();
  queue=ROSTER.filter(n=>current(n)&&!state.tiers[n]);
  for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}
  if(!queue.length){guided=false;render();return}
  deckPhase='shuffle';markMotion('shuffle');rebuildingGuided=true;try{render()}finally{rebuildingGuided=false}const epoch=deckEpoch;
  const stage=root.querySelector('.op-guided-stage'),deck=stage?.querySelector('.op-deck-reserve'),center=stage?.querySelector('.op-single-center');
  if(!stage||!deck||!center){deckWait(MOTION.shuffle,epoch,()=>finishShuffle(epoch));return}
  if(!guidedFull()||typeof deck.animate!=='function'){
    if(deck.animate)deckAnimate(deck,[{opacity:1},{opacity:.7},{opacity:1}],{duration:MOTION.shuffle,easing:'ease-in-out'});
    deckWait(MOTION.shuffle,epoch,()=>finishShuffle(epoch));return
  }
  const from=deck.getBoundingClientRect(),to=center.getBoundingClientRect(),scale=draftScale();
  const dx=(to.left+to.width/2-from.left-from.width/2)/scale,dy=(to.top+to.height/2-from.top-from.height/2)/scale;
  const layer=stage.querySelector('.op-shuffle-layer'),width=Math.min(170,Math.max(80,from.width/scale)),height=width*1.32;
  const sr=stage.getBoundingClientRect();
  layer.style.setProperty('--op-shuffle-x',((to.left+to.width/2-sr.left)/scale)+'px');
  layer.style.setProperty('--op-shuffle-y',((to.top+to.height/2-sr.top)/scale)+'px');
  stage.classList.add('op-shuffling-stage');deck.classList.add('op-stack-shuffling');
  const tokens=queue.map((_,i)=>{const c=document.createElement('span');c.className='op-shuffle-token';c.style.width=width+'px';c.style.height=height+'px';c.innerHTML=cardBack();layer.append(c);return c});
  const groupWidth=Math.min(width*1.1,Math.max(width*.55,center.clientWidth*.32));
  tokens.forEach((c,i)=>{
    const side=i%2?1:-1,depth=(i-(queue.length-1)/2)*1.8;const stackOrder=i%2?Math.floor(i/2)+Math.ceil(queue.length/2):Math.floor(i/2);
    deckAnimate(c,[
      {offset:0,zIndex:String(i+1),transform:'translate(-50%,-50%) translate('+(-dx+depth)+'px,'+(-dy-i*.65)+'px) scale(.88)',opacity:1},
      {offset:.14,transform:'translate(-50%,-50%) translate('+depth+'px,'+(-i*.9)+'px) rotate('+depth*.3+'deg)'},
      {offset:.30,zIndex:String(stackOrder+1),transform:'translate(-50%,-50%) translate('+(side*groupWidth)+'px,'+(-i*.7)+'px) rotate('+(-side*23)+'deg)'},
      {offset:.46,zIndex:String(i+1),transform:'translate(-50%,-50%) translate('+(-side*groupWidth*.62)+'px,'+(side*height*.19-i*.9)+'px) rotate('+(side*17)+'deg)'},
      {offset:.59,transform:'translate(-50%,-50%) translate('+depth*.3+'px,'+(-i*.7)+'px) rotate('+depth*.2+'deg)'},
      {offset:.73,zIndex:String(queue.length-i),transform:'translate(-50%,-50%) translate('+(side*groupWidth*.78)+'px,'+(-side*height*.13-i*.7)+'px) rotate('+(-side*16)+'deg)'},
      {offset:.86,zIndex:String(stackOrder+1),transform:'translate(-50%,-50%) translate('+depth*.18+'px,'+(-i*.65)+'px) rotate('+depth*.12+'deg)'},
      {offset:1,transform:'translate(-50%,-50%) translate('+(-dx+depth*.22)+'px,'+(-dy-i*.65)+'px) scale(.88)'}
    ],{duration:MOTION.shuffle-150,delay:Math.min(i*8,120),easing:'linear',fill:'both'});
  });
  deckWait(MOTION.shuffle,epoch,()=>finishShuffle(epoch));
}
function finishShuffle(epoch){
  if(!liveDeck(epoch))return;
  root.querySelector('.op-shuffle-layer')?.replaceChildren();
  root.querySelector('.op-guided-stage')?.classList.remove('op-shuffling-stage');
  root.querySelector('.op-deck-reserve')?.classList.remove('op-stack-shuffling');
  deckEffects.forEach(a=>a.cancel());deckEffects=[];deckPhase='pick';refreshGuided();
  if(!paused&&!document.hidden)drawCard(0);
}
function startGuided(){
  guidedResume=null;tab='tier';choosingMode=false;guided=ROSTER.some(n=>current(n)&&!state.tiers[n]);guidedHistory=[];selected='';notice=guided?'':'분류할 미분류 참가자가 없습니다.';paused=false;guidedMode=motionPreference();motionTrace=[];
  if(guided)shuffleDeck();else render();
}
function stackMarkup(count){
  return Array.from({length:Math.min(5,count)},(_,i)=>'<span class="op-stack-sheet" style="--op-i:'+i+'">'+cardBack()+'</span>').join('');
}
let expandedTier='';
function tierNames(names){return names.slice(-2).map(n=>'<span class="op-completed-person">'+photo(current(n),display(n))+'<span>'+esc(display(n))+'</span></span>').join('')}
function showTierMembers(t){
  root.querySelector('.op-tier-members')?.remove();expandedTier='';
  if(!TIERS.includes(t))return;
  expandedTier=t;const names=ROSTER.filter(n=>state.tiers[n]===t);
  const overlay=document.createElement('div');overlay.className='op-tier-members';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label',t+' 티어 참가자');
  overlay.innerHTML='<div class="op-tier-members-panel" data-tier="'+t+'"><header><strong>'+t+' 티어 · '+names.length+'명</strong>'+button('close-tier-members','닫기')+'</header><div class="op-tier-members-list">'+(names.length?names.map(n=>'<div class="op-tier-member">'+photo(current(n),display(n))+'<span>'+esc(display(n))+'</span></div>').join(''):'<span>분류된 참가자가 없습니다.</span>')+'</div></div>';
  root.querySelector('.op-single-stage')?.append(overlay);overlay.querySelector('button')?.focus({preventScroll:true});
}
function completedTray(){
  return '<div class="op-completed-tray" aria-label="분류 완료">'+TIERS.map(t=>{const names=ROSTER.filter(n=>state.tiers[n]===t);return '<button type="button" class="op-completed-slot" data-tier="'+t+'" data-op-completed="'+t+'" aria-label="'+t+' 티어 참가자 보기"><span class="op-completed-rank">'+crest(t)+'<strong>'+t+'</strong></span><span class="op-completed-names" title="'+esc(names.map(display).join(', '))+'">'+tierNames(names)+'</span><b>'+names.length+'</b></button>'}).join('')+'</div>';
}
function guidedCard(n,hidden=false){
  const c=document.createElement('article');c.className='op-reveal-card op-card'+(hidden?' op-face-down':' op-face-open');c.dataset.rarity='neutral';c.dataset.opCurrent=n;c.innerHTML=cardFace(current(n),display(n))+cardBack();return c;
}
function guidedBoard(){
  queue=queue.filter(n=>current(n)&&!state.tiers[n]);
  if(!queue.length){stopShuffle();guided=false;return tierBoard()}
  const done=ROSTER.filter(x=>state.tiers[x]).length,reveal=deckPhase==='reveal';
  const controls=button('undo-guided','이전',guidedHistory.length&&reveal?'':'disabled')+button('reset','초기화')+button('choose-mode','방식 변경')+button('exit-guided','전체 티어표');
  return '<div class="op-guided op-single-stage '+'op-motion-'+guidedMode+' op-deck-phase-'+deckPhase+'"><div class="op-guided-top"><span class="op-guided-count">'+done+' / 20</span><div class="op-guided-track" role="progressbar" aria-label="분류 진행률" aria-valuenow="'+done+'" aria-valuemin="0" aria-valuemax="20"><i style="width:'+(done*5)+'%"></i></div>'+controls+'</div><div class="op-guided-stage"><div class="op-stage-halo" aria-hidden="true"></div><span class="op-stage-instrument" aria-hidden="true"></span><div class="op-single-deck"><button type="button" class="op-deck-reserve op-deck-card" data-op-draw="0" aria-label="다음 카드 공개">'+stackMarkup(Math.max(0,queue.length-(reveal?1:0)))+'</button><span class="op-deck-remaining" aria-live="polite">남은 카드 '+Math.max(0,queue.length-(reveal?1:0))+'장</span></div><div class="op-single-center">'+(reveal?'<article class="op-reveal-card op-card op-face-open" data-rarity="neutral" data-op-current="'+esc(queue[0])+'">'+cardFace(current(queue[0]),display(queue[0]))+cardBack()+'</article>':'')+'</div>'+completedTray()+'<div class="op-shuffle-layer" aria-hidden="true"></div></div><div class="op-guided-ranks">'+TIERS.map((t,i)=>'<button type="button" class="op-guide-rank" data-op-assign="'+t+'" data-tier="'+t+'" aria-keyshortcuts="'+(i+1)+'" '+(!reveal?'disabled':'')+'><span class="op-keyhint">'+(i+1)+'</span><strong>'+crest(t)+t+'</strong><small>'+ROSTER.filter(x=>state.tiers[x]===t).length+'명</small></button>').join('')+'</div><div class="op-deck-controls">'+button('shuffle-guided','다시 섞기',['pick','reveal'].includes(deckPhase)?'':'disabled')+button('toggle-pause',paused?'계속 진행':'일시정지','aria-pressed="'+paused+'"')+button('skip-guided','현재 연출 건너뛰기',canSkipGuided()?'':'disabled')+'</div></div>';
}
function refreshGuided(){
  const panel=root.querySelector('.op-guided');if(!panel)return;
  for(const p of ['shuffle','pick','draw','flip','reveal','confirm'])panel.classList.toggle('op-deck-phase-'+p,deckPhase===p);
  panel.classList.toggle('op-motion-full',guidedFull());panel.classList.toggle('op-motion-reduced',!guidedFull());
  const active=['draw','flip','reveal'].includes(deckPhase),count=Math.max(0,queue.length-(active?1:0)),done=ROSTER.filter(n=>state.tiers[n]).length;
  const stack=panel.querySelector('.op-deck-reserve');stack.disabled=deckPhase!=='pick'||!queue.length;
  const key=String(Math.min(5,count));if(stack.dataset.count!==key){stack.dataset.count=key;stack.innerHTML=stackMarkup(count)}
  stack.classList.toggle('op-stack-empty',!count);
  panel.querySelector('.op-deck-remaining').textContent='남은 카드 '+count+'장';
  panel.querySelector('.op-guided-count').textContent=done+' / 20';
  const track=panel.querySelector('.op-guided-track');track.setAttribute('aria-valuenow',done);track.querySelector('i').style.width=done*5+'%';
  const progress=root.querySelector('.op-actions .op-progress');if(progress)progress.textContent=done+' / 20';
  for(const t of TIERS){const names=ROSTER.filter(n=>state.tiers[n]===t),slot=panel.querySelector('[data-op-completed="'+t+'"]'),label=slot.querySelector('.op-completed-names');const countNode=slot.querySelector('b');if(countNode.textContent!==String(names.length)){countNode.textContent=names.length;countNode.animate?.([{transform:'translateY(2px)',opacity:.65},{transform:'translateY(-2px)',opacity:1},{transform:'none'}],{duration:200,easing:'ease-out'})}const key=JSON.stringify(names.map(n=>[n,display(n),current(n)?.image]));if(label.dataset.members!==key){label.dataset.members=key;label.title=names.map(display).join(', ');label.innerHTML=tierNames(names)}const btn=panel.querySelector('[data-op-assign="'+t+'"]');btn.disabled=deckPhase!=='reveal'||rankLock;btn.classList.remove('op-rank-chosen');btn.querySelector('small').textContent=names.length+'명'}
  panel.querySelector('[data-op-action="undo-guided"]').disabled=!guidedHistory.length||!['pick','reveal'].includes(deckPhase)||rankLock;
  panel.querySelector('[data-op-action="shuffle-guided"]').disabled=!['pick','reveal'].includes(deckPhase)||rankLock;
  const pause=panel.querySelector('[data-op-action="toggle-pause"]');pause.textContent=paused?'계속 진행':'일시정지';pause.setAttribute('aria-pressed',String(paused));
  panel.querySelector('[data-op-action="skip-guided"]').disabled=!canSkipGuided();
}
function openDraw(card,epoch){
  if(!liveDeck(epoch)||!card.isConnected)return;
  card.classList.remove('op-face-down','op-is-flipping','op-deal-flow');card.classList.add('op-face-open');deckPhase='reveal';markMotion('reveal');refreshGuided();
}
function drawCard(i=0){
  if(!root.classList.contains('active')||resetHold||!guided||deckPhase!=='pick'||rankLock||!queue.length||!Number.isInteger(i)||i<0||i>=queue.length)return;
  const n=queue[i];if(!current(n)||state.tiers[n]){shuffleDeck();return}
  const panel=root.querySelector('.op-guided'),stack=panel?.querySelector('.op-deck-reserve'),center=panel?.querySelector('.op-single-center');
  if(!stack||!center)return;
  queue.splice(i,1);queue.unshift(n);const epoch=deckEpoch;
  deckPhase='draw';guidedMode=motionPreference();markMotion('draw');const card=guidedCard(n,true);
  // The moving face-down card exists at the physical deck before being reparented.
  stack.append(card);card.classList.add('op-card-on-stack');
  const from=card.getBoundingClientRect();
  card.classList.remove('op-card-on-stack');center.replaceChildren(card);
  const to=card.getBoundingClientRect(),scale=draftScale(),dx=(from.left+from.width/2-to.left-to.width/2)/scale,dy=(from.top+from.height/2-to.top-to.height/2)/scale;
  const sx=from.width/to.width,sy=from.height/to.height;refreshGuided();
  const front=card.querySelector('.op-card-front'),back=card.querySelector('.op-card-back');
  const end=MOTION.flipStart+MOTION.flip,origin=document.timeline?.currentTime;
  const beginFlip=()=>{
    if(!liveDeck(epoch)||!card.isConnected)return;
    deckPhase='flip';markMotion('flip');refreshGuided();
    if(guidedFull())card.classList.add('op-is-flipping');
  };
  const finish=()=>{if(!liveDeck(epoch)||!card.isConnected||!['draw','flip'].includes(deckPhase))return;openDraw(card,epoch);deckEffects.forEach(a=>a.cancel());deckEffects=[]};
  if(!card.animate){
    deckWait(MOTION.flipStart,epoch,beginFlip);deckWait(end,epoch,finish);return
  }
  const play=(node,frames,opts)=>onTimeline(node,frames,opts,origin,deckEffects);
  if(guidedFull()){
    card.classList.add('op-deal-flow');
    // Translation and rotation are separate tracks of the same timeline. No stop at center.
    const flight=play(card,[{offset:0,transform:'translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')'},{offset:.16,transform:'translate('+(dx*.91)+'px,'+(dy*.91-12)+'px) scale('+sx+','+sy+') rotate(-4deg)'},{offset:1,transform:'none'}],{duration:MOTION.draw,easing:'cubic-bezier(.24,.62,.26,1)'});
    const f=play(front,[{transform:'rotateY(180deg)',visibility:'hidden'},{offset:.48,transform:'rotateY(94deg)',visibility:'hidden'},{offset:.5,transform:'rotateY(90deg)',visibility:'visible'},{transform:'rotateY(0deg)',visibility:'visible'}],{delay:MOTION.flipStart,duration:MOTION.flip,easing:'cubic-bezier(.34,.12,.38,1)'});
    const b=play(back,[{transform:'rotateY(0deg)',visibility:'visible'},{offset:.5,transform:'rotateY(-90deg)',visibility:'visible'},{offset:.52,transform:'rotateY(-94deg)',visibility:'hidden'},{transform:'rotateY(-180deg)',visibility:'hidden'}],{delay:MOTION.flipStart,duration:MOTION.flip,easing:'cubic-bezier(.34,.12,.38,1)'});
    deckWait(MOTION.flipStart,epoch,beginFlip);
    Promise.all([flight.finished,f.finished,b.finished]).then(finish).catch(()=>{});
  }else{
    const fade=play(card,[{opacity:.1},{opacity:1}],{duration:MOTION.draw,easing:'ease-out'});
    const bf=play(back,[{opacity:1},{opacity:0}],{delay:MOTION.flipStart,duration:MOTION.flip*.5,easing:'ease-in-out'});
    const ff=play(front,[{opacity:0,visibility:'visible',transform:'none'},{opacity:1,visibility:'visible',transform:'none'}],{delay:MOTION.flipStart+MOTION.flip*.5,duration:MOTION.flip*.5,easing:'ease-out'});
    deckWait(MOTION.flipStart,epoch,beginFlip);
    Promise.all([fade.finished,bf.finished,ff.finished]).then(finish).catch(()=>{});
  }
}

// Retain the logical deck, never detached animation nodes or stale timers.
// A partially drawn card is restored face-up; a committed rank stays committed.
function suspendGuided(){
  if(!guided)return;
  const phase=['draw','flip','reveal'].includes(deckPhase)?'reveal':'pick';
  guidedResume={queue:[...queue],history:[...guidedHistory],paused,phase,links:{...state.links}};
  stopShuffle();clearRankMotion();rankLock=false;guided=false;deckPhase='pick';
}
function resumeGuided(){
  const saved=guidedResume;if(!saved)return false;
  guidedResume=null;sync();
  const eligible=ROSTER.filter(n=>current(n)&&!state.tiers[n]);
  if(!eligible.length){guided=false;choosingMode=false;tab='tier';render();return true}
  const valid=new Set(eligible);
  queue=[...new Set(saved.queue.filter(n=>valid.has(n)&&saved.links[n]===state.links[n]))];
  for(const n of eligible)if(!queue.includes(n))queue.push(n);
  guidedHistory=saved.history.filter(n=>state.tiers[n]&&saved.links[n]===state.links[n]);
  paused=saved.paused;guided=true;choosingMode=false;tab='tier';selected='';notice='';
  deckPhase=saved.phase==='reveal'&&queue[0]===saved.queue[0]&&saved.links[queue[0]]===state.links[queue[0]]?'reveal':'pick';
  rebuildingGuided=true;try{render()}finally{rebuildingGuided=false}
  if(deckPhase==='pick'&&!paused&&!document.hidden)drawCard(0);
  return true;
}
function nextGuided(){
  clearRankMotion();rankLock=false;deckPhase='pick';
  if(!queue.length){stopShuffle();const n=guidedHistory.at(-1);if(n)lastMove={n,from:'',to:state.tiers[n]};guided=false;render();return}
  root.querySelector('.op-single-center')?.replaceChildren();refreshGuided();
  if(!paused&&!document.hidden)drawCard(0);
}
function skipGuidedMotion(){
  if(!guided||!canSkipGuided())return;
  markMotion('skip-'+deckPhase);
  // One explicit skip affects the current animation only; the next card uses normal timing.
  if(rankLock){rankCompletion?.();return}
  if(deckPhase==='shuffle'){stopShuffle();finishShuffle(deckEpoch);return}
  if(['draw','flip'].includes(deckPhase)){stopShuffle();const card=root.querySelector('.op-single-center .op-reveal-card');if(card)openDraw(card,deckEpoch);else{refreshGuided();if(!paused&&!document.hidden)drawCard(0)}}
}
// A whole frame crossfades as one unit, without drawing individual sides.
function portraitForge(t){
  return '<span class="op-portrait-forge" data-tier="'+t+'" aria-hidden="true"><span class="op-portrait-seal"></span></span>';
}
function confirmRank(t,source){
  if(rankLock||!guided||deckPhase!=='reveal'||!queue.length||!TIERS.includes(t))return;
  const n=queue[0],card=root.querySelector('.op-reveal-card'),panel=root.querySelector('.op-guided');
  if(!current(n)||state.tiers[n]||!card||!panel)return;
  const target=panel.querySelector('[data-op-completed="'+t+'"]'),portrait=card.querySelector('.op-portrait'),front=card.querySelector('.op-card-front'),name=card.querySelector('.op-player-name');
  if(!target||!portrait||!front||!name)return;
  deckEffects.forEach(a=>a.cancel());deckEffects=[];queue.shift();state.tiers[n]=t;state.teams=[];guidedHistory.push(n);save();rankLock=true;
  deckPhase='confirm';guidedMode=motionPreference();markMotion('confirm',t);panel.classList.remove('op-deck-phase-reveal');panel.classList.add('op-deck-phase-confirm');panel.classList.toggle('op-motion-full',guidedFull());panel.classList.toggle('op-motion-reduced',!guidedFull());
  panel.querySelector('[data-op-action="skip-guided"]').disabled=false;
  root.querySelectorAll('[data-op-assign]').forEach(x=>x.disabled=true);panel.querySelector('[data-op-action="undo-guided"]').disabled=true;source.classList.add('op-rank-chosen');
  const full=guidedFull(),scale=draftScale(),r=card.getBoundingClientRect(),d=target.getBoundingClientRect();
  const dx=(d.left+d.width/2-r.left-r.width/2)/scale,dy=(d.top+d.height/2-r.top-r.height/2)/scale;
  // Mount all layers once. The portrait and card geometry are never replaced or restyled mid-effect.
  card.classList.add('op-rank-flow');card.dataset.opPendingTier=t;
  portrait.insertAdjacentHTML('beforeend',portraitForge(t));
  const forge=portrait.querySelector('.op-portrait-forge');
  const frame=document.createElement('span');frame.className='op-flow-frame';frame.dataset.tier=t;frame.setAttribute('aria-hidden','true');frame.innerHTML='<b></b>';card.append(frame);
  const plate=document.createElement('span');plate.className='op-flow-plate';plate.dataset.tier=t;plate.setAttribute('aria-hidden','true');plate.textContent=name.textContent;name.append(plate);
  front.insertAdjacentHTML('beforeend',cardBadge(t,true));const badge=front.querySelector('.op-confirm-rank');badge.classList.add('op-flow-badge');
  const finish=()=>{if(!rankLock||!card.isConnected)return;markMotion('land',t);nextGuided();if(target.isConnected)target.animate?.([{filter:'brightness(1.35)',transform:'scale(1.025)'},{filter:'none',transform:'none'}],{duration:300,easing:'ease-out'});};
  rankCompletion=finish;
  const offsets=[['portrait',MOTION.portraitStart],['material',MOTION.materialStart],['name',MOTION.nameStart],['badge',MOTION.badgeStart],['flight',MOTION.flightStart]];
  let phaseIndex=0;
  const record=(elapsed)=>{while(phaseIndex<offsets.length&&elapsed>=offsets[phaseIndex][1]){const phase=offsets[phaseIndex++][0];markMotion(phase,t);if(phase==='flight')card.classList.add('op-rank-flight')}};
  const origin=document.timeline?.currentTime??performance.now();
  const tick=()=>{if(!rankLock||!card.isConnected)return;record((document.timeline?.currentTime??performance.now())-origin);if(phaseIndex<offsets.length)rankClock=requestAnimationFrame(tick)};
  rankClock=requestAnimationFrame(tick);
  if(!card.animate){card.classList.add('op-flow-fallback');rankTimer=setTimeout(()=>{record(MOTION.rankEnd);finish()},MOTION.rankEnd);return}
  const play=(node,frames,opts)=>onTimeline(node,frames,opts,origin,rankEffects);
  const fade=(node,start,duration)=>play(node,[{opacity:0},{opacity:1}],{delay:start,duration,easing:'cubic-bezier(.2,.55,.3,1)'});
  const seal=forge.querySelector('.op-portrait-seal');
  for(const layer of [seal,frame,plate,badge])fade(layer,0,250);
  const gleam=frame.querySelector('b');
  if(full)play(gleam,[{opacity:0},{offset:.35,opacity:.65},{opacity:0}],{delay:180,duration:420,easing:'ease-in-out'});
  // One uninterrupted transform track: neutral scale -> tiny lift -> transfer to the tier.
  const duration=MOTION.rankEnd;
  const travel=play(card,full?[
    {offset:0,transform:'none',opacity:1},
    {offset:MOTION.flightStart/duration,transform:'none',opacity:1,easing:'cubic-bezier(.35,.06,.54,1)'},
    {offset:1,transform:'translate('+dx+'px,'+dy+'px) scale(.19)',opacity:0}
  ]:[{offset:0,opacity:1},{offset:MOTION.flightStart/duration,opacity:1},{offset:1,opacity:0}],{duration,easing:'linear'});
  travel.finished.then(()=>{record(MOTION.rankEnd);finish()}).catch(()=>{});
}
function tierBoard(){
  const unassigned=ROSTER.filter(n=>!state.tiers[n]);

  return '<div class="op-tier-workspace"><div class="op-pool '+(!unassigned.length?'op-pool-empty':'')+'" data-count="'+unassigned.length+'" data-op-drop=""><div class="op-block-head"><h2>미분류 <small>'+unassigned.length+'</small></h2><div class="op-pool-actions">'+button('choose-mode','방식 변경')+(lastMove?button('undo-move','되돌리기'):'')+button('reset','초기화')+'<button type="button" data-op-tier="" '+(!selected?'disabled':'')+'>미분류로 이동</button></div></div>'+(unassigned.length?'<div class="op-player-grid">'+unassigned.map(n=>player(n)).join('')+'</div>':'')+'</div><div class="op-board" data-layout="columns">'+TIERS.map(row).join('')+'</div></div>';
}
async function saveConfig(){
  if(!canConfigure()||!configDraft||configSaving||artBusy||!configDirty())return;
  const linksChanged=configLinksChanged(),ids=[...ROSTER.map(n=>configDraft.links[n]),...configDraft.roles];
  if(!configPending&&linksChanged&&(ids.some(id=>!id||!byId.has(id))||new Set(ids).size!==25)){
    configNotice='주최자, 감독 및 참가자 25명을 중복 없이 연결하세요.';renderConfig();return;
  }
  if(!configPending){
    if(linksChanged&&!sameConfig(readConfig(),configBaseline.links)){
      configNotice='다른 변경사항이 발견되었습니다. 창을 닫고 최신 설정을 확인한 뒤 다시 편집하세요.';renderConfig();return;
    }
    if(Object.keys(configArt).some(n=>agentArt(n)!==configBaseline.art[n])){
      configNotice='편집 중인 이미지가 다른 곳에서 변경되었습니다. 최신 이미지를 확인한 뒤 다시 편집하세요.';renderConfig();return;
    }
  }
  configSaving=true;configNotice='';renderConfig();
  let saved=false;
  try{
    const d=getData();
    if(!configPending&&linksChanged)d.miniGames[CONFIG_KEY]={links:{...configDraft.links},roles:[...configDraft.roles]};
    if(!configPending&&Object.keys(configArt).length){
      const prior=d.miniGames[ART_KEY],players=(Array.isArray(prior?.players)?prior.players:[]).filter(p=>p&&squadFor(p.id)&&!Object.hasOwn(configArt,p.id));
      d.miniGames[ART_KEY]={...prior,players:[...players,...Object.entries(configArt).filter(([,image])=>image).map(([id,image])=>({id,image}))]};
    }
    configPending=true;window.saveData('오퍼 M 인물 및 이미지 설정');
    if(!await window.mwsV55SaveNow())throw Error('온라인 저장 미확인');
    saved=true;
  }catch(err){configNotice=configPending?'온라인 저장 미확인 · 다시 시도하거나 공용 저장 상태를 확인하세요.':err.message||'저장 실패';}
  finally{
    configSaving=false;
    if(saved){clearConfig();notice='';render();root.querySelector('[data-op-action="open-config"]')?.focus({preventScroll:true});if(root.classList.contains('active'))feedback('공용 인물 설정 저장 완료')}
    else renderConfig();
  }
}
function teamHeader(i,score){
  const c=byId.get(state.roles[i+1]),name=c?.name||'감독 '+(i+1);
  return '<header'+(teamByName(name)?' style="--team:'+teamByName(name).color+'"':'')+'>'+commanderPortrait(c,name)+'<div class="op-team-identity"><strong title="'+esc(name)+'">'+esc(name)+'</strong></div><b data-op-team-score>'+score+'점</b></header>';
}
function teamFooter(stats){
  return '<footer>'+TIERS.map(t=>'<span data-tier="'+t+'" aria-label="'+t+' 티어 '+stats.counts[t]+'명">'+crest(t)+'<span>'+t+'</span><b>'+stats.counts[t]+'</b></span>').join('')+'</footer>';
}
function results(){
  const animating=!!draftRun;
  const stats=state.teams.map(t=>teamStats(t,state.tiers));
  if(!state.teams.length)return '<div class="op-teams">'+state.roles.slice(1).map((id,i)=>'<article class="op-team" data-team="'+i+'" style="--team:'+(teamByName(byId.get(state.roles[i+1])?.name)?.color||'#8496ad')+'">'+tacFrame()+teamHeader(i,0)+'<div class="op-team-players op-team-placeholder" aria-hidden="true">'+Array.from({length:5},()=>'<span class="op-team-slot"></span>').join('')+'</div>'+teamFooter(teamStats([],state.tiers))+'</article>').join('')+'</div><div class="op-result-cta">'+button('tab-tier','티어표에서 참가자 분류하기')+'</div>';
  return '<div class="op-teams '+(animating?'op-draft-animating':'')+'">'+state.teams.map((team,i)=>{
    const currentStats=animating?teamStats([],state.tiers):stats[i];
    return '<article class="op-team" data-team="'+i+'" style="--team:'+(teamByName(byId.get(state.roles[i+1])?.name)?.color||'#8496ad')+'">'+tacFrame()+teamHeader(i,currentStats.score)+'<div class="op-team-players">'+team.map(n=>player(n,'result')).join('')+'</div>'+teamFooter(currentStats)+'</article>'
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
  if(show){tab='result';render();flushPendingRefresh()}
}
function startDraft(){
  if(draftRun||rankLock||configDraft)return;sync();if(!available())return;guidedResume=null;
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
  if(!root.classList.contains('active')||resetDialog){if(resetDialog)pendingRefresh=true;return}
  if(!workspaceReady){
    clearHover();
    root.innerHTML='<div class="op-shell"><div class="op-result-empty">'+(workspaceError?'인물 설정을 불러오지 못했습니다. '+button('retry','다시 시도'):'<span class="op-loading-indicator" aria-hidden="true"></span>참가자 정보를 불러오는 중…')+'</div></div>';return;
  }
  if(configDraft){if(canConfigure()){renderConfig();return}clearConfig()}
  if(rankLock||draftRun&&!draftRender)return;
  if(guided&&root.querySelector('.op-single-stage')&&!rebuildingGuided)return;
  const view=tab+(choosingMode?':choice':guided?':guided':'');
  const entering=lastView!==view;
  const scrolls=lastView===view?Object.fromEntries([...root.querySelectorAll('.op-tier-row')].map(r=>[r.dataset.tier,r.querySelector('.op-player-grid')?.scrollTop||0])):{};
  lastView=view;
  if(!guided)sync();const assigned=ROSTER.filter(n=>TIERS.includes(state.tiers[n])).length;
  const action=tab==='command'||tab==='roster'||guided||choosingMode?'':button('draft',state.teams.length?'다시 자동 드래프트':'자동 드래프트','class="op-primary" '+(!available()||draftRun?'disabled':''))+(draftRun?button('skip-draft','연출 건너뛰기','class="op-skip-draft"'):tab==='result'&&state.teams.length===4?button('copy-results','명단 복사'):'');
  const scoreSpread=state.teams.length?Math.max(...state.teams.map(t=>teamStats(t,state.tiers).score))-Math.min(...state.teams.map(t=>teamStats(t,state.tiers).score)):null;
  const status=tab==='command'?'':notice||(saveFailed?'브라우저 저장 불가':missing.length?'연락처 미연결 '+missing.length+'명 · 관리자 설정이 필요합니다.':'');
  const previousTab=root.querySelector('.op-tabs [aria-pressed="true"]')?.getBoundingClientRect();
  clearHover();stopCommandTransitions();
  root.innerHTML='<div class="op-shell'+(entering?' op-view-enter':'')+'" data-view="'+tab+'"><div class="op-toolbar"><span class="op-page-label">'+(tacEmblem()+'<strong>오퍼 M</strong>')+'</span><nav class="op-command-tabs" aria-label="오퍼 M">'+button('tab-command','작전 현황','aria-pressed="'+(tab==='command')+'"')+button('tab-draft','기존 드래프트','aria-pressed="'+(tab!=='command')+'"')+'</nav>'+(tab==='command'?'':'<nav class="op-tabs" aria-label="기존 드래프트 도구">'+[['roster','참가자'],['tier','티어표'],['result','가상 드래프트']].map(([id,label])=>button('tab-'+id,label,'aria-pressed="'+(tab===id)+'"')).join('')+'</nav>')+'<div class="op-actions">'+(tab==='tier'&&!guided?'<span class="op-progress">'+assigned+' / 20</span>':tab==='result'&&!draftRun&&scoreSpread!==null?'<span class="op-progress">점수 차이 <b>'+scoreSpread+'</b></span>':'')+action+(canConfigure()&&!guided&&!draftRun&&!rankLock?button('open-config','인물 설정','class="op-settings" aria-label="관리자 인물 설정"'):'')+'</div></div>'+(status?'<div class="op-status" role="status">'+esc(status)+'</div>':'')+(tab==='command'?commandView():tab==='roster'?roster():tab==='tier'?(choosingMode?modeChoice():guided?guidedBoard():tierBoard()):results())+'</div>';
  for(const r of root.querySelectorAll('.op-tier-row')){const g=r.querySelector('.op-player-grid');if(g&&scrolls[r.dataset.tier])g.scrollTop=scrolls[r.dataset.tier]}
  updateSelection();
  if(guided&&root.querySelector('.op-single-stage'))refreshGuided();
  animateTab(previousTab);
  lastSignature=signature();lastPermission=canConfigure();pendingRefresh=false;
  if(tab==='command')snapshotCommandImages();
  const moved=arrived;
  arrived='';
  measureLayout();
  if(layoutFrame)cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(()=>{measureLayout();if(moved&&tab==='tier'&&!guided){const card=[...root.querySelectorAll('.op-board .op-player,.op-pool .op-player')].find(x=>x.dataset.opPlayer===moved);if(card){const grid=card.closest('.op-player-grid');if(grid&&grid.scrollHeight>grid.clientHeight){const r=card.getBoundingClientRect(),g=grid.getBoundingClientRect();if(r.bottom>g.bottom)grid.scrollTop+=r.bottom-g.bottom+8;else if(r.top<g.top)grid.scrollTop-=g.top-r.top+8}card.focus({preventScroll:true})}}});
}
// Fit by measured CSS-space width AND height, not by physical monitor width alone.
// A minimum readable card wins over forced fitting on small screens.
function fitRoster(area,width,height,set){
  const gap=width>=1050?10:8,coachCols=width>760?4:2;
  const coach=Math.max(58,Math.min((width-(coachCols-1)*gap)/coachCols*.44,height*.20,width*.10+28));
  // Apply the actual coach geometry before calculating the remaining roster height.
  set('--op-coach-size',coach);set('--op-roster-gap',gap);
  const grid=area.querySelector('.op-roster-grid'),style=getComputedStyle(area),children=[...area.children];
  const chrome=children.filter(el=>el!==grid).reduce((sum,el)=>sum+el.offsetHeight,0)+(parseFloat(style.rowGap)||0)*Math.max(0,children.length-1);
  const budget=Math.max(120,height-chrome-5);
  const choices=width>=740?[5,7,8,10]:width>=480?[4,5]:[3,4];
  const candidates=choices.map(cols=>{const rows=Math.ceil(20/cols),wide=(width-(cols-1)*gap)/cols,tall=(budget-(rows-1)*gap)/rows;return {cols,card:Math.min(wide,(tall-13)/1.16)}});
  const best=candidates.reduce((a,b)=>b.card>a.card?b:a),min=width>=740?86:76;
  let card=Math.max(min,Math.min(best.card,(width-(best.cols-1)*gap)/best.cols));
  set('--op-roster-card',card);
  // One bounded correction based on real rendered nameplate/footer heights.
  // Never squeeze mobile portraits just to eliminate natural scrolling.
  if(width>=800&&area.offsetHeight>height-3){
    const rows=Math.ceil(20/best.cols),excess=area.offsetHeight-height+4;
    card=Math.max(min,card-Math.ceil(excess/rows)-1);set('--op-roster-card',card);
  }
  area.dataset.rosterColumns=String(best.cols);root.style.setProperty('--op-roster-columns',String(best.cols));
}
function fitDraft(area,width,height,set){
  const gap=width>=1100?12:8,pad=8;
  const candidates=[];
  const options=width>=1050?[[4,3],[4,2],[2,5],[2,3]]:width>=650?[[2,3],[2,5]]:[[1,3]];
  for(const [cols,per] of options){
    const rows=Math.ceil(4/cols),teamW=(width-(cols-1)*gap)/cols;
    const teamH=(height-(rows-1)*gap)/rows;
    const cardW=(teamW-2*pad-(per-1)*gap-4)/per; // team border and fractional layout rounding
    const playerRows=Math.ceil(5/per);
    // Header, footer, border and spacing; card height follows width + nameplate.
    const chrome=Math.max(86,Math.min(134,teamH*.23));
    const cardH=((teamH-chrome-2*pad-(playerRows-1)*gap)/playerRows-13)/1.15;
    const card=Math.min(cardW,cardH);
    candidates.push({cols,per,rows,card,cardW,teamH,chrome,score:card*(cols===2&&per===5?1.12:1)});
  }
  const best=candidates.reduce((a,b)=>b.score>a.score?b:a);
  const floor=width>=1050?82:width>=650?78:78;
  const card=width<650?best.cardW:Math.max(Math.min(floor,best.cardW),Math.min(best.card,best.cardW)); // mobile stacks teams; never compress them to fit the viewport height
  area.dataset.teamColumns=String(best.cols);area.dataset.teamFormation=String(best.per);
  root.style.setProperty('--op-team-columns',String(best.cols));root.style.setProperty('--op-team-per-row',String(best.per));
  set('--op-team-card',card);set('--op-team-gap',gap);set('--op-team-pad',pad);
  set('--op-team-avatar',Math.max(42,Math.min(92,card*.43,best.chrome*.60)));
  // Keep results visible without forcing extra blank panel height or tiny cards.
  set('--op-result-height',height);
}
function measureLayout(){
  if(!root.classList.contains('active'))return;
  const area=root.querySelector('.op-command-workspace,.op-teams,.op-board,.op-guided,.op-mode-choice,.op-roster');if(!area)return;
  const rootRect=root.getBoundingClientRect(),scale=root.offsetWidth?rootRect.width/root.offsetWidth||1:1;
  const access=document.getElementById('mwsAccessTools'),accessRect=access?.getBoundingClientRect(),viewport=window.visualViewport;
  const viewportBottom=viewport?Math.min(innerHeight,viewport.offsetTop+viewport.height):innerHeight;
  const bottom=accessRect&&accessRect.height&&accessRect.top>0?Math.min(viewportBottom-14,accessRect.top-10):viewportBottom-18;
  const rootTop=Math.max(0,rootRect.top+(root.closest('.main')?.scrollTop||0)*scale);
  const set=(key,value)=>{const next=Math.floor(value)+'px';if(root.style.getPropertyValue(key)!==next)root.style.setProperty(key,next)};
  // Set the pool sizing budget first. The pool's new card sizes affect the board's top.
  set('--op-workspace-height',Math.max(240,(bottom-rootTop)/scale));
  // Read the resulting layout, not the pre-budget geometry or a transient entrance transform.
  const layoutTop=el=>{let y=0;for(let e=el;e;e=e.offsetParent)y+=e.offsetTop;return y};
  const areaTop=rootTop+Math.max(0,(layoutTop(area)-layoutTop(root))*scale);
  const available=Math.max(180,(bottom-areaTop)/scale);
  set('--op-available',Math.max(180,available-(area.classList.contains('op-board')?7:0)));if(area.classList.contains('op-command-workspace')){
    // Height budget includes the actual toolbar, fixed bottom controls, browser zoom and sidebar.
    const width=area.clientWidth;
    const compact=width>=800&&available>=410;
    area.classList.toggle('op-command-fit',compact);area.classList.toggle('op-detail-fit',width>=800&&available>=520);
    const height=Math.max(0,available-3);
    set('--op-command-height',height);
    set('--op-command-unit',Math.max(9,Math.min(width/125,height/60,24)));
    return;
  }
  if(area.classList.contains('op-roster')){fitRoster(area,area.clientWidth,available,set);return}
  if(area.classList.contains('op-teams')){const cta=root.querySelector('.op-result-cta');fitDraft(area,area.clientWidth,Math.max(180,available-(cta?cta.offsetHeight+12:0)),set);return}
  if(area.classList.contains('op-mode-choice'))return;
  if(area.classList.contains('op-single-stage')){
    const stage=area.querySelector('.op-guided-stage'),center=area.querySelector('.op-single-center'),style=getComputedStyle(area);
    const chrome=[...area.children].filter(el=>el!==stage).reduce((sum,el)=>sum+el.offsetHeight,0)+(parseFloat(style.rowGap)||0)*3+(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0);
    set('--op-single-stage-height',Math.max(310,Math.min(1640,available-chrome-8)));
    set('--op-single-card',Math.max(132,Math.min(960,(center?.clientWidth||area.clientWidth)-24,(center?.clientHeight||available)-Math.max(60,Math.min(100,available*.048)))));
    return
  }
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
if(typeof ResizeObserver==='function'){let lastWidth=-1;const observer=new ResizeObserver(()=>{const width=root.getBoundingClientRect().width;if(root.classList.contains('active')&&Math.abs(width-lastWidth)>.5){lastWidth=width;scheduleMeasure()}});observer.observe(root);const main=root.closest('.main');if(main)observer.observe(main)}
function signature(){return JSON.stringify(ROSTER.map(n=>{const c=current(n);return[state.links[n],c?.id,c?.name,photoSource(c),agentArt(n)]}).concat(state.roles.map(id=>{const c=byId.get(id);return[id,c?.name,photoSource(c)]})))}
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
function showPicker(n){picker=n;query='';renderConfig({focus:'[data-op-search]'})}
// Only the hovered portrait moves; pointer position is never used for game state.
const hoverFine=matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
let hoverCard=null,hoverFrame=0,hoverPoint=null,hoverRect=null;
function clearHover(){
  if(hoverFrame)cancelAnimationFrame(hoverFrame);hoverFrame=0;hoverPoint=null;hoverRect=null;
  if(hoverCard){hoverCard.classList.remove('op-tilt');for(const key of ['--op-rx','--op-ry','--op-light-x','--op-light-y'])hoverCard.style.removeProperty(key);hoverCard=null}
}
function pulseCount(el){if(!reducedMotion())el?.animate?.([{transform:'translateY(2px)',opacity:.65},{transform:'translateY(-2px)',opacity:1},{transform:'none'}],{duration:200,easing:'ease-out'})}
function animateTab(previous){
  if(!previous||interfaceMotionReduced())return;
  const tabs=root.querySelector('.op-tabs'),active=tabs?.querySelector('[aria-pressed="true"]');if(!active)return;
  const next=active.getBoundingClientRect(),parent=tabs.getBoundingClientRect(),scale=draftScale();
  if(Math.abs(previous.left-next.left)+Math.abs(previous.top-next.top)<2)return;
  const indicator=document.createElement('span');indicator.className='op-tab-travel';indicator.setAttribute('aria-hidden','true');indicator.style.cssText='left:'+((next.left-parent.left)/scale)+'px;top:'+((next.bottom-parent.top)/scale-3)+'px;width:'+(next.width/scale)+'px';tabs.append(indicator);
  const anim=indicator.animate?.([{transform:'translate('+((previous.left-next.left)/scale)+'px,'+((previous.top-next.top)/scale)+'px) scaleX('+previous.width/next.width+')',opacity:1},{transform:'none',opacity:1},{opacity:0}],{duration:240,easing:'cubic-bezier(.2,.75,.2,1)'});if(anim)anim.onfinish=()=>indicator.remove();else indicator.remove();
}
const updateCommandPointer=e=>{
  const mouse=e.pointerType==='mouse';
  if(mouse&&root.dataset.opPointer!=='mouse')root.dataset.opPointer='mouse';
  else if(!mouse&&root.hasAttribute('data-op-pointer'))root.removeAttribute('data-op-pointer');
};
root.addEventListener('pointerover',updateCommandPointer);
root.addEventListener('pointerdown',updateCommandPointer);
root.addEventListener('pointermove',e=>{
  updateCommandPointer(e);
  if(!hoverFine.matches||interfaceMotionReduced()||dragName||draftRun||rankLock||configDraft){clearHover();return}
  const card=e.target.closest('.op-player[data-rarity]');if(!card||!root.contains(card)){clearHover();return}
  if(hoverCard!==card){clearHover();hoverCard=card;hoverRect=card.getBoundingClientRect()}
  hoverPoint={x:e.clientX,y:e.clientY};if(hoverFrame)return;
  hoverFrame=requestAnimationFrame(()=>{hoverFrame=0;const c=hoverCard,r=hoverRect,p=hoverPoint;if(!c?.isConnected||!r?.width||!r.height||!p)return;
    const x=Math.max(0,Math.min(1,(p.x-r.left)/r.width)),y=Math.max(0,Math.min(1,(p.y-r.top)/r.height));
    c.style.setProperty('--op-rx',((.5-y)*9).toFixed(2)+'deg');c.style.setProperty('--op-ry',((x-.5)*9).toFixed(2)+'deg');c.style.setProperty('--op-light-x',(x*100).toFixed(1)+'%');c.style.setProperty('--op-light-y',(y*100).toFixed(1)+'%');c.classList.add('op-tilt');
  });
});
root.addEventListener('pointerout',e=>{if(hoverCard&&!hoverCard.contains(e.relatedTarget))clearHover()});
root.addEventListener('pointerleave',()=>{delete root.dataset.opPointer;clearHover()});
root.addEventListener('scroll',clearHover,true);
window.addEventListener('resize',clearHover);
window.addEventListener('mws-motion-change',()=>{if(interfaceMotionReduced()){clearHover();stopCommandTransitions()}});
root.addEventListener('click',e=>{
  if(resetDialog&&!resetDialog.open)resetSettle?.();
  if(resetDialog)return;
  const b=e.target.closest('button');if(handleConfigClick(e,b))return;if(b?.dataset.opAgent){const t=squadFor(b.dataset.opAgent);if(t&&!artBusy)goCommand(t.id,b.dataset.opAgent,b);return}if(b?.dataset.opSquad){if(!artBusy)goCommand(b.dataset.opSquad,'',b);return}if(b?.dataset.opCompleted){showTierMembers(b.dataset.opCompleted);return}if(b?.dataset.opAction==='close-tier-members'||e.target.classList.contains('op-tier-members')){root.querySelector('.op-tier-members')?.remove();root.querySelector('[data-op-completed="'+expandedTier+'"]')?.focus({preventScroll:true});expandedTier='';return}if(draftRun){const action=b?.dataset.opAction;if(action==='skip-draft'){finishDraft(true);return}if(!['tab-command','tab-draft','tab-roster','tab-tier','tab-result'].includes(action))return;finishDraft(false)}if(b?.hasAttribute('data-op-draw')&&root.contains(b)){drawCard(Number(b.dataset.opDraw));return}if(!b||!root.contains(b)){const target=e.target.closest('.op-tier-row');if(target&&selected&&!rankLock)move(selected,target.dataset.tier);else if(e.target.closest('.op-pool')&&selected&&!rankLock)move(selected,'');return;}
  if(guided&&['shuffle','draw','flip'].includes(deckPhase)&&!['choose-mode','exit-guided','tab-command','tab-draft','tab-roster','tab-tier','tab-result','toggle-pause','skip-guided','reset'].includes(b.dataset.opAction))return;
  const n=b.dataset.opPlayer;
  if(n){if(b.dataset.opResult||tab!=='tier'||!current(n))return;selected=selected===n?'':n;notice='';updateSelection();return}
  if(b.hasAttribute('data-op-tier')){if(selected)move(selected,b.dataset.opTier);return}
  if(b.dataset.opAssign){if(e.detail<=1)confirmRank(b.dataset.opAssign,b);return}
  if(guided&&['tab-tier','tab-draft'].includes(b.dataset.opAction))return;
  if(rankLock&&b.dataset.opAction==='skip-guided'){skipGuidedMotion();return}
  if(rankLock&&b.dataset.opAction==='toggle-pause'){paused=!paused;b.textContent=paused?'계속 진행':'일시정지';b.setAttribute('aria-pressed',String(paused));return}
  if(rankLock&&b.dataset.opAction!=='reset'){if(!['choose-mode','exit-guided','tab-command','tab-draft','tab-roster','tab-tier','tab-result'].includes(b.dataset.opAction))return;clearRankMotion();rankLock=false;deckPhase='pick';}
  switch(b.dataset.opAction){
    case 'tab-command':if(!artBusy)goCommand();break;
    case 'command-back':if(!artBusy)goCommand();break;
    case 'command-team-back':if(!artBusy)goCommand(activeSquad);break;
    case 'tab-draft':if(artBusy)break;if(guided)break;if(guidedResume&&resumeGuided())break;stopShuffle();clearRankMotion();rankLock=false;choosingMode=false;guided=false;tab='roster';selected='';notice='';render();break;
    case 'choose-mode':chooseMode(e.detail===0);break;
    case 'start-guided':lastMove=null;startGuided();break;
    case 'shuffle-guided':if(guided&&['pick','reveal'].includes(deckPhase))shuffleDeck();break;
    case 'toggle-pause':if(guided){paused=!paused;refreshGuided();if(!paused&&deckPhase==='pick')drawCard(0)}break;
    case 'skip-guided':if(guided)skipGuidedMotion();break;
    case 'start-list':guidedResume=null;stopShuffle();choosingMode=false;guided=false;tab='tier';selected='';notice='';render();break;
    case 'undo-move':{const m=lastMove;lastMove=null;if(m&&current(m.n)&&(state.tiers[m.n]||'')===m.to){if(m.from)state.tiers[m.n]=m.from;else delete state.tiers[m.n];state.teams=[];selected='';save();refreshBoard(m.n,m.to,m.from)}break;}
    case 'exit-guided':guidedResume=null;stopShuffle();choosingMode=false;guided=false;render();break;
    case 'undo-guided':{if(!['pick','reveal'].includes(deckPhase))break;const n=guidedHistory.pop();if(n){stopShuffle();delete state.tiers[n];state.teams=[];queue=[n,...queue.filter(x=>x!==n)];guided=true;deckPhase='reveal';save();const center=root.querySelector('.op-single-center'),card=guidedCard(n);center?.replaceChildren(card);refreshGuided();if(card.animate)deckAnimate(card,[{transform:'translateY(12px) scale(.94)',opacity:.5},{transform:'none',opacity:1}],{duration:250,easing:'ease-out'})}break;}
    case 'retry':void enter();break;
    case 'tab-roster':suspendGuided();stopShuffle();choosingMode=false;guided=false;tab='roster';selected='';notice='';render();break;
    case 'tab-tier':if(guided)break;if(!resumeGuided())chooseMode(e.detail===0);break;
    case 'tab-result':suspendGuided();stopShuffle();choosingMode=false;guided=false;tab='result';selected='';notice='';render();break;
    case 'open-config':openConfig();break;
    case 'reset':{openResetDialog(b);break;}
    case 'draft':startDraft();break;
    case 'copy-results':void copyResults();break;
    case 'close-copy':root.querySelector('.op-copy-overlay')?.remove();root.querySelector('[data-op-action="copy-results"]')?.focus({preventScroll:true});break;
  }
});
root.addEventListener('change',e=>{const n=e.target.dataset?.opAgentUpload;if(n)void saveAgentImage(n,e.target.files?.[0])});
root.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement){e.target.style.visibility='hidden';e.target.classList.remove('is-ready')}},true);
root.addEventListener('load',e=>{if(e.target instanceof HTMLImageElement&&e.target.naturalWidth){e.target.style.removeProperty('visibility');e.target.classList.add('is-ready')}},true);
root.addEventListener('keydown',e=>{
  if(resetDialog)return;
  if(configDraft){
    const dialog=root.querySelector('.op-config');
    if(e.key==='Tab'&&dialog){const focusable=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(x=>!x.closest('[inert]')&&x.getClientRects().length);if(focusable.length){const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&(document.activeElement===first||!focusable.includes(document.activeElement))){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||!focusable.includes(document.activeElement))){e.preventDefault();first.focus()}}}
    if(e.key==='Escape'){e.preventDefault();if(!configSaving&&!artBusy){if(configDiscard){configDiscard=false;renderConfig({focus:'[data-op-action="close-config"]'})}else if(picker)closePicker();else closeConfig()}}
    return;
  }
  if(tab==='command'&&activeAgent&&!artBusy&&!configDraft&&!root.querySelector('dialog[open]')&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.shiftKey&&!e.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
    const t=squadFor(activeAgent),i=t.members.indexOf(activeAgent),next=e.key==='Home'?0:e.key==='End'?4:(i+(e.key==='ArrowLeft'?4:1))%5;
    e.preventDefault();goCommand(t.id,t.members[next],e.target.closest('.op-agent-switch-grid,.op-detail-step')?e.target:root.querySelector('.op-agent-switch.is-current'));return;
  }
  if(e.key==='Escape'&&root.querySelector('.op-tier-members')){root.querySelector('.op-tier-members')?.remove();root.querySelector('[data-op-completed="'+expandedTier+'"]')?.focus({preventScroll:true});expandedTier=''}else if(e.key==='Escape'&&root.querySelector('.op-copy-overlay')){root.querySelector('.op-copy-overlay')?.remove();root.querySelector('[data-op-action="copy-results"]')?.focus({preventScroll:true})}else if(e.key==='Escape'&&dragName){clearDrag(true)}else if(e.key==='Escape'&&tab==='command'&&!artBusy&&(activeAgent||activeSquad)){goCommand(activeAgent?activeSquad:'')}else if(e.key==='Escape'&&selected){selected='';updateSelection()}});
window.addEventListener('keydown',e=>{if(!root.classList.contains('active')||!guided||deckPhase!=='reveal'||rankLock||resetDialog||configDraft||root.querySelector('.op-tier-members')||e.repeat||e.ctrlKey||e.altKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||'')||e.target?.isContentEditable)return;const i=Number(e.key)-1;if(/^[1-5]$/.test(e.key)&&TIERS[i]){e.preventDefault();root.querySelector('[data-op-assign="'+TIERS[i]+'"]')?.click()}});
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
root.addEventListener('dragend',()=>{clearDrag(!!dragName);flushPendingRefresh()});
function clearResetDialog(){
  const dialog=resetDialog;resetDialog=null;resetSettle=null;resetHold=false;
  if(dialog?.open)dialog.close('cancel');dialog?.remove();
}
function refreshView(){
  if(!root.classList.contains('active')||!workspaceReady)return;
  if(configDraft){if(!canConfigure()){clearConfig();render()}else pendingRefresh=true;return}
  if(resetDialog||guided||rankLock||draftRun||dragName||artBusy){pendingRefresh=true;return}
  sync();const next=signature();
  if(lastPermission!==canConfigure()){render();return}
  if(next===lastSignature){pendingRefresh=false;return}
  if(tab==='command'&&refreshCommandImages()){lastSignature=next;pendingRefresh=false;return}
  render();
}
function flushPendingRefresh(){if(pendingRefresh)refreshView()}
function renderExternal(){
  if(!workspaceReady||!root.querySelector('.op-shell[data-view]')){render();return}
  refreshView();
}
window.addEventListener('mws:workspace-tab-v1',e=>{
  if(e.detail?.tab==='operationM'){
    const title=document.getElementById('pageTitle');if(title)title.textContent='오퍼 M';void enter();return;
  }
  if(!workspaceWasActive)return;
  workspaceWasActive=false;resumeOnEnter=true;
  clearResetDialog();clearHover();stopCommandTransitions();suspendGuided();
  if(draftRun){finishDraft(false);tab='result'}
  clearDrag(false);stopShuffle();clearRankMotion();rankLock=false;
  // Close the top-layer dialog without discarding unsubmitted settings.
  if(configDraft){const dialog=root.querySelector('.op-config');if(dialog?.open)dialog.close()}
});
let workspaceScope=document.body.dataset.mwsMode||'';
window.addEventListener('mws:app-ready',e=>{
  const scope=e.detail?.scope||document.body.dataset.mwsMode||'',sameScope=scope===workspaceScope;workspaceScope=scope;
  if(sameScope&&workspaceReady){if(root.classList.contains('active'))refreshView();return}
  ++workspaceLoadEpoch;workspaceLoading=false;
  clearResetDialog();finishDraft(false);stopShuffle();clearRankMotion();rankLock=false;
  guidedResume=null;guided=false;choosingMode=false;tab='command';activeAgent='';activeSquad='';workspaceReady=false;resumeOnEnter=true;clearConfig();
  if(root.classList.contains('active'))void enter()
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){clearHover();stopCommandTransitions();if(draftRun)finishDraft(true);return}
  if(root.classList.contains('active')&&guided&&!paused&&deckPhase==='pick'&&!rankLock)drawCard(0);
});
window.addEventListener('beforeunload',e=>{if(configDraft&&configDirty()&&!configPending){e.preventDefault();e.returnValue=''}});
window.addEventListener('mawang:datachange',()=>window.mwsOperationM?.refresh());
window.mwsOperationM={render:renderExternal,motionReport(){return{phase:deckPhase,mode:guidedMode,paused,settings:{app:typeof window.mwsMotionReduced==='function'?window.mwsMotionReduced():null,system:reducedMotion(),hidden:document.hidden},events:motionTrace.map(x=>({...x}))}},refresh:refreshView};
if(root.classList.contains('active'))void enter();
}
