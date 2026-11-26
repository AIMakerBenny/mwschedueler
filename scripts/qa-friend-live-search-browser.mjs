import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const loader=readFileSync(path.join(root,'assets/online-v5-loader.js'),'utf8');
const packed=gunzipSync(Buffer.from(loader.match(/const PAYLOAD='([^']+)'/)[1],'base64')).toString('utf8');
const source=packed.split('/*__MWS_SPLIT_CLOUD_FEATURES__*/')[1].split('/*__MWS_SPLIT_FEATURES_CSS__*/')[0];
const patch=loader.slice(loader.indexOf('    const friendSearchAnchor='),loader.indexOf('    safeFeatures=safeFeatures.replace(\'이름, 태그 또는 초성 검색\''));
const patched=new Function('safeFeatures',patch+'\nreturn safeFeatures;')(source);
const start=patched.indexOf('function renderFriendFinderV5(){'),end=patched.indexOf('async function syncFriendFinderV5(',start);
const renderer=patched.slice(start,end);assert(renderer.includes('window.mwsFriendLiveMatchesV120?.(c,q)'));
const mock=String.raw`
let data={contacts:[
{id:'1',name:'독고혜지_',favorite:true,stationUrl:'https://bj.sooplive.com/heji',labels:['버튜버']},
{id:'2',name:'테스트 방송인',favorite:true,stationUrl:'https://bj.sooplive.com/other',labels:['게임']},
{id:'3',name:'오프라인',favorite:true,stationUrl:'https://bj.sooplive.com/offline',labels:['기타']}
]};
let apiCalls=0, batchCalls=0, releaseBatch;
const batchGate=new Promise(r=>releaseBatch=r);
const $=id=>document.getElementById(id);
const escV5=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const favoriteContactsV5=()=>data.contacts;
const cardStateV5=id=>({status:'done',live:id!=='3',title:id==='1'?'3시 전드기 재계약 있습니다.':id==='2'?'다른 게임':'오프라인',broadNo:id==='1'?'100':id==='2'?'200':''});
const soopUserIdV5=url=>url.split('/').pop();
const contactMatches=(c,q)=>[c.name,...c.labels].some(s=>s.toLowerCase().includes(q));
const ensureFriendFinderV5=()=>{};
window.fetch=async(input,init={})=>{
 const u=String(input instanceof Request?input.url:input);
 if(u.includes('/api/soop/categories')){apiCalls++;return new Response(JSON.stringify({categories:[{id:'20',name:'다른 게임'}]}),{status:200,headers:{'content-type':'application/json'}})}
 if(u.includes('/api/soop/live-batch')){apiCalls++;batchCalls++;await batchGate;const urls=JSON.parse(init.body).urls;return new Response(JSON.stringify({results:urls.map(url=>({url,status:200,body:'{}',live:url.includes('/heji/')?{broadNo:'100',broadTitle:'3시 전드기 재계약 있습니다.',categoryName:'월드 오브 워크래프트: 포에버',broadCateNo:'99',currentSumViewer:188}:url.includes('/other/')?{broadNo:'200',broadTitle:'다른 게임',categoryName:'다른 게임',broadCateNo:'20'}:null}))}),{status:200,headers:{'content-type':'application/json'}})}
 return new Response('{}',{status:200})
};
`+renderer+String.raw`
window.renderFriendFinderV5=renderFriendFinderV5;
$('friendFinderSearchV5').addEventListener('input',renderFriendFinderV5);renderFriendFinderV5();
`;
const fixture='<!doctype html><meta charset="utf-8"><body data-mws-mode="public"><section id="friendFinder" class="section active"><div><input id="friendFinderSearchV5" placeholder="검색"><button id="friendFinderRefreshV5">라이브 새로고침</button></div><div id="friendFinderGridV5"></div></section><script src="/fixture.js"></script><script src="/assets/friend-finder-v120.js"></script>';
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname;if(p==='/'){res.setHeader('content-type','text/html; charset=utf-8');return res.end(fixture)}if(p==='/fixture.js'){res.setHeader('content-type','application/javascript; charset=utf-8');return res.end(mock)}if(p==='/assets/friend-finder-v120.js'){res.setHeader('content-type','application/javascript; charset=utf-8');return res.end(readFileSync(path.join(root,p.slice(1))))}res.writeHead(404).end()});
const dir=mkdtempSync(path.join(os.tmpdir(),'friend-search-'));let b;
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));b=await launchCalendarBrowser(dir);await b.navigate('http://127.0.0.1:'+server.address().port+'/',1366,768);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 await b.evaluate("document.getElementById('friendFinderSearchV5').value='월드 오브';document.getElementById('friendFinderSearchV5').dispatchEvent(new Event('input',{bubbles:true}));");
 assert.equal(await b.evaluate("document.querySelectorAll('.friend-finder-card-v5').length"),0);
 await b.evaluate('releaseBatch()');await wait(850);
 const getVisible=()=>b.evaluate("[...document.querySelectorAll('.friend-finder-card-v5:not(.mws-category-hidden-v120)')].map(x=>x.dataset.id)");
 assert.deepEqual(await getVisible(),['1']);
 const before=await b.evaluate('apiCalls');
 for(const q of ['월드 오브','월드오브워크레프트','월드 오브 워크래프트','와우','WOW Forever','와포','재계약','독고혜지','버튜버']){
  await b.evaluate("document.getElementById('friendFinderSearchV5').value="+JSON.stringify(q)+";document.getElementById('friendFinderSearchV5').dispatchEvent(new Event('input',{bubbles:true}));");await wait(50);
  assert.deepEqual(await getVisible(),['1'],q);
 }
 assert.equal(await b.evaluate('apiCalls'),before,'search must not issue API calls');
 assert.equal(await b.evaluate("document.querySelector('#mwsFriendCategorySelect optgroup[label=\"현재 LIVE 카테고리\"] option[value=\"id:99\"]').textContent"),'월드 오브 워크래프트: 포에버 · 1명');
 await b.evaluate("document.getElementById('friendFinderSearchV5').value='';document.getElementById('friendFinderSearchV5').dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('mwsFriendCategorySelect').value='id:99';document.getElementById('mwsFriendCategorySelect').dispatchEvent(new Event('change',{bubbles:true}));");await wait(100);assert.deepEqual(await getVisible(),['1']);
 await b.evaluate("document.getElementById('mwsFriendCategorySelect').value='id:20';document.getElementById('mwsFriendCategorySelect').dispatchEvent(new Event('change',{bubbles:true}));");await wait(100);assert.deepEqual(await getVisible(),['2']);
 assert.equal(await b.evaluate('apiCalls'),before);
 console.log('FRIEND_SEARCH_BROWSER_OK',before,'API calls; zero added by search and filter');
}finally{await b?.close();await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true})}
