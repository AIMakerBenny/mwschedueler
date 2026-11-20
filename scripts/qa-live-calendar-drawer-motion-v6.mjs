import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Observe real public-mode controls on the deployed app, never create/edit an event.
const base=process.env.MWS_LIVE_BASE||'https://mawang-scheduler.majoku.workers.dev';
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-live-drawer-'));
let browser;
try{
  browser=await launchCalendarBrowser(dir);
  const url=base.replace(/\/$/,'')+'/?drawer-motion-v7='+Date.now();
  await browser.navigate(url,1366,768);
  const ready=await browser.evaluate(String.raw`(async()=>{
    const until=performance.now()+18000;
    const $=s=>document.querySelector(s),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    while(performance.now()<until){
      const gate=$('#mwsAccessGate');
      const publicMode=document.body.classList.contains('mws-public-mode');
      const visibleGate=gate&&getComputedStyle(gate).display!=='none'&&gate.getBoundingClientRect().width>0;
      if(visibleGate&&$('#mwsModePublic')&&!$('#mwsLoginSubmit')?.disabled){$('#mwsModePublic').click();$('#mwsLoginSubmit')?.click()}
      if(publicMode&&!visibleGate&&$('#calendarGrid .mini-event[data-evid]')&&$('#calendarEventDetailsV1'))return {cards:document.querySelectorAll('#calendarGrid .mini-event[data-evid]').length,version:[...document.scripts].some(s=>s.src.includes('calendar-details-v1.js?v=7')),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,noPreferenceControl:$('#calendarEventDetailsV1').querySelectorAll('header button').length===1};
      await sleep(125);
    }
    return {error:'No loaded public calendar cards'};
  })()`);
  assert(ready.cards>0&&ready.version&&!ready.reduced&&ready.noPreferenceControl,JSON.stringify(ready));
  const target=await browser.evaluate(String.raw`(()=>{
    const cards=[...document.querySelectorAll('#calendarGrid .mini-event[data-evid] .mini-event-main')];
    for(const card of cards){const rect=card.getBoundingClientRect(),x=rect.left+Math.min(20,rect.width/2),y=rect.top+rect.height/2;if(rect.width>10&&y>0&&y<innerHeight&&document.elementFromPoint(x,y)?.closest('.mini-event[data-evid]')===card.closest('.mini-event[data-evid]'))return{x,y}}
    return null;
  })()`);
  assert(target,'A visible calendar card is required');
  async function observe(open,point){
    const sample=browser.evaluate(String.raw`(async()=>{
      const drawer=document.querySelector('#calendarEventDetailsV1'),tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));
      const start=performance.now(),positions=[];let duration=null;
      while(performance.now()-start<5500){
        const t=await tick(),animation=drawer.getAnimations()[0];
        if(!animation){if(positions.length)break;continue}
        duration=animation.effect.getTiming().duration;
        const x=new DOMMatrix(getComputedStyle(drawer).transform).m41/(drawer.offsetWidth*1.04);
        positions.push({t,x});
      }
      const middle=positions.filter(p=>p.x>=.2&&p.x<=.8);
      return {duration,frames:positions.length,middleFrames:middle.length,playbackMs:positions.length?Math.round(positions.at(-1).t-positions[0].t):0,middleMs:middle.length?Math.round(middle.at(-1).t-middle[0].t):0,midpoint:positions.reduce((best,p)=>Math.abs(p.x-.5)<Math.abs(best-.5)?p.x:best,0),monotonic:positions.every((p,i)=>!i||Math.abs(p.x-positions[i-1].x)<.001||Math.sign(p.x-positions[i-1].x)===Math.sign(positions.at(-1).x-positions[0].x)),settled:!drawer.hidden&&drawer.classList.contains('open')};
    })()`);
    await browser.clickPoint(point.x,point.y);
    const result=await sample;
    assert(result.duration===360&&result.playbackMs>=280&&result.middleMs>=65&&result.middleFrames>=4&&result.monotonic&&Math.abs(result.midpoint-.5)<=.15&&result.settled===open,JSON.stringify(result));
    console.log('MWS_LIVE_DRAWER_MOTION_V7',open?'open':'close',JSON.stringify(result));
  }
  await observe(true,target);
  const close=await browser.evaluate(`(()=>{const b=document.getElementById('calendarDetailsCloseV1').getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}})()`);
  await observe(false,close);
  await browser.setReducedMotion(true);
  assert(await browser.evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.getElementById('calendarDetailsMotionV6')`));
  await observe(true,target);
  await observe(false,close);
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
