import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const index=read('index.html').toString();
assert(index.includes('assets/announcement-carousel-v1.js?v=3')&&index.includes('assets/announcement-carousel-v1.css?v=1'));
const styles=[...index.matchAll(/<link rel="stylesheet" href="(assets\/[^"?]+)[^"]*">|<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)]
  .map(m=>m[1]?m[0]:m[0]).join('\n');
const fixture='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+styles+'</head><body class="mws-gated mws-premium" data-theme="neon"><div id="mwsAccessGate">Login gate</div><div class="app"><main class="main"><button id="background">Background action</button></main></div><script src="assets/announcement-carousel-v1.js?v=2"></script></body></html>';
const root=fileURLToPath(new URL('../',import.meta.url));
const server=createServer((req,res)=>{
  const route=new URL(req.url,'http://localhost').pathname;
  if(route==='/fixture'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture);return}
  if(!/^\/assets\/[a-zA-Z0-9/_\-.]+$/.test(route)){res.writeHead(404).end();return}
  const asset=path.resolve(root,'.'+route);
  if(!asset.startsWith(path.join(root,'assets')+path.sep)){res.writeHead(404).end();return}
  try{res.setHeader('Content-Type',route.endsWith('.css')?'text/css':route.endsWith('.js')?'application/javascript':route.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(readFileSync(asset))}catch{res.writeHead(404).end()}
});
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-announcement-'));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/fixture';
  browser=await launchCalendarBrowser(dir);
  const release=`(()=>{document.body.dataset.mwsMode='public';document.body.classList.remove('mws-gated');document.getElementById('mwsAccessGate').classList.add('hidden');window.dispatchEvent(new Event('mws:app-ready'))})()`;
  const getIndex=()=>browser.evaluate("document.getElementById('mwsAnnouncementDialog')?.dataset.noticeIndex");
  const open=()=>browser.evaluate("!!document.querySelector('#mwsAnnouncementDialog[open]')");
  // The production Worker emits readiness before the gate is released.
  await browser.navigate(url,1366,768);
  await browser.evaluate("document.body.dataset.mwsMode='public';window.dispatchEvent(new Event('mws:app-ready'))");
  assert.equal(await open(),false);
  await browser.evaluate("document.body.classList.remove('mws-gated');document.getElementById('mwsAccessGate').classList.add('hidden')");
  assert(await open(),'Notice must appear after delayed gate release');
  await browser.evaluate("document.querySelector('.mws-notice-close').click();document.body.classList.toggle('qa-ready')");
  assert.equal(await open(),false,'Observer must not reopen a closed notice');
  console.log('MWS_NOTICE_DELAYED_GATE_OK');
  for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[390,844]]){
    await browser.navigate(url,width,height);
    assert.equal(await open(),false,'Notice must not cover login');
    await browser.evaluate(release);
    const initial=await browser.evaluate(`(async()=>{
      const d=document.getElementById('mwsAnnouncementDialog'),v=d.querySelector('.mws-notice-viewport'),footer=d.querySelector('.mws-notice-footer');
      const imgs=[...d.querySelectorAll('img')];await Promise.all(imgs.map(i=>i.decode()));
      const r=d.getBoundingClientRect(),a=v.getBoundingClientRect(),f=footer.getBoundingClientRect();
      return {open:d.open,modal:d.matches(':modal'),index:d.dataset.noticeIndex,allImages:imgs.length===3&&imgs.every(i=>i.naturalWidth===1448&&i.naturalHeight===1086&&getComputedStyle(i).objectFit==='contain'),fit:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,ratio:a.width/a.height,footer:f.width,footerFits:footer.scrollWidth<=footer.clientWidth+1,viewport:{x:a.x,y:a.y,w:a.width,h:a.height}}
    })()`);
    assert(initial.open&&initial.modal&&initial.allImages&&initial.fit&&initial.footerFits&&initial.index==='0'&&Math.abs(initial.ratio-4/3)<.01,JSON.stringify(initial));
    const {x,y,w,h}=initial.viewport;
    const cy=Math.round(y+h*.66),start=Math.round(x+w*.72),end=Math.round(x+w*.30);
    await wait(250);
    await browser.mouseDown(start,cy);
    await browser.mouseDrag(Math.round((start+end)/2),cy);
    const during=await browser.evaluate(`(()=>{const v=document.querySelector('.mws-notice-viewport'),t=document.querySelector('.mws-notice-track'),x=new DOMMatrix(getComputedStyle(t).transform).m41;return {dragging:v.dataset.dragging,offset:x,index:document.getElementById('mwsAnnouncementDialog').dataset.noticeIndex}})()`);
    assert(during.dragging==='true'&&during.offset < -15&&during.index==='0',JSON.stringify(during));
    await browser.mouseDrag(end,cy);await browser.mouseUp(end,cy);
    const anim=await browser.evaluate(`(()=>{const t=document.querySelector('.mws-notice-track');return {index:document.getElementById('mwsAnnouncementDialog').dataset.noticeIndex,transition:getComputedStyle(t).transitionDuration,transform:t.style.transform}})()`);
    assert.equal(anim.index,'1');assert.equal(anim.transition,'0.32s');await wait(360);
    await browser.keyPress('ArrowRight');assert.equal(await getIndex(),'2');
    await wait(360);
    const last=await browser.evaluate(`(()=>{const d=document.getElementById('mwsAnnouncementDialog');const r=d.querySelector('.mws-notice-slide:last-child').getBoundingClientRect(),v=d.querySelector('.mws-notice-viewport').getBoundingClientRect();return {lastFits:Math.abs(r.x-v.x)<1&&Math.abs(r.width-v.width)<1,lastDisabled:d.querySelector('.mws-notice-next').disabled}})()`);
    assert(last.lastFits&&last.lastDisabled,JSON.stringify(last));
    // Navigation dots and arrows both use the same slide state.
    await browser.evaluate("document.querySelectorAll('.mws-notice-dot')[0].click()");assert.equal(await getIndex(),'0');
    await browser.evaluate("document.querySelector('.mws-notice-next').click()");assert.equal(await getIndex(),'1');
    await browser.evaluate("document.querySelector('.mws-notice-prev').click()");assert.equal(await getIndex(),'0');
    await browser.evaluate("window.dispatchEvent(new Event('mws:app-ready'))");
    assert.equal(await browser.evaluate("document.querySelectorAll('#mwsAnnouncementDialog').length"),1);
    await browser.keyPress('Escape');assert.equal(await open(),false);
    assert.equal(await browser.evaluate("localStorage.getItem('mws.announcements.hiddenDay.v1')"),null);
    console.log('MWS_NOTICE_VIEWPORT_OK',width,height,JSON.stringify({initial,during,anim,last}));
  }
  await browser.navigate(url,1366,768);await browser.evaluate(release);assert(await open());
  await browser.evaluate("document.querySelector('.mws-notice-x').click()");assert.equal(await open(),false);
  await browser.navigate(url,1366,768);await browser.evaluate(release);assert(await open());
  await browser.evaluate("document.querySelector('.mws-notice-close').click()");assert.equal(await open(),false);
  await browser.navigate(url,1366,768);await browser.evaluate(release);assert(await open());
  await browser.evaluate("document.querySelector('.mws-notice-today').click()");assert.equal(await open(),false);
  const date=await browser.evaluate("({saved:localStorage.getItem('mws.announcements.hiddenDay.v1'),today:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())})");
  assert.equal(date.saved,date.today);
  await browser.navigate(url,1366,768);await browser.evaluate(release);assert.equal(await open(),false);
  await browser.evaluate("localStorage.setItem('mws.announcements.hiddenDay.v1','2000-01-01')");
  await browser.navigate(url,1366,768);await browser.evaluate(release);assert(await open());
  await browser.setReducedMotion(true);
  assert.equal(await browser.evaluate("getComputedStyle(document.querySelector('.mws-notice-track')).transitionDuration"),'0s');
  console.log('MWS_NOTICE_DAILY_DISMISS_OK',JSON.stringify(date));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));rmSync(dir,{recursive:true,force:true})}
