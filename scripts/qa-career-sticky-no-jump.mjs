import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const base='https://mawang-scheduler.majoku.workers.dev/';
const capture=process.env.MWS_TIMELINE_CAPTURE==='1';
const output='timeline-sticky-qa';
if(capture)mkdirSync(output,{recursive:true});
const read=name=>readFileSync(new URL('../assets/'+name,import.meta.url));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
const measure=()=> {
  const panel=document.querySelector('.cv-panel');
  const host=panel.querySelector('.cv-bar-host');
  const bar=panel.querySelector('.cv-bar');
  const heading=panel.querySelector('.cv-year-heading');
  const scroller=(()=>{
    for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){
      if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.clientHeight>0)return el;
    }
    return document.scrollingElement;
  })();
  const br=bar.getBoundingClientRect(),hr=host.getBoundingClientRect(),yr=heading.getBoundingClientRect();
  return {
    scroll:scroller.scrollTop,maxScroll:scroller.scrollHeight-scroller.clientHeight,
    scrollHeight:scroller.scrollHeight,root:scroller===document.scrollingElement?'document':scroller.className,
    hostTop:hr.top,hostLeft:hr.left,hostWidth:hr.width,hostHeight:hr.height,
    barTop:br.top,barLeft:br.left,barWidth:br.width,barHeight:br.height,
    yearTop:yr.top,yearDocY:yr.top+scroller.scrollTop,
    sticky:getComputedStyle(host).position,barPosition:getComputedStyle(bar).position,
    dynamicWidth:bar.style.width,hostInlineHeight:host.style.height,
    forcedClass:bar.classList.contains('cv-pinned'),
    active:document.querySelector('#careerTimeline')?.classList.contains('active'),
    total:document.querySelectorAll('.cv-entry').length,
    overflow:document.documentElement.scrollWidth-innerWidth
  };
};
let errors=[];
try{
 for(const [width,height,mobile] of [[1366,768,false],[1920,1080,false],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  await context.route('**/assets/career-visualizer.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:read('career-visualizer.js')}));
  await context.route('**/assets/career-timeline.css*',route=>route.fulfill({status:200,contentType:'text/css',body:read('career-timeline.css')}));
  // The later workspace CSS used to force the bar position:absolute!important.
  // Testing only career-timeline.css would falsely report a working sticky bar.
  await context.route('**/assets/workspace-density-v1.css*',route=>route.fulfill({status:200,contentType:'text/css',body:read('workspace-density-v1.css')}));
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading'),{},{timeout:35000});
  // Public onboarding opens asynchronously after hydration, so it can
  // appear after a too-early dismiss attempt and intercept the navigation.
  await delay(900);
  await page.evaluate(()=>{
    const notice=document.querySelector('#mwsAnnouncementDialog');
    if(notice?.open)notice.querySelector('[data-notice-close]')?.click();
  });
  if(mobile){
    await page.waitForFunction(()=>document.body.dataset.deviceMode==='mobile',{},{timeout:12000});
    const menu=page.locator('[data-mobile-tab=menu]');
    await menu.click({timeout:12000});
  }
  await page.locator('[data-tab=careerTimeline]').click({timeout:10000}).catch(async()=>{
    await page.evaluate(()=>document.querySelector('#mwsAnnouncementDialog[open]')?.close());
    await page.locator('[data-tab=careerTimeline]').click({timeout:15000});
  });
  await page.locator('.cv-panel').waitFor({state:'visible',timeout:20000});
  await delay(350);
  const start=await page.evaluate(measure);
  assert(start.active&&start.total===106,'Actual public timeline not rendered: '+JSON.stringify({width,start}));
  assert.equal(start.sticky,'sticky',JSON.stringify(start));
  assert.equal(start.barPosition,'relative',JSON.stringify(start));
  assert(start.hostHeight>25&&start.barHeight>25&&start.overflow<2,JSON.stringify(start));
  if(capture)await page.screenshot({path:path.join(output,'before-'+width+'.png')});
  const threshold=Math.max(20,Math.ceil(start.hostTop));
  const positions=[0,Math.max(0,threshold-15),Math.max(0,threshold-4),
    threshold-1,threshold,threshold+1,threshold+4,threshold+35,
    threshold+90,threshold+35,threshold+1,Math.max(0,threshold-2),0];
  let previous=null;
  const samples=[];
  for(const top of positions){
    await page.evaluate(t=>{
      const panel=document.querySelector('.cv-panel');
      let root=document.scrollingElement;
      for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){
        if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.clientHeight>0){root=el;break}
      }
      root.scrollTo({top:t,behavior:'instant'});
    },top);
    await delay(95);
    const sample=await page.evaluate(measure);
    samples.push(sample);
    assert(sample.scroll>=0&&sample.sticky==='sticky'&&sample.barPosition==='relative'&&!sample.forcedClass
      &&sample.hostInlineHeight===''&&sample.dynamicWidth===''&&sample.overflow<2,
      'Layout switching has returned: '+JSON.stringify({width,sample}));
    if(previous){
      const delta=Math.abs(sample.scroll-previous.scroll);
      const barMovement=Math.abs(sample.barTop-previous.barTop);
      assert(barMovement<=delta+2,'Sticky rail jumped more than scroll input: '+JSON.stringify({width,previous,sample}));
      assert(Math.abs(sample.yearDocY-start.yearDocY)<=2.5,'Timeline content jolted: '+JSON.stringify({width,start,sample}));
      assert(Math.abs(sample.barWidth-start.barWidth)<=1.2&&Math.abs(sample.hostHeight-start.hostHeight)<=1.2,
        'Timeline year header resized on scroll: '+JSON.stringify({width,start,sample}));
      assert(Math.abs(sample.barLeft-start.barLeft)<=1.2&&Math.abs(sample.scrollHeight-start.scrollHeight)<=3,
        'Timeline container changed size during scroll: '+JSON.stringify({width,start,sample}));
    }
    previous=sample;
  }
  if(capture)await page.screenshot({path:path.join(output,'after-'+width+'.png')});
  // Test actual wheel input in both directions, not only programmatic scroll.
  await page.mouse.move(Math.min(width-30,width*.67),Math.min(height-80,height*.66));
  for(const distance of [105,105,105,-105,-105,-105]){
    await page.mouse.wheel(0,distance);
    await delay(90);
    const sample=await page.evaluate(measure);
    assert(sample.sticky==='sticky'&&sample.barPosition==='relative'&&!sample.forcedClass
      &&Math.abs(sample.barWidth-start.barWidth)<=1.2&&Math.abs(sample.hostHeight-start.hostHeight)<=1.2,
      'Wheel scroll caused year rail to change geometry: '+JSON.stringify({width,sample}));
  }
  // Year navigation must still target the selected year without covering it.
  await page.locator('.cv-map-year').filter({hasText:'2024'}).click();
  await page.waitForFunction(()=>{
    const e=document.querySelector('.cv-year[data-year="2024"] .cv-year-heading');
    const bar=document.querySelector('.cv-bar');
    return !!e&&e.getBoundingClientRect().top>=bar.getBoundingClientRect().bottom+6
      &&e.getBoundingClientRect().top<innerHeight*.58;
  },{},{timeout:6500});
  const jumped=await page.evaluate(measure);
  assert(jumped.sticky==='sticky'&&jumped.barPosition==='relative',JSON.stringify(jumped));
  const q=page.locator('.cv-search');
  await q.fill('굿즈');
  await delay(220);
  assert((await page.locator('.cv-result').count())>=2,'Timeline search was broken');
  await q.fill('');
  await delay(250);
  assert.equal(await page.locator('.cv-entry').count(),106);
  console.log('TIMELINE_STICKY_NO_JUMP_OK',width,height,JSON.stringify({
    root:start.root,barHeight:start.barHeight,barWidth:start.barWidth,
    samples:samples.length,scrollEnd:jumped.scroll,firstHeadingY:start.yearDocY,errors:errors.length
  }));
  await context.close();
 }
 assert.deepEqual(errors.filter(e=>e.includes('career-visualizer')),[],'Timeline runtime errors');
}finally{await browser.close();}
