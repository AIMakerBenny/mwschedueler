import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('legacy post names normalize to a stable boolean on every pass',()=>{
 const s=read('assets/app-core.js');
 const start=s.indexOf('data.posts=data.posts.filter(Boolean).map(p=>({',s.indexOf('function normalizeDataShape'));
 const code=s.slice(start,s.indexOf('normalizeMiniGameData();',start));
 assert(code.includes('nameManual:'));
 const normalize=new Function('data',code+'\nreturn data.posts');
 for(const [value,expected] of [[{},false],[{name:'게시글'},false],[{name:'게시글 123',postNo:'123'},false],[{name:'Custom'},true],[{name:'Custom',nameManual:false},false],[{name:'게시글',nameManual:true},true]]){
  const data={posts:[{id:'p',createdAt:'2026-11-24T00:00:00Z',...value}]};
  const result=normalize(data);assert.equal(result[0].nameManual,expected);assert.equal(typeof result[0].nameManual,'boolean');
  const before=JSON.stringify(result);assert.equal(JSON.stringify(normalize(data)),before);
 }
});
test('friend batches stop dispatching after exit, do not cooldown unstarted groups, and block lock-delayed reads',async()=>{
 const source=read('assets/friend-finder-v120.js');
 const code=source.slice(source.indexOf('async function runBatch('),source.indexOf('window.mwsFriendFinderFastRefresh='));
 const factory=new Function('window','document','console','baseFetch','allContactTargets','friendReadActive',
  'const LIVE_CACHE_MS=30000,LIVE_BATCH_SIZE=12,liveCache=new Map(),liveAttempts=new Map();\n'+
  'let friendReadGeneration=0,batchPromise=null,forceNextBatch=false;\n'+
  'const rememberRow=(row,at)=>liveCache.set(row.url,{row,at});const dispatchLiveUpdate=()=>{};\n'+
  code+'\nreturn {runBatch,ensureBatch,liveAttempts,invalidate:()=>{friendReadGeneration++;}};');
 const urls=Array.from({length:73},(_,i)=>'https://example.invalid/'+i),doc={body:{dataset:{mwsMode:'public'}}};
 let active=true,requests=[],waiting=[];
 const create=(window,baseFetch)=>factory(window,doc,{warn(){}},baseFetch,()=>urls,()=>active);
 const response=urls=>({ok:true,json:async()=>({results:urls.map(url=>({url,status:200,body:'{}'}))})});
 const f=create({},async(_url,init)=>{
  const {urls}=JSON.parse(init.body);requests.push(urls);
  return new Promise(resolve=>waiting.push(()=>resolve(response(urls))));
 });
 const pending=f.runBatch(new URL(urls[0]));assert.equal(requests.length,3);
 active=false;f.invalidate();waiting.splice(0).forEach(fn=>fn());await pending;
 assert.equal(requests.length,3);assert.equal(f.liveAttempts.size,36);
 assert.equal(await f.ensureBatch(new URL(urls[40])),null);assert.equal(requests.length,3);
 active=true;
 let held;const gate=new Promise(resolve=>{held=resolve});
 const sharing={read:async(_key,policy)=>{await gate;return {at:Date.now(),value:await policy.load()}}};
 let delayed=0;
 const g=create({mwsPublicReadSharingV1:sharing},async()=>{delayed++;throw Error('unexpected')});
 const p=g.runBatch(new URL(urls[0]));active=false;g.invalidate();held();await p;
 assert.equal(delayed,0);assert.equal(g.liveAttempts.size,0);
});
test('fresh complete campaign snapshot skips auto refresh; expired, incomplete and future samples handled',()=>{
 const s=read('assets/content-applications-v2.js');
 const code=s.slice(s.indexOf('function refreshInterval()'),s.indexOf('function tick()'));
 let sample=null;const pending=new Map(),attempts=new Map(),countdown=deadline=>({expired:deadline==='expired'});
 const {campaignDue,campaignSnapshotFresh}=new Function('snapshot','pending','attempts','countdown',code+'\nreturn {campaignDue,campaignSnapshotFresh}')(()=>sample,pending,attempts,countdown);
 const c={id:'c',deadline:'active'},now=100000;
 assert(campaignDue(c,now));
 sample={complete:true,checkedAt:new Date(now-59000).toISOString()};assert(campaignSnapshotFresh(c,now));assert(!campaignDue(c,now));
 sample={complete:true,checkedAt:new Date(now-60000).toISOString()};assert(campaignDue(c,now));
 sample={complete:false,checkedAt:new Date(now-1000).toISOString()};assert(campaignDue(c,now));
 sample={complete:true,checkedAt:new Date(now+1).toISOString()};assert(campaignDue(c,now));
 attempts.set(c.id,now-1000);assert(!campaignDue(c,now));attempts.clear();
 pending.set(c.id,true);assert(!campaignDue(c,now));pending.clear();
 assert(!campaignDue({...c,deadline:'expired'},now));
});
