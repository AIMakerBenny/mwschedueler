import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Read-only smoke test. The candidate is injected into an isolated public
// Chromium tab; nothing is published to or saved on Cloudflare D1/R2.
const ORIGIN='https://mawang-scheduler.majoku.workers.dev/';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const candidateCss=read('assets/achievement-exhibition-v1.css');
const candidateDialogCss=read('assets/achievement-gallery-v1621.css');
const candidateJs=read('assets/achievement-gallery-v1621.js');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-real-hall-'));
const output='visual-achievement-live';
const capture=process.env.MWS_HALL_CAPTURE==='1';
const verifyProduction=process.env.MWS_HALL_PRODUCTION==='1';
if(capture)mkdirSync(output,{recursive:true});
let browser;
try{
 browser=await launchCalendarBrowser(dir);
 for(const [width,height,mobile] of [[1366,768,false],[1920,1080,false],[2560,1440,false],[390,844,true]]){
  await browser.navigate(ORIGIN,width,height,mobile);
  let state;
  for(let retry=0;retry<110;retry++){
    state=await browser.evaluate("(()=>({ready:!!window.__mwsAppReadyV130,gated:document.body.classList.contains('mws-gated'),loading:document.body.classList.contains('mws-app-loading'),title:document.querySelector('#pageTitle')?.textContent?.trim(),media:!!window.mwsAchievementMediaV1?.getBlob,gallery:!!window.mwsRenderAchievementGalleryV1621}))()");
    if(state.ready&&!state.loading&&state.gallery)break;
    await pause(180);
  }
  // Some clean browser profiles require explicit public entry.
  if(state?.gated){
    await browser.evaluate("(()=>{document.querySelector('#mwsModePublic')?.click();document.querySelector('#mwsLoginSubmit')?.click()})()");
    for(let retry=0;retry<50;retry++){
      await pause(140);
      state=await browser.evaluate("(()=>({gated:document.body.classList.contains('mws-gated'),ready:!!window.__mwsAppReadyV130,gallery:!!window.mwsRenderAchievementGalleryV1621}))()");
      if(!state.gated&&state.gallery)break;
    }
  }
  assert(state?.ready&&!state?.gated&&state?.gallery,'Public app cannot mount achievement section: '+JSON.stringify({width,state}));
  await browser.evaluate("(()=>{const notice=document.querySelector('#mwsAnnouncementDialog');if(notice?.open)notice.querySelector('[data-notice-close]')?.click();document.querySelector('.nav button[data-tab=achievements]')?.click()})()");
  const replaced=verifyProduction
    ?await browser.evaluate("(()=>({ok:!!document.querySelector('link[href*=\"achievement-exhibition-v1.css\"]')?.href.includes('v=5')&&!!document.querySelector('#mws-first-paint-guard'),runtime:!!window.__mwsAchievementGalleryRuntimeV1621}))()")
    :await browser.evaluate('(()=>{'+
    'const existing=[...document.querySelectorAll("link[rel=stylesheet]")].find(el=>el.href.includes("/assets/achievement-exhibition-v1.css"));'+
    'if(!existing)return {ok:false,reason:"original exhibition stylesheet missing"};'+
    'const style=document.createElement("style");style.id="qa-candidate-hall";style.textContent='+JSON.stringify(candidateCss)+';existing.replaceWith(style);'+
    'const dialogStyle=document.createElement("style");dialogStyle.id="qa-candidate-detail";dialogStyle.textContent='+JSON.stringify(candidateDialogCss)+';document.head.appendChild(dialogStyle);'+
    'window.__mwsAchievementGalleryRuntimeV1621=false;'+
    'const script=document.createElement("script");script.id="qa-candidate-hall-runtime";script.textContent='+JSON.stringify(candidateJs)+';document.body.appendChild(script);'+
    'return {ok:!!document.querySelector("#qa-candidate-hall")&&typeof window.mwsRenderAchievementGalleryV1621==="function",runtime:!!window.__mwsAchievementGalleryRuntimeV1621}})()');
  assert(replaced.ok&&replaced.runtime,'Cannot inject candidate into public page: '+JSON.stringify({width,replaced}));
  await browser.evaluate("window.mwsRenderAchievementGalleryV1621()");
  await pause(250);
  const initial=await browser.evaluate("(()=>{const grid=document.querySelector('#achievementGallery'),first=grid?.querySelector('.achievement-card-open');return {active:!!document.querySelector('#achievements.active'),title:document.querySelector('#pageTitle')?.textContent?.trim(),count:grid?.querySelectorAll('.achievement-card-open').length,first:!!first,overflow:document.documentElement.scrollWidth>innerWidth+4,media:!!window.mwsAchievementMediaV1?.getBlob,description:!!first?.querySelector('.achievement-card-peek'),hasCandidate:!!document.querySelector('#qa-candidate-hall')||[...document.querySelectorAll('link[rel=stylesheet]')].some(el=>el.href.includes('achievement-exhibition-v1.css')&&el.href.includes('v=5'))&&!!document.querySelector('#mws-first-paint-guard')}})()");
  assert(initial.active&&initial.title==='업적'&&!initial.overflow&&initial.hasCandidate,'Real public gallery shell broken: '+JSON.stringify({width,initial}));
  if(verifyProduction)assert(initial.count>0,'Real production Hall of Fame has no cards at '+width);
  if(!initial.count){
    console.log('MWS_REAL_HALL_PUBLIC_EMPTY',width,JSON.stringify(initial));
    continue;
  }
  await browser.evaluate("document.querySelector('#achievementGallery .achievement-card-open').scrollIntoView({block:'center',inline:'nearest'})");
  await pause(100);
  const rect=await browser.evaluate("(()=>{const e=document.querySelector('#achievementGallery .achievement-card-open'),r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+Math.min(r.height*.4,150),width:r.width,height:r.height}})()");
  if(!mobile){
    await browser.movePoint(rect.x,rect.y);
    await pause(360);
    const hover=await browser.evaluate("(()=>{const e=document.querySelector('#achievementGallery .achievement-card-open'),p=e.querySelector('.achievement-card-peek'),img=e.querySelector('.achievement-card-thumb img'),cs=getComputedStyle(e);return {active:e.classList.contains('is-pointer-active'),transform:cs.transform,light:e.style.getPropertyValue('--ach-light-x'),parallax:e.style.getPropertyValue('--ach-parallax-x'),preview:!!p,previewVisible:p?getComputedStyle(p).display!=='none'&&getComputedStyle(p).opacity!=='0':null,imageTransform:img?getComputedStyle(img).transform:null}})()");
    assert(hover.active&&hover.transform!=='none'&&hover.light&&hover.parallax,'Real browser hover inactive: '+JSON.stringify({width,hover}));
    if(hover.preview)assert(hover.previewVisible,'Real browser description overlay hidden: '+JSON.stringify({width,hover}));
    if(capture)writeFileSync(path.join(output,'actual-hall-'+width+'-hover.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
    await browser.movePoint(8,height-8);
  }else{
    const touch=await browser.evaluate("(()=>({display:getComputedStyle(document.querySelector('#achievementGallery .achievement-card-open')).display,overlay:document.querySelector('#achievementGallery .achievement-card-peek')?getComputedStyle(document.querySelector('#achievementGallery .achievement-card-peek')).display:null}))()");
    assert(touch.display!=='none'&&touch.overlay!=='flex','Touch gallery incorrectly shows hover description: '+JSON.stringify(touch));
    if(capture)writeFileSync(path.join(output,'actual-hall-'+width+'-touch.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
  }
  await browser.clickPoint(rect.x,rect.y);
  const opened=await browser.evaluate("(()=>{const modal=document.querySelector('#achievementDetailModal');return !!modal&&!modal.hidden&&!!modal.querySelector('[data-achievement-card3d]')})()");
  assert(opened,'Live public achievement click did not open detail on '+width);
  const layout=await browser.evaluate("(()=>{const modal=document.querySelector('.achievement-detail-modal'),dialog=document.querySelector('.achievement-detail-dialog'),stage=document.querySelector('.achievement-detail-stage'),controls=document.querySelector('.achievement-detail-controls'),info=document.querySelector('.achievement-detail-info');const d=dialog.getBoundingClientRect(),c=controls.getBoundingClientRect(),s=stage.getBoundingClientRect();return {modalOverflow:modal.scrollHeight-modal.clientHeight,dialogOverflow:dialog.scrollHeight-dialog.clientHeight,dialogBottom:d.bottom,dialogRight:d.right,controlsBottom:c.bottom,cardRatio:s.width/s.height,stageHeight:s.height,infoKeyboard:info.tabIndex===0}})()");
  assert(Math.abs(layout.cardRatio-2/3)<.02&&layout.infoKeyboard&&layout.stageHeight>100,'Real gallery card geometry failed: '+JSON.stringify({width,layout}));
  assert(layout.dialogRight<=width+1&&layout.controlsBottom<=height+1&&(mobile||layout.dialogBottom<=height+1),'Real gallery card exceeds viewport: '+JSON.stringify({width,layout}));
  if(mobile){
    const scroll=await browser.evaluate("(()=>{const m=document.querySelector('.achievement-detail-modal'),c=document.querySelector('.achievement-detail-close');m.scrollTop=m.scrollHeight;const r=c.getBoundingClientRect();return {position:getComputedStyle(c).position,top:r.top,bottom:r.bottom,scroll:m.scrollTop}})()");
    assert(scroll.position==='sticky'&&scroll.top>=0&&scroll.bottom<=height&&scroll.scroll>=0,'Mobile close must remain accessible while scrolling: '+JSON.stringify(scroll));
    await browser.evaluate("document.querySelector('.achievement-detail-modal').scrollTop=0");
  }
  if(!mobile)assert(layout.dialogOverflow<=2&&layout.modalOverflow<=2,'Unexpected desktop modal scrollbar: '+JSON.stringify({width,layout}));
  if(capture)writeFileSync(path.join(output,'actual-hall-'+width+'-detail-front.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
  await browser.evaluate("document.querySelector('.achievement-detail-close')?.click()");
  console.log('MWS_REAL_HALL_MODAL_OK',width,JSON.stringify(layout));
  console.log('MWS_REAL_HALL_OK',width,JSON.stringify({...initial,rect,clicked:true}));
 }
}finally{
 await browser?.close();
 rmSync(dir,{recursive:true,force:true});
}
