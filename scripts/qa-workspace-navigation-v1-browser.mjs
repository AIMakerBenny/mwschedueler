/* Browser QA for workspace menu ownership and contact routes. Local data only. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html');
const aside=index.slice(index.indexOf('<aside class="sidebar">'),index.indexOf('</aside>')+8);
assert(aside.includes('mwsToolsDivider'),'Tools divider missing in source');
const header=index.slice(index.indexOf('    <div class="topbar">'),index.indexOf('<section id="dashboard"'));
const styles=['assets/app-core.css','assets/workspace-ui-v176.css','assets/workspace-clean-v1.css','assets/calendar-details-v1.css'].map(read).join('\n');
const runtime=['assets/content-planner-host.js','assets/tools.js','assets/workspace-ui-v176.js'].map(read);
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(name=>spawnSync('which',[name],{encoding:'utf8'})).find(r=>r.status===0)?.stdout.trim();
assert(chrome,'Chromium is required');
const fixture=mkdtempSync(path.join(os.tmpdir(),'mws-workspace-nav-'));
const setup=()=>{
  window.data={};
  window.setTab=function(tab){
    document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===tab));
    document.querySelectorAll('.nav button[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    document.getElementById('pageTitle').textContent=tab;
  };
  document.querySelectorAll('.nav button[data-tab]').forEach(b=>b.onclick=()=>window.setTab(b.dataset.tab));
  // Simulate legacy notebook ordering; runtime must repair it.
  const memo=document.querySelector('[data-tab="memos"]');
  const mini=document.querySelector('.nav-game-divider');
  document.querySelector('[data-tab="posts"]').after(memo);
  mini.before(document.querySelector('[data-tab="gameMajoku"]'));
};
const test=()=>{
  const q=s=>document.querySelector(s);
  const check=(condition,label)=>{if(!condition)throw Error(label)};
  const tab=id=>q('.nav-scroll button[data-tab="'+id+'"]');
  const active=()=>q('.section.active')?.id;
  const clickContact=id=>q('.section.active [data-contact-view-v176="'+id+'"]').click();
  const visible=e=>getComputedStyle(e).display!=='none';
  try{
    const mini=q('.nav-game-divider:not(#mwsToolsDivider)'),tools=q('#mwsToolsDivider');
    check(mini.getAttribute('aria-expanded')==='false'&&tools.getAttribute('aria-expanded')==='false','New sidebar groups must start collapsed');
    check(!visible(tab('gameMajoku'))&&!visible(tab('contentPlanner')),'Collapsed groups still show items');
    const precedes=(a,b)=>Boolean(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
    check(tab('careerTimeline').nextElementSibling===tab('achievements')&&precedes(tab('achievements'),mini),'Achievements must remain outside mini-games');
    check(tab('gameMultiDraw').nextElementSibling===tab('gameMajoku'),'Chat game must follow Gacha');
    check(tab('gameMajoku').title==='채팅연동게임'&&tab('gameMajoku').querySelector('.nav-label').textContent==='채팅연동게임','Chat game label incorrect');
    for(const id of ['gameMajoku','gameLadder','gameF1Racing','gameMultiDraw']){
      check(precedes(mini,tab(id))&&precedes(tab(id),tools),id+' not in mini-game group');
    }
    for(const id of ['contentPlanner','toolTier','toolMatrix','toolRelations','memos']){
      check(precedes(tools,tab(id))&&precedes(tab(id),q('.nav-settings-divider')),id+' not in tools group');
    }
    if(tools.getAttribute('aria-expanded')==='false')tools.click();
    if(mini.getAttribute('aria-expanded')==='false')mini.click();
    tools.click();
    check(!visible(tab('contentPlanner'))&&!visible(tab('toolTier'))&&!visible(tab('memos'))&&visible(tab('gameMajoku')),'Tools collapse hides wrong buttons');
    tools.click();
    check(visible(tab('contentPlanner')),'Drawing did not reopen');
    mini.click();
    check(!visible(tab('gameMajoku'))&&!visible(tab('gameF1Racing'))&&visible(tab('contentPlanner'))&&visible(tab('achievements')),'Games collapse hides wrong buttons');
    mini.click();
    check(!visible(tab('sniper'))&&!visible(tab('friendFinder')),'Old sidebar items are visible');
    tab('contacts').click();
    check(active()==='contacts','Contacts did not open');
    clickContact('contactFrequency');
    check(active()==='contactFrequency'&&tab('contacts').classList.contains('active')&&q('#contactFrequency [data-contact-view-v176="contactFrequency"]').getAttribute('aria-selected')==='true','Frequency route/parent selection failed');
    clickContact('sniper');
    check(active()==='sniper'&&tab('contacts').classList.contains('active'),'Recent people route/parent selection failed');
    clickContact('friendFinder');
    check(active()==='friendFinder'&&tab('contacts').classList.contains('active'),'Friend route/parent selection failed');
    q('#friendFinder [data-friend-view-v176="targets"]').click();
    check(active()==='targets'&&q('#targets [data-contact-view-v176="friendFinder"]').getAttribute('aria-selected')==='true','Target route lost nested selection');
    clickContact('contacts');
    check(active()==='contacts'&&q('#pageTitle').textContent==='연락처','Contacts return failed');
    const friend=q('#friendFinder');friend.remove();clickContact('friendFinder');
    check(active()==='contacts','Missing friend section must not blank the workspace');
    q('main').append(friend);clickContact('friendFinder');
    check(active()==='friendFinder','Restored friend section did not open');
    window.setTab('gameMajoku');
    check(active()==='gameMajoku'&&q('#pageTitle').textContent==='채팅연동게임','Chat game route/title changed');
    window.setTab('calendar');
    check(!tab('contacts').classList.contains('active'),'Contacts remains active on calendar');
    const add=q('#newEventBtn');
    for(const section of document.querySelectorAll('.section')){
      window.setTab(section.id);
      const css=getComputedStyle(add),icon=getComputedStyle(add,'::before');
      check(css.fontSize==='0px'&&css.width==='34px'&&css.height==='34px'&&icon.maskImage!=='none'&&add.getAttribute('aria-label')==='컨텐츠 추가','Shared add icon inconsistent: '+section.id);
    }
    document.getElementById('qa-result').textContent='PASS';
  }catch(e){document.getElementById('qa-result').textContent='FAIL: '+e.message}
};
try{
    const body='<!doctype html><meta charset="utf-8"><style>'+styles+'</style><body class="sidebar-pinned" style="background:#101216"><div class="app">'+aside+'<main class="main">'+header+'<section id="calendar" class="section active"></section><section id="contacts" class="section"></section><section id="contactFrequency" class="section"></section><section id="sniper" class="section"></section><section id="friendFinder" class="section"></section><section id="targets" class="section"></section><section id="gameMajoku" class="section"></section></main></div><pre id="qa-result">pending</pre><script id="mwsToolsCleanV110Script"></script><script>('+setup.toString()+')();</script>'+runtime.map(s=>'<script>'+s+'</script>').join('')+'<script>setTimeout('+test.toString()+',500)</script></body>';
  const file=path.join(fixture,'fixture.html');
  writeFileSync(file,body);
  const run=spawnSync(chrome,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--user-data-dir='+path.join(fixture,'profile'),'--window-size=1366,768','--virtual-time-budget=1500','--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:12*1024*1024});
  assert.equal(run.status,0,run.stderr);
  const result=run.stdout.match(/<pre id="qa-result">([^<]*)<\/pre>/)?.[1];
  assert.equal(result,'PASS',result||'Missing browser QA result');
  console.log('PASS workspace menu order, collapse groups, contact routes and parent selection');
}finally{rmSync(fixture,{recursive:true,force:true})}
