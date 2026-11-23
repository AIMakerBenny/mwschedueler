import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
const slice=(start,end)=>{
  const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
  assert(a>=0&&b>a,'Fixture source not found: '+start+' / '+end);
  return html.slice(a,b);
};
const aside=slice('<aside class="sidebar">','</aside>')+'</aside>';
const qaAside=aside.replace('<button data-tab="dashboard"','<button class="active" data-tab="dashboard"').replace('<button class="active" data-tab="calendar"','<button data-tab="calendar"');
const header=slice('<div class="topbar">','<section id="dashboard"');
const qaHeader=header.replace('<h1 id="pageTitle">캘린더</h1>','<h1 id="pageTitle">대시보드</h1>');
const dashboard=slice('<section id="dashboard"','<section id="calendar"')
  .replace('class="section"','class="section active"');
const inline=[...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
const css=[
  'app-core.css','mawang-premium-v1621.css','ui-frame-presets.css',
  'sidebar-rail-scrollbar-v1.css','sidebar-stable-v1.css','career-timeline.css',
  'mawang-archive-header-v1.css',
  'content-applications-v1.css','workspace-clean-v1.css','workspace-density-v1.css','sidebar-compact-v1.css','visual-experience-v1.css'
].map(p=>read('assets/'+p)).join('\n')+'\n'+inline;
const pageScale=slice("const PAGE_SCALE_KEY='mws_page_text_scales_v54';",
  '/* ---------- Robust contact tag panel ---------- */');
const applicationSection=slice('<section id="contentApplications"','<section id="posts"');
const moreSections=[
  '<section id="contacts" class="section"><div class="contact-section-tabs"><button>연락처</button></div></section>',
  applicationSection,
  '<section id="posts" class="section"><div class="posts-head"><button type="button" id="qaPostsButton">게시글 도구</button></div></section>',
  '<section id="careerTimeline" class="section"><div class="cv-panel"><div class="cv-bar-host"><div class="cv-bar"><div class="cv-toolbar"><button type="button" class="cv-map-year">연도 선택</button><div class="cv-searchbox"><input class="cv-search" aria-label="타임라인 검색"></div><button type="button" class="cv-export">내보내기</button></div></div></div><div class="cv-axis">타임라인 콘텐츠</div></div></section>'
].join('');
const bootstrap='let data={textScale:100};'+pageScale+
  ';window.__qaActivate=function(id){document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active",s.id===id));applyPageTextScalesV54()};window.__qaRoutes=[];window.setTab=id=>{window.__qaRoutes.push(id);window.__qaActivate(id)};'+
  'const qaProfile=document.createElement("div");qaProfile.className="dashboard-my-profile-v3";qaProfile.textContent="마왕 프로필";document.querySelector("#dashboardProfileSlot").append(qaProfile);';
const fixture='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<style>'+css+'\n@media(min-width:1101px){.main>.topbar{height:48px!important;min-height:48px!important;max-height:48px!important}}'+'</style><body class="mws-premium" data-theme="neon" data-resolution="fhd" data-mws-mode="admin">'+
  '<div class="app">'+qaAside+'<main class="main">'+qaHeader+dashboard+moreSections+'</main></div>'+
  '<script>'+bootstrap+'</script><script>'+read('assets/visual-experience-v1.js')+'</script></body>';
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-ui-audit-v2-'));
let browser;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
  const file=path.join(dir,'fixture.html');writeFileSync(file,fixture);
  browser=await launchCalendarBrowser(dir);
  for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[390,844]]){
    await browser.navigate(pathToFileURL(file).href+'?viewport='+width,width,height,width<=760);
    await sleep(220);
    const dashboardResult=await browser.evaluate("(()=>{"+
      "const $=s=>document.querySelector(s),r=e=>e.getBoundingClientRect(),d=$('#dashboard');"+
      "const toolbar=$('.dashboard-toolbar-v2'),tabs=$('.dashboard-mode-tabs'),profile=$('#dashboardProfileSlot');"+
      "const metrics=$('.dashboard-kpi-grid-local'),grid=$('#dashboardMainGrid'),empty=$('.dashboard-no-events-v2');"+
      "d.dataset.upcomingCount='0';"+
      "const emptyShown=getComputedStyle(empty).display!=='none'&&getComputedStyle(grid).display==='none';"+
      "d.dataset.upcomingCount='3';"+
      "const populated=getComputedStyle(grid).display!=='none'&&getComputedStyle(empty).display==='none';"+
      "const inViewport=[toolbar,tabs,profile,metrics,grid].every(e=>r(e).left>=-2&&r(e).right<=innerWidth+2);"+
      "return {toolbar:!!toolbar,tabs:tabs.querySelectorAll('button').length,profiles:document.querySelectorAll('#dashboardProfileSlot .dashboard-my-profile-v3').length,"+
      "emptyShown,populated,inViewport,overflows:document.documentElement.scrollWidth>innerWidth+3,"+
      "sameRow:Math.abs((r(tabs).top+r(tabs).bottom)/2-(r(profile).top+r(profile).bottom)/2)<20,positions:{tabs:{top:r(tabs).top,height:r(tabs).height},profile:{top:r(profile).top,height:r(profile).height},toolbar:{top:r(toolbar).top,height:r(toolbar).height}},metricCount:metrics.querySelectorAll(':scope > .card').length,"+
      "oldHeading:!!$('.dashboard-overview-heading')};})()");
    const visual=await browser.evaluate("(()=>{const tile=document.querySelector('#dashboard .dashboard-kpi-grid-local>.card'),style=getComputedStyle(tile),rect=tile.getBoundingClientRect();return {shadow:style.boxShadow,background:style.backgroundImage,radius:style.borderRadius,rect:[rect.x,rect.y,rect.width,rect.height]}})()");
    assert(visual.shadow!=='none'&&visual.background.includes('gradient')&&parseFloat(visual.radius)>=10,JSON.stringify({width,visual}));
    // This is a component fixture, not an actual application screenshot. The
    // shared topbar includes archive-only controls which must be hidden outside
    // the archive. A missing header stylesheet previously produced giant black
    // SVGs and the wrong title while the old assertions still passed.
    const fixtureIntegrity=await browser.evaluate("(()=>{const visible=e=>!!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0;const kicker=document.querySelector('.mws-archive-kicker'),wiki=document.querySelector('#mwsArchiveWikiLink'),svg=wiki?.querySelector('svg'),title=document.querySelector('#pageTitle'),grid=document.querySelector('.dashboard-kpi-grid-local');return {dashboardActive:document.querySelector('#dashboard')?.classList.contains('active'),archiveKickerVisible:visible(kicker),archiveWikiVisible:visible(wiki),wikiSvgWidth:svg?.getBoundingClientRect().width,headerHeight:document.querySelector('.topbar')?.getBoundingClientRect().height,title:title?.textContent?.trim(),metricWidth:grid?.getBoundingClientRect().width}})()");
    assert(fixtureIntegrity.dashboardActive&&fixtureIntegrity.title==='대시보드'&&!fixtureIntegrity.archiveKickerVisible&&!fixtureIntegrity.archiveWikiVisible&&fixtureIntegrity.wikiSvgWidth<=20&&fixtureIntegrity.headerHeight<100&&fixtureIntegrity.metricWidth>100,'Invalid visual fixture, do not capture or approve screenshots: '+JSON.stringify({width,fixtureIntegrity}));
    if(process.env.MWS_VISUAL_CAPTURE==='1'&&[1366,1920,2560,390].includes(width)){mkdirSync('visual-fixture',{recursive:true});writeFileSync('visual-fixture/dashboard-'+width+'.jpg',Buffer.from(await browser.captureScreenshot(),'base64'));}
    if(width===1366){
      const valueChange=await browser.evaluate("(()=>{const v=document.querySelector('#nextStreamKpi');v.textContent='시각 테스트 1';return true})()");
      await sleep(50);
      const animated=await browser.evaluate("(()=>{const v=document.querySelector('#nextStreamKpi');return v.classList.contains('mws-vx-updated')&&v.getAnimations().some(a=>a.animationName==='mws-vx-numeric-update')})()");
      assert(animated,JSON.stringify({width,valueChange,animated}));
      await sleep(450);
      await browser.evaluate("document.querySelector('#nextStreamKpi').textContent='시각 테스트 1'");
      await sleep(40);
      assert(!(await browser.evaluate("document.querySelector('#nextStreamKpi').classList.contains('mws-vx-updated')")),'Identical value should not animate');
      await browser.evaluate("document.documentElement.dataset.mwsMotion='reduced';document.querySelector('#nextStreamKpi').textContent='시각 테스트 2'");
      await sleep(40);
      assert(!(await browser.evaluate("document.querySelector('#nextStreamKpi').classList.contains('mws-vx-updated')")),'Reduced motion must suppress value change');
      await browser.evaluate("delete document.documentElement.dataset.mwsMotion");
    }
    const caretResult=await browser.evaluate("(()=>{const title=document.querySelector('#pageTitle');const input=document.createElement('input');input.setAttribute('aria-label','QA typing caret');document.body.append(input);const staticCaret=getComputedStyle(title).caretColor,editCaret=getComputedStyle(input).caretColor;const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(title);selection.removeAllRanges();selection.addRange(range);const selectable=selection.toString().includes('대시보드');selection.removeAllRanges();input.remove();return {staticCaret,editCaret,selectable}})()");
    assert(['transparent','rgba(0, 0, 0, 0)'].includes(caretResult.staticCaret)&&caretResult.editCaret!==caretResult.staticCaret&&caretResult.selectable,JSON.stringify({width,caretResult}));
    assert.equal(dashboardResult.metricCount,6,JSON.stringify({width,dashboardResult}));
    assert.equal(dashboardResult.tabs,3,JSON.stringify({width,dashboardResult}));
    assert.equal(dashboardResult.profiles,1);
    assert(dashboardResult.emptyShown&&dashboardResult.populated,JSON.stringify({width,dashboardResult}));
    assert(dashboardResult.inViewport&&!dashboardResult.overflows&&!dashboardResult.oldHeading,JSON.stringify({width,dashboardResult}));
    if(width>760)assert(dashboardResult.sameRow,JSON.stringify({width,dashboardResult}));
    const metricRoutes=await browser.evaluate("(()=>{const b=[...document.querySelectorAll('#dashboard .dashboard-kpi-grid-local > button')];"+
      "const labels=b.map(x=>x.getAttribute('aria-label')||x.textContent.trim());"+
      "const allKeyboard=b.every(x=>x.tagName==='BUTTON'&&x.type==='button');"+
      "const ids=['nextStreamKpi','weekCountKpi','contactCountKpi'],routes=[];"+
      "for(const id of ids){window.__qaActivate('dashboard');const x=document.getElementById(id).closest('button');x.click();routes.push(window.__qaRoutes.at(-1));}"+
      "window.__qaActivate('dashboard');return {count:b.length,routes,allKeyboard,labels}})()");
    assert(metricRoutes.count===6&&metricRoutes.allKeyboard,JSON.stringify({width,metricRoutes}));
    assert.deepEqual(metricRoutes.routes,['calendar','calendar','contacts'],JSON.stringify({width,metricRoutes}));
    await browser.evaluate("window.__qaActivate('contacts')");
    const contacts=await browser.evaluate("(()=>({heading:getComputedStyle(document.querySelector('.top-left')).display,clock:getComputedStyle(document.querySelector('.clock')).display}))()");
    assert.equal(contacts.heading,'none',JSON.stringify({width,contacts}));
    assert.notEqual(contacts.clock,'none');
    await browser.evaluate("window.__qaActivate('contentApplications')");
    const application=await browser.evaluate("(()=>{const h=document.querySelector('#contentApplications>.ca-head'),b=document.querySelector('#caNewBtn');"+
      "const initiallyHidden=b.hidden&&getComputedStyle(h).display==='none';"+
      "b.hidden=false;const addVisible=getComputedStyle(h).display!=='none';"+
      "b.hidden=true;return {initiallyHidden,addVisible}})()");
    assert(application.initiallyHidden&&application.addVisible,JSON.stringify({width,application}));
    await browser.evaluate("window.__qaActivate('dashboard')");
    const scale=await browser.evaluate("(()=>{window.setPageTextScaleV54(115);const a=document.querySelector('#pageTextScaleValueV54').textContent;"+
      "window.__qaActivate('contacts');const b=document.querySelector('#pageTextScaleValueV54').textContent;"+
      "window.__qaActivate('dashboard');const c=document.querySelector('#pageTextScaleValueV54').textContent;"+
      "return [a,b,c]})()");
    assert.deepEqual(scale,['115%','100%','115%'],JSON.stringify({width,scale}));
    if(width>760){
      await browser.movePoint(width-80,height-80);await sleep(220);
      const collapsed=await browser.evaluate("(()=>({width:document.querySelector('.sidebar').getBoundingClientRect().width,"+
        "text:getComputedStyle(document.querySelector('#pageTextScaleControlV54')).display,"+
        "logo:getComputedStyle(document.querySelector('.logo-full')).display,navLabel:getComputedStyle(document.querySelector('.nav-label')).display}))()");
      assert(collapsed.width<100&&collapsed.text==='none'&&collapsed.logo==='none',JSON.stringify({width,collapsed}));
      await browser.movePoint(30,20);await sleep(25);
      const intermediate=await browser.evaluate("(()=>({width:document.querySelector('.sidebar').getBoundingClientRect().width,"+
        "text:getComputedStyle(document.querySelector('#pageTextScaleControlV54')).display,"+
        "logo:getComputedStyle(document.querySelector('.logo-full')).display,navLabel:getComputedStyle(document.querySelector('.nav-label')).display}))()");
      if(intermediate.width<145){
        assert.equal(intermediate.text,'none',JSON.stringify({width,intermediate}));
        assert.equal(intermediate.logo,'none',JSON.stringify({width,intermediate}));
        assert.equal(intermediate.navLabel,'none',JSON.stringify({width,intermediate}));
      }
      await sleep(260);
      const expanded=await browser.evaluate("(()=>({width:document.querySelector('.sidebar').getBoundingClientRect().width,"+
        "text:getComputedStyle(document.querySelector('#pageTextScaleControlV54')).display}))()");
      assert(expanded.width>=165&&expanded.text!=='none',JSON.stringify({width,expanded}));
      await browser.evaluate("window.__qaActivate('posts')");
      const inlinePosts=await browser.evaluate("(()=>{const title=document.querySelector('#pageTitle').getBoundingClientRect(),"+
        "bar=document.querySelector('#posts .posts-head').getBoundingClientRect();return {titleY:(title.top+title.bottom)/2,barY:(bar.top+bar.bottom)/2}})()");
      if(width>=1101)assert(Math.abs(inlinePosts.titleY-inlinePosts.barY)<24,JSON.stringify({width,inlinePosts}));
      const click=await browser.evaluate("(()=>{const b=document.querySelector('#newEventBtn'),r=b.getBoundingClientRect();"+
        "const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);"+
        "return {style:getComputedStyle(document.querySelector('.topbar')).pointerEvents,clickable:hit===b||b.contains(hit)}})()");
      assert(click.style!=='none'&&click.clickable,JSON.stringify({width,click}));
      await browser.evaluate("window.__qaActivate('careerTimeline')");
      const timeline=await browser.evaluate("(()=>{const bar=document.querySelector('#careerTimeline .cv-bar');"+
        "bar.classList.add('cv-pinned');const css=getComputedStyle(bar),head=getComputedStyle(document.querySelector('.topbar'));"+
        "const result={border:css.borderTopWidth,shadow:css.boxShadow,headerClicks:head.pointerEvents};bar.classList.remove('cv-pinned');return result})()");
      assert.equal(timeline.border,'0px',JSON.stringify({width,timeline}));
      assert.equal(timeline.shadow,'none',JSON.stringify({width,timeline}));
      assert.notEqual(timeline.headerClicks,'none',JSON.stringify({width,timeline}));
      const inlineTimeline=await browser.evaluate("(()=>{const title=document.querySelector('#pageTitle').getBoundingClientRect(),"+
        "bar=document.querySelector('#careerTimeline .cv-bar').getBoundingClientRect(),panel=document.querySelector('#careerTimeline .cv-panel').getBoundingClientRect(),section=document.querySelector('#careerTimeline').getBoundingClientRect(),main=document.querySelector('.main').getBoundingClientRect();return {titleY:(title.top+title.bottom)/2,barY:(bar.top+bar.bottom)/2,panelTop:panel.top,sectionTop:section.top,mainTop:main.top,barTop:bar.top,topbarBottom:document.querySelector('.topbar').getBoundingClientRect().bottom,other:[...document.querySelector('.main').children].map(e=>({id:e.id||e.className,display:getComputedStyle(e).display,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom}))}})()");
      if(width>=1101)assert(Math.abs(inlineTimeline.titleY-inlineTimeline.barY)<30,JSON.stringify({width,inlineTimeline}));
      if(width>=1101){
        const timelineHit=await browser.evaluate("(()=>{const control=document.querySelector('#careerTimeline .cv-search'),rect=control.getBoundingClientRect(),hit=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);return {rect:{top:rect.top,left:rect.left,width:rect.width,height:rect.height},clickable:hit===control||control.contains(hit),hitTag:hit?.tagName,hitClass:hit?.className}})()");
        assert(timelineHit.clickable,JSON.stringify({width,timelineHit}));
      }
    }
    console.log('MWS_UI_AUDIT_V2_OK',width,height,JSON.stringify(dashboardResult));
  }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
