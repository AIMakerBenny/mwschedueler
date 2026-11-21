import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const server=source('src/cf-v111-auth.js');
const groupCode=source('assets/calendar-content-groups-v2.js');
const clientPaths=['assets/cloud-v1.1.js','assets/cloud-runtime-v130.js'];
const sourceFunction=(text,start,end)=>{
 const from=text.indexOf(start),to=text.indexOf(end,from);
 assert(from>=0&&to>from,'Cannot extract cloud function '+start);
 return text.slice(from,to);
};

test('active Cloudflare D1 requires per-part optimistic concurrency versions',()=>{
 assert(server.includes('const expectedVersions=body?.versions'));
 assert(server.includes('Number(expectedVersions[part])'));
 assert(server.includes('return json({versions,normalized,savedBy:admin.id})'));
});
test('calendar startup reads consistent versions and only changed calendar parts from public D1',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE workspace_parts(scope TEXT,part TEXT,version INTEGER,data TEXT)');
 const insert=db.prepare('INSERT INTO workspace_parts VALUES(?,?,?,?)');
 for(const p of ['core','events','contacts','clipboard','activity','notebook','contactMeta','posts','miniGames','wardogs'])insert.run('public',p,4,JSON.stringify({p}));
 insert.run('admin','events',9,JSON.stringify({private:true}));
 const sqlEnv={DB:{prepare:sql=>({bind:(...args)=>({all:async()=>({results:db.prepare(sql).all(...args)})})})}};
 const fn=vm.runInNewContext(sourceFunction(server,'async function handleCalendarStartup(request,env){','async function handlePart(')+'\nhandleCalendarStartup',{URL,ensureSchema:async()=>{},repairStoredContactImageRefs:async()=>{},CALENDAR_STARTUP_PARTS:['core','events','contacts','clipboard','activity','notebook','contactMeta'],json:v=>v});
 try{
  const cold=await fn({url:'https://test/api/calendar-startup'},sqlEnv);assert.equal(Object.keys(cold.parts).length,7);assert.equal(Object.keys(cold.manifest.parts).length,10);assert.equal(cold.parts.events.version,4);assert.equal(cold.parts.events.data.p,'events');assert(!cold.parts.posts);
  const known=encodeURIComponent(JSON.stringify({core:4,events:3,contacts:4}));const warm=await fn({url:'https://test/api/calendar-startup?known='+known},sqlEnv);assert(!warm.parts.core&&!warm.parts.contacts);assert.equal(warm.parts.events.version,4);assert.equal(warm.manifest.parts.core,4);
 }finally{db.close()}
});
test('startup activity indexing matches the old per-date sync without a calendar redraw',()=>{
 const runtime=source('assets/today-people-runtime-v130.js');
 const methods=sourceFunction(runtime,'function validDateKey(value)','  let lastTodayPeopleSyncSignatureV130=');
 const inputs={selfContactId:'self',contacts:[{id:'self'},{id:'a'},{id:'b'},{id:'c'}],todayPeopleByDate:{'2026-11-20':['a'],'2026-11-22':['b']},todayPeopleManualByDate:{'2026-11-20':['b','missing','self'],'2026-11-23':['c']},events:[{date:'2026-11-20',title:'broadcast',participants:['a','b','self','missing']},{date:'2026-11-21',restDay:true,participants:['c']},{date:'2026-11-22',title:'휴방',participants:['a']},{date:'2026-11-24',title:'game',participants:['a','a','c']}]};
 const run=expression=>{const ctx={data:JSON.parse(JSON.stringify(inputs))};ctx.contact=id=>ctx.data.contacts.find(c=>c.id===id);vm.runInNewContext(methods+'\n'+expression,ctx);return JSON.stringify(ctx.data.todayPeopleByDate)};
 const expected=run(`const dates=new Set([...Object.keys(data.todayPeopleByDate),...Object.keys(data.todayPeopleManualByDate)]);for(const event of data.events)if(validDateKey(event?.date))dates.add(String(event.date));for(const date of dates)syncDate(date);`);
 assert.equal(run('syncAll()'),expected);
 assert(!runtime.includes("renderAll('Mawang Scheduler v1.3.0 자동 함께한 사람 동기화')"));
});


