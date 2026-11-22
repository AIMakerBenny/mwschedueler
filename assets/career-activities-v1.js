/* Separate read-only archive; never writes scheduler data or achievement records. */
(()=>{
  const kinds={game:'게임',collab:'합방',host:'주최·운영',event:'대회·참가',server:'서버',media:'영상·제작',calendar:'캘린더'};
  const basis={event:'활동일',publication:'공개·보도일',record:'기록 기준',announcement:'개설 공지일',calendar:'등록 일정일'};
  const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
  const excluded=s=>/마카오톡|마카오\s*톡/.test(s);
  const isDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
  const monthKey=r=>r.date.slice(0,7);
  const dateKey=d=>d.length===7?d+'-00':d;
  const compare=(a,b)=>dateKey(b.date).localeCompare(dateKey(a.date))||a.title.localeCompare(b.title,'ko');
  function build(archive,events,today){
    const rows=archive.filter(r=>!excluded(r.title)&&r.date<=today).slice(),keys=new Set(rows.map(r=>r.date+'|'+norm(r.title))),ids=new Set();
    for(const e of events||[]){
      const title=String(e?.title||'').trim(),date=String(e?.date||''),id=String(e?.id||'');
      if(!id||ids.has(id)||!title||!isDate(date)||date>=today||e.restDay||/^(휴방|휴식|미정|일정 미정|일정 없음|취소|방송 없음)$/.test(title)||excluded(title)||e.cancelled||e.canceled||['cancelled','canceled','취소'].includes(e.status))continue;
      const key=date+'|'+norm(title);if(keys.has(key))continue;
      ids.add(id);keys.add(key);
      rows.push({date,kind:'calendar',title,context:'캘린더에 등록된 과거 일정 · 실제 진행 여부는 별도 확인 필요',source:'스케줄러 캘린더',url:'',end:'',basis:'calendar',origin:'calendar',id});
    }
    return rows.sort(compare);
  }
  function filter(rows,{year='',kind='',query='',source=''}={}){
    const tokens=query.trim().split(/\s+/).map(norm).filter(Boolean);
    return rows.filter(r=>(!year||r.date.startsWith(year))&&(!kind||r.kind===kind)&&(!source||r.origin===source)&&tokens.every(t=>norm([r.title,r.context,r.date,r.end,kinds[r.kind],r.source].join(' ')).includes(t)));
  }
  const api=window.mwsCareerActivitiesV1={build,filter,kinds};
  const section=document.getElementById('careerTimeline');if(!section)return;
  const archive=window.mwsCareerActivitiesDataV1||[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const icons={achievement:icon('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4"/>'),activity:icon('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 8h2m3 0h5M7 12h2m3 0h5M7 16h2m3 0h5"/>')};
  const nav=document.createElement('div');nav.className='ca-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','타임라인 기록 유형');
  nav.innerHTML=`<button type="button" id="careerAchievementsTabV1" role="tab" aria-selected="true" aria-controls="careerAchievementsPanelV1" data-career-tab="achievements">${icons.achievement}<span>업적</span></button><button type="button" id="careerActivitiesTabV1" role="tab" aria-selected="false" aria-controls="careerActivitiesPanelV1" tabindex="-1" data-career-tab="activities">${icons.activity}<span>콘텐츠 활동</span></button>`;
  section.prepend(nav);
  const panel=document.createElement('div');panel.id='careerActivitiesPanelV1';panel.className='ca-panel';panel.hidden=true;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','careerActivitiesTabV1');
  panel.innerHTML=`<header class="ca-intro"><div><span class="ca-eyebrow">ACTIVITY ARCHIVE</span><h2>마왕0216 콘텐츠 아카이브</h2><p>게임, 합방, 대회, 서버와 제작 활동을 날짜별로 살펴보세요.</p></div><div class="ca-totals"><div><strong data-ca-total>0</strong><span>전체 기록</span></div><div><strong data-ca-archive>0</strong><span>과거 자료</span></div><div><strong data-ca-calendar>0</strong><span>캘린더</span></div></div></header><div class="ca-controls"><div class="ca-years" aria-label="연도 선택"></div><div class="ca-filter"><label class="ca-search">${icon('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>')}<input type="search" placeholder="콘텐츠, 게임, 인물 검색" aria-label="콘텐츠 검색"></label><select aria-label="활동 유형" data-ca-kind><option value="">모든 활동</option>${Object.entries(kinds).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><select aria-label="기록 출처" data-ca-source><option value="">모든 출처</option><option value="archive">과거 자료</option><option value="calendar">캘린더</option></select><button type="button" class="ca-sort" data-ca-sort aria-pressed="false">최신순</button></div></div><div class="ca-caption"><span data-ca-count role="status"></span><span>날짜 미상은 확인된 월까지만 표시 · 캘린더 기록은 진행 확정 아님</span></div><div class="ca-month-jump" aria-label="월별 이동"></div><div class="ca-list"></div><button class="ca-more" type="button" hidden>기록 더 보기</button><footer class="ca-footer">과거 자료는 공식 방송·영상, 제작자 기록, 기존 타임라인과 위키를 참고했습니다. 공개·보도일은 실제 진행일과 다를 수 있으며, 누락된 활동이 있을 수 있습니다.</footer>`;
  section.append(panel);
  const $=s=>panel.querySelector(s),years=$('.ca-years'),list=$('.ca-list'),search=panel.querySelector('input'),more=$('.ca-more');
  let rows=[],year=null,limit=70,ascending=false,dirty=true,view='achievements';
  let frame=0,scrollPositions={achievements:0,activities:0};
  function root(){for(let el=section.parentElement;el&&el!==document.body;el=el.parentElement){if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.clientHeight)return el}return document.scrollingElement}
  const today=()=>typeof todayKST==='function'?todayKST():new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function refresh(){
    rows=build(archive,typeof data!=='undefined'?data.events:[],today());dirty=false;
    const ys=[...new Set(rows.map(r=>r.date.slice(0,4)))];
    if(year===null||year&&!ys.includes(year))year=ys[0]||'';
    years.innerHTML=[['','전체'],...ys.map(y=>[y,y])].map(([id,title])=>`<button type="button" data-ca-year="${id}" aria-pressed="${year===id}">${title}<small>${id?rows.filter(r=>r.date.startsWith(id)).length:rows.length}</small></button>`).join('');
    $('[data-ca-total]').textContent=rows.length.toLocaleString('ko-KR');$('[data-ca-archive]').textContent=rows.filter(r=>r.origin==='archive').length.toLocaleString('ko-KR');$('[data-ca-calendar]').textContent=rows.filter(r=>r.origin==='calendar').length.toLocaleString('ko-KR');
  }
  function dateText(d){return d.length===10?`${Number(d.slice(5,7))}월 ${Number(d.slice(8))}일`:d.length===7?`${Number(d.slice(5))}월 · 일자 미상`:`${d}년 · 월 미상`}
  function rowHTML(r){
    const date=r.date.length===10?String(Number(r.date.slice(8))):'—';
    const url=r.url&&/^https:\/\//i.test(r.url)?r.url:'';
    return `<article class="ca-record" data-ca-category="${r.kind}"><div class="ca-date"><time datetime="${esc(r.date)}">${date}</time><small>${r.date.length===10?'일':'월 기록'}</small></div><span class="ca-dot" aria-hidden="true"></span><div class="ca-card"><div class="ca-card-main"><div class="ca-meta"><span class="ca-kind">${kinds[r.kind]}</span><span>${esc(basis[r.basis]||'기록 기준')}</span>${r.end?`<span>${esc(dateText(r.date))} ~ ${esc(dateText(r.end))}</span>`:''}</div><h3>${esc(r.title)}</h3><p>${esc(r.context)}</p></div><div class="ca-source">${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="출처 열기">${esc(r.source)} ↗</a>`:r.id?`<button type="button" data-ca-event="${esc(r.id)}">일정 상세 ›</button>`:`<span>${esc(r.source)}</span>`}</div></div></article>`;
  }
  function render(){
    if(view!=='activities'||!section.classList.contains('active'))return;
    if(dirty)refresh();
    for(const b of years.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.caYear===year));
    const result=filter(rows,{year,kind:$('[data-ca-kind]').value,source:$('[data-ca-source]').value,query:search.value});if(ascending)result.reverse();
    const monthCounts=new Map();for(const r of result)monthCounts.set(monthKey(r),(monthCounts.get(monthKey(r))||0)+1);
    $('.ca-month-jump').innerHTML=[...monthCounts].map(([m,n])=>`<button type="button" data-ca-month="${esc(m)}">${year?m.slice(5)+'월':m.replace('-','년 ')+'월'} <small>${n}</small></button>`).join('');
    const groups=new Map();for(const r of result.slice(0,limit)){const key=monthKey(r);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r)}
    list.innerHTML=groups.size?[...groups].map(([key,items])=>`<div class="ca-month" data-ca-group="${esc(key)}"><h3><span>${key.slice(0,4)}년 ${Number(key.slice(5))}월</span><small>${monthCounts.get(key)}건</small></h3>${items.map(rowHTML).join('')}</div>`).join(''):'<div class="ca-empty">조건에 맞는 활동 기록이 없습니다.</div>';
    $('[data-ca-count]').textContent=`${result.length.toLocaleString('ko-KR')}건 · ${Math.min(limit,result.length).toLocaleString('ko-KR')}건 표시`;
    more.hidden=result.length<=limit;more.textContent=`기록 더 보기 · ${Math.max(0,result.length-limit)}건 남음`;
  }
  function update(){limit=70;render()}
  function select(next){
    if(next===view)return;scrollPositions[view]=root()?.scrollTop||0;view=next;section.dataset.careerView=view;panel.hidden=view!=='activities';
    for(const b of nav.querySelectorAll('button')){const selected=b.dataset.careerTab===view;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1}
    if(view==='activities'){dirty=true;render()}
    root()?.scrollTo({top:scrollPositions[view],behavior:'instant'});
  }
  nav.addEventListener('click',e=>{const b=e.target.closest('[data-career-tab]');if(b)select(b.dataset.careerTab)});
  nav.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const target=e.key==='Home'?'achievements':e.key==='End'?'activities':view==='activities'?'achievements':'activities';select(target);nav.querySelector('[aria-selected=true]').focus()});
  panel.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-ca-year')){year=b.dataset.caYear;update();return}
    if(b.hasAttribute('data-ca-sort')){ascending=!ascending;b.setAttribute('aria-pressed',String(ascending));b.textContent=ascending?'오래된순':'최신순';update();return}
    if(b.hasAttribute('data-ca-month')){const month=b.dataset.caMonth;let target=list.querySelector(`[data-ca-group="${month}"]`);if(!target){limit=rows.length;render();target=list.querySelector(`[data-ca-group="${month}"]`)}target?.scrollIntoView({block:'start'});return}
    if(b.hasAttribute('data-ca-event')){window.openCalendarEventDetailsV1?.(b.dataset.caEvent,b);return}
    if(b===more){const first=list.querySelectorAll('.ca-record').length;limit+=70;render();const newFirst=list.querySelectorAll('.ca-record')[first];if(newFirst){newFirst.tabIndex=-1;newFirst.focus({preventScroll:true})}}
  });
  panel.addEventListener('change',e=>{if(e.target.tagName==='SELECT')update()});
  search.addEventListener('input',()=>{if(search.value.trim()&&year){year=''}update()});
  window.addEventListener('mawang:datachange',()=>{dirty=true;if(view==='activities'&&section.classList.contains('active')&&!frame)frame=requestAnimationFrame(()=>{frame=0;render()})});
  new MutationObserver(()=>{if(section.classList.contains('active')&&view==='activities'){dirty=true;render()}}).observe(section,{attributes:true,attributeFilter:['class']});
  api.refresh=()=>{dirty=true;render()};
})();
