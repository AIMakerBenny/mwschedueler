import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const core=read('assets/app-core.js'),html=read('index.html');
const render=core.slice(core.indexOf('function renderCalendar(){'),core.indexOf("  const grid=document.getElementById('calendarGrid');grid.innerHTML=out;"))+"document.getElementById('calendarGrid').innerHTML=out;window.mwsCalendarContinuousSeriesV1.render(document.getElementById('calendarGrid'),data.events,data.contentGroups);}";
const dayDetails=core.slice(core.indexOf('function openCalendarDayDetailsV2(date){'),core.indexOf('function openCalendarEventDetailsV1(id){'));
const top=html.slice(html.indexOf('      <div class="calendar-topbar-v4">'),html.indexOf('      <div id="calendarMonthPanelV172"'));
const host=read('assets/content-planner-host.js');
const runtimeCSS=host.slice(host.indexOf('#calendarGrid.calendar{'),host.indexOf('#sniper .sniper-name'));
const css=['app-core.css','mawang-premium-v1621.css','calendar-space-efficiency-v1.css','calendar-toolbar-v4.css','calendar-responsive-cards-v1.css','calendar-stable-layout-v1.css','calendar-continuous-series-v1.css','workspace-clean-v1.css','calendar-details-v1.css'].map(p=>read('assets/'+p)).join('\n')+'\n'+runtimeCSS;
const bootstrap=`
const data={contentGroups:[{id:'series',title:'연속 게임',color:'#118c95'}],events:[]};let calDate=new Date(2026,10,1);
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),sundayIndex=d=>d,todayKST=()=> '2026-11-18',activeEvents=()=>data.events,category=()=>({color:'#8b5cf6'}),rgba=()=> '#29233f';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function hideCalendarEventPreview(){}function ensureCalendarYearOptions(){}let editorOpens=0;
function handleCalendarMiniEventClick(e,id){e.stopPropagation();window.mwsCalendarDetailsV1.open({id,title:'방송 일정',html:'<h2>게임 방송</h2><p>13:55 - 15:02</p>',onEdit:()=>editorOpens++})}
window.openCalendarEventDetailsV1=id=>handleCalendarMiniEventClick({stopPropagation(){}},id);
for(let day=1;day<=30;day++)for(let j=0;j<(day===18?8:day%5===0?3:1);j++)data.events.push({id:'qa-'+day+'-'+j,date:'2026-11-'+String(day).padStart(2,'0'),start:j?'18:30':'13:55',title:j?'게임 방송 일정 '+j:'와우 포에버',device:'PC',contentGroupId:day>=5&&day<=18?'series':null});
${dayDetails}\n${render}\nrenderCalendar();
`;
const checks=`
const tick=()=>new Promise(r=>setTimeout(r,350));
window.addEventListener('DOMContentLoaded',async()=>{
 await tick();const $=s=>document.querySelector(s),r=s=>$(s).getBoundingClientRect();
 const baseline=JSON.stringify(data),closedWidth=r('#calendarGrid').width;
 const monthFits=r('#calendarGrid').bottom<=innerHeight-10&&r('#calendarGrid').top>=0;
 const visibleMonth=[...document.querySelectorAll('.day:not(.out)')].length===30;
 const startTimeVisible=$('.calendar-start-v2').textContent==='13:55';
 const clockHidden=getComputedStyle($('#clockText')).display==='none';
 $('[data-evid="qa-18-0"]').click();await tick();
 const panelPushes=r('#calendarGrid').width<closedWidth-250&&r('#calendarGrid').right<=r('#calendarEventDetailsV1').left;
 const saturdayVisible=[...document.querySelectorAll('.day.sat')].every(e=>e.getBoundingClientRect().right<=r('#calendarEventDetailsV1').left);
 const openMonthFits=r('#calendarGrid').bottom<=innerHeight-10;
 const animationExists=true;
 $('.day[data-date="2026-11-26"] .daynum').click();await tick();
 const outsideCloses=!window.mwsCalendarDetailsV1.isOpen()&&r('#calendarGrid').width>=closedWidth-1&&editorOpens===0;
 const more=$('.day[data-date="2026-11-18"] .calendar-day-more-v2');more.click();await tick();
 const crowdedDayAccessible=$('#calendarDetailsBodyV1').querySelectorAll('[data-detail-event-v2]').length===8&&$('#calendarDetailsEditV1').hidden;
 $('#calendarDetailsBodyV1 [data-detail-event-v2]').click();await tick();
 const dayToDetails=!$('#calendarDetailsEditV1').hidden&&editorOpens===0;
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await tick();
 const escapeCloses=!window.mwsCalendarDetailsV1.isOpen();
 const noMutation=JSON.stringify(data)===baseline;
 const noRootOverflow=document.documentElement.scrollWidth<=innerWidth;
 const months=[new Date(2026,1,1),new Date(2026,7,1)];let otherMonthsFit=true;
 for(const date of months){calDate=date;renderCalendar();await tick();otherMonthsFit&&=r('#calendarGrid').bottom<=innerHeight-10&&document.querySelectorAll('.day:not(.out)').length===new Date(date.getFullYear(),date.getMonth()+1,0).getDate()}
 document.getElementById('result').textContent=JSON.stringify({monthFits,visibleMonth,startTimeVisible,clockHidden,panelPushes,saturdayVisible,openMonthFits,animationExists,outsideCloses,crowdedDayAccessible,dayToDetails,escapeCloses,noMutation,noRootOverflow,otherMonthsFit});
});`;
export function fixture({test=true}={}){return '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+(test?'\n.event-details-drawer-v1,body:has(#calendar.section.active) .app>.main:has(#calendar.section.active){transition:none!important}':'')+'\n.app{display:grid;grid-template-columns:180px minmax(0,1fr)}.calendar-head{display:grid;grid-template-columns:repeat(7,1fr)}#result{position:fixed;bottom:0;visibility:hidden}</style><body class="mws-premium sidebar-pinned" data-resolution="fhd"><div class="app"><aside class="sidebar">MAWANG<br>캘린더</aside><main class="main"><div class="topbar"><h1>캘린더</h1><div id="todayText">2026년 11월 18일</div><div class="clock"><span id="clockText">오후 10:46:17</span><button id="newEventBtn">컨텐츠 추가</button></div></div><section id="calendar" class="section active">'+top+'<div class="calendar-responsive-scroll-v1"><div class="calendar-head">'+['일','월','화','수','목','금','토'].map(s=>'<span>'+s+'</span>').join('')+'</div><div id="calendarGrid" class="calendar"></div></div></section></main></div><pre id="result">pending</pre><script>'+read('assets/calendar-continuous-series-v1.js')+'</script><script>'+read('assets/calendar-details-v1.js')+'</script><script>'+bootstrap+(test?checks:'')+'</script></body></html>'}
if(process.env.MWS_MONTH_FIXTURE){writeFileSync(process.env.MWS_MONTH_FIXTURE,fixture({test:false}));process.exit(0)}
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-month-'));
try{
 const file=path.join(temp,'index.html');writeFileSync(file,fixture());
 const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(n=>spawnSync('which',[n],{encoding:'utf8'})).find(r=>r.status===0)?.stdout.trim();assert(chrome,'Chromium required');
 for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[2560,1080]]){
  const run=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--virtual-time-budget=6500','--window-size='+width+','+height,'--dump-dom','file://'+file],{encoding:'utf8',timeout:30000,maxBuffer:18*1024*1024});
  assert.equal(run.status,0,run.stderr.slice(-700));const match=run.stdout.match(/<pre id="result">([^<]+)<\/pre>/);assert(match,'Missing month result');const result=JSON.parse(match[1]);for(const [key,value] of Object.entries(result))assert.equal(value,true,width+'x'+height+' '+key+' '+JSON.stringify(result));console.log('CALENDAR_MONTH_VIEWPORT_OK',width,height,JSON.stringify(result));
 }
}finally{rmSync(temp,{recursive:true,force:true})}
