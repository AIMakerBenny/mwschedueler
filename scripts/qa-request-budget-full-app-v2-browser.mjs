import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSession} from './qa-request-budget-session.mjs';
import worker from '../src/cf-v111-entry.js';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
import {ROSTER as OP_ROSTER,rosterContactName} from '../assets/operation-m-model-v1.js';
const operationMQA=process.env.MWS_QA_OPERATION_M==='1';
const calendarVisualQA=process.env.MWS_QA_CALENDAR_VISUAL==='1';

// Real HTML, browser scripts and Worker route chain; all data and upstream
// responses are synthetic. Neither Cloudflare nor SOOP is contacted.
const root=process.env.MWS_QA_SOURCE_ROOT?path.resolve(process.env.MWS_QA_SOURCE_ROOT):fileURLToPath(new URL('../',import.meta.url));
const config=JSON.parse(readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
const db=new DatabaseSync(':memory:');
function statement(sql,args=[]){return{bind:(...args)=>statement(sql,args),first:async()=>db.prepare(sql).get(...args)||null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>{const r=db.prepare(sql).run(...args);return{success:true,meta:{changes:r.changes}}}}}
const DB={prepare:sql=>statement(sql),batch:async statements=>{db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results}catch(e){db.exec('ROLLBACK');throw e}}};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf2sAAAAASUVORK5CYII=','base64');
const objects=new Map();
const IMAGES={get:async key=>objects.has(key)?{body:new Blob([png]).stream(),size:png.length,httpEtag:'"fixture-'+key+'"',writeHttpMetadata:h=>h.set('content-type','image/png')}:null,head:async key=>objects.has(key)?{size:png.length}:null,put:async key=>{objects.set(key,true);return {key,uploaded:new Date(),size:png.length,etag:"a".repeat(32)}},delete:async key=>objects.delete(key),list:async()=>({objects:[],truncated:false})};
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.gif':'image/gif'};
const ASSETS={fetch:async req=>{const u=new URL(req.url),name=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1)),file=path.resolve(root,name);if(!file.startsWith(root)||!statSafe(file))return new Response('not found',{status:404});return new Response(readFileSync(file),{headers:{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'public, max-age=3600'}})}};
function statSafe(file){try{return statSync(file).isFile()}catch{return false}}
const env={DB,IMAGES,ASSETS,MWS_ENV:'local-qa',MWS_MEDIA_BATCH_V5:process.env.MWS_QA_V5_ATTRIBUTION==='1'?'1':undefined};
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
const firstPaintQA=process.env.MWS_QA_FIRST_PAINT==='1';
const frameObserver=String.raw`
  window.qaPaintFrames=[];
  const take=()=>{
   const q=s=>document.querySelector(s),side=q('.app>.sidebar'),main=q('.app>.main'),cal=q('#calendar'),tray=q('#calendarCopyTray'),tool=q('#calendarCopyTrayToggleV4'),y=q('#calendarYearSelect'),m=q('#calendarMonthSelect');
   if(side&&main&&cal&&tray&&tool&&y&&m&&q('#calendarGrid')){
    const css=getComputedStyle(tool),sr=side.getBoundingClientRect(),mr=main.getBoundingClientRect(),date=new Date();
    const appVisible=main.getBoundingClientRect().width>0&&getComputedStyle(main).visibility==='visible'&&getComputedStyle(main).display!=='none'&&getComputedStyle(main).opacity!=='0';
    if(appVisible&&window.qaPaintFrames.length<900)window.qaPaintFrames.push({t:performance.now(),ready:document.body.dataset.calendarStartup==='ready',loading:document.body.classList.contains('mws-app-loading'),tray:getComputedStyle(tray).display,toolFont:css.fontSize,toolIcon:getComputedStyle(tool,'::before').maskImage!=='none',year:y.value,month:m.value,correctDate:y.value===String(date.getFullYear())&&m.value===String(date.getMonth()),sideLeft:sr.left,sideWidth:sr.width,mainLeft:mr.left,mainBorder:getComputedStyle(main).borderColor,mainBg:getComputedStyle(main).backgroundColor});
   }
   if(window.qaPaintFrames.length<900)requestAnimationFrame(take);
  };requestAnimationFrame(take);
 `;
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
const bsandongQA=process.env.MWS_QA_BSANDONG==='1';
const parts={core:{version:52,categories:[],timezones:[],contentGroups:[],gameLibrary:[],achievementCards,contentApplications:[]},events:[{id:'fixture-event',title:'Fixture event',date:day,start:'12:00',end:'13:00',participants:['qa0'],checklist:[]}],contacts,contactMeta:{contactTags:[],contactTagBanners:{},emoticons:[]},activity:{collaborations:[],todayPeopleByDate:{},todayPeopleManualByDate:{},targetList:[]},clipboard:{scheduleClipboard:[]},notebook:{memos:[],favoriteFolders:[]},posts:fixturePosts,miniGames:{},wardogs:{schemaVersion:1,cards:[]}};
if(operationMQA){
 const roles=['대월향','우왁굳','천양','머독','고세구!'];
 [...OP_ROSTER,...roles].forEach((name,i)=>{contacts[i].name=name==='리냐_LIN…'?'리냐_LINYA':name==='카노미☆'?'카노':rosterContactName(name)});
 parts.miniGames.operationMV1={links:Object.fromEntries(OP_ROSTER.map((name,i)=>[name,contacts[i].id])),roles:roles.map((_,i)=>contacts[OP_ROSTER.length+i].id)};
}
if(calendarVisualQA){
 const month=day.slice(0,7),last=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate();
 const categories=[{id:'visual-vr',name:'VR 콘텐츠',color:'#8b72df'},{id:'visual-collab',name:'합방',color:'#4789ce'},{id:'visual-solo',name:'개인 방송',color:'#35ad92'}];
 parts.core.categories.push(...categories);
 const titles=['VR 콘텐츠 연습','협동 게임 합방','개인 방송','정기 콘텐츠','저녁 방송','참가자 사전 미팅','장시간 콘텐츠 진행'];
 for(let d=1;d<=last;d++){
  if(d%7===0){parts.events.push({id:'visual-rest-'+d,date:month+'-'+String(d).padStart(2,'0'),title:'휴방',restDay:true});continue}
  if(d%5===0)continue;
  for(let n=0;n<(d%4===0?3:1);n++){
   const c=categories[(d+n)%categories.length];
   parts.events.push({id:'visual-event-'+d+'-'+n,title:titles[(d+n)%titles.length],date:month+'-'+String(d).padStart(2,'0'),categoryId:c.id,color:c.color,start:d===2?'23:00':d===3?'TBD':['12:00','17:00','20:30'][n],end:d===2?'01:00':d===3?'TBD':['16:00','19:30','23:00'][n],device:n===0?'VR':'PC',participants:['qa0','qa1'],checklist:[],...(d===1&&n===0||d===4&&n===1?{steamGame:{source:'manual',id:'manual:visual-fixture',name:'검증용 게임',platform:'PC',image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAA4CAIAAAC5XqvpAAACVklEQVR42u3cO07DQBAG4HjkIyDq1FQpXBqJKsoBUAoarkDJASgocwAaNz4DokpBmSK3QKKg4gAURsHY6/U+ZmbH8WwVJLT+58t4s+tIyZbldqGDfoASKLRC61BohVZoHSwjV4L2eH+8bP9ZPn9izZwx7KOLzfrw+jYtYnRucuhis25eiLW2ECNyA49y5/XklL3+M/2HoUzrye86jKyirH2bNKapgb9559nXkGSJkGAd1p7BTQ38yvPsa0iiPEPrxEfw+VhDcrWZWIOE3kxiHXbSCz4fgpAV4Oz7GiQop7L2bc+Yxx0gSueM+1rcg39m636TPhxX6O28iHxMSofC/0y1OfKdlHerIxZxLDR16/FbdyrarY6I37CA2Bs8+Xo9tIbwdTQnAVtfW4pCySD9W3CeN9V+FZQMIP+Opr6iy/zxGUC4MvV13WeOzADyleWcZWIywEzqxJowOIPTrkPUyRhrHxJZlG8MtF3Hvq4m1Nf8jxsBZcZGeV9XPNxC7jCvGCNLx+hcFtmbu3uZawju++QYwwYdo8zDHWBNcTe4xBiEtgfyXSLouL2si816X1cUYUZjmKFxlam5Ha2/vz6o81iSeEOjfNxxVtj3Jc0zlMQAPaSMvqPA5e5X6EJMkcdo3YVmU6brJl9fikh963/QRmW2k0h8eaLuuY71H3Ra5cjaqHOGpWpb/0L3lfmJAwpjDhnDbYZOq+xS2CT6oG2dLcutTGVjYdKyuYtnt08vkomnMkbFc1VGGSe9IfFciSnE+9zZxdW16jAsKQrNNPRnJBRaoXUEjB8XLAV7SsQeswAAAABJRU5ErkJggg=='}}:{})});
  }
 }
}
if(bsandongQA){
 const prior=n=>new Date(Date.now()+9*3600000-n*86400000).toISOString().slice(0,10);
 parts.core.categories.push({id:'qa-bsandong',name:'브산동',color:'#06b6d4'});
 parts.core.categories.push({id:'qa-collab',name:'합방',color:'#8b5cf6'});
 parts.core.contentGroups.push({id:'qa-club-group',name:'산책 프로젝트',color:'#06b6d4',mawangContent:'bsandong'},{id:'qa-other-group',name:'다른 프로젝트',color:'#334455'});
 parts.events.push(...[[21,['qa0']],[14,['qa0','qa1']],[7,['qa1']]].map(([n,participants])=>({id:'bs-qa-'+n,date:prior(n),title:n===21?'브산동 - Fixture walk':n===14?'Fixture VR 산책':'Fixture walk '+n,categoryId:n===7?'qa-bsandong':'qa-collab',...(n===14?{contentGroupId:'qa-club-group'}:{}),start:'12:00',end:'13:00',participants,participantStatuses:Object.fromEntries(participants.map(id=>[id,'confirmed']))})));
}
for(const [part,data] of Object.entries(parts))db.prepare("INSERT OR REPLACE INTO workspace_parts(scope,part,data,version) VALUES('public',?,?,1)").run(part,JSON.stringify(data));
const workerFirst=p=>config.assets.run_worker_first.some(pattern=>pattern.endsWith('*')?p.startsWith(pattern.slice(0,-1)):p===pattern);
let calls=[],errors=[],arrivals=[],assetReads=[];
const csp="default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; frame-src 'self' data: blob:; worker-src 'self' blob:; object-src 'none'";
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,base+':'+server.address().port),method=req.method||'GET',body=[];
  for await(const chunk of req)body.push(chunk);
  if(firstPaintQA&&u.pathname==='/assets/app-core.js')await new Promise(r=>setTimeout(r,1200));
  if(firstPaintQA&&u.pathname==='/assets/calendar-details-v1.css')await new Promise(r=>setTimeout(r,400));
  if(firstPaintQA&&u.pathname==='/api/calendar-startup')await new Promise(r=>setTimeout(r,350));
  const request=new Request(u,{method,headers:req.headers,...(!['GET','HEAD'].includes(method)?{body:Buffer.concat(body)}:{})});
  if(/\.css$/.test(u.pathname)&&method==='GET')assetReads.push(u.pathname);
  const counted=workerFirst(u.pathname);if(counted)arrivals.push({path:u.pathname,method,at:Date.now()});
  const response=await (counted?worker.fetch(request,env,ctx):ASSETS.fetch(request));
  if(counted)calls.push({path:u.pathname,method,status:response.status,...(u.pathname==='/api/save'&&method==='POST'?{parts:Object.keys(JSON.parse(Buffer.concat(body).toString()).parts||{})}:{})});
  res.statusCode=response.status;for(const [key,value] of response.headers)if(!['content-length','content-encoding','transfer-encoding'].includes(key))res.setHeader(key,value);
  if(u.pathname==='/'||u.pathname==='/index.html')res.setHeader('content-security-policy',useCdn?csp.replace("connect-src 'self'","connect-src 'self' "+cdnOrigin).replace("img-src 'self'","img-src 'self' "+cdnOrigin):csp);
  let bytes=Buffer.from(await response.arrayBuffer());
  if(firstPaintQA&&(u.pathname==='/'||u.pathname==='/index.html')&&response.status===200)bytes=Buffer.from(bytes.toString('utf8').replace('<head>','<head><script>'+frameObserver+'</script>'));
  res.end(method==='HEAD'?undefined:bytes);
 }catch(e){errors.push(String(e));res.writeHead(500).end('fixture error')}
});
// The timeline browser suites use exactly the same local Worker/asset fixture.
if(process.env.MWS_QA_SERVE_ONLY==='1'){
 assert.equal(typeof process.send,'function','Serve-only requires a parent IPC channel');
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 process.send({type:'mws-qa-ready',base:base+':'+server.address().port+'/'});
 await new Promise(r=>process.once('disconnect',r));
 server.closeAllConnections();await new Promise(r=>server.close(r));db.close();process.exit(0);
}
const dir=mkdtempSync(path.join(tmpdir(),'mws-full-request-'));let browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,attempts=160){for(let i=0;i<attempts;i++){if(await fn())return;await pause(100)}throw Error(label)}
const summary=list=>Object.fromEntries([...new Set(list.map(r=>r.path.replace(/^\/media\/contact\/.*/,'/media/contact/*').replace(/^\/media\/achievement\/.*/,'/media/achievement/*')))].sort().map(p=>[p,list.filter(r=>r.path.replace(/^\/media\/contact\/.*/,'/media/contact/*').replace(/^\/media\/achievement\/.*/,'/media/achievement/*')===p).length]));
const common=r=>r.path==='/api/calendar-startup'||r.path==='/api/manifest'||r.path==='/api/bootstrap'||r.path==='/api/parts-batch'||r.path.startsWith('/api/parts/');
try{
 if(useCdn){await new Promise(r=>cdnServer.listen(0,'127.0.0.1',r));cdnOrigin=base+':'+cdnServer.address().port;env.MWS_PUBLIC_MEDIA_CDN_ORIGIN=cdnOrigin}
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await launchCalendarBrowser(dir);

 const compareMode=process.env.MWS_QA_CSS_COMPARE==='1';
 if(compareMode)await browser.setReducedMotion(true);
 const viewport=(compareMode||calendarVisualQA)?String(process.env.MWS_QA_VIEWPORT||'1366,768').split(',').map(Number):firstPaintQA&&process.env.MWS_QA_FIRST_PAINT_WIDE==='1'?[1920,1080]:[1366,768];
 await browser.navigate(base+':'+server.address().port+'/',...viewport,(compareMode||calendarVisualQA)&&viewport[0]<761);
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
 if(calendarVisualQA){
  const captureDir=process.env.MWS_QA_VISUAL_CAPTURE;assert(captureDir,'Capture directory required');
  const {mkdirSync}=await import('node:fs');mkdirSync(captureDir,{recursive:true});
  const capture=async label=>{
   await pause(550);
   const shot=await browser.captureScreenshot();
   writeFileSync(path.join(captureDir,label+'-'+viewport[0]+'x'+viewport[1]+'.jpg'),Buffer.from(shot,'base64'));
  };
  await browser.setFocusEmulation(true);
  await nav(['calendar']);
  await until(()=>browser.evaluate("document.querySelectorAll('#calendarGrid .mini-event[data-evid]').length>=25"),'Representative calendar loaded');
  await browser.evaluate("document.fonts.ready.then(()=>true)");
  const scene=await browser.evaluate(`(()=>{const grid=document.getElementById('calendarGrid'),paint=getComputedStyle(grid),body=getComputedStyle(document.body);return {noForcedArt:!paint.backgroundImage.includes('url('),noSceneMarker:!grid.hasAttribute('data-calendar-scene'),noDefaultImage:body.getPropertyValue('--custom-bg-image').trim()==='none',custom:document.body.dataset.backgroundCustom}})()`);
  assert(scene.noForcedArt&&scene.noSceneMarker&&scene.noDefaultImage&&scene.custom==='false','Default UI must not require artwork '+JSON.stringify(scene));
  if(viewport[0]>=901)await until(()=>browser.evaluate("document.querySelectorAll('#calendarGrid .mws-steam-slot-v111.linked img').length>=2"),'Existing linked game images rendered');
  await capture('calendar');
  // Real upload and removal through the existing settings handlers.
  // Synthetic image is confined to isolated QA; never a product asset.
  const wallpaperBefore=calls.length;
  const uploadWallpaper=()=>browser.evaluate(`(async()=>{const c=document.createElement('canvas');c.width=32;c.height=16;const ctx=c.getContext('2d');ctx.fillStyle='#ebebeb';ctx.fillRect(0,0,32,16);const b=await new Promise(r=>c.toBlob(r,'image/png'));const dt=new DataTransfer();dt.items.add(new File([b],'qa-wallpaper.png',{type:'image/png'}));const input=document.getElementById('backgroundImageInput');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await uploadWallpaper();
  await until(()=>browser.evaluate("document.body.dataset.backgroundCustom==='true'"),'Wallpaper upload applied');
  const wallpaper=await browser.evaluate(`(()=>{const b=document.body,g=document.getElementById('calendarGrid'),prefs=JSON.parse(localStorage.getItem('mws_device_preferences_v1')||'{}'),s=getComputedStyle(g);return {stored:prefs.backgroundImage?.startsWith('data:image/'),body:getComputedStyle(b).backgroundImage.includes('data:image/'),grid:s.backgroundImage.includes('data:image/'),preview:document.getElementById('backgroundPreview').style.backgroundImage.includes('data:image/')}})()`);
  assert(wallpaper.stored&&wallpaper.body&&wallpaper.preview,'Uploaded wallpaper must be local and visible '+JSON.stringify(wallpaper));
  assert(wallpaper.grid,'Calendar must use user wallpaper at every tested viewport');
  const readWallpaperAlpha=()=>browser.evaluate(`(()=>{const d=document.querySelector('#calendarGrid .day:not(.out):not(.today)'),c=document.createElement('canvas');c.width=c.height=1;const x=c.getContext('2d');x.fillStyle=getComputedStyle(d).backgroundColor;x.fillRect(0,0,1,1);return x.getImageData(0,0,1,1).data[3]})()`);
  // Wait for the existing background transition to finish, not just the upload flag.
  await until(async()=>{const alpha=await readWallpaperAlpha();return alpha>0&&alpha<255},'Calendar day must not hide the custom wallpaper');
  await pause(200);
  const wallpaperAlpha=await readWallpaperAlpha();
  assert(wallpaperAlpha>0&&wallpaperAlpha<255,'Settled calendar wallpaper alpha '+wallpaperAlpha);
  await capture('calendar-custom-background');
  await browser.evaluate("document.getElementById('removeBackgroundBtn').click()");
  await until(()=>browser.evaluate("document.body.dataset.backgroundCustom==='false'"),'Wallpaper removed');
  assert(await browser.evaluate("(()=>{const p=JSON.parse(localStorage.getItem('mws_device_preferences_v1')||'{}');return p.backgroundImage===''&&getComputedStyle(document.body).getPropertyValue('--custom-bg-image').trim()==='none'&&!getComputedStyle(document.getElementById('calendarGrid')).backgroundImage.includes('url(')})()"),'Removal must restore the image-free surface');
  assert.equal(calls.length,wallpaperBefore,'Wallpaper interaction must not make Worker requests');

  const geom=await browser.evaluate(`(()=>{const grid=document.getElementById('calendarGrid'),main=document.querySelector('.app>.main'),r=grid.getBoundingClientRect(),m=main.getBoundingClientRect();return {cards:grid.querySelectorAll('.mini-event[data-evid]').length,rootOverflow:document.documentElement.scrollWidth-innerWidth,gridWidth:r.width,mainWidth:m.width,gridHeight:r.height,theme:document.body.dataset.theme,font:getComputedStyle(grid).fontFamily}})()`);
  assert(geom.cards>=25&&geom.rootOverflow<=2&&geom.gridWidth>0,JSON.stringify(geom));
  if(viewport[0]===768){
   geom.tablet=await browser.evaluate(`(()=>{const g=document.getElementById('calendarGrid'),h=[...document.querySelectorAll('#calendar .calendar-head>*')],d=[...g.querySelectorAll('.day')].slice(0,7),r=n=>n.getBoundingClientRect(),wrap=g.parentElement;return {columns:d.length,allVisible:d.every(n=>r(n).left>=0&&r(n).right<=innerWidth+1),aligned:h.length===7&&h.every((n,i)=>Math.abs(r(n).left-r(d[i]).left)<2&&Math.abs(r(n).width-r(d[i]).width)<2),noScroll:wrap.scrollWidth<=wrap.clientWidth+1,minimumWidth:Math.min(...d.map(n=>r(n).width))}})()`);
   assert(geom.tablet.columns===7&&geom.tablet.allVisible&&geom.tablet.aligned&&geom.tablet.noScroll&&geom.tablet.minimumWidth>40,'All seven tablet dates must fit without horizontal scrolling '+JSON.stringify(geom.tablet));
  }
  geom.labelMetrics=await browser.evaluate(`(()=>{
   const titles=[...document.querySelectorAll('#calendarGrid .calendar-card-title-v2')].filter(el=>el.getBoundingClientRect().width>0),vr=titles.filter(el=>el.closest('.calendar-event-vr-v1'));
   const dense=[...document.querySelectorAll('#calendarGrid .calendar-day-events-v2')].filter(el=>el.querySelectorAll('.mini-event[data-evid]').length===3);
   const report=list=>({total:list.length,fullyReadable:list.filter(el=>el.scrollWidth<=el.clientWidth+1&&el.scrollHeight<=el.clientHeight+1).length,minWidth:list.length?Math.min(...list.map(el=>Math.round(el.getBoundingClientRect().width*10)/10)):null});
   return {titles:report(titles),vrTitles:report(vr),denseDays:dense.map(el=>{const r=el.getBoundingClientRect(),cards=[...el.querySelectorAll('.mini-event[data-evid]')];return {date:el.closest('.day').dataset.date,fullCards:cards.filter(c=>{const b=c.getBoundingClientRect();return b.height>0&&b.top>=r.top-1&&b.bottom<=r.bottom+1}).length,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}})};
  })()`);
  if(viewport[0]>=1366){
   geom.redesign=await browser.evaluate(`(()=>{const g=document.getElementById('calendarGrid'),days=[...g.querySelectorAll('.day')],cards=[...g.querySelectorAll('.mini-event[data-evid]:not(.rest-event)')],r=n=>n.getBoundingClientRect(),s=n=>getComputedStyle(n);return {marker:g.classList.contains('calendar-redesign-v1'),density:days.every(d=>d.dataset.calendarDensity===((d.querySelectorAll('.mini-event[data-evid]').length>=3)?'dense':d.querySelector('.mini-event[data-evid]')?'normal':'empty')),titleFirst:cards.every(c=>{const t=c.querySelector('.calendar-card-title-v2'),k=c.querySelector('.calendar-start-v2');return t&&k&&t.compareDocumentPosition(k)&Node.DOCUMENT_POSITION_FOLLOWING&&r(t).top<=r(k).top&&parseFloat(s(t).fontSize)>parseFloat(s(k).fontSize)}),seams:days.every(d=>parseFloat(s(d).borderRightWidth)===0&&parseFloat(s(d).borderBottomWidth)===0),noTodayCellOutline:!g.querySelector('.day.today')||s(g.querySelector('.day.today')).outlineStyle==='none'}})()`);
   assert(Object.values(geom.redesign).every(Boolean),'Redesign structural and geometry contract '+JSON.stringify(geom.redesign));
   geom.material=await browser.evaluate(`(()=>{const frame=document.querySelector('#calendar .calendar-responsive-scroll-v1'),header=document.querySelector('#calendar .calendar-head'),grid=document.getElementById('calendarGrid'),today=grid.querySelector('.day.today'),day=grid.querySelector('.day:not(.today):not(.out)'),s=n=>getComputedStyle(n);return {frameShadow:s(frame).boxShadow,headerPaint:s(header).backgroundImage,glassPaint:s(day).backgroundImage,todayDistinct:!today||s(today.querySelector('.calendar-date-number-v3')).backgroundColor!==s(day.querySelector('.calendar-date-number-v3')).backgroundColor,frameRadius:parseFloat(s(frame).borderTopLeftRadius)}})()`);
   assert(geom.material.frameShadow!=='none'&&geom.material.headerPaint.includes('linear-gradient')&&geom.material.glassPaint.includes('linear-gradient')&&geom.material.todayDistinct&&geom.material.frameRadius>0,'Calendar frame material '+JSON.stringify(geom.material));
   assert(geom.labelMetrics.titles.total>0&&geom.labelMetrics.titles.fullyReadable===geom.labelMetrics.titles.total,'Fixture titles clipped '+JSON.stringify(geom.labelMetrics));
   geom.integratedMaterial=await browser.evaluate(`(()=>{const q=s=>document.querySelector(s),s=n=>getComputedStyle(n),body=s(document.body),main=s(q('.app>.main')),rail=s(q('.app>.sidebar')),header=s(q('#calendar .calendar-head'));return {token:body.getPropertyValue('--mws-calendar-metal').includes('linear-gradient'),sharedHousing:main.backgroundImage===rail.backgroundImage,headerPaint:header.backgroundImage.includes('linear-gradient')}})()`);
   assert(Object.values(geom.integratedMaterial).every(Boolean),'Integrated calendar material '+JSON.stringify(geom.integratedMaterial));
   geom.brushedSurface=await browser.evaluate(`(()=>{const s=n=>getComputedStyle(n),main=s(document.querySelector('.app>.main')),rail=s(document.querySelector('.app>.sidebar')),grid=s(document.querySelector('#calendarGrid')),header=s(document.querySelector('#calendar .calendar-head'));return {grain:main.backgroundImage.includes('data:image/svg+xml,'),shared:main.backgroundImage===rail.backgroundImage,header:header.backgroundImage.includes('data:image/svg+xml,'),tile:main.backgroundSize.startsWith('64px 64px'),repeat:main.backgroundRepeat.startsWith('repeat'),cleanGrid:!grid.backgroundImage.includes('data:image/svg+xml,'),noFilter:main.filter==='none'&&rail.filter==='none'}})()`);
   assert(Object.values(geom.brushedSurface).every(Boolean),'Brushed housing material '+JSON.stringify(geom.brushedSurface));
   // Validate the actual embedded texture, not just the presence of a URL.
   const grainSource=await browser.evaluate("getComputedStyle(document.body).getPropertyValue('--mws-calendar-brush').trim()");
   const grainSvg=decodeURIComponent(grainSource.slice(grainSource.indexOf(',')+1,grainSource.lastIndexOf('"')));
   const grainOpacity=Array.from(grainSvg.matchAll(/opacity='([0-9.]+)'/g),m=>Number(m[1]));
   geom.grainOpacity={strokes:grainOpacity.length,max:Math.max(...grainOpacity)};
   assert(grainOpacity.length>=100&&geom.grainOpacity.max<=.012&&geom.grainOpacity.max>0,'Satin grain must remain subtle '+JSON.stringify(geom.grainOpacity));
   geom.opticalSurface=await browser.evaluate(`(()=>{const grid=document.getElementById('calendarGrid'),s=n=>getComputedStyle(n),day=grid.querySelector('.day:not(.out):not(.today)'),paint=s(grid),glass=s(day),date=s(day.querySelector('.calendar-date-number-v3')),layers=paint.backgroundImage,body=s(document.body);return {oneReflection:layers.split('radial-gradient').length===2&&layers.split('linear-gradient').length===2,noImage:!layers.includes('url('),glassAlpha:glass.backgroundColor,cellWash:glass.backgroundImage.includes('linear-gradient'),noLiveBlur:glass.backdropFilter==='none'&&paint.backdropFilter==='none',dateSize:parseFloat(date.fontSize),dateShadow:date.textShadow!=='none',rim:body.getPropertyValue('--mws-calendar-rim-light').trim().length>0}})()`);
   assert(geom.opticalSurface.noImage&&geom.opticalSurface.cellWash&&geom.opticalSurface.noLiveBlur&&geom.opticalSurface.dateSize>=16&&!geom.opticalSurface.dateShadow,'Continuous optical surface '+JSON.stringify(geom.opticalSurface));
   // Stage 37: check the actual computed date material and stable date hit area.
   geom.dateLegibility=await browser.evaluate(`(()=>{const grid=document.getElementById('calendarGrid'),style=n=>getComputedStyle(n),days=[...grid.querySelectorAll('.day:not(.out):not(.today)')],items=days.map(d=>{const n=d.querySelector('.calendar-date-number-v3'),s=style(n),r=n.getBoundingClientRect(),weekday=new Date(d.dataset.date+'T12:00:00').getDay();return {weekday,color:s.color,background:s.backgroundColor,size:parseFloat(s.fontSize),width:r.width,height:r.height}}),header=[...document.querySelectorAll('#calendar .calendar-head>*')].map(n=>parseFloat(style(n).fontSize));return {items,header}})()`);
   assert(geom.dateLegibility.items.length>0&&geom.dateLegibility.items.every(x=>x.size>=16&&x.width>=28&&x.height>=25&&x.background==='rgba(0, 0, 0, 0)')&&geom.dateLegibility.header.length===7&&geom.dateLegibility.header.every(x=>x===14),'Calendar date legibility '+JSON.stringify(geom.dateLegibility));
   geom.cardMaterial=await browser.evaluate(`(()=>{
     const grid=document.getElementById('calendarGrid'),card=grid.querySelector('.mini-event[data-evid]:not(.rest-event)'),unknown=grid.querySelector('.calendar-start-v2[data-clock-state=unknown]'),rest=grid.querySelector('.mini-event.rest-event'),s=n=>getComputedStyle(n),r=n=>{const b=n.getBoundingClientRect();return [b.x,b.y,b.width,b.height]},base=JSON.stringify(r(card)),original=card.className,oldTransition=card.style.getPropertyValue('transition'),oldPriority=card.style.getPropertyPriority('transition');
     card.style.setProperty('transition','none','important');
     try{
      const normal={shadow:s(card).boxShadow,transform:s(card).transform,paint:s(card).backgroundImage};
      const state=cls=>{card.className=original;card.classList.add(cls);const st=s(card);return {outline:st.outlineStyle,width:st.outlineWidth,shadow:st.boxShadow,stable:JSON.stringify(r(card))===base,transform:st.transform}};
      return {normal,selected:state('event-details-selected-v1'),group:state('calendar-group-selected-v2'),drag:state('mws-calendar-event-pointer-dragging-v174'),unknown:unknown&&s(unknown).textDecorationStyle,rest:!!rest&&s(rest).backgroundColor};
     }finally{card.className=original;if(oldTransition)card.style.setProperty('transition',oldTransition,oldPriority);else card.style.removeProperty('transition')}
   })()`);
   assert(geom.cardMaterial.normal.paint.includes('linear-gradient')&&geom.cardMaterial.normal.transform==='none'&&geom.cardMaterial.selected.outline==='solid'&&geom.cardMaterial.group.width==='2px'&&geom.cardMaterial.drag.outline==='dashed'&&geom.cardMaterial.unknown==='dotted'&&geom.cardMaterial.rest&&[geom.cardMaterial.selected,geom.cardMaterial.group,geom.cardMaterial.drag].every(v=>v.stable&&v.transform==='none'),'Card state material '+JSON.stringify(geom.cardMaterial));
   geom.gameSlots=await browser.evaluate(`(async()=>{const slots=[...document.querySelectorAll('#calendarGrid .mws-steam-slot-v111.linked:has(img)')];await Promise.all(slots.map(b=>b.firstElementChild.decode()));return slots.map(b=>{const card=b.closest('.mini-event'),title=card.querySelector('.calendar-card-title-v2'),vr=card.querySelector('.calendar-vr-badge-v1'),r=b.getBoundingClientRect(),t=title.getBoundingClientRect(),v=vr?.getBoundingClientRect(),day=card.closest('.day'),style=getComputedStyle(day),width=day.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);return {id:card.dataset.evid,width:r.width,height:r.height,decoded:b.firstElementChild.naturalWidth>0,titleClear:t.left>=r.right-1,vrClear:!v||v.left>=r.right-1,wide:width>=215,fit:title.scrollWidth<=title.clientWidth+1,label:b.getAttribute('aria-label')}})})()`);
   assert(geom.gameSlots.length===2&&geom.gameSlots.every(x=>x.decoded&&x.titleClear&&x.vrClear&&x.height>=24&&x.width>=(x.wide?36:24)&&x.fit&&x.label.includes('게임 수정')),'Linked game slot geometry '+JSON.stringify(geom.gameSlots));
   if(viewport[0]>=2200&&viewport[1]>=1200){
    geom.highResolutionType=await browser.evaluate("parseFloat(getComputedStyle(document.querySelector('#calendarGrid .calendar-card-title-v2')).fontSize)");
    assert(geom.highResolutionType>=14&&geom.gameSlots.every(x=>x.width>=42),'High resolution calendar must use available room '+JSON.stringify(geom.gameSlots));
   }
   geom.gameStability=await browser.evaluate(`(()=>{const buttons=[...document.querySelectorAll('#calendarGrid .mws-steam-slot-v111.linked:has(img)')];const rect=n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};return buttons.map(b=>{const card=b.closest('.mini-event'),image=b.firstElementChild,title=card.querySelector('.calendar-card-title-v2'),vr=card.querySelector('.calendar-vr-badge-v1'),nodes=[card,b,title,...(vr?[vr]:[])],measure=()=>JSON.stringify(nodes.map(rect)),after=measure();b.classList.remove('linked');image.remove();const before=measure();b.append(image);b.classList.add('linked');const restored=measure();return {id:card.dataset.evid,reserved:card.dataset.calendarGameReserved==='true',stable:before===after&&restored===after,imageWidth:image.naturalWidth,imageHeight:image.naturalHeight}})})()`);
   assert(geom.gameStability.length===2&&geom.gameStability.every(x=>x.reserved&&x.stable&&x.imageWidth===120&&x.imageHeight===56),'Thumbnail loading must not move card, title or control '+JSON.stringify(geom.gameStability));
   geom.brand=await browser.evaluate(`(()=>{const full=document.querySelector('.sidebar .logo-full'),mini=document.querySelector('.sidebar .logo-mini'),pin=document.getElementById('sidebarPinBtn'),logo=document.querySelector('.sidebar .logo'),f=full.getBoundingClientRect(),p=pin.getBoundingClientRect(),l=logo.getBoundingClientRect(),style=getComputedStyle(full,'::before');return {mark:style.maskImage.includes('data:image/svg+xml'),miniMark:getComputedStyle(mini,'::before').maskImage.includes('data:image/svg+xml'),width:f.width,available:l.width,overlap:Math.max(0,f.right-p.left),wordmarkFits:full.scrollWidth<=full.clientWidth+1,pinVisible:p.width>0}})()`);
   assert(geom.brand.mark&&geom.brand.miniMark&&geom.brand.wordmarkFits&&geom.brand.overlap<=1&&geom.brand.pinVisible,'Brand must fit existing rail without overlap '+JSON.stringify(geom.brand));
   assert(geom.labelMetrics.vrTitles.total>0&&geom.labelMetrics.vrTitles.fullyReadable===geom.labelMetrics.vrTitles.total,'Fixture VR titles clipped '+JSON.stringify(geom.labelMetrics));
   assert(geom.labelMetrics.denseDays.length>0&&geom.labelMetrics.denseDays.every(d=>d.fullCards===3),'Three-event fixture days must show all three cards '+JSON.stringify(geom.labelMetrics.denseDays));
  }
  if(viewport[0]<761){
   const labels=await browser.evaluate(`(()=>{const cards=[...document.querySelectorAll('#calendarGrid .mini-event[data-evid].calendar-event-vr-v1')].filter(c=>c.getBoundingClientRect().width>0);return cards.map(c=>{const title=c.querySelector('.calendar-card-title-v2'),r=title.getBoundingClientRect(),box=c.getBoundingClientRect(),s=getComputedStyle(c);return {width:r.width,card:box.width,visible:!!title.textContent&&getComputedStyle(title).visibility==='visible',padding:parseFloat(s.paddingRight)}})})()`);
   assert(labels.length>0&&labels.every(x=>x.visible&&x.width>=x.card*.65&&x.padding<=3),'Mobile VR titles clipped '+JSON.stringify(labels));
   assert(geom.labelMetrics.titles.fullyReadable>0,'Mobile titles must improve on the zero fully readable baseline '+JSON.stringify(geom.labelMetrics));
   if(viewport[0]===390){
    assert(geom.labelMetrics.titles.total>0&&geom.labelMetrics.titles.fullyReadable===geom.labelMetrics.titles.total,'390px fixture titles must remain fully readable '+JSON.stringify(geom.labelMetrics));
    geom.phoneTitleLines=await browser.evaluate("getComputedStyle(document.querySelector('#calendarGrid .calendar-card-title-v2')).webkitLineClamp");
    assert.equal(geom.phoneTitleLines,'3');
   }
   assert(geom.labelMetrics.denseDays.every(d=>d.fullCards===2),'Mobile dense days must keep both visible cards '+JSON.stringify(geom.labelMetrics));
   await browser.evaluate("document.querySelector('#calendarGrid .day:has(.mini-event[data-evid])').click()");
   await until(()=>browser.evaluate("!!document.querySelector('.mws-mobile-calendar-day-detail-v130.open')"),'Mobile day sheet open');
   await capture('calendar-detail');
   const savedBeforeEditor=await browser.evaluate("JSON.stringify(activeEvents())");
   await browser.evaluate("document.querySelector('.mws-mobile-calendar-day-detail-v130.open [data-mws-event-id]').click()");
   await until(()=>browser.evaluate("document.getElementById('eventModal').classList.contains('open')"),'Mobile day card opens real editor');
   await capture('calendar-editor');
   geom.mobileEditor=await browser.evaluate(`(()=>{const q=id=>document.getElementById(id),modal=q('eventModal'),box=modal.querySelector('.mws-event-editor-v6'),r=box.getBoundingClientRect(),layout=modal.querySelector('.event-modal-layout'),save=q('saveEventBtn').getBoundingClientRect(),cancel=q('eventEditorCancelV13').getBoundingClientRect();return {title:q('evTitle').value,inside:r.left>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,scrollable:layout.scrollHeight>layout.clientHeight,overflow:layout.scrollWidth-layout.clientWidth,saveHeight:save.height,cancelHeight:cancel.height,actions:cancel.right<=save.left+1&&save.bottom<=r.bottom+1&&save.right<=r.right+1}})()`);
   assert(geom.mobileEditor.title&&geom.mobileEditor.inside&&geom.mobileEditor.scrollable&&geom.mobileEditor.overflow<=1&&geom.mobileEditor.saveHeight>=44&&geom.mobileEditor.cancelHeight>=44&&geom.mobileEditor.actions,'Mobile editor geometry '+JSON.stringify(geom.mobileEditor));
   geom.mobileEditor.secondaryTargets=await browser.evaluate("Array.from(document.querySelectorAll('#eventModal .event-actions>.row:first-child button')).filter(b=>b.getClientRects().length).map(b=>({id:b.id,height:b.getBoundingClientRect().height}))");
   assert(geom.mobileEditor.secondaryTargets.length>0&&geom.mobileEditor.secondaryTargets.every(b=>b.height>=44),'Mobile secondary action targets '+JSON.stringify(geom.mobileEditor.secondaryTargets));
   await browser.evaluate("document.getElementById('eventEditorCancelV13').click()");
   await until(()=>browser.evaluate("!document.getElementById('eventModal').classList.contains('open')"),'Mobile editor cancel closes');
   assert.equal(await browser.evaluate("JSON.stringify(activeEvents())"),savedBeforeEditor,'Mobile editor cancel must not mutate schedules');
  }else{
   await browser.evaluate("document.querySelector('#calendarGrid .mini-event[data-evid]').click()");
   await until(()=>browser.evaluate("window.mwsCalendarDetailsV1?.isOpen()===true"),'Calendar detail open');
   geom.detailLayout=await browser.evaluate(`(()=>{const pop=document.getElementById('calendarEventDetailsV1'),clock=pop.querySelector('.mws-detail-clock-v1'),date=pop.querySelector('.mws-detail-date-v1'),body=pop.querySelector('.event-details-body-v1'),r=pop.getBoundingClientRect(),c=clock?.getBoundingClientRect(),d=date?.getBoundingClientRect();return {clock:clock?.textContent,date:date?.textContent,ordered:!!(c&&d&&c.top>=d.bottom-1),inside:r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,overflow:body.scrollWidth-body.clientWidth,people:[...pop.querySelectorAll('.calendar-preview-person-name')].every(n=>n.scrollWidth<=n.clientWidth+1)}})()`);
   assert(geom.detailLayout.clock&&geom.detailLayout.date&&geom.detailLayout.ordered&&geom.detailLayout.inside&&geom.detailLayout.overflow<=1&&geom.detailLayout.people,'Detail layout '+JSON.stringify(geom.detailLayout));
   geom.detailHeader=await browser.evaluate(`(()=>{const p=document.getElementById('calendarEventDetailsV1'),h=p.querySelector('#calendarDetailsHeaderTitleV2'),body=p.querySelector('.event-details-body-v1'),edit=p.querySelector('#calendarDetailsEditV1'),close=p.querySelector('#calendarDetailsCloseV1'),r=n=>n.getBoundingClientRect();return {title:h?.textContent,visible:!h.hidden&&r(h).height>0,notDuplicated:!body.querySelector('.calendar-preview-title'),separate:r(h).right<=r(edit).left+1&&r(edit).right<=r(close).left+1,above:r(h).bottom<=r(body).top+1}})()`);
   assert(geom.detailHeader.title&&geom.detailHeader.visible&&geom.detailHeader.notDuplicated&&geom.detailHeader.separate&&geom.detailHeader.above,'Detail title and actions must share the header without overlap '+JSON.stringify(geom.detailHeader));
   geom.detailMaterial=await browser.evaluate(`(()=>{const d=document.getElementById('calendarEventDetailsV1'),t=d.querySelector('.mws-detail-time-v1'),edit=document.getElementById('calendarDetailsEditV1'),s=n=>getComputedStyle(n);return {opaque:(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=s(d).backgroundColor;ctx.fillRect(0,0,1,1);return ctx.getImageData(0,0,1,1).data[3]===255})(),glass:s(d).backgroundImage.includes('linear-gradient'),time:s(t).backgroundImage.includes('linear-gradient'),timeRecess:s(t).boxShadow.includes('inset'),action:s(edit).boxShadow!=='none'}})()`);
   assert(Object.values(geom.detailMaterial).every(Boolean),'Detail material '+JSON.stringify(geom.detailMaterial));
   await capture('calendar-detail');
   const savedBeforeEditor=await browser.evaluate("JSON.stringify(activeEvents())");
   await browser.evaluate("document.getElementById('calendarDetailsEditV1').click()");
   await until(()=>browser.evaluate("document.getElementById('eventModal').classList.contains('open')"),'Actual editor opened from detail');
   await capture('calendar-editor');
   geom.editor=await browser.evaluate(`(()=>{const q=id=>document.getElementById(id),modal=q('eventModal'),box=modal.querySelector('.mws-event-editor-v6'),r=box.getBoundingClientRect(),save=q('saveEventBtn').getBoundingClientRect(),cancel=q('eventEditorCancelV13').getBoundingClientRect(),duration=q('evBroadcastDurationWrapV1'),dates=modal.querySelector('.event-date-time-v7');return {title:q('evTitle').value,duration:q('evBroadcastDurationValueV1').textContent,adjacent:dates.nextElementSibling===duration,inside:r.left>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,actions:save.width>0&&cancel.width>0&&cancel.right<=save.left+1&&save.bottom<=r.bottom+1}})()`);
   assert(geom.editor.title&&geom.editor.adjacent&&geom.editor.inside&&geom.editor.actions,'Editor geometry '+JSON.stringify(geom.editor));
   geom.editorMaterial=await browser.evaluate(`(()=>{const m=document.getElementById('eventModal'),s=n=>getComputedStyle(n),q=id=>document.getElementById(id);return {shell:s(m.querySelector('.mws-event-editor-v6')).boxShadow!=='none',title:s(q('evTitle')).boxShadow.includes('inset'),date:s(q('evDateDisplay')).backgroundImage.includes('linear-gradient'),save:s(q('saveEventBtn')).backgroundImage.includes('linear-gradient'),cancel:s(q('eventEditorCancelV13')).backgroundImage.includes('linear-gradient')}})()`);
   assert(Object.values(geom.editorMaterial).every(Boolean),'Editor material '+JSON.stringify(geom.editorMaterial));
   await browser.evaluate("document.getElementById('eventEditorCancelV13').click()");
   await until(()=>browser.evaluate("!document.getElementById('eventModal').classList.contains('open')"),'Cancel closes without saving');
   assert.equal(await browser.evaluate("JSON.stringify(activeEvents())"),savedBeforeEditor,'Editor open/cancel must not mutate schedules');
  }
  // Both mobile and desktop retain actual editor action hit targets.
  // The dedicated modal regression covers opening, closing and rapid re-entry.
  if(viewport[0]>=1700){
   const beforeAgenda=calls.length;
   const originalEvents=await browser.evaluate("JSON.stringify(activeEvents())");
   const initialWidth=geom.gridWidth;
   await browser.evaluate("document.getElementById('calendarAgendaToggleV1').click()");
   await until(()=>browser.evaluate("!document.getElementById('calendarAgendaV1').hidden"),'Wide calendar agenda opened');
   const date=geom.labelMetrics.denseDays[0].date;
   await browser.evaluate("(date=>{const input=document.querySelector('[data-agenda-date]');input.value=date;input.dispatchEvent(new Event('change',{bubbles:true}))})("+JSON.stringify(date)+")");
   const agenda=await browser.evaluate(`(()=>{const grid=document.getElementById('calendarGrid'),panel=document.getElementById('calendarAgendaV1'),r=grid.getBoundingClientRect(),p=panel.getBoundingClientRect(),main=document.querySelector('.app>.main').getBoundingClientRect(),date=panel.querySelector('[data-agenda-date]').value,items=[...panel.querySelectorAll('[data-agenda-event]')];return {date,ids:items.map(e=>e.dataset.agendaEvent),expected:activeEvents().filter(e=>e.date===date).map(e=>String(e.id)),gridWidth:r.width,panelWidth:p.width,separate:r.right<=p.left+1,inside:p.right<=main.right+1&&p.bottom<=innerHeight+1,marked:grid.querySelector('.mws-agenda-date-v1')?.dataset.date}})()`);
   assert(agenda.separate&&agenda.inside&&agenda.marked===date&&agenda.gridWidth<initialWidth&&agenda.panelWidth>=248,JSON.stringify(agenda));
   assert.deepEqual([...agenda.ids].sort(),[...agenda.expected].sort());assert.equal(agenda.ids.length,3);
   agenda.material=await browser.evaluate(`(()=>{const grid=document.getElementById('calendarGrid'),selected=grid.querySelector('.day.mws-agenda-date-v1'),today=grid.querySelector('.day.today'),s=getComputedStyle(selected.querySelector('.calendar-date-number-v3'));return {outline:s.outlineStyle,color:s.outlineColor,todayDistinct:!today||selected===today||s.backgroundColor!==getComputedStyle(today.querySelector('.calendar-date-number-v3')).backgroundColor}})()`);
   assert(agenda.material.outline==='solid'&&agenda.material.todayDistinct,'Selected date material '+JSON.stringify(agenda.material));
   assert.equal(calls.length,beforeAgenda,'Opening or selecting agenda date must not request data');
   const timeInstrument=await browser.evaluate(`(()=>{const panel=document.getElementById('calendarAgendaV1'),select=panel.querySelector('[data-agenda-date]'),tracks=[...panel.querySelectorAll('[data-agenda-track]')],total=panel.querySelector('[data-agenda-duration]').textContent,model=window.mwsCalendarAgendaTimeV1.summarize(activeEvents().filter(e=>e.date===select.value)),list=panel.querySelector('[data-agenda-list]');return {dateLabel:select.selectedOptions[0].textContent,options:select.options.length,tracks:tracks.map(t=>({id:t.dataset.agendaTrack,left:parseFloat(t.firstElementChild.style.left),width:parseFloat(t.firstElementChild.style.width)})),expected:model.entries,total,expectedTotal:Math.floor(model.minutes/60)+'시간 '+model.minutes%60+'분',listHeight:list.clientHeight}})()`);
   assert(timeInstrument.dateLabel.includes('년')&&timeInstrument.dateLabel.includes('월')&&timeInstrument.dateLabel.includes('일')&&timeInstrument.options>=28);
   assert.equal(timeInstrument.total,timeInstrument.expectedTotal);
   assert.equal(timeInstrument.tracks.length,3);
   for(const track of timeInstrument.tracks){const e=timeInstrument.expected.find(x=>x.id===track.id);assert(e&&Math.abs(track.left-e.start/14.4)<.01&&Math.abs(track.width-(e.end-e.start)/14.4)<.01)}
   assert(timeInstrument.listHeight>200,JSON.stringify(timeInstrument));
   agenda.timeInstrument=timeInstrument;
   agenda.instrumentMaterial=await browser.evaluate(`(()=>{const p=document.getElementById('calendarAgendaV1'),track=p.querySelector('[data-agenda-track]'),axis=p.querySelector('.mws-agenda-time-axis-v1'),bar=track.firstElementChild,s=n=>getComputedStyle(n);return {housing:s(p).backgroundImage.includes('linear-gradient'),ticks:s(track).backgroundImage.split('repeating-linear-gradient').length===3,bar:s(bar).backgroundImage.includes('linear-gradient'),labels:axis.children.length===5,axisGrid:s(axis).display==='grid'}})()`);
   assert(Object.values(agenda.instrumentMaterial).every(Boolean),'Agenda material '+JSON.stringify(agenda.instrumentMaterial));
   agenda.sharedHousing=await browser.evaluate("getComputedStyle(document.getElementById('calendarAgendaV1')).backgroundImage===getComputedStyle(document.querySelector('.app>.main')).backgroundImage");
   assert(agenda.sharedHousing,'Agenda and calendar must share the same housing material');
   const linkCheck=await browser.evaluate(`(()=>{
     const panel=document.getElementById('calendarAgendaV1'),track=panel.querySelector('[data-agenda-track]'),id=track.dataset.agendaTrack,card=[...panel.querySelectorAll('[data-agenda-event]')].find(x=>x.dataset.agendaEvent===id),grid=[...document.querySelectorAll('#calendarGrid .mini-event[data-evid]')].find(x=>x.dataset.evid===id),nodes=[track,card,grid],rects=()=>nodes.map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]}),before=JSON.stringify(rects());
     const linked=()=>nodes.every(n=>n.classList.contains('mws-agenda-link-v1'));
     track.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));const hover=linked(),stable=JSON.stringify(rects())===before;
     track.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,pointerType:'mouse',relatedTarget:panel.querySelector('[data-agenda-date]')}));const cleared=nodes.every(n=>!n.classList.contains('mws-agenda-link-v1'));
     card.focus({preventScroll:true});const focus=linked()&&document.activeElement===card,documentFocused=document.hasFocus(),active=document.activeElement?.outerHTML.slice(0,160),inert=!!card.closest('[inert]');card.blur();
     return {hover,stable,cleared,focus,documentFocused,active,inert,hitHeight:track.getBoundingClientRect().height};
   })()`);
   assert(linkCheck.hover&&linkCheck.stable&&linkCheck.cleared&&linkCheck.focus&&linkCheck.hitHeight>=24,JSON.stringify(linkCheck));
   agenda.linkCheck=linkCheck;
   await capture('calendar-agenda');
   await browser.evaluate("document.querySelector('#calendarAgendaV1 [data-agenda-track]').click()");
   await until(()=>browser.evaluate("window.mwsCalendarDetailsV1?.isOpen()===true"),'Time bar opens actual event detail');
   const detailSelected=await browser.evaluate(`(()=>{const track=document.querySelector('#calendarAgendaV1 [data-agenda-track]'),id=track.dataset.agendaTrack,card=[...document.querySelectorAll('#calendarAgendaV1 [data-agenda-event]')].find(x=>x.dataset.agendaEvent===id),grid=[...document.querySelectorAll('#calendarGrid [data-evid]')].find(x=>x.dataset.evid===id);return window.mwsCalendarDetailsV1.currentId()===id&&[track,card].every(n=>n.classList.contains('mws-agenda-selected-v1')&&n.getAttribute('aria-expanded')==='true')&&grid.classList.contains('event-details-selected-v1')})()`);
   assert(detailSelected,'Detail selection must highlight the matching event in all three views');
   agenda.detailSelected=detailSelected;
   await browser.evaluate("window.mwsCalendarDetailsV1.close({restoreFocus:false})");
   await browser.evaluate("document.querySelector('#calendarAgendaV1 [data-agenda-event]').click()");
   await until(()=>browser.evaluate("window.mwsCalendarDetailsV1?.isOpen()===true"),'Agenda opens existing event detail');
   await capture('calendar-agenda-detail');
   await browser.evaluate("window.mwsCalendarDetailsV1.close({restoreFocus:false})");
   await browser.evaluate("document.querySelector('[data-agenda-next]').click()");
   assert.notEqual(await browser.evaluate("document.querySelector('[data-agenda-date]').value"),date);
   await browser.evaluate("document.querySelector('[data-agenda-prev]').click()");
   assert.equal(await browser.evaluate("document.querySelector('[data-agenda-date]').value"),date);
   const dayPrefix=date.slice(0,8);
   const choose=async d=>browser.evaluate("(date=>{const input=document.querySelector('[data-agenda-date]');input.value=date;input.dispatchEvent(new Event('change',{bubbles:true}))})("+JSON.stringify(dayPrefix+d)+")");
   const inspectState=()=>browser.evaluate(`(()=>{const p=document.getElementById('calendarAgendaV1');return {count:p.querySelectorAll('[data-agenda-event]').length,tracks:p.querySelectorAll('[data-agenda-track]').length,hidden:p.querySelector('[data-agenda-time-section]').hidden,axisHidden:p.querySelector('.mws-agenda-time-axis-v1').hidden,total:p.querySelector('[data-agenda-duration]').textContent,empty:!!p.querySelector('.mws-agenda-empty-v1'),rest:!!p.querySelector('[data-agenda-state=rest]'),flag:p.querySelector('.mws-agenda-time-flag-v1')?.textContent,labels:[...p.querySelectorAll('.mws-agenda-track-label-v1')].map(n=>n.textContent)}})()`);
   await choose('02');const overnight=await inspectState();assert(overnight.count===1&&overnight.tracks===1&&overnight.total==='2시간 0분'&&overnight.flag==='다음 날 종료'&&overnight.labels[0]==='23:00',JSON.stringify(overnight));await capture('calendar-agenda-overnight');
   await choose('03');const unknown=await inspectState();assert(unknown.count===1&&unknown.tracks===0&&!unknown.hidden&&unknown.axisHidden&&unknown.total==='시간 미정'&&unknown.flag==='시간 합계 미정',JSON.stringify(unknown));await capture('calendar-agenda-unknown');
   await choose('05');const empty=await inspectState();assert(empty.count===0&&empty.tracks===0&&empty.hidden&&empty.empty,JSON.stringify(empty));await capture('calendar-agenda-empty');
   await choose('07');const rest=await inspectState();assert(rest.count===1&&rest.hidden&&rest.rest&&!rest.empty,JSON.stringify(rest));await capture('calendar-agenda-rest');
   agenda.states={overnight,unknown,empty,rest};
   // Exercise rapid close/reopen without letting stale animation completions
   // hide the new panel; check the real month is not continuously resized.
   const panelMotion=await browser.evaluate(`(async()=>{
     const panel=document.getElementById('calendarAgendaV1'),toggle=document.getElementById('calendarAgendaToggleV1'),close=panel.querySelector('[data-agenda-close]'),grid=document.getElementById('calendarGrid'),width=()=>grid.getBoundingClientRect().width;
     const before=width();close.click();
     const exit={inert:panel.inert,aria:panel.getAttribute('aria-hidden'),closed:toggle.getAttribute('aria-expanded')==='false',animations:panel.getAnimations().map(a=>({duration:a.effect.getTiming().duration,properties:Object.keys(a.effect.getKeyframes()[0]).filter(k=>!['offset','computedOffset','easing','composite'].includes(k))}))};
     const stable=panel.hidden||Math.abs(width()-before)<1;
     toggle.click();await new Promise(r=>setTimeout(r,250));
     return {exit,stable,reopened:!panel.hidden&&!panel.inert&&toggle.getAttribute('aria-expanded')==='true',settled:panel.getAnimations().length===0,restored:Math.abs(width()-before)<1};
   })()`);
   assert(panelMotion.exit.inert&&panelMotion.exit.aria==='true'&&panelMotion.exit.closed&&panelMotion.exit.animations.every(a=>a.duration===140&&a.properties.every(k=>k==='opacity'))&&panelMotion.stable&&panelMotion.reopened&&panelMotion.settled&&panelMotion.restored,'Agenda motion '+JSON.stringify(panelMotion));
   agenda.panelMotion=panelMotion;
   await browser.evaluate("document.querySelector('[data-agenda-close]').click()");
   await until(()=>browser.evaluate("document.getElementById('calendarAgendaV1').hidden"),'Agenda closed');
   assert(await browser.evaluate("!document.querySelector('.mws-agenda-link-v1,.mws-agenda-selected-v1')"),'Closing agenda must clear linked and selected state');
   const restored=await browser.evaluate("document.getElementById('calendarGrid').getBoundingClientRect().width");
   assert(Math.abs(restored-initialWidth)<=1,'Default month width must be restored');
   assert.equal(await browser.evaluate("JSON.stringify(activeEvents())"),originalEvents,'Agenda must not mutate schedule data');
   assert.equal(calls.length,beforeAgenda,'Agenda interaction must not request data');
   geom.agenda={...agenda,restored,requests:calls.length-beforeAgenda};
  }else{
   assert(await browser.evaluate("document.getElementById('calendarAgendaV1').hidden&&getComputedStyle(document.getElementById('calendarAgendaToggleV1')).display==='none'"),'Narrow view keeps original calendar');
  }
  await nav(['dashboard']);await capture('dashboard');
  await nav(['calendar']);await browser.evaluate("document.body.dataset.theme='ocean'");await capture('calendar-ocean');
  // Run real reload tests after the interaction budget and standard captures,
  // so startup traffic is not mistaken for background-setting traffic.
  await browser.evaluate("document.body.dataset.theme='neon'");
  await uploadWallpaper();
  await until(()=>browser.evaluate("document.body.dataset.backgroundCustom==='true'"),'Wallpaper uploaded before reload');
  await browser.evaluate("(()=>{const s=document.getElementById('backgroundDim');s.value='65';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}))})()");
  const beforeReloadPrefs=await browser.evaluate("JSON.parse(localStorage.getItem('mws_device_preferences_v1'))");
  assert(beforeReloadPrefs.backgroundImage?.startsWith('data:image/')&&beforeReloadPrefs.backgroundDim===65);
  const reloadReady=async()=>{const origin=await browser.evaluate('performance.timeOrigin');await browser.reload(false);await until(async()=>{try{return await browser.evaluate("(()=>{document.querySelector('#mwsAnnouncementDialog[open] .mws-notice-close')?.click();return performance.timeOrigin!=="+origin+"&&!!window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')&&!document.body.classList.contains('mws-gated')})()")}catch{return false}},'Wallpaper reload ready');await nav(['calendar']);await until(()=>browser.evaluate("document.querySelectorAll('#calendarGrid .mini-event[data-evid]').length>=25"),'Calendar restored after wallpaper reload')};
  await reloadReady();
  const restoredWallpaper=await browser.evaluate(`(()=>{const b=document.body,p=JSON.parse(localStorage.getItem('mws_device_preferences_v1')),s=getComputedStyle(b);return {image:p.backgroundImage,dim:p.backgroundDim,active:b.dataset.backgroundCustom==='true',paint:getComputedStyle(document.getElementById('calendarGrid')).backgroundImage.includes('data:image/'),cssDim:s.getPropertyValue('--custom-bg-dim').trim(),slider:document.getElementById('backgroundDim').value,memoryMatches:data.backgroundImage===p.backgroundImage,memoryDim:data.backgroundDim,theme:b.dataset.theme}})()`);
  assert(restoredWallpaper.image===beforeReloadPrefs.backgroundImage&&restoredWallpaper.dim===65&&restoredWallpaper.active&&restoredWallpaper.paint&&Number(restoredWallpaper.cssDim)===.65&&restoredWallpaper.slider==='65'&&restoredWallpaper.memoryMatches&&restoredWallpaper.memoryDim===65,'Wallpaper and darkness must survive reload '+JSON.stringify({...restoredWallpaper,image:undefined,imageMatches:restoredWallpaper.image===beforeReloadPrefs.backgroundImage}));
  await capture('calendar-custom-background-reload');
  await browser.evaluate("document.getElementById('removeBackgroundBtn').click()");
  await reloadReady();
  const removedAfterReload=await browser.evaluate("(()=>{const p=JSON.parse(localStorage.getItem('mws_device_preferences_v1'));return p.backgroundImage===''&&data.backgroundImage===''&&document.body.dataset.backgroundCustom==='false'&&!getComputedStyle(document.getElementById('calendarGrid')).backgroundImage.includes('url(')})()");
  assert(removedAfterReload,'Wallpaper removal must survive reload');
  geom.wallpaperPersistence={uploaded:wallpaper.stored,visible:wallpaper.grid,dayAlpha:wallpaperAlpha,restored:true,dim:65,removedAfterReload};
  console.log('CALENDAR_WALLPAPER_PERSISTENCE_OK '+JSON.stringify({viewport,...geom.wallpaperPersistence}));
  assert.equal(errors.length,0,JSON.stringify(errors));
  writeFileSync(path.join(captureDir,'geometry-'+viewport[0]+'.json'),JSON.stringify({viewport,geom,scene,requests:summary(calls)},null,2));
  console.log('CALENDAR_VISUAL_CAPTURE_OK '+JSON.stringify({viewport,geom}));
 }else if(operationMQA){
  const captureDir=process.env.MWS_OPERATION_M_CAPTURE;
  if(captureDir){const {mkdirSync}=await import('node:fs');mkdirSync(captureDir,{recursive:true})}
  const capture=async(label,w,h)=>{if(!captureDir)return;const shot=await browser.captureScreenshot();writeFileSync(path.join(captureDir,'full-'+label+'-'+w+'x'+h+'.jpg'),Buffer.from(shot,'base64'));if(w===1726&&['overview','agent','roster'].includes(label))console.log('OPERATION_M_FULL_'+label.toUpperCase()+' '+shot)};
  const inspect=async(sel)=>browser.evaluate('('+function(sel){
   const q=s=>document.querySelector(s),v=q(sel),box=v.getBoundingClientRect(),limit=q('#mwsAccessTools')?.getBoundingClientRect().top||innerHeight;
   const parent=q('#operationM').getBoundingClientRect();
   const content=q('.app>.main').getBoundingClientRect();
   const contains=(outer,inner)=>inner.top>=outer.top-2&&inner.bottom<=outer.bottom+2&&inner.left>=outer.left-2&&inner.right<=outer.right+2;
   return {bottom:box.bottom,top:box.top,limit,width:box.width,root:parent.width,fit:box.bottom<=limit+3,overflow:box.right>content.right+2||box.left<content.left-2||document.documentElement.scrollWidth>innerWidth+2,logo:!!q('.op-page-label .op-command-emblem'),geometry:[...v.querySelectorAll('.op-squad-card')].every(c=>contains(c.getBoundingClientRect(),c.querySelector('.op-squad-roster').getBoundingClientRect())&&[...c.querySelectorAll('.op-agent-row')].every(b=>contains(c.getBoundingClientRect(),b.getBoundingClientRect())&&b.querySelector('strong').scrollWidth<=b.querySelector('strong').clientWidth+1)),commander:!q('.op-dossier-command')||contains(q('.op-dossier-command').getBoundingClientRect(),q('.op-command-nameplate').getBoundingClientRect())&&contains(q('.op-dossier-command').getBoundingClientRect(),q('.op-dossier-command .op-commander-art').getBoundingClientRect()),members:!q('.op-agent-detail')||q('.op-dossier-portrait').getBoundingClientRect().bottom<=q('.op-dossier-squad').getBoundingClientRect().top+2,version:[...document.querySelectorAll('link[rel=stylesheet],script[src]')].map(e=>e.getAttribute('href')||e.getAttribute('src')).filter(x=>x?.includes('operation-m-v1.'))};
  }.toString()+')('+JSON.stringify(sel)+')');
  for(const [w,h] of [[1366,768],[1726,892],[1913,901],[2560,1440],[390,844]]){
   if(w!==1366){await browser.navigate(base+':'+server.address().port+'/',w,h,w<761);await until(()=>browser.evaluate("(()=>{document.querySelector('#mwsAnnouncementDialog[open] .mws-notice-close')?.click();return !!window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')})()"),'Full app reload ready')}
   await browser.evaluate("window.setTab('operationM')");
   await until(()=>browser.evaluate("!!document.querySelector('.op-command-overview')"),'Operation M overview ready');
   await pause(350);
   const overview=await inspect('.op-command-overview');assert(overview.logo&&overview.geometry&&!overview.overflow&&overview.version.length===2&&overview.version.every(x=>x.includes('v=18')),JSON.stringify({w,h,overview}));if(w>=1366)assert(overview.fit,JSON.stringify({w,h,overview}));await capture('overview',w,h);
   if(w>=1366){
    await until(()=>browser.evaluate("(()=>{const imgs=[...document.querySelectorAll('.op-agent-row .op-portrait img')];return imgs.length===20&&imgs.every(x=>x.complete&&x.naturalWidth>0&&getComputedStyle(x).visibility==='visible')})()"),'All twenty roster contact media decoded');
    const profileMedia=await browser.evaluate("(()=>[...document.querySelectorAll('.op-agent-row')].map(row=>{const img=row.querySelector('img');return{n:row.dataset.opAgent,src:img.dataset.mwsCdnContactSource||img.getAttribute('src'),id:img.dataset.contactId||''}}))()");
    for(const entry of profileMedia){const expected=contacts[OP_ROSTER.indexOf(entry.n)];assert(expected&&((entry.src||'').includes('/media/contact/'+expected.id+'?')||entry.id===expected.id),JSON.stringify(entry))}
    console.log('OPERATION_M_FULL_APP_PROFILE_MEDIA_OK '+JSON.stringify({w,h,count:profileMedia.length}));
   }
   if(w>=1366){
    const pt=await browser.evaluate("(()=>{const e=document.querySelector('.op-squad-hero .op-commander-art'),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");
    await browser.movePoint(pt.x,pt.y);await pause(280);
    assert(await browser.evaluate("document.querySelector('.op-squad-hit').matches(':hover')"),'Commander real hover did not hit team button');
    await browser.clickPoint(pt.x,pt.y);
   }else await browser.evaluate("document.querySelector('[data-op-squad=mudok]').click()");
   await pause(150);const team=await inspect('.op-squad-detail');assert(!team.overflow,JSON.stringify({w,h,team}));if(w>=1366)assert(team.fit,JSON.stringify({w,h,team}));await capture('team',w,h);
   await browser.evaluate("document.querySelector('.op-agent-tile').click()");await pause(150);const agent=await inspect('.op-agent-detail');assert(agent.commander&&agent.members&&!agent.overflow,JSON.stringify({w,h,agent}));if(w>=1366)assert(agent.fit,JSON.stringify({w,h,agent}));await capture('agent',w,h);
   await browser.evaluate("document.querySelector('[data-op-action=tab-draft]').click()");await pause(300);const roster=await inspect('.op-roster');assert(roster.logo&&!roster.overflow,JSON.stringify({w,h,roster}));if(w>=1366)assert(roster.fit,JSON.stringify({w,h,roster}));await capture('roster',w,h);
   await browser.evaluate("document.querySelector('[data-op-action=tab-tier]').click()");await pause(200);const choice=await inspect('.op-mode-choice');assert(!choice.overflow,JSON.stringify({w,h,choice}));await capture('choice',w,h);
   await browser.evaluate("document.querySelector('[data-op-action=start-list]').click()");await pause(150);const board=await inspect('.op-tier-workspace');assert(!board.overflow,JSON.stringify({w,h,board}));if(w>=1366)assert(board.fit,JSON.stringify({w,h,board}));await capture('board',w,h);
   await browser.evaluate("document.querySelector('[data-op-action=choose-mode]').click();document.querySelector('[data-op-action=start-guided]').click();document.querySelector('[data-op-action=skip-guided]').click();document.querySelector('[data-op-action=skip-guided]').click()");await pause(200);const guided=await inspect('.op-guided');assert(!guided.overflow,JSON.stringify({w,h,guided}));if(w>=1366)assert(guided.fit,JSON.stringify({w,h,guided}));await capture('guided',w,h);
   await browser.evaluate("document.querySelector('[data-op-action=tab-result]').click()");await pause(150);const result=await inspect('.op-teams');assert(!result.overflow,JSON.stringify({w,h,result}));if(w>=1366)assert(result.fit,JSON.stringify({w,h,result}));await capture('result',w,h);
   console.log('OPERATION_M_FULL_APP_VIEW_OK '+JSON.stringify({w,h,overview,team,agent,roster,choice,board,guided,result}));
  }
  assert.equal(errors.length,0,JSON.stringify(errors));console.log('OPERATION_M_FULL_APP_OK');
 }else if(compareMode){
  const snapshots=[];
  const selectors=['.app','.app>.sidebar','.app>.main','.nav-scroll','.nav button.active','.nav button.active .nav-icon','.nav button.active .nav-label','.sidebar .logo','#pageTextScaleControlV54','.topbar','#pageTitle','#calendar .calendar-topbar-v4','#calendarYearSelect','#calendarMonthSelect','#calendarGrid','#calendarGrid .day','#calendarGrid .mini-event','#calendarGroupToggleV2','#calendarGroupManageToggleV4','#calendarCopyTray','#calendarGroupManagerPanelV4','#calendarGroupMawangLinkV2','#contacts .contact-grid','#contacts .contact-card','#bsandong .bs-tabs','#bsandong .bs-summary','#gameF1Racing','#wardogs','#achievements','#careerTimeline','.section.active','.section.active button','.section.active select'];
  const take=async label=>{
   await pause(250);
   const data=await browser.evaluate('('+function(sel){
    const out={};const props=['display','visibility','position','boxSizing','gridTemplateColumns','gridTemplateRows','flexDirection','alignItems','justifyContent','overflowX','overflowY','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','gap','fontSize','fontWeight','lineHeight','borderRadius','borderTopWidth','borderTopColor','backgroundColor','color','boxShadow','opacity','minWidth','maxWidth','minHeight','maxHeight','transitionProperty','transitionDuration'];
    for(const s of sel){const e=document.querySelector(s);if(!e)continue;const c=getComputedStyle(e),r=e.getBoundingClientRect();out[s]={rect:[r.x,r.y,r.width,r.height].map(n=>Math.round(n*10)/10),css:Object.fromEntries(props.map(p=>[p,c[p]]))}}
    return out
   }.toString()+')('+JSON.stringify(selectors)+')');
   snapshots.push({label,data});
  };
  await nav(['calendar']);await take('calendar-default');
  if(viewport[0]>=761){
   await browser.movePoint(500,300);
   await browser.evaluate("(()=>{if(document.body.classList.contains('sidebar-pinned'))document.getElementById('sidebarPinBtn').click()})()");await take('calendar-rail');
   await browser.movePoint(30,320);await take('calendar-expanded');
   await browser.movePoint(500,300);await pause(250);
   await browser.evaluate("(()=>{if(!document.body.classList.contains('sidebar-pinned'))document.getElementById('sidebarPinBtn').click()})()");await pause(250);
   await browser.evaluate("document.getElementById('calendarGroupManageToggleV4').click()");await take('calendar-group-manager');
   await browser.evaluate("document.getElementById('calendarGroupManageToggleV4').click()");
   await browser.evaluate("document.getElementById('calendarCopyTrayToggleV4').click()");await take('calendar-copy-tray');
   await browser.evaluate("document.getElementById('calendarCopyTrayCloseV4').click()");
  }
  for(const route of ['contacts','bsandong','wardogs','achievements','careerTimeline','gameF1Racing','gameLadder','posts','calendar']){await nav([route]);await take(route)}
  await browser.evaluate("document.body.dataset.theme='light'");await take('calendar-light');
  await browser.evaluate("document.body.dataset.theme='neon';window.applyTextScale?.(125,false)");await take('calendar-scale125');
  const result={viewport,snapshots,startup:summary(startup),styles:[...new Set(assetReads)],styleRequests:assetReads.length,api:summary(calls.filter(r=>r.path.startsWith('/api/'))),errors};
  assert.equal(errors.length,0,JSON.stringify(errors));
  const output=process.env.MWS_QA_COMPARE_OUTPUT;assert(output);writeFileSync(output,JSON.stringify(result,null,2));console.log('CSS_COMPARE_CAPTURE '+JSON.stringify({viewport,states:snapshots.length,styles:result.styles.length,api:result.api}));
 }else if(process.env.MWS_QA_ADMIN_BATCH==='1'){
  const offset=calls.length;
  await browser.evaluate("document.querySelector('#mwsChangeModeBtn').click()");
  await until(()=>browser.evaluate("document.querySelector('#mwsLoginForm').dataset.mode==='admin'"),'Admin login form');
  await browser.evaluate("document.querySelector('#mwsLoginId').value='Majoku0216';document.querySelector('#mwsLoginPw').value='local-fixture-only';document.querySelector('#mwsLoginForm').requestSubmit()");
  await until(()=>browser.evaluate("document.body.dataset.mwsMode==='admin'&&!document.body.classList.contains('mws-app-loading')&&!document.body.classList.contains('mws-gated')&&!!window.__mwsAppReadyV130"),'Admin ready');
  await pause(600);
  const result=await browser.evaluate("(()=>{const r=window.mwsV55EgressReport();return {parts:r.loadedParts.slice().sort(),dirty:r.dirtyParts,scope:r.mode,events:data.events.length,contacts:data.contacts.length}})()");
  assert.equal(result.scope,'admin');assert.equal(result.parts.length,10);assert.equal(result.dirty.length,0);
  assert.equal(result.events,parts.events.length);assert.equal(result.contacts,parts.contacts.length);
  const login=calls.slice(offset),batch=login.filter(r=>r.path==='/api/parts-batch'||r.path.startsWith('/api/parts/'));
  const report={login:summary(login),partRequests:batch.length,result};
  if(process.env.MWS_QA_ADMIN_EXPECT_MAX)assert(batch.length<=Number(process.env.MWS_QA_ADMIN_EXPECT_MAX),'Admin data reads '+JSON.stringify(report));
  writeFileSync(process.env.MWS_QA_COMPARE_OUTPUT,JSON.stringify(report,null,2));console.log('ADMIN_BATCH_OK '+JSON.stringify(report));
 }else if(firstPaintQA){
  const verify=async phase=>{
   const frames=await browser.evaluate('window.qaPaintFrames.slice()');
   const pending=frames.filter(f=>!f.ready),ready=frames.filter(f=>f.ready);
   assert(pending.length>=3&&ready.length>=3,'Insufficient startup frames '+JSON.stringify({pending:pending.length,ready:ready.length}));
   const bad=frames.filter(f=>f.tray!=='none'||f.toolFont!=='0px'||!f.toolIcon||!f.correctDate);
   assert.equal(bad.length,0,'Legacy controls visible: '+JSON.stringify(bad.slice(0,4)));
   const settled=ready.at(-1);
   const geometry=frames.filter(f=>Math.abs(f.sideLeft-settled.sideLeft)>2||Math.abs(f.sideWidth-settled.sideWidth)>2||Math.abs(f.mainLeft-settled.mainLeft)>2||f.mainBorder!==settled.mainBorder||f.mainBg!==settled.mainBg);
   assert.equal(geometry.length,0,'Visible layout changed: '+JSON.stringify({first:geometry.slice(0,3),settled}));
   console.log('FIRST_PAINT_STAGE1_OK '+JSON.stringify({phase,viewport,frames:frames.length,pending:pending.length,ready:ready.length,first:frames[0],last:settled}));
  };
  await verify('cold');
  await browser.evaluate("document.getElementById('calendarCopyTrayToggleV4').click()");
  assert.equal(await browser.evaluate("document.getElementById('calendarCopyTray').hidden"),false);
  await browser.evaluate("document.getElementById('calendarCopyTrayCloseV4').click()");
  assert.equal(await browser.evaluate("document.getElementById('calendarCopyTray').hidden"),true);
  const previousOrigin=await browser.evaluate('performance.timeOrigin');
  await browser.reload(false);
  await until(async()=>{try{return await browser.evaluate("performance.timeOrigin!=="+previousOrigin+"&&!!window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')&&document.body.dataset.calendarStartup==='ready'&&window.qaPaintFrames?.filter(f=>f.ready).length>=5")}catch{return false}},'Reload ready');
  await pause(350);await verify('warm');
 }else if(process.env.MWS_QA_SIDEBAR_HOVER==='1'){
  const state=()=>browser.evaluate("(()=>{const s=document.querySelector('.app>.sidebar'),r=s.getBoundingClientRect(),m=document.querySelector('.main').getBoundingClientRect(),l=s.querySelector('[data-tab=calendar] .nav-label');return {expanded:s.classList.contains('mws-sidebar-expanded-v2'),left:r.left,right:r.right,width:r.width,top:r.top,mainLeft:m.left,label:getComputedStyle(l).visibility,pinned:document.body.classList.contains('sidebar-pinned')}})()");
  await browser.movePoint(500,300);
  await browser.evaluate("(()=>{if(document.body.classList.contains('sidebar-pinned'))document.getElementById('sidebarPinBtn').click();return true})()");await pause(250);
  const closed=await state();assert(!closed.pinned&&!closed.expanded&&Math.abs(closed.width-72)<2,JSON.stringify(closed));
  await browser.evaluate("window.qaSidebarTransitions=[];new MutationObserver(()=>{const s=document.querySelector('.app>.sidebar');const v=s.classList.contains('mws-sidebar-expanded-v2');if(window.qaSidebarTransitions.at(-1)!==v)window.qaSidebarTransitions.push(v)}).observe(document.querySelector('.app>.sidebar'),{attributes:true,attributeFilter:['class']});");
  const offset=calls.length;
  for(const x of [1,30,70,71,69,72,73,71,68]){
   await browser.movePoint(x,320);await pause(45);
  }
  await pause(300);
  const opened=await state();assert(opened.expanded&&opened.width>=180&&opened.label==='visible','Cannot expand '+JSON.stringify(opened));
  assert(Math.abs(opened.left-closed.left)<1&&Math.abs(opened.top-closed.top)<1&&Math.abs(opened.mainLeft-closed.mainLeft)<1,'Sidebar geometry jumps');
  for(let i=0;i<15;i++){await browser.movePoint(70+i%4,320);await pause(30)}
  await browser.movePoint(opened.right-10,320);await pause(200);assert((await state()).expanded,'Expanded content is not reachable');
  await browser.movePoint(opened.right+20,320);await pause(400);
  const after=await state();assert(!after.expanded&&Math.abs(after.width-72)<2,'Close failed '+JSON.stringify(after));
  const transitions=await browser.evaluate('window.qaSidebarTransitions');assert.deepEqual(transitions,[true,false],'Oscillating expansion');
  await browser.movePoint(30,320);await pause(250);
  const pin=await browser.evaluate("(()=>{const r=document.getElementById('sidebarPinBtn').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  await browser.clickPoint(pin.x,pin.y);await pause(250);assert((await state()).pinned,'Pin click failed');
  await browser.movePoint(500,300);await pause(200);assert((await state()).pinned,'Pinned state lost');
  assert.equal(calls.slice(offset).filter(r=>r.path.startsWith('/api/')).length,0,'Sidebar interactions emit data requests');
  await nav(['calendar']);
  await browser.evaluate("document.getElementById('calendarGroupManageToggleV4').click()");await pause(300);
  const select=await browser.evaluate("(()=>{const s=document.getElementById('calendarGroupMawangLinkV2'),c=getComputedStyle(s),r=s.getBoundingClientRect();return {height:r.height,paddingTop:parseFloat(c.paddingTop),paddingBottom:parseFloat(c.paddingBottom),font:parseFloat(c.fontSize),lineHeight:c.lineHeight,width:r.width,scrollWidth:s.scrollWidth,clientWidth:s.clientWidth,display:c.display}})()");
  assert(select.height>=42&&select.height-select.paddingTop-select.paddingBottom>=select.font*1.7&&select.width>120&&select.display==='block','Select line clipped '+JSON.stringify(select));
  await browser.evaluate("document.getElementById('calendarGroupMawangLinkV2').focus();document.getElementById('calendarGroupMawangLinkV2').value='bsandong';");
  assert.equal(await browser.evaluate("document.getElementById('calendarGroupMawangLinkV2').value"),'bsandong');
  console.log('SIDEBAR_HOVER_SELECT_OK '+JSON.stringify({closed,opened,after,transitions,select}));
 }else if(bsandongQA){
  const mode=process.env.MWS_QA_IDLE_MODE||'public';
  if(mode==='admin'){
   await browser.evaluate("document.querySelector('#mwsChangeModeBtn').click()");
   await until(()=>browser.evaluate("document.querySelector('#mwsLoginForm').dataset.mode==='admin'"),'Admin login form');
   await browser.evaluate("document.querySelector('#mwsLoginId').value='Majoku0216';document.querySelector('#mwsLoginPw').value='local-fixture-only';document.querySelector('#mwsLoginForm').requestSubmit()");
   await until(()=>browser.evaluate("document.body.dataset.mwsMode==='admin'&&!document.body.classList.contains('mws-app-loading')&&!document.body.classList.contains('mws-gated')"),'Admin ready');await pause(2000);
  }
  await nav(['calendar']);await pause(500);
  const offset=calls.length;
  await browser.evaluate("(()=>{const g=document.querySelector('[data-mws-nav-group=mawangContent]');if(g.getAttribute('aria-expanded')==='false')g.click();document.querySelector('.nav button[data-tab=bsandong]').click();return true})()");
  await until(()=>browser.evaluate("document.querySelector('#bsandong').classList.contains('active')&&document.querySelectorAll('.bs-session').length===3"),'Bsandong real app history');
  await pause(700);
  const initial=calls.slice(offset);assert.equal(initial.filter(r=>r.path.startsWith('/api/')).length,0,'Unexpected first-entry API request');
  const warmOffset=calls.length;
  const result=await browser.evaluate(`(()=>{const q=s=>document.querySelector(s);q('[data-bs-tab=members]').click();const rows=[...document.querySelectorAll('.bs-member')].map(e=>e.innerText);q('[data-bs-tab=stats]').click();q('[data-bs-field=person]').value='qa0';q('[data-bs-field=person]').dispatchEvent(new Event('change',{bubbles:true}));const rate=q('.bs-big').textContent;q('[data-bs-preset="30"]').click();q('[data-bs-tab=history]').click();return {rows,rate,history:document.querySelectorAll('.bs-session').length}})()`);
  assert.equal(result.rows.length,2);assert.equal(result.rate,'67%');assert.equal(result.history,3);assert(result.rows.some(s=>s.includes('Fixture 0')&&s.includes('1회')),'Missed session missing');
  await nav(['calendar','bsandong','calendar','bsandong']);await pause(700);
  const warm=calls.slice(warmOffset);assert.equal(warm.filter(r=>r.path.startsWith('/api/')).length,0,'Warm interactions emitted API request');
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log('BSANDONG_REAL_APP_OK '+JSON.stringify({mode,initial:summary(initial),warm:summary(warm),rows:result.rows.length,rate:result.rate}));
  if(mode==='admin'){
   await nav(['calendar']);await pause(300);
   const geometry=()=>browser.evaluate("(()=>{const g=document.querySelector('#calendarGrid'),r=g.getBoundingClientRect(),days=[...g.querySelectorAll('.day[data-date]')];return {top:r.top,bottom:r.bottom,height:r.height,rows:days.length,last:days.at(-1)?.getBoundingClientRect().bottom,viewport:innerHeight,width:r.width}})()");
   const closed=await geometry();
   await browser.evaluate("document.getElementById('calendarGroupToggleV2').click()");await pause(450);
   const open=await geometry();
   assert.equal(open.rows,closed.rows);assert(open.height>=closed.height-15,'Group panel shrinks month '+JSON.stringify({closed,open}));assert(open.last<=open.viewport+2,'Last row outside viewport');
   await browser.evaluate("document.getElementById('calendarGroupCancelV2').click()");await pause(400);
   const restored=await geometry();assert(Math.abs(restored.height-closed.height)<=15,'Group close height not restored');
   await browser.evaluate("document.getElementById('calendarGroupManageToggleV4').click()");await pause(450);
   const managed=await geometry();assert(managed.height>=closed.height-15&&managed.last<=managed.viewport+2,'Manager shrinks month '+JSON.stringify({closed,managed}));
   const beforeSave=await browser.evaluate("JSON.stringify(data.events.find(e=>e.id==='bs-qa-21'))");
   await browser.evaluate("document.getElementById('calendarGroupBulkV2').open=true");await pause(150);
   const candidates=await browser.evaluate("(()=>{document.getElementById('calendarGroupBulkPreviewV2').click();const rows=[...document.querySelectorAll('#calendarGroupBulkListV2 input[type=checkbox]')];document.getElementById('calendarGroupBulkAllV2').click();return {count:rows.length,selected:[...document.querySelectorAll('#calendarGroupBulkListV2 input:checked')].length}})()");
   assert.equal(candidates.count,1);assert.equal(candidates.selected,1);
   await browser.evaluate("window.confirm=()=>true;document.getElementById('calendarGroupBulkApplyV2').click()");
   try{await until(()=>browser.evaluate("data.events.find(e=>e.id==='bs-qa-21')?.contentGroupId==='qa-club-group'&&document.querySelector('#calendarGroupManagerPanelV4')?.textContent.includes('저장 및 검증 완료')"),'Bulk persisted')}catch(error){console.log('BULK_DIAGNOSTICS '+JSON.stringify({ui:await browser.evaluate("({group:data.events.find(e=>e.id==='bs-qa-21')?.contentGroupId,status:document.querySelector('#calendarGroupManagerPanelV4 .calendar-group-persist-status-v1')?.textContent,bulk:document.getElementById('calendarGroupBulkStatusV2')?.textContent,disabled:document.getElementById('calendarGroupBulkApplyV2')?.disabled,groups:data.contentGroups})"),calls:summary(calls),errors}));throw error}
   const afterSave=JSON.parse(await browser.evaluate("JSON.stringify(data.events.find(e=>e.id==='bs-qa-21'))"));const beforeEvent=JSON.parse(beforeSave);delete afterSave.contentGroupId;delete beforeEvent.contentGroupId;assert.deepEqual(afterSave,beforeEvent,'Non-group schedule fields changed');
   console.log('BSANDONG_GROUP_LAYOUT_BULK_OK '+JSON.stringify({closed,open,managed,restored,bulk:candidates}));
  }
 }else if(process.env.MWS_QA_V5_ATTRIBUTION==='1'){
  const mode=process.env.MWS_QA_IDLE_MODE||'public';
  if(mode==='admin'){
   await browser.evaluate("document.querySelector('#mwsChangeModeBtn').click()");
   await until(()=>browser.evaluate("document.querySelector('#mwsLoginForm').dataset.mode==='admin'"),'Admin login form');
   await browser.evaluate("document.querySelector('#mwsLoginId').value='Majoku0216';document.querySelector('#mwsLoginPw').value='local-fixture-only';document.querySelector('#mwsLoginForm').requestSubmit()");
   await until(()=>browser.evaluate("document.body.dataset.mwsMode==='admin'&&!document.body.classList.contains('mws-app-loading')&&!document.body.classList.contains('mws-gated')"),'Admin ready');
   await pause(2000);
  }
  const sequence=[...routes,'posts','friendFinder','contentApplications','calendar'];
  for(let round=1;round<=2;round++){
   const start=calls.length;
   for(const route of sequence){
    const off=calls.length;await nav([route]);
    if(process.env.MWS_QA_V51_SCROLL==='1'&&route==='contacts'){
     for(const fraction of [0,.25,.5,.75,1,0]){
      await browser.evaluate('(()=>{const g=document.querySelector("#contactGrid");if(!g)return;let p=g;while(p&&p.scrollHeight<=p.clientHeight+2)p=p.parentElement;if(!p)p=document.scrollingElement;p.scrollTop=Math.round((p.scrollHeight-p.clientHeight)*'+fraction+');})()');
      await pause(400);
     }
     await browser.evaluate("window.openContact('qa0')");
     await until(()=>browser.evaluate("document.getElementById('contactModal')?.classList.contains('open')"),'Contact detail');
     await browser.evaluate("document.querySelector('[data-close=contactModal]').click()");
    }
    if(scale&&route==='posts'){
     for(const id of ['scale-post-0','scale-post-'+(scalePosts-1)]){await browser.evaluate('window.selectPost('+JSON.stringify(id)+')');await pause(400)}
    }
    await pause(400);const r=calls.slice(off);
    console.log('V51_EXT_ROUTE '+JSON.stringify({mode,scale,round,route,worker:summary(r),statuses:r.filter(x=>x.status>=400).map(x=>({path:x.path.replace(/\/media\/[^/]+\/.*/,'/media/*'),status:x.status}))}));
   }
   await pause(1800);const rows=calls.slice(start);
   console.log('V51_EXT_ROUND '+JSON.stringify({mode,scale,round,worker:summary(rows),errors}));
   if(round===2){
    assert.equal(rows.filter(common).length,0,'Repeated navigation reloaded workspace data');
    assert.equal(rows.filter(r=>r.path.startsWith('/media/contact/')||r.path.startsWith('/media/achievement/')||r.path==='/api/media-batch-v5').length,0,'Repeated navigation reloaded identical media');
   }
  }
  assert.equal(errors.length,0,JSON.stringify(errors));
  const idleStart=calls.length;await pause(30000);console.log('V51_EXT_IDLE '+JSON.stringify({mode,scale,seconds:30,worker:summary(calls.slice(idleStart))}));assert.equal(calls.length,idleStart,'Idle calendar requests');
 }else if(scale){
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
 // Premium environment scope and stable dashboard geometry using the real app.
 if(viewport[0]>=901){
  await nav(['dashboard']);
  const room=await browser.evaluate(`(()=>{const main=document.querySelector('.app>.main'),cards=[...document.querySelectorAll('#dashboardOverviewMode .dashboard-kpi-grid-local>.card')];const style=getComputedStyle(main);return {overview:document.querySelector('#dashboardOverviewMode').classList.contains('active'),art:style.backgroundImage.includes('data:image/svg+xml'),metrics:cards.length,stable:cards.every(c=>{const r=c.getBoundingClientRect();return r.width>0&&r.height>0&&r.right<=main.getBoundingClientRect().right+2}),visible:cards.every(c=>!!c.querySelector('.kpi strong')?.textContent.trim())}})()`);
  assert(room.overview&&room.art&&room.metrics===6&&room.stable&&room.visible,JSON.stringify(room));
  const statsOffset=calls.length;
  const statsCheck=await browser.evaluate(`(()=>{const root=document.getElementById('dashboardScheduleStatsV1'),range=document.getElementById('dashboardStatsRangeV1'),chart=document.getElementById('dashboardStatsChartV1');if(!root||root.hidden)return {visible:false};const initial=chart.children.length;const original=JSON.stringify(data.events);range.value='7';range.dispatchEvent(new Event('change',{bubbles:true}));root.querySelector('[data-stats-metric=count]').click();chart.firstElementChild.click();const expected=window.mwsDashboardScheduleStatsV1.summarize(data.events,todayKST(),7);const selected=chart.querySelector('[aria-pressed=true]');const stable=chart.firstElementChild;renderDashboardInsightsV55();return {visible:true,initial,days:chart.children.length,selected:selected?.dataset.statsDate===expected.days[0].date,metric:root.querySelector('[data-stats-metric=count]').getAttribute('aria-pressed')==='true',count:document.getElementById('dashboardStatsCountV1').textContent===expected.count+'개',noMutation:JSON.stringify(data.events)===original,stable:chart.firstElementChild===stable}})()`);
  assert.deepEqual(statsCheck,{visible:true,initial:30,days:7,selected:true,metric:true,count:true,noMutation:true,stable:true});
  assert.equal(calls.slice(statsOffset).filter(common).length,0,'Dashboard chart controls fetched common data');
  console.log('PREMIUM_STATS_OK '+JSON.stringify(statsCheck));
  await browser.evaluate("document.querySelector('[data-dashboard-mode=reminders]').click()");
  assert.equal(await browser.evaluate("getComputedStyle(document.querySelector('.app>.main')).backgroundImage.includes('data:image/svg+xml')"),false,'Dashboard art leaked into reminder mode');
  await browser.evaluate("document.querySelector('[data-dashboard-mode=overview]').click()");
  await nav(['contacts']);
  assert.equal(await browser.evaluate("getComputedStyle(document.querySelector('.app>.main')).backgroundImage.includes('data:image/svg+xml')"),false,'Dashboard art leaked into contacts');
  await nav(['calendar']);
  console.log('PREMIUM_ENVIRONMENT_SCOPE_OK '+JSON.stringify(room));
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
