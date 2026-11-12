/* Read-only deployed Cloudflare smoke for continuous calendar ribbons.
 * Does not log in, write contacts, save events, or alter persisted user data.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';

const BASE='https://mawang-scheduler.majoku.workers.dev';
async function get(path){
  const url=BASE+path+(path.includes('?')?'&':'?')+'seriesSmoke='+Date.now();
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
  try{
    const res=await fetch(url,{headers:{'cache-control':'no-cache'},signal:ctrl.signal});
    assert.equal(res.status,200,'HTTP '+res.status+' for '+path);
    return res.text();
  }finally{clearTimeout(timer)}
}
async function probe(){
  const html=await get('/');
  assert(html.includes('assets/calendar-continuous-series-v1.css?v=1'),'HTML stylesheet missing');
  assert(html.includes('assets/calendar-continuous-series-v1.js?v=1'),'HTML script missing');
  const js=await get('/assets/calendar-continuous-series-v1.js');
  const css=await get('/assets/calendar-continuous-series-v1.css');
  const core=await get('/assets/app-core.js');
  assert(css.includes('.calendar-continuous-ribbon-v1'),'CSS ribbon missing');
  assert(core.includes('window.mwsCalendarContinuousSeriesV1?.render(grid,activeEvents(),data.categories);'),'Calendar rendering hook missing');
  const env={};vm.runInNewContext(js,env);
  const dates=['05','06','07','08','09','10','11','12'];
  const input=dates.map(d=>({title:'와우 포에버',categoryId:'gaming',color:'#0f8c95',date:'2026-11-'+d}));
  const result=env.mwsCalendarContinuousSeriesV1.streaks(input);
  assert.equal(result.length,1);
  assert.equal(result[0].totalDays,8);
  console.log('CALENDAR_CONTINUOUS_SERIES_PRODUCTION_OK '+JSON.stringify({
    site:BASE,title:result[0].title,start:result[0].start,end:result[0].end,
    totalDays:result[0].totalDays,assets:['HTML','script','stylesheet','app-core']
  }));
}
let lastError=null;
for(let i=1;i<=18;i++){
  try{await probe();process.exit(0)}
  catch(error){
    lastError=error;
    console.log('Calendar production verification attempt',i,String(error.message||error));
    if(i<18)await new Promise(resolve=>setTimeout(resolve,10000));
  }
}
throw lastError||new Error('Live calendar series not ready');
