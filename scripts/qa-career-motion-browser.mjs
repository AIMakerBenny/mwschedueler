import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const base='https://mawang-scheduler.majoku.workers.dev/';
const output=resolve(process.env.CAREER_QA_OUTPUT||'career-qa');
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({...(process.env.CAREER_CHROME?{executablePath:process.env.CAREER_CHROME}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
const candidate=process.env.CAREER_LIVE!=='1';
const mode=process.env.CAREER_QA_MODE||'all';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const open=async(width,height,video=false,reducedMotion='no-preference')=>{
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion,...(video?{recordVideo:{dir:output,size:{width,height}}}:{})});
  if(width>700){
    await context.addInitScript(({collapsed})=>{
      localStorage.setItem('mws-sidebar-nav-groups-v1',JSON.stringify({tools:!collapsed,games:true}));
      window.__navFirstPaintSamples=[];
      const snapshot=()=>{if(!window.__mwsSidebarGroupsInitial)return;const list=[...document.querySelectorAll('.nav-scroll > [data-tab],.nav-scroll > [data-mws-nav-group]')].map(e=>[e.dataset.tab||e.dataset.mwsNavGroup,e.getAttribute('aria-expanded'),e.classList.contains('mws-nav-group-hidden')]);const value=JSON.stringify(list);const seen=window.__navFirstPaintSamples;if(seen.at(-1)!==value)seen.push(value)};
      new MutationObserver(snapshot).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-expanded','class']});
    },{collapsed:reducedMotion==='reduce'});
  }
  if(candidate){
    // Use the real public production shell/data with only candidate frontend assets overridden.
    const sectionPattern=/<section class="section" id="careerTimeline"[\s\S]*?<\/section>/;
    const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
    const replacement=source.match(sectionPattern)[0];
    const asidePattern=/<aside class="sidebar">[\s\S]*?<\/aside>/;
    const firstPaint=source.match(/<style id="mws-nav-first-paint">[\s\S]*?<\/style>/)[0];
    await context.route(base,async route=>{
      const response=await route.fetch();
      const original=await response.text();
      assert(sectionPattern.test(original),'Timeline section absent from production');
      await route.fulfill({response,body:original.replace(sectionPattern,replacement).replace(asidePattern,source.match(asidePattern)[0]).replace('</head>',firstPaint+'</head>')});
    });
    for(const file of ['career-visualizer.js','career-timeline.css','tools.js','content-planner-host.js','perf-runtime.js','post-login-runtime-v130.js']){
      await context.route('**/assets/'+file+'*',async route=>{if(file==='tools.js'||file==='content-planner-host.js')await pause(1800);await route.fulfill({
        status:200,contentType:file.endsWith('.js')?'application/javascript':'text/css',
        body:readFileSync(new URL('../assets/'+file,import.meta.url))
      })});
    }
  }
  const started=Date.now(), page=await context.newPage();
  const errors=[];page.on('pageerror',err=>{if(err.stack?.includes('career-visualizer'))errors.push(err.message)});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading'),{},{timeout:45000});
  if(width>700){
    await page.waitForFunction(()=>window.mwsOpenDrawingBoardV1&&window.mwsCleanToolsActivate,{},{timeout:30000});
    const samples=await page.evaluate(()=>window.__navFirstPaintSamples.map(JSON.parse));
    assert(samples.length>0,'No sidebar first paint sample');
    const expected=['memos','careerTimeline','achievements','games','gameLadder','gameF1Racing','gameMultiDraw','gameMajoku','tools','contentPlanner','toolTier','toolMatrix','toolRelations','legacy'];
    for(const sample of samples){const ids=sample.map(x=>x[0]);assert.deepEqual(ids.filter(i=>expected.includes(i)),expected);assert.equal(sample.find(x=>x[0]==='tools')[1],String(reducedMotion!=='reduce'));assert.equal(sample.find(x=>x[0]==='toolTier')[2],reducedMotion==='reduce');}
    console.log('PASS sidebar first paint, delayed runtimes',samples.length);
  }
  const close=page.locator('#mwsAnnouncementDialog button').filter({hasText:'닫기'});
  if(await close.first().isVisible().catch(()=>false))await close.first().click();
  const nav=page.locator('[data-tab=careerTimeline]');
  if(width<=700){
    await page.waitForFunction(()=>document.body.dataset.deviceMode==='mobile'&&document.body.dataset.resolution==='mobile'&&typeof window.toggleMobileDrawer==='function',{},{timeout:15000});
    const menu=page.locator('[data-mobile-tab=menu]');
    await menu.waitFor({state:'visible',timeout:15000});
    await menu.click();
    await page.waitForFunction(()=>document.body.classList.contains('mobile-drawer-open'),{},{timeout:10000});
  }
  // A public page may present its announcement after initial hydration.
  await nav.click({timeout:30000}).catch(async()=>{
    const dismiss=page.getByRole('button',{name:'닫기',exact:true});
    if(await dismiss.first().isVisible())await dismiss.first().click();
    await nav.click({timeout:30000});
  });
  await page.locator('.cv-panel').waitFor({state:'visible'});
  await page.locator('.cv-axis').waitFor({state:'visible'});
  await pause(350);
  assert.equal(await page.locator('.career-tree li').count(),48);
  assert.equal(await page.locator('.cv-axis .cv-entry').count(),44);
  assert.equal(await page.locator('.cv-legacy .cv-entry').count(),4);
  assert(!((await page.locator('.cv-legacy').innerText()).includes('미확인')));
  assert.equal(await page.locator('.cv-map-dots i').count(),44);
  assert.equal(await page.locator('.cv-axis .cv-year').count(),5);
  assert.equal(await page.locator('.cv-play,.cv-years,.cv-hero').count(),0);
  return {context,page,errors,started};
};
const position=p=>p.evaluate(()=>{
  const panel=document.querySelector('.cv-panel');
  for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight+2)return el.scrollTop;}
  return document.scrollingElement.scrollTop;
});
const scrollTo=async(p,top)=>{await p.evaluate(top=>{
  const panel=document.querySelector('.cv-panel');let root=document.scrollingElement;
  for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight+2){root=el;break;}}
  root.scrollTo({top,behavior:'instant'});
},top);await pause(300);};
const inspect=async entry=>entry.evaluate(e=>{
  const r=e.getBoundingClientRect(), card=e.querySelector('.cv-card'),c=card.getBoundingClientRect();
  const direction=Number(getComputedStyle(e).getPropertyValue('--cv-direction'));
  return {p:Number(e.style.getPropertyValue('--cv-p')),shift:direction<0?c.right-r.right:c.left-r.left,scale:c.width/r.width,opacity:Number(getComputedStyle(card).opacity),branch:getComputedStyle(e,'::before').transform,top:r.top,bottom:r.bottom,left:c.left,right:c.right,view:innerHeight,width:innerWidth};
});
const approach=async(p,entry)=>{
  const start=await position(p),r=await inspect(entry);
  const band=await p.evaluate(()=>{
    const panel=document.querySelector('.cv-panel');let root=document.scrollingElement;
    for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight+2){root=el;break;}}
    const bottom=root===document.scrollingElement?innerHeight:Math.min(innerHeight,root.getBoundingClientRect().bottom);
    const top=Math.min(document.querySelector('.cv-bar').getBoundingClientRect().bottom,bottom-80);
    return {top,bottom};
  });
  await scrollTo(p,start+(r.top+r.bottom)/2-(band.top+(band.bottom-band.top)*.84));
};
const checkFit=async p=>{
  const fit=await p.locator('.cv-panel').evaluate(e=>e.getBoundingClientRect().right<=innerWidth+1);
  assert(fit,'Panel overflow');
  assert(await p.locator('.cv-bar').evaluate(e=>e.getBoundingClientRect().top>=-2&&e.getBoundingClientRect().bottom<innerHeight),'Overview not sticky');
  const clipped=await p.locator('.cv-card').evaluateAll(els=>els.filter(e=>{
    const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&(r.left<-1||r.right>innerWidth+1||e.scrollWidth>e.clientWidth+2);
  }).map(e=>e.textContent));
  assert.deepEqual(clipped,[],'Card clipped');
};
const chooseYear=(p,y)=>p.locator('.cv-map-year').filter({hasText:y}).click();
const search=(p,q)=>p.locator('.cv-search').fill(q);
try{
  for(const [width,height] of [[1366,768],[1920,1080],[390,844]].filter(([w])=>mode==='all'||(mode==='mobile'&&w===390)||(mode==='desktop'&&w>700))){
    const {context,page,errors}=await open(width,height);
    await checkFit(page);
    await page.screenshot({path:output+'/overview-'+width+'.png'});
    assert.equal(await page.locator('.cv-year[data-year="2022"] .cv-month[data-month="4"] .cv-entry').count(),3);
    const entry=page.locator('.cv-year[data-year="2024"] .cv-month[data-month="3"] .cv-entry').first();
    await chooseYear(page,'2024');await pause(200);
    await approach(page,entry);
    const target=await position(page);
    const partial=await inspect(entry);
    await page.screenshot({path:output+'/2024-approach-'+width+'.png'});
    await page.mouse.move(width*.8,height*.62);
    await page.mouse.wheel(0,120);await pause(320);
    const incoming=await inspect(entry);
    const wheelDistance=(await position(page))-target;
    const movement=Math.abs(partial.shift)-Math.abs(incoming.shift);
    assert(wheelDistance>=100&&wheelDistance<=145,JSON.stringify({wheelDistance}));
    assert(movement>(width>700?60:22),JSON.stringify({partial,incoming,movement}));
    assert(incoming.scale>partial.scale+.045,JSON.stringify({partial,incoming}));
    assert(incoming.opacity>partial.opacity+.18,JSON.stringify({partial,incoming}));
    await page.screenshot({path:output+'/2024-wheel-'+width+'.png'});
    await page.mouse.wheel(0,-120);await pause(320);
    const reversed=await inspect(entry);
    assert(Math.abs(reversed.p-partial.p)<.02,JSON.stringify({partial,reversed}));
    assert(Math.abs(reversed.shift-partial.shift)<3,JSON.stringify({partial,reversed}));
    await scrollTo(page,target+height*.48);
    const attached=await inspect(entry);
    assert(attached.p>.99&&Math.abs(attached.shift)<2&&attached.scale>.99,JSON.stringify(attached));
    assert.equal(attached.branch,'matrix(1, 0, 0, 1, 0, 0)');
    console.log('PASS wheel arrival and reverse',width,JSON.stringify({wheelDistance,movement,partial,incoming,attached,reversed}));
    await chooseYear(page,'2024');await pause(180);
    await checkFit(page);
    await page.screenshot({path:output+'/2024-year-'+width+'.png'});
    await scrollTo(page,(await position(page))+(await inspect(entry)).top-245);
    await checkFit(page);
    assert.equal(await page.locator('.cv-year[data-year="2024"] .cv-month[data-month="3"] .cv-entry').count(),2);
    await page.screenshot({path:output+'/2024-march-'+width+'.png'});
    const saved=await position(page);
    await search(page,'릴동파');
    assert.equal(await page.locator('.cv-result-group').count(),2);
    assert.equal(await page.locator('.cv-result').count(),3);
    assert.equal(await page.locator('.cv-entry[data-match=true]').count(),3);
    await page.screenshot({path:output+'/search-'+width+'.png'});
    await page.locator('.cv-result').first().click();await pause(200);
    assert.match(await page.locator('.cv-entry[data-selected=true]').innerText(),/죠뗌므/);
    assert(await page.locator('.cv-entry[data-selected=true]').isVisible());
    await search(page,'');await pause(150);
    const restored=await position(page);
    assert(Math.abs(restored-saved)<3,'Search did not restore scroll: '+JSON.stringify({saved,restored}));
    for(const [q,n] of [['코치',3],['VR 우승',4],['WBD',1],['왁타버스 야구',1],['F1 챔스',1],['브축대',1],['굳가대표',1],['데이토나',1]]){
      await search(page,q);assert.equal(await page.locator('.cv-result').count(),n,q);
      if(q==='VR 우승')assert(!((await page.locator('.cv-results').innerText()).includes('준우승')));
    }
    await search(page,'');
    await page.locator('.cv-legacy-link').click();await pause(150);
    assert.equal(await page.locator('.cv-legacy .cv-entry').count(),4);
    const legacyEntry=page.locator('.cv-legacy .cv-entry').first();
    const legacyBase=await position(page), legacySettled=await inspect(legacyEntry);
    const lastDated=await inspect(page.locator('.cv-axis .cv-entry').last());
    assert(legacySettled.p>.99&&lastDated.p>.99,JSON.stringify({legacySettled,lastDated}));
    await scrollTo(page,legacyBase-height*.65);
    const legacyDetached=await inspect(legacyEntry);
    await scrollTo(page,legacyBase);
    const legacyReattached=await inspect(legacyEntry);
    assert(legacySettled.p>legacyDetached.p+.2,JSON.stringify({legacySettled,legacyDetached}));
    assert(Math.abs(legacySettled.p-legacyReattached.p)<.02);
    assert(Math.abs(legacyDetached.shift)>Math.abs(legacyReattached.shift));
    await page.screenshot({path:output+'/legacy-'+width+'.png'});
    assert.deepEqual(errors,[]);
    console.log('PASS',width,height);
    await context.close();
  }
  if(mode==='all'||mode==='record'){
    const {context,page,errors,started}=await open(1366,768,true);
    const video=page.video(),startSeconds=Math.max(0,(Date.now()-started)/1000-1);
    await chooseYear(page,'2024');await pause(500);
    const entry=page.locator('.cv-year[data-year="2024"] .cv-month[data-month="3"] .cv-entry').first();
    await approach(page,entry);await pause(550);
    const x=800,y=480;
    await page.mouse.move(x,y);
    for(let i=0;i<7;i++){await page.mouse.wheel(0,62);await pause(370);}
    await pause(950);
    for(let i=0;i<7;i++){await page.mouse.wheel(0,-62);await pause(370);}
    await pause(700);
    for(let i=0;i<11;i++){await page.mouse.wheel(0,72);await pause(230);}
    await pause(800);
    await search(page,'릴동파');await pause(1400);
    await page.locator('.cv-result').first().click();await pause(1200);
    await search(page,'');await pause(1100);
    await page.screenshot({path:output+'/recording-end.png'});
    assert.deepEqual(errors,[]);
    await context.close();
    await video.saveAs(output+'/career-timeline-raw.webm');
    execFileSync('ffmpeg',['-y','-ss',String(startSeconds),'-i',output+'/career-timeline-raw.webm','-t','25','-c:v','libvpx-vp9','-crf','30','-b:v','0',output+'/career-timeline-recording.webm'],{stdio:'inherit'});
    console.log('PASS recording interaction');
    const rm=await open(1366,768,false,'reduce');
    await chooseYear(rm.page,'2024');
    const reducedEntry=rm.page.locator('.cv-year[data-year="2024"] .cv-month[data-month="3"] .cv-entry').first();
    await approach(rm.page,reducedEntry);
    const before=await inspect(reducedEntry);
    await rm.page.mouse.move(850,480);await rm.page.mouse.wheel(0,120);await pause(300);
    const after=await inspect(reducedEntry);
    await rm.page.mouse.wheel(0,-120);await pause(300);
    const reverse=await inspect(reducedEntry);
    assert(Math.abs(after.shift-before.shift)>35,JSON.stringify({before,after,reverse}));
    assert.equal(before.opacity,1);assert.equal(after.opacity,1);assert(Math.abs(before.scale-1)<.01);
    assert(Math.abs(before.shift-reverse.shift)<2);
    console.log('PASS reduced motion wheel',JSON.stringify({before,after,reverse}));
    await rm.context.close();
  }
}finally{await browser.close();}
