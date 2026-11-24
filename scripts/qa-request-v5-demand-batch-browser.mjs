import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
import {handleMediaBatch} from '../src/media-batch-v5.js';
assert.equal(process.env.MWS_QA_OFFLINE,'1');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf2sAAAAASUVORK5CYII=','base64');
let batches=0,gets=0,individual=0,browser;
const dir=mkdtempSync(path.join(tmpdir(),'mws-v5-demand-'));
const env={MWS_MEDIA_BATCH_V5:'1',IMAGES:{async get(key){gets++;if(key.includes('qa404/'))return null;return {size:png.length,writeHttpMetadata(h){h.set('content-type','image/png')},body:new Blob([png]).stream()}}}};
const server=createServer(async(req,res)=>{
 try{
  const origin='http://127.0.0.1:'+server.address().port,u=new URL(req.url,origin);
  if(u.pathname==='/'){res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'}).end('<!doctype html><title>Demand batch fixture</title><script type="module">import {getDemandedContact} from "/assets/media-batch-client-v5.js";window.loadDemand=getDemandedContact;</script>');return}
  if(['/assets/media-batch-client-v5.js','/assets/media-batch-protocol-v5.js','/mws-media-cache-sw.js'].includes(u.pathname)){res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'}).end(readFileSync(new URL('..'+u.pathname,import.meta.url)));return}
  if(u.pathname==='/api/media-batch-v5'){
    batches++;const r=await handleMediaBatch(new Request(u.href,{method:'POST',headers:req.headers,body:Readable.toWeb(req),duplex:'half'}),env);
    res.writeHead(r.status,Object.fromEntries(r.headers));if(r.body)await pipeline(Readable.fromWeb(r.body),res);else res.end();return;
  }
  if(u.pathname.startsWith('/media/contact/')){individual++;res.writeHead(200,{'content-type':'image/png','content-length':png.length,'cache-control':'public, max-age=31536000, immutable','x-mws-cache-version':u.searchParams.get('v')+'-'+u.searchParams.get('h')}).end(png);return}
  res.writeHead(404).end();
 }catch(e){if(!res.headersSent)res.writeHead(500);res.destroy(e)}
});
const until=async(fn,label)=>{for(let i=0;i<200;i++){if(await fn())return;await new Promise(r=>setTimeout(r,50))}throw Error(label)};
const urls=(n,offset=0)=>Array.from({length:n},(_,i)=>'/media/contact/qa'+(offset+i)+'?v=1&h='+'a'.repeat(32)+'&r=2');
const display=async(values)=>browser.evaluate('(async()=>{const urls='+JSON.stringify(values)+';return Promise.all(urls.map(async u=>{const r=await window.loadDemand(u);if(!r)return false;const blob=await r.blob();const local=URL.createObjectURL(blob);try{const img=new Image();img.src=local;await img.decode();return img.naturalWidth===1}finally{URL.revokeObjectURL(local)}}))})()');
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port+'/';
 const open=async()=>{browser=await launchCalendarBrowser(dir);await browser.navigate(origin,1280,720);await until(()=>browser.evaluate('!!window.loadDemand'),'module not ready')};
 await open();assert.equal(await browser.evaluate('!!navigator.serviceWorker.controller'),false);
 for(const [n,offset] of [[8,0],[102,100],[200,500]]){const before=batches,reads=gets;assert((await display(urls(n,offset))).every(Boolean));assert.equal(batches-before,1);assert.equal(gets-reads,n);const cold=batches;assert((await display(urls(n,offset))).every(Boolean));assert.equal(batches,cold);console.log('V5_BROWSER '+JSON.stringify({n,cold:1,warm:0,r2:n,uncontrolled:true}))}
 await browser.evaluate('navigator.serviceWorker.register("/mws-media-cache-sw.js").then(()=>true)');await until(()=>browser.evaluate('!!navigator.serviceWorker.controller'),'SW not controlling');
 const warm=batches;const all=[...urls(8),...urls(102,100),...urls(200,500)];
 assert(await browser.evaluate('(async()=>{const u='+JSON.stringify(all)+';return (await Promise.all(u.map(async p=>(await fetch(p)).ok))).every(Boolean)})()'));assert.equal(individual,0);
 await browser.close();browser=null;await open();assert((await display(all)).every(Boolean));assert.equal(batches,warm);
 const changed=urls(1)[0].replace('v=1','v=2');assert((await display([changed,changed,...urls(8)])).every(Boolean));assert.equal(batches,warm+1);
 assert.deepEqual(await display([urls(1,404)[0],urls(1,405)[0]]),[false,true]);
 console.log('V5_BROWSER_PERSISTENCE '+JSON.stringify({restart:0,updated:1,individual,cacheEntries:await browser.evaluate('(async()=> (await (await caches.open("mws-public-versioned-media-v1")).keys()).length)()')}));
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true})}
