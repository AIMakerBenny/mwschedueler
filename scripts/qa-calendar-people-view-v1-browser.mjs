import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html'),core=read('assets/app-core.js');
const panel=index.slice(index.indexOf('      <div id="calendarPeoplePanelV1"'),index.indexOf('      <div id="calendarSearchPanelV172"'));
const tabs=index.slice(index.indexOf('<div class="calendar-view-tabs-v172"'),index.indexOf('        <div class="toolbar calendar-toolbar"'));
const css=['app-core.css','calendar-details-v1.css','calendar-people-view-v1.css'].map(p=>read('assets/'+p)).join('\n');
const mode=core.slice(core.indexOf('function setCalendarViewModeV172(mode){'),core.indexOf('function initCalendarSearchV172(){'));
const data={selfContactId:'self',contacts:[{id:'self',name:'마왕'},{id:'a',name:'테스트 인물 A'},{id:'b',name:'테스트 인물 B'}],todayPeopleManualByDate:{'2026-11-02':['b']},events:[{id:'event1',date:'2026-11-01',start:'09:00',title:'같이한 콘텐츠',participants:['self','a','a']},{id:'event2',date:'2026-11-01',start:'18:00',title:'두번째 콘텐츠',participants:['a','b']},{id:'event3',date:'2026-12-01',title:'다음 달 콘텐츠',participants:['b']}]};
const script=`const data=${JSON.stringify(data)};let calDate=new Date(2026,10,1),calendarViewModeV172='month';const todayKST=()=> '2026-11-01',activeEvents=()=>data.events;function renderCalendarSearchResultsV172(){};${mode};document.querySelectorAll('[data-calendar-view-tab]').forEach(b=>b.onclick=()=>setCalendarViewModeV172(b.dataset.calendarViewTab));window.openCalendarEventDetailsV1=(id,anchor)=>window.opened=[id,anchor.dataset.cpEvent];window.openTodayPeoplePicker=date=>window.picked=date;`;
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-people-')),file=path.join(temp,'index.html');
let browser;
try{
 writeFileSync(file,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0;padding:12px;box-sizing:border-box}#calendar{width:100%;min-width:0}.calendar-view-tabs-v172{flex-wrap:wrap}</style><body data-theme="neon"><h1 id="pageTitle">캘린더</h1><section id="calendar" class="section active">${tabs}<div data-calendar-view-panel="month">달력</div>${panel}<div data-calendar-view-panel="timeline" hidden>게임</div><div data-calendar-view-panel="search" hidden>검색</div></section><script>${read('assets/calendar-people-view-v1.js')}</script><script>${script}</script></body>`);
 browser=await launchCalendarBrowser(temp);
 for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[2560,1080],[390,844],[844,390]]){
   await browser.navigate(pathToFileURL(file).href+'?'+width+'x'+height,width,height,width<900);
   const initial=await browser.evaluate(`(()=>{document.querySelector('[data-calendar-view-tab=people]').click();const p=document.querySelector('#calendarPeoplePanelV1');return {active:!p.hidden,days:p.querySelectorAll('.cp-day').length,persons:p.querySelectorAll('.cp-person').length,events:p.querySelectorAll('.cp-event').length,manual:p.querySelectorAll('.cp-manual').length,summary:p.querySelector('#calendarPeopleMonthSummaryV1').innerText,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
   assert.equal(initial.active,true);assert.equal(initial.days,2);assert.equal(initial.persons,3);assert.equal(initial.events,3);assert.equal(initial.manual,1);assert.match(initial.summary,/2일 · 2명 · 콘텐츠 2개/);assert.equal(initial.overflow,false);
   assert.deepEqual(await browser.evaluate(`(()=>{document.querySelector('[data-cp-event=event1]').click();return opened})()`),['event1','event1']);
   assert.equal(await browser.evaluate(`(()=>{document.querySelector('[data-cp-date]').click();return picked})()`),'2026-11-01');
   assert.equal(await browser.evaluate(`(()=>{document.querySelector('[data-cp-person=a]').click();return document.querySelectorAll('.cp-person').length})()`),1);
   assert.match(await browser.evaluate(`(()=>{calDate=new Date(2026,11,1);setCalendarViewModeV172('people');return document.querySelector('#calendarPeopleDaysV1').innerText})()`),/기록된 만남이 없습니다/);
   assert.match(await browser.evaluate(`(()=>{const select=document.querySelector('#calendarPeopleFilterV1');select.value='';select.dispatchEvent(new Event('change'));return document.querySelector('#calendarPeopleDaysV1').innerText})()`),/다음 달 콘텐츠/);
   assert.equal(await browser.evaluate(`(()=>{document.querySelector('[data-calendar-view-tab=month]').click();return document.querySelector('#calendarPeoplePanelV1').hidden})()`),true);
   console.log('CALENDAR_PEOPLE_VIEW_OK',width,height);
 }
}finally{await browser?.close();rmSync(temp,{recursive:true,force:true})}
