import {MAWANG_ID,MAX_CAMPAIGNS,MAX_ENTRIES,parsePostUrl,commentPermalink,normalizeEntry,normalizeCampaigns,parseCommentPage,uniqueApplicants,countdown,fromKstInput,toKstInput,rankEntries} from './content-applications-model-v1.js?v=3';
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
const snapshots=new Map(),pending=new Map(),attempts=new Map();
const isAdmin=()=>document.body.dataset.mwsMode==='admin'&&window.__mwsAppReadyV130===true;
const sectionActive=()=>section.classList.contains('active');
const dashboardActive=()=>!!dashboardSupport&&dashboard?.classList.contains('active')&&overview?.classList.contains('active');
const active=()=>!document.hidden&&(sectionActive()||dashboardActive());
const records=()=>normalizeCampaigns(typeof data==='object'?data.contentApplications:[]);
const current=()=>records().find(c=>c.id===selected);
const kst=v=>toKstInput(v).replace('T',' ')+' KST';
const signature=c=>c.entries.map(e=>e.id).join('|');
const snapshot=c=>{const s=snapshots.get(c.id);return s?.signature===signature(c)?s:null};
const rankOf=c=>rankEntries(snapshot(c)?.applicants||[]);
function status(c){const t=countdown(c.deadline);return `<span class="ca-state${t.expired?' expired':''}" data-ca-state="${esc(c.deadline)}">${t.expired?'만료':'진행중'}</span>`}
function time(c){return `<span class="ca-time" data-ca-time="${esc(c.deadline)}">${esc(countdown(c.deadline).label)}</span>`}
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
  return `<article class="ca-dash-row"><div class="ca-dash-person">${avatar(own,true)}<div class="ca-dash-name"><div class="ca-dash-title">${status(c)}<strong>${esc(c.title)}</strong></div><span>마왕0216 <span class="ca-dash-sep">·</span> ${s?number(r.total)+'명 신청':pending.has(c.id)?'댓글 확인 중':'조회 대기'}</span></div></div><div class="ca-dash-metrics"><div><small>좋아요</small><strong class="ca-dash-likes">${own?number(own.likes):'–'}</strong></div><div><small>현재 순위</small><strong>${rankLabel(s,r)}</strong></div><div><small>1위와 차이</small><strong>${gap==null?'–':number(gap)}</strong></div></div><div class="ca-dash-actions"><div class="ca-dash-time">${clock}${time(c)}</div><div class="ca-dash-buttons">${link}<button type="button" class="ca-dash-detail" data-ca-dashboard-open="${esc(c.id)}" aria-label="${esc(c.title)} 신청 상세">상세 보기</button></div></div></article>`;
 };
 dashboardSupport.innerHTML=`<div class="ca-dash-head"><div><span class="ca-dash-kicker">FAN SUPPORT</span><h3>마왕 신청 콘텐츠</h3></div><span class="ca-dash-count">${campaigns.length}개 진행 중</span></div><div class="ca-dash-list">${campaigns.map(row).join('')}</div>`;
}
function card(c){
 const s=snapshot(c),r=rankOf(c),own=r.mawang;
 return `<button type="button" class="ca-campaign" data-ca-open="${esc(c.id)}"><div class="ca-campaign-top">${status(c)}<span>${s?number(r.total)+'명 댓글 신청자':pending.has(c.id)?'댓글 확인 중':'신청 현황 보기'}</span></div><div class="ca-campaign-title"><span class="ca-eyebrow">MAWANG SUPPORT</span><strong>${esc(c.title)}</strong><small>${esc(c.entries[0]?.title||'SOOP 모집 게시글')}</small></div><div class="ca-card-person">${avatar(own,true)}<div><span>응원할 신청자</span><b>마왕0216</b></div><div class="ca-card-metric"><small>좋아요</small><b>${own?number(own.likes):'–'}</b></div><div class="ca-card-metric"><small>순위</small><b>${rankLabel(s,r)}</b></div></div><div class="ca-campaign-bottom"><span class="ca-campaign-timing">${clock}${time(c)}</span><span class="ca-card-action">응원 현황 보기 →</span></div></button>`;
}
function renderList(){
 const rows=records().sort((a,b)=>Number(countdown(a.deadline).expired)-Number(countdown(b.deadline).expired)||Date.parse(a.deadline)-Date.parse(b.deadline)),open=rows.filter(c=>!countdown(c.deadline).expired),closed=rows.filter(c=>countdown(c.deadline).expired);
 list.innerHTML=rows.length?`<div class="ca-list-intro"><div><span class="ca-eyebrow">FAN SUPPORT CENTER</span><h2>마왕의 다음 무대를 응원해 주세요</h2><p>신청 댓글의 좋아요와 순위를 한눈에 확인할 수 있습니다.</p></div><div class="ca-list-count"><strong>${open.length}</strong><span>진행 중인 콘텐츠</span></div></div>${open.length?`<div class="ca-list-label">진행 중 <span>${open.length}</span></div><div class="ca-list-grid">${open.map(card).join('')}</div>`:''}${closed.length?`<div class="ca-list-label">마감된 콘텐츠 <span>${closed.length}</span></div><div class="ca-list-grid">${closed.map(card).join('')}</div>`:''}`:`<div class="ca-empty"><span class="ca-empty-icon">${heart}</span><h3>등록된 신청 콘텐츠가 없습니다</h3><p>모집 게시글이 등록되면 마왕의 신청 댓글을 응원할 수 있습니다.</p>${isAdmin()?'<button class="ca-primary" data-ca-create>새 콘텐츠 등록</button>':''}</div>`;
}
function renderDetail(){
 const c=current();if(!c){selected='';render();return}
 const s=snapshot(c),r=rankOf(c),own=r.mawang,expired=countdown(c.deadline).expired,loading=pending.has(c.id),complete=confirmed(s,r);
 const gap=own?.likes!=null&&r.leader?Math.max(0,r.leader.likes-own.likes):null,pct=gap!==null?(r.leader.likes?Math.round(100*own.likes/r.leader.likes):100):0;
 const source=own||c.entries[0],next=r.ahead&&own?.likes!=null?r.ahead.likes-own.likes+1:null;
 const metrics=`<div class="ca-stats"><div><span>${heart} 받은 좋아요</span><strong>${own?number(own.likes):'–'}</strong><small>마왕의 신청 댓글</small></div><div><span>현재 순위</span><strong>${rankLabel(s,r)}</strong><small>${s?number(r.total)+'명 중'+(complete?'':' · 일부 확인'):'댓글 조회 필요'}</small></div><div><span>1위와 차이</span><strong>${gap==null?'–':number(gap)}</strong><small>${gap===0?'현재 공동 선두 이상':'좋아요 수 차이'}</small></div></div>`;
 const description=own?.comment?`<details class="ca-application"><summary>마왕의 신청 댓글 보기</summary><p>${esc(own.comment)}</p></details>`:'';
 const hero=`<article class="ca-hero"><div class="ca-hero-head"><div class="ca-hero-person">${avatar(own,true)}<div><span class="ca-feature-label">FEATURED APPLICANT</span><h3>마왕0216</h3><div class="ca-post-title">${own?(own.best?'BEST 댓글 · ':'')+'참가 신청 댓글':loading?'신청 댓글을 확인하고 있습니다':s?.complete?'등록된 모집 글에서 신청 댓글을 찾지 못했습니다':'신청 댓글 정보 확인 전'}</div></div></div><span class="ca-hero-mark">${heart} 마왕 응원</span></div><div class="ca-hero-body"><div class="ca-hero-data">${metrics}<div class="ca-comparison"><div><strong>${gap===null?'좋아요 비교 정보 확인 중':gap===0?'현재 확인된 댓글 중 선두입니다':`1위까지 좋아요 ${number(gap)}개 차이`}</strong><span>${gap!==null?pct+'%':''}</span></div><div class="ca-progress" role="progressbar" aria-label="선두 좋아요 대비" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div><small>${next!=null?'바로 앞 순위 추월까지 '+number(next)+'개 · ':''}${complete?'모든 댓글 조회 완료':'확인된 댓글의 수치만 비교'}</small></div></div><div class="ca-support"><span class="ca-eyebrow">SUPPORT MAWANG</span><h4>${expired?'신청이 마감되었습니다':'여러분의 좋아요가 힘이 됩니다'}</h4><p>${own?(expired?'마왕의 신청 댓글 원문을 확인할 수 있습니다.':'마왕의 신청 댓글로 바로 이동해 좋아요를 눌러 주세요.'):'모집 글에서 신청 댓글을 확인할 수 있습니다.'}</p>${postLink(source,expired||!own?'ca-secondary':'ca-vote',own?(expired?'마왕 신청 댓글 보기':heart+' 마왕 좋아요 하러 가기'):'모집 원문 보기')}</div></div>${description}</article>`;
 const others=r.ordered.filter(e=>e.userId!==MAWANG_ID).concat((s?.applicants||[]).filter(e=>e.userId!==MAWANG_ID&&!r.ranks.has(e.id)));
 const row=e=>{const rank=r.ranks.get(e.id),p=r.leader?.likes>0&&e.likes!=null?Math.round(100*e.likes/r.leader.likes):0;return `<article class="ca-person"><span class="ca-rank${rank===1?' first':''}">${rank?rank+'위':'–'}</span>${avatar(e)}<div class="ca-person-name"><strong>${esc(e.nickname)} ${e.best?'<span class="ca-best">BEST</span>':''}</strong><span class="ca-excerpt">${esc(e.comment||'신청 댓글')}</span><div class="ca-mini-progress"><span style="width:${p}%"></span></div></div><div class="ca-person-likes">${heart}<strong>${number(e.likes)}</strong></div><details class="ca-row-details"><summary>댓글 보기</summary><p>${esc(e.comment)}</p>${postLink(e)}</details></article>`};
 detail.innerHTML=`<div class="ca-detail-top"><button class="ca-back" data-ca-back>‹ 목록</button><div class="ca-detail-title"><span class="ca-eyebrow">APPLICATION TRACKER</span><h2>${esc(c.title)}</h2><div>${status(c)} ${clock}${time(c)} <span class="ca-deadline">마감 ${esc(kst(c.deadline))}</span></div></div><div class="ca-detail-actions"><button class="ca-secondary" data-ca-refresh ${loading?'disabled':''}>${loading?'갱신 중…':'새로고침'}</button>${isAdmin()?'<button class="ca-secondary" data-ca-edit>수정</button>':''}</div></div>${hero}<div class="ca-ranking-head"><div><h3>전체 신청 댓글 순위 <span class="ca-count">${s?number(r.total):'–'}</span></h3><p>댓글 좋아요 내림차순 · 같은 계정은 가장 많은 좋아요를 받은 댓글 기준 · 모집 글 작성자 제외</p></div><span class="ca-update">${s?'최근 조회 '+esc(kst(s.checkedAt)):'조회 대기'}${expired?' · 마감 당시 수치 아님':''}</span></div>${s&&!s.complete?'<div class="ca-warning" role="status">일부 댓글 페이지 조회에 실패했습니다. 순위는 확인된 댓글 기준입니다. 새로고침을 시도해 주세요.</div>':''}<div class="ca-ranking">${others.length?others.map(row).join(''):`<div class="ca-empty-row">${loading?'신청 댓글을 불러오는 중입니다.':s?.complete?'다른 신청 댓글이 없습니다.':'아직 댓글 정보를 확인하지 못했습니다.'}</div>`}</div>`;
}
function render(){
 if(!sectionActive()&&!dashboardActive())return;
 const mode=document.body.dataset.mwsMode||'';
 if(mode!==sessionMode){selected='';editing='';editor.hidden=true;snapshots.clear();pending.clear();attempts.clear();epoch++;sessionMode=mode}
 if(sectionActive()){
  $('caNewBtn').hidden=!isAdmin();if(selected&&!current())selected='';list.hidden=!!selected;detail.hidden=!selected;
  if(selected)renderDetail();else renderList();
 }
 renderDashboardSupport();updateClocks();
}
function updateClocks(){
 if(!active())return;
 const root=sectionActive()?(selected?detail:list):dashboardSupport;
 root?.querySelectorAll('[data-ca-time]').forEach(el=>{const t=countdown(el.dataset.caTime);if(el.textContent!==t.label)el.textContent=t.label});
 let changed=false;root?.querySelectorAll('[data-ca-state]').forEach(el=>{if(el.classList.contains('expired')!==countdown(el.dataset.caState).expired)changed=true});if(changed)render();
}
function stopTimer(){clearInterval(timer);timer=0}
function tick(){if(!active()){stopTimer();return}updateClocks();const c=sectionActive()?current():null;if(c&&!countdown(c.deadline).expired&&Date.now()-(attempts.get(c.id)||0)>60000)refresh(c);else if(!c&&!pending.size)loadVisible()}
function loadVisible(){
 const c=sectionActive()?current():null;if(c){if(!snapshot(c)||Date.now()-(attempts.get(c.id)||0)>60000&&!countdown(c.deadline).expired)refresh(c);return}
 const candidates=records().filter(c=>!countdown(c.deadline).expired&&Date.now()-(attempts.get(c.id)||0)>60000).sort((a,b)=>(attempts.get(a.id)||0)-(attempts.get(b.id)||0));if(candidates.length&&!pending.size)refresh(candidates[0]);
}
function activate(){if(!active()){stopTimer();return}render();if(!timer)timer=setInterval(tick,1000);loadVisible()}
async function fetchPage(source,page){
 const target=`https://chapi.sooplive.co.kr/api/${encodeURIComponent(source.station)}/title/${encodeURIComponent(source.postNo)}/comment?page=${page}&orderby=reg_date`;
 const res=await fetch('/api/soop/proxy?url='+encodeURIComponent(target),{headers:{accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(16000)});
 if(!res.ok)throw Error('SOOP HTTP '+res.status);
 const parsed=parseCommentPage(await res.json(),source);if(parsed.page!==page)throw Error('댓글 페이지 번호 불일치');return parsed;
}
async function fetchSource(source){
 const first=await fetchPage(source,1),rows=[...first.applicants];let complete=first.pages<=100;const limit=Math.min(100,first.pages);
 for(let start=2;start<=limit;start+=3){
  const results=await Promise.allSettled(Array.from({length:Math.min(3,limit-start+1)},(_,i)=>fetchPage(source,start+i)));
  for(const result of results){if(result.status==='fulfilled'){rows.push(...result.value.applicants);if(result.value.pages!==first.pages||result.value.total!==first.total)complete=false}else complete=false}
 }return {rows,complete};
}
async function refresh(c,manual=false){
 if(!c||pending.has(c.id)||!active())return;
 const token=Symbol(),generation=epoch,sig=signature(c);pending.set(c.id,token);attempts.set(c.id,Date.now());render();
 try{
  const rows=[];let complete=c.entries.length>0;
  for(let i=0;i<c.entries.length;i+=2){
   const results=await Promise.allSettled(c.entries.slice(i,i+2).map(fetchSource));
   if(generation!==epoch||pending.get(c.id)!==token)return;
   for(const result of results){if(result.status==='fulfilled'){rows.push(...result.value.rows);complete&&=result.value.complete}else complete=false}
  }
  const latest=records().find(x=>x.id===c.id);if(generation!==epoch||pending.get(c.id)!==token||!latest||signature(latest)!==sig)return;
  const previous=snapshot(c);
  if(!rows.length&&!complete&&previous)snapshots.set(c.id,{...previous,complete:false});
  else snapshots.set(c.id,{signature:sig,applicants:uniqueApplicants(rows),complete,checkedAt:new Date().toISOString()});
  if(manual&&!complete&&typeof toast==='function')toast('신청 콘텐츠','일부 댓글을 확인하지 못했습니다.');
 }finally{if(pending.get(c.id)===token){pending.delete(c.id);if(generation===epoch){render();if(active()&&(!sectionActive()||!selected))loadVisible()}}}
}
function openEditor(c){if(!isAdmin()||busy)return;editing=c?.id||'';editor.hidden=false;form.reset();$('caEditorTitle').textContent=c?'신청 콘텐츠 수정':'새 신청 콘텐츠';$('caTitle').value=c?.title||'';$('caDeadline').value=c?toKstInput(c.deadline):toKstInput(new Date(Date.now()+86400000).toISOString());$('caUrls').value=c?.entries.map(e=>e.url).join('\n')||'';$('caDelete').hidden=!c;$('caFormMessage').textContent='';$('caTitle').focus();}
function closeEditor(){if(busy)return;editor.hidden=true;editing='';$('caFormMessage').textContent=''}
async function commit(rows,reason){data.contentApplications=normalizeCampaigns(rows);saveData(reason);if(window.mwsV55SaveNow){const ok=await window.mwsV55SaveNow();if(!ok&&typeof toast==='function')toast('신청 콘텐츠','온라인 저장을 확인하지 못했습니다. 변경사항은 저장 대기 상태입니다.');return ok}return false}
form.addEventListener('submit',async ev=>{
 ev.preventDefault();if(!isAdmin()||busy)return;
 const title=$('caTitle').value.trim(),deadline=fromKstInput($('caDeadline').value),raw=$('caUrls').value.trim().split(/\s+/).filter(Boolean),msg=$('caFormMessage');
 if(!title||!deadline||!raw.length){msg.textContent='콘텐츠 이름, 마감 시간, 모집 게시글 URL을 입력해 주세요.';return}
 const urls=raw.map(parsePostUrl);if(urls.some(u=>!u)){msg.textContent='SOOP 방송국 게시글 URL만 등록할 수 있습니다.';return}
 const unique=[...new Map(urls.map(u=>[u.id,u])).values()];if(unique.length>MAX_ENTRIES){msg.textContent=`최대 ${MAX_ENTRIES}개 모집 글을 등록할 수 있습니다.`;return}
 const old=records().find(c=>c.id===editing);if(!old&&records().length>=MAX_CAMPAIGNS){msg.textContent=`최대 ${MAX_CAMPAIGNS}개 콘텐츠를 등록할 수 있습니다.`;return}
 busy=true;$('caSave').disabled=true;$('caCancel').disabled=true;$('caDelete').disabled=true;msg.textContent='모집 게시글 저장 중…';
 try{const id=old?.id||crypto.randomUUID(),prior=new Map((old?.entries||[]).map(e=>[e.id,e])),campaign={id,title,deadline,entries:unique.map(u=>prior.get(u.id)||normalizeEntry(u))},rows=records(),index=rows.findIndex(c=>c.id===id);
 if(index<0)rows.push(campaign);else rows[index]=campaign;
 if(!old||signature(old)!==signature(campaign)){snapshots.delete(id);pending.delete(id);attempts.delete(id)}
 selected=id;await commit(rows,'신청 콘텐츠 등록 및 수정');editor.hidden=true;editing='';render();refresh(campaign);
 }catch(e){msg.textContent=e.message||'등록 실패'}finally{busy=false;$('caSave').disabled=false;$('caCancel').disabled=false;$('caDelete').disabled=false}
});
section.addEventListener('click',async ev=>{
 const b=ev.target.closest('button');if(!b)return;
 if(b===$('caNewBtn')||b.hasAttribute('data-ca-create'))openEditor(null);
 else if(b.dataset.caOpen){selected=b.dataset.caOpen;render();loadVisible()}
 else if(b.hasAttribute('data-ca-back')){selected='';render();loadVisible()}
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
window.addEventListener('mawang:datachange',()=>{if(active()){render();loadVisible()}});
activate();
}
