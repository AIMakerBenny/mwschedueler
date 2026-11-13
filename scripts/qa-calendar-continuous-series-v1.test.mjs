import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const engineSource=read('assets/calendar-continuous-series-v1.js');
const core=read('assets/app-core.js'),html=read('index.html');
const managerSource=read('assets/calendar-content-groups-v2.js');
const groups=[{id:'sbo',name:'SBO',color:'#7659a5'},
  {id:'wow',name:'와우 포에버',color:'#0f8c95'}];
const env={};vm.runInNewContext(engineSource,env);
const calc=env.mwsCalendarContinuousSeriesV1;
const e=(date,title,contentGroupId='',more={})=>({date,title,contentGroupId,restDay:false,categoryId:'stream',start:'15:00',end:'18:00',...more});
const dates=Array.from({length:42},(_,i)=>new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10));

test('same content group links different titles, start times and categories',()=>{
  const events=[
    e('2026-10-13','SBO 연습','sbo',{start:'15:00'}),
    e('2026-10-14','SBO 연습경기','sbo',{start:'20:00',categoryId:'other'}),
    e('2026-10-15','보성동 SBO 경기','sbo',{start:'09:30'}),
    e('2026-10-14','다른 방송','')
  ];
  const runs=calc.streaks(events,groups);
  assert.equal(runs.length,1);assert.equal(runs[0].totalDays,3);
  assert.equal(runs[0].title,'SBO');assert.equal(runs[0].color,'#7659a5');
});
test('never infer a content group from matching title or category',()=>{
  const events=[
    e('2026-10-13','SBO 연습'),
    e('2026-10-14','SBO 연습'),
    e('2026-10-15','SBO 연습')
  ];
  assert.equal(calc.streaks(events,groups).length,0);
  assert.equal(calc.streaks(events.map(x=>({...x,contentGroupId:'unknown'})),groups).length,0);
});
test('nonconsecutive SBO sessions keep group color, but never draw across gaps',()=>{
  const events=[
    e('2026-10-01','SBO 야구연습','sbo'),
    e('2026-10-07','보성동','sbo'),
    e('2026-10-13','SBO 연습과 모임','sbo'),
    e('2026-10-14','SBO 야구','sbo'),
    e('2026-10-15','경기','sbo'),
    e('2026-10-16','연습경기','sbo')
  ];
  const runs=calc.streaks(events,groups);
  assert.equal(runs.length,3);
  assert.deepEqual(Array.from(runs.map(r=>r.totalDays)),[1,1,4]);
  assert(runs.every(r=>r.color==='#7659a5'));
});
test('mixed content on the same date is not grouped, and duplicate group entries count once',()=>{
  const events=[
    e('2026-10-13','SBO A','sbo'),e('2026-10-13','SBO B','sbo'),
    e('2026-10-14','SBO C','sbo'),
    e('2026-10-13','다른 게임','wow'),
    e('2026-10-14','다른 게임 2','')
  ];
  const runs=calc.streaks(events,groups);
  assert.equal(runs.length,1);
  assert.equal(runs[0].totalDays,2);
  assert.equal(runs[0].key,'sbo');
});
test('rest day, invalid date, deleted group and a single assigned event are ignored',()=>{
  assert.equal(calc.streaks([e('2026-10-13','SBO','sbo')],groups).length,0);
  assert.equal(calc.streaks([e('2026-10-13','SBO','sbo',{restDay:true}),e('2026-10-14','SBO','sbo')],groups).length,0);
  assert.equal(calc.streaks([e('2026-10-32','invalid','sbo'),e('2026-10-14','SBO','sbo')],groups).length,0);
  assert.equal(calc.streaks([e('2026-10-13','SBO','sbo'),e('2026-10-14','SBO','sbo')],[]).length,0);
});
test('week boundaries split the visible bar into separate segments',()=>{
  const series=['01','02','03','04','05','06','07','08','09','10'].map(day=>e('2026-10-'+day,'SBO '+day,'sbo'));
  const weeks=calc.weekSegments(series,groups,dates,()=>true);
  assert.equal(weeks[0].length,1);
  assert.equal(weeks[1].length,1);
  assert.equal(weeks[0][0].continuesAfter,true);
  assert.equal(weeks[1][0].continuesBefore,true);
});
test('overlapping group ribbons use separate lanes',()=>{
  const series=['13','14','15'].flatMap(day=>[
    e('2026-10-'+day,'SBO '+day,'sbo'),
    e('2026-10-'+day,'와우 포에버 '+day,'wow')]);
  const weeks=calc.weekSegments(series,groups,dates,()=>true);
  const active=weeks.find(w=>w.length===2);
  assert(active);
  assert.deepEqual(Array.from(active.map(x=>x.lane)).sort(),[0,1]);
});
test('content group manager persists explicit groups without modifying existing event fields',()=>{
  const state={events:[e('2026-10-13','SBO 야구연습','',{id:'e1'})],contentGroups:[]};
  const fakeWindow={mwsCalendarContinuousSeriesV1:calc,addEventListener(){}};
  const context={data:state,window:fakeWindow,document:{getElementById:()=>null},toast(){},
    crypto:{randomUUID:()=> 'some-uuid'}};
  vm.runInNewContext(managerSource,context);
  const g=fakeWindow.mwsCalendarContentGroupsV2.newGroup('SBO','#7659a5');
  assert.equal(g.id,'some-uuid');assert.equal(state.contentGroups.length,1);
  assert.equal(state.events[0].start,'15:00');
  assert.equal(state.events[0].title,'SBO 야구연습');
  assert.equal(fakeWindow.mwsCalendarContentGroupsV2.newGroup('SBO','#7659a5'),null);
});
test('UI integrates explicit group selection, groups survive saves, hover uses pointer delegation',()=>{
  assert(html.includes('id="calendarGroupToggleV2"'));
  assert(html.includes('id="calendarGroupApplyV2"'));
  assert(html.includes('id="calendarGroupCreateV2"'));
  assert(html.includes('id="evContentGroupV2"'));
  assert(html.includes('assets/calendar-content-groups-v2.js?v=7-save-contract-bulk'));
  assert(html.indexOf('assets/app-core.js')<html.indexOf('assets/calendar-content-groups-v2.js'));
  assert(core.includes("contentGroupId:document.getElementById('evContentGroupV2')?.value||''"));
  assert(core.includes('window.mwsCalendarContentGroupsV2?.syncEditor(e)'));
  assert(core.includes('window.mwsCalendarContentGroupsV2?.selectEvent(id)'));
  assert(core.includes('window.mwsCalendarContinuousSeriesV1?.render(grid,activeEvents(),data.contentGroups)'));
  assert(core.includes('grid.onpointermove=pointerPreview;'));
  assert(core.includes('grid.onpointerover=pointerPreview;'));
  assert(core.includes('if(lastCalendarPreviewPointerV2)'));
  assert(core.includes('data.contentGroups=data.contentGroups.filter'));
});
