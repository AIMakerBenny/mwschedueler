import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

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

for(const path of clientPaths){
 const code=source(path);
 test(path+' sends actual D1 base versions and verifies successful committed response',async()=>{
   const fn=sourceFunction(code,'async function writeCloudNow(manual=false){','  window.mwsV55SaveNow=');
   const expectedGroup={id:'existing-sbo-id',name:'SBO',color:'#7659a5'};
   const payload={contentGroups:[expectedGroup],gameLibrary:[],categories:[]};
   let captured=null,cache=null,status='';
   const baseline=new Map([['core',JSON.stringify({contentGroups:[]})]]);
   const context={
     mode:'admin',currentAdmin:{id:1},dirtyParts:new Set(['core']),loadedParts:new Set(['core']),
     cloudSaving:false,pendingSave:false,
     manifest:{parts:{core:74}},baselineJson:baseline,
     markDirty(){return ['core']},extractPart(part){assert.equal(part,'core');return payload},
     async fetchJson(url,opts){
       if(url==='/api/auth/session')return{authenticated:true};
       assert.equal(url,'/api/save');
       captured=JSON.parse(opts.body);
       assert.deepEqual(captured.versions,{core:74});
       assert.deepEqual(captured.parts.core.contentGroups,[expectedGroup]);
       return {versions:{core:75},normalized:{core:payload}};
     },
     mergeNormalizedResult(obj){assert.deepEqual(obj.core.contentGroups,[expectedGroup])},
     async putCachedPart(scope,part,version,value){cache={scope,part,version,value}},
     queueCloudSave(){throw Error('unexpected resave')},
     setManualSaveProgress(){},toast(){},
     $(id){return{textContent:status}},
     console,Date,Number,Object,JSON,Set,Map,Promise,setTimeout,clearTimeout
   };
   vm.runInNewContext(fn+'\nthis.write=writeCloudNow;',context);
   const saved=await context.write(true);
   assert.equal(saved,true);
   assert.equal(captured.versions.core,74);
   assert.equal(context.manifest.parts.core,75);
   assert.equal(context.dirtyParts.size,0);
   assert.equal(cache.version,75);
   assert.equal(cache.scope,'admin');
   assert.deepEqual(cache.value.contentGroups,[expectedGroup]);
   assert.equal(JSON.parse(baseline.get('core')).contentGroups[0].id,'existing-sbo-id');
 });

 test(path+' never treats a rejected or malformed D1 save as persisted',async()=>{
   const fn=sourceFunction(code,'async function writeCloudNow(manual=false){','  window.mwsV55SaveNow=');
   for(const scenario of ['version-conflict','missing-normalized','missing-manifest']){
     let writes=0;
     const original={contentGroups:[{id:'original',name:'SBO',color:'#123456'}]};
     const dirty=new Set(['core']);
     const context={
       mode:'admin',currentAdmin:{id:1},dirtyParts:dirty,loadedParts:new Set(['core']),
       cloudSaving:false,pendingSave:false,
       manifest:scenario==='missing-manifest'?null:{parts:{core:74}},
       baselineJson:new Map([['core','old']]),
       markDirty(){},extractPart(){return original},
       async fetchJson(route){
         if(route==='/api/auth/session')return{authenticated:true};
         writes++;
         if(scenario==='version-conflict')throw Error('409 version conflict');
         return {versions:{core:75},normalized:{}};
       },
       mergeNormalizedResult(){throw Error('must not merge invalid result')},
       async putCachedPart(){throw Error('must not cache rejected save')},
       queueCloudSave(){},setManualSaveProgress(){},toast(){},
       $(id){return{textContent:''}},
       console,Date,Number,Object,JSON,Set,Map,Promise,setTimeout,clearTimeout
     };
     vm.runInNewContext(fn+'\nthis.write=writeCloudNow;',context);
     assert.equal(await context.write(true),false,path+' must reject '+scenario);
     assert.equal(context.baselineJson.get('core'),'old');
     assert.equal(context.dirtyParts.has('core'),true);
     assert.equal(context.manifest?.parts?.core??74,74);
     if(scenario==='missing-manifest')assert.equal(writes,0);
   }
 });

 test(path+' sets admin readiness only after authenticated online hydration',async()=>{
   const fn=sourceFunction(code,'async function hydrate(chosen){','  async function ensurePartsForTab(tab){');
   const load=async ({chosen,admin,offline})=>{
     const events=[];
     const win={__mwsAppReadyV130:true,dispatchEvent:event=>events.push(event)};
     const store={core:{contentGroups:[{id:'original-group',name:'SBO',color:'#7659a5'}]},events:[{id:'event-1',contentGroupId:'original-group'}]};
     const ctx={
       mode:null,currentAdmin:admin?{id:1}:null,
       loadedParts:new Set(),baselineJson:new Map(),dirtyParts:new Set(),
       manifest:null,INITIAL_PARTS:['core','events'],data:null,
       async fetchManifest(){if(offline)throw Error('offline');return{parts:{core:74,events:419}}},
       async loadPartWithCache(scope,part){return{data:store[part],version:part==='core'?74:419}},
       async getCachedPart(scope,part){return{data:store[part],version:part==='core'?74:419}},
       mergePart(part,value,target){if(part==='core')Object.assign(target,value);else target.events=value},
       freshSkeleton(){return{events:[],contentGroups:[]}},
       normalizeAndRender(){},applyModeUi(){},hideGate(){},metric(){},
       localStorage:{removeItem(){}},
       $(){return{textContent:''}},
       window:win,
       CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail}},
       console,Date,Number,Object,JSON,Set,Map,Promise
     };
     vm.runInNewContext(fn+'\nthis.hydrateFn=hydrate;',ctx);
     await ctx.hydrateFn(chosen);
     return{ctx,events,win};
   };
   const ready=await load({chosen:'admin',admin:true,offline:false});
   assert.equal(ready.win.__mwsAppReadyV130,true);
   assert.equal(ready.events.length,1);
   assert.equal(ready.events[0].type,'mws:app-ready');
   assert.equal(ready.ctx.data.contentGroups[0].id,'original-group');
   const guest=await load({chosen:'public',admin:false,offline:false});
   assert.equal(guest.win.__mwsAppReadyV130,false);
   const unauthenticated=await load({chosen:'admin',admin:false,offline:false});
   assert.equal(unauthenticated.win.__mwsAppReadyV130,false);
   const offline=await load({chosen:'admin',admin:true,offline:true});
   assert.equal(offline.win.__mwsAppReadyV130,false);
 });
}

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
  grid:{querySelectorAll(){return[card]}},performance:{now:()=>100},crypto:{randomUUID:()=>String(++uid)},isCalendarTabActive:()=>true,hideCalendarEventPreview(){},openEvent(){opened++},duplicateEventById(){copies++},saveData(s){saves.push(s)},toast(){},formatDate:s=>s};
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

