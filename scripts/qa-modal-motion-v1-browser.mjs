import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html');
assert(index.includes('assets/modal-motion-v1.css?v=1'));
const css=['assets/app-core.css','assets/mawang-premium-v1621.css','assets/device-ui.css','assets/ui-frame-presets.css','assets/workspace-clean-v1.css','assets/contact-directory-v177.css','assets/modal-motion-v1.css'].map(read).join('\n');
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-modal-motion-'));
const file=path.join(dir,'fixture.html');
writeFileSync(file,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body class="mws-premium"><button id="trigger">Open</button><div id="contactModal" class="modal"><div class="modalbox contact-modalbox"><h2>Contact</h2><button id="close">Close</button><input></div></div>`);
let browser;
try{
  browser=await launchCalendarBrowser(dir);
  const sample=String.raw`(async()=>{
    const m=document.querySelector('#contactModal'),box=m.querySelector('.modalbox');
    const tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));
    const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const measure=async(open)=>{
      const start=performance.now(),values=[];
      m.classList.toggle('open',open);
      for(let i=0;i<60&&performance.now()-start<800;i++){
        await tick();const s=getComputedStyle(m),b=getComputedStyle(box);
        values.push({opacity:Number(s.opacity),scale:b.scale,display:s.display,hit:s.pointerEvents,width:box.offsetWidth});
        if(open?Number(s.opacity)===1&&b.scale==='none':s.display==='none')break;
      }
      return values;
    };
    const initial=getComputedStyle(m).display;
    const entered=await measure(true),exited=await measure(false);
    m.classList.add('open');await tick();await tick();m.classList.remove('open');await tick();m.classList.add('open');await sleep(350);
    const reopened=getComputedStyle(m).display!=='none'&&getComputedStyle(m).opacity==='1'&&getComputedStyle(box).scale==='none';
    m.classList.remove('open');await sleep(300);
    const dynamic=document.createElement('div');dynamic.className='modal open';dynamic.innerHTML='<div class="modalbox">Group member</div>';document.body.append(dynamic);await tick();
    const dynamicEntry=Number(getComputedStyle(dynamic).opacity)<1;await sleep(350);
    const dynamicSettled=getComputedStyle(dynamic).opacity==='1';dynamic.remove();
    return {initial,entered,exited,reopened,dynamicEntry,dynamicSettled};
  })()`;
  for(const [w,h] of [[1366,768],[1920,1080],[390,844]]){
    await browser.navigate(pathToFileURL(file).href+'?size='+w,w,h);
    const r=await browser.evaluate(sample);
    const intermediate=v=>v.opacity>0&&v.opacity<1;
    assert.equal(r.initial,'none');
    assert(r.entered.filter(intermediate).length>=2,JSON.stringify(r));
    assert(r.exited.filter(intermediate).length>=2,JSON.stringify(r));
    assert.equal(r.entered.at(-1).opacity,1);assert.equal(r.entered.at(-1).scale,'none');
    assert.equal(r.exited.at(-1).display,'none');assert(r.exited.every(v=>v.hit==='none'));
    assert(r.entered.some(v=>v.scale!=='none'&&Number(v.scale)>.97&&Number(v.scale)<1));
    assert(r.entered.every(v=>v.width===r.entered[0].width));
    assert(r.reopened&&r.dynamicEntry&&r.dynamicSettled,JSON.stringify(r));
    console.log('MODAL_MOTION_OK',w,h,JSON.stringify({enterFrames:r.entered.length,exitFrames:r.exited.length,reopened:r.reopened,dynamicEntry:r.dynamicEntry}));
  }
  await browser.setReducedMotion(true);
  await browser.navigate(pathToFileURL(file).href+'?reduced',1366,768);
  const reduced=await browser.evaluate(sample);
  assert(reduced.entered.every(v=>v.scale==='none'));
  assert(reduced.entered.some(v=>v.opacity>0&&v.opacity<1));
  assert.equal(reduced.exited.at(-1).display,'none');
  console.log('MODAL_REDUCED_MOTION_OK');
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
