function attendanceModel(source,today,from='',to=today){
  const ids=new Set((source.categories||[]).filter(c=>String(c?.name||'').trim()==='브산동').map(c=>String(c.id)));
  const own=String(source.selfContactId||'');
  const contacts=new Map((source.contacts||[]).filter(c=>c?.id&&String(c.id)!==own).map(c=>[String(c.id),c]));
  const seen=new Set(),events=[];
  for(const e of source.events||[]){
    if(!e?.id||seen.has(String(e.id))||!ids.has(String(e.categoryId))||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||e.restDay||e.cancelled===true||e.canceled===true||['cancelled','canceled'].includes(e.status)||String(e.title||'').trim()==='휴방')continue;
    seen.add(String(e.id));
    const people=[...new Set((Array.isArray(e.participants)?e.participants:[]).map(String))].filter(id=>id!==own&&id!==String(e.autoSelfParticipantId||''));
    const confirmed=people.filter(id=>e.participantStatuses?.[id]!=='planned');
    const planned=people.filter(id=>e.participantStatuses?.[id]==='planned');
    const ended=e.date<today;
    events.push({id:String(e.id),date:e.date,start:String(e.start||''),end:String(e.end||''),title:String(e.title||'제목 없음'),confirmed,planned,ended,recorded:ended&&confirmed.length>0});
  }
  events.sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
  const completed=events.filter(e=>e.recorded),members=new Map();
  completed.forEach((e,i)=>{for(const id of e.confirmed){if(!members.has(id))members.set(id,{id,contact:contacts.get(id)||{id,name:'삭제되었거나 확인할 수 없는 연락처'},first:e.date,last:e.date,firstIndex:i,lastIndex:i,count:0});const m=members.get(id);m.last=e.date;m.lastIndex=i;m.count++;}});
  const inRange=e=>(!from||e.date>=from)&&(!to||e.date<=to);
  const period=completed.filter(inRange),periodSet=new Set(period.map(e=>e.id));
  const rows=[...members.values()].map(m=>{
    const eligible=completed.slice(m.firstIndex).filter(e=>periodSet.has(e.id));
    const count=eligible.filter(e=>e.confirmed.includes(m.id)).length;
    const missed=completed.length-1-m.lastIndex;
    const lifetime=completed.length-m.firstIndex;
    return {...m,lifetime,missed,rate:m.count/lifetime,periodCount:count,periodEligible:eligible.length,periodRate:eligible.length?count/eligible.length:null};
  }).sort((a,b)=>b.lastIndex-a.lastIndex||String(a.contact.name||'').localeCompare(String(b.contact.name||''),'ko'));
  const history=events.filter(inRange).reverse(),unknown=history.filter(e=>e.ended&&!e.recorded).length;
  return {events,history,completed,period,rows,contacts,unknown};
}
function attendanceBuckets(model,unit,person=''){
  const groups=new Map();
  const key=e=>{if(unit==='day')return e.date;if(unit==='week'){const d=new Date(e.date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10)}return e.date.slice(0,7)};
  const indices=new Map(model.completed.map((e,i)=>[e.id,i]));
  const memberMap=new Map(model.rows.map(m=>[m.id,m]));
  for(const e of model.period){const k=key(e);if(!groups.has(k))groups.set(k,{key:k,sessions:0,attended:0,eligible:0});const g=groups.get(k);g.sessions++;
    const i=indices.get(e.id);
    const eligible=person?(memberMap.has(person)&&memberMap.get(person).firstIndex<=i?[person]:[]):model.rows.filter(m=>m.firstIndex<=i).map(m=>m.id);
    g.eligible+=eligible.length;g.attended+=eligible.filter(id=>e.confirmed.includes(id)).length;
  }
  return [...groups.values()].map(g=>({...g,rate:g.eligible?g.attended/g.eligible:null}));
}

