import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const friend=read('assets/friend-finder-v120.js');
const extract=(s,a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start);assert(start>=0&&end>start);return s.slice(start,end)};
test('Friend Finder retains thirty-second refresh, pauses hidden or inactive tabs, and avoids forced polling',async()=>{
 const timers=new Map();let n=0,active=true,requests=0,forced=[];
 const doc={hidden:false};
 const code=extract(friend,'function stopActiveRefresh()','window.fetch=async function');
 const run=new Function('document','activeFriendRoot','allContactTargets','ensureBatch','scheduleUi','setTimeout','clearTimeout','URL','console','let activeRefreshTimer=0;const ACTIVE_REFRESH_MS=30000;'+code+'\nreturn {scheduleActiveRefresh,stopActiveRefresh}')(
  doc,()=>active,()=>['https://api-channel.sooplive.co.kr/v1.1/channel/a/home/section/broad'],
  async(_,opts)=>{requests++;forced.push(opts.force)},()=>{},(fn,ms)=>{timers.set(++n,{fn,ms});return n},id=>timers.delete(id),URL,{warn(){}});
 const fire=async()=>{const [id,timer]=timers.entries().next().value;timers.delete(id);await timer.fn();return timer.ms};
 run.scheduleActiveRefresh();assert.equal(await fire(),30000);assert.equal(requests,1);assert.deepEqual(forced,[false]);assert.equal(timers.size,1);
 doc.hidden=true;await fire();assert.equal(requests,1);assert.equal(timers.size,0);
 doc.hidden=false;active=false;run.scheduleActiveRefresh();assert.equal(timers.size,0);
 active=true;run.scheduleActiveRefresh(120);assert.equal(await fire(),120);assert.equal(requests,2);run.stopActiveRefresh();assert.equal(timers.size,0);
});
test('same-broadcast visible thumbnail updates on stamp change but offscreen does not',()=>{
 const fn=new Function(extract(friend,'function shouldRefreshLiveImage','function decorate')+'\nreturn shouldRefreshLiveImage')();
 const img={dataset:{bno:'123',thumbStamp:'10'}};
 assert.equal(fn(img,'123','10',true),false);assert.equal(fn(img,'123','11',false),false);assert.equal(fn(img,'123','11',true),true);assert.equal(fn(img,'456','11',false),true);
});
test('shared LIVE rows retain the original sample time and normalized metadata',()=>{
 const code=extract(friend,'function firstLiveScalar','function syntheticResponse')+extract(friend,'function rememberRow','function dispatchLiveUpdate');
 const liveCache=new Map(),liveByUserId=new Map();
 const remember=new Function('liveCache','liveByUserId','userIdFromTarget','URL',code+'\nreturn rememberRow')(liveCache,liveByUserId,()=> 'a',URL);
 const url='https://api-channel.sooplive.co.kr/v1.1/channel/a/home/section/broad';
 remember({url,status:200,body:'{}',live:{broadNo:'123'}},12345);
 assert.equal(liveCache.get(url).at,12345);assert.equal(liveByUserId.get('a').at,12345);assert.equal(liveByUserId.get('a').data.broadNo,'123');
 remember({url,status:200,body:JSON.stringify({nested:{broad_no:'456',broad_title:'Title'}})},23456);
 assert.equal(liveByUserId.get('a').data.broadNo,'456');
});
test('achievement startup migration verifies only legacy local blobs, retains remote read fallback and full manual verification',async()=>{
 const store=new Map(),stats={get:0,head:0,session:0,put:0},blob=new Blob(['image'],{type:'image/png'});
 const db={transaction(){const tx={objectStore(){return {
  get(id){const req={result:store.get(id)};queueMicrotask(()=>{req.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});return req},
  getAllKeys(){const req={result:[...store.keys()]};queueMicrotask(()=>{req.onsuccess?.();tx.oncomplete?.()});return req},
  put(record){store.set(record.id,record);const req={};queueMicrotask(()=>tx.oncomplete?.());return req},
  delete(id){store.delete(id);const req={};queueMicrotask(()=>tx.oncomplete?.());return req}
 }}};return tx}};
 const window={indexedDB:true,mwsGetAchievementCardsV1621:()=>[{frontImageId:'confirmed'},{frontImageId:'old'},{frontImageId:'remote'}],dispatchEvent(){},addEventListener(){}};
 const fetch=async(url,init={})=>{if(url==='/api/auth/session'){stats.session++;return{ok:true,json:async()=>({authenticated:true})}}if(init.method==='HEAD'){stats.head++;return{ok:true}}if(init.method==='PUT'){stats.put++;return{ok:true,json:async()=>({ok:true})}}stats.get++;return{ok:true,blob:async()=>blob}};
 vm.runInNewContext(read('assets/achievement-media-v1621.js'),{window,indexedDB:{open(){const req={result:db};queueMicrotask(()=>req.onsuccess());return req}},Blob,fetch,setTimeout:()=>0,Event,CustomEvent:class{},console,document:{body:{dataset:{mwsMode:'admin'}}},crypto});
 const api=window.mwsAchievementMediaV1;
 store.set('confirmed',{id:'confirmed',blob,cloudConfirmed:true,updatedAt:'old'});store.set('old',{id:'old',blob,updatedAt:'old'});
 await api.syncReferencedToCloud({localOnly:true});assert.equal(stats.head,1);assert.equal(stats.session,1);assert.equal(store.get('old').cloudConfirmed,true);
 await api.syncReferencedToCloud({localOnly:true});assert.equal(stats.head,1);assert.equal(stats.session,1);
 const [a,b]=await Promise.all([api.getBlob('remote'),api.getBlob('remote')]);assert.equal(a,b);assert.equal(stats.get,1);assert.equal(store.get('remote').cloudConfirmed,true);
 await api.put(blob,{id:'new'});assert.equal(stats.put,1);assert.equal(store.get('new').cloudConfirmed,true);
 await api.syncReferencedToCloud();assert.equal(stats.head,4);assert.equal(stats.session,2);
});

