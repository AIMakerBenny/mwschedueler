import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {planHistoricalEvents,ensureHistoricalCalendarMigration} from '../src/historical-calendar-migration-v1.js';
const archive=globalThis.mwsCareerActivitiesDataV1;
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('known dated archive is preserved, uncertain days are not invented',()=>{
  assert.equal(archive.length,176);
  assert.equal(new Set(archive.map(r=>`${r.date}|${r.title}`)).size,176);
  for(const r of archive){assert.match(r.date,/^20\d\d-\d\d(?:-\d\d)?$/);assert(r.title&&r.context&&r.source);assert(!r.url||r.url.startsWith('https://'));}
  const plan=planHistoricalEvents([]);assert.equal(plan.added,159);assert.equal(plan.monthOnly,17);
  assert(plan.events.every(e=>e.date.length===10&&e.start==='TBD'&&e.participants.length===0&&e.historicalRecord.source));
  assert(plan.events.some(e=>e.historicalRecord.basis==='publication'&&e.description.includes('실제 진행일과 다를')));
});
test('existing calendar schedules, repeated broadcasts and explicit aliases stay untouched',()=>{
  const original=[{id:'a',date:'2026-03-28',title:'파블로프 전쟁',start:'12:00',participants:['p']},{id:'b',date:'2026-02-03',title:'천벌서버',start:'13:00'},{id:'c',date:'2026-03-28',title:'파블로프 전쟁',start:'19:00'}];
  const before=JSON.stringify(original),plan=planHistoricalEvents(original);
  assert.equal(JSON.stringify(original),before);assert.deepEqual(plan.events.slice(0,3),original);assert.equal(plan.duplicates,2);assert.equal(plan.added,157);
  assert.equal(planHistoricalEvents(plan.events).added,0);
});
test('D1 migration is atomic, optimistic-version guarded and idempotent',async()=>{
  const db=new DatabaseSync(':memory:');db.exec(`CREATE TABLE app_meta(key TEXT PRIMARY KEY,value TEXT,updated_at TEXT);CREATE TABLE workspace_parts(scope TEXT,part TEXT,version INTEGER,data TEXT,updated_at TEXT,PRIMARY KEY(scope,part));CREATE TABLE save_conflict_guard(id INTEGER PRIMARY KEY);INSERT INTO save_conflict_guard VALUES(1);`);
  const existing=[{id:'existing',title:'천벌서버',date:'2026-02-03'}];
  for(const scope of ['public','admin'])db.prepare('INSERT INTO workspace_parts VALUES(?,?,?,?,CURRENT_TIMESTAMP)').run(scope,'events',4,JSON.stringify(existing));
  let conflict=true;
  const adapter={prepare(sql){return {args:[],bind(...args){this.args=args;return this},first(){return db.prepare(sql).get(...this.args)},all(){return {results:db.prepare(sql).all(...this.args)}},run(){return db.prepare(sql).run(...this.args)}}},async batch(statements){if(conflict){conflict=false;db.exec("UPDATE workspace_parts SET version=5 WHERE scope='public'")}db.exec('BEGIN');try{for(const s of statements)s.run();db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}};
  const env={DB:adapter,MWS_ENV:'cloudflare-production'};
  await ensureHistoricalCalendarMigration(env);assert.equal(db.prepare('SELECT COUNT(*) n FROM app_meta').get().n,0);assert.equal(db.prepare("SELECT version FROM workspace_parts WHERE scope='admin'").get().version,4);
  await ensureHistoricalCalendarMigration(env);const rows=db.prepare('SELECT * FROM workspace_parts ORDER BY scope').all();assert.deepEqual(rows.map(r=>r.version),[5,6]);assert(rows.every(r=>JSON.parse(r.data).length===159));assert(rows.every(r=>JSON.parse(r.data)[0].id==='existing'));assert.equal(db.prepare('SELECT COUNT(*) n FROM app_meta').get().n,1);
  await ensureHistoricalCalendarMigration(env);assert.deepEqual(db.prepare('SELECT * FROM workspace_parts ORDER BY scope').all(),rows);db.close();
});
test('month-only records remain discoverable in calendar without separate timeline tab',()=>{
  const ctx=vm.createContext({window:{},document:{getElementById:()=>null}});vm.runInContext(read('assets/career-activities-data-v1.js'),ctx);vm.runInContext(read('assets/calendar-historical-v1.js'),ctx);
  const months=ctx.window.mwsCalendarHistoricalV1;assert.equal(months.monthRecords('2026-11',[]).length,1);assert.equal(months.monthRecords('2026-11',[{date:'2026-11-10',title:'와포'}]).length,0);
  assert.doesNotMatch(read('index.html'),/careerActivitiesTabV1|career-activities-v1\.js/);assert.match(read('index.html'),/id="calendarHistoricalMonthV1"/);
});
