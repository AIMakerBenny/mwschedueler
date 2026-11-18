import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=file('index.html'),core=file('assets/app-core.js');
const section=html.slice(html.indexOf('<section id="calendar"'),html.indexOf('</section>',html.indexOf('<section id="calendar"'))+10);
const switcher=core.slice(core.indexOf('function setCalendarViewModeV172(mode){'),core.indexOf('function initCalendarSearchV172(){'));
assert(section.includes('id="calendarTimelinePanelV1"'));
assert(switcher.includes('mwsCalendarTimelineV1'));
const css=['assets/app-core.css','assets/calendar-toolbar-v4.css','assets/calendar-timeline-v1.css'].map(file).join('\n');
const js=file('assets/calendar-timeline-v1.js');
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(n=>spawnSync('which',[n],{encoding:'utf8'})).find(x=>x.status===0)?.stdout.trim();
assert(chrome,'Chromium required');
const boot=`
let calendarViewModeV172='month';
const events=[{date:'2026-11-18',steamGame:{name:'WOW',appid:'1'}},{date:'2026-11-18',steamGame:{name:'WOW',appid:'1'}},{date:'2026-11-18',steamGame:{name:'와우 포에버',source:'manual',id:'manual:1'}},{date:'2026-11-19',title:'Not a game'},{date:'2026-12-01',steamGame:{name:'December'}}];
function activeEvents(){return events}
function todayKST(){return '2026-11-18'}
let searchRenders=0;
function renderCalendarSearchResultsV172(){searchRenders++}
${switcher}
const tabs=[...document.querySelectorAll('[data-calendar-view-tab]')];
for(const tab of tabs)tab.addEventListener('click',()=>setCalendarViewModeV172(tab.dataset.calendarViewTab));
const $=id=>document.getElementById(id);
const list=$('calendarTimelineDaysV1'),panel=$('calendarTimelinePanelV1');
const before=JSON.stringify(events);
tabs[1].click();
const days=[...list.children];
const today=days.find(x=>x.dataset.date==='2026-11-18');
const labels=[...today.querySelectorAll('.calendar-timeline-game-v1')].map(x=>x.textContent);
const hasCrossMonth=days.some(x=>x.dataset.date==='2026-12-01');
const compactRows=days.at(0).offsetTop!==days.at(-1).offsetTop;
const noPageOverflow=document.documentElement.scrollWidth<=document.documentElement.clientWidth+2;
const monthHidden=$('calendarMonthPanelV172').hidden&&getComputedStyle(document.querySelector('.calendar-toolbar')).display==='none';
panel.querySelector('[data-timeline-layout="line"]').click();
const oneLine=days.at(0).offsetTop===days.at(-1).offsetTop&&list.scrollWidth>list.clientWidth;
$('calendarTimelineTodayV1').click();
const todayVisible=today.getBoundingClientRect().left>=list.getBoundingClientRect().left&&today.getBoundingClientRect().right<=list.getBoundingClientRect().right;
const noMutation=before===JSON.stringify(events);
events.push({date:'2026-11-18',steamGame:{name:'Live update'}});
window.mwsCalendarTimelineV1.render(activeEvents(),todayKST());
const liveUpdate=list.querySelector('[data-date="2026-11-18"]').textContent.includes('Live update');
tabs[2].click();
const searchWorks=panel.hidden&&!$('calendarSearchPanelV172').hidden&&searchRenders===1;
tabs[0].click();
const monthWorks=panel.hidden&&!$('calendarMonthPanelV172').hidden&&getComputedStyle(document.querySelector('.calendar-toolbar')).display!=='none';
const result={order:tabs.map(x=>x.dataset.calendarViewTab).join(','),labels:labels.join('|'),hasCrossMonth,compactRows,noPageOverflow,monthHidden,oneLine,todayVisible,noMutation,liveUpdate,searchWorks,monthWorks};
document.getElementById('result').textContent=JSON.stringify(result);
`;
const tmp=mkdtempSync(path.join(os.tmpdir(),'mws-timeline-'));
try{
 const p=path.join(tmp,'test.html');
 writeFileSync(p,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'</style></head><body>'+section+'<pre id="result">pending</pre><script>'+js+'</script><script>'+boot+'</script></body></html>');
 for(const width of [1920,1366,700]){
  const run=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--window-size='+width+',1000','--dump-dom','file://'+p],{encoding:'utf8',timeout:30000,maxBuffer:12*1024*1024});
  assert.equal(run.status,0,run.stderr.slice(-900));
  const match=run.stdout.match(/<pre id="result">([^<]+)<\/pre>/);assert(match,'missing browser result');
  const result=JSON.parse(match[1]);
  assert.equal(result.order,'month,timeline,search');assert.equal(result.labels,'WOW|와우 포에버');
  for(const [key,value] of Object.entries(result))if(!['order','labels'].includes(key))assert.equal(value,true,width+' '+key+' '+JSON.stringify(result));
  console.log('CALENDAR_TIMELINE_BROWSER_OK',width,JSON.stringify(result));
 }
}finally{rmSync(tmp,{recursive:true,force:true})}
