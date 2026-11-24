import {MAWANG_ID,MAX_CAMPAIGNS,MAX_ENTRIES,parsePostUrl,commentPermalink,normalizeEntry,normalizeCampaigns,parseCommentPage,uniqueApplicants,countdown,campaignStatus,compareRankSnapshots,MAX_AUTHORS,fromKstInput,toKstInput,rankEntries} from './content-applications-model-v1.js?v=5';
const section=document.getElementById('contentApplications');
if(section){
const $=id=>document.getElementById(id),list=$('caList'),detail=$('caDetail'),editor=$('caEditor'),form=$('caForm');
const dashboard=$('dashboard'),overview=$('dashboardOverviewMode'),dashboardSupport=$('dashboardApplicationSupport');
const number=n=>n==null?'확인 불가':n.toLocaleString('ko-KR');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const heart='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 3.6 12.6A5.5 5.5 0 0 1 11.4 4.8l.6.7.6-.7a5.5 5.5 0 0 1 7.8 7.8Z"/></svg>';
const external='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6m0-6L10 14m9-1v7H4V5h7"/></svg>';
const clock='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
let selected='',editing='',busy=false,timer=0,sessionMode='',epoch=0;
const snapshots=new Map(),pending=new Map(),attempts=new Map(),rankMotions=new Map(),sourceReads=new Map();
const isAdmin=()=>document.body.dataset.mwsMode==='admin'&&window.__mwsAppReadyV130===true;
const sectionActive=()=>section.classList.contains('active');
const dashboardActive=()=>!!dashboardSupport&&dashboard?.classList.contains('active')&&overview?.classList.contains('active');
const active=()=>!document.hidden&&(sectionActive()||dashboardActive());
const records=()=>normalizeCampaigns(typeof data==='object'?data.contentApplications:[]);
const current=()=>records().find(c=>c.id===selected);
const kst=v=>toKstInput(v).replace('T',' ')+' KST';
const signature=c=>c.entries.map(e=>e.id).join('|');
// Last observed public comment results, local only. Never fetch expired campaigns
// to fill missing history. Keep the cache bounded and tolerate unavailable storage.
const ARCHIVE_KEY='mws-ca-last-read-v1',ARCHIVE_MAX=1500000;
function readArchive(){
 try{const raw=localStorage.getItem(ARCHIVE_KEY);const rows=raw&&raw.length<=ARCHIVE_MAX?JSON.parse(raw):[];return Array.isArray(rows)?rows:[]}catch(_){return []}
}
let archive=readArchive();
function archiveSnapshot(c,s){
 try{
  const byId=new Map(readArchive().filter(x=>x&&typeof x.id==='string').map(x=>[x.id,x]));
  const old=byId.get(c.id);
  if(old?.signature===s.signature&&Date.parse(old.checkedAt)>Date.parse(s.checkedAt))return;
  byId.set(c.id,{id:c.id,...s});
  const validIds=new Set(records().map(x=>x.id));
  const rows=[...byId.values()].filter(x=>validIds.has(x.id)).sort((a,b)=>Date.parse(b.checkedAt)-Date.parse(a.checkedAt)).slice(0,MAX_CAMPAIGNS);
  const kept=[];let size=2;
  for(const row of rows){const len=JSON.stringify(row).length+1;if(size+len>ARCHIVE_MAX)continue;kept.push(row);size+=len}
  localStorage.setItem(ARCHIVE_KEY,JSON.stringify(kept));archive=kept;
 }catch(_){}
}
function archivedSnapshot(c){
 const row=archive.find(s=>s?.id===c.id&&s.signature===signature(c));
 if(!row||!Number.isFinite(Date.parse(row.checkedAt))||typeof row.complete!=='boolean'||!Array.isArray(row.applicants))return null;
 const ids=new Set(c.entries.map(e=>e.id));
 if(!row.applicants.every(e=>e&&typeof e.id==='string'&&typeof e.userId==='string'&&typeof e.nickname==='string'&&ids.has(e.sourceId)&&(e.likes===null||Number.isSafeInteger(e.likes)&&e.likes>=0)))return null;
 return row;
}
const snapshot=c=>{
 const local=snapshots.get(c.id),server=(Array.isArray(window.__mwsApplicationSnapshotsV1)?window.__mwsApplicationSnapshotsV1:[]).find(s=>s.id===c.id&&s.signature===signature(c));
 const cached=countdown(c.deadline).expired?archivedSnapshot(c):null;
 return [local,server,cached].filter(s=>s?.signature===signature(c)&&Number.isFinite(Date.parse(s.checkedAt))).sort((a,b)=>Date.parse(b.checkedAt)-Date.parse(a.checkedAt))[0]||null;
};
const rankOf=c=>rankEntries(snapshot(c)?.applicants||[]);
const reduceMotion=()=>document.documentElement.dataset.mwsMotion==='reduced'||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const sameApplicants=(a,b)=>{
 if(!a||!b||a.length!==b.length)return false;
 const old=new Map(a.map(e=>[e.userId,e]));
 return b.every(e=>{const p=old.get(e.userId);return !!p&&['id','likes','comment','nickname','avatar','best'].every(k=>p[k]===e[k])});
};
const stat=(kind,value,prefix='',suffix='')=>`<strong data-ca-stat="${kind}" data-ca-value="${value==null?'':value}" data-ca-prefix="${esc(prefix)}" data-ca-suffix="${esc(suffix)}">${value==null?'–':esc(prefix)+number(value)+esc(suffix)}</strong>`;
function status(c){const phase=campaignStatus(c.deadline);return `<span class="ca-state${phase==='expired'?' expired':phase==='urgent'?' urgent':''}" data-ca-state="${esc(c.deadline)}" data-ca-phase="${phase}">${phase==='expired'?'종료':phase==='urgent'?'마감임박':'진행중'}</span>`}
const authorLine=(c,extra='')=>c.authors?.length?`<div class="ca-author-line ${extra}"><span>게시글 작성자</span><strong>${c.authors.map(esc).join(' · ')}</strong></div>`:'';
function time(c){return `<span class="ca-time" data-ca-time="${esc(c.deadline)}">${esc(countdown(c.deadline).expired?'조회 종료':countdown(c.deadline).label)}</span>`}
const postLink=(e,cls='ca-origin',label=e?.commentNo?'SOOP 댓글 바로가기':'모집 글 보기')=>commentPermalink(e)?`<a class="${cls}" href="${esc(commentPermalink(e))}" target="_blank" rel="noopener noreferrer">${label} ${external}</a>`:'';
function avatar(e,own=false){return `<span class="ca-avatar${own?' own':''}">${esc((e?.nickname||(own?'마왕':'?')).slice(0,2))}${e?.avatar?`<img src="${esc(e.avatar)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}</span>`}
function confirmed(s,r){return !!s&&s.complete&&r.allKnown}
function rankLabel(s,r){return r.ownRank===null?'–':(confirmed(s,r)?'':'확인 기준 ')+r.ownRank+'위'}
function renderDashboardSupport(){
 if(!dashboardSupport||!dashboardActive())return;
 const campaigns=records().filter(c=>!countdown(c.deadline).expired).sort((a,b)=>Date.parse(a.deadline)-Date.parse(b.deadline));
 dashboardSupport.hidden=!campaigns.length;
 if(!campaigns.length){dashboardSupport.replaceChildren();return}
 const row=c=>{
  const s=snapshot(c),r=rankOf(c),own=r.mawang;
  const gap=own?.likes!=null&&r.leader?Math.max(0,r.leader.likes-own.likes):null;
  const link=own?postLink(own,'ca-dash-vote',heart+' 응원하기'):postLink(c.entries[0],'ca-dash-source','모집 글 보기');
  return `<article class="ca-dash-row"><div class="ca-dash-person">${avatar(own,true)}<div class="ca-dash-name"><div class="ca-dash-title">${status(c)}<strong>${esc(c.title)}</strong></div><span>마왕0216 <span class="ca-dash-sep">·</span> ${s?number(r.total)+'명 신청':pending.has(c.id)?'댓글 확인 중':'조회 대기'}</span>${authorLine(c,'ca-dash-authors')}</div></div><div class="ca-dash-metrics"><div><small>좋아요</small><strong class="ca-dash-likes">${own?number(own.likes):'–'}</strong></div><div><small>현재 순위</small><strong>${rankLabel(s,r)}</strong></div><div><small>1위와 차이</small><strong>${gap==null?'–':number(gap)}</strong></div></div><div class="ca-dash-actions"><div class="ca-dash-time">${clock}${time(c)}</div><div class="ca-dash-buttons">${link}<button type="button" class="ca-dash-detail" data-ca-dashboard-open="${esc(c.id)}" aria-label="${esc(c.title)} 신청 상세">상세 보기</button></div></div></article>`;
 };
 dashboardSupport.innerHTML=`<div class="ca-dash-head"><div><span class="ca-dash-kicker">FAN SUPPORT</span><h3>마왕 신청 콘텐츠</h3></div><span class="ca-dash-count">${campaigns.length}개 진행 중</span></div><div class="ca-dash-list">${campaigns.map(row).join('')}</div>`;
}
function card(c){
 const s=snapshot(c),r=rankOf(c),own=r.mawang,expired=countdown(c.deadline).expired;
 return `<button type="button" class="ca-campaign${expired?' is-closed':''}" data-ca-open="${esc(c.id)}"><div class="ca-campaign-top">${status(c)}<span>${s?number(r.total)+'명 댓글 신청자':expired?'조회 기록 없음':pending.has(c.id)?'댓글 확인 중':'신청 현황 보기'}</span></div><div class="ca-campaign-title"><span class="ca-eyebrow">MAWANG SUPPORT</span><strong>${esc(c.title)}</strong><small>${esc(c.entries[0]?.title||'SOOP 모집 게시글')}</small>${authorLine(c)}</div><div class="ca-card-person">${avatar(own,true)}<div><span>${expired?'신청자':'응원할 신청자'}</span><b>마왕0216</b></div><div class="ca-card-metric"><small>좋아요</small><b>${own?number(own.likes):'–'}</b></div><div class="ca-card-metric"><small>순위</small><b>${rankLabel(s,r)}</b></div></div><div class="ca-campaign-bottom"><span class="ca-campaign-timing">${clock}${time(c)}</span><span class="ca-card-action">${expired?'조회 기록 보기':'응원 현황 보기'} →</span></div></button>`;
}
function renderList(){
 const rows=records().sort((a,b)=>Number(countdown(a.deadline).expired)-Number(countdown(b.deadline).expired)||Date.parse(a.deadline)-Date.parse(b.deadline)),open=rows.filter(c=>!countdown(c.deadline).expired),closed=rows.filter(c=>countdown(c.deadline).expired);
 list.innerHTML=rows.length?`<div class="ca-list-intro"><div><span class="ca-eyebrow">FAN SUPPORT CENTER</span><h2>마왕의 다음 무대를 응원해 주세요</h2><p>신청 댓글의 좋아요와 순위를 한눈에 확인할 수 있습니다.</p></div><div class="ca-list-count"><strong>${open.length}</strong><span>진행 중인 콘텐츠</span></div></div>${open.length?`<div class="ca-list-label">진행 중 <span>${open.length}</span></div><div class="ca-list-grid">${open.map(card).join('')}</div>`:''}${closed.length?`<div class="ca-list-label">마감된 콘텐츠 <span>${closed.length}</span></div><div class="ca-list-grid">${closed.map(card).join('')}</div>`:''}`:`<div class="ca-empty"><span class="ca-empty-icon">${heart}</span><h3>등록된 신청 콘텐츠가 없습니다</h3><p>모집 게시글이 등록되면 마왕의 신청 댓글을 응원할 수 있습니다.</p>${isAdmin()?'<button class="ca-primary" data-ca-create>새 콘텐츠 등록</button>':''}</div>`;
}

/* Every motion is driven by an actual change in verified SOOP data.
   When the ranking is unchanged there is no rerender or animation. */
function animateTrack(bar,oldWidth,duration=580){
 if(!bar||!oldWidth||oldWidth===bar.style.width)return;
 const before=parseFloat(oldWidth),after=parseFloat(bar.style.width);
 if(!Number.isFinite(before)||!Number.isFinite(after))return;
 const options={duration,easing:'cubic-bezier(.2,.75,.25,1)'};
 if(after>0)bar.animate([{transform:`scaleX(${before/after})`},{transform:'scaleX(1)'}],options);
 else if(before>0)bar.animate([{width:oldWidth},{width:'0%'}],options);
}
function animateLeaderboardChanges(movement,beforeRects,beforeBars,beforeProgress,beforeStats){
 if(!movement?.changed||reduceMotion()||document.hidden)return;
 let animatedRows=0;
 detail.querySelectorAll('.ca-person[data-ca-user]').forEach(el=>{
  const before=beforeRects?.get(el.dataset.caUser),after=el.getBoundingClientRect();
  const delta=movement.rows.get(el.dataset.caUser);
  if(before&&after.bottom>0&&after.top<innerHeight&&animatedRows<16){
   const shift=before.top-after.top;
   if(Math.abs(shift)>2&&Math.abs(shift)<innerHeight*1.75){
    el.animate([{transform:`translate3d(0,${shift}px,0)`,opacity:.88,filter:'brightness(1.13)'},{transform:'translate3d(0,0,0)',opacity:1,filter:'brightness(1)'}],{duration:580,easing:'cubic-bezier(.2,.8,.25,1)'});
    animatedRows++;
   }
  }
  if((delta?.rankDelta||delta?.likesDelta)&&after.bottom>0&&after.top<innerHeight){
   const name=el.querySelector('.ca-person-name strong');
   name?.animate([{color:'var(--ca-pink)'},{color:'var(--text)'}],{duration:700,easing:'ease-out'});
   el.animate([{boxShadow:'0 0 0 1px var(--ca-pink), 0 0 24px #e9669d32'},{boxShadow:'none'}],{duration:850,easing:'ease-out'});
  }
  if(after.bottom>0&&after.top<innerHeight)animateTrack(el.querySelector('.ca-mini-progress span'),beforeBars?.get(el.dataset.caUser));
 });
 const progress=detail.querySelector('.ca-comparison .ca-progress span');
 animateTrack(progress,beforeProgress,650);
 detail.querySelectorAll('[data-ca-stat]').forEach(el=>{
  const oldValue=beforeStats?.get(el.dataset.caStat),targetValue=el.dataset.caValue;
  if(oldValue==null||oldValue===''||targetValue===''||oldValue===targetValue)return;
  const from=Number(oldValue),to=Number(targetValue);
  if(!Number.isFinite(from)||!Number.isFinite(to))return;
  const prefix=el.dataset.caPrefix||'',suffix=el.dataset.caSuffix||'',began=performance.now();
  el.animate([{filter:'brightness(1.7)',transform:'translateY(3px) scale(.98)'},{filter:'brightness(1)',transform:'translateY(0) scale(1)'}],{duration:650,easing:'cubic-bezier(.2,.72,.25,1)'});
  el.textContent=prefix+number(from)+suffix;
  const frame=now=>{
   if(!el.isConnected)return;
   const p=Math.min(1,(now-began)/650),ease=1-Math.pow(1-p,3);
   el.textContent=prefix+number(Math.round(from+(to-from)*ease))+suffix;
   if(p<1)requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
 });
}
const trend=(kind,change)=>{
 if(!Number.isFinite(change)||!change)return '';
 const better=change>0;
 const label=kind==='rank'?(better?'상승':'하락'):(better?'증가':'감소');
 const amount=kind==='rank'?Math.abs(change)+'계단':(better?'+':'')+number(change);
 return `<small class="ca-stat-trend ${better?'up':'down'}" aria-label="${kind==='rank'?'순위':'좋아요'} ${label} ${Math.abs(change)}">${kind==='rank'?(better?'↑ ':'↓ '):''}${amount}</small>`;
};
function renderDetail(){
 const c=current();if(!c){selected='';render();return}
 const closed=countdown(c.deadline).expired;
 detail.classList.toggle('is-closed',closed);
 const movement=closed?null:rankMotions.get(c.id)||null;rankMotions.delete(c.id);
 const beforeRects=movement&&!reduceMotion()?new Map([...detail.querySelectorAll('.ca-person[data-ca-user]')].map(el=>[el.dataset.caUser,el.getBoundingClientRect()])):null;
 const beforeBars=movement&&!reduceMotion()?new Map([...detail.querySelectorAll('.ca-person[data-ca-user]')].map(el=>[el.dataset.caUser,el.querySelector('.ca-mini-progress span')?.style.width||'0%'])):null;
 const beforeProgress=movement?detail.querySelector('.ca-comparison .ca-progress span')?.style.width:null;
 const beforeStats=movement?new Map([...detail.querySelectorAll('[data-ca-stat]')].map(el=>[el.dataset.caStat,el.dataset.caValue])):null;
 const s=snapshot(c),r=rankOf(c),own=r.mawang,expired=countdown(c.deadline).expired,loading=!expired&&pending.has(c.id),complete=confirmed(s,r);
 const gap=own?.likes!=null&&r.leader?Math.max(0,r.leader.likes-own.likes):null,pct=gap!==null?(r.leader.likes?Math.round(100*own.likes/r.leader.likes):100):0;
 const source=own||c.entries[0],next=r.ahead&&own?.likes!=null?r.ahead.likes-own.likes+1:null;
 const metrics=`<div class="ca-stats"><div class="ca-stat-card"><span>${heart} 받은 좋아요</span><div class="ca-stat-value">${stat('likes',own?.likes)}${trend('likes',movement?.own?.likesDelta)}</div><small>마왕의 신청 댓글</small></div><div class="ca-stat-card"><span>${expired?'마지막 확인 순위':'현재 순위'}</span><div class="ca-stat-value">${stat('rank',r.ownRank,'','위')}${trend('rank',movement?.own?.rankDelta)}</div><small>${s?number(r.total)+'명 중'+(complete?'':' · 일부 확인'):'댓글 조회 필요'}</small></div><div class="ca-stat-card"><span>1위와 차이</span><div class="ca-stat-value">${stat('gap',gap)}</div><small>${gap===0?'현재 공동 선두 이상':'좋아요 수 차이'}</small></div></div>`;
 const description=own?.comment?`<details class="ca-application"><summary>마왕의 신청 댓글 보기</summary><p>${esc(own.comment)}</p></details>`:'';
 const hero=`<article class="ca-hero"><div class="ca-hero-head"><div class="ca-hero-person">${avatar(own,true)}<div><span class="ca-feature-label">FEATURED APPLICANT</span><h3>마왕0216</h3><div class="ca-post-title">${own?(own.best?'BEST 댓글 · ':'')+'참가 신청 댓글':loading?'신청 댓글을 확인하고 있습니다':s?.complete?'등록된 모집 글에서 신청 댓글을 찾지 못했습니다':'신청 댓글 정보 확인 전'}</div></div></div><span class="ca-hero-mark">${expired?clock+' 조회 종료':heart+' 마왕 응원'}</span></div><div class="ca-hero-body"><div class="ca-hero-data">${metrics}<div class="ca-comparison"><div><strong>${gap===null?'좋아요 비교 정보 확인 중':gap===0?'현재 확인된 댓글 중 선두입니다':`1위까지 좋아요 ${number(gap)}개 차이`}</strong><span>${gap!==null?pct+'%':''}</span></div><div class="ca-progress" role="progressbar" aria-label="선두 좋아요 대비" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div><small>${next!=null?'바로 앞 순위 추월까지 '+number(next)+'개 · ':''}${complete?'모든 댓글 조회 완료':'확인된 댓글의 수치만 비교'}</small></div></div><div class="ca-support"><span class="ca-eyebrow">SUPPORT MAWANG</span><h4>${expired?'신청이 마감되었습니다':'여러분의 좋아요가 힘이 됩니다'}</h4><p>${own?(expired?'마왕의 신청 댓글 원문을 확인할 수 있습니다.':'마왕의 신청 댓글로 바로 이동해 좋아요를 눌러 주세요.'):'모집 글에서 신청 댓글을 확인할 수 있습니다.'}</p>${postLink(source,expired||!own?'ca-secondary':'ca-vote',own?(expired?'마왕 신청 댓글 보기':heart+' 마왕 좋아요 하러 가기'):'모집 원문 보기')}</div></div>${description}</article>`;
 const everyone=[...r.ordered,...(s?.applicants||[]).filter(e=>!r.ranks.has(e.id)).sort((a,b)=>a.userId.localeCompare(b.userId))];
 const row=e=>{
  const rank=r.ranks.get(e.id),p=r.leader?.likes>0&&e.likes!=null?Math.round(100*e.likes/r.leader.likes):0;
  const ownRow=e.userId===MAWANG_ID,delta=movement?.rows.get(e.userId),moved=delta?.rankDelta??0,gain=delta?.likesDelta??0;
  const movementTag=moved?`<span class="ca-rank-change ${moved>0?'up':'down'}" aria-label="${Math.abs(moved)}계단 ${moved>0?'상승':'하락'}">${moved>0?'↑':'↓'} ${Math.abs(moved)}</span>`:'';
  const likeTag=gain?`<small class="ca-like-change ${gain>0?'up':'down'}" aria-label="좋아요 ${Math.abs(gain)}개 ${gain>0?'증가':'감소'}">${gain>0?'+':''}${number(gain)}</small>`:'';
  return `<article class="ca-person${ownRow?' is-mawang':''}" data-ca-user="${esc(e.userId)}" ${ownRow?'data-ca-own="" tabindex="-1" aria-label="마왕0216의 현재 순위"':''}><span class="ca-rank${rank===1?' first':''}">${rank?rank+'위':'–'}${movementTag}</span>${avatar(e,ownRow)}<div class="ca-person-name"><strong>${esc(e.nickname||e.userId)} ${ownRow?'<span class="ca-own-label">MAWANG</span>':''} ${e.best?'<span class="ca-best">BEST</span>':''}</strong><span class="ca-excerpt">${esc(e.comment||'신청 댓글')}</span><div class="ca-mini-progress"><span style="width:${p}%"></span></div></div><div class="ca-person-likes">${heart}<strong>${number(e.likes)}</strong>${likeTag}</div><details class="ca-row-details"><summary>댓글 보기</summary><p>${esc(e.comment)}</p>${postLink(e)}</details></article>`;
 };
 detail.innerHTML=`<div class="ca-detail-top"><button type="button" class="ca-back" data-ca-back aria-label="신청 콘텐츠 목록으로 돌아가기">← 목록으로</button><div class="ca-detail-title"><span class="ca-eyebrow">APPLICATION TRACKER</span><h2>${esc(c.title)}</h2><div>${status(c)}</div>${authorLine(c,'ca-detail-authors')}</div><div class="ca-countdown-panel${campaignStatus(c.deadline)==='urgent'?' urgent':''}"><div class="ca-countdown-label">${clock}<span>${expired?'신청 종료':'신청 마감까지 남은 시간'}</span></div>${time(c)}<time class="ca-deadline" datetime="${esc(c.deadline)}">마감 ${esc(kst(c.deadline))}</time></div><div class="ca-detail-actions">${expired?'':`<button class="ca-secondary" data-ca-refresh ${loading?'disabled':''}>${loading?'갱신 중…':'새로고침'}</button>`}${isAdmin()?'<button class="ca-secondary" data-ca-edit>수정</button>':''}</div></div>${hero}<div class="ca-ranking-head"><div><h3>전체 신청 댓글 순위 <span class="ca-count">${s?number(r.total):'–'}</span></h3><p>댓글 좋아요 내림차순 · 같은 계정은 가장 많은 좋아요를 받은 댓글 기준 · 모집 글 작성자 제외</p></div><div class="ca-ranking-tools">${own?`<button type="button" class="ca-my-rank-jump" data-ca-my-rank>마왕 순위로 이동${r.ownRank?` · ${r.ownRank}위`:``}</button>`:``}<span class="ca-update">${s?(expired?'마지막 조회 ':'최근 조회 ')+esc(kst(s.checkedAt)):expired?'조회 기록 없음':'조회 대기'}${expired&&s?' · 마감 당시 수치 아님':''}</span></div></div>${s&&!s.complete?`<div class="ca-warning" role="status">일부 댓글 페이지 조회에 실패했습니다. 순위는 확인된 댓글 기준입니다.${expired?' 종료된 게시글은 추가 조회하지 않습니다.':' 새로고침을 시도해 주세요.'}</div>`:''}<div class="ca-ranking">${everyone.length?everyone.map(row).join(''):`<div class="ca-empty-row">${loading?'신청 댓글을 불러오는 중입니다.':s?.complete?'다른 신청 댓글이 없습니다.':expired?'저장된 조회 기록이 없습니다. 종료된 게시글은 추가 조회하지 않습니다.':'아직 댓글 정보를 확인하지 못했습니다.'}</div>`}</div>`;
 if(movement?.changed)animateLeaderboardChanges(movement,beforeRects,beforeBars,beforeProgress,beforeStats);
}
function render(){
 if(!sectionActive()&&!dashboardActive())return;
 const mode=document.body.dataset.mwsMode||'';
 if(mode!==sessionMode){selected='';editing='';editor.hidden=true;snapshots.clear();pending.clear();attempts.clear();rankMotions.clear();sourceReads.clear();epoch++;sessionMode=mode}
 if(sectionActive()){
  $('caNewBtn').hidden=!isAdmin();if(selected&&!current())selected='';list.hidden=!!selected;detail.hidden=!selected;
  if(selected)renderDetail();else renderList();
 }
 renderDashboardSupport();updateClocks();
}
function updateClocks(){
 if(!active())return;
 const root=sectionActive()?(selected?detail:list):dashboardSupport;
 root?.querySelectorAll('[data-ca-time]').forEach(el=>{const t=countdown(el.dataset.caTime),label=t.expired?'조회 종료':t.label;if(el.textContent!==label)el.textContent=label});
 let changed=false;const ended=new Set();
 root?.querySelectorAll('[data-ca-state]').forEach(el=>{const phase=campaignStatus(el.dataset.caState);if(el.dataset.caPhase!==phase){changed=true;if(phase==='expired')ended.add(el.closest('[data-ca-open]')?.dataset.caOpen||(root===detail?selected:''))}});
 if(changed){
  render();
  if(!reduceMotion()&&sectionActive())for(const id of ended){
   const node=selected===id?detail:[...list.querySelectorAll('[data-ca-open]')].find(el=>el.dataset.caOpen===id);
   if(node?.classList.contains('is-closed')){node.classList.add('ca-just-ended');setTimeout(()=>node.classList.remove('ca-just-ended'),550)}
  }
 }
}
function stopTimer(){clearInterval(timer);timer=0}
function refreshInterval(){return 60000}
function tick(){if(!active()){stopTimer();return}updateClocks();loadVisible();if(!records().some(c=>!countdown(c.deadline).expired))stopTimer()}
function loadVisible(){
 const c=sectionActive()?current():null;if(c){if(!countdown(c.deadline).expired&&(!attempts.has(c.id)||Date.now()-(attempts.get(c.id)||0)>=refreshInterval(c)))refresh(c);return}
 const candidates=records().filter(c=>!countdown(c.deadline).expired&&Date.now()-(attempts.get(c.id)||0)>=refreshInterval(c)).sort((a,b)=>(attempts.get(a.id)||0)-(attempts.get(b.id)||0));if(candidates.length&&!pending.size)refresh(candidates[0]);
}
function activate(){if(!active()){stopTimer();return}render();if(records().some(c=>!countdown(c.deadline).expired)){if(!timer)timer=setInterval(tick,1000)}else stopTimer();loadVisible()}
async function fetchPage(source,page){
 const target=`https://chapi.sooplive.co.kr/api/${encodeURIComponent(source.station)}/title/${encodeURIComponent(source.postNo)}/comment?page=${page}&orderby=reg_date`;
 const res=await fetch('/api/soop/proxy?url='+encodeURIComponent(target),{headers:{accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(16000)});
 if(!res.ok)throw Error('SOOP HTTP '+res.status);
 const parsed=parseCommentPage(await res.json(),source);if(parsed.page!==page)throw Error('댓글 페이지 번호 불일치');return parsed;
}
async function fetchPageGroup(source,pages,canContinue=()=>true){
 if(!canContinue())throw Error('조회 중단');
 if(pages.length===1)return Promise.allSettled(pages.map(page=>fetchPage(source,page)));
 const query='station='+encodeURIComponent(source.station)+'&post='+encodeURIComponent(source.postNo)+'&pages='+pages.join(',');
 const res=await fetch('/api/soop/comment-batch?'+query,{headers:{accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(60000)});
 if(res.status===404||res.status===405){
  const results=[];for(let i=0;i<pages.length;i+=3){if(!canContinue())throw Error('조회 중단');results.push(...await Promise.allSettled(pages.slice(i,i+3).map(page=>fetchPage(source,page))))}return results;
 }
 if(!res.ok)throw Error('SOOP batch HTTP '+res.status);
 const payload=await res.json();
 if(!Array.isArray(payload?.results))throw Error('댓글 일괄 응답 확인 실패');
 return pages.map(page=>{
  try{const rows=payload.results.filter(row=>row.page===page);if(rows.length!==1||rows[0].status<200||rows[0].status>=300||!Number.isInteger(rows[0].status))throw Error('댓글 페이지 조회 실패');
   const value=parseCommentPage(rows[0].data,source);if(value.page!==page)throw Error('댓글 페이지 번호 불일치');return {status:'fulfilled',value};
  }catch(reason){return {status:'rejected',reason}}
 });
}
async function fetchSource(source,canContinue=()=>true){
 if(!canContinue())throw Error('조회 중단');
 const first=await fetchPage(source,1),rows=[...first.applicants];let complete=first.pages<=100;const limit=Math.min(100,first.pages);
 for(let start=2;start<=limit;start+=9){
  if(!canContinue())throw Error('조회 중단');
  const pages=Array.from({length:Math.min(9,limit-start+1)},(_,i)=>start+i);
  let results;try{results=await fetchPageGroup(source,pages,canContinue)}catch(error){results=pages.map(()=>({status:'rejected',reason:error}))}
  for(const result of results){if(result.status==='fulfilled'){rows.push(...result.value.applicants);if(result.value.pages!==first.pages||result.value.total!==first.total)complete=false}else complete=false}
 }return {rows,complete};
}
// Share only complete, recently collected public SOOP results within this access session.
async function readSource(source,canContinue,manual=false){
 if(!canContinue())throw Error('조회 중단');
 const key=JSON.stringify([source.station,source.postNo,source.userId||'',source.title||'']);
 const now=Date.now(),cached=sourceReads.get(key);
 if(!manual&&cached&&now-cached.startedAt<60000)return cached.result;
 for(const [k,row] of sourceReads)if(now-row.startedAt>=60000)sourceReads.delete(k);
 const shared=typeof window!=='undefined'?window.mwsPublicReadSharingV1:null;
 const scope=typeof document!=='undefined'?document.body?.dataset?.mwsMode:'';
 const load=async()=>{if(!canContinue())throw Error('조회 중단');return {...await fetchSource(source,canContinue),sampledAt:Date.now()}};
 let result;
 if(shared&&['admin','public'].includes(scope)){
  const row=await shared.read('comments:'+scope+':'+key,{ttl:60000,force:manual,load,valid:value=>value?.complete===true&&Array.isArray(value.rows)});
  result={...row.value,sampledAt:row.at};
 }else result={...await fetchSource(source,canContinue),sampledAt:now};
 if(canContinue()&&result.complete){if(sourceReads.size>=100)sourceReads.delete(sourceReads.keys().next().value);sourceReads.set(key,{startedAt:result.sampledAt,result})}
 return result;
}
async function readCampaign(c,canContinue,manual){
 // Server owns continuation and final persistence. Legacy endpoint fallback
 // only for unsupported sizes or older server versions, never expired posts.
 for(let i=0;i<600&&canContinue();i++){
  const res=await fetch('/api/soop/application-sync?id='+encodeURIComponent(c.id)+(manual&&i===0?'&force=1':'')+(i?'&continue=1':''),{cache:'no-store',signal:AbortSignal.timeout(60000)});
  if(res.status===404||res.status===405)return null;
  if(!res.ok)throw Error('Application sync HTTP '+res.status);
  const value=await res.json();
  if(value.oversize)return null;
  if(value.busy||value.done){
   if(!value.snapshot)return {noSnapshot:true};
   if(value.snapshot.signature!==signature(c)||!Array.isArray(value.snapshot.applicants)||typeof value.snapshot.complete!=='boolean'||!Number.isFinite(Date.parse(value.snapshot.checkedAt)))throw Error('Invalid campaign snapshot');
   return value.snapshot;
  }
 }
 throw Error('Application sync interrupted');
}
async function refresh(c,manual=false){
 if(!c||countdown(c.deadline).expired||pending.has(c.id)||!active())return;
 const token=Symbol(),generation=epoch,sig=signature(c);
 const canContinue=()=>{
  if(generation!==epoch||pending.get(c.id)!==token||!active()||(sectionActive()&&selected&&selected!==c.id))return false;
  const latest=records().find(x=>x.id===c.id);
  return !!latest&&signature(latest)===sig&&!countdown(latest.deadline).expired;
 };
 pending.set(c.id,token);attempts.set(c.id,Date.now());
 if(!snapshot(c))render();
 else if(sectionActive()&&selected===c.id){
  const button=detail.querySelector('[data-ca-refresh]');
  if(button){button.disabled=true;button.textContent='갱신 중…'}
 }
 let unchanged=false;
 try{
  const shared=await readCampaign(c,canContinue,manual).catch(error=>{console.warn('Application sync unavailable',error);return undefined});
  if(!canContinue()||shared===undefined||shared?.noSnapshot)return;
  const rows=[];let complete=c.entries.length>0,sampledAt=Date.now();
  if(shared){rows.push(...shared.applicants);complete=shared.complete;sampledAt=Date.parse(shared.checkedAt)}else{
  for(let i=0;i<c.entries.length;i+=2){
   if(!canContinue())return;
   const results=await Promise.allSettled(c.entries.slice(i,i+2).map(source=>readSource(source,canContinue,manual)));
   if(!canContinue())return;
   for(const result of results){if(result.status==='fulfilled'){rows.push(...result.value.rows);complete&&=result.value.complete;sampledAt=Math.min(sampledAt,result.value.sampledAt)}else complete=false}
  }
  }
  const latest=records().find(x=>x.id===c.id);
  if(!canContinue()||!latest||signature(latest)!==sig)return;
  const previous=snapshot(c);
  let next;
  if(!complete&&previous&&(previous.complete||!rows.length))next=previous;
  else next={signature:sig,applicants:uniqueApplicants(rows),complete,checkedAt:new Date(sampledAt).toISOString()};
  unchanged=!!previous&&previous.complete===next.complete&&sameApplicants(previous.applicants,next.applicants);
  if(previous&&!unchanged&&sectionActive()&&selected===c.id){
   const diff=compareRankSnapshots(previous.applicants,next.applicants);
   if(diff.changed)rankMotions.set(c.id,diff);
  }
  snapshots.set(c.id,next);archiveSnapshot(c,next);
  if(shared){const all=Array.isArray(window.__mwsApplicationSnapshotsV1)?window.__mwsApplicationSnapshotsV1:[];window.__mwsApplicationSnapshotsV1=[...all.filter(s=>s.id!==c.id),{id:c.id,...next}]}
  // Shared results retain their original sample time, including for the next refresh deadline.
  if(shared)attempts.set(c.id,Date.now());else if(complete)attempts.set(c.id,Math.min(attempts.get(c.id)||sampledAt,sampledAt));
  if(manual&&!complete&&typeof toast==='function')toast('신청 콘텐츠','일부 댓글을 확인하지 못했습니다.');
 }finally{
  if(pending.get(c.id)===token){
   const interrupted=!canContinue();
   pending.delete(c.id);
   if(interrupted&&!snapshot(c))attempts.delete(c.id);
   if(generation===epoch){
    if(unchanged){
     if(sectionActive()&&selected===c.id){
      const button=detail.querySelector('[data-ca-refresh]');
      if(button){button.disabled=false;button.textContent='새로고침'}
      const updated=detail.querySelector('.ca-update'),now=snapshot(c);
      if(updated&&now)updated.textContent='최근 조회 '+kst(now.checkedAt)+(countdown(c.deadline).expired?' · 마감 당시 수치 아님':'');
      updateClocks();
     }
    }else render();
    if(active()&&(!sectionActive()||!selected))loadVisible();
   }
  }
 }
}

function addAuthorInput(value=''){
 const holder=$('caAuthors'),count=holder.querySelectorAll('.ca-author-field').length;
 if(count>=MAX_AUTHORS)return null;
 const row=document.createElement('div');row.className='ca-author-field';
 const input=document.createElement('input');input.className='ca-author-input';input.type='text';input.maxLength=80;input.placeholder='게시글 작성자 이름 또는 닉네임';input.setAttribute('aria-label','게시글 작성자 '+(count+1));input.value=value;
 const remove=document.createElement('button');remove.type='button';remove.className='ca-author-remove';remove.setAttribute('data-ca-author-remove','');remove.setAttribute('aria-label','작성자 삭제');remove.textContent='삭제';
 row.append(input,remove);holder.append(row);$('caAuthorAdd').disabled=holder.children.length>=MAX_AUTHORS;
 return input;
}
function renderAuthorInputs(authors=[]){$('caAuthors').replaceChildren();for(const name of authors.length?authors:[''])addAuthorInput(name)}
function openEditor(c){if(!isAdmin()||busy)return;editing=c?.id||'';editor.hidden=false;form.reset();$('caEditorTitle').textContent=c?'신청 콘텐츠 수정':'새 신청 콘텐츠';$('caTitle').value=c?.title||'';$('caDeadline').value=c?toKstInput(c.deadline):toKstInput(new Date(Date.now()+86400000).toISOString());renderAuthorInputs(c?.authors||[]);$('caUrls').value=c?.entries.map(e=>e.url).join('\n')||'';$('caDelete').hidden=!c;$('caFormMessage').textContent='';$('caTitle').focus();}
function closeEditor(){if(busy)return;editor.hidden=true;editing='';$('caFormMessage').textContent=''}
async function commit(rows,reason){data.contentApplications=normalizeCampaigns(rows);saveData(reason);if(window.mwsV55SaveNow){const ok=await window.mwsV55SaveNow();if(!ok&&typeof toast==='function')toast('신청 콘텐츠','온라인 저장을 확인하지 못했습니다. 변경사항은 저장 대기 상태입니다.');return ok}return false}
form.addEventListener('submit',async ev=>{
 ev.preventDefault();if(!isAdmin()||busy)return;
 const title=$('caTitle').value.trim(),deadline=fromKstInput($('caDeadline').value),raw=$('caUrls').value.trim().split(/\s+/).filter(Boolean),authors=[...$('caAuthors').querySelectorAll('.ca-author-input')].map(input=>input.value.trim()).filter(Boolean),msg=$('caFormMessage');
 if(!title||!deadline||!raw.length){msg.textContent='콘텐츠 이름, 마감 시간, 모집 게시글 URL을 입력해 주세요.';return}
 const urls=raw.map(parsePostUrl);if(urls.some(u=>!u)){msg.textContent='SOOP 방송국 게시글 URL만 등록할 수 있습니다.';return}
 const unique=[...new Map(urls.map(u=>[u.id,u])).values()];if(unique.length>MAX_ENTRIES){msg.textContent=`최대 ${MAX_ENTRIES}개 모집 글을 등록할 수 있습니다.`;return}
 const old=records().find(c=>c.id===editing);if(!old&&records().length>=MAX_CAMPAIGNS){msg.textContent=`최대 ${MAX_CAMPAIGNS}개 콘텐츠를 등록할 수 있습니다.`;return}
 busy=true;$('caSave').disabled=true;$('caCancel').disabled=true;$('caDelete').disabled=true;msg.textContent='모집 게시글 저장 중…';
 try{const id=old?.id||crypto.randomUUID(),prior=new Map((old?.entries||[]).map(e=>[e.id,e])),campaign={id,title,deadline,authors,entries:unique.map(u=>prior.get(u.id)||normalizeEntry(u))},rows=records(),index=rows.findIndex(c=>c.id===id);
 if(index<0)rows.push(campaign);else rows[index]=campaign;
 if(!old||signature(old)!==signature(campaign)){snapshots.delete(id);pending.delete(id);attempts.delete(id)}
 selected=id;await commit(rows,'신청 콘텐츠 등록 및 수정');editor.hidden=true;editing='';render();refresh(campaign);
 }catch(e){msg.textContent=e.message||'등록 실패'}finally{busy=false;$('caSave').disabled=false;$('caCancel').disabled=false;$('caDelete').disabled=false}
});
section.addEventListener('click',async ev=>{
 const b=ev.target.closest('button');if(!b)return;
 if(b===$('caAuthorAdd')&&isAdmin()&&!busy){addAuthorInput()?.focus()}
  else if(b.hasAttribute('data-ca-author-remove')&&isAdmin()&&!busy){b.closest('.ca-author-field')?.remove();if(!$('caAuthors').children.length)addAuthorInput();$('caAuthorAdd').disabled=false}
  else if(b===$('caNewBtn')||b.hasAttribute('data-ca-create'))openEditor(null);
 else if(b.dataset.caOpen){selected=b.dataset.caOpen;render();loadVisible()}
 else if(b.hasAttribute('data-ca-back')){selected='';render();loadVisible()}
 else if(b.hasAttribute('data-ca-my-rank')){
  const row=detail.querySelector('.ca-person[data-ca-own]');
  if(row){row.scrollIntoView({behavior:reduceMotion()?'instant':'smooth',block:'center'});row.focus({preventScroll:true});if(!reduceMotion())row.animate([{outlineColor:'var(--ca-pink)',outlineOffset:'0px'},{outlineColor:'transparent',outlineOffset:'8px'}],{duration:1050,easing:'ease-out'})}
 }
 else if(b.hasAttribute('data-ca-refresh'))refresh(current(),true);
 else if(b.hasAttribute('data-ca-edit'))openEditor(current());
 else if(b===$('caCancel'))closeEditor();
 else if(b===$('caDelete')&&isAdmin()&&!busy&&editing&&confirm('이 신청 콘텐츠를 삭제하시겠습니까? 원본 SOOP 게시글은 삭제되지 않습니다.')){const id=editing;closeEditor();selected='';snapshots.delete(id);pending.delete(id);attempts.delete(id);await commit(records().filter(c=>c.id!==id),'신청 콘텐츠 삭제');render()}
});
$('newEventBtn')?.addEventListener('click',ev=>{if(section.classList.contains('active')){ev.preventDefault();ev.stopImmediatePropagation();openEditor(null)}},true);
section.addEventListener('error',ev=>{if(ev.target instanceof HTMLImageElement)ev.target.hidden=true},true);
dashboardSupport?.addEventListener('click',ev=>{
 const button=ev.target.closest('[data-ca-dashboard-open]');if(!button)return;
 const id=button.dataset.caDashboardOpen;if(!records().some(c=>c.id===id))return;
 selected=id;if(typeof setTab==='function')setTab('contentApplications');
});
dashboardSupport?.addEventListener('error',ev=>{if(ev.target instanceof HTMLImageElement)ev.target.hidden=true},true);
const viewObserver=new MutationObserver(activate);
for(const node of [section,dashboard,overview])if(node)viewObserver.observe(node,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',activate);
window.addEventListener('mws:app-ready',activate);
window.addEventListener('mawang:datachange',()=>{if(active())activate()});
activate();
}
