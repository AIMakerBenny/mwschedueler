import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const fromRoot=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=fromRoot('assets/calendar-continuous-series-v1.js');
const css=fromRoot('assets/calendar-continuous-series-v1.css');
const html=fromRoot('index.html');
const core=fromRoot('assets/app-core.js');
const env={};
vm.runInNewContext(js,env);
const engine=env.mwsCalendarContinuousSeriesV1;
const event=(date,title='와우 포에버',extra={})=>({
  date,title,categoryId:'gaming',color:'#08b4ba',restDay:false,...extra
});
const series=dates=>dates.map(x=>event('2026-11-'+x));
const monthDates=Array.from({length:42},(_,i)=>new Date(Date.UTC(2026,10,1+i)).toISOString().slice(0,10));

test('5-12 November daily WoW Forever gives one eight-day ribbon',()=>{
  const events=series(['05','06','07','08','09','10','11','12']);
  const result=engine.streaks(events);
  assert.equal(result.length,1);
  assert.equal(result[0].title,'와우 포에버');
  assert.equal(result[0].start,'2026-11-05');
  assert.equal(result[0].end,'2026-11-12');
  assert.equal(result[0].totalDays,8);
  assert.equal(result[0].color,'#08b4ba');
});
test('spans week boundary as joined 5-7 and 8-12 segments',()=>{
  const days=series(['05','06','07','08','09','10','11','12']);
  const weeks=engine.weekSegments(days,[],monthDates,()=>true);
  const a=weeks[0][0],b=weeks[1][0];
  assert.equal(a.startCol,4);
  assert.equal(a.endCol,6);
  assert.equal(a.totalDays,8);
  assert.equal(a.continuesBefore,false);
  assert.equal(a.continuesAfter,true);
  assert.equal(b.startCol,0);
  assert.equal(b.endCol,4);
  assert.equal(b.continuesBefore,true);
  assert.equal(b.continuesAfter,false);
});
test('missing days, rest days, two-day stretches and unrelated titles are not joined',()=>{
  const days=[...series(['05','06','07','09','10','11']),
    event('2026-11-08','휴방',{restDay:true}),
    event('2026-11-12','다른 게임')];
  const found=engine.streaks(days);
  assert.equal(found.length,2);
  assert.equal(found[0].totalDays,3);
  assert.equal(found[1].totalDays,3);
  assert.equal(found[0].end,'2026-11-07');
  assert.equal(found[1].start,'2026-11-09');
  assert.equal(engine.streaks(series(['05','06'])).length,0);
});
test('same-day duplicate events count only once',()=>{
  const found=engine.streaks([...series(['05','06','07']),event('2026-11-07')]);
  assert.equal(found.length,1);
  assert.equal(found[0].totalDays,3);
});
test('same title on unrelated categories is kept separate',()=>{
  const a=series(['05','06','07']);
  const b=series(['06','07','08']).map(x=>({...x,categoryId:'special',color:'#a36aff'}));
  const out=engine.streaks([...a,...b]);
  assert.equal(out.length,2);
  assert(out.some(x=>x.start==='2026-11-05'));
  assert(out.some(x=>x.start==='2026-11-06'));
});
test('different spaces and casing normalize within the same series, never use raw HTML',()=>{
  const r=engine.streaks([
    event('2026-11-05','  와우   포에버 '),
    event('2026-11-06','와우 포에버'),
    event('2026-11-07','와우 포에버')
  ]);
  assert.equal(r.length,1);
  assert.equal(r[0].title,'와우   포에버');
  assert.equal(engine.streaks([event('2026-11-31','bad')]).length,0);
});
test('month boundary visible dates only and only 1 in-month segment',()=>{
  const d=['2026-10-30','2026-10-31','2026-11-01'].map(x=>event(x));
  const weeks=engine.weekSegments(d,[],monthDates,i=>monthDates[i].startsWith('2026-11-'));
  assert.equal(weeks[0].length,1);
  assert.equal(weeks[0][0].startCol,0);
  assert.equal(weeks[0][0].continuesBefore,true);
});
test('overlapping series occupy distinct ribbon lanes without hiding underlying events',()=>{
  const a=series(['05','06','07']);
  const b=['05','06','07'].map(day=>event('2026-11-'+day,'친구 합방',{categoryId:'other',color:'#7b61a9'}));
  const weeks=engine.weekSegments([...a,...b],[],monthDates,()=>true);
  assert.deepEqual([...weeks[0]].map(s=>s.lane).sort(),[0,1]);
});
test('UI assets are loaded and calendar hook does not replace daily cards',()=>{
  assert(html.includes('assets/calendar-continuous-series-v1.js?v=1'));
  assert(html.includes('assets/calendar-continuous-series-v1.css?v=1'));
  assert(html.indexOf('assets/calendar-continuous-series-v1.js')<html.indexOf('assets/app-core.js'));
  assert(core.includes('window.mwsCalendarContinuousSeriesV1?.render(grid,activeEvents(),data.categories);'));
  assert(core.includes("grid.querySelectorAll('.mini-event')"));
  assert(css.includes('pointer-events:none'));
  assert(css.includes('.calendar-continuous-ribbon-v1'));
});
