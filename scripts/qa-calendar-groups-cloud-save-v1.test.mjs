import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const load=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const client=load('assets/cloud-v1.1.js');
const stage=load('assets/cloud-runtime-v130.js');
const legacy=load('assets/cloud-v5.5.js');
const entry=load('src/cf-v111-entry.js');
const server=load('src/index.js');
const app=load('assets/app-core.js');

const clientMatch=/const CORE_KEYS=(\[[^\]\n]+\]);/.exec(client);
const serverMatch=/const CORE_KEYS\s*=\s*(\[[^\]\n]+\]);/.exec(server);
assert(clientMatch&&serverMatch,'Core keys missing');
const clientKeys=vm.runInNewContext(clientMatch[1]);
const serverKeys=vm.runInNewContext(serverMatch[1]);

test('both client and server preserve calendar content groups',()=>{
  assert(clientKeys.includes('contentGroups'));
  assert(serverKeys.includes('contentGroups'));
  assert(serverKeys.includes('categories'));
  assert(serverKeys.includes('timezones'));
});

test('actual active core and v130 runtime both persist groups',()=>{
  assert(/const CORE_KEYS=\\[[^\\]]*'contentGroups'/.test(client));
  assert(/const CORE_KEYS=\\[[^\\]]*'contentGroups'/.test(stage));
  assert(/const CORE_KEYS=\\[[^\\]]*'contentGroups'/.test(legacy));
  assert(entry.includes("url.pathname==='/assets/cloud-v1.1.js'"));
  assert(entry.includes("url.pathname==='/assets/cloud-runtime-v130.js'"));
  assert(entry.includes("url.pathname==='/assets/cloud-v5.5.js'"));
  assert(entry.includes('cloud-v1.1-loader.js'));
});

test('live Cloudflare core loader includes content groups alongside existing achievements patch',()=>{
  const start=entry.indexOf('function normalizeCloudCore(js){');
  const end=entry.indexOf('\nfunction normalizeBossScript',start);
  assert(start>=0&&end>start,'normalizeCloudCore function missing');
  const code=entry.slice(start,end);
  const sandbox={};
  vm.runInNewContext(code+'\nthis.patch=normalizeCloudCore;',sandbox);
  const patched=sandbox.patch(client);
  const keys=/const CORE_KEYS=(\[[^\]\n]+\]);/.exec(patched);
  assert(keys);
  const resolved=vm.runInNewContext(keys[1]);
  assert(resolved.includes('contentGroups'));
  assert(resolved.includes('achievementCards'),'previous achievement card patch must be retained');
  assert(patched.includes('function extractPart(part,src=data)'));
  const patchedStage=sandbox.patch(stage);
  const stageKeys=/const CORE_KEYS=(\\[[^\\]\\n]+\\]);/.exec(patchedStage);
  assert(stageKeys);
  assert(vm.runInNewContext(stageKeys[1]).includes('contentGroups'));
});

test('Cloudflare worker core externalizer keeps content groups without copying events',async()=>{
  const start=server.indexOf('async function externalizePart(env, part, raw) {');
  const end=server.indexOf('\nasync function ',start+10);
  assert(start>=0&&end>start,'externalizePart source missing');
  const sandbox={};
  vm.runInNewContext('const CORE_KEYS='+serverMatch[1]+';\n'+server.slice(start,end)+'\nthis.testExtract=externalizePart;',sandbox);
  const contentGroups=[
    {id:'sbo',name:'SBO 시즌',color:'#7659a5'},
    {id:'wow',name:'와우 포에버',color:'#0f8c95'}
  ];
  const input={version:52,contentGroups,categories:[],events:[{
    id:'event1',contentGroupId:'sbo',title:'SBO 연습',date:'2026-11-12'
  }],memos:[{secret:'should not be in core'}]};
  const actual=await sandbox.testExtract({},'core',input);
  assert.deepEqual(JSON.parse(JSON.stringify(actual.contentGroups)),contentGroups);
  assert.equal(actual.events,undefined);
  assert.equal(actual.memos,undefined);
  assert.equal(actual.version,52);
});

test('calendar creates groups and edits do not rewrite individual schedule fields',()=>{
  assert(app.includes('if(!Array.isArray(data.contentGroups))data.contentGroups=[];'));
  const manager=load('assets/calendar-content-groups-v2.js');
  assert(manager.includes('data.contentGroups.push(group)'));
  assert(manager.includes('saveData(\'콘텐츠 그룹 이름·색상 변경\')'));
  assert(manager.includes('group.name=name;group.color='));
  assert(app.includes('contentGroupId:document.getElementById(\'evContentGroupV2\')'));
});
