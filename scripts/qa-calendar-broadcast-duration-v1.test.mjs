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
