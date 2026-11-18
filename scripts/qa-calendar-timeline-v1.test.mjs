import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../assets/calendar-timeline-v1.js', import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(source,context);
const build=(events,today)=>JSON.parse(JSON.stringify(context.mwsCalendarTimelineV1.buildDays(events,today)));

test('dates are uninterrupted across months, years and leap days',()=>{
  const days=build([{date:'2023-12-30',steamGame:{name:'Old'}},{date:'2024-04-05',steamGame:{name:'New'}}],'2024-03-01');
  const keys=days.map(d=>d.date);
  assert.equal(keys[0],'2023-12-02');
  assert.equal(keys.at(-1),'2024-04-05');
  for(let i=1;i<keys.length;i++)assert.equal(Date.parse(keys[i])-Date.parse(keys[i-1]),86400000);
  assert.ok(keys.includes('2024-02-29'));
  assert.equal(days.filter(d=>d.today).length,1);
});

test('only registered Steam and manual games, de-duplicated per day; no source mutation',()=>{
  const events=[
    {date:'2026-11-18',steamGame:{appid:'123',name:'Game A'},title:'Ignored title'},
    {date:'2026-11-18',steamGame:{appid:'123',name:' game a '}},
    {date:'2026-11-18',steamGame:{source:'manual',id:'manual:1',name:'와우 포에버'}},
    {date:'2026-11-18',title:'Not linked'},
    {date:'2026-11-18',restDay:true,steamGame:{name:'Rest'}},
    {date:'2026-11-17',steamGame:{name:'Game A'}},
    {date:'2026-11-19',title:'No game'},
    {date:'2026-02-30',steamGame:{name:'Invalid date'}}
  ];
  const before=JSON.stringify(events);
  const days=build(events,'2026-11-18');
  assert.deepEqual(days.find(d=>d.today).games,['Game A','와우 포에버']);
  assert.deepEqual(days.find(d=>d.date==='2026-11-17').games,['Game A']);
  assert.deepEqual(days.find(d=>d.date==='2026-11-19').games,[]);
  assert.ok(!days.some(d=>d.date==='2026-02-30'));
  assert.equal(JSON.stringify(events),before);
});

test('empty dates and invalid today are safe',()=>{
  assert.equal(build([],'2026-11-18').length,121);
  assert.deepEqual(build([],'invalid'),[]);
});
