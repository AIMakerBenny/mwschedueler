import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

// The month fixture includes real calendar cards, overflow controls and continuous ribbons.
// Unlike the keyframe regression, this check uses ordinary wall-clock rAF timestamps.
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-frame-pacing-'));
const fixture=path.join(dir,'month.html');
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(n=>spawnSync('which',[n],{encoding:'utf8'})).find(r=>r.status===0)?.stdout.trim();
let browser;
try{
  assert(chrome,'Chromium required');
  const generate=spawnSync(process.execPath,[fileURLToPath(new URL('./qa-calendar-month-viewport-v2-browser.mjs',import.meta.url))],{env:{...process.env,MWS_MONTH_FIXTURE:fixture},encoding:'utf8'});
  assert.equal(generate.status,0,generate.stderr);
  browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--remote-debugging-pipe',`--user-data-dir=${path.join(dir,'profile')}`,'about:blank'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
  const pending=new Map();let serial=0,buffer='';
  browser.stdio[4].setEncoding('utf8');browser.stdio[4].on('data',chunk=>{
    buffer+=chunk;let index;
    while((index=buffer.indexOf('\0'))>=0){const message=JSON.parse(buffer.slice(0,index));buffer=buffer.slice(index+1);const entry=pending.get(message.id);if(entry){pending.delete(message.id);clearTimeout(entry.timer);if(message.error)entry.reject(new Error(JSON.stringify(message.error)));else entry.resolve(message.result)}}
  });
  function send(method,params={},sessionId){return new Promise((resolve,reject)=>{
    const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout: ${method}`))},20000);
    pending.set(id,{resolve,reject,timer});browser.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');
  })}
  const {targetId}=await send('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  await send('Target.activateTarget',{targetId});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value};
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
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
    await send('Page.navigate',{url:pathToFileURL(fixture).href},sessionId);
    let ready=false;
    for(let retry=0;retry<80&&!ready;retry++){
      try{ready=await evaluate(`Boolean(document.readyState==='complete'&&document.querySelector('#calendarEventDetailsV1')&&document.querySelector('[data-evid="qa-18-0"]'))`)}catch{}
      if(!ready)await new Promise(resolve=>setTimeout(resolve,50));
    }
    assert(ready,'Calendar fixture did not initialize');
    const {cards,ribbons,result}=await evaluate(frameTest);
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
}finally{if(browser&&browser.exitCode===null&&browser.signalCode===null){browser.kill();await new Promise(resolve=>browser.once('exit',resolve))}rmSync(dir,{recursive:true,force:true})}
