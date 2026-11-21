import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import os from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html'),castle=read('majoku-castle.html'),workspace=read('assets/workspace-ui-v176.js');
const aside=index.slice(index.indexOf('<aside class="sidebar">'),index.indexOf('</aside>')+8);
const css=['app-core.css','sidebar-rail-scrollbar-v1.css','mawang-premium-v1621.css','device-ui.css','ui-frame-presets.css','calendar-space-efficiency-v1.css','workspace-clean-v1.css'].map(p=>read('assets/'+p)).join('\n');
const tmp=mkdtempSync(path.join(os.tmpdir(),'mws-sidebar-interaction-'));
const fixture=path.join(tmp,'fixture.html'),castleFixture=path.join(tmp,'castle.html');
// Include the actual home markup, not a simplified duplicate.
writeFileSync(castleFixture,castle);
writeFileSync(fixture,`<!doctype html><meta charset="utf-8"><style>${css}</style><body class="mws-premium sidebar-pinned" data-resolution="fhd"><div class="app">${aside}<main class="main"><div class="topbar"><h1 id="pageTitle">캘린더</h1><span id="clockText"></span></div><section class="section active" id="calendar"><div id="testCards"></div></section><section class="section" id="contacts"></section><section class="section" id="sniper"></section><section class="section" id="targets"></section><section class="section" id="memos"><div class="memo-section-tabs"><button id="memoLibraryTab">메모</button><button id="memoFavoritesTab">즐겨찾기</button></div><div id="memoLibraryView"></div><div id="memoFavoritesView"></div></section></main></div><script>
window.data={patchNotes:[{id:'1',author:'QA',content:'기존 기록',createdAt:'2026-11-21T00:00:00Z'}],suggestions:[]};
window.setTab=function(tab){document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===tab));document.querySelectorAll('.nav button[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.getElementById('pageTitle').textContent=tab};
window.setTab('calendar');
</script><script>${workspace}</script>`);
let browser;
try{
  browser=await launchCalendarBrowser(tmp);
  for(const [w,h] of [[1366,768],[1920,1080]]){
    await browser.navigate(pathToFileURL(fixture).href+'?width='+w,w,h);
    const idle=await browser.evaluate(`(async()=>{
      const patch=document.getElementById('patchNoteCardsV176'),suggestion=document.getElementById('suggestionCardsV176');
      await new Promise(r=>setTimeout(r,100));
      const first=patch.firstElementChild,empty=suggestion.firstElementChild;
      let writes=0;const observer=new MutationObserver(records=>writes+=records.length);
      observer.observe(patch,{childList:true});observer.observe(suggestion,{childList:true});
      for(let i=0;i<18;i++){document.getElementById('clockText').textContent=String(i);document.getElementById('testCards').innerHTML='<div>새 카드 '+i+'</div>';await new Promise(requestAnimationFrame)}
      const unchanged=writes===0&&first===patch.firstElementChild&&empty===suggestion.firstElementChild;
      document.querySelector('main').insertAdjacentHTML('beforeend','<section class="section" id="friendFinder"></section>');
      await new Promise(r=>setTimeout(r,100));
      const lateSection=!!document.querySelector('#friendFinder .mws-contact-tabs-v176')&&!!document.querySelector('#friendFinder .mws-friend-tabs-v176')&&first===patch.firstElementChild;
      data.patchNotes.push({id:'2',author:'QA',content:'신규 기록',createdAt:'2026-11-21T01:00:00Z'});
      dispatchEvent(new CustomEvent('mawang:datachange',{detail:{reason:'패치노트 추가'}}));
      await new Promise(r=>setTimeout(r,100));const changed=patch.children.length===2&&patch.firstElementChild.textContent.includes('신규 기록'),actualWrites=writes;
      dispatchEvent(new CustomEvent('mawang:datachange',{detail:{reason:'전체 화면 동기화'}}));
      await new Promise(r=>setTimeout(r,100));observer.disconnect();
      return {unchanged,lateSection,changed,actualWrites,stableAfterSync:writes===actualWrites};
    })()`);
    assert(idle.unchanged&&idle.lateSection&&idle.changed&&idle.actualWrites===1&&idle.stableAfterSync,JSON.stringify(idle));
    // Real pointer input, no synthetic hover class or click. Sample every
    // crossed tile immediately after mouseMoved, before the old 120ms fade.
    let total=0;
    for(const pinned of [true,false]){
      await browser.evaluate(`document.body.classList.toggle('sidebar-pinned',${pinned})`);
      await browser.movePoint(w-20,30);
      const idleStyle=await browser.evaluate(`(async()=>{await new Promise(r=>setTimeout(r,200));const b=document.querySelector('.nav-scroll button[data-tab="contacts"]');return getComputedStyle(b).backgroundColor})()`);
      const sidebar=await browser.evaluate(`(()=>{const r=document.querySelector('.sidebar').getBoundingClientRect();return {x:r.left+25,y:r.top+80}})()`);
      await browser.movePoint(sidebar.x,sidebar.y);
      const positions=await browser.evaluate(`(async()=>{await new Promise(r=>setTimeout(r,200));return ['dashboard','contacts','posts','memos','achievements'].map(id=>{const b=document.querySelector('.nav-scroll button[data-tab="'+id+'"]');const r=b.getBoundingClientRect();return {id,x:r.left+r.width/2,y:r.top+r.height/2}})})()`);
      for(let lap=0;lap<3;lap++)for(const {id,x,y} of positions){
        await browser.movePoint(x,y);
        const state=await browser.evaluate(`(()=>{const b=document.querySelector('.nav-scroll button[data-tab="${id}"]'),i=b.querySelector('.nav-icon'),s=getComputedStyle(b),is=getComputedStyle(i);return {hover:b.matches(':hover'),background:s.backgroundColor,delay:s.transitionDelay,duration:s.transitionDuration,iconDuration:is.transitionDuration,translate:s.transform}})()`);
        assert(state.hover&&state.background!==idleStyle&&state.delay==='0s'&&state.duration==='0s'&&state.iconDuration==='0s'&&state.translate==='none',JSON.stringify({id,pinned,state}));total++;
      }
      await browser.movePoint(w-20,30);
      assert(await browser.evaluate(`!document.querySelector('.nav-scroll button[data-tab="contacts"]').matches(':hover')`));
    }
    console.log('SIDEBAR_INTERACTION_OK',w,h,JSON.stringify({idle,total}));
  }
  await browser.navigate(pathToFileURL(castleFixture).href,1366,768);
  const home=await browser.evaluate(`(()=>{const home=document.getElementById('castleHome');return {headings:[...home.querySelectorAll('h1')].map(e=>e.textContent),titleCount:(home.textContent.match(/Majoku Castle/gi)||[]).length,chip:home.querySelector('.castle-availability').textContent,available:home.querySelectorAll('.game-card.live').length,hero:!!home.querySelector('.hero')}})()`);
  assert.deepEqual(home.headings,['Majoku Castle']);assert.equal(home.titleCount,1);assert.equal(home.available,9);assert.equal(home.chip,'게임 9개 이용 가능');assert(!home.hero);
  await browser.evaluate(`document.querySelector('.game-card[data-game="drawing"]').click()`);
  assert(await browser.evaluate(`document.getElementById('drawingGame').classList.contains('active')`));
  await browser.evaluate(`document.getElementById('backCastleBtn').click()`);
  assert(await browser.evaluate(`document.getElementById('castleHome').classList.contains('active')`));
  console.log('MAJOKU_HOME_OK',JSON.stringify(home));
}finally{await browser?.close();rmSync(tmp,{recursive:true,force:true})}
