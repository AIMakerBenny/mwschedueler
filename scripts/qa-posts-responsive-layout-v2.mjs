import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const live=process.argv.includes('--live');
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-post-layout-'));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
  const html=read('index.html'),core=read('assets/app-core.js');
  const section=html.slice(html.indexOf('<section id="posts"'),html.indexOf('</section>',html.indexOf('<section id="posts"'))+10).replace('id="posts" class="section"','id="posts" class="section active"');
  const css=[...html.matchAll(/<link\b[^>]*href="(assets\/[^"?]+\.css)(?:\?[^" ]*)?"[^>]*>|<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]?read(m[1]):m[2]).join('\n')+'\n'+read('assets/mobile-drawer-v130.css');
  const render=html.slice(html.indexOf('  postApplicantCardHTML=function(post,c,dups){'),html.indexOf('\n  uniquePostGameApplicants=function(post){'));
  const prefs=core.slice(core.indexOf('function applyPostViewPrefs(){'),core.indexOf('\nfunction favoriteFolderById('));
  const button=html.slice(html.indexOf('  function ensureMiniGameButtonV57(){'),html.indexOf('\n  window.openPostGamePicker=function(){',html.indexOf('  function ensureMiniGameButtonV57(){')));
  assert(render.includes('post-decision-row')&&prefs.includes('post-card-columns')&&button.includes('postMiniGameEntryV57'));
  const fixture=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body class="mws-premium" data-theme="neon"><script>if(innerWidth<=760){document.body.dataset.deviceMode='mobile';document.body.dataset.resolution='mobile'}else{document.body.dataset.deviceMode='pc';document.body.dataset.resolution='fhd'}</script><div class="app"><aside class="sidebar" aria-hidden="true"></aside><main class="main">${section}</main></div><script>
    const data={postViewMode:'card',postCardColumns:5},post={id:'qa-post'};let postApplicantCardHTML;const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));const initials=s=>s.slice(0,2),findContactForSoopApplicant=c=>c.matched?{id:'qa-contact'}:null,soopUserStationUrl=()=>'',normStatus=s=>s||'pending',applicantStatusLabel=s=>({selected:'확정',gacha:'가챠',nextchance:'다음기회에',pending:'대기'}[s]),mwsSaveDevicePrefs=()=>{};let decisions=[];window.setPostApplicantDecision=(...args)=>decisions.push(args);window.openMatchedPostContact=()=>{};window.addPostApplicantToContacts=()=>{};window.deletePostApplicant=()=>{};window.openPostGamePicker=()=>{};
    ${render}\n${prefs}\n${button}\nensureMiniGameButtonV57();const img='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';document.getElementById('postEmptyState').style.display='none';document.getElementById('postDetailView').style.display='block';document.getElementById('postDisplayName').value='워독스 동아리 모집 — 긴 게시글 제목 테스트';document.getElementById('postDetailMeta').textContent='mawang0216 · 글 207698425 · 마지막 동기화 2026. 10. 4. 오전 12:19:02';document.getElementById('postApplicantSummary').innerHTML=['댓글 17개','고유 작성자 17명','확정 0명','가챠 17명','다음기회에 0명','연락처 연결 17개'].map(x=>'<span class="chip">'+x+'</span>').join('');document.getElementById('postSavedList').innerHTML=Array.from({length:4},(_,i)=>'<div class="post-saved-item"><div class="post-saved-title">등록 게시글 '+i+' 긴 제목</div><div class="post-saved-meta"><span>17개 댓글</span><span>2026. 10. 4. 오전 12:19:02</span></div></div>').join('');document.getElementById('postApplicantGrid').innerHTML=Array.from({length:12},(_,i)=>postApplicantCardHTML(post,{id:'qa-'+i,name:i===1?'매우 긴 닉네임의 신청자 이름':'신청자 '+i,userId:'long_user_id_0123456789_'+i,profileImage:img,matched:i%2===0,status:['gacha','selected','nextchance','pending'][i%4],comment:i===1?'타지 영상 보고 반해서 얼마전부터 시작했습니다. 함께 게임을 즐기고 싶어서 신청합니다. '.repeat(4):'모집 신청합니다! 연락 기다리겠습니다.',regDate:'2026-09-30 21:45:51',upCount:3+i,photoUrl:i===0?img:''},{})).join('');applyPostViewPrefs();</script>`;
  const file=path.join(dir,'fixture.html');writeFileSync(file,fixture+`<script>${read('assets/posts-focus-layout-v3.js')}</script>`);
  browser=await launchCalendarBrowser(dir);
  const base=process.env.MWS_LIVE_BASE||'https://mawang-scheduler.majoku.workers.dev';
  for(const width of live?[360,1366,1920]:[320,390,768,1366,1710,1920,2560]){
    const url=live?base.replace(/\/$/,'')+'/?posts-layout-qa='+width+'-'+Date.now():pathToFileURL(file).href;
    await browser.navigate(url,width,900,width<=760);
    if(live){
      let done=false,lastState=null;
      for(let n=0;n<200&&!done;n++){
        try{lastState=await browser.evaluate(`(async()=>{const notice=document.querySelector('#mwsAnnouncementDialog[open]');if(notice)notice.querySelector('.mws-notice-close')?.click();const ready=window.__mwsAppReadyV130===true;const nav=document.querySelector('.nav button[data-tab="posts"]');if(ready&&nav&&!document.getElementById('posts').classList.contains('active'))nav.click();if(ready&&typeof window.mwsV55EnsureParts==='function'&&!window.mwsV55EgressReport?.()?.loadedParts?.includes('posts'))await window.mwsV55EnsureParts('posts');return {ready,active:document.getElementById('posts').classList.contains('active'),count:document.querySelectorAll('#postApplicantGrid .post-applicant-card').length,parts:window.mwsV55EgressReport?.()?.loadedParts||[]}})()`);done=lastState.active&&lastState.count>0}catch(error){lastState={error:String(error).slice(0,500)}}
        if(!done)await wait(150);
      }
      assert(done,'Production posts did not initialize at '+width+': '+JSON.stringify(lastState));
    }
    for(const mode of ['card','list']){
      await browser.evaluate(`setPostCardColumns(5);setPostViewMode(${JSON.stringify(mode)})`);await wait(250);
      const geom=await browser.evaluate(`(()=>{const mode=${JSON.stringify(mode)},$=s=>document.querySelector(s),r=e=>e.getBoundingClientRect(),grid=$('#postApplicantGrid'),cards=[...grid.querySelectorAll('.post-applicant-card')],bounds=(x,b)=>x.left>=b.left-1&&x.right<=b.right+1,checks=cards.map(c=>{const box=r(c),top=c.querySelector('.post-applicant-top'),avatar=r(top.firstElementChild),name=r(top.children[1]),badge=r(c.querySelector('.post-status-badge')),row=r(c.querySelector('.post-decision-row')),comment=r(c.querySelector('.post-applicant-comment')),foot=r(c.querySelector('.post-applicant-foot')),photo=c.querySelector('.post-applicant-photo');return {avatar:avatar.width>=92&&Math.abs(avatar.width-avatar.height)<2,identity:bounds(name,box)&&name.left>=avatar.right+4&&name.width>=36,badge:bounds(badge,box)&&badge.height>=26,hiddenActions:row.height===0,comment:bounds(comment,box)&&comment.height>0,foot:bounds(foot,box),photo:!photo||bounds(r(photo),box)}}),gridRect=r(grid),columns=cards.filter(c=>Math.abs(r(c).top-r(cards[0]).top)<2).length,panel=r($('.posts-main-panel')),root=r($('#posts')),tools=[...document.querySelectorAll('#posts .post-applicant-tools > *')].filter(e=>r(e).width&&r(e).height);return {width:innerWidth,mode,columns,count:cards.length,minGrid:Math.round(gridRect.width),minCard:Math.round(Math.min(...cards.map(c=>r(c).width))),rootOverflow:document.documentElement.scrollWidth-innerWidth,gridOverflow:grid.scrollWidth-grid.clientWidth,gridUsesWidth:panel.width>=root.width-2&&gridRect.width>=panel.width-30,menusHidden:[...document.querySelectorAll('#posts .post-menu-panel')].every(el=>r(el).height===0),toolsFit:tools.every(e=>bounds(r(e),panel)),avatarSize:Math.round(r(cards[0].querySelector('.post-applicant-avatar')).width),checks:checks.every(c=>Object.values(c).every(Boolean)),failed:checks.find(c=>!Object.values(c).every(Boolean))||null}})()`);
      console.log('MWS_POSTS_LAYOUT',JSON.stringify(geom));
      assert(geom.count>0&&geom.rootOverflow<=2&&geom.gridOverflow<=2&&geom.toolsFit&&geom.gridUsesWidth&&geom.menusHidden&&geom.checks,JSON.stringify(geom));
      if(mode==='card'){assert(geom.columns<=5&&geom.minCard>=Math.min(284,geom.minGrid)-2,JSON.stringify(geom));if(width<=390)assert.equal(geom.columns,1)}
      else assert.equal(geom.columns,1);
      for(const selector of ['#postSavedMenu','.post-register-menu','.post-detail-menu','.post-filter-menu','.post-bulk-menu','.post-applicant-status-menu']){
        await browser.evaluate(`document.querySelector(${JSON.stringify('#posts '+selector+' > summary')}).click()`);await wait(80);
        const m=await browser.evaluate(`(()=>{const d=document.querySelector(${JSON.stringify('#posts '+selector)}),r=d.querySelector('.post-menu-panel').getBoundingClientRect();return {open:d.open,count:document.querySelectorAll('#posts details[open]').length,fit:r.left>=-1&&r.right<=innerWidth+1,height:r.height,rootOverflow:document.documentElement.scrollWidth-innerWidth}})()`);
        assert(m.open&&m.count===1&&m.fit&&m.height>0&&m.rootOverflow<=2,JSON.stringify({width,mode,selector,...m}));
      }
      await browser.evaluate(`document.querySelector('#posts details[open] > summary').focus({preventScroll:true})`);
      await browser.keyPress('Escape');await wait(100);assert.equal(await browser.evaluate(`document.querySelectorAll('#posts details[open]').length`),0);
    }
    if(!live){await browser.evaluate(`document.querySelector('#postApplicantGrid .post-applicant-status-menu summary').click()`);await wait(80);await browser.evaluate(`document.querySelector('#postApplicantGrid .post-decision-btn.gacha').click()`);assert.equal(await browser.evaluate(`decisions.at(-1)[2]`),'gacha');assert.equal(await browser.evaluate(`document.querySelectorAll('#posts details[open]').length`),0)}
  }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
