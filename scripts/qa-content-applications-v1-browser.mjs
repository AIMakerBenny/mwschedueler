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
const mock=`let data={};let writes=0,onlineSaves=0,reads=0;window.__mwsAppReadyV130=true;window.mwsV55SaveNow=async()=>{onlineSaves++;return true};function saveData(){writes++;window.dispatchEvent(new CustomEvent('mawang:datachange'));return true}function toast(){};window.fetch=async u=>{if(String(u).startsWith('/api/soop/application-sync'))return {status:404,ok:false};reads++;const target=new URL(new URL(u,'https://fixture.test').searchParams.get('url'));const id=target.pathname.split('/').at(-2),page=Number(target.searchParams.get('page'));if(id==='3')return {ok:false,status:404};const comment=(user,no,likes,nick)=>({title_no:Number(id),p_comment_no:no,user_id:user,user_nick:nick,like_cnt:user==='mawang0216'&&window.__qaBoostLikes?likes+60:likes,comment:'신청합니다'});const rows=id==='1'?(page===1?[comment('host',1,999,'주최자'),comment('mawang0216',2,40,'마왕0216')]:[comment('mawang0216',2,40,'마왕0216'),comment('other',3,50,'다른 신청자')]):[comment('third',4,10,'세번째 신청자')];return {ok:true,json:async()=>({meta:{current_page:page,last_page:id==='1'?2:1,total:id==='1'?3:1},data:rows})}};`;
writeFileSync(file,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--text:#f4f4f4;--muted:#aaa;--panel:#1c202b;--input:#303441;--border:#454958;--accent:#7a8aff}body{margin:12px;background:#15151b;color:var(--text);font:14px sans-serif}.section{display:none}.section.active{display:block}${read('assets/content-applications-v1.css')}</style><body data-mws-mode="admin">${section}<section id="dashboard" class="section"><div id="dashboardOverviewMode" class="active"><div id="dashboardApplicationSupport" hidden></div></div></section><script>function setTab(tab){document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===tab))} ${mock}\n${model}\n${ui}</script></body>`);
let browser;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
 browser=await launchCalendarBrowser(dir);
 for(const [w,h,mobile] of [[1366,768,false],[390,844,true]]){
  await browser.navigate(pathToFileURL(file).href,w,h,mobile);
  const evalJS=expr=>browser.evaluate(expr);
  await evalJS(`(()=>{document.querySelector('#caNewBtn').click();document.querySelector('#caTitle').value='QA 신청';document.querySelector('#caDeadline').value=toKstInput(new Date(Date.now()+90000000).toISOString());document.querySelector('.ca-author-input').value='게시자 A';document.querySelector('#caAuthorAdd').click();document.querySelectorAll('.ca-author-input')[1].value='게시자 B';document.querySelector('#caUrls').value='https://www.sooplive.com/station/host/post/1\\nhttps://www.sooplive.com/station/host/post/2\\nhttps://www.sooplive.com/station/host/post/3';document.querySelector('#caSave').click()})()`);
  await delay(150);
  const state=await evalJS(`(()=>({saved:data.contentApplications?.[0],writes,onlineSaves,reads,hero:document.querySelector('.ca-hero')?.innerText,rank:document.querySelector('.ca-ranking')?.innerText,rankLabel:document.querySelector('.ca-ranking-head')?.innerText,cta:document.querySelector('.ca-vote')?.href,overflow:document.documentElement.scrollWidth>innerWidth}))()`);
  assert.equal(state.saved.title,'QA 신청');assert.deepEqual(state.saved.authors,['게시자 A','게시자 B']);assert.match(state.hero,/마왕0216/);assert.equal(state.saved.entries.length,3);assert.equal(state.saved.entries[0].userId,'');assert.equal(state.saved.entries[2].likes,null);assert.equal(state.writes,1);assert.equal(state.onlineSaves,1);assert.equal(state.reads,4);assert.match(state.hero,/마왕0216[\s\S]*40[\s\S]*2위/);assert.match(state.hero,/1위까지 좋아요 10개 차이/);assert.match(state.rank,/다른 신청자/);assert.match(state.rank,/세번째 신청자/);assert.doesNotMatch(state.rank,/주최자/);assert.match(state.rank,/마왕0216/);assert.match(state.rankLabel,/3/);assert.equal(state.cta,'https://www.sooplive.com/station/host/post/1#comment_noti2');assert.equal(state.overflow,false); assert.equal(await evalJS("document.querySelector('.ca-person .ca-origin').href"),'https://www.sooplive.com/station/host/post/1#comment_noti3');
  const initialOwn=await evalJS("(()=>{const own=document.querySelector('.ca-person[data-ca-own]'),rows=[...document.querySelectorAll('.ca-person[data-ca-user]')];const cs=getComputedStyle(own);return {exists:!!own,rank:own.querySelector('.ca-rank')?.innerText,position:rows.indexOf(own),count:rows.length,highlight:cs.borderTopColor!==getComputedStyle(rows[0]).borderTopColor,hasJump:!!document.querySelector('[data-ca-my-rank]'),overflow:document.documentElement.scrollWidth>innerWidth}})()");
  if(w===1366&&process.env.MWS_RANK_VISUAL==='1'){
    await evalJS("document.querySelector('.ca-hero').scrollIntoView({block:'start',behavior:'instant'})");
    await delay(100);
    console.log('MWS_RANK_BEFORE_JPEG_START'+await browser.captureScreenshot()+'MWS_RANK_BEFORE_JPEG_END');
  }
  assert(initialOwn.exists&&initialOwn.position===1&&initialOwn.count===3,JSON.stringify(initialOwn));
  assert.match(initialOwn.rank,/2위/);assert(initialOwn.highlight&&initialOwn.hasJump&&!initialOwn.overflow,JSON.stringify(initialOwn));
  await evalJS("document.querySelector('[data-ca-my-rank]').click()");
  assert(await evalJS("document.activeElement===document.querySelector('.ca-person[data-ca-own]')"));
  assert(await evalJS(`(()=>{const box=document.querySelector('.ca-countdown-panel'),time=box.querySelector('.ca-time'),deadline=box.querySelector('.ca-deadline');return box.getBoundingClientRect().width>150&&parseFloat(getComputedStyle(time).fontSize)>=25&&/남은 시간/.test(box.textContent)&&/^마감 .* KST$/.test(deadline.textContent)&&time.getBoundingClientRect().width<=box.clientWidth})()`));
  await evalJS("setTab('dashboard')");await delay(100);
  const dash=await evalJS(`(()=>({visible:!document.querySelector('#dashboardApplicationSupport').hidden,text:document.querySelector('#dashboardApplicationSupport').innerText,link:document.querySelector('.ca-dash-vote')?.href,reads,overflow:document.documentElement.scrollWidth>innerWidth}))()`);
  assert(dash.visible);assert.match(dash.text,/게시글 작성자[\s\S]*게시자 A[\s\S]*게시자 B/);assert.match(dash.text,/QA 신청[\s\S]*마왕0216[\s\S]*40[\s\S]*2위/);assert.equal(dash.link,state.cta);assert.equal(dash.reads,4);assert.equal(dash.overflow,false);
  await evalJS("document.querySelector('[data-ca-dashboard-open]').click()");await delay(100);
  assert(await evalJS("document.querySelector('#contentApplications').classList.contains('active')&&!document.querySelector('#caDetail').hidden"));
  // Change SOOP's verified likes in the mock. The same account now overtakes first place.
  await evalJS("window.__qaBoostLikes=true;document.querySelector('[data-ca-refresh]').click()");
  await delay(130);
  const motion=await evalJS("(()=>{const own=document.querySelector('.ca-person[data-ca-own]'),rows=[...document.querySelectorAll('.ca-person[data-ca-user]')],rank=own?.querySelector('.ca-rank'),header=document.querySelector('.ca-stats'),stat=header?.querySelector('[data-ca-stat=likes]');return {position:rows.indexOf(own),count:rows.length,rank:rank?.innerText,delta:rank?.querySelector('.ca-rank-change')?.innerText,likesBadge:own?.querySelector('.ca-like-change')?.innerText,statTrend:!!header?.querySelector('.ca-stat-trend.up'),value:Number(stat?.dataset.caValue),animations:own?.getAnimations().length||0,overflow:document.documentElement.scrollWidth>innerWidth}})()");
  assert.equal(motion.position,0,JSON.stringify(motion));assert.equal(motion.count,3);assert.match(motion.rank,/1위/);
  assert.match(motion.delta,/↑ 1/);assert.match(motion.likesBadge,/\+60/);
  assert(motion.statTrend&&motion.value===100&&motion.animations>0&&!motion.overflow,JSON.stringify(motion));
  console.log('MWS_RANK_MOTION_QA',w,JSON.stringify(motion));
  await delay(660);
  assert(await evalJS("document.querySelector('[data-ca-stat=likes]').textContent==='100'&&document.querySelector('[data-ca-stat=rank]').textContent.endsWith('1위')"));
  if(w===1366&&process.env.MWS_RANK_VISUAL==='1'){
    await evalJS("document.querySelector('.ca-hero').scrollIntoView({block:'start',behavior:'instant'})");
    await delay(80);
    console.log('MWS_RANK_AFTER_JPEG_START'+await browser.captureScreenshot()+'MWS_RANK_AFTER_JPEG_END');
  }
  // An identical refresh must not replace rows or replay transitions.
  await evalJS("window.__qaBeforeUnchanged=document.querySelector('.ca-person[data-ca-own]');document.querySelector('[data-ca-refresh]').click()");
  await delay(150);
  const unchanged=await evalJS("(()=>{const own=document.querySelector('.ca-person[data-ca-own]');return {same:window.__qaBeforeUnchanged===own,animations:own?.getAnimations().length||0}})()");
  assert(unchanged.same&&unchanged.animations===0,JSON.stringify(unchanged));
  // Restore previous likes under reduced-motion preference; no motion is permitted.
  await browser.setReducedMotion(true);
  await evalJS("window.__qaBoostLikes=false;document.querySelector('[data-ca-refresh]').click()");
  await delay(160);
  const reduced=await evalJS("(()=>{const own=document.querySelector('.ca-person[data-ca-own]');return {rank:own?.querySelector('.ca-rank')?.innerText,number:document.querySelector('[data-ca-stat=likes]')?.textContent,animated:own?.getAnimations().length,position:[...document.querySelectorAll('.ca-person')].indexOf(own)}})()");
  assert.match(reduced.rank,/2위/);assert.equal(reduced.position,1);assert.equal(reduced.number,'40');assert.equal(reduced.animated,0,JSON.stringify(reduced));
  await browser.setReducedMotion(false);
  assert(await evalJS("document.querySelector('[data-ca-back]').textContent.includes('목록으로')"));
  await evalJS("document.querySelector('[data-ca-back]').click()");
  assert(await evalJS("!document.querySelector('#caList').hidden&&document.querySelector('#caList .ca-author-line')?.textContent.includes('게시자 A')"));
  await evalJS("document.querySelector('[data-ca-open]').click()");
  await evalJS(`(()=>{document.querySelector('[data-ca-edit]').click();document.querySelector('#caDeadline').value=toKstInput(new Date(Date.now()+5*3600000).toISOString());document.querySelector('#caSave').click()})()`);await delay(150);
  assert(await evalJS("document.querySelector('#caDetail .ca-state').textContent==='마감임박'&&document.querySelector('.ca-countdown-panel').classList.contains('urgent')"));
  await evalJS("setTab('dashboard')");await delay(80);
  assert(await evalJS("!!document.querySelector('#dashboardApplicationSupport .ca-state.urgent')"));
  await evalJS("setTab('contentApplications')");await delay(80);
  const beforeExpiry=await evalJS('reads');
  await evalJS(`(()=>{document.querySelector('[data-ca-edit]').click();document.querySelector('#caDeadline').value=toKstInput(new Date(Date.now()-900000).toISOString());document.querySelector('#caSave').click()})()`);await delay(150);
  assert(await evalJS(`document.querySelector('#caDetail .ca-state').textContent==='종료'&&document.querySelector('#caDetail').classList.contains('is-closed')&&!document.querySelector('[data-ca-refresh]')&&!document.querySelector('.ca-vote')&&document.querySelector('.ca-support a').href.endsWith('#comment_noti2')`));
  assert.equal(await evalJS(`document.querySelector('.ca-countdown-panel .ca-time').textContent`),'조회 종료');
  await evalJS("setTab('dashboard')");await delay(100);assert(await evalJS("document.querySelector('#dashboardApplicationSupport').hidden"));await evalJS("setTab('contentApplications')");await delay(100);
  await evalJS(`(()=>{document.body.dataset.mwsMode='public';window.dispatchEvent(new CustomEvent('mws:app-ready'));document.querySelector('[data-ca-open]').click()})()`);await delay(100);
  const pub=await evalJS(`(()=>({newHidden:document.querySelector('#caNewBtn').hidden,edit:!!document.querySelector('[data-ca-edit]'),writes,onlineSaves,rank:document.querySelector('.ca-hero')?.innerText}))()`);
  assert.equal(pub.newHidden,true);assert.equal(pub.edit,false);assert.equal(pub.writes,3);assert.equal(pub.onlineSaves,3);assert.match(pub.rank,/마왕0216/);
  assert.equal(await evalJS('reads'),beforeExpiry);
  assert(await evalJS("document.querySelector('[data-ca-stat=likes]').textContent==='40'&&!document.querySelector('[data-ca-refresh]')"));
  await evalJS("document.querySelector('[data-ca-back]').click()");
  assert(await evalJS("document.querySelector('.ca-campaign.is-closed')&&getComputedStyle(document.querySelector('.ca-campaign.is-closed')).filter==='grayscale(1)'"));
  await evalJS("document.querySelector('[data-ca-open]').click()");await delay(150);assert.equal(await evalJS('reads'),beforeExpiry);assert.equal(await evalJS('writes'),3);
  await evalJS(`(()=>{data.contentApplications.push({...data.contentApplications[0],id:'never-read',title:'No history'});window.dispatchEvent(new CustomEvent('mawang:datachange'));document.querySelector('[data-ca-back]').click();document.querySelector('[data-ca-open="never-read"]').click()})()`);await delay(150);
  assert.equal(await evalJS('reads'),beforeExpiry);assert.match(await evalJS("document.querySelector('.ca-ranking').innerText"),/조회 기록이 없습니다/);
  console.log('CONTENT_APPLICATIONS_BROWSER_OK',w,h,'create, compare, expiry, read-only public, no horizontal overflow');
 }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
