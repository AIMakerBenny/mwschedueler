import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const steam=load('assets/steam-game-v111.js');
const app=load('assets/app-core.js');
const client=load('assets/cloud-v1.1.js');
const stage=load('assets/cloud-runtime-v130.js');
const server=load('src/index.js');
const entry=load('src/cf-v111-entry.js');
const keyValues=source=>{
  const match=/const CORE_KEYS\s*=\s*(\[[^\]\n]+\]);/.exec(source);
  assert(match,'CORE_KEYS missing');
  return vm.runInNewContext(match[1]);
};

test('Game library included in both Cloudflare browser runtimes and server core',()=>{
  for(const [name,source] of [['browser',client],['staged',stage],['server',server]]){
    const keys=keyValues(source);
    for(const field of name==='server'?['contentGroups','gameLibrary']:['contentGroups','achievementCards','gameLibrary'])
      assert(keys.includes(field),name+' missing '+field);
  }
  assert(app.includes('if(!Array.isArray(data.gameLibrary))data.gameLibrary=[];'));
  assert(app.includes('gameLibrary:[]'));
  assert(client.includes('achievementCards:[],gameLibrary:[]'));
  assert(stage.includes('achievementCards:[],gameLibrary:[]'));
});

test('active Cloudflare script patch does not remove manual games from core',()=>{
  const start=entry.indexOf('function normalizeCloudCore(js){');
  const end=entry.indexOf('\nfunction normalizeBossScript',start);
  assert(start>=0&&end>start);
  const sandbox={};
  vm.runInNewContext(entry.slice(start,end)+'\nthis.patch=normalizeCloudCore;',sandbox);
  for(const runtime of [client,stage]){
    const patched=sandbox.patch(runtime);
    for(const name of ['gameLibrary','contentGroups','achievementCards'])
      assert(keyValues(patched).includes(name));
  }
});

test('Cloudflare server core payload keeps manual library but not event payload',async()=>{
  const start=server.indexOf('async function externalizePart(env, part, raw) {');
  const end=server.indexOf('\nasync function ',start+10);
  assert(start>=0&&end>start);
  const sandbox={};
  const keys=/const CORE_KEYS\s*=\s*(\[[^\]\n]+\]);/.exec(server)?.[1];
  vm.runInNewContext('const CORE_KEYS='+keys+';\n'+server.slice(start,end)+'\nthis.externalize=externalizePart;',sandbox);
  const game={source:'manual',id:'manual:abc',name:'와우 포에버',platform:'PC',image:'https://example.com/wow.webp'};
  const payload={version:52,gameLibrary:[game],contentGroups:[{id:'wow',name:'와우 포에버',color:'#0f8c95'}],events:[{id:'e1',date:'2026-11-01',steamGame:game}],memos:[{content:'private'}]};
  const core=await sandbox.externalize({},'core',payload);
  assert.deepEqual(JSON.parse(JSON.stringify(core.gameLibrary)),[game]);
  assert.equal(core.events,undefined);
  assert.equal(core.memos,undefined);
  assert.equal(core.contentGroups[0].id,'wow');
});

test('legacy Steam serialization and manual serialization coexist without transforming old data',()=>{
  const a=steam.indexOf('const appIdOf=');
  const b=steam.indexOf('function notice(title,message){',a);
  assert(a>=0&&b>a);
  const code=steam.slice(a,b);
  const sandbox={};
  vm.runInNewContext(code+'\nthis.api={normalizeGame,serializeGame};',sandbox);
  const original={appid:'730',name:'Counter-Strike 2',image:'https://example.com/730.jpg',storeUrl:'https://store.steampowered.com/app/730/'};
  const legacy=sandbox.api.serializeGame(original);
  assert.deepEqual(JSON.parse(JSON.stringify(legacy)),original);
  const manual={source:'manual',id:'manual:xyz',name:'와우 포에버',image:'',platform:'PC'};
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.api.serializeGame(manual))),manual);
  assert.equal(sandbox.api.serializeGame({name:'no id'}),null);
});
