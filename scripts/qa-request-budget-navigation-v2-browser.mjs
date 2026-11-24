import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const cut=(s,a,b)=>{const x=s.indexOf(a),y=s.indexOf(b,x);assert(x>=0&&y>x);return s.slice(x,y)};
const source=read('assets/cloud-runtime-v130.js');
const queue=cut(source,'function fetchManifest()','async function loadPartWithCache');
const lazy=cut(source,'function checkPartCache(scope,part)','async function hydrate(chosen)');
const rest=cut(source,'async function ensureRemainingWorkspace()','window.mwsV55EnsureParts=');
const parts=['core','events','contacts','clipboard','activity','notebook','contactMeta','posts','miniGames','wardogs'],initial=parts.slice(0,7),extra=parts.slice(7);
const tabs=['calendar','dashboard','contacts','posts','memos','careerTimeline','achievements','mawangArchive','gameLadder','gameF1Racing','gameMultiDraw','gameMajoku','contentPlanner','toolTier','toolMatrix','toolRelations','settings','worldtime','wardogs','export'];
const html='<!doctype html><meta charset="utf-8"><main>'+tabs.map(tab=>'<button data-tab="'+tab+'">'+tab+'</button>').join('')+'<section id="active">calendar</section></main><script>'+
`const ALL_PARTS=${JSON.stringify(parts)},INITIAL_PARTS=${JSON.stringify(initial)},PARTS_BY_TAB=${JSON.stringify({posts:['posts'],contacts:['posts'],gameLadder:['miniGames'],gameF1Racing:['miniGames'],gameMultiDraw:['miniGames'],gameMajoku:['miniGames'],toolTier:['miniGames'],toolMatrix:['miniGames'],toolRelations:['miniGames'],wardogs:['wardogs'],export:parts})};
let mode='public',hydrationSeq=1,manifest=null,data={};const loadedParts=new Set(),baselineJson=new Map(),metrics={semanticResponseBytes:0,cacheMisses:0},metric=()=>{},byteLen=()=>0,clone=structuredClone,ownSave=(o,k)=>Object.hasOwn(o||{},k),setSaveStatus=()=>{},normalizeDataShape=()=>{},mergePart=(p,v,target)=>target[p]=v;
const fetchJson=async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
const timeout=p=>p,getCachedPart=async()=>null,putCachedPart=async()=>{};
`+queue+`
async function loadPartWithCache(scope,part,m,options){return fetchPart(part)}
`+lazy+rest+`
window.ready=(async()=>{const body=await fetchJson('/api/calendar-startup');manifest=body.manifest;for(const [p,row] of Object.entries(body.parts)){mergePart(p,row.data,data);loadedParts.add(p)}document.getElementById('active').textContent='calendar';})();
let navigation=0;document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=async()=>{const id=++navigation,tab=b.dataset.tab;if(await ensurePartsForTab(tab)&&id===navigation)document.getElementById('active').textContent=tab});
window.runNav=async()=>{await window.ready;const preload=ensureRemainingWorkspace();for(let i=0;i<20;i++)document.querySelectorAll('[data-tab]')[i].click();await preload;await new Promise(r=>setTimeout(r,50));const loaded=loadedParts.size;for(let i=0;i<40;i++)document.querySelectorAll('[data-tab]')[i%20].click();await new Promise(r=>setTimeout(r,150));return {loaded,active:document.getElementById('active').textContent}};
</script>`;
let requests=[];const row=p=>({part:p,version:1,data:{p}});
const server=createServer((req,res)=>{const u=new URL(req.url,'http://127.0.0.1');if(u.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return}if(u.pathname==='/favicon.ico'){res.writeHead(204).end();return}requests.push(u.pathname);res.setHeader('Content-Type','application/json');if(u.pathname==='/api/calendar-startup')res.end(JSON.stringify({manifest:{parts:Object.fromEntries(parts.map(p=>[p,1]))},parts:Object.fromEntries(initial.map(p=>[p,row(p)]))}));else if(u.pathname==='/api/parts-batch'){const selected=u.searchParams.get('parts').split(',');if(JSON.stringify(selected.sort())!==JSON.stringify([...extra].sort())){res.writeHead(400).end('{}');return}setTimeout(()=>res.end(JSON.stringify({results:Object.fromEntries(selected.map(p=>[p,{status:200,row:row(p)}]))})),70)}else res.writeHead(500).end('{}')});
const dir=mkdtempSync(path.join(tmpdir(),'mws-request-nav-'));let browser;
try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await launchCalendarBrowser(dir);await browser.navigate('http://127.0.0.1:'+server.address().port+'/',1366,768);const result=await browser.evaluate('window.runNav()');assert.equal(result.loaded,10);assert.equal(result.active,'export');assert.deepEqual(requests,['/api/calendar-startup','/api/parts-batch']);console.log('REQUEST_NAV_BROWSER_OK '+JSON.stringify({startup:1,remaining:1,navigation:60,extraRequests:0,loaded:result.loaded}))}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true})}
