import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Production public mode only; no save, delete, approval, API mutation or
// gameplay. The companion local browser fixture exercises data changes.
const base=(process.env.MWS_LIVE_BASE||'https://mawang-scheduler.majoku.workers.dev').replace(/\/$/,'');
const sizes=[[1366,768,false],[1920,1080,false],[2560,1440,false],[2560,1080,false],[390,844,true],[844,390,true]];
const routes=['dashboard','calendar','contacts','sniper','friendFinder','targets','posts','memos','careerTimeline','mawangArchive','achievements','gameLadder','gameMultiDraw','gameMajoku','contentPlanner','toolTier','toolMatrix','toolRelations','legacy','wardogs','gameRps','gamePachinko','export','settings'];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check,label,attempts=100){let last;for(let i=0;i<attempts;i++){try{last=await check();if(last)return last}catch(error){last=String(error)}await pause(120)}throw Error(label+': '+JSON.stringify(last))}
const failures=[];
for(const [width,height,mobile] of sizes){
  const dir=mkdtempSync(path.join(os.tmpdir(),'mws-workspace-live-'));let browser;
  try{
    browser=await launchCalendarBrowser(dir);await browser.navigate(base+'/?workspace-qa-v2='+width+'x'+height+'-'+Date.now(),width,height,mobile);
    await until(()=>browser.evaluate(`(()=>{document.querySelector('#mwsAnnouncementDialog[open] .mws-notice-close')?.click();return !!window.__mwsAppReadyV130&&document.body.dataset.mwsMode==='public'&&!document.body.classList.contains('mws-app-loading')&&!!document.querySelector('#calendarGrid .mini-event[data-evid]')&&!!window.mwsUiInteractionsV1?.stateChanges&&!!document.querySelector('#mwsToolsDivider')})()`),'public initialization',450);
    if(mobile){await until(()=>browser.evaluate(`(()=>{if(document.body.dataset.deviceMode!=='mobile')document.querySelector('[data-device-choice="mobile"]')?.click();return document.body.dataset.deviceMode==='mobile'})()`),'mobile device mode');await pause(300)}
    const initial=await browser.evaluate(`([...document.querySelectorAll('.nav-game-divider[data-mws-nav-group]')].map(n=>n.getAttribute('aria-expanded')))`);
    assert.deepEqual(initial,['false','false']);
    for(const route of routes){
      try{
        const selector=route==='sniper'||route==='friendFinder'?`[data-contact-view-v176="${route}"]`:route==='targets'?'[data-friend-view-v176="targets"]':['wardogs','gameRps','gamePachinko'].includes(route)?`#legacy [data-tab="${route}"]`:`.sidebar button[data-tab="${route}"]`;
        if(['wardogs','gameRps','gamePachinko'].includes(route))await browser.evaluate(`document.querySelector('.sidebar button[data-tab="legacy"]').click()`);
        if(['gameLadder','gameMultiDraw','gameMajoku'].includes(route))await browser.evaluate(`(()=>{const e=document.querySelector('[data-mws-nav-group="games"]');if(e.getAttribute('aria-expanded')==='false')e.click()})()`);
        if(['contentPlanner','toolTier','toolMatrix','toolRelations','memos'].includes(route))await browser.evaluate(`(()=>{const e=document.querySelector('[data-mws-nav-group="tools"]');if(e.getAttribute('aria-expanded')==='false')e.click()})()`);
        await until(()=>browser.evaluate(`(()=>{const selector=${JSON.stringify(selector)},el=[...document.querySelectorAll(selector)].find(e=>e.closest('.section.active'))||document.querySelector(selector);if(!el)return false;el.click();return true})()`),'navigation control '+route);
        await until(()=>browser.evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(route)});return e?.classList.contains('active')&&e.getBoundingClientRect().width>0})()`),'active '+route);
        await pause(180);
        const state=await browser.evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(route)}),r=e.getBoundingClientRect(),add=document.getElementById('newEventBtn'),main=document.querySelector('.main').getBoundingClientRect(),buttonRect=add.getBoundingClientRect(),quickAdd=add.closest('.mws-mobile-calendar-quick-add-v130.is-visible');return {active:e.classList.contains('active'),w:r.width,h:r.height,rootOverflow:document.documentElement.scrollWidth-innerWidth,mainRight:main.right,view:innerWidth,button:getComputedStyle(add,'::before').maskImage!=='none'||Boolean(quickAdd&&getComputedStyle(add,'::after').content.includes('+')&&buttonRect.height>=44&&buttonRect.width>0),label:add.getAttribute('aria-label')};})()`);
        assert(state.active&&state.w>0&&state.rootOverflow<=2&&state.mainRight<=state.view+2,JSON.stringify(state));
        assert(state.button&&state.label==='컨텐츠 추가','common add icon '+JSON.stringify(state));
        // Read-only primary interactions in real sections; all state-changing
        // actions are exercised separately on the isolated fixture.
        if(route==='dashboard')assert.equal(await browser.evaluate(`document.querySelectorAll('#dashboard .dashboard-kpi-grid-local > .card').length`),6);
        if(route==='calendar'){
          await browser.evaluate(`document.getElementById('calendarCopyTrayToggleV4').click()`);assert(await browser.evaluate(`document.getElementById('calendarCopyTrayToggleV4').getAttribute('aria-expanded')==='true'`));await browser.evaluate(`document.getElementById('calendarCopyTrayCloseV4').click()`);
        }
        if(route==='contacts'){
          await until(()=>browser.evaluate(`!!document.querySelector('#contacts .contact-card[data-contact-id]')`),'contact cards');
          await browser.evaluate(`document.querySelector('#contacts .contact-card[data-contact-id]').click()`);await until(()=>browser.evaluate(`document.getElementById('contactModal').classList.contains('open')`),'contact popup');
          assert(await browser.evaluate(`!!document.querySelector('#contacts .contact-card.mws-ui-contact-selected')`));await browser.evaluate(`document.querySelector('[data-close="contactModal"]').click()`);
        }
        if(route==='posts'){
          await browser.evaluate(`document.querySelector('#postSavedMenu summary').click()`);assert(await browser.evaluate(`document.getElementById('postSavedMenu').open`));await browser.evaluate(`document.querySelector('#postSavedMenu summary').click()`);
        }
        if(route==='memos'){
          await browser.evaluate(`document.getElementById('memoFavoritesTab').click()`);assert(await browser.evaluate(`document.getElementById('memoFavoritesView').classList.contains('active')`));await browser.evaluate(`document.getElementById('memoLibraryTab').click()`);
        }
        if(route==='careerTimeline')await until(()=>browser.evaluate(`!!document.querySelector('#careerTimeline .cv-map-year')`),'timeline runtime');
        if(route==='mawangArchive'){
          await until(()=>browser.evaluate(`document.querySelectorAll('#mawangArchive [data-ma-character]').length===23`),'character archive');
          assert(await browser.evaluate(`(()=>{const r=document.getElementById('mwsArchiveRoot');r.querySelector('[data-ma-character="hina"]').click();if(r.querySelector('#maCharacterName').textContent!=='히나')return false;r.querySelector('[data-ma-filter="jeong"]').click();return r.querySelectorAll('[data-ma-character]').length===9&&r.querySelector('#maCharacterName').textContent==='유정'})()`),'archive selection and filter');
        }
        if(route==='achievements')await until(()=>browser.evaluate(`!!document.querySelector('#achievements .achievement-card-open')`),'achievement gallery');
        if(route==='gameLadder')assert(await browser.evaluate(`!!document.getElementById('ladderWizardSteps')`));
        if(route==='friendFinder')await until(()=>browser.evaluate(`!!document.getElementById('friendFinderGridV5')`),'friend grid');
        console.log('MWS_UI_SECTION_OK',width,height,route,JSON.stringify(state));
      }catch(error){failures.push(`${width}x${height} ${route}: ${error.message}`);console.error(failures.at(-1))}
    }
  }catch(error){failures.push(`${width}x${height}: ${error.message}`);console.error(failures.at(-1))}
  finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
}
assert.deepEqual(failures,[],'Non-F1 workspace regression');
console.log('MWS_UI_WORKSPACE_LIVE_V2_OK',JSON.stringify({viewports:sizes.length,routes:routes.length,checks:sizes.length*routes.length}));
