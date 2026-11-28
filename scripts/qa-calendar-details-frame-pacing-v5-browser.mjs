import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Use the full month fixture to verify bounded compositor motion never moves the grid or the anchor layout.
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-frame-pacing-'));
const fixture=path.join(dir,'month.html');
let browser;
try{
  const generate=spawnSync(process.execPath,[fileURLToPath(new URL('./qa-calendar-month-viewport-v2-browser.mjs',import.meta.url))],{env:{...process.env,MWS_MONTH_FIXTURE:fixture},encoding:'utf8'});
  assert.equal(generate.status,0,generate.stderr);
  browser=await launchCalendarBrowser(dir);
  const frameTest=String.raw`(async()=>{
    const $=s=>document.querySelector(s),grid=$('#calendarGrid'),drawer=$('#calendarEventDetailsV1'),card=$('[data-evid="qa-18-0"]');
    const tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));
    async function measure(action,opening){
      const initial=grid.getBoundingClientRect(),start=performance.now();action();const synchronousMs=performance.now()-start;
      const style=getComputedStyle(drawer),position=[parseFloat(style.left),parseFloat(style.top)];
      let stableWidth=true,stablePosition=true,compositorOnly=true,boundedMotion=true,duration=null;
      const opacity=[],offset=[];
      while(performance.now()-start<1000){
        const timestamp=await tick(),animation=drawer.getAnimations()[0];
        const r=grid.getBoundingClientRect();stableWidth&&=Math.abs(r.width-initial.width)<1&&Math.abs(r.left-initial.left)<1;
        if(!animation)break;
        duration=animation.effect.getTiming().duration;
        compositorOnly&&=animation.effect.getKeyframes().every(frame=>frame.transform===undefined&&frame.opacity!==undefined&&frame.translate!==undefined&&frame.left===undefined&&frame.top===undefined&&frame.width===undefined);
        const p=getComputedStyle(drawer);stablePosition&&=Math.abs(parseFloat(p.left)-position[0])<1&&Math.abs(parseFloat(p.top)-position[1])<1;
        const [dx=0,dy=0]=p.translate==='none'?[0,0]:p.translate.split(' ').map(parseFloat);const distance=Math.hypot(dx,dy);boundedMotion&&=distance<=10.1;offset.push(distance);
        opacity.push(Number(p.opacity));
      }
      return {synchronousMs:Math.round(synchronousMs),duration,frames:opacity.length,stableWidth,stablePosition,compositorOnly,boundedMotion,offsetMonotonic:offset.every((v,i)=>!i||(opening?v<=offset[i-1]+.1:v>=offset[i-1]-.1)),monotonic:opacity.every((v,i)=>!i||(opening?v>=opacity[i-1]-.001:v<=opacity[i-1]+.001)),settled:opening?!drawer.hidden&&drawer.classList.contains('open')&&getComputedStyle(drawer).translate==='none':drawer.hidden};
    }
    await tick();await tick();const result=[];
    for(let i=0;i<3;i++){
      result.push(await measure(()=>card.click(),true));await tick();await tick();
      result.push(await measure(()=>$('#calendarDetailsCloseV1').click(),false));await tick();await tick();
    }
    return {cards:grid.querySelectorAll('.mini-event').length,ribbons:grid.querySelectorAll('.calendar-continuous-ribbon-v1').length,result};
  })()`;
  for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[2560,1080]]){
    await browser.navigate(pathToFileURL(fixture).href+'?size='+width+'x'+height,width,height);
    const {cards,ribbons,result}=await browser.evaluate(frameTest);
    assert(cards>=40&&ribbons>=3,'Realistic month fixture required');
    for(const [i,sample] of result.entries()){
      assert(sample.settled&&sample.stableWidth&&sample.stablePosition&&sample.compositorOnly&&sample.boundedMotion&&sample.offsetMonotonic&&sample.monotonic&&sample.duration===(i%2?140:240)&&sample.frames>=1,JSON.stringify(sample));
    }
    console.log('CALENDAR_POPOVER_STABLE_V2',width,height,JSON.stringify({cards,ribbons,result}));
  }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
