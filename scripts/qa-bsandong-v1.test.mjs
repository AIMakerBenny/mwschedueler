import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({document:{getElementById:()=>null}});
vm.runInContext(fs.readFileSync('assets/bsandong-v1.js','utf8'),ctx);
const fixture={"categories":[{"id":"b","name":"브산동"},{"id":"x","name":"게임"}],"selfContactId":"s","contacts":[{"id":"a","name":"A"},{"id":"b","name":"B"}],"events":[{"id":"1","date":"2026-10-01","start":"10:00","categoryId":"b","participants":["s","a","a"]},{"id":"2","date":"2026-10-01","start":"12:00","categoryId":"b","participants":["b","a"],"participantStatuses":{"a":"planned"}},{"id":"3","date":"2026-10-08","categoryId":"b","participants":["s"]},{"id":"4","date":"2026-10-15","categoryId":"b","participants":["a","b"]},{"id":"5","date":"2026-10-22","categoryId":"b","participants":["b"]},{"id":"6","date":"2026-11-25","categoryId":"b","participants":["a"]},{"id":"7","date":"2026-11-26","categoryId":"b","participants":["a"]},{"id":"8","date":"2026-10-30","categoryId":"x","participants":["a"]},{"id":"9","date":"2026-10-28","categoryId":"b","participants":["a"],"cancelled":true}]};
const m=ctx.attendanceModel(fixture,'2026-11-25','','2026-11-30');
const a=m.rows.find(x=>x.id==='a'),b=m.rows.find(x=>x.id==='b');
assert.equal(m.completed.length,4);assert.equal(a.count,2);assert.equal(a.missed,1);assert.equal(a.rate,.5);assert.equal(b.count,3);assert.equal(b.missed,0);assert.equal(b.rate,1);assert.equal(m.unknown,1);assert.equal(m.history.length,7);assert.equal(ctx.attendanceBuckets(m,'month','a')[0].rate,.5);assert.equal(ctx.attendanceModel(fixture,'2026-11-25','2026-10-15','2026-10-22').rows.find(x=>x.id==='a').periodRate,.5);console.log('attendance model checks passed');

const mixed={categories:[{id:'other',name:'합방'}],contentGroups:[{id:'g1',name:'브산동'},{id:'g2',name:'산책 프로젝트',mawangContent:'bsandong'},{id:'g3',name:'브산동',mawangContent:'none'}],contacts:[{id:'a',name:'A'}],events:[
{id:'title',title:'브산동 - 닭청소',categoryId:'other',date:'2026-11-25',start:'15:00',end:'17:00',participants:['a']},
{id:'name',title:'VR 산책',contentGroupId:'g1',date:'2026-11-18',participants:['a']},
{id:'explicit',title:'재활센터',contentGroupId:'g2',date:'2026-11-11',participants:[]},
{id:'off',title:'다른 방송',contentGroupId:'g3',date:'2026-11-04',participants:['a']},
{id:'wed',title:'다른 수요일 방송',date:'2026-11-04',participants:['a']},
{id:'overnight',title:'브산동 야간',date:'2026-11-25',start:'23:00',end:'01:00',participants:['a']},
{id:'future',title:'브산동 다음주',date:'2026-12-02',participants:['a']}]};
const original=JSON.stringify(mixed),result=ctx.attendanceModel(mixed,'2026-11-25','','9999-12-31','22:00');
assert.deepEqual(Array.from(result.history.map(e=>e.id)).sort(),['explicit','future','name','overnight','title']);
assert.equal(result.period.length,2);assert.equal(result.unknown,1);assert.equal(result.byId.get('a').count,2);
assert.equal(ctx.attendanceModel(mixed,'2026-11-25','','9999-12-31','16:00').period.length,1);
assert.equal(JSON.stringify(mixed),original);
console.log('title, named and explicit group, same-day ended, future and no-write regression passed');
