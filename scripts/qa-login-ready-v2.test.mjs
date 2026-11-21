import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const file=p=>fs.readFileSync(p,'utf8');
const entry=file('src/cf-v111-entry.js');
const transform=vm.runInNewContext(entry.slice(entry.indexOf('function normalizeCloudCore('),entry.indexOf('function normalizeCloudCore(')+entry.slice(entry.indexOf('function normalizeCloudCore(')).indexOf('\n}\n')+3)+'\nnormalizeCloudCore');
for(const path of ['assets/cloud-v1.1.js','assets/cloud-runtime-v130.js']){
  const raw=file(path),patched=transform(raw);
  test(path+' worker output parses and announces readiness only after hydration',()=>{
    assert.doesNotThrow(()=>new vm.Script(patched));
    assert.equal((patched.match(/new CustomEvent\('mws:app-ready'/g)||[]).length,1);
    assert.match(patched,/await hydrate\(chosen\);\s*installLazyTabBridge\(\);\s*markAppReady\(chosen,false\)/);
    assert.match(patched,/window\.__mwsAppReadyV130=Boolean\(chosen==='admin'&&currentAdmin&&!offline&&loadedParts.has\('core'\)&&manifest\?\.parts\)/);
    assert.match(patched,/로그인 완료 · 필수 데이터/);
    assert.equal((patched.match(/async function init\(/g)||[]).length,1,'exactly one startup implementation');
    assert.match(patched,/addEventListener\('click',changeAccessMode\)/);
    assert.match(patched,/hideGate\(\);\s*setEntryBusy\(false\)/);
  });
  test(path+' slow cache does not block confirmed server data, absent server part fails closed',async()=>{
    const start=raw.indexOf('async function loadPartWithCache('),end=raw.indexOf('async function hydrate(',start);
    let called=0;
    const scope={timeout:()=>Promise.reject(Error('cache stalled')),getCachedPart:()=>new Promise(()=>{}),fetchPart:async()=>{called++;return{version:2,data:[1]}},putCachedPart:()=>new Promise(()=>{}),ownSave:(o,k)=>Object.prototype.hasOwnProperty.call(o,k),extractPart:()=>[],freshSkeleton:()=>({}),metrics:{cacheHits:0}};
    const load=vm.runInNewContext(raw.slice(start,end)+'\nloadPartWithCache',scope);
    const row=await load('admin','events',{parts:{events:2}});
    assert.equal(row.version,2);assert.equal(row.source,'network');assert.equal(called,1);
    await assert.rejects(load('admin','events',{parts:{}}),/기존 캐시를 보호/);
    assert.equal(called,1);
    await assert.rejects(load('admin','events',{parts:{events:3}}),/최신 서버 데이터 확인 실패/);
  });
}
test('gate releases after verified hydration even when optional UI ready event never arrives; stale generation cannot reveal',()=>{
  const patched=transform(file('assets/cloud-v1.1.js'));
  const begin=patched.indexOf('function markAppReady('),end=patched.indexOf('async function startHydration(',begin),source=patched.slice(begin,end);
  const make=(mode,ready)=>{
    let revealed=0,callback,listener;
    const events=[];
    const scope={mode,hydrationSeq:4,currentAdmin:mode==='admin'?{username:'fixture'}:null,manifest:{parts:{}},window:{__mwsAppReadyV130:ready,addEventListener(_,fn){listener=fn},removeEventListener(){listener=null},dispatchEvent(e){events.push(e)}},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail}},setTimeout(fn,ms){assert.equal(ms,6000);callback=fn;return 1},clearTimeout(){},revealReadyShell(){revealed++}};
    const mark=vm.runInNewContext(source+'\nmarkAppReady',scope);
    return{scope,mark,runTimeout:()=>callback?.(),emitReady:()=>listener?.(),revealed:()=>revealed,events};
  };
  const admin=make('admin',true);admin.mark('admin');assert.equal(admin.revealed(),0);admin.runTimeout();assert.equal(admin.revealed(),1);admin.emitReady();assert.equal(admin.revealed(),1);
  const publicMode=make('public',false);publicMode.mark('public');assert.equal(publicMode.events[0].detail.adminReady,false);assert.equal(publicMode.scope.window.__mwsAppReadyV130,true);publicMode.emitReady();assert.equal(publicMode.revealed(),1);
  const stale=make('admin',true);stale.mark('admin');stale.scope.hydrationSeq++;stale.runTimeout();assert.equal(stale.revealed(),0);
  const invalid=make('admin',false);assert.throws(()=>invalid.mark('admin'),/관리자 필수 데이터 준비 실패/);assert.equal(invalid.revealed(),0);
});
test('Public first entry uses server verified remembered sessions only, without login or logout requests',async()=>{
  for(const path of ['assets/cloud-v1.1.js','assets/cloud-runtime-v130.js']){
    const patched=transform(file(path));
    const source=patched.slice(patched.indexOf('  async function init(){'),patched.indexOf('  async function loadAdminList('));
    for(const [name,remembered,response,expected,requests] of [
      ['new visitor',false,null,'public',0],['valid',true,{authenticated:true,user:{id:1}},'admin',1],
      ['expired',true,{authenticated:false},'public',1],['network error',true,Error('network'),'public',1],
      ['malformed',true,{authenticated:true},'public',1]
    ]){
      const calls=[],storage=new Map(remembered?[['remember','1'],['mode','admin']]:[]);
      const scope={mode:null,currentAdmin:null,REMEMBER_KEY:'remember',MODE_KEY:'mode',
        localStorage:{getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},
        installSaveBridge(){},bindUi(){},selectLoginMode(){},applyModeUi(){assert.equal(scope.mode,'public')},setEntryBusy(){},
        timeout:p=>p,validateCacheSchema:async()=>{},
        fetchJson:async url=>{calls.push(url);if(response instanceof Error)throw response;return response},
        enterAppShell(chosen){calls.push(chosen)},startHydration:async chosen=>calls.push('hydrate:'+chosen)};
      await vm.runInNewContext(source+'\ninit()',scope);
      assert.equal(calls.filter(x=>x.startsWith('/')).length,requests,name);
      assert.deepEqual(calls.slice(-2),[expected,'hydrate:'+expected],name);
      assert.equal(Boolean(scope.currentAdmin),expected==='admin',name);
      if(name==='expired'||name==='malformed')assert.equal(storage.has('remember'),false);
    }
  }
});
test('Public failure is not mistaken for admin login; failed admin hydration falls back safely',async()=>{
  const output=transform(file('assets/cloud-v1.1.js'));
  const source=output.slice(output.indexOf('  async function startHydration('),output.indexOf('  async function adminLogin('));
  for(const first of ['public','admin']){
    const attempts=[],classes=new Set(),parts=new Set(['core']),events=[];let gates=0;
    const scope={mode:first,currentAdmin:{id:1},loadedParts:parts,baselineJson:new Map([['core',1]]),dirtyParts:new Set(['core']),
      window:{__mwsAppReadyV130:false,dispatchEvent:e=>events.push(e)},CustomEvent:class{constructor(type){this.type=type}},console:{error(){}},
      document:{body:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}}},$:()=>null,
      hydrate:async chosen=>{attempts.push(chosen);if(attempts.length===1)throw Error('fixture failure')},
      installLazyTabBridge(){},markAppReady:chosen=>{assert.equal(chosen,'public');scope.window.__mwsAppReadyV130=true},
      applyModeUi(){},selectLoginMode(){},hideGate(){gates++},showGate(){throw Error('credential gate unexpectedly shown')},setEntryBusy(){},toast(){},enterAppShell(chosen){scope.mode=chosen}};
    await vm.runInNewContext(source+'\nstartHydration(mode)',scope);
    assert.equal(scope.mode,'public');assert.equal(scope.currentAdmin,null);assert.equal(parts.size,0);assert.equal(gates,1);
    assert.deepEqual(attempts,first==='admin'?['admin','public']:['public']);
    assert.equal(scope.window.__mwsAppReadyV130,first==='admin');
  }
});
test('first full core render runs after favorite and mini-game runtime initialization',()=>{
  const app=file('assets/app-core.js');
  assert.ok(app.indexOf("renderAll('초기 로드');")>app.indexOf("let favoriteFolderFilter='all';"));
  assert.ok(app.indexOf("renderAll('초기 로드');")>app.indexOf('miniGameRuntime.multiDraw={'));
  assert.equal((app.match(/renderAll\('초기 로드'\);/g)||[]).length,1);
});
