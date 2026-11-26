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
const fixture='<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;--panel:#151822;--panel2:#282b38;--input:#242735;--border:#434653;--text:#eee;--muted:#aaa;--accent:#6855e8;background:#10111a;color:var(--text);font:14px system-ui}*{box-sizing:border-box}button{font:inherit}</style><link rel="stylesheet" href="/assets/operation-m-v1.css"><style>.main{padding:16px 22px;min-width:0}body{display:grid;grid-template-columns:clamp(160px,13vw,240px) minmax(0,1fr)} .qa-sidebar{background:#181922;min-height:100vh}.topbar{height:42px;margin-bottom:10px}#mwsAccessTools{position:fixed;bottom:10px;right:10px;height:28px;width:220px} @media(max-width:760px){body{display:block}.qa-sidebar{display:none}.main{padding:8px}}</style><aside class="qa-sidebar"></aside><main class="main"><div class="topbar"><h1 id="pageTitle">오퍼 M</h1></div><section id="operationM" class="section active"></section></main><div id="mwsAccessTools"></div><script>let data={contacts:'+JSON.stringify(contacts)+',miniGames:{}};let saves=0;document.body.dataset.mwsMode="public";window.mwsV55EgressReport=()=>({loadedParts:["miniGames"],manifest:{parts:{miniGames:1}}});window.mwsV55SaveNow=async()=>{saves++;return true};window.saveData=()=>{};</script><script type="module" src="/assets/operation-m-v1.js"></script></html>';
let requests=[];const server=createServer((req,res)=>{const route=new URL(req.url,'http://localhost').pathname;requests.push(route);if(route==='/fixture'){res.setHeader('content-type','text/html; charset=utf-8');res.end(fixture);return}if(!/^\/assets\/operation-m-[a-z0-9-]+\.(js|css)$/.test(route)){res.writeHead(404).end();return}res.setHeader('content-type',route.endsWith('.css')?'text/css':'application/javascript');res.end(readFileSync(path.join(root,'.'+route)))});
const dir=mkdtempSync(path.join(os.tmpdir(),'opm-'));let b;
try{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/fixture';b=await launchCalendarBrowser(dir);
for(const [w,h] of [[1366,768],[1715,894],[1920,1080],[2560,1440],[2560,1080],[390,844]]){
 await b.navigate(url,w,h);await b.evaluate("localStorage.removeItem('mws.operationM.simulation.v1')");await b.navigate(url,w,h);
 const init=await b.evaluate(`(async()=>{const r=document.querySelector('#operationM');await Promise.all([...r.querySelectorAll('.op-roster img')].map(i=>i.decode()));return {coaches:r.querySelectorAll('.op-coach').length,count:r.querySelectorAll('.op-roster-grid .op-player').length,images:r.querySelectorAll('.op-roster-grid img').length,settings:r.querySelectorAll('[data-op-action=open-config]').length,overflow:document.documentElement.scrollWidth>innerWidth+1}})()`);assert.deepEqual(init,{coaches:4,count:20,images:20,settings:0,overflow:false});
 await b.evaluate("document.querySelector('[data-op-action=tab-tier]').click()");
 const empty=await b.evaluate(`(async()=>{await new Promise(requestAnimationFrame);const b=document.querySelector('.op-board').getBoundingClientRect(),p=document.querySelector('.op-pool'),cards=[...p.querySelectorAll('.op-player')];return{height:b.height,top:b.top,bottom:b.bottom,limit:document.querySelector('#mwsAccessTools').getBoundingClientRect().top,rows:new Set(cards.map(c=>Math.round(c.getBoundingClientRect().top))).size,portrait:cards[0].querySelector('.op-portrait').getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth+1}})()`);
 assert(!empty.overflow);if(w>=1366){assert.equal(empty.rows,2);assert(empty.height>=300,JSON.stringify(empty));assert(empty.bottom>=empty.limit-35&&empty.bottom<=empty.limit+2,JSON.stringify(empty));assert(empty.portrait>=70,JSON.stringify(empty))}
 const drop=await b.evaluate(`(()=>[...document.querySelectorAll('.op-tier-row')].map(r=>{const g=r.querySelector('.op-player-grid').getBoundingClientRect(),e=r.querySelector('.op-empty').getBoundingClientRect(),m=r.querySelector('.op-empty-center').getBoundingClientRect(),h=r.querySelector('.op-tier-label').getBoundingClientRect();return{target:e.height,area:g.height,width:e.width,gridWidth:g.width,centerError:Math.abs((m.top+m.bottom-e.top-e.bottom)/2),rankHeight:h.height,crest:r.querySelector('.op-tier-label svg').getBoundingClientRect().width,background:getComputedStyle(r).backgroundImage}}))()`);
 assert.equal(drop.length,5);for(const d of drop){assert(d.target>=Math.min(100,d.area)&&d.target>=d.area-4,JSON.stringify(d));assert(d.width>=d.gridWidth-4,JSON.stringify(d));assert(d.centerError<4,JSON.stringify(d));assert(d.crest>=30,JSON.stringify(d))}
 assert.equal(new Set(drop.map(d=>d.background)).size,5);
 // Select an actual unassigned card then click the middle of the full target.
 await b.evaluate("document.querySelector('.op-pool .op-player').click();document.querySelector('.op-tier-row[data-tier=S] .op-empty').click()");
 assert.equal(await b.evaluate("document.querySelectorAll('.op-tier-row[data-tier=S] .op-player').length"),1);
 await b.evaluate("localStorage.removeItem('mws.operationM.simulation.v1')");
 await b.navigate(url,w,h);
 console.log('OPERATION_M_EMPTY_BOARD',w,h,empty,drop.map(d=>[d.target,d.area,d.centerError]));
 await b.evaluate("document.querySelector('[data-op-action=tab-roster]').click()");
 const nextBelow=await b.evaluate("document.querySelector('.op-roster-next').getBoundingClientRect().top>=document.querySelector('.op-roster-grid').getBoundingClientRect().bottom");assert(nextBelow);
 await b.evaluate("document.querySelector('[data-op-action=start-guided]').click()");
 assert.equal(await b.evaluate("document.querySelectorAll('[data-op-current]').length"),1);
 const guided=await b.evaluate(`(async()=>{const order=[];for(let i=0;i<20;i++){const cards=document.querySelectorAll('[data-op-current]');if(cards.length!==1)throw Error('not a single card');order.push(cards[0].dataset.opCurrent);document.querySelector('[data-op-assign="'+['S','A','B','C','D'][i%5]+'"]').click();if(!document.querySelector('.op-rank-confirm[data-rarity]'))throw Error('missing rarity reveal');await new Promise(r=>setTimeout(r,[680,530,430,330,270][i%5]));}return {order,remaining:document.querySelectorAll('[data-op-current]').length,board:document.querySelectorAll('.op-board .op-player').length}})()`);
 assert.equal(new Set(guided.order).size,20);assert.equal(guided.remaining,0);assert.equal(guided.board,20);
 const board=await b.evaluate(`(()=>{const p=document.querySelector('.op-pool'),r=document.querySelector('.op-board'),card=r.querySelector('.op-player .op-portrait');return{pool:p.getBoundingClientRect().height,width:r.getBoundingClientRect().width,root:document.querySelector('#operationM').getBoundingClientRect().width,portrait:card.getBoundingClientRect().width,tier:getComputedStyle(r.querySelector('.op-player')).borderColor,header:getComputedStyle(document.querySelector('.topbar')).display}})()`);
 assert(board.pool<85);assert(board.width>=board.root-2);assert.equal(board.header,'none');if(w>=1366)assert(board.portrait>75,JSON.stringify(board));
 const rarity=await b.evaluate("[...new Set([...document.querySelectorAll('.op-board .op-player')].map(x=>x.dataset.rarity))].sort()");assert.deepEqual(rarity,['crystal','gold','holo','silver','steel']);
 await b.evaluate("document.querySelector('[data-op-action=draft]').click()");
 await b.evaluate("(async()=>{await new Promise(r=>setTimeout(r,800));return true})()");
 const result=await b.evaluate(`(()=>{const r=document.querySelector('#operationM'),footers=[...r.querySelectorAll('.op-team footer')];return {sizes:[...r.querySelectorAll('.op-team')].map(t=>t.querySelectorAll('.op-player').length),unique:new Set([...r.querySelectorAll('.op-team .op-player')].map(p=>p.dataset.opPlayer)).size,overflow:document.documentElement.scrollWidth>innerWidth+1,score:[...r.querySelectorAll('.op-team header b')].map(x=>x.textContent),footerBottom:Math.max(...footers.map(f=>f.getBoundingClientRect().bottom)),limit:document.querySelector('#mwsAccessTools').getBoundingClientRect().top,portraits:[...r.querySelectorAll('.op-team .op-player .op-portrait')].map(x=>x.getBoundingClientRect().width)}})()`);
 assert.deepEqual(result.sizes,[5,5,5,5]);assert.equal(result.unique,20);assert.equal(result.overflow,false);assert.deepEqual(result.score,['15점','15점','15점','15점']);
 if(w>=1366){assert(result.footerBottom<=result.limit+1,JSON.stringify(result));assert(Math.min(...result.portraits)>70,JSON.stringify(result))}
 console.log('OPERATION_M_LAYOUT',w,h,board,result.footerBottom,result.limit);
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