const cp=v=>JSON.parse(JSON.stringify(v));
const storage=()=>{const m=new Map();return {get length(){return m.size},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};
function makeRuntime(code,remote,versions,opts={}){
 const localStorage=opts.localStorage||storage(),sessionStorage=opts.sessionStorage||storage();
 const parts=Object.keys(remote),status={textContent:'',dataset:{}},writes=[],cache=[],alerts=[],events=[];
 const ctx={mode:null,currentAdmin:{id:1},loadedParts:new Set(),baselineJson:new Map(),dirtyParts:new Set(),manifest:null,
  ALL_PARTS:parts,INITIAL_PARTS:parts,PARTS_BY_TAB:{memos:['notebook']},data:null,cloudSaving:false,cloudSaveTimer:0,
  localStorage,sessionStorage,crypto:{randomUUID:()=> 'tab-1'},window:{dispatchEvent:e=>events.push(e),confirm:()=>false},
  CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail}},console:{error(){},warn(){}},setTimeout:(f,ms)=>setTimeout(f,Math.min(ms,10)),clearTimeout,
  $:id=>id==='syncStatusText'?status:null,toast:(...args)=>alerts.push(args),setManualSaveProgress(){},
  freshSkeleton:()=>({}),mergePart:(p,v,target)=>{target[p]=cp(v)},extractPart:p=>cp(ctx.data[p]),
  normalizeAndRender(){},normalizeDataShape(){},applyModeUi(){},hideGate(){},metric(){},setLoginError(){},timeout:promise=>Promise.resolve(promise),
  async fetchManifest(){if(opts.offline)throw Error('offline');return{parts:cp(versions)}},
  async getCachedPart(scope,p){return opts.cache?.[p]||null},
  async loadPartWithCache(scope,p){if(opts.failPart===p)throw Error('network');return {data:cp(remote[p]),version:versions[p]}},
  async fetchPart(p){return {data:cp(remote[p]),version:versions[p]}},
  async putCachedPart(scope,p,version,v){cache.push([p,version,cp(v)])},
  async fetchJson(route,request){
    assert.equal(route,'/api/save');const body=JSON.parse(request.body);writes.push(body);
    if(opts.onWrite)await opts.onWrite(body,writes.length,ctx);
    for(const [p,v] of Object.entries(body.versions)){if(v!==versions[p]){const err=Error('409');err.status=409;throw err}}
    const normalized={},newVersions={};for(const[p,v]of Object.entries(body.parts)){remote[p]=cp(v);versions[p]++;newVersions[p]=versions[p];normalized[p]=cp(v)}
    if(opts.loseAck&&writes.length===1)throw Error('network timeout after commit');
    return {versions:newVersions,normalized};
  }
 };
 const hyd=sourceFunction(code,'async function hydrate(chosen){','  window.mwsV55EnsureParts=');
 const save=sourceFunction(code,"const SAVE_DRAFT_PREFIX=",'  window.mwsV55SaveNow=');
 vm.runInNewContext(save+hyd+'\nthis.hydrate=hydrate;this.write=writeCloudNow;this.queue=queueCloudSave;this.ensure=ensurePartsForTab;this.merge=mergeSaveChanges;this.draft=()=>lastDraft;this.flushDraft=()=>draftWrites;',ctx);
 return {ctx,writes,cache,alerts,events,status,localStorage,sessionStorage};
}
const entry=source('src/cf-v111-entry.js');
const transform=vm.runInNewContext(sourceFunction(entry,'function normalizeCloudCore(js){','function normalizeBossRaidHtml(')+'\nnormalizeCloudCore');
for(const path of clientPaths){
 const code=transform(source(path));
 const initial=vm.runInNewContext(source(path).match(/const INITIAL_PARTS=(\[[^;]+\]);/)[1]);assert(initial.includes('clipboard'));
 test(path+' loads required rows in parallel and commits one complete calendar; Public defers optional data',async()=>{
  const remote={core:{categories:[]},events:[{id:'e1',title:'verified',favoriteFolderId:'f1'}],contacts:[],clipboard:{},activity:{},notebook:{favoriteFolders:[{id:'f1'}]},contactMeta:{},posts:[],miniGames:{},wardogs:{}};
  const versions=Object.fromEntries(Object.keys(remote).map(p=>[p,1]));
  for(const mode of ['public','admin']){
   const h=makeRuntime(code,cp(remote),cp(versions));const calls=[];let release,commits=0;
   const slow=new Promise(r=>release=r);
   h.ctx.INITIAL_PARTS=initial;h.ctx.PARTS_BY_TAB={posts:['posts'],export:Object.keys(remote)};
   const required=[...(mode==='admin'?Object.keys(remote):initial)];
   const batchParts={core:{version:1,data:cp(remote.core)},events:{version:1,data:cp(remote.events)}};
   h.ctx.window.__mwsCalendarStartupRequestV2=Promise.resolve({manifest:{parts:cp(versions)},parts:batchParts});
   h.ctx.fetchManifest=async()=>{throw Error('prefetched manifest must be used')};
   h.ctx.loadPartWithCache=async(scope,p)=>{calls.push(p);await slow;return {data:cp(remote[p]),version:1}};
   h.ctx.window.mwsRenderCalendarFirstV1=()=>assert.fail('partial calendar must not render');
   h.ctx.normalizeAndRender=(reason,startup)=>{if(startup){commits++;assert.equal(h.ctx.data.events[0].favoriteFolderId,'f1');assert.equal(h.ctx.data.notebook.favoriteFolders[0].id,'f1')}};
   const pending=h.ctx.hydrate(mode);await new Promise(r=>setImmediate(r));
   assert.deepEqual(calls.slice().sort(),required.filter(p=>!batchParts[p]).sort());assert.equal(commits,0);assert.equal(h.ctx.window.__mwsAppReadyV130,false);assert.equal(h.writes.length,0);
   release();await pending;assert.equal(commits,1);
   assert.deepEqual([...h.ctx.loadedParts].sort(),[...(mode==='admin'?Object.keys(remote):initial)].sort());
   if(mode==='public'){
    assert(!calls.includes('posts')&&!calls.includes('miniGames')&&!calls.includes('wardogs'));
    await Promise.all([h.ctx.ensure('posts'),h.ctx.ensure('posts')]);assert.equal(calls.filter(p=>p==='posts').length,1);
    await h.ctx.ensure('export');assert.equal(h.ctx.loadedParts.size,Object.keys(remote).length);
   }
  }
 });
 test(path+' warm startup uses version hints only; missing or mismatched cached rows are verified',async()=>{
  const remote={core:{categories:[]},events:[{id:'current'}]},versions={core:7,events:9};const h=makeRuntime(code,remote,versions);const calls=[];
  h.ctx.window.__mwsCalendarStartupRequestV2=Promise.resolve({manifest:{parts:versions},parts:{events:{version:8,data:[{id:'old'}]}}});
  h.ctx.loadPartWithCache=async(scope,p)=>{calls.push(p);return{data:cp(remote[p]),version:versions[p]}};
  await h.ctx.hydrate('public');assert.deepEqual(calls,['core','events']);assert.equal(h.ctx.data.events[0].id,'current');assert.equal(JSON.parse(h.localStorage.getItem('mws_calendar_startup_versions_v2:public')).events,9);
 });
 test(path+' actual served runtime drains all overlapping changes and manual SAVE waits for latest',async()=>{
  const remote={events:[{id:'e1',title:'old'}],contacts:[{id:'c1',name:'old'}],core:{contentGroups:[]},clipboard:{scheduleClipboard:[{id:'x'}]}},versions={events:4,contacts:5,core:7,clipboard:9};
  let release,start;const pending=new Promise(r=>release=r),started=new Promise(r=>start=r);
  const h=makeRuntime(code,remote,versions,{async onWrite(body,n){if(n===1){start();await pending}}});
  await h.ctx.hydrate('admin');assert.equal(h.ctx.data.clipboard.scheduleClipboard.length,1);
  h.ctx.data.events[0].title='first';h.ctx.data.contacts[0].name='first';const a=h.ctx.write();
  await started;h.ctx.data.events[0].title='second';h.ctx.data.contacts[0].name='second';h.ctx.data.core.contentGroups.push({id:'g',name:'G'});h.ctx.data.clipboard.scheduleClipboard.push({id:'y'});h.ctx.queue();
  const b=h.ctx.write(true);release();assert.equal(await a,true);assert.equal(await b,true);
  assert.equal(h.writes.length,2);assert.equal(remote.events[0].title,'second');assert.equal(remote.contacts[0].name,'second');assert.equal(remote.core.contentGroups[0].id,'g');assert.equal(remote.clipboard.scheduleClipboard.length,2);
  assert.equal(h.ctx.dirtyParts.size,0);assert.equal(h.status.textContent,'Cloudflare D1 저장 완료');assert.equal(h.localStorage.length,0);
  await h.ctx.hydrate('admin');assert.equal(h.ctx.data.events[0].title,'second');
 });
 test(path+' merges independent edits from another Admin, refuses overlapping field changes',async()=>{
  for(const overlap of [false,true]){
   const remote={events:[{id:'e1',title:'initial',date:'2026-11-16'},{id:'e2',title:'initial'}]},versions={events:5};
   const h=makeRuntime(code,remote,versions);
   await h.ctx.hydrate('admin');h.ctx.data.events[0].title='local edit';
   if(overlap)remote.events[0].title='remote edit';else remote.events[1].title='remote edit';versions.events++;
   assert.equal(await h.ctx.write(),!overlap);
   if(overlap){assert.equal(remote.events[0].title,'remote edit');assert.equal(h.ctx.data.events[0].title,'local edit');assert.equal(h.ctx.dirtyParts.has('events'),true);assert.equal(h.ctx.draft().parts.events.local[0].title,'local edit')}
   else{assert.deepEqual(remote.events.map(x=>x.title),['local edit','remote edit']);assert.equal(h.writes.length,2);assert.equal(h.writes[1].versions.events,6)}
  }
 });
 test(path+' recognizes a committed save even if its response is lost',async()=>{
  const remote={events:[{id:'e1',title:'old'}]},versions={events:11};
  const h=makeRuntime(code,remote,versions,{loseAck:true,onWrite(body,n,ctx){if(n===1){ctx.data.events[0].title='newer';}}});await h.ctx.hydrate('admin');h.ctx.data.events[0].title='new';
  assert.equal(await h.ctx.write(),true);assert.equal(h.writes.length,2);assert.equal(versions.events,13);assert.equal(remote.events[0].title,'newer');assert.equal(h.ctx.dirtyParts.size,0);
 });
 test(path+' preserves failed saves as a recoverable draft and restores them on reload',async()=>{
  const remote={events:[{id:'e1',title:'old'}]},versions={events:12};
  const h=makeRuntime(code,remote,versions,{onWrite(){const e=Error('session expired');e.status=401;throw e}});
  await h.ctx.hydrate('admin');h.ctx.data.events[0].title='unsaved';assert.equal(await h.ctx.write(),false);assert.equal(remote.events[0].title,'old');assert(h.localStorage.length);
  const h2=makeRuntime(code,remote,versions,{localStorage:h.localStorage,sessionStorage:h.sessionStorage});await h2.ctx.hydrate('admin');assert.equal(h2.ctx.data.events[0].title,'unsaved');assert.equal(await h2.ctx.write(),true);assert.equal(remote.events[0].title,'unsaved');assert.equal(h2.localStorage.length,0);
 });
 test(path+' rejects stale cached data and offline Admin hydration without clearing the outbox',async()=>{
  const remote={events:[{id:'e1',title:'server'}]},versions={events:9};
  const h=makeRuntime(code,remote,versions,{failPart:'events',cache:{events:{version:8,data:[{id:'e1',title:'stale'}]}}});
  await assert.rejects(h.ctx.hydrate('admin'),/최신 데이터/);
  const off=makeRuntime(code,remote,versions,{offline:true});await assert.rejects(off.ctx.hydrate('admin'),/관리자 편집/);
 });
 test(path+' rejects malformed acknowledged saves and missing baseline',async()=>{
  const remote={events:[{id:'e1',title:'old'}]},versions={events:5};
  const h=makeRuntime(code,remote,versions);await h.ctx.hydrate('admin');h.ctx.data.events[0].title='local';
  h.ctx.manifest.parts.events=undefined;
  assert.equal(await h.ctx.write(),false);assert.equal(h.writes.length,0);assert.equal(h.ctx.dirtyParts.has('events'),true);
 });
 test(path+' coalesces lazy data reads and fails closed',async()=>{
  const remote={notebook:{memos:[]}},versions={notebook:5};const h=makeRuntime(code,remote,versions);
  await h.ctx.hydrate('public');h.ctx.loadedParts.delete('notebook');let calls=0,resolve;
  h.ctx.loadPartWithCache=()=>{calls++;return new Promise(r=>resolve=r)};
  const a=h.ctx.ensure('memos'),b=h.ctx.ensure('memos');resolve({version:6,data:{memos:[{id:'1'}]}});assert.equal(await a,true);assert.equal(await b,true);assert.equal(calls,1);assert.equal(h.ctx.manifest.parts.notebook,6);
  h.ctx.loadedParts.delete('notebook');h.ctx.loadPartWithCache=async()=>{throw Error('network')};assert.equal(await h.ctx.ensure('memos'),false);
 });
}
test('performance runtime never returns stale bootstrap reads for authoritative APIs',async()=>{
 const perf=source('assets/perf-runtime.js');
 const wrapper=sourceFunction(perf,'  window.fetch=async function(input,init={}){','  /* app-version-v120.js');
 const calls=[];let version=20;
 const ctx={window:{},URL,location:{href:'https://example.test/',origin:'https://example.test'},nativeFetch:async(input,init)=>{calls.push({input,init});if(init.method==='POST')version++;return{version}}};
 vm.runInNewContext(wrapper,ctx);
 assert.equal((await ctx.window.fetch('/api/parts/events',{cache:'no-store'})).version,20);
 await ctx.window.fetch('/api/save',{method:'POST'});
 assert.equal((await ctx.window.fetch('/api/parts/events',{cache:'no-store'})).version,21);
 assert.equal((await ctx.window.fetch('/api/manifest')).version,21);
 assert.equal(calls[3].init.cache,'no-store');
});
test('calendar group editor requires only the genuine runtime hydration signal',()=>{
 assert(groupCode.includes("root.__mwsAppReadyV130===true"));
 assert(groupCode.includes("root.addEventListener('mws:app-ready'"));
 for(const path of clientPaths){
   const code=source(path);
   assert(code.includes('window.__mwsAppReadyV130=Boolean(chosen='));
   assert(code.includes("new CustomEvent('mws:app-ready'"));
 }
});

