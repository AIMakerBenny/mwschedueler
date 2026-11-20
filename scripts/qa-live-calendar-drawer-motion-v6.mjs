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
  const url=base.replace(/\/$/,'')+'/?calendar-popover-v2='+Date.now();
  await browser.navigate(url,1366,768);
  // Public mode may navigate during boot. Poll across document changes rather than
  // holding a pending evaluation in the outgoing page. Wait for hydrated UI and
  // late startup scripts to settle before measuring actual interactive playback.
  let ready,readySince=0,documentOrigin,lastState;
  const until=Date.now()+60000;
  while(Date.now()<until){
    let state;
    try{state=await browser.evaluate(String.raw`(()=>{
      const $=s=>document.querySelector(s);
      const gate=$('#mwsAccessGate');
      if(!document.body)return null;
      const publicMode=document.body.classList.contains('mws-public-mode');
      const visibleGate=gate&&getComputedStyle(gate).display!=='none'&&gate.getBoundingClientRect().width>0;
      if(document.readyState==='complete'&&visibleGate&&$('#mwsModePublic')&&!$('#mwsLoginSubmit')?.disabled){
        // Clicking before the runtime binds the form submits a native navigation.
        // A successful mode selection proves its handler has been installed.
        if($('#mwsLoginForm')?.dataset.mode!=='public')$('#mwsModePublic').click();
        if($('#mwsLoginForm')?.dataset.mode==='public'&&(!window.__mwsPopoverQaLoginAt||performance.now()-window.__mwsPopoverQaLoginAt>=3000)){
          window.__mwsPopoverQaLoginAt=performance.now();$('#mwsLoginSubmit')?.click();
        }
      }
      if(document.readyState==='complete'&&publicMode&&!visibleGate&&$('#calendarGrid .mini-event[data-evid]')&&$('#calendarEventDetailsV1')){
        const latestScript=Math.max(0,...performance.getEntriesByType('resource').filter(e=>e.initiatorType==='script').map(e=>e.responseEnd));
        return {cards:document.querySelectorAll('#calendarGrid .mini-event[data-evid]').length,version:[...document.scripts].some(s=>s.src.includes('calendar-details-v1.js?v=9')),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,noPreferenceControl:!$('#calendarDetailsMotionV6')&&$('#calendarEventDetailsV1').classList.contains('event-details-popover-v2'),origin:performance.timeOrigin,quiet:performance.now()-latestScript>=800};
      }
      return {waiting:true,readyState:document.readyState,publicMode,visibleGate:!!visibleGate,mode:$('#mwsLoginForm')?.dataset.mode,submitDisabled:$('#mwsLoginSubmit')?.disabled,cards:document.querySelectorAll('#calendarGrid .mini-event[data-evid]').length,popup:!!$('#calendarEventDetailsV1')};
    })()`)}catch(error){if(!/Inspected target navigated or closed|Cannot find context|Execution context was destroyed/.test(String(error)))throw error;state=null}
    if(state)lastState=state;
    if(state?.quiet){if(documentOrigin!==state.origin||!readySince){documentOrigin=state.origin;readySince=Date.now()}
      if(Date.now()-readySince>=1200){ready=state;break}
    }else readySince=0;
    await new Promise(resolve=>setTimeout(resolve,125));
  }
  assert(ready,'No stable hydrated public calendar: '+JSON.stringify(lastState));
  assert(ready.cards>0&&ready.version&&!ready.reduced&&ready.noPreferenceControl,JSON.stringify(ready));
  const target=await browser.evaluate(String.raw`(()=>{
    const cards=[...document.querySelectorAll('#calendarGrid .mini-event[data-evid] .mini-event-main')];
    for(const card of cards){const rect=card.getBoundingClientRect(),x=rect.left+Math.min(20,rect.width/2),y=rect.top+rect.height/2;if(rect.width>10&&y>0&&y<innerHeight&&document.elementFromPoint(x,y)?.closest('.mini-event[data-evid]')===card.closest('.mini-event[data-evid]'))return{x,y}}
    return null;
  })()`);
  assert(target,'A visible calendar card is required');
  async function observe(open,point,reduced=false){
    const sample=browser.evaluate(String.raw`(async()=>{
      const drawer=document.querySelector('#calendarEventDetailsV1'),tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));
      const grid=document.querySelector('#calendarGrid'),before=grid.getBoundingClientRect(),initial=drawer.classList.contains('open');
      const start=performance.now(),positions=[];let duration=null,fadeOnly=true,stableGrid=true,stablePopup=true,origin=null,changed=false;
      while(performance.now()-start<2500){
        const t=await tick(),animation=drawer.getAnimations()[0];
        const g=grid.getBoundingClientRect();stableGrid&&=Math.abs(g.width-before.width)<1&&Math.abs(g.left-before.left)<1;
        changed||=drawer.classList.contains('open')!==initial;
        if(!animation){if(changed)break;continue}
        duration=animation.effect.getTiming().duration;fadeOnly&&=animation.effect.getKeyframes().every(f=>f.transform===undefined&&f.opacity!==undefined);
        const r=drawer.getBoundingClientRect();origin??=r;stablePopup&&=Math.abs(r.left-origin.left)<1&&Math.abs(r.top-origin.top)<1;
        positions.push(Number(getComputedStyle(drawer).opacity));
      }
      const r=drawer.getBoundingClientRect(),selected=document.querySelector('#calendarGrid .event-details-selected-v1')?.getBoundingClientRect();
      return {duration,frames:positions.length,fadeOnly,stableGrid,stablePopup,monotonic:positions.every((v,i)=>!i||(initial?v<=positions[i-1]+.001:v>=positions[i-1]-.001)),settled:!drawer.hidden&&drawer.classList.contains('open'),hidden:drawer.hidden,inViewport:r.left>=11&&r.top>=11&&r.right<=innerWidth-11&&r.bottom<=innerHeight-11,anchored:!!selected&&(r.right<=selected.left||r.left>=selected.right||r.bottom<=selected.top||r.top>=selected.bottom),noTransform:getComputedStyle(drawer).transform==='none'};
    })()`);
    await browser.clickPoint(point.x,point.y);
    const result=await sample;
    assert(result.stableGrid&&result.stablePopup&&result.fadeOnly&&result.noTransform&&result.monotonic&&result.settled===open&&(open?result.inViewport&&result.anchored:result.hidden),JSON.stringify(result));
    assert(reduced?result.duration===null:result.duration===(open?150:110),JSON.stringify(result));
    console.log('MWS_LIVE_CALENDAR_POPOVER_V2',reduced?'reduced':'normal',open?'open':'close',JSON.stringify(result));
  }
  await observe(true,target);
  const closePoint=()=>browser.evaluate(`(()=>{const b=document.getElementById('calendarDetailsCloseV1').getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}})()`);
  const close=await closePoint();
  await observe(false,close);
  await browser.setReducedMotion(true);
  assert(await browser.evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.getElementById('calendarDetailsMotionV6')`));
  await observe(true,target,true);
  await observe(false,await closePoint(),true);
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
