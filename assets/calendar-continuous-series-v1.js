/* MWS Calendar continuous-title ribbon V1
 * Adds noninteractive visual bands above daily event cards. Does not mutate event records.
 * Default grouping: >=3 consecutive dates with exactly the same normalized title and category.
 */
(function(root){
  'use strict';
  const MIN_DAYS=3;
  const DAY_MS=86400000;
  const BAND_HEIGHT=20;
  const BAND_GAP=3;
  let observer=null;
  let animationFrame=0;

  function normalizedTitle(value){
    return String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('ko-KR');
  }
  function utcDay(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const t=Date.parse(value+'T00:00:00Z');
    return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===value?t:null;
  }
  function safeColor(raw){
    const s=String(raw||'').trim();
    return /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(s)?s:'#157d85';
  }
  function streaks(events,categories=[],minDays=MIN_DAYS){
    const colors=new Map((Array.isArray(categories)?categories:[]).map(c=>[String(c?.id||''),c?.color]));
    const groups=new Map();
    for(const event of Array.isArray(events)?events:[]){
      if(!event||event.restDay)continue;
      const day=utcDay(event.date),title=String(event.title||'').trim();
      if(day===null||!normalizedTitle(title))continue;
      const categoryId=String(event.categoryId||'');
      const key=normalizedTitle(title)+'\u0000'+categoryId;
      if(!groups.has(key))groups.set(key,new Map());
      const byDate=groups.get(key);
      // One cell per date, even when a title has multiple entries on the same day.
      if(!byDate.has(event.date)){
        byDate.set(event.date,{date:event.date,day,title,
          color:safeColor(event.color||colors.get(categoryId))});
      }
    }
    const out=[];
    for(const [key,byDate] of groups){
      const dates=[...byDate.values()].sort((a,b)=>a.day-b.day);
      let sequence=[];
      const commit=()=>{
        if(sequence.length>=minDays){
          out.push({key,title:sequence[0].title,color:sequence[0].color,
            start:sequence[0].date,end:sequence[sequence.length-1].date,
            totalDays:sequence.length,dates:sequence.map(x=>x.date)});
        }
        sequence=[];
      };
      for(const item of dates){
        if(sequence.length&&item.day-sequence[sequence.length-1].day!==DAY_MS)commit();
        sequence.push(item);
      }
      commit();
    }
    return out.sort((a,b)=>a.start.localeCompare(b.start)||b.totalDays-a.totalDays||a.key.localeCompare(b.key));
  }
  function weekSegments(events,categories,cellDates,isCurrentMonth=()=>true){
    const all=streaks(events,categories);
    const position=new Map(cellDates.map((d,i)=>[d,i]).filter(([d,i])=>d&&isCurrentMonth(i)));
    const weeks=Array.from({length:Math.ceil(cellDates.length/7)},()=>[]);
    for(const streak of all){
      const byWeek=new Map();
      for(const date of streak.dates){
        const idx=position.get(date);
        if(idx===undefined)continue;
        const week=Math.floor(idx/7),column=idx%7;
        if(!byWeek.has(week))byWeek.set(week,[]);
        byWeek.get(week).push(column);
      }
      for(const [week,cols] of byWeek){
        cols.sort((a,b)=>a-b);
        const startCol=cols[0],endCol=cols[cols.length-1];
        weeks[week].push({...streak,week,startCol,endCol,lane:0,
          continuesBefore:cellDates[week*7+startCol]!==streak.start,
          continuesAfter:cellDates[week*7+endCol]!==streak.end});
      }
    }
    for(const segments of weeks){
      segments.sort((a,b)=>a.startCol-b.startCol||b.endCol-a.endCol||a.title.localeCompare(b.title,'ko'));
      const lanes=[];
      for(const segment of segments){
        let lane=lanes.findIndex(maxEnd=>maxEnd<segment.startCol);
        if(lane<0){lane=lanes.length;lanes.push(segment.endCol)}
        else lanes[lane]=segment.endCol;
        segment.lane=lane;
      }
    }
    return weeks;
  }
  function render(grid,events,categories){
    if(!grid||typeof document==='undefined')return;
    if(observer){observer.disconnect();observer=null}
    if(animationFrame){cancelAnimationFrame(animationFrame);animationFrame=0}
    grid.querySelector('.calendar-continuous-overlay-v1')?.remove();
    grid.querySelectorAll('.calendar-continuous-spacer-v1').forEach(el=>el.remove());
    const cells=[...grid.querySelectorAll('.day[data-date]')];
    if(!cells.length)return;
    const dates=cells.map(cell=>cell.dataset.date);
    const weeks=weekSegments(events,categories,dates,i=>!cells[i].classList.contains('out'));
    if(!weeks.some(x=>x.length))return;
    grid.classList.add('calendar-has-continuous-series-v1');
    const layer=document.createElement('div');
    layer.className='calendar-continuous-overlay-v1';
    layer.setAttribute('aria-hidden','true');
    grid.appendChild(layer);
    for(let week=0;week<weeks.length;week++){
      const segments=weeks[week];if(!segments.length)continue;
      const laneCount=segments.reduce((max,s)=>Math.max(max,s.lane+1),0);
      for(let col=0;col<7;col++){
        const cell=cells[week*7+col];if(!cell)continue;
        const spacer=document.createElement('div');
        spacer.className='calendar-continuous-spacer-v1';
        spacer.style.height=(laneCount*(BAND_HEIGHT+BAND_GAP))+'px';
        cell.querySelector('.daynum')?.after(spacer);
      }
      for(const segment of segments){
        const bar=document.createElement('div');
        bar.className='calendar-continuous-ribbon-v1';
        if(segment.continuesBefore)bar.classList.add('continues-before');
        if(segment.continuesAfter)bar.classList.add('continues-after');
        bar.style.setProperty('--series-color',segment.color);
        const name=document.createElement('span');
        name.className='calendar-continuous-ribbon-label-v1';
        name.textContent=segment.title+' · '+segment.totalDays+'일 연속';
        bar.appendChild(name);
        bar.dataset.seriesStart=segment.start;
        bar.dataset.seriesEnd=segment.end;
        bar.dataset.seriesLane=String(segment.lane);
        layer.appendChild(bar);
        segment.element=bar;
      }
    }
    function position(){
      // offsetTop/offsetLeft are layout coordinates relative to the calendar grid.
      // This bridges the 6–7px gutters without altering the existing day-card grid.
      for(let week=0;week<weeks.length;week++){
        for(const item of weeks[week]){
          const first=cells[week*7+item.startCol],last=cells[week*7+item.endCol];
          const spacer=first?.querySelector('.calendar-continuous-spacer-v1');
          if(!first||!last||!spacer)continue;
          const left=first.offsetLeft+7;
          const right=last.offsetLeft+last.offsetWidth-7;
          const top=first.offsetTop+spacer.offsetTop+item.lane*(BAND_HEIGHT+BAND_GAP)+2;
          const bar=item.element;
          bar.style.left=left+'px';
          bar.style.top=top+'px';
          bar.style.width=Math.max(0,right-left)+'px';
        }
      }
    }
    position();
    if(typeof ResizeObserver==='function'){
      observer=new ResizeObserver(()=>{
        if(animationFrame)return;
        animationFrame=requestAnimationFrame(()=>{animationFrame=0;position()});
      });
      observer.observe(grid);
      for(let week=0;week<weeks.length;week++)if(cells[week*7])observer.observe(cells[week*7]);
    }
  }
  root.mwsCalendarContinuousSeriesV1=Object.freeze({streaks,weekSegments,render});
})(typeof window!=='undefined'?window:globalThis);
