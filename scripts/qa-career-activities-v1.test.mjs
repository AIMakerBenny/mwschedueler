import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx=vm.createContext({window:{},document:{getElementById:()=>null}});
vm.runInContext(read('assets/career-activities-data-v1.js'),ctx);
vm.runInContext(read('assets/career-activities-v1.js'),ctx);
const archive=ctx.window.mwsCareerActivitiesDataV1,api=ctx.window.mwsCareerActivitiesV1;
test('historical sources, dates and categories are explicit and cover 2020-2026',()=>{
  assert(archive.length>=165);
  assert.equal(new Set(archive.map(r=>`${r.date}|${r.title}`)).size,archive.length);
  for(const r of archive){assert.match(r.date,/^20\d\d-\d\d(?:-\d\d)?$/);assert(r.title&&r.context&&r.source&&api.kinds[r.kind]);assert(!r.url||r.url.startsWith('https://'));assert(!r.end||r.end>=r.date);assert(!/마카오톡|수상|금메달|구독자/.test(r.title));}
  for(let y=2020;y<=2026;y++)assert(archive.some(r=>r.date.startsWith(String(y))));
  assert(archive.some(r=>r.basis==='publication'&&r.url.includes('youtube.com')));
  assert(archive.some(r=>r.kind==='server'&&r.end));
});
test('calendar records are read only, past-only, deduplicated and distinctly labelled',()=>{
  const events=[{id:'1',date:'2026-11-01',title:'합방 A'},{id:'2',date:'2026-11-01',title:'합방 A'},{id:'same',date:'2026-03-28',title:'파블로프 VR 대전쟁'},{id:'future',date:'2026-12-01',title:'미래'},{id:'today',date:'2026-11-22',title:'오늘'},{id:'rest',date:'2026-11-01',title:'휴방',restDay:true},{id:'bad',date:'2026-02-30',title:'오류'},{id:'cancel',date:'2026-11-01',title:'취소 일정',cancelled:true},{id:'excluded',date:'2024-09-10',title:'마카오톡'}];
  const before=JSON.stringify(events),rows=api.build(archive,events,'2026-11-22'),calendar=rows.filter(r=>r.origin==='calendar');
  assert.equal(calendar.length,1);assert.equal(calendar[0].id,'1');assert.equal(calendar[0].basis,'calendar');assert.equal(JSON.stringify(events),before);
  assert.equal(rows.length,archive.length+1);assert.equal(rows[0].date,'2026-11-01');
  assert(api.filter(rows,{query:'금마 놀이터',kind:'server'}).length===2);
  assert.equal(api.filter(rows,{year:'2020',source:'archive'}).length,2);
  assert.equal(api.filter(rows,{source:'calendar'}).length,1);
});
