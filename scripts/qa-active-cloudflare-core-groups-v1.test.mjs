import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const worker=load('src/cf-v111-auth.js');
const entry=load('src/cf-v111-entry.js');
const authfix=load('src/cf-v112-authfix.js');
const coreClient=load('assets/cloud-v1.1.js');
const stageClient=load('assets/cloud-runtime-v130.js');
const manager=load('assets/calendar-content-groups-v2.js');
const keysFrom=source=>{
  const match=/const CORE_KEYS\s*=\s*(\[[^\]\n]+\]);/.exec(source);
  assert(match,'Missing CORE_KEYS');
  return vm.runInNewContext(match[1]);
};

test('live API route delegates to the actual D1 auth save owner',()=>{
  assert(entry.includes("import authWorker from './cf-v120-friend.js'"));
  assert(load('src/cf-v120-friend.js').includes("import appWorker from './cf-v122-cache.js'"));
  assert(load('src/cf-v122-cache.js').includes("import appWorker from './cf-v121-boss-media.js'"));
  assert(load('src/cf-v121-boss-media.js').includes("import appWorker from './cf-v112-authfix.js'"));
  assert(authfix.includes("import authWorker from './cf-v111-auth.js'"));
  assert(authfix.includes('authWorker.fetch(request,env,ctx)'));
  assert(worker.includes("path==='/api/save'&&request.method==='POST'"));
  assert(worker.includes('return handleSave(request,env)'));
});

test('client and deployed auth Worker accept same shared core fields',()=>{
  const required=['version','categories','timezones','achievementCards','contentGroups','gameLibrary'];
  for(const [name,source] of [['production browser',coreClient],['staged browser',stageClient],['active D1 auth Worker',worker]]){
    const keys=keysFrom(source);
    for(const key of required)assert(keys.includes(key),name+' discards '+key);
  }
  assert(manager.includes('data.contentGroups.push(group)'));
  assert(manager.includes("persistGroupChange('콘텐츠 그룹 이름·색상 변경')"));
});

test('the active D1 externalizer preserves names and colors along with manual games',async()=>{
  const start=worker.indexOf('async function externalizePart(env,part,raw,saveContext=null){');
  const end=worker.indexOf('\nasync function handleSave(request,env){',start);
  assert(start>=0&&end>start,'Active D1 externalizer not found');
  const keys=/const CORE_KEYS\s*=\s*(\[[^\]\n]+\]);/.exec(worker)[1];
  const sandbox={};
  vm.runInNewContext('const CORE_KEYS='+keys+';\n'+worker.slice(start,end)+'\nthis.extract=externalizePart;',sandbox);

  const groups=[
    {id:'group-sbo',name:'SBO',color:'#7659a5'},
    {id:'group-wow',name:'와우 포에버',color:'#0f8c95'}
  ];
  const game={source:'manual',id:'manual:abcd',name:'와우 포에버',platform:'PC',image:''};
  const original={
    version:52,categories:[],timezones:[],achievementCards:[],contentGroups:groups,
    gameLibrary:[game],events:[{id:'e1',date:'2026-11-13',contentGroupId:'group-sbo'}],
    memos:[{content:'not a core field'}]
  };
  const savedCore=await sandbox.extract({},'core',original);
  const savedEvents=await sandbox.extract({},'events',original.events);
  assert.deepEqual(JSON.parse(JSON.stringify(savedCore.contentGroups)),groups);
  assert.deepEqual(JSON.parse(JSON.stringify(savedCore.gameLibrary)),[game]);
  assert.deepEqual(JSON.parse(JSON.stringify(savedCore.achievementCards)),[]);
  assert.equal(savedCore.events,undefined);
  assert.equal(savedCore.memos,undefined);
  assert.equal(savedEvents[0].contentGroupId,'group-sbo');

  const hydrated={...JSON.parse(JSON.stringify(savedCore)),events:JSON.parse(JSON.stringify(savedEvents))};
  assert.equal(hydrated.contentGroups.find(g=>g.id===hydrated.events[0].contentGroupId).name,'SBO');
});

test('save API enforces version-guard for safe multi-admin updates',()=>{
  assert(worker.includes('const expectedVersions=body?.versions'));
  assert(worker.includes('const expected=Number(expectedVersions[part])'));
  assert(entry.includes('versions:Object.fromEntries(partsToSave.map(part=>'));
});
