import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Production public mode only; no save, delete, approval, API mutation or
// gameplay. The companion local browser fixture exercises data changes.
const base=(process.env.MWS_LIVE_BASE||'https://mawang-scheduler.majoku.workers.dev').replace(/\/$/,'');
const sizes=[[1366,768,false],[1920,1080,false],[2560,1440,false],[2560,1080,false],[390,844,true],[844,390,true]];
const routes=['dashboard','calendar','contacts','sniper','friendFinder','targets','posts','contentApplications','memos','careerTimeline','mawangArchive','achievements','gameLadder','gameMultiDraw','gameMajoku','contentPlanner','toolTier','toolMatrix','toolRelations','legacy','wardogs','gameRps','gamePachinko','export','settings'];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check,label,attempts=100){let last;for(let i=0;i<attempts;i++){try{last=await check();if(last)return last}catch(error){last=String(error)}await pause(120)}throw Error(label+': '+JSON.stringify(last))}
// Real hit-test against the top, middle and bottom of each control.
// Element.click() alone bypasses overlays and missed the reported regression.
async function expectMouseTarget(browser,selector,label){
  const result=await browser.evaluate(`(()=>{
    const target=document.querySelector(${JSON.stringify(selector)});
    if(!target)return {missing:true,selector:${JSON.stringify(selector)}};
    const box=target.getBoundingClientRect(),cs=getComputedStyle(target);
    const samples=[];
    for(const fx of [.18,.5,.82])for(const fy of [.25,.5,.75]){
      const x=box.left+box.width*fx,y=box.top+box.height*fy;
      if(x<0||y<0||x>=innerWidth||y>=innerHeight){samples.push({x,y,offscreen:true});continue}
      const hit=document.elementFromPoint(x,y);
      samples.push({x:Math.round(x),y:Math.round(y),valid:!!hit&&(hit===target||target.contains(hit)),hit:hit?.tagName+'.'+String(hit?.className).slice(0,70)});
    }
    return {rect:{x:box.x,y:box.y,w:box.width,h:box.height},display:cs.display,samples};
  })()`);
  assert(result.rect&&result.rect.w>=20&&result.rect.h>=20&&result.display!=='none',label+' geometry '+JSON.stringify(result));
  assert(result.samples.every(v=>v.valid===true),label+' pointer is blocked '+JSON.stringify(result));
  return {x:result.rect.x+result.rect.w/2,y:result.rect.y+result.rect.h/2};
}
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
        const state=await browser.evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(route)}),r=e.getBoundingClientRect(),add=document.getElementById('newEventBtn'),main=document.querySelector('.main').getBoundingClientRect(),buttonRect=add.getBoundingClientRect(),quickAdd=add.closest('.mws-mobile-calendar-quick-add-v130.is-visible');const computed=getComputedStyle(add),wiki=document.getElementById('mwsArchiveWikiLink'),date=document.getElementById('todayText'),time=document.getElementById('clockText'),sync=document.querySelector('.topbar .sync-status'),status=document.getElementById('syncStatusText');return {active:e.classList.contains('active'),w:r.width,h:r.height,rootOverflow:document.documentElement.scrollWidth-innerWidth,mainRight:main.right,view:innerWidth,button:getComputedStyle(add,'::before').maskImage!=='none'||Boolean(quickAdd&&getComputedStyle(add,'::after').content.includes('+')&&buttonRect.height>=44&&buttonRect.width>0),label:add.getAttribute('aria-label'),addVisible:computed.display!=='none'&&buttonRect.width>0&&buttonRect.height>0,wikiVisible:wiki&&getComputedStyle(wiki).display!=='none',metaHidden:getComputedStyle(date).display==='none'&&getComputedStyle(time).display==='none',statusCorrect:sync?.classList.contains('mws-sync-needs-attention')===(getComputedStyle(sync).display!=='none')};})()`);
        assert(state.active&&state.w>0&&state.rootOverflow<=2&&state.mainRight<=state.view+2,JSON.stringify(state));
        assert(state.label==='컨텐츠 추가'&&(route!=='calendar'||state.button),'calendar add control remains operable '+JSON.stringify(state));
        assert(state.addVisible===(route==='calendar'),'event creation visible only in calendar '+JSON.stringify({route,...state}));
        assert(state.wikiVisible===(route==='mawangArchive'),'wiki link only on archive '+JSON.stringify({route,...state}));
        assert(state.metaHidden&&state.statusCorrect,'redundant header metadata hidden; warning retained '+JSON.stringify({route,...state}));
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
          if(width>=1101) {
            await browser.evaluate('window.scrollTo(0,0)');
            await pause(120);
            for(const [selector,id] of [['#postSavedMenu > summary','postSavedMenu'],['#postRegisterMenu > summary','postRegisterMenu']]){
              const point=await expectMouseTarget(browser,selector,selector);
              await browser.clickPoint(point.x,point.y);
              assert(await browser.evaluate(`document.getElementById(${JSON.stringify(id)}).open`),'real mouse click must open '+id);
              await browser.clickPoint(point.x,point.y);
              assert(!await browser.evaluate(`document.getElementById(${JSON.stringify(id)}).open`),'real mouse click must close '+id);
            }
            const detailVisible=await browser.evaluate(`(()=>{const el=document.querySelector('#posts .post-detail-menu > summary');if(!el)return false;const r=el.getBoundingClientRect();return r.width>=20&&r.height>=20&&r.top>=0&&r.bottom<=innerHeight})()`);
            if(detailVisible){
              const point=await expectMouseTarget(browser,'#posts .post-detail-menu > summary','post management');
              await browser.clickPoint(point.x,point.y);
              assert(await browser.evaluate(`document.querySelector('#posts .post-detail-menu').open`),'real mouse opens management');
              await browser.clickPoint(point.x,point.y);
            }
          }else{
            await browser.evaluate(`document.querySelector('#postSavedMenu summary').click()`);assert(await browser.evaluate(`document.getElementById('postSavedMenu').open`));await browser.evaluate(`document.querySelector('#postSavedMenu summary').click()`);
          }
        }
        if(route==='memos'){
          await browser.evaluate(`document.getElementById('memoFavoritesTab').click()`);assert(await browser.evaluate(`document.getElementById('memoFavoritesView').classList.contains('active')`));await browser.evaluate(`document.getElementById('memoLibraryTab').click()`);
        }
        if(route==='careerTimeline'){
          await until(()=>browser.evaluate(`!!document.querySelector('#careerTimeline .cv-map-year')`),'timeline runtime');
          assert.equal(await browser.evaluate(`document.querySelectorAll('#careerTimeline .cv-summary .cv-step').length`),0,'unnecessary timeline arrows removed');
          if(width>=1101){
            await browser.evaluate('window.scrollTo(0,0)');
            await pause(120);
            const geo=await browser.evaluate(`(()=>{const title=document.querySelector('#pageTitle').getBoundingClientRect(),bar=document.querySelector('#careerTimeline .cv-bar').getBoundingClientRect(),host=document.querySelector('#careerTimeline .cv-bar-host'),topbar=document.querySelector('.main>.topbar').getBoundingClientRect();return {titleY:(title.top+title.bottom)/2,barTop:bar.top,barBottom:bar.bottom,barW:bar.width,topbarBottom:topbar.bottom,sticky:getComputedStyle(host).position,barPosition:getComputedStyle(host.firstElementChild).position,inlineHostHeight:host.style.height,oldPinned:bar.classList.contains('cv-pinned')}})()`);
            assert(geo.sticky==='sticky'&&geo.barPosition==='relative'&&!geo.oldPinned
              &&geo.inlineHostHeight===''&&geo.barW>=450
              &&geo.barTop>=geo.topbarBottom-2&&geo.barTop-geo.topbarBottom<70,
              'timeline toolbar must stay in its own stable in-flow row '+JSON.stringify(geo));
            await expectMouseTarget(browser,'#careerTimeline .cv-search','timeline search');
            await expectMouseTarget(browser,'#careerTimeline .cv-export','timeline export');
            const yearPoint=await expectMouseTarget(browser,'#careerTimeline .cv-map-year[aria-label^="2025년"]','timeline year 2025');
            const searchPoint=await expectMouseTarget(browser,'#careerTimeline .cv-search','timeline search field');
            await browser.clickPoint(searchPoint.x,searchPoint.y);
            assert(await browser.evaluate(`document.activeElement===document.querySelector('#careerTimeline .cv-search')`),'real click focuses timeline search');
            await browser.clickPoint(yearPoint.x,yearPoint.y);
            await pause(180);
            assert(await browser.evaluate(`document.scrollingElement.scrollTop>20 || document.querySelector('#careerTimeline .cv-map-year[aria-label^="2025년"]').getAttribute('aria-current')==='true'`),'real click activates timeline year');
          }
        }
        if(route==='posts'&&width>=1101){
          const geo=await browser.evaluate(`(()=>{const a=document.querySelector('#posts .post-workspace-actions').getBoundingClientRect(),t=document.querySelector('#pageTitle').getBoundingClientRect();return {actionY:(a.top+a.bottom)/2,titleY:(t.top+t.bottom)/2,visible:getComputedStyle(document.querySelector('#posts .posts-head h2')).display}})()`);
          assert(Math.abs(geo.actionY-geo.titleY)<=24&&geo.visible==='none','posts action row aligned with title '+JSON.stringify(geo));
        }
        if(route==='contentApplications'&&width>=1101){
          const geo=await browser.evaluate(`(()=>{const h=document.querySelector('#pageTitle').getBoundingClientRect(),a=document.querySelector('#contentApplications .ca-head').getBoundingClientRect();return {titleY:(h.top+h.bottom)/2,actionY:(a.top+a.bottom)/2,eyebrow:getComputedStyle(document.querySelector('#contentApplications .ca-head .ca-eyebrow')).display}})()`);
          const headerVisible=await browser.evaluate("getComputedStyle(document.querySelector('#contentApplications .ca-head')).display!=='none'");
          assert((!headerVisible||Math.abs(geo.titleY-geo.actionY)<=24)&&geo.eyebrow==='none','application header hidden when empty or aligned to title '+JSON.stringify({geo,headerVisible}));
        }
        if(route!=='mawangArchive'){
          assert(await browser.evaluate(`(()=>{const nav=document.querySelector('.ma-header-filters');return !nav||nav.hidden||getComputedStyle(nav).display==='none'})()`),'archive category buttons are hidden on '+route);
        }else if(width>=1101){
          assert(await browser.evaluate(`(()=>{const nav=document.querySelector('.ma-header-filters');return !!nav&&!nav.hidden&&getComputedStyle(nav).display==='flex'})()`),'archive category buttons visible only in archive');
        }
        if(route==='mawangArchive'){
          await until(()=>browser.evaluate(`document.querySelectorAll('#mawangArchive [data-ma-character]').length>=2 && document.querySelector('#mawangArchive .ma-count').textContent==='28 / 28'`),'character archive');
          await until(()=>browser.evaluate(`document.querySelector('#mawangArchive .ma-stage-art .ma-character-image')?.naturalWidth>1`),'actual character portrait loaded');
          assert(await browser.evaluate(`(()=>{const r=document.getElementById('mwsArchiveRoot');for(let i=0;i<14&&!r.querySelector('[data-ma-character="hina"]');i++){const next=r.querySelector('[data-ma-step="1"]');if(next.disabled)return false;next.click()}r.querySelector('[data-ma-character="hina"]').click();if(r.querySelector('#maCharacterName').textContent!=='히나')return false;r.querySelector('[data-ma-filter="jeong"]').click();return r.querySelector('.ma-count').textContent==='13 / 28'&&r.querySelector('#maCharacterName').textContent==='유정'&&!r.querySelector('a[href]')})()`),'archive selection and filter');
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
