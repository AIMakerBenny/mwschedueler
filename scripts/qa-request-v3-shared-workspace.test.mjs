import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const helper=read('assets/public-read-sharing-v1.js');
const create=new Function(helper.slice(helper.indexOf('function createPublicReadSharing'),helper.indexOf('let channel=null'))+'\nreturn createPublicReadSharing')();
for(const path of ['assets/cloud-v1.1.js','assets/cloud-runtime-v130.js','assets/cf-static-cloud-core-v1.js']){
 const s=read(path);
 const share=s.slice(s.indexOf('  async function readSharedWorkspaceV3'),s.indexOf('  async function flushPartReads'));
 const equal=s.slice(s.indexOf('  function sameSerializedSaveValue'),s.indexOf('  function markDirty'));
 test(path+' compares object keys semantically without ignoring changed arrays or values',()=>{
   const f=new Function(equal+'\nreturn sameSerializedSaveValue')();
   assert(f('{"a":1,"b":{"x":2,"y":3}}','{"b":{"y":3,"x":2},"a":1}'));
   assert(!f('{"a":[1,2]}','{"a":[2,1]}'));
   assert(!f('{"a":1}','{"a":2}'));assert(!f('{}','{"a":null}'));assert(!f('null',undefined));
 });
 test(path+' shares only exact verified public batch responses',async()=>{
  const channels=[],queues=new Map();let now=100000,calls=0;
  const channel=()=>{const c={postMessage(m){for(const p of channels)if(p!==c)queueMicrotask(()=>p.onmessage?.({data:structuredClone(m)}))}};channels.push(c);return c};
  const locks={request(key,fn){const p=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(fn);queues.set(key,p);return p}};
  const tabs=Array.from({length:5},()=>new Function('window','clone',share+'\nreturn readSharedWorkspaceV3')({mwsPublicReadSharingV1:create({channel:channel(),locks,now:()=>now})},structuredClone));
  const versions={posts:2,miniGames:3};
  const load=async()=>{calls++;return {posts:2,miniGames:3}};
  const valid=(body,v)=>body.posts===v.posts&&body.miniGames===v.miniGames;
  const rows=await Promise.all(tabs.map((f,i)=>f(i%2?['posts','miniGames']:['miniGames','posts'],versions,load,valid,true)));
  assert.equal(calls,1);rows[0].posts=99;assert.equal(rows[1].posts,2);
  await tabs[0](['posts','miniGames'],versions,load,valid,false);assert.equal(calls,2);
  await tabs[0](['posts'],{posts:undefined},load,valid,true);assert.equal(calls,3);
  const mismatched=()=>{calls++;return {posts:1,miniGames:3}};
  await tabs[0](['posts','miniGames'],{posts:4,miniGames:3},mismatched,valid,true);
  await tabs[1](['posts','miniGames'],{posts:4,miniGames:3},mismatched,valid,true);assert.equal(calls,5);
  now+=8001;await tabs[2](['posts','miniGames'],versions,load,valid,true);assert.equal(calls,6);
 });
}
