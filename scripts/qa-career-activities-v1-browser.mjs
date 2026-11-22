import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-ca-')),file=path.join(temp,'index.html');
const css=['career-timeline.css','career-activities-v1.css'].map(p=>read('assets/'+p)).join('\n');
const scripts=['career-activities-data-v1.js','career-activities-v1.js'].map(p=>`<script>${read('assets/'+p)}</script>`).join('\n');
let browser;
try{
  writeFileSync(file,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>:root{--bg:#111318;--panel:#1a1c24;--text:#fff;--muted:#a8b4c0;--border:#313645;--accent:#8b5cf6}body{margin:0;padding:12px;background:var(--bg);color:var(--text);font:14px sans-serif}${css}</style><section id="careerTimeline" class="section active"><div class="career-tree" hidden></div><div class="cv-panel" id="careerAchievementsPanelV1">기존 업적</div></section><script>const data={events:[{id:'fixture-event',date:'2026-11-20',title:'테스트 캘린더 활동'}]};const todayKST=()=> '2026-11-22';window.openCalendarEventDetailsV1=id=>window.opened=id;</script>${scripts}`);
  browser=await launchCalendarBrowser(temp);
  for(const [w,h] of [[1366,768],[1920,1080],[2560,1440],[2560,1080],[390,844],[844,390]]){
    await browser.navigate(pathToFileURL(file).href+'?'+w,w,h,w<900);
    await browser.setReducedMotion(w<900);
    const initial=await browser.evaluate(`(()=>{document.querySelector('#careerActivitiesTabV1').click();return {rows:document.querySelectorAll('.ca-record').length,active:!document.querySelector('#careerActivitiesPanelV1').hidden,achievement:getComputedStyle(document.querySelector('.cv-panel')).display,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
    assert(initial.rows>10);assert(initial.active);assert.equal(initial.achievement,'none');assert.equal(initial.overflow,false);
    assert.equal(await browser.evaluate(`(()=>{document.querySelector('[data-ca-event=fixture-event]').click();return opened})()`),'fixture-event');
    assert.equal(await browser.evaluate(`(()=>{document.querySelector('[data-ca-year="2020"]').click();return document.querySelectorAll('.ca-record').length})()`),2);
    assert.equal(await browser.evaluate(`(()=>{const s=document.querySelector('.ca-search input');s.value='파블로프';s.dispatchEvent(new Event('input'));return document.querySelectorAll('.ca-record').length})()`),2);
    const all=await browser.evaluate(`(()=>{const s=document.querySelector('.ca-search input');s.value='';s.dispatchEvent(new Event('input'));document.querySelector('[data-ca-year=""]').click();const n=document.querySelectorAll('.ca-record').length;document.querySelector('.ca-more').click();return [n,document.querySelectorAll('.ca-record').length]})()`);
    assert.deepEqual(all,[70,140]);
    if(w<900)assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('.ca-card')).transitionDuration`),'0s');
    assert.equal(await browser.evaluate(`(()=>{document.querySelector('#careerAchievementsTabV1').click();return document.querySelector('#careerActivitiesPanelV1').hidden&&getComputedStyle(document.querySelector('.cv-panel')).display!=='none'})()`),true);
    console.log('CAREER_ACTIVITIES_OK',w,h);
  }
}finally{await browser?.close();rmSync(temp,{recursive:true,force:true})}
