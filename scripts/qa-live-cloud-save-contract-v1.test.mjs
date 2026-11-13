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
 assert(!phase174.includes('"el.onpointerdown=e=>beginCalendarPointerEventDragV174(e,el);"'));
});
