import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
import {ROSTER,ROLE_NAMES,TIERS} from '../assets/operation-m-model-v1.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const html=readFileSync(path.join(root,'index.html'),'utf8');
assert.equal((html.match(/data-tab="operationM"/g)||[]).length,1);
assert.equal((html.match(/id="operationM"/g)||[]).length,1);
const contacts=[...ROSTER,...ROLE_NAMES].map((n,i)=>({id:'p'+i,name:n==='리냐_LIN…'?'리냐_LINA':n,image:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="blue"/%3E%3C/svg%3E'}));
const fixture='<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;--panel:#151822;--panel2:#282b38;--input:#242735;--border:#434653;--text:#eee;--muted:#aaa;--accent:#6855e8;background:#10111a;color:var(--text);font:14px system-ui}*{box-sizing:border-box}button{font:inherit}</style><link rel="stylesheet" href="/assets/operation-m-v1.css"><h1 id="pageTitle">캘린더</h1><section id="operationM" class="section active"></section><script>let data={contacts:'+JSON.stringify(contacts)+',miniGames:{}};let saves=0;document.body.dataset.mwsMode="public";window.mwsV55EgressReport=()=>({loadedParts:["miniGames"],manifest:{parts:{miniGames:1}}});window.mwsV55SaveNow=async()=>{saves++;return true};window.saveData=()=>{};</script><script type="module" src="/assets/operation-m-v1.js"></script></html>';
let requests=[];const server=createServer((req,res)=>{const route=new URL(req.url,'http://localhost').pathname;requests.push(route);if(route==='/fixture'){res.setHeader('content-type','text/html; charset=utf-8');res.end(fixture);return}if(!/^\/assets\/operation-m-[a-z0-9-]+\.(js|css)$/.test(route)){res.writeHead(404).end();return}res.setHeader('content-type',route.endsWith('.css')?'text/css':'application/javascript');res.end(readFileSync(path.join(root,'.'+route)))});
const dir=mkdtempSync(path.join(os.tmpdir(),'opm-'));let b;
try{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/fixture';b=await launchCalendarBrowser(dir);
for(const [w,h] of [[1366,768],[1920,1080],[390,844]]){
 await b.navigate(url,w,h);await b.evaluate("localStorage.removeItem('mws.operationM.simulation.v1')");await b.navigate(url,w,h);
 const init=await b.evaluate(`(async()=>{const r=document.querySelector('#operationM');await Promise.all([...r.querySelectorAll('.op-roster img')].map(i=>i.decode()));return {coaches:r.querySelectorAll('.op-coach').length,count:r.querySelectorAll('.op-roster-grid .op-player').length,images:r.querySelectorAll('.op-roster-grid img').length,settings:r.querySelectorAll('[data-op-action=open-config]').length,overflow:document.documentElement.scrollWidth>innerWidth+1}})()`);assert.deepEqual(init,{coaches:4,count:20,images:20,settings:0,overflow:false});
 await b.evaluate("document.querySelector('[data-op-action=tab-result]').click()");assert.equal(await b.evaluate("document.querySelectorAll('.op-empty-team').length"),4);
 await b.evaluate("document.querySelector('[data-op-action=tab-tier]').click()");assert.equal(await b.evaluate("document.querySelectorAll('.op-pool .op-player').length"),20);assert.equal(await b.evaluate("document.querySelectorAll('.op-board .op-tier-row').length"),5);
 assert.equal(await b.evaluate("document.querySelector('[data-op-action=draft]').disabled"),true);
 await b.evaluate(`(()=>{const r=document.querySelector('#operationM');for(const [i,n] of ${JSON.stringify(ROSTER)}.entries()){[...r.querySelectorAll('[data-op-player]')].find(x=>x.dataset.opPlayer===n).click();r.querySelector('[data-op-tier="'+['S','A','B','C','D'][i%5]+'"]').click()}r.querySelector('[data-op-action=draft]').click()})()`);
 const result=await b.evaluate(`(()=>{const r=document.querySelector('#operationM');return {sizes:[...r.querySelectorAll('.op-team')].map(t=>t.querySelectorAll('.op-player').length),unique:new Set([...r.querySelectorAll('.op-team .op-player')].map(p=>p.dataset.opPlayer)).size,overflow:document.documentElement.scrollWidth>innerWidth+1,score:[...r.querySelectorAll('.op-team header b')].map(x=>x.textContent)}})()`);assert.deepEqual(result,{sizes:[5,5,5,5],unique:20,overflow:false,score:['15점','15점','15점','15점']});
 await b.navigate(url,w,h);assert.equal(await b.evaluate("document.querySelectorAll('.op-coach').length"),4);
 await b.evaluate("document.querySelector('[data-op-action=tab-tier]').click()");assert.equal(await b.evaluate("document.querySelectorAll('.op-board .op-player').length"),20);
 await b.evaluate("document.body.dataset.mwsMode='admin';window.__mwsAppReadyV130=true;window.mwsOperationM.render();document.querySelector('[data-op-action=open-config]').click()");assert.equal(await b.evaluate("document.querySelectorAll('.op-admin-slot').length"),25);
 await b.evaluate(`(()=>{document.querySelector('[data-op-config="role:1"]').click();const q=document.querySelector('[data-op-search]');q.value='천양';q.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-op-link]').click()})()`);
 await b.evaluate("document.querySelector('[data-op-action=save-config]').click()");
 await b.evaluate("(async()=>{await new Promise(r=>setTimeout(r,20));return true})()");
 const config=await b.evaluate("({saved:saves,roles:data.miniGames.operationMV1.roles,links:Object.keys(data.miniGames.operationMV1.links).length,closed:!document.querySelector('.op-config')})");
 assert.equal(config.saved,1);assert.equal(config.links,20);assert.equal(config.closed,true);assert.equal(config.roles[1],contacts.find(c=>c.name==='천양').id);assert.equal(config.roles[2],contacts.find(c=>c.name==='우왁굳').id);
 await b.evaluate("document.body.dataset.mwsMode='public';window.mwsOperationM.render();document.querySelector('[data-op-action=tab-roster]').click()");assert.equal(await b.evaluate("document.querySelectorAll('[data-op-action=open-config]').length"),0);assert.equal(await b.evaluate("document.querySelectorAll('.op-coach strong')[0].textContent"),'천양');
 await b.evaluate("data.contacts[0].name='변경된 닉네임';window.mwsOperationM.refresh()");assert.equal(await b.evaluate("document.querySelector('[data-op-player=마왕0216] .op-player-name').textContent"),'변경된 닉네임');
 console.log('OPERATION_M_BROWSER_OK',w,h,result);
}
assert(!requests.some(x=>x.startsWith('/api/')));console.log('OPERATION_M_NO_API_REQUESTS',requests.length);
}finally{await b?.close();await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true})}
