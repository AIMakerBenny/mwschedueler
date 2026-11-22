/* Read-only encounter statistics, shared with the calendar people agenda. */
(()=>{
  const {build,matchesName,img,esc}=window.mwsCalendarPeopleViewV1;
  const colors=['#8c82ff','#25b9a3','#e9a248','#e476ad','#5d9df6'];
  const shift=(month,n)=>{const d=new Date(Date.UTC(+month.slice(0,4),+month.slice(5)-1+n,1));return d.toISOString().slice(0,7)};
  function model(source,today,range='all'){
    const index=build(source,'',today),end=today.slice(0,7);
    const first=index.days[0]?.date.slice(0,7)||end;
    const start=range==='all'?first:shift(end,1-Number(range));
    const months=[];for(let m=start;m<=end;m=shift(m,1))months.push(m);
    const byId=new Map(),days=new Set();let encounters=0;
    for(const day of index.days){const m=day.date.slice(0,7);if(m<start||m>end)continue;days.add(day.date);
      for(const p of day.people){
        if(!byId.has(p.id))byId.set(p.id,{id:p.id,contact:p.contact,days:0,events:new Set(),last:'',monthly:new Map()});
        const row=byId.get(p.id);row.days++;row.last=day.date;encounters++;row.monthly.set(m,(row.monthly.get(m)||0)+1);for(const event of p.events)row.events.add(event.id);
      }
    }
    const rows=[...byId.values()].map(r=>({...r,events:r.events.size,values:months.map(m=>r.monthly.get(m)||0)})).sort((a,b)=>b.days-a.days||b.last.localeCompare(a.last)||String(a.contact.name||'').localeCompare(String(b.contact.name||''),'ko'));
    return {months,rows,days:days.size,encounters,start,end};
  }
  const root=document.getElementById('contactFrequency');
  let source,today,selected='',period='',stats,series=[],pinned=false;
  const $=id=>document.getElementById(id);
  const monthLabel=m=>`${m.slice(0,4)}.${m.slice(5)}`;
  function draw(){
    if(!source||!root)return;
    stats=model(source,today,$('contactFrequencyRange').value);
    if(selected&&!stats.rows.some(r=>r.id===selected))selected='';
    const {rows,months,days,encounters,start,end}=stats;
    $('contactFrequencySummary').innerHTML=[['기록 기간',`${monthLabel(start)} – ${monthLabel(end)}`],['함께한 날짜',`${days.toLocaleString()}일`],['함께한 인물',`${rows.length.toLocaleString()}명`],['인물별 만남 합계',`${encounters.toLocaleString()}일`]].map(([label,value])=>`<div class="cf-stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
    series=selected?rows.filter(r=>r.id===selected):rows.slice(0,5);pinned=false;
    $('contactFrequencyReset').disabled=!selected;
    $('contactFrequencyLegend').innerHTML=series.map((r,i)=>`<span><i style="--cf-color:${colors[i]}"></i>${esc(r.contact.name||'이름 없음')} <b>${r.days}일</b></span>`).join('');
    if(!series.length){$('contactFrequencyChart').innerHTML='<p class="cf-empty">해당 기간의 만남 기록이 없습니다.</p>';$('contactFrequencyDetail').innerHTML='';renderRanking();return}
    const width=Math.max(560,$('contactFrequencyChart').clientWidth,months.length*76+64),height=268,left=38,right=28,top=18,bottom=36,plotH=height-top-bottom;
    const max=Math.max(1,...series.flatMap(r=>r.values)),step=Math.max(1,Math.ceil(max/4)),ceiling=Math.ceil(max/step)*step;
    const x=i=>months.length===1?width/2:left+i*(width-left-right)/(months.length-1),y=v=>top+plotH*(1-v/ceiling);
    let grid='';for(let v=0;v<=ceiling;v+=step)grid+=`<line x1="${left}" x2="${width-right}" y1="${y(v)}" y2="${y(v)}" class="cf-gridline"/><text x="${left-8}" y="${y(v)+4}" text-anchor="end">${v}</text>`;
    const labels=months.map((m,i)=>`<text x="${x(i)}" y="${height-9}" text-anchor="middle">${monthLabel(m)}</text>`).join('');
    const lines=series.map((r,i)=>`<polyline points="${r.values.map((v,j)=>`${x(j)},${y(v)}`).join(' ')}" fill="none" stroke="${colors[i]}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${r.values.map((v,j)=>`<circle data-cf-point-month="${j}" cx="${x(j)}" cy="${y(v)}" r="4" fill="${colors[i]}" stroke="var(--panel)" stroke-width="1.5"/>`).join('')}`).join('');
    const markers=months.map((m,i)=>`<line class="cf-month-marker" data-cf-marker="${i}" x1="${x(i)}" x2="${x(i)}" y1="${top}" y2="${height-bottom}"/>`).join('');
    const targets=months.map((m,i)=>{const a=i?(x(i-1)+x(i))/2:0,b=i<months.length-1?(x(i)+x(i+1))/2:width;return `<rect class="cf-month-target" data-cf-month="${i}" x="${a}" width="${b-a}" y="0" height="${height}" tabindex="0" role="button" aria-pressed="false" aria-label="${monthLabel(m)} ${esc(series.map(r=>`${r.contact.name} ${r.values[i]}일`).join(', '))}"/>`}).join('');
    $('contactFrequencyChart').innerHTML=`<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="월별 만남 일수">${grid}${labels}${markers}${lines}${targets}</svg><div class="cf-tooltip" id="contactFrequencyTooltip" role="status" hidden></div>`;
    if(!months.includes(period))period=months.at(-1);
    $('contactFrequencyDetail').innerHTML=`<label>월별 상세 <select id="contactFrequencyMonth">${months.map(m=>`<option value="${m}"${m===period?' selected':''}>${monthLabel(m)}</option>`).join('')}</select></label><div class="cf-month-values">${series.map((r,i)=>`<span><i style="--cf-color:${colors[i]}"></i>${esc(r.contact.name)} <b>${r.values[months.indexOf(period)]}일</b></span>`).join('')}</div>`;
    renderRanking();
    highlight(months.indexOf(period));
  }
  function highlight(i){
    const chart=$('contactFrequencyChart');
    for(const el of chart.querySelectorAll('[data-cf-marker],[data-cf-point-month]'))el.classList.toggle('cf-current',Number(el.dataset.cfMarker??el.dataset.cfPointMonth)===i);
    for(const el of chart.querySelectorAll('[data-cf-month]'))el.setAttribute('aria-pressed',String(Number(el.dataset.cfMonth)===stats.months.indexOf(period)));
  }
  function chooseMonth(i){
    if(!stats?.months[i])return;period=stats.months[i];$('contactFrequencyMonth').value=period;
    $('contactFrequencyDetail').querySelector('.cf-month-values').innerHTML=series.map((r,j)=>`<span><i style="--cf-color:${colors[j]}"></i>${esc(r.contact.name)} <b>${r.values[i]}일</b></span>`).join('');highlight(i);
  }
  function showMonth(target){
    const i=Number(target.dataset.cfMonth),chart=$('contactFrequencyChart'),tip=$('contactFrequencyTooltip');if(!tip||!stats?.months[i])return;
    tip.innerHTML=`<strong>${monthLabel(stats.months[i])}</strong>${series.map((r,j)=>`<span><i style="--cf-color:${colors[j]}"></i>${esc(r.contact.name)}<b>${r.values[i]}일</b></span>`).join('')}`;tip.hidden=false;
    const marker=chart.querySelector(`[data-cf-marker="${i}"]`),rect=chart.getBoundingClientRect(),x=marker.getBoundingClientRect().left-rect.left+chart.scrollLeft;
    tip.style.left=`${Math.max(chart.scrollLeft+4,Math.min(x+12,chart.scrollLeft+chart.clientWidth-tip.offsetWidth-4))}px`;highlight(i);
  }
  function hideMonth(){const tip=$('contactFrequencyTooltip');if(tip)tip.hidden=true;if(series.length)highlight(stats.months.indexOf(period))}
  function renderRanking(){
    if(!stats)return;const query=$('contactFrequencySearch').value,max=stats.rows[0]?.days||1;
    const rows=stats.rows.map((r,i)=>({...r,rank:i+1})).filter(r=>matchesName(r.contact.name,query));
    $('contactFrequencyRanking').innerHTML=rows.length?rows.map(r=>`<button type="button" class="cf-rank${selected===r.id?' active':''}" data-cf-person="${esc(r.id)}" aria-pressed="${selected===r.id}"><span class="cf-rank-no">${r.rank}</span>${img(r.contact)}<span class="cf-rank-name"><strong>${esc(r.contact.name||'이름 없음')}</strong><small>최근 ${esc(r.last)} · 콘텐츠 ${r.events}개</small><span class="cf-bar"><i style="width:${r.days/max*100}%"></i></span></span><span class="cf-count"><b>${r.days}</b>일</span></button>`).join(''):'<p class="cf-empty">검색 조건에 해당하는 인물이 없습니다.</p>';
  }
  function render(data,date){if(!root)return;source=data;today=date;draw()}
  if(root){
    $('contactFrequencyRange').addEventListener('change',draw);
    $('contactFrequencySearch').addEventListener('input',renderRanking);
    $('contactFrequencyReset').addEventListener('click',()=>{selected='';draw()});
    root.addEventListener('change',e=>{if(e.target.id==='contactFrequencyMonth'){pinned=false;chooseMonth(stats.months.indexOf(e.target.value));hideMonth()}});
    root.addEventListener('click',e=>{const b=e.target.closest('[data-cf-person]');if(b){selected=selected===b.dataset.cfPerson?'':b.dataset.cfPerson;draw();[...root.querySelectorAll('[data-cf-person]')].find(el=>el.dataset.cfPerson===b.dataset.cfPerson)?.focus({preventScroll:true})}});
    root.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.hidden=true},true);
    const chart=$('contactFrequencyChart');
    const pick=e=>e.target.closest('[data-cf-month]');
    const activate=target=>{pinned=true;chooseMonth(Number(target.dataset.cfMonth));showMonth(target)};
    chart.addEventListener('pointerover',e=>{const t=pick(e);if(t&&e.pointerType==='mouse'&&!pinned)showMonth(t)});
    chart.addEventListener('pointerleave',()=>{if(!pinned)hideMonth()});
    chart.addEventListener('focusin',e=>{const t=pick(e);if(t&&!pinned)showMonth(t)});
    chart.addEventListener('focusout',()=>{if(!pinned)hideMonth()});
    chart.addEventListener('click',e=>{const t=pick(e);if(t)activate(t);else{pinned=false;hideMonth()}});
    chart.addEventListener('keydown',e=>{const t=pick(e);if(e.key==='Escape'){pinned=false;hideMonth()}else if(t&&['Enter',' '].includes(e.key)){e.preventDefault();activate(t)}});
    chart.addEventListener('scroll',()=>{const tip=$('contactFrequencyTooltip');if(tip&&!tip.hidden){pinned=false;hideMonth()}},{passive:true});
  }
  window.mwsContactFrequencyV1={model,render};
})();
