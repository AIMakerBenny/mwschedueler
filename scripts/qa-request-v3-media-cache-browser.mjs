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
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}).end('<!doctype html><title>Local cache fixture</title><script>window.registration=navigator.serviceWorker.register("/mws-media-cache-sw.js")</script>');return}
 if(url.pathname==='/mws-media-cache-sw.js'){res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-cache'}).end(sw);return}
 if(/^\/media\/contact\/qa\d+$/.test(url.pathname)){
  mediaRequests++;
  res.writeHead(200,{'content-type':'image/png','content-length':png.length,'cache-control':'public, max-age=31536000, immutable','x-mws-cache-version':url.searchParams.get('v')+'-'+url.searchParams.get('h')}).end(png);return
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
}finally{
 if(browser)await browser.close();
 await new Promise(r=>server.close(r));
 rmSync(dir,{recursive:true,force:true});
}
