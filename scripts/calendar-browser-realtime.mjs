import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import path from 'node:path';

// Real-time Chromium over CDP's local pipe; no external npm/browser dependency.
export async function launchCalendarBrowser(dir){
  const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(n=>spawnSync('which',[n],{encoding:'utf8'})).find(r=>r.status===0)?.stdout.trim();
  assert(chrome,'Chromium required');
  const browser=spawn(chrome,[...(process.env.MWS_QA_HEADFUL==='1'?[]:['--headless=new']),'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--disable-background-timer-throttling','--disable-renderer-backgrounding',...(process.env.MWS_QA_OFFLINE==='1'?['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost','--no-proxy-server']:[]),'--remote-debugging-pipe',`--user-data-dir=${path.join(dir,'profile')}`,'about:blank'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
  const pending=new Map();let serial=0,buffer='';
  const fail=error=>{for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(error)}pending.clear()};
  browser.on('error',fail);browser.on('exit',()=>fail(new Error('Chromium exited')));browser.stdio[3].on('error',fail);browser.stdio[4].on('error',fail);
  browser.stdio[4].setEncoding('utf8');browser.stdio[4].on('data',chunk=>{
    buffer+=chunk;let index;
    while((index=buffer.indexOf('\0'))>=0){const message=JSON.parse(buffer.slice(0,index));buffer=buffer.slice(index+1);const entry=pending.get(message.id);if(entry){pending.delete(message.id);clearTimeout(entry.timer);if(message.error)entry.reject(new Error(JSON.stringify(message.error)));else entry.resolve(message.result)}}
  });
  function send(method,params={},sessionId){return new Promise((resolve,reject)=>{
    if(browser.exitCode!==null||browser.signalCode!==null){reject(new Error('Chromium exited'));return}
    const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout: ${method}`))},25000);
    pending.set(id,{resolve,reject,timer});browser.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');
  })}
  async function close(){if(browser.exitCode===null&&browser.signalCode===null){const exited=new Promise(resolve=>browser.once('exit',resolve));browser.kill();await exited}}
  try{
    const {targetId}=await send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
    await send('Target.activateTarget',{targetId});
    const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value};
    async function navigate(url,width,height,mobile=false){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile},sessionId);
      await send('Emulation.setTouchEmulationEnabled',{enabled:mobile},sessionId);
      await send('Page.navigate',{url},sessionId);
      let ready=false;
      for(let retry=0;retry<320&&!ready;retry++){
        try{ready=await evaluate(`location.href===${JSON.stringify(url)}&&document.readyState==='complete'`)}catch{}
        if(!ready)await new Promise(resolve=>setTimeout(resolve,50));
      }
      assert(ready,'Calendar fixture did not initialize');
    }
    async function clickPoint(x,y){
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y},sessionId);
      await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1},sessionId);
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1},sessionId);
    }
    const setReducedMotion=enabled=>send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:enabled?'reduce':'no-preference'}]},sessionId);
    const movePoint=(x,y)=>send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y},sessionId);
    const enablePerformance=()=>send('Performance.enable',{},sessionId);
    const performanceMetrics=async()=>Object.fromEntries((await send('Performance.getMetrics',{},sessionId)).metrics.map(({name,value})=>[name,value]));
    const mouseDown=(x,y)=>send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1},sessionId);
    const mouseDrag=(x,y)=>send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,button:'left',buttons:1},sessionId);
    const mouseUp=(x,y)=>send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',buttons:0,clickCount:1},sessionId);
    const keyPress=async key=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key},sessionId);await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key},sessionId)};
    const captureScreenshot=async()=>{
      const result=await send('Page.captureScreenshot',{format:'jpeg',quality:53,captureBeyondViewport:false},sessionId);
      return result.data;
    };
    const openBackgroundTestTab=async()=>{const other=await send('Target.createTarget',{url:'about:blank'});await send('Target.activateTarget',{targetId:other.targetId})};
    const minimizeWindow=async()=>{
      const {windowId}=await send('Browser.getWindowForTarget',{targetId});
      await send('Browser.setWindowBounds',{windowId,bounds:{windowState:'minimized'}});
      let state;
      for(let i=0;i<50;i++){
        const {bounds}=await send('Browser.getWindowBounds',{windowId});state=bounds.windowState;
        if(state==='minimized')return;
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      assert.equal(state,'minimized');
    };
    const reload=ignoreCache=>send('Page.reload',{ignoreCache},sessionId);
    const sibling=async url=>{
      const {targetId}=await send('Target.createTarget',{url});
      const {sessionId:childSession}=await send('Target.attachToTarget',{targetId,flatten:true});
      const evaluate=async expression=>{
        const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},childSession);
        assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;
      };
      return {targetId,evaluate};
    };
    const closeTarget=id=>send('Target.closeTarget',{targetId:id});
    return {reload,sibling,closeTarget,minimizeWindow,openBackgroundTestTab,navigate,evaluate,clickPoint,movePoint,mouseDown,mouseDrag,mouseUp,keyPress,enablePerformance,performanceMetrics,setReducedMotion,captureScreenshot,close};
  }catch(error){await close();throw error}
}
