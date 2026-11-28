import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const file=path=>readFileSync(new URL(path,root),'utf8');
const calculatorFile=file('assets/calendar-broadcast-duration-v1.js');
const core=file('assets/app-core.js');
const html=file('index.html');
const styles=file('assets/calendar-broadcast-duration-v1.css');
const sandbox={};
vm.runInNewContext(calculatorFile,sandbox);
const duration=sandbox.mwsCalendarBroadcastDurationV1;

test('duration uses exact saved HH:mm values: reference screenshot is 3h14',()=>{
  assert.equal(duration.minutes('09:22','12:36'),194);
  assert.equal(duration.label('09:22','12:36'),'총 3시간 14분');
});
test('duration handles overnight within one following day',()=>{
  assert.equal(duration.minutes('22:15','01:45'),210);
  assert.equal(duration.label('22:15','01:45'),'총 3시간 30분');
  assert.equal(duration.label('23:59','00:01'),'총 0시간 2분');
});
test('duration retains minutes and hour boundaries',()=>{
  assert.equal(duration.label('09:30','10:30'),'총 1시간 0분');
  assert.equal(duration.label('09:30','09:31'),'총 0시간 1분');
  assert.equal(duration.label('00:00','23:59'),'총 23시간 59분');
});
test('missing, TBD, malformed, equal clocks do not yield a guessed duration',()=>{
  for(const value of ['',null,undefined,'TBD','25:00','12:60','9:00','12:12:55','00:00Z','7']){
    assert.equal(duration.minutes(value,'10:00'),null,'invalid start '+value);
    assert.equal(duration.minutes('10:00',value),null,'invalid end '+value);
    assert.equal(duration.label(value,'10:00'),'');
  }
  assert.equal(duration.minutes('10:00','10:00'),null);
  assert.equal(duration.label('10:00','10:00'),'');
});
test('calendar hover actual template shows broadcast duration by the time, not on rest day',()=>{
  const start=core.indexOf('function calendarPreviewHTML(e){');
  const end=core.indexOf('\nfunction positionCalendarEventPreview(',start);
  assert(start>=0&&end>start);
  const section=core.slice(start,end);
  const context={
    window:{mwsCalendarBroadcastDurationV1:duration},
    data:{contentGroups:[]},
    category:()=>null,
    deviceChip:()=>'<span>PC</span>',
    esc:value=>String(value),
    formatDateWeekday:date=>date,
    formatTimeKorean:time=>time,
    eventParticipantRows:()=>[]
  };
  vm.runInNewContext(section,context);
  const event={title:'와우 포에버',restDay:false,start:'09:22',end:'12:36',date:'2026-11-08',participants:[]};
  const visible=context.calendarPreviewHTML(event);
  assert.match(visible,/09:22 - 12:36/);
  assert.match(visible,/calendar-preview-broadcast-duration-v1/);
  assert.match(visible,/총 3시간 14분/);
  assert(visible.indexOf('12:36')<visible.indexOf('총 3시간 14분'),'duration follows time in hover');
  assert(!context.calendarPreviewHTML({...event,end:'TBD'}).includes('총 '));
  assert(!context.calendarPreviewHTML({...event,restDay:true}).includes('총 '));
  const detail=e=>context.calendarPreviewHTML(e,{detail:true});
  assert.match(detail(event),/09:22.*12:36/);
  assert.match(detail(event),/총 3시간 14분/);
  assert.match(detail({...event,start:'23:00',end:'01:00'}),/다음 날 종료/);
  assert.match(detail({...event,start:'23:00',end:'01:00'}),/총 2시간 0분/);
  assert.match(detail({...event,start:'TBD',end:'TBD'}),/시간 미정/);
  assert.match(detail({...event,end:'TBD'}),/종료 시간 미정/);
  assert.match(detail({...event,end:event.start}),/시간 합계 미확정/);
  assert.match(detail({...event,restDay:true}),/하루 종일/);
  assert(!detail({...event,restDay:true}).includes('총 '));
});
test('editor preview updates from event time fields without changing saved event data',()=>{
  const start=core.indexOf('function updateEventBroadcastDurationPreviewV1(){');
  const end=core.indexOf('\nwindow.updateEventBroadcastDurationPreviewV1=',start);
  assert(start>=0&&end>start);
  const section=core.slice(start,end);
  const target={textContent:'',dataset:{}};
  const startField={value:'09:22'},endField={value:'12:36'};
  const document={getElementById:id=>({
    evBroadcastDurationValueV1:target,evStart:startField,evEnd:endField
  })[id]||null};
  const context={window:{mwsCalendarBroadcastDurationV1:duration},document};
  vm.runInNewContext(section,context);
  context.updateEventBroadcastDurationPreviewV1();
  assert.equal(target.textContent,'총 3시간 14분');
  assert.equal(target.dataset.available,'true');
  endField.value='01:00';
  context.updateEventBroadcastDurationPreviewV1();
  assert.equal(target.textContent,'총 15시간 38분');
  endField.value='TBD';
  context.updateEventBroadcastDurationPreviewV1();
  assert.equal(target.dataset.available,'false');
  assert(!target.textContent.includes('시간 38분'));
});
test('all editor time-entry paths refresh the computed duration',()=>{
  for(const anchor of [
    "if(target==='evStart'||target==='evEnd')updateEventBroadcastDurationPreviewV1();",
    'window.updateEventBroadcastDurationPreviewV1=updateEventBroadcastDurationPreviewV1',
    'if(startText)startText.textContent=formatTimeKorean(parsed.time);\n  updateEventBroadcastDurationPreviewV1();',
    'if(endText)endText.textContent=formatTimeKorean(parsed.time);\n  updateEventBroadcastDurationPreviewV1();'
  ])assert(core.includes(anchor),'missing listener: '+anchor);
  assert.equal(core.split("if(target==='evStart'||target==='evEnd')updateEventBroadcastDurationPreviewV1();").length-1,2);
  assert(/function openEvent\([\s\S]*?updateEventBroadcastDurationPreviewV1\(\)/.test(core));
});
test('production HTML loads calculator before app core and includes editor preview',()=>{
  assert(html.includes('assets/calendar-broadcast-duration-v1.css?v=1'));
  assert(html.includes('assets/calendar-broadcast-duration-v1.js?v=1'));
  assert(html.indexOf('assets/calendar-broadcast-duration-v1.js')<html.indexOf('assets/app-core.js'));
  assert(html.includes('id="evBroadcastDurationValueV1"'));
  assert(html.includes('총 방송 시간'));
  assert(styles.includes('.calendar-preview-broadcast-duration-v1'));
  assert(styles.includes('.event-broadcast-duration-output-v1'));
});

test('dashboard statistics use only past registered dates, exact clock durations and no mutations',()=>{
  const stats=sandbox.mwsDashboardScheduleStatsV1;
  const rows=[
    {date:'2026-11-21',start:'23:00',end:'01:00',device:'VR'},
    {date:'2026-11-21',start:'10:00',end:'12:00',device:'PC'},
    {date:'2026-11-22',start:'09:00',end:'TBD'},
    {date:'2026-11-23',start:'09:00',end:'09:00'},
    {date:'2026-11-23',start:'10:00',end:'11:00',device:'비방'},
    {date:'2026-11-24',restDay:true,start:'09:00',end:'12:00'},
    {date:'2026-11-25',title:'휴방',start:'09:00',end:'12:00'},
    {date:'2026-11-28',start:'08:00',end:'12:00'},
    {date:'2026-11-29',start:'08:00',end:'12:00'},
    {date:'2026-11-20',start:'08:00',end:'12:00'},
    {date:'2026-02-30',start:'08:00',end:'12:00'}
  ];
  const original=JSON.stringify(rows);
  const result=stats.summarize(rows,'2026-11-28',7);
  assert.equal(result.days.length,7);
  assert.equal(result.days[0].date,'2026-11-21');
  assert.equal(result.days.at(-1).date,'2026-11-27');
  assert.equal(result.count,4);assert.equal(result.minutes,240);assert.equal(result.unknown,2);assert.equal(result.activeDays,3);
  assert.equal(result.days[0].minutes,240);assert.equal(result.days[0].count,2);
  assert.equal(result.days[1].unknown,1);assert.equal(result.days[2].unknown,1);
  assert.equal(stats.summarize(rows,'2026-11-28',14).count,5);
  assert.equal(stats.summarize(rows,'2026-11-28',30).minutes,480);
  assert.equal(JSON.stringify(rows),original);
});
test('dashboard history supports calendar boundaries and distinguishes missing data',()=>{
  const stats=sandbox.mwsDashboardScheduleStatsV1;
  const empty=stats.summarize([],'2026-01-01',7);
  assert.equal(empty.days[0].date,'2025-12-25');
  assert.equal(empty.days.at(-1).date,'2025-12-31');
  assert.equal(empty.count,0);assert.equal(empty.minutes,0);assert.equal(empty.unknown,0);
  assert.equal(stats.summarize([],'2026-02-30',7),null);
  assert.equal(stats.summarize([],'2026-11-28',90),null);
  assert.equal(stats.summarize([{date:'2026-02-29',start:'10:00',end:'11:00'}],'2026-03-01',7).count,0);
  assert.equal(stats.summarize([{date:'2024-02-29',start:'10:00',end:'11:00'}],'2024-03-01',7).minutes,60);
});

test('agenda schedule time distinguishes overnight, overlapping, off-stream, unknown and rest entries',()=>{
  const model=sandbox.mwsCalendarAgendaTimeV1;
  const items=[
    {id:'a',start:'12:00',end:'16:00'},
    {id:'b',start:'15:00',end:'17:00',device:'비방'},
    {id:'c',start:'23:00',end:'01:00'},
    {id:'d',start:'09:00',end:'TBD'},
    {id:'e',start:'09:00',end:'09:00'},
    {id:'f',restDay:true,start:'10:00',end:'12:00'}
  ];
  const original=JSON.stringify(items),r=model.summarize(items);
  assert.equal(r.count,5);assert.equal(r.minutes,480);assert.equal(r.unknown,2);assert.equal(r.overnight,1);assert.equal(r.rest,1);
  assert.deepEqual(JSON.parse(JSON.stringify(r.entries)),[
    {id:'a',start:720,end:960,duration:240,spill:0},
    {id:'b',start:900,end:1020,duration:120,spill:0},
    {id:'c',start:1380,end:1440,duration:120,spill:60}
  ]);
  assert.equal(JSON.stringify(items),original);
  assert.equal(model.summarize([]).count,0);
});
