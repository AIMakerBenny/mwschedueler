import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html');
assert(index.includes('assets/modal-motion-v1.css?v=2'));
const runtime=read('assets/contact-runtime-v130.js'),app=read('assets/app-core.js');
assert(runtime.includes('loading="lazy" decoding="async" width="42" height="42"'));
assert(app.includes('contactApplicationHistoryPendingV180=true')&&app.includes("contactDetailTab==='applications'&&contactApplicationHistoryPendingV180"));
assert(index.includes('id="ctHeaderAvatarImage" decoding="async"')&&index.includes('class="contact-image-preview" decoding="async"'));
const css=['assets/app-core.css','assets/mawang-premium-v1621.css','assets/device-ui.css','assets/ui-frame-presets.css','assets/workspace-clean-v1.css','assets/contact-directory-v177.css','assets/modal-motion-v1.css'].map(read).join('\n');
const groupCss=runtime.match(/css\.textContent=`([\s\S]*?)`;/)?.[1]||'';
assert(groupCss.includes('.v56-list'));
const modalMarkup=index.slice(index.indexOf('<div id="contactModal" class="modal">'),index.indexOf('<div id="targetPickerModal" class="modal">'));
assert(modalMarkup.includes('id="contactHistoryList"')&&modalMarkup.includes('id="ctImagePreview"'));
const avatar='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22128%22 height=%22128%22%3E%3Crect width=%22128%22 height=%22128%22 fill=%22%236e7eaa%22/%3E%3C/svg%3E';
const cards=Array.from({length:216},(_,i)=>`<div class="contact-card"><div class="contact-card-core"><img class="contact-card-avatar-lg" loading="lazy" width="84" height="84" src="${avatar}"><div class="contact-card-info"><div class="contact-card-name">연락처 ${i}</div><div class="contact-card-tags"><span class="chip">버튜버</span></div><div class="contact-card-last">최근 컨텐츠: 일정 기록</div></div></div></div>`).join('');
const candidates=Array.from({length:210},(_,i)=>`<button class="v56-row" data-id="${i}"><img loading="lazy" decoding="async" width="42" height="42" src="${avatar}" alt=""><span><strong>연락처 ${i}</strong><small>버튜버</small></span><span class="v56-plus">추가</span></button>`).join('');
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-modal-motion-'));
const file=path.join(dir,'fixture.html');
writeFileSync(file,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\n${groupCss}</style><body class="mws-premium"><div class="app"><main class="main"><section id="contacts" class="section active"><div id="contactGrid" class="contact-grid">${cards}</div></section></main></div>${modalMarkup}<div id="v56AddModal" class="modal"><div class="modalbox"><h2>그룹 인원 추가</h2><input><div class="v56-list">${candidates}</div></div></div><script>document.querySelector('#ctImagePreview').src='${avatar}';document.querySelector('#ctHeaderAvatarImage').src='${avatar}'; document.querySelector('#contactHistoryList').innerHTML=Array.from({length:100},(_,i)=>'<div class="contact-history-item">지난 콘텐츠 '+i+'</div>').join('');</script>`);
let browser;
try{
  browser=await launchCalendarBrowser(dir);
  const sample=String.raw`(async()=>{
    const m=document.querySelector('#contactModal'),box=m.querySelector('.modalbox');
    const tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));
    const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const measure=async(open,modal=m)=>{
      const panel=modal.querySelector('.modalbox');
      const start=performance.now(),values=[];
      modal.classList.toggle('open',open);
      document.body.classList.toggle('modal-active',open);
      for(let i=0;i<90&&performance.now()-start<1200;i++){
        const time=await tick(),s=getComputedStyle(modal),b=getComputedStyle(panel);
        values.push({ms:Math.round(time-start),opacity:Number(b.opacity),scrim:Number(getComputedStyle(modal,'::before').opacity),scale:b.scale,display:s.display,hit:s.pointerEvents,width:panel.offsetWidth,shellOpacity:Number(s.opacity),filter:s.backdropFilter});
        if(open?Number(b.opacity)===1&&b.scale==='none':s.display==='none')break;
      }
      return values;
    };
    const initial=getComputedStyle(m).display;
    const entered=await measure(true),exited=await measure(false);
    m.classList.add('open');await tick();await tick();m.classList.remove('open');await tick();m.classList.add('open');await sleep(450);
    const reopened=getComputedStyle(m).display!=='none'&&getComputedStyle(box).opacity==='1'&&getComputedStyle(box).scale==='none';
    m.classList.remove('open');await sleep(300);
    const group=document.querySelector('#v56AddModal');const groupEnter=await measure(true,group),groupExit=await measure(false,group);
    const dynamic=document.createElement('div');dynamic.className='modal open';dynamic.innerHTML='<div class="modalbox">Group member</div>';document.body.append(dynamic);await tick();
    const dynamicEntry=Number(getComputedStyle(dynamic.firstElementChild).opacity)<1;await sleep(450);
    const dynamicSettled=getComputedStyle(dynamic.firstElementChild).opacity==='1';dynamic.remove();
    return {initial,entered,exited,groupEnter,groupExit,reopened,dynamicEntry,dynamicSettled};
  })()`;
  for(const [w,h] of [[1366,768],[1920,1080],[390,844]]){
    await browser.navigate(pathToFileURL(file).href+'?size='+w,w,h);
    const r=await browser.evaluate(sample);
    const intermediate=v=>v.opacity>0&&v.opacity<1;
    assert.equal(r.initial,'none');
    assert(r.entered.filter(intermediate).length>=5,JSON.stringify(r));
    assert(r.exited.filter(intermediate).length>=3,JSON.stringify(r));
    assert.equal(r.entered.at(-1).opacity,1);assert.equal(r.entered.at(-1).scale,'none');
    assert.equal(r.exited.at(-1).display,'none');assert(r.exited.every(v=>v.hit==='none'));
    assert(r.entered.some(v=>v.scale!=='none'&&Number(v.scale)>.98&&Number(v.scale)<1));
    assert(r.entered.every(v=>v.width===r.entered[0].width));
    for(const values of [r.entered,r.exited,r.groupEnter,r.groupExit]){
      assert(values.every(v=>v.shellOpacity===1&&v.filter==='none'),'Full viewport must not be filtered or faded');
      assert(values.filter(intermediate).length>=3,JSON.stringify(values));
      assert(values.some(v=>v.scrim!==v.opacity),'Scrim and panel must animate separately');
    }
    assert(r.entered.some(v=>v.ms<120&&v.opacity<.55),'Entrance must not front-load most opacity');
    assert(r.reopened&&r.dynamicEntry&&r.dynamicSettled,JSON.stringify(r));
    const stats=values=>({frames:values.length,intermediate:values.filter(intermediate).length,maxGapMs:Math.max(...values.slice(1).map((v,i)=>v.ms-values[i].ms)),elapsedMs:values.at(-1).ms});
    for(const values of [r.entered,r.exited,r.groupEnter,r.groupExit]){
      assert(stats(values).maxGapMs<=100,'Excessive animation frame gap: '+JSON.stringify(stats(values)));
    }
    console.log('MODAL_MOTION_OK',w,h,JSON.stringify({contactEnter:stats(r.entered),contactExit:stats(r.exited),groupEnter:stats(r.groupEnter),groupExit:stats(r.groupExit),reopened:r.reopened,dynamicEntry:r.dynamicEntry}));
  }
  await browser.setReducedMotion(true);
  await browser.navigate(pathToFileURL(file).href+'?reduced',1366,768);
  const reduced=await browser.evaluate(sample);
  assert(reduced.entered.every(v=>v.scale==='none'));
  assert(reduced.entered.some(v=>v.opacity>0&&v.opacity<1));
  assert.equal(reduced.exited.at(-1).display,'none');
  console.log('MODAL_REDUCED_MOTION_OK');
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
