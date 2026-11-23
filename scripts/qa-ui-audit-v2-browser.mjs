import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
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
const header=slice('<div class="topbar">','<section id="dashboard"');
const dashboard=slice('<section id="dashboard"','<section id="calendar"')
  .replace('class="section"','class="section active"');
const inline=[...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
const css=[
  'app-core.css','mawang-premium-v1621.css','ui-frame-presets.css',
  'sidebar-rail-scrollbar-v1.css','sidebar-stable-v1.css','career-timeline.css',
  'content-applications-v1.css','workspace-clean-v1.css','workspace-density-v1.css','sidebar-compact-v1.css'
].map(p=>read('assets/'+p)).join('\n')+'\n'+inline;
const pageScale=slice("const PAGE_SCALE_KEY='mws_page_text_scales_v54';",
  '/* ---------- Robust contact tag panel ---------- */');
const applicationSection=slice('<section id="contentApplications"','<section id="posts"');
const moreSections=[
  '<section id="contacts" class="section"><div class="contact-section-tabs"><button>연락처</button></div></section>',
  applicationSection,
  '<section id="posts" class="section"><div class="posts-head"><button type="button" id="qaPostsButton">게시글 도구</button></div></section>',
  '<section id="careerTimeline" class="section"><div class="cv-bar-host"><div class="cv-bar cv-pinned"><div class="cv-toolbar"><button type="button">연도 선택</button></div></div></div></section>'
].join('');
const bootstrap='let data={textScale:100};'+pageScale+
  ';window.__qaActivate=function(id){document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active",s.id===id));applyPageTextScalesV54()};window.__qaRoutes=[];window.setTab=id=>{window.__qaRoutes.push(id);window.__qaActivate(id)};'+
  'const qaProfile=document.createElement("div");qaProfile.className="dashboard-my-profile-v3";qaProfile.textContent="마왕 프로필";document.querySelector("#dashboardProfileSlot").append(qaProfile);';
const fixture='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<style>'+css+'</style><body class="mws-premium" data-theme="neon" data-resolution="fhd" data-mws-mode="admin">'+
  '<div class="app">'+aside+'<main class="main">'+header+dashboard+moreSections+'</main></div>'+
  '<script>'+bootstrap+'</script></body>';
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
      const click=await browser.evaluate("(()=>{const b=document.querySelector('#newEventBtn'),r=b.getBoundingClientRect();"+
        "const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);"+
        "return {style:getComputedStyle(document.querySelector('.topbar')).pointerEvents,clickable:hit===b||b.contains(hit)}})()");
      assert(click.style!=='none'&&click.clickable,JSON.stringify({width,click}));
      await browser.evaluate("window.__qaActivate('careerTimeline')");
      const timeline=await browser.evaluate("(()=>{const bar=document.querySelector('.cv-bar.cv-pinned');"+
        "const css=getComputedStyle(bar),head=getComputedStyle(document.querySelector('.topbar'));"+
        "return {border:css.borderTopWidth,shadow:css.boxShadow,headerClicks:head.pointerEvents}})()");
      assert.equal(timeline.border,'0px',JSON.stringify({width,timeline}));
      assert.equal(timeline.shadow,'none',JSON.stringify({width,timeline}));
      assert.notEqual(timeline.headerClicks,'none',JSON.stringify({width,timeline}));
    }
    console.log('MWS_UI_AUDIT_V2_OK',width,height,JSON.stringify(dashboardResult));
  }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
