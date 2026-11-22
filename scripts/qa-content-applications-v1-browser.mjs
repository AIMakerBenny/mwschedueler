import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-applications-')),file=path.join(dir,'fixture.html');
const section=read('index.html').match(/<section id="contentApplications"[\s\S]*?<\/section>/)[0].replace('class="section"','class="section active"');
const model=read('assets/content-applications-model-v1.js').replace(/^export /gm,'');
const ui=read('assets/content-applications-v2.js').replace(/^import .*;\n/,'');
const mock=`let data={};let writes=0,onlineSaves=0,reads=0;window.__mwsAppReadyV130=true;window.mwsV55SaveNow=async()=>{onlineSaves++;return true};function saveData(){writes++;window.dispatchEvent(new CustomEvent('mawang:datachange'));return true}function toast(){};window.fetch=async u=>{reads++;const target=new URL(new URL(u,'https://fixture.test').searchParams.get('url'));const id=target.pathname.split('/').at(-2),page=Number(target.searchParams.get('page'));if(id==='3')return {ok:false,status:404};const comment=(user,no,likes,nick)=>({title_no:Number(id),p_comment_no:no,user_id:user,user_nick:nick,like_cnt:likes,comment:'신청합니다'});const rows=id==='1'?(page===1?[comment('host',1,999,'주최자'),comment('mawang0216',2,40,'마왕0216')]:[comment('mawang0216',2,40,'마왕0216'),comment('other',3,50,'다른 신청자')]):[comment('third',4,10,'세번째 신청자')];return {ok:true,json:async()=>({meta:{current_page:page,last_page:id==='1'?2:1,total:id==='1'?3:1},data:rows})}};`;
writeFileSync(file,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--text:#f4f4f4;--muted:#aaa;--panel:#1c202b;--input:#303441;--border:#454958;--accent:#7a8aff}body{margin:12px;background:#15151b;color:var(--text);font:14px sans-serif}.section{display:none}.section.active{display:block}${read('assets/content-applications-v1.css')}</style><body data-mws-mode="admin">${section}<script>${mock}\n${model}\n${ui}</script></body>`);
let browser;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
 browser=await launchCalendarBrowser(dir);
 for(const [w,h,mobile] of [[1366,768,false],[390,844,true]]){
  await browser.navigate(pathToFileURL(file).href,w,h,mobile);
  const evalJS=expr=>browser.evaluate(expr);
  await evalJS(`(()=>{document.querySelector('#caNewBtn').click();document.querySelector('#caTitle').value='QA 신청';document.querySelector('#caDeadline').value=toKstInput(new Date(Date.now()+90000000).toISOString());document.querySelector('#caUrls').value='https://www.sooplive.com/station/host/post/1\\nhttps://www.sooplive.com/station/host/post/2\\nhttps://www.sooplive.com/station/host/post/3';document.querySelector('#caSave').click()})()`);
  await delay(150);
  const state=await evalJS(`(()=>({saved:data.contentApplications?.[0],writes,onlineSaves,reads,hero:document.querySelector('.ca-hero')?.innerText,rank:document.querySelector('.ca-ranking')?.innerText,rankLabel:document.querySelector('.ca-ranking-head')?.innerText,cta:document.querySelector('.ca-vote')?.href,overflow:document.documentElement.scrollWidth>innerWidth}))()`);
  assert.equal(state.saved.title,'QA 신청');assert.equal(state.saved.entries.length,3);assert.equal(state.saved.entries[0].userId,'');assert.equal(state.saved.entries[2].likes,null);assert.equal(state.writes,1);assert.equal(state.onlineSaves,1);assert.equal(state.reads,4);assert.match(state.hero,/마왕0216[\s\S]*40[\s\S]*2위/);assert.match(state.hero,/1위까지 좋아요 10개 차이/);assert.match(state.rank,/다른 신청자/);assert.match(state.rank,/세번째 신청자/);assert.doesNotMatch(state.rank,/주최자|마왕0216/);assert.match(state.rankLabel,/3/);assert.equal(state.cta,'https://www.sooplive.com/station/host/post/1');assert.equal(state.overflow,false);
  await evalJS(`(()=>{document.querySelector('[data-ca-edit]').click();document.querySelector('#caDeadline').value=toKstInput(new Date(Date.now()-900000).toISOString());document.querySelector('#caSave').click()})()`);await delay(150);
  assert(await evalJS(`document.querySelector('#caDetail .ca-state').textContent==='만료'&&!document.querySelector('.ca-vote')&&!!document.querySelector('.ca-support a')`));
  await evalJS(`(()=>{document.body.dataset.mwsMode='public';window.dispatchEvent(new CustomEvent('mws:app-ready'));document.querySelector('[data-ca-open]').click()})()`);await delay(100);
  const pub=await evalJS(`(()=>({newHidden:document.querySelector('#caNewBtn').hidden,edit:!!document.querySelector('[data-ca-edit]'),writes,onlineSaves,rank:document.querySelector('.ca-hero')?.innerText}))()`);
  assert.equal(pub.newHidden,true);assert.equal(pub.edit,false);assert.equal(pub.writes,2);assert.equal(pub.onlineSaves,2);assert.match(pub.rank,/마왕0216/);
  await evalJS(`document.querySelector('[data-ca-refresh]').click()`);await delay(150);assert.equal(await evalJS('writes'),2);
  console.log('CONTENT_APPLICATIONS_BROWSER_OK',w,h,'create, compare, expiry, read-only public, no horizontal overflow');
 }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
