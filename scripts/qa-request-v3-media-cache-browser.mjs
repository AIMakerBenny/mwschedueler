import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
assert.equal(process.env.MWS_QA_OFFLINE,'1','Offline fixture only');
const count=1005;
const sw=readFileSync(new URL('../mws-media-cache-sw.js',import.meta.url));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf2sAAAAASUVORK5CYII=','base64');
const dir=mkdtempSync(path.join(tmpdir(),'mws-v3-media-'));
let browser,mediaRequests=0;
const blobRequests=new Map(),liveRequests=new Map();
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}).end('<!doctype html><title>Local cache fixture</title><script>window.registration=navigator.serviceWorker.register("/mws-media-cache-sw.js")</script><script src="/assets/achievement-media-v1621.js"></script><script src="/assets/wardogs-media-v1.js"></script>');return}
 if(url.pathname==='/mws-media-cache-sw.js'){res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-cache'}).end(sw);return}
 if(['/assets/achievement-media-v1621.js','/assets/wardogs-media-v1.js'].includes(url.pathname)){
  res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'}).end(readFileSync(new URL('..'+url.pathname,import.meta.url)));return
 }
 if(url.pathname==='/api/soop/live-thumb'){
  const id=url.searchParams.get('bno');liveRequests.set(id,(liveRequests.get(id)||0)+1);
  setTimeout(()=>{if(id==='999')res.writeHead(502,{'content-type':'text/plain','cache-control':'no-store'}).end('fixture failure');else res.writeHead(200,{'content-type':'image/png','cache-control':'public, max-age=60, s-maxage=60'}).end(png)},100);return
 }
 if(/^\/media\/(achievement|wardogs)\/qa\d+$/.test(url.pathname)){
  blobRequests.set(url.pathname,(blobRequests.get(url.pathname)||0)+1);
  setTimeout(()=>res.writeHead(200,{'content-type':'image/png','content-length':png.length,'cache-control':'no-store'}).end(png),100);return
 }
 if(/^\/media\/(contact|workspace)\/qa\d+$/.test(url.pathname)){
  mediaRequests++;
  const bad=url.searchParams.get('h')==='b'.repeat(32),privateRow=url.searchParams.get('h')==='c'.repeat(32);
  res.writeHead(200,{'content-type':'image/png','content-length':png.length,'cache-control':privateRow?'private, no-store':bad?'no-store':'public, max-age=31536000, immutable','x-mws-cache-version':bad?'mismatch':url.searchParams.get('v')+'-'+url.searchParams.get('h')}).end(png);return
 }
 res.writeHead(404).end();
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,label)=>{for(let i=0;i<300;i++){if(await fn())return;await wait(50)}throw Error(label)};
const urls=Array.from({length:count},(_,i)=>'/media/contact/qa'+i+'?v=1&h='+String(i+1).padStart(32,'0'));
const fetchAll=async values=>{for(let i=0;i<values.length;i+=20){const group=values.slice(i,i+20);assert(await browser.evaluate('(async()=>{const urls='+JSON.stringify(group)+';await Promise.all(urls.map(async u=>{const r=await fetch(u,{cache:"reload"});if(!r.ok||!(await r.blob()).size)throw Error("Invalid image")}));return true})()'))}};
const size=()=>browser.evaluate('(async()=>{const c=await caches.open("mws-public-versioned-media-v1");return (await c.keys()).length})()');
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port+'/';
 const open=async()=>{browser=await launchCalendarBrowser(dir);await browser.navigate(origin,1280,720);await until(()=>browser.evaluate('!!navigator.serviceWorker.controller'),'Service Worker not controlling fixture')};
 await open();
 await fetchAll(urls);await until(async()=>await size()===count,'Cache did not retain 1005 images');
 assert.equal(mediaRequests,count);
 const first=mediaRequests;
 await fetchAll(urls);assert.equal(mediaRequests,first,'Warm image re-fetch');
 await browser.close();browser=null;
 await open();assert.equal(await size(),count);
 await fetchAll(urls);assert.equal(mediaRequests,first,'Persistent image re-fetch');
 const updated='/media/contact/qa0?v=2&h='+'f'.repeat(32);
 await fetchAll([updated]);await until(async()=>await size()===count+1,'Updated revision not cached');
 assert.equal(mediaRequests,first+1);
 console.log('V3_MEDIA_CACHE_BROWSER_OK '+JSON.stringify({images:count,cold:count,warm:0,restart:0,changed:1,retained:await size(),origin:'loopback'}));
 const workspace=Array.from({length:30},(_,i)=>'/media/workspace/qa'+i+'?v=1&h='+String(i+1).padStart(32,'0'));
 const beforeWorkspace=mediaRequests;
 await fetchAll(workspace);await until(async()=>await size()===count+31,'Workspace images not persisted');
 assert.equal(mediaRequests-beforeWorkspace,30);
 await fetchAll(workspace);assert.equal(mediaRequests-beforeWorkspace,30);
 const bad='/media/workspace/qa0?v=2&h='+'b'.repeat(32),priv='/media/workspace/qa0?v=2&h='+'c'.repeat(32);
 await fetchAll([bad,priv]);await fetchAll([bad,priv]);
 assert.equal(mediaRequests-beforeWorkspace,34,'Unverified or private image reused');
 assert.equal(await size(),count+31);
 console.log('V3_WORKSPACE_MEDIA_OK '+JSON.stringify({cold:30,warm:0,unverifiedRequests:4,unverifiedRetained:0}));
 const sibling=await browser.sibling(origin);
 await until(()=>sibling.evaluate('!!window.mwsAchievementMediaV1&&!!window.mwsWardogsMediaV1').catch(()=>false),'Second tab media APIs ready');
 const readBlob=(kind,id)=>'(async()=>{const media=window['+JSON.stringify(kind)+'];const items=await Promise.all(Array.from({length:20},()=>media.getBlob('+JSON.stringify(id)+')));return items.every(b=>b instanceof Blob&&b.size>0)})()';
 for(const [kind,route] of [['mwsAchievementMediaV1','achievement'],['mwsWardogsMediaV1','wardogs']]){
  const expr=readBlob(kind,'qa0');
  const result=await Promise.all([browser.evaluate(expr),sibling.evaluate(expr)]);
  assert(result.every(Boolean));assert.equal(blobRequests.get('/media/'+route+'/qa0'),1,'Concurrent blob requests for '+route);
  assert(await browser.evaluate(expr));assert.equal(blobRequests.get('/media/'+route+'/qa0'),1);
 }
 await until(()=>sibling.evaluate('!!navigator.serviceWorker.controller'),'Sibling service worker control');
 const readLive=(id,status)=>'(async()=>{const rows=await Promise.all(Array.from({length:10},()=>fetch("/api/soop/live-thumb?bno='+id+'",{cache:"reload"})));return rows.every(r=>r.status==='+status+')})()';
 for(const [id,status] of [['123',200],['999',502]]){
  assert((await Promise.all([browser.evaluate(readLive(id,status)),sibling.evaluate(readLive(id,status))])).every(Boolean));
  assert.equal(liveRequests.get(id),1,'Duplicate live thumbnail '+id);
  assert(await browser.evaluate(readLive(id,status)));assert.equal(liveRequests.get(id),1);
 }
 const liveCacheCount=await browser.evaluate('(async()=> (await (await caches.open("mws-public-live-thumb-v3")).keys()).length)()');
 assert.equal(liveCacheCount,1,'Only verified successful live image persisted');
 assert.equal(await size(),count+31,'Live cache touched immutable media');
 console.log('V3_LIVE_THUMB_CACHE_OK '+JSON.stringify({successReads:30,successWorker:1,failureReads:30,failureWorker:1,failedPersisted:0}));
 await browser.closeTarget(sibling.targetId);
 await browser.close();browser=null;await open();
 for(const [kind,route] of [['mwsAchievementMediaV1','achievement'],['mwsWardogsMediaV1','wardogs']]){
  assert(await browser.evaluate(readBlob(kind,'qa0')));assert.equal(blobRequests.get('/media/'+route+'/qa0'),1,'Restart blob re-fetch '+route);
 }
 console.log('V3_IDB_MEDIA_OK '+JSON.stringify({achievementConcurrent:40,wardogsConcurrent:40,achievementRequests:1,wardogsRequests:1,restart:0}));
}finally{
 if(browser)await browser.close();
 await new Promise(r=>server.close(r));
 rmSync(dir,{recursive:true,force:true});
}
