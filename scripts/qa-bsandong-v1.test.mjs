import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({document:{getElementById:()=>null}});
vm.runInContext(fs.readFileSync('assets/bsandong-v1.js','utf8'),ctx);
const fixture={"categories":[{"id":"b","name":"브산동"},{"id":"x","name":"게임"}],"selfContactId":"s","contacts":[{"id":"a","name":"A"},{"id":"b","name":"B"}],"events":[{"id":"1","date":"2026-10-01","start":"10:00","categoryId":"b","participants":["s","a","a"]},{"id":"2","date":"2026-10-01","start":"12:00","categoryId":"b","participants":["b","a"],"participantStatuses":{"a":"planned"}},{"id":"3","date":"2026-10-08","categoryId":"b","participants":["s"]},{"id":"4","date":"2026-10-15","categoryId":"b","participants":["a","b"]},{"id":"5","date":"2026-10-22","categoryId":"b","participants":["b"]},{"id":"6","date":"2026-11-25","categoryId":"b","participants":["a"]},{"id":"7","date":"2026-11-26","categoryId":"b","participants":["a"]},{"id":"8","date":"2026-10-30","categoryId":"x","participants":["a"]},{"id":"9","date":"2026-10-28","categoryId":"b","participants":["a"],"cancelled":true}]};
const m=ctx.attendanceModel(fixture,'2026-11-25','','2026-11-30');
const a=m.rows.find(x=>x.id==='a'),b=m.rows.find(x=>x.id==='b');
assert.equal(m.completed.length,4);assert.equal(a.count,2);assert.equal(a.missed,1);assert.equal(a.rate,.5);assert.equal(b.count,3);assert.equal(b.missed,0);assert.equal(b.rate,1);assert.equal(m.unknown,1);assert.equal(m.history.length,7);assert.equal(ctx.attendanceBuckets(m,'month','a')[0].rate,.5);assert.equal(ctx.attendanceModel(fixture,'2026-11-25','2026-10-15','2026-10-22').rows.find(x=>x.id==='a').periodRate,.5);console.log('attendance model checks passed');
