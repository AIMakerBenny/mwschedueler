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

test('global renders never construct hidden mini-game contact palettes; tab entry still renders each game',()=>{
 const src=read('assets/app-core.js');
 const code=extract(src,'function renderActiveMiniGameV2()','window.setMultiDrawTarget');
 const calls=[];let tab='calendar';
 const run=new Function('document','renderLadder','renderRps','renderPachinko','renderMultiDraw',code+'\nreturn renderActiveMiniGameV2')({querySelector:()=>({id:tab})},()=>calls.push('gameLadder'),()=>calls.push('gameRps'),()=>calls.push('gamePachinko'),()=>calls.push('gameMultiDraw'));
 for(const id of ['calendar','contacts','dashboard','achievements','settings']){tab=id;run()}
 assert.deepEqual(calls,[]);
 for(const id of ['gameLadder','gameRps','gamePachinko','gameMultiDraw']){tab=id;run();assert.equal(calls.at(-1),id)}
 assert.equal(calls.length,4);
 const nav=extract(src,'function setTab(tab)','document.querySelectorAll(\'.nav button\').forEach(b=>b.onclick');
 for(const [id,fn] of [['gameLadder','renderLadder'],['gameRps','renderRps'],['gamePachinko','renderPachinko'],['gameMultiDraw','renderMultiDraw']]){assert(nav.includes("if(tab==='"+id+"')"));assert(nav.includes(fn))}
 assert(src.includes("safeRenderView('미니게임',renderActiveMiniGameV2)"));
 const palette=extract(src,"function renderMiniContactPalette(game,q='')",'function renderMiniGame(game)');
 assert(palette.includes('loading="lazy" decoding="async"'));
});

test('expired campaign detail, manual refresh and in-flight continuation cannot issue more reads',async()=>{
 const src=read('assets/content-applications-v2.js');
 const polling=extract(src,'function stopTimer()','async function fetchPage(');
 let now=200000,requests=0;const campaign={id:'one',deadline:now-1,entries:[]};
 const attempts=new Map(),pending=new Map();
 const api=new Function('active','updateClocks','sectionActive','current','records','countdown','attempts','pending','refresh','render','setInterval','clearInterval','Date','let timer=0;'+polling+'\nreturn {tick,activate,loadVisible}')(()=>true,()=>{},()=>true,()=>campaign,()=>[campaign],deadline=>({expired:now>=deadline}),attempts,pending,()=>requests++,()=>{},()=>1,()=>{},{now:()=>now});
 api.activate();api.loadVisible();for(let i=0;i<3600;i++){now+=1000;api.tick()}assert.equal(requests,0);
 const refresh=extract(src,'async function refresh(c,','function addAuthorInput');
 const run=new Function('countdown','pending','active','epoch','signature','records','sectionActive','selected','attempts','snapshot','render','detail','readSource','Date',refresh+'\nreturn refresh')(
 d=>({expired:now>=d}),new Map(),()=>true,1,()=> 'same',()=>[campaign],()=>true,'one',new Map(),()=>null,()=>{},null,async()=>{requests++},{now:()=>now});
 await run(campaign,true);assert.equal(requests,0);
});

test('group persistence verifies the acknowledged server state without a second HTTP request',async()=>{
 const src=read('assets/calendar-content-groups-v2.js');
 const code=extract(src,'async function persistGroupChange(reason,','function renderOrphanRecovery');
 const data={contentGroups:[{id:'g',name:'QA',color:'#123456'}],events:[{id:'e',contentGroupId:'g'}]};
 let saves=0,reads=0,bad=false;
 const root={__mwsAppReadyV130:true,mwsV55SaveNow:async()=>true,mwsReadVerifiedPartsV1:()=>({core:{data:{contentGroups:structuredClone(data.contentGroups)}},events:{data:[{id:'e',contentGroupId:bad?'wrong':'g'}]}})};
 const run=new Function('root','document','saveData','groups','data','fetch','groupWriteStatus','toast','console',code+'\nreturn persistGroupChange')(root,{body:{dataset:{mwsMode:'admin'}}},()=>saves++,()=>data.contentGroups,data,async()=>{reads++;throw Error('unexpected read')},()=>{},()=>{},{error(){}});
 assert.equal(await run('test',['e']),true);assert.equal(saves,1);assert.equal(reads,0);
 bad=true;assert.equal(await run('test',['e']),false);assert.equal(reads,0);
});

test('Friend Finder only queries favorite contacts used by its actual legacy view',()=>{
 const code=extract(friend,'function allContactTargets()','function extractActualTarget');
 const data={contacts:Array.from({length:200},(_,i)=>({favorite:i<13,stationUrl:'station'+i}))};
 const targets=new Function('dataRef','stationKey','channelUrl',code+'\nreturn allContactTargets')(()=>data,x=>x,x=>x);
 assert.equal(targets().length,13);assert.deepEqual(targets(),Array.from({length:13},(_,i)=>'station'+i));
});
test('contact image URLs are withheld until observation, external images remain unchanged',()=>{
 const app=read('assets/app-core.js'),code=extract(app,'function mwsDeferredContactAttrsV1','let mwsDeferredContactObserverV1');
 const attrs=new Function('esc','IntersectionObserver',code+'\nreturn mwsDeferredContactAttrsV1')(v=>v,()=>{});
 assert.equal(attrs('/media/contact/id?v=1'),'data-mws-deferred-contact-src="/media/contact/id?v=1"');
 assert.equal(attrs('https://example.test/image.jpg'),'src="https://example.test/image.jpg"');
 assert(app.includes('entry.isIntersecting)mwsActivateDeferredContactImageV1(entry.target)'));
});
test('direct SOOP thumbnail is attempted before Worker fallback',()=>{
 const code=extract(friend,'function liveThumbCandidates','function livePlayUrl');
 const urls=new Function(code+'\nreturn liveThumbCandidates')()('123','1');
 assert(urls[0].startsWith('https://liveimg.sooplive.com/'));assert(urls[2].startsWith('/api/soop/live-thumb?'));
});

test('Friend Finder reacts to actual workspace transitions, not only sidebar clicks',()=>{
 const src=read('assets/app-core.js');
 const nav=extract(src,'function setTab(tab)',"document.querySelectorAll('.nav button').forEach(b=>b.onclick");
 assert(nav.includes("window.dispatchEvent(new CustomEvent('mws:workspace-tab-v1'"));
 const code=extract(friend,"window.addEventListener('mws:workspace-tab-v1'", "document.addEventListener('input'");
 let handler,active=false,stops=0,binds=0,ui=0,scheduled=[];
 const doc={hidden:false};
 new Function('window','document','stopActiveRefresh','activeFriendRoot','bindFriendGridObserver','scheduleUi','scheduleActiveRefresh',code)({addEventListener:(_,fn)=>handler=fn},doc,()=>stops++,()=>active,()=>binds++,()=>ui++,ms=>scheduled.push(ms));
 active=true;handler();assert.deepEqual(scheduled,[0]);assert.equal(binds,1);assert.equal(ui,1);
 active=false;handler();assert.equal(stops,2);assert.deepEqual(scheduled,[0]);
 active=true;doc.hidden=true;handler();assert.equal(stops,3);assert.deepEqual(scheduled,[0]);
});
