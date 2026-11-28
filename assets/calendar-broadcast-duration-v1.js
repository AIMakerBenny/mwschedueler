/* MWS calendar broadcast duration V1. Pure local wall-clock difference in minutes.
 * Event schema stores one date plus HH:mm start/end, without end date.
 * An earlier end clock is treated as next day; equal clocks are ambiguous.
 */
(function(root){
  'use strict';
  const clockPattern=/^([01][0-9]|2[0-3]):([0-5][0-9])$/;
  function clockMinutes(value){
    if(typeof value!=='string')return null;
    const match=clockPattern.exec(value.trim());
    if(!match)return null;
    return Number(match[1])*60+Number(match[2]);
  }
  function minutes(start,end){
    const a=clockMinutes(start),b=clockMinutes(end);
    if(a===null||b===null||a===b)return null;
    return b>a?b-a:(24*60-a+b);
  }
  function label(start,end){
    const value=minutes(start,end);
    if(value===null)return '';
    return '총 '+Math.floor(value/60)+'시간 '+value%60+'분';
  }
  const duration=Object.freeze({minutes,label});
  root.mwsCalendarBroadcastDurationV1=duration;
})(typeof window!=='undefined'?window:globalThis);

/* Read-only dashboard aggregation reuses the calendar's exact time semantics.
   Past Korean calendar dates only. Each duration is attributed to its start
   date; overlapping schedule entries are summed, not measured airtime. */
(function(root){
  'use strict';
  const dayMs=86400000;
  function dayNumber(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const n=Date.parse(value+'T00:00:00Z');
    return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value?n:null;
  }
  function summarize(events,today,range){
    const end=dayNumber(today);
    if(end===null||![7,14,30].includes(range))return null;
    const days=Array.from({length:range},(_,i)=>({date:new Date(end-(range-i)*dayMs).toISOString().slice(0,10),count:0,minutes:0,unknown:0}));
    const lookup=new Map(days.map(d=>[d.date,d]));
    for(const event of Array.isArray(events)?events:[]){
      const day=lookup.get(event?.date);
      if(!day||event.restDay||String(event.title||'').trim()==='휴방'||String(event.device||'').trim()==='비방')continue;
      day.count++;
      const minutes=root.mwsCalendarBroadcastDurationV1.minutes(event.start,event.end);
      if(minutes===null)day.unknown++;
      else day.minutes+=minutes;
    }
    return {days,count:days.reduce((n,d)=>n+d.count,0),minutes:days.reduce((n,d)=>n+d.minutes,0),unknown:days.reduce((n,d)=>n+d.unknown,0),activeDays:days.filter(d=>d.count>0).length};
  }
  root.mwsDashboardScheduleStatsV1=Object.freeze({summarize});
})(typeof window!=='undefined'?window:globalThis);

/* Agenda time distribution. All known non-rest schedule entries, including
   off-stream entries, are counted as scheduled time, not measured airtime.
   Overlaps are summed; overnight segments are clipped to the start day. */
(function(root){
  'use strict';
  const clock=value=>{
    const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value||'').trim());
    return m?Number(m[1])*60+Number(m[2]):null;
  };
  function summarize(events){
    const entries=[],items=Array.isArray(events)?events:[];
    let minutes=0,unknown=0,overnight=0,rest=0;
    for(const e of items){
      if(!e)continue;
      if(e.restDay){rest++;continue}
      const start=clock(e.start),duration=root.mwsCalendarBroadcastDurationV1.minutes(e.start,e.end);
      if(start===null||duration===null){unknown++;continue}
      const end=start+duration,spill=Math.max(0,end-1440);
      entries.push({id:String(e.id),start,end:Math.min(1440,end),duration,spill});
      minutes+=duration;if(spill)overnight++;
    }
    return {entries,minutes,unknown,overnight,rest,count:entries.length+unknown};
  }
  root.mwsCalendarAgendaTimeV1=Object.freeze({summarize});
})(typeof window!=='undefined'?window:globalThis);
