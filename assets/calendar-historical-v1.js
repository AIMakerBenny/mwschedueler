/* Month-only historical records never receive an invented day. */
(()=>{
  const archive=window.mwsCareerActivitiesDataV1||[];
  const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
  const aliases={'와우 포에버':['와포','월드오브워크래프트포에버'],'SBO 세구 베이스볼 온라인':['sbo','세구베이스볼온라인']};
  function monthRecords(month,events=[]){
    const titles=events.filter(e=>!e.restDay&&String(e.date||'').startsWith(month+'-')).map(e=>norm(e.title));
    return archive.filter(r=>r.date===month&&!titles.some(t=>[norm(r.title),...(aliases[r.title]||[])].some(a=>a&&t.includes(a))));
  }
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let previous='';
  function render(date,events){
    const panel=document.getElementById('calendarHistoricalMonthV1');if(!panel)return;
    const month=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`,rows=monthRecords(month,events);
    if(previous!==month)panel.open=false;previous=month;panel.hidden=!rows.length;
    panel.querySelector('[data-history-count]').textContent=rows.length+'건';
    panel.querySelector('[data-history-list]').innerHTML=rows.map(r=>`<article><strong>${esc(r.title)}</strong><p>${esc(r.context)}</p><small>${esc(r.date)} · 정확한 일자 미상${r.end?' · 종료 기록 '+esc(r.end):''}</small><small>${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.source)}</a>`:esc(r.source)}</small></article>`).join('');
  }
  window.mwsCalendarHistoricalV1={monthRecords,render};
})();
