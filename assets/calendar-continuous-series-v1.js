/* MWS Calendar Content Group V2
 * Explicit event.contentGroupId links separately named sessions. Never infer groups
 * from title, category, start time, repeat-series or participant names.
 * Consecutive dates join; gaps remain visibly separate, but retain group color.
 */
(function(root){
  'use strict';
  const DAY_MS=86400000;
  const BAND_HEIGHT=12;
  const BAND_GAP=3;
  let observer=null,frame=0;
  function utcDay(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const t=Date.parse(value+'T00:00:00Z');
    return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===value?t:null;
  }
  function safeColor(value){
    const color=String(value||'').trim();
    return /^#[0-9a-fA-F]{6}$/.test(color)||/^#[0-9a-fA-F]{3}$/.test(color)?color:'#0f8c95';
  }
  function groupsById(groups){
    const map=new Map();
    for(const group of Array.isArray(groups)?groups:[]){
      if(!group||!String(group.id||'').trim()||!String(group.name||'').trim())continue;
      map.set(String(group.id),{id:String(group.id),name:String(group.name).trim(),color:safeColor(group.color)});
    }
    return map;
  }
  function streaks(events,groups){
    const available=groupsById(groups),groupDates=new Map();
    for(const e of Array.isArray(events)?events:[]){
      const id=String(e?.contentGroupId||'');
      if(!id||!available.has(id)||e.restDay)continue;
      const day=utcDay(e.date);
      if(day===null)continue;
      if(!groupDates.has(id))groupDates.set(id,new Map());
      groupDates.get(id).set(e.date,day);
    }
    const result=[];
    for(const [id,dates] of groupDates){
      const group=available.get(id);
      const sorted=[...dates.entries()].sort((a,b)=>a[1]-b[1]);
      if(sorted.length<2)continue; // Single-member groups color only their event card.
      let segment=[];
      function flush(){
        if(!segment.length)return;
        result.push({key:id,title:group.name,color:group.color,
          start:segment[0][0],end:segment[segment.length-1][0],
          totalDays:segment.length,groupDays:sorted.length,
          dates:segment.map(x=>x[0])});
        segment=[];
      }
      for(const item of sorted){
        if(segment.length&&item[1]-segment[segment.length-1][1]!==DAY_MS)flush();
        segment.push(item);
      }
      flush();
    }
    return result.sort((a,b)=>a.start.localeCompare(b.start)||a.key.localeCompare(b.key));
  }
  function weekSegments(events,groups,cellDates,isCurrentMonth=()=>true){
    const all=streaks(events,groups);
    const positions=new Map(cellDates.map((date,i)=>[date,i]).filter(([date,i])=>date&&isCurrentMonth(i)));
    const weeks=Array.from({length:Math.ceil(cellDates.length/7)},()=>[]);
    for(const streak of all){
      const byWeek=new Map();
      for(const date of streak.dates){
        const index=positions.get(date);
        if(index===undefined)continue;
        const week=Math.floor(index/7);
        if(!byWeek.has(week))byWeek.set(week,[]);
        byWeek.get(week).push(index%7);
      }
      for(const [week,columns] of byWeek){
        columns.sort((a,b)=>a-b);
        let slice=[];
        const addSlice=()=>{
          if(!slice.length)return;
          const startCol=slice[0],endCol=slice[slice.length-1];
          weeks[week].push({...streak,week,startCol,endCol,lane:0,
            continuesBefore:cellDates[week*7+startCol]!==streak.start,
            continuesAfter:cellDates[week*7+endCol]!==streak.end});
          slice=[];
        };
        for(const col of columns){
          if(slice.length&&col!==slice[slice.length-1]+1)addSlice();
          slice.push(col);
        }
        addSlice();
      }
    }
    for(const segments of weeks){
      segments.sort((a,b)=>a.startCol-b.startCol||b.endCol-a.endCol||a.title.localeCompare(b.title,'ko'));
      const lanes=[];
      for(const segment of segments){
        let lane=lanes.findIndex(end=>end<segment.startCol);
        if(lane<0){lane=lanes.length;lanes.push(segment.endCol)}
        else lanes[lane]=segment.endCol;
        segment.lane=lane;
      }
    }
    return weeks;
  }
  function render(grid,events,groups){
    if(!grid||typeof document==='undefined')return;
    if(observer){observer.disconnect();observer=null}
    if(frame){cancelAnimationFrame(frame);frame=0}
    grid.querySelector('.calendar-continuous-overlay-v1')?.remove();
    grid.querySelectorAll('.calendar-continuous-spacer-v1').forEach(el=>el.remove());
    grid.classList.remove('calendar-has-continuous-series-v1');
    const cells=[...grid.querySelectorAll('.day[data-date]')];
    if(!cells.length)return;
    const dates=cells.map(el=>el.dataset.date);
    const weeks=weekSegments(events,groups,dates,i=>!cells[i].classList.contains('out'));
    if(!weeks.some(items=>items.length))return;
    grid.classList.add('calendar-has-continuous-series-v1');
    const layer=document.createElement('div');
    layer.className='calendar-continuous-overlay-v1';
    layer.setAttribute('aria-hidden','true');
    grid.appendChild(layer);
    for(let week=0;week<weeks.length;week++){
      const segments=weeks[week];
      if(!segments.length)continue;
      const lanes=segments.reduce((max,item)=>Math.max(max,item.lane+1),0);
      for(let col=0;col<7;col++){
        const cell=cells[week*7+col];
        if(!cell)continue;
        const spacer=document.createElement('div');
        spacer.className='calendar-continuous-spacer-v1';
        spacer.style.height=(lanes*(BAND_HEIGHT+BAND_GAP))+'px';
        cell.querySelector('.daynum')?.after(spacer);
      }
      for(const item of segments){
        const bar=document.createElement('div');
        bar.className='calendar-continuous-ribbon-v1';
        if(item.continuesBefore)bar.classList.add('continues-before');
        if(item.continuesAfter)bar.classList.add('continues-after');
        bar.style.setProperty('--series-color',item.color);
        bar.dataset.groupId=item.key;
        bar.dataset.seriesStart=item.start;
        bar.dataset.seriesEnd=item.end;
        // Only use a color strip; daily event titles are never hidden or replaced.
        bar.setAttribute('aria-hidden','true');
        layer.appendChild(bar);
        item.element=bar;
      }
    }
    function position(){
      for(let week=0;week<weeks.length;week++){
        for(const item of weeks[week]){
          const first=cells[week*7+item.startCol],last=cells[week*7+item.endCol];
          const spacer=first?.querySelector('.calendar-continuous-spacer-v1');
          if(!first||!last||!spacer)continue;
          const left=first.offsetLeft+7;
          const right=last.offsetLeft+last.offsetWidth-7;
          const top=first.offsetTop+spacer.offsetTop+item.lane*(BAND_HEIGHT+BAND_GAP)+2;
          item.element.style.left=left+'px';
          item.element.style.top=top+'px';
          item.element.style.width=Math.max(0,right-left)+'px';
        }
      }
    }
    position();
    if(typeof ResizeObserver==='function'){
      observer=new ResizeObserver(()=>{
        if(frame)return;
        frame=requestAnimationFrame(()=>{frame=0;position()});
      });
      observer.observe(grid);
      for(let week=0;week<weeks.length;week++)if(cells[week*7])observer.observe(cells[week*7]);
    }
  }
  root.mwsCalendarContinuousSeriesV1=Object.freeze({streaks,weekSegments,render,safeColor,groupsById});
})(typeof window!=='undefined'?window:globalThis);
