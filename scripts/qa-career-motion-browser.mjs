import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const base='https://mawang-scheduler.majoku.workers.dev/';
const output=resolve(process.env.CAREER_QA_OUTPUT||'career-qa');
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
const candidate=process.env.CAREER_LIVE!=='1';
const mode=process.env.CAREER_QA_MODE||'all';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const open=async(width,height,video=false,reducedMotion='no-preference')=>{
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion,...(video?{recordVideo:{dir:output,size:{width,height}}}:{})});
  if(candidate){
    // Use the real public production shell/data with only candidate frontend assets overridden.
    for(const file of ['career-visualizer.js','career-timeline.css']){
      await context.route('**/assets/'+file+'*',route=>route.fulfill({
        status:200,contentType:file.endsWith('.js')?'application/javascript':'text/css',
        body:readFileSync(new URL('../assets/'+file,import.meta.url))
      }));
    }
  }
  const started=Date.now(), page=await context.newPage();
  const errors=[];page.on('pageerror',err=>{if(err.stack?.includes('career-visualizer'))errors.push(err.message)});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading'),{},{timeout:45000});
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
  await page.locator('.cv-intro').waitFor({state:'hidden',timeout:5000});
  await pause(1100);
  assert.equal(await page.locator('.career-tree li').count(),51);
  assert.equal(await page.locator('.career-tree .career-year').last().locator('li').count(),7);
  assert.match(await page.locator('.cv-hero-title').innerText(),/전사 1위/);
  return {context,page,errors,started};
};
const title=p=>p.locator('.cv-hero-title').innerText();
const chooseYear=(p,y)=>p.locator('.cv-years').getByRole('button',{name:y,exact:true}).click();
const chooseMonth=(p,m)=>p.locator('.cv-mini').nth(m-1).click();
const search=(p,q)=>p.locator('.cv-search').fill(q);
const checkFit=async p=>{
  const fit=await p.locator('.cv-hero-title').evaluate(e=>{
    const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1&&e.scrollWidth<=e.clientWidth+1;
  });
  assert(fit,'Hero clipped');
  assert(await p.locator('.cv-panel').evaluate(e=>e.getBoundingClientRect().right<=innerWidth+1),'Panel overflow');
};
try{
  for(const [width,height] of [[1366,768],[1920,1080],[390,844]].filter(([w])=>mode==='all'||(mode==='mobile'&&w===390)||(mode==='desktop'&&w>700))){
    const {context,page,errors}=await open(width,height);
    await chooseYear(page,'2022'); await pause(1200);
    assert.equal(await page.locator('.cv-month[data-month="4"] .cv-record').count(),3);
    await checkFit(page);
    await page.screenshot({path:output+'/2022-april-'+width+'.png'});
    await chooseYear(page,'2024');await pause(1200);
    await chooseMonth(page,3);await pause(1200);
    assert.match(await title(page),/1위/);
    const camera=await page.locator('.cv-axis').evaluate(e=>e.style.transform);
    await page.locator('.cv-controls').getByRole('button',{name:'다음',exact:true}).click();
    await pause(400);
    assert.equal(await title(page),'팀 종합 우승');
    assert.equal(await page.locator('.cv-axis').evaluate(e=>e.style.transform),camera,'Same-month camera moved');
    await checkFit(page);
    await page.screenshot({path:output+'/2024-march-'+width+'.png'});
    await chooseMonth(page,7);await pause(1200);
    await page.locator('.cv-month[data-month="7"]').getByRole('button',{name:'왁체대 종합 우승'}).click();await pause(400);
    assert.equal(await title(page),'팀 종합 우승');
    assert.match(await page.locator('.cv-hero-extra').innerText(),/개인 공동 1위/);
    await search(page,'릴동파');
    assert.equal(await page.locator('.cv-result-group').count(),2);
    assert.equal(await page.locator('.cv-result').count(),3);
    await page.screenshot({path:output+'/search-'+width+'.png'});
    await page.locator('.cv-result').first().click();await pause(1200);
    assert.match(await page.locator('.cv-hero-date').innerText(),/2025년/);
    await search(page,'');await pause(1200);
    assert.match(await page.locator('.cv-hero-date').innerText(),/2024년 7월/);
    for(const [q,n] of [['코치',3],['VR 우승',4],['WBD',1],['왁타버스 야구',1],['F1 챔스',1]]){
      await search(page,q);
      assert.equal(await page.locator('.cv-result').count(),n,q);
      if(q==='VR 우승')assert(!((await page.locator('.cv-results').innerText()).includes('준우승')));
    }
    await search(page,'');
    await chooseYear(page,'레거시');await pause(100);
    assert.equal(await page.locator('.cv-record').count(),7);
    assert(await page.locator('.cv-play').isDisabled());
    assert.deepEqual(errors,[]);
    console.log('PASS',width,height);
    await context.close();
  }
  if(mode==='all'||mode==='record'){
  const {context,page,errors,started}=await open(1366,768,true);
  const video=page.video();
  const startSeconds=Math.max(0,(Date.now()-started)/1000-3);
  // Start the recording sequence at the final record of 2024 so playback restarts at February.
  await chooseYear(page,'2024');await pause(950);await chooseMonth(page,12);await pause(950);
  await page.locator('.cv-controls .cv-control').last().click();await pause(350);
  await page.locator('.cv-play').click();
  await pause(1300); assert.match(await page.locator('.cv-hero-date').innerText(),/2024년 2월/);
  await pause(8800);
  await page.locator('.cv-play').click();
  const stopped=await title(page), transform=await page.locator('.cv-axis').evaluate(e=>e.style.transform);
  await pause(750);assert.equal(await title(page),stopped);assert.equal(await page.locator('.cv-axis').evaluate(e=>e.style.transform),transform);
  await page.locator('.cv-play').click();await pause(1300);
  await search(page,'릴동파');
  await pause(900);
  await page.locator('.cv-result').first().click();await pause(1500);
  assert.match(await page.locator('.cv-hero-date').innerText(),/2025년/);
  assert.equal(await page.locator('.cv-play').innerText(),'재생');
  await page.screenshot({path:output+'/recording-end.png'});
  assert.deepEqual(errors,[]);
  await context.close();
  await video.saveAs(output+'/career-timeline-raw.webm');
  execFileSync('ffmpeg',['-y','-ss',String(startSeconds),'-i',output+'/career-timeline-raw.webm','-t','25','-c:v','libvpx-vp9','-crf','30','-b:v','0',output+'/career-timeline-recording.webm'],{stdio:'inherit'});
  console.log('PASS recording interaction');
  const rm=await open(1366,768,false,'reduce');
  await chooseYear(rm.page,'2022');assert.match(await title(rm.page),/1위/);await rm.context.close();
  }
}finally{await browser.close();}
