import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-ca-')),file=path.join(temp,'index.html');
const index=read('index.html'),timeline=index.slice(index.indexOf('<section class="section" id="careerTimeline"'),index.indexOf('</section>',index.indexOf('<section class="section" id="careerTimeline"'))+10).replace('class="section"','class="section active"');
const css=['career-timeline.css','calendar-historical-v1.css'].map(p=>read('assets/'+p)).join('\n');
const scripts=['career-activities-data-v1.js','calendar-historical-v1.js','career-visualizer.js'].map(p=>`<script>${read('assets/'+p)}</script>`).join('\n');
let browser;
try{
  writeFileSync(file,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>:root{--bg:#111318;--panel:#1a1c24;--text:#fff;--muted:#a8b4c0;--border:#313645;--accent:#8b5cf6}body{margin:0;padding:12px;background:var(--bg);color:var(--text);font:14px sans-serif}${css}</style><div style="position:relative"><details id="calendarHistoricalMonthV1" class="calendar-historical-month-v1" hidden><summary>일자 미상 <span data-history-count></span></summary><div class="calendar-historical-popover-v1" data-history-list></div></details></div>${timeline}<script>window.mwsMotionReduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches</script>${scripts}`);
  browser=await launchCalendarBrowser(temp);
  for(const [w,h] of [[1366,768],[1920,1080],[2560,1440],[2560,1080],[390,844],[844,390]]){
    await browser.navigate(pathToFileURL(file).href+'?'+w,w,h,w<900);await browser.setReducedMotion(w<900);
    const result=await browser.evaluate(`(()=>{const $=s=>document.querySelector(s);window.mwsCalendarHistoricalV1.render(new Date(2026,10,1),[]);const history=$('#calendarHistoricalMonthV1');history.open=true;const j=$('.cv-junction');j.click();return {history:!history.hidden,records:document.querySelectorAll('.cv-entry').length,selected:!!$('.cv-entry[data-selected=true] details[open]'),pressed:j.getAttribute('aria-pressed'),overflow:document.documentElement.scrollWidth>innerWidth}})()`);
    assert(result.history);assert(result.records>10);assert(result.selected);assert.equal(result.pressed,'true');assert.equal(result.overflow,false);
    assert.equal(await browser.evaluate(`(()=>{const $=s=>document.querySelector(s);if(document.querySelectorAll('.cv-step').length)return false;const year=$('.cv-map-year[aria-label^="2025년"]');if(!year)return false;const before=document.scrollingElement.scrollTop;year.click();return document.scrollingElement.scrollTop!==before})()`),true);
    if(w<900)assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('.cv-junction'),'::before').transitionDuration`),'0s');
    console.log('HISTORICAL_CALENDAR_TIMELINE_OK',w,h);
  }
}finally{await browser?.close();rmSync(temp,{recursive:true,force:true})}
