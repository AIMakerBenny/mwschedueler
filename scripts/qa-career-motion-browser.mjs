import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const base=process.env.CAREER_QA_BASE||'https://mawang-scheduler.majoku.workers.dev/';
const output=resolve(process.env.CAREER_QA_OUTPUT||'career-qa');
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({...(process.env.CAREER_CHROME?{executablePath:process.env.CAREER_CHROME}:{channel:'chrome'}),headless:true,args:['--no-sandbox'],...(process.env.CAREER_QA_PROXY?{proxy:{server:process.env.CAREER_QA_PROXY}}:{})});
const candidate=process.env.CAREER_LIVE!=='1';
const mode=process.env.CAREER_QA_MODE||'all';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const open=async(width,height,video=false,reducedMotion='no-preference')=>{
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion,ignoreHTTPSErrors:true,...(video?{recordVideo:{dir:output,size:{width,height}}}:{})});
  if(width>700){
    await context.addInitScript(({collapsed})=>{
      localStorage.setItem('mws-sidebar-nav-groups-v2',JSON.stringify({tools:!collapsed,games:true}));
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
    const motionPreference=source.match(/<script id="mws-motion-preference">[\s\S]*?<\/script>/)[0];
    const motionSettings=source.match(/<div class="card" id="mwsMotionSettings">[\s\S]*?<\/div>/)[0];
    await context.route(base,async route=>{
      const response=await route.fetch();
      const original=await response.text();
      assert(sectionPattern.test(original),'Timeline section absent from production');
      let body=original.replace(sectionPattern,replacement).replace(asidePattern,source.match(asidePattern)[0]);
      if(!body.includes('id="mws-motion-preference"'))body=body.replace('</head>',motionPreference+'</head>');
      if(!body.includes('id="mws-nav-first-paint"'))body=body.replace('</head>',firstPaint+'</head>');
      if(!body.includes('id="mwsMotionSettings"'))body=body.replace('<section id="settings" class="section">','<section id="settings" class="section">'+motionSettings);
      await route.fulfill({response,body});
    });
    for(const file of ['career-visualizer.js','career-timeline.css','calendar-details-v1.js','calendar-details-v1.css','modal-motion-v1.css','tools.js','content-planner-host.js','perf-runtime.js','post-login-runtime-v130.js','online-v5-loader.js']){
      await context.route('**/assets/'+file+'*',async route=>{if(file==='tools.js'||file==='content-planner-host.js')await pause(1800);await route.fulfill({
        status:200,contentType:file.endsWith('.js')?'application/javascript':'text/css',
        body:readFileSync(new URL('../assets/'+file,import.meta.url))
      })});
    }
    await context.route('**/assets/career-media/*.webp',route=>route.fulfill({status:200,contentType:'image/webp',body:readFileSync(new URL('../assets/career-media/'+new URL(route.request().url()).pathname.split('/').at(-1),import.meta.url))}));
  }
  const started=Date.now(), page=await context.newPage();
  const errors=[];page.on('pageerror',err=>{if(err.stack?.includes('career-visualizer'))errors.push(err.message)});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading'),{},{timeout:45000});
  if(width>700){
    await page.waitForFunction(()=>window.mwsOpenDrawingBoardV1&&window.mwsCleanToolsActivate,{},{timeout:30000});
    const samples=await page.evaluate(()=>window.__navFirstPaintSamples.map(JSON.parse));
    assert(samples.length>0,'No sidebar first paint sample');
    const expected=['careerTimeline','mawangArchive','achievements','games','gameLadder','gameF1Racing','gameMultiDraw','gameMajoku','tools','contentPlanner','toolTier','toolMatrix','toolRelations','memos','legacy'];
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
  assert.equal(await page.locator('.career-tree li').count(),106);
  assert.equal(await page.locator('.cv-axis .cv-entry').count(),102);
  assert.equal(await page.locator('.cv-legacy .cv-entry').count(),4);
  assert.equal(await page.locator('.cv-pair[data-single]').count(),0);
  assert.equal(await page.locator('.cv-headline').first().evaluate(e=>getComputedStyle(e).wordBreak),'keep-all');
  assert(await page.locator('.cv-axis .cv-entry').evaluateAll(es=>es.every((e,i)=>e.classList.contains(i%2===0?'cv-left':'cv-right')&&e.parentElement.querySelectorAll('.cv-entry').length===1)));
  assert.match(await page.locator('.cv-year[data-year="2022"] .cv-month[data-month="4"] .cv-entry').filter({hasText:'이세계아이돌 햄스터 아바타'}).innerText(),/4월 23일/);
  assert.match(await page.locator('.cv-year[data-year="2022"] .cv-month[data-month="4"] .cv-entry').filter({hasText:'패러블 엔터테인먼트'}).innerText(),/MCN 계약/);
  assert.match(await page.locator('.cv-year[data-year="2023"] .cv-month[data-month="7"] .cv-entry').filter({hasText:'마왕 첫 공식 굿즈'}).innerText(),/첫 굿즈 출시 · 개백수티/);
  assert.match(await page.locator('.cv-year[data-year="2023"] .cv-month[data-month="5"] .cv-entry').filter({hasText:'AI 보이스 2.0 도입'}).innerText(),/음성인식 자막 → STS 1\.0 → AI 보이스 2\.0/);
  assert.match(await page.locator('.cv-year[data-year="2026"] .cv-month[data-month="3"] .cv-entry').filter({hasText:'마왕 공식 굿즈 출시'}).innerText(),/개백수티 Ver\.2 출시/);
  assert.match(await page.locator('.cv-year[data-year="2024"] .cv-month[data-month="1"] .cv-entry').filter({hasText:'트위치에서 아프리카TV로 이적'}).innerText(),/방송 플랫폼 이전/);
  assert.match(await page.locator('.cv-year[data-year="2024"] .cv-month[data-month="2"] .cv-entry').filter({hasText:'아프리카TV 베스트 BJ'}).innerText(),/2월 29일 선정/);
  assert.equal(await page.locator('.cv-entry').filter({hasText:'MECCHA CHAMELEON'}).count(),0);
  assert.equal(await page.locator('.cv-entry').filter({hasText:/좀보이드 유치원|천코이드|50택사스 야구 교육/}).count(),0);
  assert.equal(await page.locator('.cv-has-outcomes').count(),46);
  assert.match(await page.locator('.cv-year[data-year="2021"] .cv-month[data-month="1"] .cv-outcomes').innerText(),/2,287만 조회 이상/);
  assert.equal(await page.locator('.cv-year[data-year="2021"] .cv-month[data-month="11"] .cv-entry').count(),2);
  assert.match(await page.locator('.cv-year[data-year="2021"] .cv-month[data-month="12"] .cv-outcomes').innerText(),/1,273만/);
  assert.match(await page.locator('.cv-year[data-year="2022"] .cv-month[data-month="1"] .cv-outcomes').innerText(),/246만/);
  assert.match(await page.locator('.cv-pair').filter({has:page.locator('.cv-headline').filter({hasText:/^VRChat 360도 생방송$/})}).locator('.cv-outcomes').innerText(),/360도 생방송 첫 구현/);
  assert.equal(await page.locator('.cv-legacy .cv-outcomes').count(),0);
  assert.equal(await page.locator('.cv-pair').filter({has:page.locator('.cv-headline').filter({hasText:/^지육대$/})}).locator('.cv-outcomes').count(),0);
  const sports=page.locator('.cv-pair').filter({has:page.locator('.cv-headline').filter({hasText:/^왁타버스 체육대회$/})});
  assert.match(await sports.locator('.cv-outcomes').innerText(),/금메달 2개[\s\S]*은메달 1개/);
  assert.match(await page.locator('.cv-year[data-year="2024"] .cv-month[data-month="4"] .cv-entry').filter({hasText:'지피티 VR 체험'}).innerText(),/4월 19일/);
  assert.match(await page.locator('.cv-year[data-year="2025"] .cv-month[data-month="5"] .cv-entry').filter({hasText:'코렛트 코순이 아바타'}).innerText(),/5월 29일/);
  assert(!((await page.locator('.cv-legacy').innerText()).includes('미확인')));
  assert.equal(await page.locator('.cv-map-dots i').count(),0);
  assert.equal(await page.locator('.cv-map-year').count(),7);
  assert.equal(await page.locator('.cv-gap').count(),0);
  const barBox=await page.locator('.cv-bar').boundingBox();
  console.log('Toolbar size',width,JSON.stringify(barBox));
  await page.screenshot({path:output+'/initial-'+width+'.png'});
  assert(barBox.height<(width>700?60:85),JSON.stringify(barBox));
  assert.equal(await page.locator('.cv-axis .cv-year').count(),7);
  assert.equal(await page.locator('.cv-play,.cv-years,.cv-hero').count(),0);
  assert.equal(await page.locator('html').getAttribute('data-mws-motion'),reducedMotion==='reduce'?'reduced':'full');
  assert.equal(await page.locator('.cv-media[data-art=gt7]').count(),1);
  assert((await page.locator('.cv-media[data-art=pubg]').count())>=5);
  assert.equal(await page.locator('.cv-media[data-art=battlecrush]').count(),1);
  assert.equal(await page.locator('.cv-media[data-art=climbing]').count(),1);
  return {context,page,errors,started};
};
const position=p=>p.evaluate(()=>{
  const panel=document.querySelector('.cv-panel');
  for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.clientHeight>0)return el.scrollTop;}
  return document.scrollingElement.scrollTop;
});
const scrollTo=async(p,top)=>{await p.evaluate(top=>{
  const panel=document.querySelector('.cv-panel');let root=document.scrollingElement;
  for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.clientHeight>0){root=el;break;}}
  root.scrollTo({top,behavior:'instant'});
},top);await pause(300);};
const inspect=async entry=>entry.evaluate(e=>{
  const r=e.getBoundingClientRect(), card=e.querySelector('.cv-card'),c=card.getBoundingClientRect();
  const direction=Number(getComputedStyle(e).getPropertyValue('--cv-direction'));
  return {p:Number(e.style.getPropertyValue('--cv-p')),shift:direction<0?c.right-r.right:c.left-r.left,scale:c.width/r.width,opacity:Number(getComputedStyle(card).opacity),branch:getComputedStyle(e,'::before').transform,top:r.top,bottom:r.bottom,left:c.left,right:c.right,view:innerHeight,width:innerWidth};
});
const approach=async(p,entry)=>{
  // Navigation and lazy images can still settle after a year jump. Converge
  // on the visible arrival band instead of relying on one stale coordinate.
  for(let attempt=0;attempt<5;attempt++){
    const r=await inspect(entry);
    const band=await p.evaluate(()=>{
      const panel=document.querySelector('.cv-panel');let root=document.scrollingElement;
      for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){
        if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.clientHeight>0){root=el;break;}
      }
      const bottom=root===document.scrollingElement?innerHeight:Math.min(innerHeight,root.getBoundingClientRect().bottom);
      const top=Math.min(document.querySelector('.cv-bar').getBoundingClientRect().bottom,bottom-80);
      return {top,bottom};
    });
    const center=(r.top+r.bottom)/2;
    const desired=band.top+(band.bottom-band.top)*.84;
    const delta=center-desired;
    if(Math.abs(delta)<8)break;
    await p.evaluate(delta=>{
      const panel=document.querySelector('.cv-panel');let root=document.scrollingElement;
      for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){
        if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.clientHeight>0){root=el;break;}
      }
      root.scrollBy({top:delta,behavior:'instant'});
    },delta);
    await pause(240);
  }
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
    assert.equal(await page.locator('.cv-year[data-year="2022"] .cv-month[data-month="4"] .cv-entry').count(),7);
    const entry=page.locator('.cv-year[data-year="2024"] .cv-month[data-month="3"] .cv-entry').first();
    await chooseYear(page,'2024');
    // Wait for the native smooth navigation to reach the destination before
    // taking card-motion samples. A fixed 200ms can catch it mid-flight.
    await page.waitForFunction(()=>{
      const heading=document.querySelector('.cv-year[data-year="2024"] .cv-year-heading');
      if(!heading)return false;
      const top=heading.getBoundingClientRect().top;
      return top>=55&&top<Math.min(280,innerHeight*.45);
    },{},{timeout:5000});
    await pause(140);
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
    assert(movement>(width>700?20:6),JSON.stringify({partial,incoming,movement}));
    assert(incoming.scale>partial.scale+.008,JSON.stringify({partial,incoming}));
    assert(partial.opacity>=.82&&incoming.opacity>partial.opacity+.025,JSON.stringify({partial,incoming}));
    assert.notEqual(partial.branch,incoming.branch);
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
    await page.waitForFunction(()=>['climbing','battlecrush'].every(key=>document.querySelector(`.cv-media[data-art=${key}] img`).naturalWidth>0));
    assert.equal(await page.locator('.cv-year[data-year="2024"] .cv-month[data-month="3"] .cv-entry').count(),5);
    await page.screenshot({path:output+'/2024-march-'+width+'.png'});
    const branchFit=await entry.evaluate(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.querySelector('.cv-outcomes').getBoundingClientRect();return innerWidth>700?(a.right<=b.left||b.right<=a.left):b.top>=a.bottom-1&&b.right<=innerWidth;});
    assert(branchFit,'Outcome branch overlaps event or viewport');
    const beforeOpen=(await entry.boundingBox()).height;
    await entry.locator('summary').click();await pause(400);
    assert((await entry.boundingBox()).height>beforeOpen+40);
    assert.match(await entry.locator('.cv-detail').innerText(),/A Difficult Game About Climbing/);
    await page.screenshot({path:output+'/2024-expanded-'+width+'.png'});
    await entry.locator('summary').click();await pause(400);
    const saved=await position(page);
    await search(page,'릴동파');
    assert.equal(await page.locator('.cv-result-group').count(),2);
    assert.equal(await page.locator('.cv-result').count(),3);
    assert.equal(await page.locator('.cv-entry[data-match=true]').count(),3);
    assert.equal(await page.locator('.cv-entry:visible').count(),3);
    assert(await page.locator('.cv-axis .cv-entry:visible').evaluateAll(es=>es.every((e,i)=>e.classList.contains(i%2===0?'cv-left':'cv-right'))));
    assert.equal(await page.locator('.cv-year:visible').count(),2);
    const downloadPromise=page.waitForEvent('download');
    await page.locator('.cv-export').click();
    const download=await downloadPromise;
    const exported=readFileSync(await download.path(),'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/);
    assert.equal(exported.length,3);assert(exported.every(line=>line.includes('릴동파')));assert(exported.every(line=>!line.includes('http')));
    await page.screenshot({path:output+'/search-'+width+'.png'});
    await page.locator('.cv-result-toggle').click();
    await page.locator('.cv-result').first().click();await pause(200);
    assert.match(await page.locator('.cv-entry[data-selected=true]').innerText(),/죠뗌므/);
    assert(await page.locator('.cv-entry[data-selected=true]').isVisible());
    await search(page,'');await pause(150);
    assert.equal(await page.locator('.cv-entry:visible').count(),106);
    assert(await page.locator('.cv-axis .cv-entry').evaluateAll(es=>es.every((e,i)=>e.classList.contains(i%2===0?'cv-left':'cv-right'))));
    const restored=await position(page);
    assert(Math.abs(restored-saved)<3,'Search did not restore scroll: '+JSON.stringify({saved,restored}));
    for(const [q,n] of [['코치',null],['VR 우승',4],['WBD',1],['왁타버스 야구',1],['50텍사스',1],['F1 챔스',1],['브축대',1],['굳가대표',1],['데이토나',1],['트위치에서 아프리카TV로 이적',1],['패러블',1],['굿즈',2],['개백수티',2],['개백수 티셔츠',2],['마왕출현',0]]){
      await search(page,q);const found=await page.locator('.cv-result').count();if(n!==null)assert.equal(found,n,q);else assert(found>=8,q);
      assert.equal(await page.locator('.cv-entry:visible').count(),found,q);
      if(q==='VR 우승')assert(!((await page.locator('.cv-results').textContent()).includes('준우승')));
    }
    await search(page,'SOOP');
    assert.match(await page.locator('.cv-results').textContent(),/트위치에서 아프리카TV로 이적/);
    assert.match(await page.locator('.cv-results').textContent(),/아프리카TV 베스트 BJ/);
    await search(page,'');
    await page.locator('.cv-legacy-link').click();await pause(250);
    assert.equal(await page.locator('.cv-legacy .cv-entry').count(),4);
    const legacyEntry=page.locator('.cv-legacy .cv-entry').first();
    const lastDated=await inspect(page.locator('.cv-axis .cv-entry').last());
    assert(lastDated.p>.99,JSON.stringify(lastDated));
    assert.equal(await page.locator('.cv-legacy .cv-pair,.cv-legacy .cv-junction').count(),0);
    assert.equal(await page.locator('.cv-legacy-grid').evaluate(e=>getComputedStyle(e,'::before').content),'none');
    assert.equal(await legacyEntry.evaluate(e=>e.firstElementChild.style.transform),'');
    await legacyEntry.locator('summary').click();await pause(350);
    assert(await legacyEntry.locator('.cv-detail').isVisible());
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
    await chooseYear(page,'2024');await pause(200);
    await scrollTo(page,(await position(page))+(await inspect(entry)).top-210);
    await entry.locator('summary').click();await pause(1500);
    await entry.locator('summary').click();await pause(350);
    await search(page,'릴동파');await pause(1400);
    await page.locator('.cv-result-toggle').click();await pause(500);
    await page.locator('.cv-result').first().click();await pause(1200);
    await search(page,'');await pause(1100);
    await page.screenshot({path:output+'/recording-end.png'});
    assert.deepEqual(errors,[]);
    await context.close();
    await video.saveAs(output+'/career-timeline-raw.webm');
    execFileSync('ffmpeg',['-y','-ss',String(startSeconds),'-i',output+'/career-timeline-raw.webm','-t','25','-c:v','libvpx-vp9','-crf','30','-b:v','0',output+'/career-timeline-recording.webm'],{stdio:'inherit'});
    console.log('PASS recording interaction');
    const rm=await open(1366,768,false,'reduce');
    await rm.page.locator('[data-tab=settings]').click();
    assert.equal(await rm.page.locator('#mwsScreenMotion').inputValue(),'system');
    await rm.page.locator('#mwsScreenMotion').selectOption('full');
    await rm.page.locator('[data-tab=careerTimeline]').click();
    await chooseYear(rm.page,'2024');await pause(250);
    const reducedEntry=rm.page.locator('.cv-year[data-year="2024"] .cv-month[data-month="3"] .cv-entry').first();
    await approach(rm.page,reducedEntry);
    const before=await inspect(reducedEntry);
    await rm.page.mouse.move(850,480);await rm.page.mouse.wheel(0,120);await pause(300);
    const after=await inspect(reducedEntry);
    await rm.page.mouse.wheel(0,-120);await pause(300);
    const reverse=await inspect(reducedEntry);
    assert(Math.abs(after.shift-before.shift)>20,JSON.stringify({before,after,reverse}));
    assert(before.opacity>=.82&&after.opacity>before.opacity+.025);assert(before.scale<.99&&after.scale>before.scale+.008);
    assert(Math.abs(before.shift-reverse.shift)<2);
    console.log('PASS full scroll motion despite OS reduced motion',JSON.stringify({before,after,reverse}));
    await rm.page.screenshot({path:output+'/os-reduced-full-motion.png'});
    await rm.page.locator('[data-tab=settings]').click();
    await rm.page.locator('#mwsScreenMotion').selectOption('reduced');
    assert.equal(await rm.page.locator('html').getAttribute('data-mws-motion'),'reduced');
    await rm.page.locator('[data-tab=careerTimeline]').click();
    await chooseYear(rm.page,'2024');await pause(250);await approach(rm.page,reducedEntry);
    const still=await inspect(reducedEntry);assert.equal(still.opacity,1);assert(Math.abs(still.scale-1)<.01);
    assert(Math.abs(still.shift)<Math.abs(before.shift)*.6);
    await rm.page.locator('[data-tab=settings]').click();
    await rm.page.locator('#mwsScreenMotion').selectOption('system');
    assert.equal(await rm.page.locator('html').getAttribute('data-mws-motion'),'reduced');
    await rm.page.locator('#mwsScreenMotion').selectOption('full');
    assert.equal(await rm.page.locator('html').getAttribute('data-mws-motion'),'full');
    await rm.page.screenshot({path:output+'/motion-settings.png'});
    console.log('PASS site setting reduced and system and full',JSON.stringify(still));
    await rm.context.close();
  }
}finally{await browser.close();}
