import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const core=readFileSync(new URL('../assets/app-core.js',import.meta.url),'utf8');
const slice=(a,b)=>core.slice(core.indexOf(a),core.indexOf(b,core.indexOf(a)));
const time=s=>Date.parse(s+'+09:00');
const events=[
  {id:'yesterday-overnight',date:'2026-11-20',start:'23:00',end:'17:00'},
  {id:'finished',date:'2026-11-21',start:'08:00',end:'09:00'},
  {id:'running',date:'2026-11-21',start:'10:00',end:'18:00'},
  {id:'no-end',date:'2026-11-21',start:'11:00',end:'TBD'},
  {id:'exact',date:'2026-11-21',start:'12:00',end:'13:00'},
  {id:'next',date:'2026-11-21',start:'13:00'},
  {id:'same-day-late',date:'2026-11-21',start:'23:59'},
  {id:'tbd-today',date:'2026-11-21',start:'TBD'},
  {id:'tomorrow',date:'2026-11-22',start:'00:00'},
  {id:'rest',date:'2026-11-22',restDay:true},
  {id:'tbd-tomorrow',date:'2026-11-22',start:'TBD'},
];
function setup(initial){
  let now=initial,renderCount=0,active=true,hidden=false;
  class FakeDate extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
  const nodes=new Map();
  const document={get hidden(){return hidden},getElementById(id){if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',dataset:{},style:{},classList:{contains:()=>active,remove(){}},setAttribute(key,value){if(key==='data-upcoming-count')this.dataset.upcomingCount=String(value)}});return nodes.get(id)},querySelectorAll(){return []}};
  const ctx=vm.createContext({Date:FakeDate,Intl,data:{events,contacts:[]},document,window:{},console,
    safeRenderView(_name,fn){renderCount++;return fn()},dashboardMode:'overview',renderReminders(){},
    formatTimeKorean:x=>x,shortDateWeekday:x=>x,dashboardUpcomingCardHTML:e=>e.id,
    dashboardDetailHTML:e=>e?.id||'none',openEvent(){}});
  vm.runInContext(slice('function todayKST(', '\nfunction formatDate(')+slice('function activeEvents()', '\nfunction checklistProgress(')+slice('const clockTimeFormatterV133=', '\nfunction scheduleClockV133(')+`let dashboardPinnedEventId=null,dashboardHoverEventId=null;`+slice('function dashboardDefaultEvent()', '\nfunction dashboardDetailHTML(')+slice('function renderDashboardDetail(', "\ndocument.getElementById('dashboard').addEventListener"),ctx);
  const run=code=>vm.runInContext(code,ctx);
  return {run,nodes,advance(t){now=t},get renders(){return renderCount},hide(v){hidden=v},active(v){active=v}};
}
test('only future starts remain; unknown time stays visible and KST is authoritative',()=>{
  const x=setup(time('2026-11-21T12:00:00'));
  assert.deepEqual(Array.from(x.run('upcomingEvents().map(e=>e.id)')),['next','same-day-late','tbd-today','tomorrow','tbd-tomorrow']);
  assert.equal(x.run('dashboardDefaultEvent().id'),'next');
  assert.equal(x.run('activeEvents().length'),events.length);
  assert.equal(x.run('upcomingRefreshBoundaryV1(upcomingEvents(),Date.now())'),time('2026-11-21T13:00:00'));
  x.run('renderDashboard();renderDashboardDetail("running")');
  assert.equal(x.nodes.get('nextStreamCard').innerHTML,'next');
  assert(!x.nodes.get('upcomingDashboard').innerHTML.includes('running'));
  assert.equal(x.nodes.get('dashboard').dataset.upcomingCount,String(x.run('upcomingEventsAtV1(Date.now()).length')));
});
test('open dashboard updates at start boundary, clears stale pin, never renders each second',()=>{
  const x=setup(time('2026-11-21T12:59:58'));
  x.run('renderDashboard();window.dashboardPinEvent("next")');
  x.advance(time('2026-11-21T12:59:59'));x.run('tickClock()');assert.equal(x.renders,0);
  x.advance(time('2026-11-21T13:00:00'));x.run('tickClock()');assert.equal(x.renders,1);
  assert.equal(x.run('dashboardPinnedEventId'),null);assert.equal(x.nodes.get('nextStreamCard').innerHTML,'same-day-late');
  x.run('tickClock()');assert.equal(x.renders,1);
  x.hide(true);x.advance(time('2026-11-22T00:00:00'));x.run('tickClock()');assert.equal(x.renders,1);
  x.hide(false);x.run('tickClock()');assert.equal(x.renders,2);
  assert.equal(x.nodes.get('nextStreamCard').innerHTML,'tbd-tomorrow');
  x.advance(time('2026-11-24T12:00:00'));x.run('renderDashboard()');
  assert.equal(x.nodes.get('dashboard').dataset.upcomingCount,'0');
});
