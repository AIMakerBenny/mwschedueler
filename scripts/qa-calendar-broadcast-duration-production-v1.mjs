import assert from 'node:assert/strict';
import vm from 'node:vm';

const BASE='https://mawang-scheduler.majoku.workers.dev';
async function read(path){
  const url=BASE+path+(path.includes('?')?'&':'?')+'liveDurationSmoke='+Date.now();
  const ctrl=new AbortController();
  const cancel=setTimeout(()=>ctrl.abort(),15000);
  try{
    const res=await fetch(url,{headers:{'cache-control':'no-cache'},signal:ctrl.signal});
    assert.equal(res.status,200,path+' returned '+res.status);
    return await res.text();
  }finally{clearTimeout(cancel)}
}
async function check(){
  const html=await read('/');
  assert(html.includes('assets/calendar-broadcast-duration-v1.js?v=1'),'Production HTML lacks duration calculator');
  assert(html.includes('assets/calendar-broadcast-duration-v1.css?v=1'),'Production HTML lacks duration stylesheet');
  assert(html.includes('id="evBroadcastDurationValueV1"'),'Production HTML lacks event editor duration row');
  const helper=await read('/assets/calendar-broadcast-duration-v1.js');
  const core=await read('/assets/app-core.js');
  const css=await read('/assets/calendar-broadcast-duration-v1.css');
  assert(core.includes('calendar-preview-broadcast-duration-v1'),'Production app core lacks tooltip label');
  assert(core.includes('function updateEventBroadcastDurationPreviewV1('),'Production app core lacks editable time calculation');
  assert(css.includes('.calendar-preview-broadcast-duration-v1'),'Production stylesheet missing duration class');
  const env={};vm.runInNewContext(helper,env);
  assert.equal(env.mwsCalendarBroadcastDurationV1.label('09:22','12:36'),'총 3시간 14분');
  assert.equal(env.mwsCalendarBroadcastDurationV1.label('23:45','01:00'),'총 1시간 15분');
  return {site:BASE,event:'09:22-12:36',duration:'총 3시간 14분',assetsVerified:4};
}
let lastErr=null;
for(let attempt=1;attempt<=12;attempt++){
  try{
    const result=await check();
    console.log('CALENDAR_BROADCAST_DURATION_PRODUCTION_OK',JSON.stringify(result));
    process.exit(0);
  }catch(error){
    lastErr=error;
    console.error('production smoke attempt',attempt,'failed',String(error.message||error));
    if(attempt<12)await new Promise(resolve=>setTimeout(resolve,10000));
  }
}
throw lastErr||new Error('Production duration smoke failed');
