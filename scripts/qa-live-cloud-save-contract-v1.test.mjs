import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const server=source('src/cf-v111-auth.js');
const clientPaths=['assets/cloud-v1.1.js','assets/cloud-runtime-v130.js'];
const slice=(text,start,end)=>{
  const from=text.indexOf(start),to=text.indexOf(end,from);
  assert(from>=0&&to>from,'Cannot extract '+start);
  return text.slice(from,to);
};

test('D1 save is version-guarded and server authoritative',()=>{
  assert(server.includes('const expectedVersions=body?.versions'));
  assert(server.includes("env.DB.batch(statements)"));
  assert(server.includes('return json({versions,normalized,savedBy:admin.id})'));
});

for(const path of clientPaths){
  const code=source(path);
  const extracted=slice(code,'async function writeCloudNow(manual=false){','  window.mwsV55SaveNow=');
  function harness(scenario='ok'){
    let current={core:{contentGroups:[{id:'saved-id',name:'그룹 A',color:'#7659a5'}],gameLibrary:[]}};
    const baseline=new Map([['core',JSON.stringify({contentGroups:[],gameLibrary:[]})]]);
    let sent=null,readCount=0,scheduled=0,cacheCount=0;
    const ctx={
      mode:'admin',currentAdmin:{id:1},
      cloudSaving:false,pendingSave:false,dirtyParts:new Set(['core']),
      loadedParts:new Set(['core']),manifest:{parts:{core:74}},baselineJson:baseline,
      window:{__mwsAppReadyV130:true},
      markDirty(){
        ctx.dirtyParts.clear();
        if(JSON.stringify(current.core)!==baseline.get('core'))ctx.dirtyParts.add('core');
      },
      extractPart(part){assert.equal(part,'core');return structuredClone(current.core)},
      mergePart(part,value){current[part]=structuredClone(value)},
      async fetchJson(route,opts){
        if(route==='/api/auth/session')return{authenticated:true};
        if(route==='/api/save'){
          sent=JSON.parse(opts.body);
          if(scenario==='conflict')throw Error('409 version conflict');
          if(scenario==='malformed')return{versions:{core:75},normalized:{}};
          if(scenario==='inflight'){
            current.core.contentGroups[0].name='그룹 B';
          }
          return{versions:{core:75},normalized:{core:sent.parts.core}};
        }
        assert.equal(route,'/api/parts/core');
        assert.equal(opts.cache,'no-store');
        readCount++;
        return{version:scenario==='readback-version'?74:75,
          data:scenario==='readback-value'?{contentGroups:[],gameLibrary:[]}:sent.parts.core};
      },
      async putCachedPart(){cacheCount++},
      queueCloudSave(){scheduled++},
      setManualSaveProgress(){},toast(){},
      $(id){return{textContent:''}},
      console,Date,Number,Object,JSON,Set,Map,Promise,setTimeout,clearTimeout,
    };
    vm.runInNewContext('let cloudSaveBlocked=false;\n'+extracted+'\nthis.write=writeCloudNow;',ctx);
    return {ctx,run:()=>ctx.write(true),state:()=>({current,baseline,readCount,scheduled,cacheCount,sent})};
  }
  test(path+' verifies core read-after-write before success',async()=>{
    const h=harness();
    assert.equal(await h.run(),true);
    const state=h.state();
    assert.equal(state.readCount,1);
    assert.equal(state.sent.versions.core,74);
    assert.equal(h.ctx.manifest.parts.core,75);
    assert.equal(state.cacheCount,1);
    assert.equal(h.ctx.dirtyParts.size,0);
    assert.equal(JSON.parse(state.baseline.get('core')).contentGroups[0].id,'saved-id');
  });
  for(const scenario of ['conflict','malformed','readback-version','readback-value']){
    test(path+' refuses false success: '+scenario,async()=>{
      const h=harness(scenario);
      assert.equal(await h.run(),false);
      assert.equal(h.ctx.manifest.parts.core,74);
      assert.equal(h.state().cacheCount,0);
      assert.equal(h.ctx.dirtyParts.has('core'),true);
    });
  }
  test(path+' preserves later edits and requeues unsaved changes',async()=>{
    const h=harness('inflight');
    assert.equal(await h.run(),true);
    const state=h.state();
    assert.equal(state.current.core.contentGroups[0].name,'그룹 B');
    assert.equal(JSON.parse(state.baseline.get('core')).contentGroups[0].name,'그룹 A');
    assert.equal(h.ctx.dirtyParts.has('core'),true);
    assert.equal(state.scheduled,1);
  });
  test(path+' cannot write while Admin only has offline cache',async()=>{
    const h=harness();
    h.ctx.window.__mwsAppReadyV130=false;
    assert.equal(await h.run(),false);
    assert.equal(h.state().readCount,0);
    assert.equal(h.state().cacheCount,0);
  });
  test(path+' loads Admin core/events from network even on a cache version match',()=>{
    assert(code.includes("scope==='admin'&&(part==='core'||part==='events')"));
    assert(code.includes('offline=true;console.warn'));
    assert(code.includes("loadedParts.has('events')"));
  });
}