test('one virtual hour on calendar issues no Friend Finder polls, active mode keeps 30-second polling',async()=>{
 const timers=new Map();let n=0,active=false,requests=0,clock=0;
 const doc={hidden:false};
 const code=extract(friend,'function stopActiveRefresh()','window.fetch=async function');
 const run=new Function('document','activeFriendRoot','allContactTargets','ensureBatch','scheduleUi','setTimeout','clearTimeout','URL','console','let activeRefreshTimer=0;const ACTIVE_REFRESH_MS=30000;'+code+'\nreturn {scheduleActiveRefresh,stopActiveRefresh}')(
 doc,()=>active,()=>['https://api-channel.sooplive.co.kr/v1.1/channel/a/home/section/broad'],async()=>{requests++},()=>{},(fn,ms)=>{timers.set(++n,{fn,at:clock+ms});return n},id=>timers.delete(id),URL,{warn(){}});
 const advance=async ms=>{const until=clock+ms;while(timers.size){const [id,t]=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(t.at>until)break;timers.delete(id);clock=t.at;await t.fn()}clock=until};
 run.scheduleActiveRefresh();await advance(3600000);assert.equal(requests,0);
 active=true;run.scheduleActiveRefresh();await advance(3600000);assert.equal(requests,120);
 doc.hidden=true;await advance(3600000);assert.equal(requests,120);assert.equal(timers.size,0);
 doc.hidden=false;active=false;run.scheduleActiveRefresh();await advance(3600000);assert.equal(requests,120);
});
test('application rank polling keeps 60-second freshness, stops outside relevant screens and on expiry',()=>{
 const src=read('assets/content-applications-v2.js'),code=extract(src,'function stopTimer()','async function fetchPage(');
 let now=100000,visible=false,clocks=0,requests=0,stopped=0;
 const attempts=new Map(),pending=new Map(),campaign={id:'one',deadline:100000+10800000};
 const api=new Function('active','updateClocks','sectionActive','current','records','countdown','attempts','pending','refresh','render','setInterval','clearInterval','Date','let timer=1;'+code+'\nreturn {tick,activate}')(
 ()=>visible,()=>clocks++,()=>false,()=>null,()=>[campaign],deadline=>({expired:now>=deadline}),attempts,pending,c=>{requests++;attempts.set(c.id,now)},()=>{},()=>1,()=>stopped++,{now:()=>now});
 for(let n=0;n<3600;n++){now+=1000;api.tick()}assert.equal(requests,0);assert.equal(clocks,0);
 visible=true;for(let n=0;n<3600;n++){api.tick();now+=1000}assert.equal(requests,60);assert.equal(clocks,3600);
 now=campaign.deadline;api.tick();assert.equal(requests,60);
 visible=false;api.tick();assert(stopped>0);assert.equal(requests,60);
});
