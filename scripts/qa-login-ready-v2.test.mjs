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
test('first full core render runs after favorite and mini-game runtime initialization',()=>{
  const app=file('assets/app-core.js');
  assert.ok(app.indexOf("renderAll('초기 로드');")>app.indexOf("let favoriteFolderFilter='all';"));
  assert.ok(app.indexOf("renderAll('초기 로드');")>app.indexOf('miniGameRuntime.multiDraw={'));
  assert.equal((app.match(/renderAll\('초기 로드'\);/g)||[]).length,1);
});
