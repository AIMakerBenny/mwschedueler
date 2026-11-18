import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../assets/calendar-timeline-v1.js', import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../assets/calendar-continuous-series-v1.js',import.meta.url),'utf8'),context);
vm.runInContext(source,context);
const build=(events,today,groups,library)=>JSON.parse(JSON.stringify(context.mwsCalendarTimelineV1.buildDays(events,today,groups,library)));

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

test('registered images, manual library fallback, Steam fallback and safe invalid image handling',()=>{
  const date='2026-11-18';
  const days=build([
    {date,steamGame:{name:'Steam image',appid:'1',image:'https://example.test/icon.png'}},
    {date,steamGame:{name:'Steam fallback',appid:'2'}},
    {date,steamGame:{name:'Manual',source:'manual',id:'manual:1'}},
    {date,steamGame:{name:'Unusable image',image:'javascript:alert(1)'}}
  ],date,[],[{source:'manual',id:'manual:1',image:'https://example.test/manual.png'}]);
  assert.deepEqual(days.find(d=>d.today).icons,[
    {name:'Steam image',image:'https://example.test/icon.png'},
    {name:'Steam fallback',image:'https://cdn.cloudflare.steamstatic.com/steam/apps/2/header.jpg'},
    {name:'Manual',image:'https://example.test/manual.png'},
    {name:'Unusable image',image:''}
  ]);
});

test('shared explicit group ribbons continue across dates, preserve colors and separate gaps and overlapping groups',()=>{
  const groups=[{id:'wow',name:'WoW',color:'#123456'},{id:'other',name:'Other',color:'#abc'}];
  const events=[
    ...['2026-11-17','2026-11-18','2026-11-19','2026-11-21'].map(date=>({date,contentGroupId:'wow'})),
    ...['2026-11-18','2026-11-19'].map(date=>({date,contentGroupId:'other'})),
    {date:'2026-11-20',steamGame:{name:'WoW'}}
  ];
  const days=build(events,'2026-11-18',groups);
  const at=date=>days.find(d=>d.date===date).bands;
  assert.deepEqual(at('2026-11-17'),[{id:'wow',name:'WoW',color:'#123456',lane:0,before:false,after:true}]);
  assert.deepEqual(at('2026-11-18').map(b=>[b.id,b.lane,b.before,b.after]),[['wow',0,true,true],['other',1,false,true]]);
  assert.equal(at('2026-11-19')[0].after,false);
  assert.deepEqual(at('2026-11-20'),[]);
  assert.equal(at('2026-11-21')[0].before,false);
});
