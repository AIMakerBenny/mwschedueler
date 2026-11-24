import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const server=read('src/cf-v111-auth.js');
test('batched parts preserve public scope, errors, and parameterized reads',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE workspace_parts(scope TEXT,part TEXT,version INTEGER,data TEXT)');
 const put=db.prepare('INSERT INTO workspace_parts VALUES(?,?,?,?)');
 put.run('public','contacts',4,'[]');put.run('admin','contacts',9,'{"private":true}');put.run('public','core',2,'invalid');
 let reads=0,repairs=0;const env={DB:{prepare:sql=>({bind:(...args)=>({all:async()=>{reads++;return{results:db.prepare(sql).all(...args)}}})})}};
 const code=server.slice(server.indexOf('async function handlePartsBatch'),server.indexOf('async function handleBootstrap'));
 const fn=new Function('URL','PARTS','json','ensureSchema','repairStoredContactImageRefs',code+'\nreturn handlePartsBatch')(URL,['core','contacts','posts'],(body,status=200)=>({body,status}),async()=>{},async()=>{repairs++});
 try{const r=await fn({url:'https://fixture.test/api/parts-batch?parts=contacts,core,posts'},env);assert.equal(r.body.results.contacts.row.version,4);assert.equal(r.body.results.core.status,500);assert.equal(r.body.results.posts.status,404);assert.equal(reads,1);assert.equal(repairs,1);
 assert.equal((await fn({url:'https://fixture.test/api/parts-batch?parts=core,core'},env)).status,400);assert.equal(reads,1)}finally{db.close()}
});
for(const path of ['assets/cloud-runtime-v130.js','assets/cloud-v1.1.js'])test(path+' coalesces distinct and duplicate reads without retaining stale data',async()=>{
 const code=read(path),chunk=code.slice(code.indexOf('function fetchManifest()'),code.indexOf('async function loadPartWithCache'));
 let requests=[],timers=[];const fetchJson=async url=>{requests.push(url);if(url==='/api/manifest')return{parts:{core:2}};if(url.startsWith('/api/parts-batch?'))return{results:Object.fromEntries(decodeURIComponent(url.split('=')[1]).split(',').map(part=>[part,{status:200,row:{part,version:2,data:{part}}}]))};const part=url.split('/').pop();return{part,version:3,data:{part}}};
 const api=new Function('fetchJson','setTimeout','performance','metrics','metric','byteLen','clone','ownSave','window',"let hydrationSeq=1,mode='public',manifest={parts:{posts:2,miniGames:2}};"+chunk+'\nreturn {fetchPart,fetchManifest}')(fetchJson,fn=>timers.push(fn),{now:()=>0},{semanticResponseBytes:0,cacheMisses:0},()=>{},()=>1,structuredClone,(o,k)=>Object.hasOwn(o||{},k),{});
 const a=api.fetchPart('posts'),b=api.fetchPart('miniGames'),c=api.fetchPart('posts');timers.shift()();const rows=await Promise.all([a,b,c]);assert.equal(requests.length,1);assert.deepEqual(rows[0],rows[2]);assert.notEqual(rows[0],rows[2]);
 const d=api.fetchPart('posts',true);timers.shift()();assert.equal((await d).version,3);assert.equal(requests.length,2);
 await Promise.all([api.fetchManifest(),api.fetchManifest()]);assert.equal(requests.length,3);await api.fetchManifest();assert.equal(requests.length,4);
});
