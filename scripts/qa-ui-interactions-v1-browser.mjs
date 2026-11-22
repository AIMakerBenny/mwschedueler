import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-ui-interactions-'));
const file=path.join(dir,'month.html');
let browser;
try{
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('./qa-calendar-month-viewport-v2-browser.mjs',import.meta.url))],{env:{...process.env,MWS_MONTH_FIXTURE:file},encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const fixture=readFileSync(file,'utf8').replace('</style>',read('assets/ui-interactions-v1.css')+'</style>').replace('</body>','<script>'+read('assets/ui-interactions-v1.js')+'</script></body>');
  writeFileSync(file,fixture);
  browser=await launchCalendarBrowser(dir);
  const inspect=String.raw`(()=>{
    const $=s=>document.querySelector(s),card=$('[data-evid="qa-5-0"]'),next=$('[data-evid="qa-6-0"]');
    const rect=el=>{const r=el.getBoundingClientRect();return [r.left,r.top,r.width,r.height]};
    return {card:rect(card),neighbor:rect(next),grid:rect($('#calendarGrid')),width:card.offsetWidth,height:card.offsetHeight,scale:getComputedStyle(card).scale,shadow:getComputedStyle(card).boxShadow,hover:matchMedia('(hover:hover) and (pointer:fine)').matches};
  })()`;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  for(const [w,h,mobile] of [[1366,768,false],[1920,1080,false],[2560,1440,false],[2560,1080,false],[390,844,true],[844,390,true]]){
    await browser.navigate(pathToFileURL(file).href+'?size='+w+'x'+h,w,h,mobile);
    await pause(100);
    const before=await browser.evaluate(inspect);
    assert(before.width>0&&before.height>0,JSON.stringify(before));
    if(!mobile){
      const [x,y,width,height]=before.card;
      await browser.movePoint(x+width/2,y+height/2);await pause(190);
      const hover=await browser.evaluate(inspect);
      assert.equal(hover.scale,'1.02',JSON.stringify(hover));
      assert.equal(hover.width,before.width);assert.equal(hover.height,before.height);
      assert.deepEqual(hover.neighbor,before.neighbor);assert.deepEqual(hover.grid,before.grid);
      await browser.mouseDown(x+width/2,y+height/2);await pause(190);
      assert.equal((await browser.evaluate(inspect)).scale,'0.98');
      await browser.mouseUp(x+width/2,y+height/2);
      await browser.movePoint(2,2);await pause(190);
      assert.equal((await browser.evaluate(inspect)).scale,'none');
    }else{
      assert(!before.hover,'Mobile must not inherit mouse hover treatment');
    }
    console.log('UI_INTERACTIONS_VIEWPORT_OK',w,h,JSON.stringify({mobile,grid:before.grid,card:before.card}));
  }
  await browser.setReducedMotion(true);
  await browser.navigate(pathToFileURL(file).href+'?reduced',1366,768,false);
  const before=await browser.evaluate(inspect);const [x,y,w,h]=before.card;
  await browser.movePoint(x+w/2,y+h/2);await pause(190);
  assert.equal((await browser.evaluate(inspect)).scale,'none');
  console.log('UI_INTERACTIONS_REDUCED_OK');
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
