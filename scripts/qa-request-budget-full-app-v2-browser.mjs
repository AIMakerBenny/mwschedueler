import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,statSync} from 'node:fs';
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSession} from './qa-request-budget-session.mjs';
import worker from '../src/cf-v111-entry.js';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Real HTML, browser scripts and Worker route chain; all data and upstream
// responses are synthetic. Neither Cloudflare nor SOOP is contacted.
const root=fileURLToPath(new URL('../',import.meta.url));
const config=JSON.parse(readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
const db=new DatabaseSync(':memory:');
function statement(sql,args=[]){return{bind:(...args)=>statement(sql,args),first:async()=>db.prepare(sql).get(...args)||null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>{const r=db.prepare(sql).run(...args);return{success:true,meta:{changes:r.changes}}}}}
const DB={prepare:sql=>statement(sql),batch:async statements=>{db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results}catch(e){db.exec('ROLLBACK');throw e}}};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf2sAAAAASUVORK5CYII=','base64');
const objects=new Map();
const IMAGES={get:async key=>objects.has(key)?{body:new Uint8Array(png),size:png.length,httpEtag:'"fixture-'+key+'"',writeHttpMetadata:h=>h.set('content-type','image/png')}:null,head:async key=>objects.has(key)?{size:png.length}:null,put:async key=>{objects.set(key,true);return {key,uploaded:new Date(),size:png.length,etag:"a".repeat(32)}},delete:async key=>objects.delete(key),list:async()=>({objects:[],truncated:false})};
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.gif':'image/gif'};
const ASSETS={fetch:async req=>{const u=new URL(req.url),name=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1)),file=path.resolve(root,name);if(!file.startsWith(root)||!statSafe(file))return new Response('not found',{status:404});return new Response(readFileSync(file),{headers:{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'public, max-age=3600'}})}};
function statSafe(file){try{return statSync(file).isFile()}catch{return false}}
const env={DB,IMAGES,ASSETS,MWS_ENV:'local-qa'};
const useCdn=process.env.MWS_QA_MEDIA_CDN==='1',cdnCalls=[];
let cdnOrigin='';
const cdnServer=createServer((req,res)=>{
 const key=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname.slice(1));
 cdnCalls.push(key);
 if(!objects.has(key)||key.startsWith('contacts/qa0/')||key==='achievements/image0'){res.writeHead(404,{'access-control-allow-origin':'*'}).end();return}
 res.writeHead(200,{'content-type':'image/png','access-control-allow-origin':'*','cache-control':'public,max-age=3600'});
 res.end(req.method==='HEAD'?undefined:png);
});
const featureOnly=process.env.MWS_QA_FEATURES_ONLY==='1';
const scale=Number(process.env.MWS_QA_SCALE_CONTACTS||0),scalePosts=scale>=500?50:10;
assert(!scale||[100,300,500,1000].includes(scale),'Explicit synthetic scale only');
const upstream=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async input=>{
 const u=new URL(typeof input==='string'?input:input.url||input.href);upstream.push(u.hostname+u.pathname);
 if(u.hostname==='api-channel.sooplive.co.kr'){if(featureOnly)await new Promise(resolve=>setTimeout(resolve,250));return Response.json({data:{}})}
 if(u.hostname==='store.steampowered.com')return new Response('<a data-ds-appid="123" href="https://store.steampowered.com/app/123/"><div class="match_name">Fixture Steam Game</div></a>',{headers:{'content-type':'text/html'}});
 if(u.hostname==='chapi.sooplive.co.kr'&&u.pathname.endsWith('/board/'))return Response.json({data:[],notice_data:[]});
 if(u.hostname==='chapi.sooplive.co.kr'){const page=Number(u.searchParams.get('page')||1),post=Number(u.pathname.split('/').at(-2));return Response.json({data:[{title_no:post,user_id:page===1&&post===1?'mawang0216':'user'+post+'_'+page,p_comment_no:page,user_nick:'Fixture',like_cnt:post*10+page,comment:'fixture'}],meta:{last_page:post>=100?1:post===1?3:4,total:post>=100?1:post===1?3:4,current_page:page}})}
 if(u.hostname.startsWith('liveimg.'))return new Response(png,{headers:{'content-type':'image/png'}});
 if(u.hostname==='live.sooplive.com')return new Response('[]',{headers:{'content-type':'application/json'}});
 return new Response('{}',{status:404,headers:{'content-type':'application/json'}});
};
const ctx={waitUntil:p=>void Promise.resolve(p).catch(()=>{}),passThroughOnException(){}};
const base='http://127.0.0.1';
const health=await worker.fetch(new Request(base+'/api/health'),env,ctx);assert.equal(health.status,200,await health.text());
const contacts=Array.from({length:scale||200},(_,i)=>{const id='qa'+i,token=String(i+1).padStart(32,'0');objects.set('contacts/'+id+'/v1-'+token,true);db.prepare('INSERT INTO image_sources(kind,item_key,source_url,version,content_type) VALUES(?,?,?,?,?)').run('contact',id,'mws-r2:'+token,1,'image/png');return{id,name:'Fixture '+i,stationUrl:'https://bj.sooplive.co.kr/'+id,favorite:i<(scale?({100:12,300:36,500:100,1000:100}[scale]):featureOnly?73:13),image:'/media/contact/'+id+'?v=1&h='+token+'&r=2',labels:[],pendingSetup:false}});
const achievementCards=Array.from({length:scale?({100:50,300:100,500:300,1000:300}[scale]):26},(_,i)=>{const id='card'+i,frontImageId='image'+i;objects.set('achievements/'+frontImageId,true);return{id,frontImageId,order:i,gameName:'Fixture',contentName:'Card '+i,description:'Fixture only'}});
const day=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const fixturePosts=scale?Array.from({length:scalePosts},(_,i)=>({id:'scale-post-'+i,name:'Fixture post '+i,nameManual:true,bjId:'host'+i,postNo:String(i+100),url:'https://www.sooplive.com/station/host'+i+'/post/'+(i+100),lastSyncAt:new Date().toISOString(),comments:Array.from({length:20},(_,j)=>({id:'p'+i+'-c'+j,commentNo:String(j+1),userId:'qa'+((i*20+j)%scale),name:'Fixture '+((i*20+j)%scale),comment:'Synthetic applicant',regDate:'2026-11-20T00:00:00Z',status:'pending'}))})):[];
const parts={core:{version:52,categories:[],timezones:[],contentGroups:[],gameLibrary:[],achievementCards,contentApplications:[]},events:[{id:'fixture-event',title:'Fixture event',date:day,start:'12:00',end:'13:00',participants:['qa0'],checklist:[]}],contacts,contactMeta:{contactTags:[],contactTagBanners:{},emoticons:[]},activity:{collaborations:[],todayPeopleByDate:{},todayPeopleManualByDate:{},targetList:[]},clipboard:{scheduleClipboard:[]},notebook:{memos:[],favoriteFolders:[]},posts:fixturePosts,miniGames:{},wardogs:{schemaVersion:1,cards:[]}};
for(const [part,data] of Object.entries(parts))db.prepare("INSERT OR REPLACE INTO workspace_parts(scope,part,data,version) VALUES('public',?,?,1)").run(part,JSON.stringify(data));
const workerFirst=p=>config.assets.run_worker_first.some(pattern=>pattern.endsWith('*')?p.startsWith(pattern.slice(0,-1)):p===pattern);
let calls=[],errors=[],arrivals=[];
const csp="default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; frame-src 'self' data: blob:; worker-src 'self' blob:; object-src 'none'";
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,base+':'+server.address().port),method=req.method||'GET',body=[];
  for await(const chunk of req)body.push(chunk);
  const request=new Request(u,{method,headers:req.headers,...(!['GET','HEAD'].includes(method)?{body:Buffer.concat(body)}:{})});
  const counted=workerFirst(u.pathname);if(counted)arrivals.push({path:u.pathname,method,at:Date.now()});
  const response=await (counted?worker.fetch(request,env,ctx):ASSETS.fetch(request));
  if(counted)calls.push({path:u.pathname,method,status:response.status,...(u.pathname==='/api/save'&&method==='POST'?{parts:Object.keys(JSON.parse(Buffer.concat(body).toString()).parts||{})}:{})});
  res.statusCode=response.status;for(const [key,value] of response.headers)if(!['content-length','content-encoding','transfer-encoding'].includes(key))res.setHeader(key,value);
  if(u.pathname==='/'||u.pathname==='/index.html')res.setHeader('content-security-policy',useCdn?csp.replace("connect-src 'self'","connect-src 'self' "+cdnOrigin).replace("img-src 'self'","img-src 'self' "+cdnOrigin):csp);
  res.end(method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
 }catch(e){errors.push(String(e));res.writeHead(500).end('fixture error')}
});
const dir=mkdtempSync(path.join(tmpdir(),'mws-full-request-'));let browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,attempts=160){for(let i=0;i<attempts;i++){if(await fn())return;await pause(100)}throw Error(label)}
const summary=list=>Object.fromEntries([...new Set(list.map(r=>r.path.replace(/^\/media\/contact\/.*/,'/media/contact/*').replace(/^\/media\/achievement\/.*/,'/media/achievement/*')))].sort().map(p=>[p,list.filter(r=>r.path.replace(/^\/media\/contact\/.*/,'/media/contact/*').replace(/^\/media\/achievement\/.*/,'/media/achievement/*')===p).length]));
const common=r=>r.path==='/api/calendar-startup'||r.path==='/api/manifest'||r.path==='/api/bootstrap'||r.path==='/api/parts-batch'||r.path.startsWith('/api/parts/');
try{
 if(useCdn){await new Promise(r=>cdnServer.listen(0,'127.0.0.1',r));cdnOrigin=base+':'+cdnServer.address().port;env.MWS_PUBLIC_MEDIA_CDN_ORIGIN=cdnOrigin}
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await launchCalendarBrowser(dir);
 await browser.navigate(base+':'+server.address().port+'/',1366,768);
 await until(()=>browser.evaluate("(()=>{document.querySelector('#mwsAnnouncementDialog[open] .mws-notice-close')?.click();if(document.body.classList.contains('mws-gated')){document.querySelector('#mwsModePublic')?.click();document.querySelector('#mwsLoginSubmit')?.click()}return !!window.__mwsAppReadyV130&&document.body.dataset.mwsMode==='public'&&!document.body.classList.contains('mws-gated')&&!document.body.classList.contains('mws-app-loading')})()"),'Full app public readiness');
 await until(()=>browser.evaluate('!!window.__mwsMediaPreloadPromiseV1'),'Media preloader scheduled');
 await browser.evaluate('window.__mwsMediaPreloadPromiseV1.then(()=>true)');
 await pause(1800);
 const startup=calls.slice();console.log('FULL_APP_STARTUP '+JSON.stringify(summary(startup)));
 assert.equal(startup.filter(r=>r.path==='/api/mawang-profile').length,0);
 assert.deepEqual(startup.filter(common).map(r=>r.path),['/api/calendar-startup','/api/parts-batch']);
 assert.equal(startup.filter(r=>['/assets/cloud-v5.5.js','/assets/cloud-v1.1.js','/assets/boss-manager-v121.js'].includes(r.path)).length,0);
 assert.equal(await browser.evaluate("!!window.__mwsCloudV110Loaded"),true);
 if(!useCdn){
  await until(()=>browser.evaluate('!!navigator.serviceWorker.controller'),'Media service worker control');
  const url=contacts[0].image;
  await until(()=>browser.evaluate('(async()=>!!await (await caches.open("mws-public-versioned-media-v1")).match('+JSON.stringify(url)+'))()'),'Versioned portrait persisted');
 }
 const routes=['calendar','contacts','dashboard','memos','careerTimeline','achievements','mawangArchive','gameLadder','gameMultiDraw','contentPlanner','toolTier','toolMatrix','toolRelations','settings','calendar'];
 const nav=async list=>browser.evaluate('(async()=>{for(const id of '+JSON.stringify(list)+'){window.setTab(id);await new Promise(r=>setTimeout(r,450));if(!document.getElementById(id)?.classList.contains("active"))throw Error("route "+id)}return true})()');
 let before=calls.length;
 if(scale){
  // A warm-cache fixture is created through actual same-origin browser reads.
  // No synthetic production data or external traffic.
  const media=contacts.map(c=>c.image);
  for(let i=0;i<media.length;i+=25){
   const group=media.slice(i,i+25);
   assert(await browser.evaluate('(async()=>{const urls='+JSON.stringify(group)+';await Promise.all(urls.map(async url=>{const r=await fetch(url,{cache:"reload"});if(!r.ok||!(await r.blob()).size)throw Error("Portrait missing")}));return true})()'));
  }
  await until(async()=>await browser.evaluate('(async()=> (await (await caches.open("mws-public-versioned-media-v1")).keys()).length)()')>=scale,'Synthetic portraits persisted',300);
  await browser.evaluate('(async()=>{const ids='+JSON.stringify(achievementCards.map(c=>c.frontImageId))+';for(let i=0;i<ids.length;i+=20){const blobs=await Promise.all(ids.slice(i,i+20).map(id=>window.mwsAchievementMediaV1.getBlob(id)));if(blobs.some(b=>!b?.size))throw Error("Achievement missing")}return true})()');
  await pause(600);
  const warmStart=calls.length,upstreamStart=upstream.length;
  const measured=[];
  for(let round=1;round<=3;round++){
   const at=performance.now();
   await nav(['contacts']);
   const result=await browser.evaluate(`(()=>{const search=document.getElementById('contactSearch'),sort=document.getElementById('contactSort');
    if(search){search.value='Fixture 1';search.dispatchEvent(new Event('input',{bubbles:true}));search.value='';search.dispatchEvent(new Event('input',{bubbles:true}))}
    if(sort?.options.length>1){const initial=sort.value;sort.selectedIndex=1;sort.dispatchEvent(new Event('change',{bubbles:true}));sort.value=initial;sort.dispatchEvent(new Event('change',{bubbles:true}))}
    const root=document.getElementById('contactGrid');if(root)root.scrollTop=150;
    return {contacts:data.contacts.length,posts:data.posts.length,cards:root?.querySelectorAll('[data-contact-id]').length||0}})()`);
   assert.equal(result.contacts,scale);assert.equal(result.posts,scalePosts);
   await browser.evaluate("window.openContact('qa0')");
   await until(()=>browser.evaluate("document.getElementById('contactModal')?.classList.contains('open')"),'Contact detail');
   await browser.evaluate("document.querySelector('[data-close=contactModal]').click()");
   await nav(['posts']);
   for(const id of ['scale-post-0','scale-post-'+(scalePosts-1)]){
    await browser.evaluate('window.selectPost('+JSON.stringify(id)+')');
    await pause(100);
   }
   await nav(['achievements','mawangArchive','calendar']);
   await pause(500);measured.push({round,elapsedIncludingWaitMs:Math.round(performance.now()-at),...result});
  }
  const warm=calls.slice(warmStart);
  assert.equal(warm.filter(common).length,0,'Warm data reloaded');
  assert.equal(warm.filter(r=>r.path.startsWith('/api/soop/')).length,0,'Read-only views fetched SOOP');
  assert.equal(warm.filter(r=>r.path.startsWith('/media/contact/')||r.path.startsWith('/media/achievement/')).length,0,'Warm media reloaded');
  assert.equal(upstream.length,upstreamStart,'Read-only views requested upstream data');
  console.log('V3_SCALE_WARM_OK '+JSON.stringify({contacts:scale,posts:scalePosts,applicants:scalePosts*20,achievementImages:achievementCards.length,rounds:measured,worker:summary(warm)}));
  // Actual browser multi-tab readiness, with three/five concurrent tabs.
  const tabs=scale>=500?5:3;
  await pause(8200);
  const at=calls.length;
  const siblings=await Promise.all(Array.from({length:tabs},()=>browser.sibling(base+':'+server.address().port+'/')));
  await until(async()=>{const ready=await Promise.all(siblings.map(tab=>tab.evaluate("!!window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')&&data.contacts.length==="+scale).catch(()=>false)));return ready.every(Boolean)},'Concurrent scaled tabs ready',300);
  const startupCalls=calls.slice(at).filter(r=>r.path==='/api/calendar-startup').length;
  assert(startupCalls<=1,'Duplicate scaled startup: '+startupCalls);
  console.log('V3_SCALE_TABS_OK '+JSON.stringify({contacts:scale,tabs,startupCalls}));
  for(const tab of siblings)await browser.closeTarget(tab.targetId);
  assert.equal(errors.length,0,JSON.stringify(errors));
 }else if(featureOnly){
  // Start 73 favorites (seven batches) and leave before the first wave ends.
  // Count at HTTP arrival, not response completion.
  const friendCount=()=>arrivals.filter(r=>r.path==='/api/soop/live-batch').length;
  const baseFriend=friendCount();
  await browser.evaluate("window.setTab('friendFinder');true");
  await until(()=>Promise.resolve(friendCount()>baseFriend),'Friend request began');
  await browser.evaluate("window.setTab('calendar');true");
  await until(()=>browser.evaluate("document.querySelector('#calendar').classList.contains('active')"),'Calendar after friend exit');
  const dispatched=friendCount();
  await pause(2300);
  assert.equal(friendCount(),dispatched,'New friend requests after leaving view');
  assert(dispatched-baseFriend>=1&&dispatched-baseFriend<=3,'Unexpected initial friend batch wave: '+(dispatched-baseFriend));
  console.log('V3_FRIEND_EXIT_OK '+JSON.stringify({favorites:73,possibleBatches:7,dispatched:dispatched-baseFriend,afterExit:0}));
  // Test an actual hidden browser document, not a synthetic visibility flag.
  await browser.openBackgroundTestTab();
  await until(()=>browser.evaluate("document.visibilityState==='hidden'"),'Browser tab hidden');
  const hiddenBefore=friendCount();
  await browser.evaluate("window.setTab('friendFinder');true");
  await pause(32000);
  assert.equal(friendCount(),hiddenBefore,'Hidden friend page emitted live request');
  console.log('V3_FRIEND_HIDDEN_OK '+JSON.stringify({seconds:32,requests:0}));
  // Closing the browser avoids artificially changing document.visibilityState.
  await browser.close();browser=await launchCalendarBrowser(dir);
  await browser.navigate(base+':'+server.address().port+'/',1366,768);
  await until(()=>browser.evaluate("!!window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')"),'Public restart ready');
  const campaign={id:'app-qa',title:'Application fixture',deadline:new Date(Date.now()+3600000).toISOString(),entries:[{url:'https://www.sooplive.com/station/host1/post/1'},{url:'https://www.sooplive.com/station/host2/post/2'}]};
  parts.core.contentApplications=[campaign];
  db.prepare("UPDATE workspace_parts SET data=?,version=version+1 WHERE scope='public' AND part='core'").run(JSON.stringify(parts.core));
  await browser.evaluate('(()=>{data.contentApplications='+JSON.stringify([campaign])+';window.dispatchEvent(new CustomEvent("mawang:datachange"));return true})()');
  const syncCount=()=>arrivals.filter(r=>r.path==='/api/soop/application-sync').length;
  const startSync=syncCount(),startUpstream=upstream.length;
  await nav(['contentApplications']);
  await until(()=>browser.evaluate("!!document.querySelector('[data-ca-open=\"app-qa\"]')&&document.querySelector('[data-ca-open=\"app-qa\"]').innerText.includes('7명')"),'Server aggregated campaign list');
  assert.equal(syncCount()-startSync,1,'Campaign initial request count');
  const commentCount=upstream.slice(startUpstream).filter(x=>x.startsWith('chapi.sooplive.co.kr')).length;
  assert.equal(commentCount,7,'Seven simulated comment pages');
  await browser.evaluate("document.querySelector('[data-ca-open=\"app-qa\"]').click()");
  await until(()=>browser.evaluate("document.querySelector('[data-ca-stat=likes]')?.textContent==='11'"),'Campaign likes');
  const freshBefore=syncCount();
  await browser.navigate(base+':'+server.address().port+'/',1366,768);
  await until(()=>browser.evaluate("!!window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')"),'Fresh snapshot reload ready');
  await nav(['contentApplications']);
  await until(()=>browser.evaluate("document.querySelector('[data-ca-open=\"app-qa\"]')?.innerText.includes('7명')"),'Fresh server snapshot rendered');
  await pause(1500);
  assert.equal(syncCount(),freshBefore,'Fresh server snapshot triggered another sync');
  await browser.evaluate("document.querySelector('[data-ca-open=\"app-qa\"]').click()");
  await until(()=>browser.evaluate("document.querySelector('[data-ca-stat=likes]')?.textContent==='11'"),'Fresh snapshot likes');
  await browser.evaluate("document.querySelector('[data-ca-refresh]').click()");
  await until(()=>Promise.resolve(syncCount()===freshBefore+1),'Manual sync still works');
  await until(()=>browser.evaluate("!document.querySelector('[data-ca-refresh]')?.disabled"),'Manual refresh settled');
  campaign.deadline=new Date(Date.now()-1000).toISOString();
  db.prepare("UPDATE workspace_parts SET data=?,version=version+1 WHERE scope='public' AND part='core'").run(JSON.stringify(parts.core));
  await browser.navigate(base+':'+server.address().port+'/',1366,768);
  await until(()=>browser.evaluate("!!window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')"),'Expired snapshot reload ready');
  const expiredBefore=syncCount();
  await nav(['contentApplications']);
  await browser.evaluate("document.querySelector('[data-ca-open=\"app-qa\"]').click()");
  await until(()=>browser.evaluate("document.querySelector('#caDetail').classList.contains('is-closed')&&document.querySelector('[data-ca-stat=likes]')?.textContent==='11'"),'Expired data and likes retained');
  await pause(1200);
  assert.equal(syncCount(),expiredBefore,'Expired campaign triggered sync');
  console.log('V3_APPLICATION_SNAPSHOT_OK '+JSON.stringify({sources:2,applicants:7,initialWorker:1,simulatedUpstreamPages:commentCount,freshReloadWorker:0,manualWorker:1,expiredWorker:0}));
  // Populate a notice board only in the local workspace, without saving.
  await nav(['calendar']);
  const noticeOffset=upstream.length;
  await browser.evaluate("data.dashboardNoticeUrl='https://www.sooplive.com/station/fixture/board/123';renderDashboard();true");
  await pause(600);
  const boardCount=()=>upstream.slice(noticeOffset).filter(x=>x==='chapi.sooplive.co.kr/api/fixture/board/').length;
  assert.equal(boardCount(),0,'Hidden dashboard fetched notices');
  await nav(['dashboard']);
  await until(()=>browser.evaluate("document.getElementById('dashboardNoticeStatus')?.textContent.includes('최근 조회')"),'Empty notice snapshot rendered');
  assert.equal(boardCount(),1);
  await nav(['calendar','dashboard','calendar','dashboard']);
  assert.equal(boardCount(),1,'Empty notice result refetched');
  await browser.evaluate("document.getElementById('dashboardNoticeRefreshBtn').click()");
  await until(()=>Promise.resolve(boardCount()===2),'Manual notice refresh');
  console.log('V3_NOTICE_CACHE_OK '+JSON.stringify({hidden:0,initial:1,reentry:0,manual:1}));
  await nav(['calendar']);
  await browser.evaluate("window.openSteamGamePickerV111('fixture-event');true");
  await until(()=>browser.evaluate("document.getElementById('eventModal')?.classList.contains('open')&&!!document.getElementById('eventGameSearchV112')"),'Steam editor opened');
  const steamCount=()=>arrivals.filter(r=>r.path==='/api/steam/search').length;
  const steamBefore=steamCount();
  await browser.evaluate("(()=>{const input=document.getElementById('eventGameSearchV112');input.value='Fixture';input.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('eventGameSearchBtnV112').click();return true})()");
  await until(()=>browser.evaluate("document.getElementById('eventGameResultsV112')?.innerText.includes('Fixture Steam Game')"),'Steam search rendered');
  await pause(550);assert.equal(steamCount(),steamBefore+1);
  await browser.evaluate("document.getElementById('eventGameSearchBtnV112').click()");
  await pause(550);assert.equal(steamCount(),steamBefore+1,'Cached search sent a request');
  await browser.evaluate("(()=>{const input=document.getElementById('eventGameSearchV112');input.value='Abandoned';input.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('eventModal').classList.remove('open');return true})()");
  await pause(600);assert.equal(steamCount(),steamBefore+1,'Closed editor sent a scheduled search');
  console.log('V3_STEAM_SEARCH_OK '+JSON.stringify({initial:1,duplicateClick:0,cached:0,closed:0}));
  const group=Array.from({length:60},(_,i)=>({id:'group-'+i,title:'Group '+i,deadline:new Date(Date.now()+(i<10?3600000:-3600000)).toISOString(),entries:[{url:'https://www.sooplive.com/station/group'+i+'/post/'+(100+i)}]}));
  parts.core.contentApplications=group;
  db.prepare("UPDATE workspace_parts SET data=?,version=version+1 WHERE scope='public' AND part='core'").run(JSON.stringify(parts.core));
  await browser.evaluate('(()=>{data.contentApplications='+JSON.stringify(group)+';window.dispatchEvent(new CustomEvent("mawang:datachange"));return true})()');
  const batchBefore=arrivals.length,upBefore=upstream.length;
  await nav(['contentApplications']);
  await until(()=>browser.evaluate("Array.from(document.querySelectorAll('[data-ca-open]')).filter(el=>!el.classList.contains('is-closed')&&el.innerText.includes('1명')).length===10"),'Ten batched campaigns rendered',300);
  const batchRows=arrivals.slice(batchBefore).filter(r=>r.path==='/api/soop/application-batch'||r.path==='/api/soop/application-sync');
  assert.equal(batchRows.length,2,'Ten one-page campaigns should use two bounded batch requests');assert(batchRows.every(r=>r.path==='/api/soop/application-batch'));
  const groupPages=upstream.slice(upBefore).filter(x=>x.startsWith('chapi.sooplive.co.kr'));
  assert.equal(groupPages.length,10);assert(groupPages.every(x=>Number(x.split('/').at(-2))<110),'Expired campaign fetched');
  await nav(['calendar','contentApplications','calendar','contentApplications']);
  assert.equal(arrivals.slice(batchBefore).filter(r=>r.path==='/api/soop/application-batch'||r.path==='/api/soop/application-sync').length,2);
  console.log('V3_APPLICATION_BATCH_OK '+JSON.stringify({active:10,expired:50,worker:2,upstream:10,warm:0,expiredRequests:0}));
  // One public tab observes a verified Admin save via IndexedDB; a second
  // public tab has a local edit and must retain it, with no server read.
  await nav(['calendar']);
  const address=base+':'+server.address().port+'/';
  const clean=await browser.sibling(address),editor=await browser.sibling(address);
  const publicReady="!!window.__mwsAppReadyV130&&document.body.dataset.mwsMode==='public'&&!document.body.classList.contains('mws-app-loading')&&!document.body.classList.contains('mws-gated')";
  await until(async()=>await clean.evaluate(publicReady)&&await editor.evaluate(publicReady),'Public peer tabs ready',300);
  await pause(1500);
  await browser.evaluate("data.events[0].title='Local unsaved fixture edit';true");
  await editor.evaluate("document.querySelector('#mwsChangeModeBtn').click()");
  await until(()=>editor.evaluate("document.querySelector('#mwsLoginForm').dataset.mode==='admin'"),'Peer admin login form');
  await editor.evaluate("document.querySelector('#mwsLoginId').value='Majoku0216';document.querySelector('#mwsLoginPw').value='local-fixture-only';document.querySelector('#mwsLoginForm').requestSubmit()");
  await until(()=>editor.evaluate("!!window.__mwsAppReadyV130&&document.body.dataset.mwsMode==='admin'&&!document.body.classList.contains('mws-app-loading')&&!document.body.classList.contains('mws-gated')"),'Peer admin ready',300);
  await pause(1500);
  const peerOffset=calls.length;
  assert(await editor.evaluate("(async()=>{data.events[0].title='Confirmed peer event';window.saveData('peer fixture');return await window.mwsV55SaveNow()})()"));
  // Chromium background tabs can be hidden. Bring each to its foreground
  // before testing its visibility-gated, local-only application.
  await clean.evaluate("window.dispatchEvent(new CustomEvent('mws:workspace-tab-v1'));true");
  await until(()=>clean.evaluate("data.events[0].title==='Confirmed peer event'"),'Peer event from shared cache',200);
  await browser.evaluate("window.dispatchEvent(new CustomEvent('mws:workspace-tab-v1'));true");
  assert.equal(await browser.evaluate("data.events[0].title"),'Local unsaved fixture edit');
  await pause(300);
  const peerRows=calls.slice(peerOffset);
  assert.equal(peerRows.filter(r=>r.path==='/api/save').length,1);
  assert.equal(peerRows.filter(common).length,0,'Peer update issued a network read');
  console.log('V3_PEER_SAVE_OK '+JSON.stringify({writes:1,extraReads:0,cleanTabUpdated:true,localEditPreserved:true,worker:summary(peerRows)}));
  await browser.closeTarget(clean.targetId);await browser.closeTarget(editor.targetId);
  assert.equal(errors.length,0,JSON.stringify(errors));
 }else if(process.env.MWS_QA_LONG_IDLE==='1'||process.env.MWS_QA_SESSION==='1'){
  const mode=process.env.MWS_QA_IDLE_MODE||'public',visibility=process.env.MWS_QA_IDLE_VISIBILITY||'visible';
  if(mode==='admin'){
   await browser.evaluate("document.querySelector('#mwsChangeModeBtn').click()");
   await until(()=>browser.evaluate("document.querySelector('#mwsLoginForm').dataset.mode==='admin'"),'Admin login form');
   await browser.evaluate("document.querySelector('#mwsLoginId').value='Majoku0216';document.querySelector('#mwsLoginPw').value='local-fixture-only';document.querySelector('#mwsLoginForm').requestSubmit()");
   await until(()=>browser.evaluate("document.body.dataset.mwsMode==='admin'&&!document.body.classList.contains('mws-app-loading')&&!document.body.classList.contains('mws-gated')"),'Admin ready');
   await nav(['calendar']);await pause(3000);
  }
  if(process.env.MWS_QA_SESSION==='1'){await auditSession({browser,nav,calls,summary,until,mode});
   const ready=()=>until(()=>browser.evaluate("!!window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')&&document.body.dataset.mwsMode==="+JSON.stringify(mode)),'Reload with remembered mode');
   for(const action of ['reload','hard-reload','restart','new-tab','two-tabs']){
    // Force an independent concurrent-entry sample instead of relying on a previous
    // eight-second peer response. This delay is local QA only.
    if(action==='two-tabs'&&mode==='public')await pause(8200);
    const start=calls.length,url=base+':'+server.address().port+'/';
    if(action==='restart'){await browser.close();browser=await launchCalendarBrowser(dir);await browser.navigate(url,1366,768);await ready()}
    else if(action.endsWith('tab')||action.endsWith('tabs')){
     const ids=await Promise.all(Array.from({length:action==='two-tabs'?2:1},()=>browser.sibling(url)));
     // A shared startup response is allowed to produce no network request.
     // Verify that each actual tab is fully usable instead of counting requests
     // as a proxy for readiness.
     const expression="!!window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')&&!document.body.classList.contains('mws-gated')&&document.body.dataset.mwsMode==="+JSON.stringify(mode);
     await until(async()=>{const ready=await Promise.all(ids.map(tab=>tab.evaluate(expression).catch(()=>false)));return ready.every(Boolean)},'New tabs ready');
     const startupCalls=calls.slice(start).filter(r=>r.path==='/api/calendar-startup').length;
     console.log('NEW_TABS_READY '+JSON.stringify({mode,count:ids.length,startupCalls}));
     assert(startupCalls<=(mode==='public'?1:ids.length),'Duplicate startup requests: '+startupCalls);
     await pause(3500);for(const {targetId} of ids)await browser.closeTarget(targetId);
    }else{
     const beforeReload=await browser.evaluate('performance.timeOrigin');await browser.reload(action==='hard-reload');
     await until(async()=>{try{return await browser.evaluate('performance.timeOrigin')!==beforeReload}catch{return false}},'New document');await ready();
    }
    await pause(1500);console.log('REENTRY_AUDIT '+JSON.stringify({action,mode,worker:summary(calls.slice(start))}));
   }}else{
  if(visibility==='hidden')await browser.openBackgroundTestTab();
  if(visibility==='minimized')await browser.minimizeWindow();
  await until(()=>browser.evaluate('document.visibilityState').then(state=>state===(visibility==='minimized'?'hidden':visibility)),'Confirmed page visibility');
  before=calls.length;
  const started=performance.now();
  for(const minutes of [1,5,10,30,60]){
   await pause(Math.max(0,minutes*60000-(performance.now()-started)));
   console.log('CALENDAR_IDLE '+JSON.stringify({mode,visibility,minutes,elapsedMs:Math.round(performance.now()-started),worker:summary(calls.slice(before))}));
  }
  assert.deepEqual(calls.slice(before),[],'Idle calendar emitted a Worker request');
  console.log('LONG_IDLE_OK');
  }
 }else{
 const routeStats=[];
 for(const route of routes){const offset=calls.length;await nav([route]);const dom=await browser.evaluate("(()=>{const root=document.querySelector('.section.active');return {canonical:root?.querySelectorAll('img[src*=\"/media/contact/\"]').length||0,deferred:root?.querySelectorAll('img[data-mws-deferred-contact-src]').length||0,cdn:root?.querySelectorAll('img[data-mws-cdn-contact-source]').length||0}})()");routeStats.push({route,worker:summary(calls.slice(offset)),dom})}
 await pause(700);const cold=calls.slice(before);console.log('FULL_APP_COLD_NAV '+JSON.stringify(summary(cold)));console.log('FULL_APP_ROUTE_BREAKDOWN '+JSON.stringify(routeStats));
 assert.equal(cold.filter(common).length,0);
 if(useCdn){
  assert(cdnCalls.some(key=>key.startsWith('contacts/')),JSON.stringify(cdnCalls));
  assert(cdnCalls.some(key=>key.startsWith('achievements/')),JSON.stringify(cdnCalls));
  assert.equal(cold.filter(r=>r.path.startsWith('/media/contact/')&&r.path!=='/media/contact/qa0').length,0,'Successful CDN contact images must never hit Worker: '+JSON.stringify(routeStats));
  assert(cdnCalls.length>0);
  // A missing CDN object must still be displayed through the original Worker route.
  const blobSize=await browser.evaluate("(async()=>{const b=await window.mwsAchievementMediaV1.getBlob('image0');return b?.size||0})()");
  assert.equal(blobSize,png.length);
  assert(calls.some(r=>r.path==='/media/achievement/image0'));
  const canonical=contacts[0].image;
  assert.equal(await browser.evaluate("data.contacts.find(c=>c.id==='qa0').image"),canonical);
  await browser.evaluate("(()=>{const holder=document.createElement('div');holder.id='qa-cdn-fallback-contact';holder.style.cssText='position:fixed;top:10px;left:10px;width:40px;height:40px;z-index:9999';holder.innerHTML='<img width=40 height=40 '+mwsDeferredContactAttrsV1(data.contacts.find(c=>c.id==='qa0').image)+'>';document.body.appendChild(holder);return true})()");
  await until(()=>browser.evaluate("(()=>{const img=document.querySelector('#qa-cdn-fallback-contact img');return !!img&&img.complete&&img.naturalWidth>0&&img.getAttribute('src').startsWith('/media/contact/qa0?')})()"),'Contact CDN fallback displays original image');
  assert(cdnCalls.some(key=>key.startsWith('contacts/qa0/')));
  assert(calls.some(r=>r.path==='/media/contact/qa0'));
  await browser.evaluate("document.querySelector('#qa-cdn-fallback-contact')?.remove()");
  console.log('FULL_APP_CDN '+JSON.stringify({cdn:cdnCalls.length,workerContact:cold.filter(r=>r.path.startsWith('/media/contact/')).length,workerAchievement:cold.filter(r=>r.path.startsWith('/media/achievement/')).length}));
 }
 before=calls.length;await nav([...routes,...routes]);await pause(700);const warm=calls.slice(before);console.log('FULL_APP_WARM_NAV '+JSON.stringify(summary(warm)));
 assert.equal(warm.filter(common).length,0);
 assert.equal(warm.filter(r=>r.path.startsWith('/media/achievement/')).length,0);
 assert.equal(warm.filter(r=>r.path.startsWith('/media/contact/')).length,0);
 assert.equal(warm.filter(r=>r.path==='/api/soop/live-batch').length,0);
 before=calls.length;await nav(['contacts','friendFinder']);await pause(3000);await nav(['calendar']);await pause(500);const live=calls.slice(before);console.log('FULL_APP_FRIEND_NAV '+JSON.stringify(summary(live)));
 assert(live.filter(r=>r.path==='/api/soop/live-batch').length>=1&&live.filter(r=>r.path==='/api/soop/live-batch').length<=2,JSON.stringify(summary(live)));
 assert.equal(live.filter(r=>r.path==='/api/soop/proxy').length,0);
 before=calls.length;
 await pause(1200);
 const idle=calls.slice(before);assert.equal(idle.filter(common).length,0);assert.equal(idle.filter(r=>r.path==='/api/soop/live-batch').length,0);
 // Register a synthetic campaign after baseline navigation; the actual UI
 // module and Worker aggregate both posts and retain results across reload.
 const campaign={id:'app-qa',title:'Application fixture',deadline:new Date(Date.now()+3600000).toISOString(),entries:[{url:'https://www.sooplive.com/station/host1/post/1'},{url:'https://www.sooplive.com/station/host2/post/2'}]};
 parts.core.contentApplications=[campaign];
 db.prepare("UPDATE workspace_parts SET data=?,version=version+1 WHERE scope='public' AND part='core'").run(JSON.stringify(parts.core));
 await browser.evaluate('(()=>{data.contentApplications='+JSON.stringify([campaign])+';window.dispatchEvent(new CustomEvent("mawang:datachange"));return true})()');
 before=calls.length;await nav(['contentApplications']);
 await until(()=>browser.evaluate("!!document.querySelector('[data-ca-open=\"app-qa\"]')&&document.querySelector('[data-ca-open=\"app-qa\"]').innerText.includes('7명')"),'Server aggregated campaign list');
 const campaignCalls=calls.slice(before);assert.equal(campaignCalls.filter(r=>r.path==='/api/soop/application-sync').length,1);
 await browser.evaluate("document.querySelector('[data-ca-open=\"app-qa\"]').click()");
 await until(()=>browser.evaluate("document.querySelector('[data-ca-stat=likes]')?.textContent==='11'"),'Server archived likes');
 assert.equal(calls.slice(before).filter(r=>r.path==='/api/soop/application-sync').length,1);
 // Retroactive fixture deadline simulates the transition without another read.
 campaign.deadline=new Date(Date.now()-1000).toISOString();
 db.prepare("UPDATE workspace_parts SET data=?,version=version+1 WHERE scope='public' AND part='core'").run(JSON.stringify(parts.core));
 await browser.navigate(base+':'+server.address().port+'/',1366,768);
 await until(()=>browser.evaluate("!!window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')"),'Reload readiness');
 before=calls.length;await nav(['contentApplications']);
 await browser.evaluate("document.querySelector('[data-ca-open=\"app-qa\"]').click()");
 await until(()=>browser.evaluate("document.querySelector('#caDetail').classList.contains('is-closed')&&document.querySelector('[data-ca-stat=likes]')?.textContent==='11'"),'Expired snapshot restored');
 assert.equal(calls.slice(before).filter(r=>r.path.startsWith('/api/soop/application-sync')).length,0);
 if(!useCdn){
  await until(()=>browser.evaluate('!!navigator.serviceWorker.controller'),'Reload controlled');
  const url=contacts[0].image,beforeCacheRead=calls.length;
  assert.equal(await browser.evaluate('(async()=>{const r=await fetch('+JSON.stringify(url)+',{cache:"reload"});return r.ok&&!!(await r.blob()).size})()'),true);
  assert.equal(calls.slice(beforeCacheRead).filter(r=>r.path==='/media/contact/qa0').length,0,'Persisted portrait must not hit Worker after reload');
  assert.equal(await browser.evaluate('window.__mwsV55NetworkMetrics.requests.some(r=>r.type==="calendar-local-first-paint")'),true,'Complete public calendar cache painted before verification');
  console.log('FULL_APP_CACHE_FIRST_OK '+JSON.stringify({portraitReloadWorker:0,calendarLocalFirst:true}));
 }
 console.log('FULL_APP_APPLICATION_SNAPSHOT_OK '+JSON.stringify({activeSync:1,archivedApplicants:7,expiredSync:0}));
 assert.equal(errors.length,0,JSON.stringify(errors));
 console.log('FULL_APP_REQUEST_BUDGET_OK '+JSON.stringify({startup:summary(startup),cold:summary(cold),warm:summary(warm),friend:summary(live),idle:summary(idle),upstreamSimulated:upstream.length}));
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));if(cdnServer.listening)await new Promise(r=>cdnServer.close(r));db.close();globalThis.fetch=originalFetch;rmSync(dir,{recursive:true,force:true})}
