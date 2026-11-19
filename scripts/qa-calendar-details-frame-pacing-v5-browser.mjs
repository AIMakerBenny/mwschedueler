import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// The month fixture includes real calendar cards, overflow controls and continuous ribbons.
// Unlike the keyframe regression, this check uses ordinary wall-clock rAF timestamps.
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
      const start=performance.now();action();const synchronousMs=performance.now()-start;
      let entered=false,previous=null,width=null,stableWidth=true,monotonic=true,lastX=null;
      const intervals=[],positions=[];
      while(performance.now()-start<1600){
        const timestamp=await tick(),animation=drawer.getAnimations()[0];
        if(!animation){if(entered)break;continue}
        entered=true;
        const x=new DOMMatrix(getComputedStyle(drawer).transform).m41;
        positions.push(x);if(lastX!==null&&((opening&&x>lastX+1)||(!opening&&x<lastX-1)))monotonic=false;lastX=x;
        if(previous!==null)intervals.push(timestamp-previous);previous=timestamp;
        const w=grid.offsetWidth;if(width!==null&&w!==width)stableWidth=false;width=w;
      }
      const ordered=[...intervals].sort((a,b)=>a-b),round=v=>Math.round(v*10)/10;
      return {synchronousMs:round(synchronousMs),frames:positions.length,distinctPositions:new Set(positions.map(x=>Math.round(x))).size,p95Ms:round(ordered[Math.max(0,Math.ceil(ordered.length*.95)-1)]||0),maxMs:round(Math.max(0,...intervals)),over33Ms:intervals.filter(x=>x>33.5).length,stableWidth,monotonic,settled:opening?!drawer.hidden&&drawer.classList.contains('open'):drawer.hidden};
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
    for(const sample of result){
      assert(sample.settled&&sample.stableWidth&&sample.monotonic&&sample.frames>=8&&sample.distinctPositions>=5,JSON.stringify(sample));
    }
    // CI hosts vary. Record full frame pacing and fail clearly degraded median playback;
    // the logs are also needed when investigating intermittent individual long frames.
    const p95s=result.map(x=>x.p95Ms).sort((a,b)=>a-b);
    assert(p95s[3]<=50,`Sustained frame pacing regression: ${JSON.stringify(result)}`);
    console.log('CALENDAR_FRAME_PACING_V5',width,height,JSON.stringify({cards,ribbons,result}));
  }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