test('legacy full-integration audit checks current delegated preview and drag handle',()=>{
 const phase38=source('scripts/run-phase38-calendar-preview-mousemove-audit.mjs');
 const phase174=source('scripts/run-phase174-calendar-pointer-drag-audit.mjs');
 assert(phase38.includes('grid.onpointermove=pointerPreview;'));
 assert(phase174.includes('moveHandle.onpointerdown=e=>{'));
 assert(phase174.includes('el.onpointerdown=e=>{'));
});

test('calendar card pointer drag, click, controls, copy and undo contract',()=>{
 const code=source('assets/app-core.js');
 const clipboard=sourceFunction(code,'function cloneEventAsTemplate(', 'function clipboardChipColor(');
 const click=sourceFunction(code,'let calendarSuppressEventClickV174=',"document.addEventListener('keydown'");
 const pointer=sourceFunction(code,'let calendarPointerEventDragV174=', 'function renderCalendar(){');
 const wiring=sourceFunction(code,"grid.querySelectorAll('.mini-event').forEach(el=>{",'    el.ondragstart=e=>{')+'});';
 const classList={add(){},remove(){}};
 const handle={draggable:true},day={dataset:{date:'2026-11-17'},classList},tray={classList};
 let hit=day,group=false,ready=true,captures=0,opened=0,copies=0,moves=[],saves=[],uid=0;
 const card={dataset:{evid:'e1'},classList,isConnected:true,setAttribute(){},setPointerCapture(){captures++},hasPointerCapture(){return false},querySelector(sel){return sel.includes('handle')?handle:{textContent:'Event'}}};
 const ctx={data:{events:[{id:'e1',date:'2026-11-16',title:'Event'}],scheduleClipboard:[]},calendarDragPayload:null,calendarCtrlCopyMode:false,calendarViewModeV172:'month',
  window:{mwsCalendarContentGroupsV2:{selectionActive:()=>group,selectEvent:()=>group},mwsCalendarMoveGuardV4:{recordMove(...args){moves.push(args)}},mwsCanEditCalendarClipboardV1:()=>ready},
  document:{body:{dataset:{},classList,appendChild(){}},addEventListener(){},removeEventListener(){},createElement(){return {style:{},remove(){}}},elementFromPoint(){return{closest(sel){return sel.includes('Dropzone')?(hit===tray?tray:null):(hit===day?day:null)}}}},
  grid:{querySelectorAll(){return[card]}},performance:{now:()=>100},crypto:{randomUUID:()=>String(++uid)},isCalendarTabActive:()=>true,hideCalendarEventPreview(){},openCalendarEventDetailsV1(){opened++},openEvent(){throw new Error('Card click must not open editor')},duplicateEventById(){copies++},saveData(s){saves.push(s)},toast(){},formatDate:s=>s};
 vm.runInNewContext(clipboard+click+pointer+wiring+'\nthis.move=moveCalendarPointerEventDragV174;this.end=endCalendarPointerEventDragV174;this.click=handleCalendarMiniEventClick;this.cancel=cancelCalendarPointerEventDragV174;',ctx);
 const event=(x=0,control=false,ctrlKey=false)=>({button:0,pointerId:1,clientX:x,clientY:0,ctrlKey,preventDefault(){},stopPropagation(){},target:{closest(){return control?{}:null}}});
 card.onpointerdown(event());ctx.move(event(4));ctx.end(event(4));ctx.click(event(),'e1');
 assert.equal(opened,1);assert.equal(captures,0);assert.equal(saves.length,0);
 card.onpointerdown(event(0,true));ctx.move(event(12));ctx.end(event(12));assert.equal(saves.length,0);
 card.onpointerdown(event(0,false,true));ctx.move(event(12));ctx.end(event(12));ctx.click(event(0,false,true),'e1');assert.equal(copies,1);
 group=true;card.onpointerdown(event());ctx.move(event(12));ctx.end(event(12));group=false;assert.equal(saves.length,0);
 card.onpointerdown(event());ctx.move(event(12));ctx.end(event(12));ctx.click(event(),'e1');
 assert.equal(opened,1);assert.equal(ctx.data.events[0].date,'2026-11-17');assert.deepEqual(moves,[['e1','2026-11-16','2026-11-17','Event']]);assert.equal(captures,1);
 hit=tray; card.onpointerdown(event());ctx.move(event(12));ctx.end(event(12));
 assert.equal(ctx.data.events.length,1);assert.equal(ctx.data.events[0].date,'2026-11-17');assert.equal(ctx.data.scheduleClipboard.length,1);assert.equal(ctx.data.scheduleClipboard[0].event.title,'Event');
 ready=false;card.onpointerdown(event());ctx.move(event(12));ctx.end(event(12));assert.equal(ctx.data.scheduleClipboard.length,1);
 ready=true;const item=ctx.data.scheduleClipboard[0];ctx.window.createEventFromClipboardItem(item.id,'2026-11-18');assert.equal(ctx.data.events.length,2);assert.equal(ctx.data.scheduleClipboard.length,1);
 card.onpointerdown(event());ctx.move(event(12));ctx.cancel(event(12));assert.equal(ctx.data.scheduleClipboard.length,1);
});

