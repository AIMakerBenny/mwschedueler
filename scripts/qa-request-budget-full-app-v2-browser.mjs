import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,statSync} from 'node:fs';
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
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
const IMAGES={get:async key=>objects.has(key)?{body:new Uint8Array(png),size:png.length,httpEtag:'"fixture-'+key+'"',writeHttpMetadata:h=>h.set('content-type','image/png')}:null,head:async key=>objects.has(key)?{size:png.length}:null,put:async key=>objects.set(key,true),delete:async key=>objects.delete(key),list:async()=>({objects:[],truncated:false})};
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.gif':'image/gif'};
const ASSETS={fetch:async req=>{const u=new URL(req.url),name=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1)),file=path.resolve(root,name);if(!file.startsWith(root)||!statSafe(file))return new Response('not found',{status:404});return new Response(readFileSync(file),{headers:{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'public, max-age=3600'}})}};
function statSafe(file){try{return statSync(file).isFile()}catch{return false}}
const env={DB,IMAGES,ASSETS,MWS_ENV:'local-qa'};
const upstream=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async input=>{
 const u=new URL(typeof input==='string'?input:input.url||input.href);upstream.push(u.hostname+u.pathname);
 if(u.hostname==='api-channel.sooplive.co.kr')return Response.json({data:{}});
 if(u.hostname==='chapi.sooplive.co.kr'){const page=Number(u.searchParams.get('page')||1),post=Number(u.pathname.split('/').at(-2));return Response.json({data:[{title_no:post,user_id:page===1&&post===1?'mawang0216':'user'+post+'_'+page,p_comment_no:page,user_nick:'Fixture',like_cnt:post*10+page,comment:'fixture'}],meta:{last_page:post===1?3:4,total:post===1?3:4,current_page:page}})}
 if(u.hostname.startsWith('liveimg.'))return new Response(png,{headers:{'content-type':'image/png'}});
 if(u.hostname==='live.sooplive.com')return new Response('[]',{headers:{'content-type':'application/json'}});
 return new Response('{}',{status:404,headers:{'content-type':'application/json'}});
};
const ctx={waitUntil:p=>void Promise.resolve(p).catch(()=>{}),passThroughOnException(){}};
const base='http://127.0.0.1';
const health=await worker.fetch(new Request(base+'/api/health'),env,ctx);assert.equal(health.status,200,await health.text());
const contacts=Array.from({length:200},(_,i)=>{const id='qa'+i,token=String(i+1).padStart(32,'0');objects.set('contacts/'+id+'/v1-'+token,true);db.prepare('INSERT INTO image_sources(kind,item_key,source_url,version,content_type) VALUES(?,?,?,?,?)').run('contact',id,'mws-r2:'+token,1,'image/png');return{id,name:'Fixture '+i,stationUrl:'https://bj.sooplive.co.kr/'+id,favorite:i<13,image:'/media/contact/'+id+'?v=1&h='+token+'&r=2',labels:[],pendingSetup:false}});
const achievementCards=Array.from({length:26},(_,i)=>{const id='card'+i,frontImageId='image'+i;objects.set('achievements/'+frontImageId,true);return{id,frontImageId,order:i,gameName:'Fixture',contentName:'Card '+i,description:'Fixture only'}});
const day=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const parts={core:{version:52,categories:[],timezones:[],contentGroups:[],gameLibrary:[],achievementCards,contentApplications:[]},events:[{id:'fixture-event',title:'Fixture event',date:day,start:'12:00',end:'13:00',participants:['qa0'],checklist:[]}],contacts,contactMeta:{contactTags:[],contactTagBanners:{},emoticons:[]},activity:{collaborations:[],todayPeopleByDate:{},todayPeopleManualByDate:{},targetList:[]},clipboard:{scheduleClipboard:[]},notebook:{memos:[],favoriteFolders:[]},posts:[],miniGames:{},wardogs:{schemaVersion:1,cards:[]}};
for(const [part,data] of Object.entries(parts))db.prepare("INSERT OR REPLACE INTO workspace_parts(scope,part,data,version) VALUES('public',?,?,1)").run(part,JSON.stringify(data));
const workerFirst=p=>config.assets.run_worker_first.some(pattern=>pattern.endsWith('*')?p.startsWith(pattern.slice(0,-1)):p===pattern);
let calls=[],errors=[];
const csp="default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; frame-src 'self' data: blob:; worker-src 'self' blob:; object-src 'none'";
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,base+':'+server.address().port),method=req.method||'GET',body=[];
  for await(const chunk of req)body.push(chunk);
  const request=new Request(u,{method,headers:req.headers,...(!['GET','HEAD'].includes(method)?{body:Buffer.concat(body)}:{})});
  const counted=workerFirst(u.pathname),response=await (counted?worker.fetch(request,env,ctx):ASSETS.fetch(request));
  if(counted)calls.push({path:u.pathname,method,status:response.status});
  res.statusCode=response.status;for(const [key,value] of response.headers)if(!['content-length','content-encoding','transfer-encoding'].includes(key))res.setHeader(key,value);
  if(u.pathname==='/'||u.pathname==='/index.html')res.setHeader('content-security-policy',csp);
  res.end(method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
 }catch(e){errors.push(String(e));res.writeHead(500).end('fixture error')}
});
const dir=mkdtempSync(path.join(tmpdir(),'mws-full-request-'));let browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,attempts=160){for(let i=0;i<attempts;i++){if(await fn())return;await pause(100)}throw Error(label)}
const summary=list=>Object.fromEntries([...new Set(list.map(r=>r.path.replace(/^\/media\/contact\/.*/,'/media/contact/*').replace(/^\/media\/achievement\/.*/,'/media/achievement/*')))].sort().map(p=>[p,list.filter(r=>r.path.replace(/^\/media\/contact\/.*/,'/media/contact/*').replace(/^\/media\/achievement\/.*/,'/media/achievement/*')===p).length]));
const common=r=>r.path==='/api/calendar-startup'||r.path==='/api/manifest'||r.path==='/api/bootstrap'||r.path==='/api/parts-batch'||r.path.startsWith('/api/parts/');
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await launchCalendarBrowser(dir);
 await browser.navigate(base+':'+server.address().port+'/',1366,768);
 await until(()=>browser.evaluate("(()=>{document.querySelector('#mwsAnnouncementDialog[open] .mws-notice-close')?.click();if(document.body.classList.contains('mws-gated')){document.querySelector('#mwsModePublic')?.click();document.querySelector('#mwsLoginSubmit')?.click()}return !!window.__mwsAppReadyV130&&document.body.dataset.mwsMode==='public'&&!document.body.classList.contains('mws-gated')&&!document.body.classList.contains('mws-app-loading')})()"),'Full app public readiness');
 await pause(1800);
 const startup=calls.slice();console.log('FULL_APP_STARTUP '+JSON.stringify(summary(startup)));
 assert.deepEqual(startup.filter(common).map(r=>r.path),['/api/calendar-startup','/api/parts-batch']);
 const routes=['calendar','contacts','dashboard','memos','careerTimeline','achievements','mawangArchive','gameLadder','gameMultiDraw','contentPlanner','toolTier','toolMatrix','toolRelations','settings','calendar'];
 const nav=async list=>browser.evaluate('(async()=>{for(const id of '+JSON.stringify(list)+'){window.setTab(id);await new Promise(r=>setTimeout(r,120));if(!document.getElementById(id)?.classList.contains("active"))throw Error("route "+id)}return true})()');
 let before=calls.length;await nav(routes);await pause(700);const cold=calls.slice(before);console.log('FULL_APP_COLD_NAV '+JSON.stringify(summary(cold)));
 assert.equal(cold.filter(common).length,0);
 before=calls.length;await nav([...routes,...routes]);await pause(700);const warm=calls.slice(before);console.log('FULL_APP_WARM_NAV '+JSON.stringify(summary(warm)));
 assert.equal(warm.filter(common).length,0);
 assert.equal(warm.filter(r=>r.path.startsWith('/media/achievement/')).length,0);
 assert.equal(warm.filter(r=>r.path.startsWith('/media/contact/')).length,0);
 assert.equal(warm.filter(r=>r.path==='/api/soop/live-batch').length,0);
 before=calls.length;await nav(['contacts','friendFinder']);await pause(3000);await nav(['calendar']);await pause(500);const live=calls.slice(before);console.log('FULL_APP_FRIEND_NAV '+JSON.stringify(summary(live)));
 assert(live.filter(r=>r.path==='/api/soop/live-batch').length>=1&&live.filter(r=>r.path==='/api/soop/live-batch').length<=2,JSON.stringify(summary(live)));
 assert.equal(live.filter(r=>r.path==='/api/soop/proxy').length,0);
 before=calls.length;await pause(1200);const idle=calls.slice(before);assert.equal(idle.filter(common).length,0);assert.equal(idle.filter(r=>r.path==='/api/soop/live-batch').length,0);
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
 console.log('FULL_APP_APPLICATION_SNAPSHOT_OK '+JSON.stringify({activeSync:1,archivedApplicants:7,expiredSync:0}));
 assert.equal(errors.length,0,JSON.stringify(errors));
 console.log('FULL_APP_REQUEST_BUDGET_OK '+JSON.stringify({startup:summary(startup),cold:summary(cold),warm:summary(warm),friend:summary(live),idle:summary(idle),upstreamSimulated:upstream.length}));
}finally{await browser?.close();await new Promise(r=>server.close(r));db.close();globalThis.fetch=originalFetch;rmSync(dir,{recursive:true,force:true})}
