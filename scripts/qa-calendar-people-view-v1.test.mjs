import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const context={window:{},document:{getElementById:()=>null}};
vm.runInNewContext(read('assets/calendar-people-view-v1.js'),context);
vm.runInNewContext(read('assets/contact-frequency-v1.js'),context);
const {build,matchesName}=context.window.mwsCalendarPeopleViewV1;
const {model}=context.window.mwsContactFrequencyV1;
const source={selfContactId:'self',contacts:[{id:'self',name:'마왕'},{id:'p',name:'가나다'},{id:'q',name:'라마바'}],todayPeopleManualByDate:{'2026-11-01':['p','p','self','missing'],'2026-11-02':['q']},todayPeopleByDate:{'2026-11-05':['q']},events:[{id:'b',date:'2026-11-01',start:'19:00',title:'저녁',participants:['p','p','self','missing']},{id:'a',date:'2026-11-01',start:'10:00',title:'아침',participants:['p','q']},{id:'rest',date:'2026-11-03',restDay:true,participants:['q']},{id:'other',date:'2026-12-01',participants:['p']}]};
test('date index merges registered people and actual participants without duplication or self',()=>{
 const baseline=JSON.stringify(source),index=build(source,'2026-11');
 assert.equal(index.days.length,2);assert.equal(index.people.size,2);
 assert.deepEqual(Array.from(index.days[0].people,p=>p.id),['p','q']);
 assert.deepEqual(Array.from(index.days[0].people[0].events,e=>e.id),['a','b']);
 assert.equal(index.days[0].people[1].manual,false);
 assert.equal(index.days[1].people[0].manual,true);assert.equal(index.days[1].people[0].events.length,0);
 assert.equal(JSON.stringify(source),baseline);
});
test('legacy merged records remain visible and months are independent',()=>{
 const old={...source};delete old.todayPeopleManualByDate;
 assert.equal(build(old,'2026-11').days.at(-1).date,'2026-11-05');
 assert.equal(build(source,'2026-12').days[0].people[0].events[0].id,'other');
 assert.equal(build(source,'2027-01').days.length,0);
});
test('continuous agenda includes all past months and matches partial names or initials',()=>{
 const index=build(source,'','2026-12-02');
 assert.deepEqual(Array.from(index.days,d=>d.date),['2026-11-01','2026-11-02','2026-12-01']);
 assert.equal(build(source,'','2026-11-02').days.length,2);
 assert.equal(matchesName('가나다','ㄱㄴㄷ'),true);assert.equal(matchesName('가나다','나다'),true);
 assert.equal(matchesName('Test Name','testname'),true);assert.equal(matchesName('가나다','ㅁㅂ'),false);
});
test('frequency deduplicates person days, counts events independently and preserves zero months',()=>{
 const baseline=JSON.stringify(source),stats=model(source,'2027-01-01');
 assert.deepEqual(Array.from(stats.months),['2026-11','2026-12','2027-01']);
 assert.equal(stats.days,3);assert.equal(stats.encounters,4);
 const p=stats.rows.find(r=>r.id==='p'),q=stats.rows.find(r=>r.id==='q');
 assert.deepEqual(Array.from(p.values),[1,1,0]);assert.equal(p.days,2);assert.equal(p.events,3);
 assert.deepEqual(Array.from(q.values),[2,0,0]);assert.equal(q.events,1);
 assert.equal(model(source,'2026-11-22').rows.find(r=>r.id==='p').days,1);
 assert.equal(model(source,'2027-03-01','3').rows.length,0);assert.equal(JSON.stringify(source),baseline);
});
test('people tab and timeline miscellaneous label are wired without changing old record key',()=>{
 const html=read('index.html'),app=read('assets/app-core.js'),career=read('assets/career-visualizer.js');
 assert.match(html,/data-calendar-view-tab="people"[^>]*aria-controls="calendarPeoplePanelV1"/);
 assert.match(app,/\['month','timeline','people','search'\]/);
 assert.match(html,/data-year="레거시"><summary>기타<\/summary>/);
 assert.match(career,/legacyHead=node\('h2','cv-legacy-heading','기타'\)/);
});