for(const path of clientPaths){
 const code=source(path);
 test(path+' loads clipboard on first render and keeps subsequent edits during a pending save',async()=>{
  const list=code.match(/const INITIAL_PARTS=(\[[^;]+\]);/)[1];
  const initial=vm.runInNewContext(list);
  assert(initial.includes('clipboard'));
  const hydrate=sourceFunction(code,'async function hydrate(chosen){','  async function ensurePartsForTab(tab){');
  const write=sourceFunction(code,'async function writeCloudNow(manual=false){','  window.mwsV55SaveNow=');
  const mark=sourceFunction(code,'function markDirty(){','  function queueCloudSave(){');
  const original={id:'existing',event:{title:'Existing'}};
  const second={id:'second',event:{title:'Second'}};
  const third={id:'third',event:{title:'Third'}};
  const cp=v=>JSON.parse(JSON.stringify(v));
  let persisted={scheduleClipboard:[original]},version=74,resaves=0,rendered=null;
  const ctx={mode:null,currentAdmin:{id:1},loadedParts:new Set(),baselineJson:new Map(),dirtyParts:new Set(),manifest:null,INITIAL_PARTS:initial,data:null,cloudSaving:false,pendingSave:false,
   async fetchManifest(){return{parts:Object.fromEntries(initial.map(p=>[p,p==='clipboard'?version:1]))}},
   async loadPartWithCache(scope,p){return{data:p==='clipboard'?cp(persisted):{},version:p==='clipboard'?version:1}},
   mergePart(p,v,d){if(p==='clipboard')d.scheduleClipboard=cp(v.scheduleClipboard)},
   freshSkeleton(){return{scheduleClipboard:[]}},normalizeAndRender(){rendered=cp(ctx.data.scheduleClipboard)},applyModeUi(){},hideGate(){},metric(){},localStorage:{removeItem(){}},window:{dispatchEvent(){}},CustomEvent:class{},console,
   $(){return{textContent:''}},extractPart(p){return p==='clipboard'?cp({scheduleClipboard:ctx.data.scheduleClipboard}):{}},
   async fetchJson(route,opts){if(route==='/api/auth/session')return{authenticated:true};assert.equal(route,'/api/save');const body=JSON.parse(opts.body);assert.equal(body.versions.clipboard,version);persisted=cp(body.parts.clipboard);version++;if(version===75)ctx.data.scheduleClipboard.push(third);return{versions:{clipboard:version},normalized:{clipboard:cp(persisted)}}},
   mergeNormalizedResult(v){if(v.clipboard)ctx.data.scheduleClipboard=cp(v.clipboard.scheduleClipboard)},
   async putCachedPart(){},queueCloudSave(){resaves++},setManualSaveProgress(){},toast(){}
  };
  vm.runInNewContext(hydrate+mark+write+'\nthis.hydrate=hydrate;this.write=writeCloudNow;',ctx);
  await ctx.hydrate('admin');assert.deepEqual(rendered,[original]);assert(ctx.loadedParts.has('clipboard'));assert.equal(ctx.dirtyParts.size,0);
  ctx.data.scheduleClipboard.push(second);assert.equal(await ctx.write(),true);assert.deepEqual(cp(ctx.data.scheduleClipboard),[original,second,third]);assert.equal(resaves,1);
  assert.equal(await ctx.write(),true);assert.deepEqual(persisted.scheduleClipboard,[original,second,third]);assert.equal(version,76);
  await ctx.hydrate('admin');assert.deepEqual(rendered,[original,second,third]);assert.equal(ctx.dirtyParts.size,0);
 });
}