(()=>{
 const root=document.getElementById('bsandong');if(!root)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=v=>v===null?'—':Math.round(v*100)+'%';
 const state={tab:'history',from:'',to:'',unit:'month',person:'',search:'',sort:'recent',threshold:3,page:1};
 let source,today;
 const avatar=(c,rate=null,missed=0)=>'<span class="bs-ring" style="--bs-progress:'+Math.round((rate||0)*100)+'%;--bs-ring:'+ (missed>=state.threshold?'#e6a23c':rate===null?'var(--muted)':rate>=.75?'#42c9ad':rate>=.4?'#7c9dfb':'#a4a4b5')+'">'+(typeof participantAvatarHTMLV109==='function'?participantAvatarHTMLV109(c):'<span>'+esc(String(c.name||'?').slice(0,2))+'</span>')+'</span>';
 const label=m=>m.missed>=state.threshold?'최근 미참석':m.missed===0?'최근 참석':'참석 기록 있음';
 const nameMatch=(c,q)=>window.mwsCalendarPeopleViewV1?.matchesName(c?.name||'',q)??String(c?.name||'').toLowerCase().includes(q.toLowerCase());
 function personChip(id,model,planned=false){const m=model.rows.find(x=>x.id===id),c=model.contacts.get(id)||{id,name:'확인 불가'};return '<button type="button" class="bs-person'+(planned?' bs-planned':'')+'" data-bs-member="'+esc(id)+'">'+avatar(c,m?.rate??null,m?.missed??0)+'<span>'+esc(c.name)+(planned?' <small>예정</small>':'')+'</span></button>'}
 function renderHistory(m){
   const filtered=m.history.filter(e=>!state.search||e.title.includes(state.search)||[...e.confirmed,...e.planned].some(id=>nameMatch(m.contacts.get(id),state.search)));
   const limit=state.page*12;let date='';
   const html=filtered.slice(0,limit).map(e=>{const header=e.date!==date?'<h3 class="bs-day">'+esc(e.date)+'</h3>':'';date=e.date;return header+'<article class="bs-session"><div class="bs-session-head"><div><button type="button" class="bs-title-button" data-bs-event="'+esc(e.id)+'">'+esc(e.title)+'</button><small>'+esc([e.start,e.end].filter(t=>t&&t!=='TBD').join(' - ')||'시간 미정')+'</small></div><span class="bs-pill">'+(e.recorded?'확정 기록 '+e.confirmed.length+'명':e.ended?'참석 기록 미확인':'예정 · 확정 '+e.confirmed.length+'명')+'</span></div><div class="bs-people">'+e.confirmed.map(id=>personChip(id,m)).join('')+e.planned.map(id=>personChip(id,m,true)).join('')+(!e.confirmed.length&&!e.planned.length?'<span class="bs-muted">등록된 참가자가 없습니다.</span>':'')+'</div></article>'}).join('');
   return (html||'<div class="bs-empty">해당 기간에 표시할 활동이 없습니다.</div>')+(filtered.length>limit?'<button type="button" data-bs-more>더 보기</button>':'');
 }
 function renderStats(m){
   const buckets=attendanceBuckets(m,state.unit,state.person);
   const total=buckets.reduce((s,b)=>({attended:s.attended+b.attended,eligible:s.eligible+b.eligible}),{attended:0,eligible:0});
   const options=m.rows.map(r=>'<option value="'+esc(r.id)+'"'+(state.person===r.id?' selected':'')+'>'+esc(r.contact.name)+'</option>').join('');
   const bars=buckets.map(b=>'<div class="bs-chart-item"><span>'+pct(b.rate)+'</span><div class="bs-bar-track"><div class="bs-bar" style="height:'+((b.rate||0)*100)+'%"></div></div><time>'+esc(b.key)+'</time><small>'+b.attended+'/'+b.eligible+'</small></div>').join('');
   const ranks=m.rows.filter(r=>r.periodEligible&&nameMatch(r.contact,state.search)).sort((a,b)=>b.periodRate-a.periodRate||b.periodCount-a.periodCount);
   return '<div class="bs-chart-card"><div class="bs-chart-head"><div><span class="bs-muted">선택 기간 참석 기록률</span><div class="bs-big">'+pct(total.eligible?total.attended/total.eligible:null)+'</div></div><div class="bs-chart-controls"><label>참가자<select data-bs-field="person"><option value="">전체 회원</option>'+options+'</select></label><label>집계<select data-bs-field="unit">'+[['day','일별'],['week','주별'],['month','월별']].map(([v,t])=>'<option value="'+v+'"'+(state.unit===v?' selected':'')+'>'+t+'</option>').join('')+'</select></label></div></div><div class="bs-chart">'+(bars||'<div class="bs-empty">집계할 기록이 없습니다.</div>')+'</div><p class="bs-note">최초 확인 참석 이후의 기록 있는 회차를 분모로 계산합니다. 확정 기록 기준이며 실제 출석 확인 자료는 아닙니다.</p></div><div class="bs-rank-list">'+ranks.slice(0,state.page*24).map(r=>'<button type="button" data-bs-graph="'+esc(r.id)+'" class="bs-rank">'+avatar(r.contact,r.rate,r.missed)+'<span>'+esc(r.contact.name)+'</span><span class="bs-meter"><i style="width:'+r.periodRate*100+'%"></i></span><strong>'+pct(r.periodRate)+'</strong><small>'+r.periodCount+'/'+r.periodEligible+'회</small></button>').join('')+(ranks.length>state.page*24?'<button type="button" data-bs-more>더 보기</button>':'')+'</div>';
 }
 function renderMembers(m){
   const rows=m.rows.filter(r=>nameMatch(r.contact,state.search)).sort((a,b)=>state.sort==='missed'?b.missed-a.missed||b.lastIndex-a.lastIndex:state.sort==='frequency'?b.rate-a.rate||b.count-a.count:state.sort==='first'?a.firstIndex-b.firstIndex:b.lastIndex-a.lastIndex);
   return '<div class="bs-member-controls"><label>정렬<select data-bs-field="sort">'+[['recent','최신 참석순'],['first','최초 참석순'],['frequency','참석 기록률순'],['missed','연속 미참석 기록순']].map(([v,t])=>'<option value="'+v+'"'+(state.sort===v?' selected':'')+'>'+t+'</option>').join('')+'</select></label><label>관심 기준<select data-bs-field="threshold">'+[2,3,5,8,10].map(n=>'<option value="'+n+'"'+(state.threshold===n?' selected':'')+'>'+n+'회 이상</option>').join('')+'</select></label></div><p class="bs-note">회원 현황은 전체 기록 기준입니다. 관심 기준은 연속 미확정 회차에 대한 확인 표시이며 회원의 의도나 실제 불참을 단정하지 않습니다.</p><div class="bs-members">'+(rows.slice(0,state.page*24).map(r=>'<article class="bs-member'+(r.missed>=state.threshold?' bs-attention':'')+'"><div class="bs-member-top">'+avatar(r.contact,r.rate,r.missed)+'<div><strong>'+esc(r.contact.name)+'</strong><small>'+label(r)+'</small></div><span class="bs-member-rate">'+pct(r.rate)+'</span></div><dl><div><dt>최초 참석</dt><dd>'+r.first+'</dd></div><div><dt>최신 참석</dt><dd>'+r.last+'</dd></div><div><dt>누적 참석</dt><dd>'+r.count+' / '+r.lifetime+'회</dd></div><div><dt>이후 미참석 기록</dt><dd>'+r.missed+'회</dd></div></dl><button type="button" class="bs-profile-button" data-bs-graph="'+esc(r.id)+'">개별 참석 추이</button></article>').join('')||'<div class="bs-empty">해당하는 참가자가 없습니다.</div>')+'</div>'+(rows.length>state.page*24?'<button type="button" data-bs-more>더 보기</button>':'');
 }
 function draw(){
   if(!source||!today)return;
   const model=attendanceModel(source,today,state.from,state.to||'9999-12-31');
   if(state.person&&!model.rows.some(r=>r.id===state.person))state.person='';
   const count=model.period.length,unique=new Set(model.period.flatMap(e=>e.confirmed)).size,avg=count?model.period.reduce((s,e)=>s+e.confirmed.length,0)/count:null;
   root.querySelectorAll('[data-bs-tab]').forEach(b=>{const active=b.dataset.bsTab===state.tab;b.setAttribute('aria-selected',String(active));b.classList.toggle('active',active)});
   root.querySelector('[data-bs-dates]').hidden=state.tab==='members';
   root.querySelector('[data-bs-summary]').innerHTML=[['활동 기록',count+'회'],['참가자',unique+'명'],['평균 참가 인원',avg===null?'—':avg.toFixed(1)+'명'],['기록 미확인',model.unknown+'회']].map(([k,v])=>'<div><small>'+k+'</small><strong>'+v+'</strong></div>').join('');
   root.querySelector('[data-bs-summary]').hidden=state.tab==='members';
   root.querySelector('[data-bs-body]').innerHTML=state.tab==='history'?renderHistory(model):state.tab==='stats'?renderStats(model):renderMembers(model);
   try{window.mwsScheduleImageTune?.();if(typeof mwsScanContactMediaImagesV111==='function')mwsScanContactMediaImagesV111(root)}catch(_){}
 }
 function tab(t){state.tab=t;state.page=1;draw()}
 root.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.dataset.bsTab){tab(b.dataset.bsTab);return}
   if(b.hasAttribute('data-bs-more')){state.page++;draw();return}
   if(b.dataset.bsEvent){if(typeof openCalendarEventDetailsV1==='function')openCalendarEventDetailsV1(b.dataset.bsEvent,b);return}
   if(b.dataset.bsGraph||b.dataset.bsMember){const id=b.dataset.bsGraph||b.dataset.bsMember;if(!attendanceModel(source,today).rows.some(r=>r.id===id))return;state.person=id;tab('stats');return}
   if(b.dataset.bsPreset){const n=Number(b.dataset.bsPreset);state.from='';state.to='';if(n){const d=new Date(today+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-n+1);state.from=d.toISOString().slice(0,10);state.to=today}root.querySelector('[data-bs-field=from]').value=state.from;root.querySelector('[data-bs-field=to]').value=state.to;state.page=1;draw()}
 });
 root.addEventListener('change',e=>{const k=e.target.dataset.bsField;if(!k)return;state[k]=k==='threshold'?Number(e.target.value):e.target.value;if(state.from&&state.to&&state.from>state.to){if(k==='from')state.to=state.from;else state.from=state.to;root.querySelector('[data-bs-field=from]').value=state.from;root.querySelector('[data-bs-field=to]').value=state.to}state.page=1;draw()});
 root.addEventListener('input',e=>{if(e.target.dataset.bsField==='search'){state.search=e.target.value;state.page=1;draw()}});
 window.mwsBsandongV1={render(s,t){source=s;today=t;draw()}};
})();
