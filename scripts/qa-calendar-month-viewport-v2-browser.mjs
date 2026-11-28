import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
import os from 'node:os';
import path from 'node:path';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const core=read('assets/app-core.js'),html=read('index.html');
const render=core.slice(core.indexOf('function renderCalendar(){'),core.indexOf("  const grid=document.getElementById('calendarGrid');grid.innerHTML=out;"))+"document.getElementById('calendarGrid').innerHTML=out;window.mwsCalendarContinuousSeriesV1.render(document.getElementById('calendarGrid'),data.events,data.contentGroups);}";
const dayDetails=core.slice(core.indexOf('function openCalendarDayDetailsV2(date){'),core.indexOf('function openCalendarEventDetailsV1(id){'));
const top=html.slice(html.indexOf('      <div class="calendar-topbar-v4">'),html.indexOf('      <div id="calendarMonthPanelV172"'));
const globalTop=html.slice(html.indexOf('    <div class="topbar">'),html.indexOf('\n<section id="dashboard"'));
const copyTray=html.slice(html.indexOf('<div id="calendarCopyTray"'),html.indexOf('\n      </div>\n\n      <div id="calendarTimelinePanelV1"'));
const copyDnd=core.slice(core.indexOf('function initCalendarCopyTrayDnD(){'),core.indexOf('let calendarCtrlCopyMode=false;'));
const copyPointerTarget=core.slice(core.indexOf('function setCalendarPointerEventTargetV174('),core.indexOf('function activateCalendarPointerEventDragV174('));
const host=read('assets/content-planner-host.js');
const runtimeCSS=host.slice(host.indexOf('#calendarGrid.calendar{'),host.indexOf('#sniper .sniper-name'));
const css=['app-core.css','mawang-premium-v1621.css','calendar-space-efficiency-v1.css','calendar-toolbar-v4.css','calendar-responsive-cards-v1.css','calendar-stable-layout-v1.css','calendar-continuous-series-v1.css','workspace-clean-v1.css','calendar-details-v1.css','calendar-drag-layout-fix.css','calendar-day-expand-v1.css','calendar-people-view-v1.css','topbar-context-v1.css','mawang-archive-header-v1.css','calendar-search-v173.css'].map(p=>read('assets/'+p)).join('\n')+'\n'+runtimeCSS;
assert(!read('assets/calendar-details-v1.js').includes('calendar-details-open-v2'),'Popover cannot resize the calendar');
const bootstrap=`
const data={contentGroups:[{id:'series',name:'연속 게임',color:'#118c95'}],events:[],contacts:[{id:'qa-person',name:'테스트 참가자'}],todayPeopleByDate:{'2026-11-26':['qa-person']}};let calDate=new Date(2026,10,1);
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),sundayIndex=d=>d,todayKST=()=> '2026-11-18',activeEvents=()=>data.events,category=()=>({color:'#8b5cf6'}),rgba=()=> '#29233f';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function hideCalendarEventPreview(){}function ensureCalendarYearOptions(){}let editorOpens=0;
let calendarDragPayload=null,calendarPointerEventDragV174=null,copiedId='';function addEventToCalendarClipboard(id){copiedId=id}
${copyDnd}\n${copyPointerTarget}\ninitCalendarCopyTrayDnD();
function handleCalendarMiniEventClick(e,id){e.stopPropagation();window.mwsCalendarDetailsV1.open({id,title:'방송 일정',html:'<h2>게임 방송</h2><p>13:55 - 15:02</p>',onEdit:()=>editorOpens++})}
window.openCalendarEventDetailsV1=id=>handleCalendarMiniEventClick({stopPropagation(){}},id);
for(let day=1;day<=30;day++)for(let j=0;j<(day===18?8:day%5===0?3:1);j++)data.events.push({id:'qa-'+day+'-'+j,date:'2026-11-'+String(day).padStart(2,'0'),start:j?'18:30':'13:55',title:j?'게임 방송 일정 '+j:'와우 포에버',device:day===18&&j%2===0||day===5&&j===1||day===3?'VR':day===1?'비방':day===2?'':'PC',restDay:day===3,contentGroupId:day>=5&&day<=18?'series':null});
${dayDetails}\n${render}\nrenderCalendar();window.openTodayPeoplePicker=date=>window.qaPeoplePickerDate=date;
${read('assets/calendar-today-people-hover-v1.js')}
`;
const checks=`
const tick=()=>new Promise(r=>setTimeout(r,600));
window.addEventListener('DOMContentLoaded',async()=>{
 await tick();const $=s=>document.querySelector(s),r=s=>$(s).getBoundingClientRect();
 const baseline=JSON.stringify(data),closedWidth=r('#calendarGrid').width;
 const monthFits=r('#calendarGrid').bottom<=innerHeight-10&&r('#calendarGrid').top>=0;
 const visibleMonth=[...document.querySelectorAll('.day:not(.out)')].length===30;
 const monthNoScroll=document.documentElement.scrollHeight<=innerHeight+2;
 const toolbarIcons=[...document.querySelectorAll('.calendar-topbar-v4 button:not(#calendarQuickSearchClearV174)')].every(b=>getComputedStyle(b,'::before').maskImage!=='none'&&getComputedStyle(b).fontSize==='0px'&&b.textContent.trim());
 const add=$('#newEventBtn'),addCSS=getComputedStyle(add),addIcon=getComputedStyle(add,'::before'),addBox=r('#newEventBtn'),addBorderX=parseFloat(addCSS.borderLeftWidth),addBorderY=parseFloat(addCSS.borderTopWidth);
 const centeredAdd=addIcon.position==='absolute'&&addIcon.maskImage!=='none'&&Math.abs(addBorderX+parseFloat(addIcon.left)-addBox.width/2)<1&&Math.abs(addBorderY+parseFloat(addIcon.top)-addBox.height/2)<1&&addIcon.transform==='matrix(1, 0, 0, 1, -9.5, -9.5)';
 const quick=$('#calendarQuickSearchV174'),quickClear=$('#calendarQuickSearchClearV174'),searchTab=$('[data-calendar-view-tab="search"]'),quickRect=quick.getBoundingClientRect(),searchRect=searchTab.getBoundingClientRect();
 const quickSearchFits=quickRect.width>=85&&quickRect.left>=searchRect.right-1&&quickRect.left-searchRect.right<=24&&Math.abs((quickRect.top+quickRect.bottom-searchRect.top-searchRect.bottom)/2)<=3&&quickClear.hidden&&!!quickClear.querySelector('svg')&&quickClear.getAttribute('aria-label')==='검색어 지우기';
 const headerControls=[...document.querySelectorAll('#pageTitle,.calendar-topbar-v4 button,.calendar-topbar-v4 select,#calendarQuickSearchV174,.topbar .sync-status,#newEventBtn')].filter(el=>el.getBoundingClientRect().width>0);
 const centerY=box=>box.top+box.height/2,headerBox=r('.topbar');
 const singleHeader=headerBox.height<=45&&headerControls.every(el=>Math.abs(centerY(el.getBoundingClientRect())-centerY(addBox))<=3)&&r('.calendar-head').top>=headerBox.bottom-1&&r('.calendar-head').top-headerBox.bottom<=10;
 const headerNoOverlap=headerControls.map(el=>el.getBoundingClientRect()).sort((a,b)=>a.left-b.left).every((box,i,all)=>i===0||box.left>=all[i-1].right-1);
 const headerClickable=headerControls.filter(el=>el.matches('button,select,input')).every(el=>{const box=el.getBoundingClientRect();return el.contains(document.elementFromPoint(box.left+box.width/2,centerY(box)))});
 const headerGeometry={height:headerBox.height,top:headerBox.top,bottom:headerBox.bottom,dayHeadTop:r('.calendar-head').top,centers:headerControls.map(el=>[el.id||el.className,centerY(el.getBoundingClientRect())])};
 const tray=$('#calendarCopyTray'),trayButton=$('#calendarCopyTrayToggleV4'),gridBefore=r('#calendarGrid');
 const trayInitiallyClosed=getComputedStyle(tray).display==='none'&&trayButton.getAttribute('aria-expanded')==='false';
 trayButton.click();await tick();
 const trayBox=r('#calendarCopyTray'),gridAfter=r('#calendarGrid');
 const trayOpensWithoutResize=getComputedStyle(tray).position==='fixed'&&trayButton.getAttribute('aria-expanded')==='true'&&trayBox.top>=r('#calendarCopyTrayToggleV4').bottom&&trayBox.right<=innerWidth&&trayBox.bottom<=innerHeight&&Math.abs(gridBefore.height-gridAfter.height)<1&&Math.abs(gridBefore.top-gridAfter.top)<1;
 document.body.classList.add('calendar-pointer-template-dragging');
 const trayDragPassThrough=getComputedStyle(tray).pointerEvents==='none'&&getComputedStyle(tray).position==='fixed';
 document.body.classList.remove('calendar-pointer-template-dragging');
 $('#calendarCopyTrayCloseV4').click();
 const trayCloses=getComputedStyle(tray).display==='none'&&trayButton.getAttribute('aria-expanded')==='false';
 const transfer=new DataTransfer();transfer.setData('application/x-mawang-calendar-event','qa-26-0');trayButton.dispatchEvent(new DragEvent('drop',{dataTransfer:transfer,bubbles:true,cancelable:true}));
 const trayNativeDrop=copiedId==='qa-26-0';
 const ghost=document.createElement('div');ghost.style.pointerEvents='none';document.body.append(ghost);calendarPointerEventDragV174={dragging:true,ghost,targetDay:null,targetTray:null};
 const buttonBox=trayButton.getBoundingClientRect();setCalendarPointerEventTargetV174(buttonBox.left+buttonBox.width/2,buttonBox.top+buttonBox.height/2);
 const trayPointerDrop=calendarPointerEventDragV174.targetTray===trayButton;trayButton.classList.remove('drag-over');ghost.remove();calendarPointerEventDragV174=null;
 const startTimeVisible=$('.calendar-start-v2').textContent==='13:55';
 const clockHidden=getComputedStyle($('#clockText')).display==='none';
 const shortList=$('.day[data-date="2026-11-26"] .calendar-day-events-v2'),crowdedList=$('.day[data-date="2026-11-18"] .calendar-day-events-v2');
 const emptyList=$('.day[data-date="2026-12-02"] .calendar-day-events-v2');
 const shortListDoesNotFillBlankSpace=shortList.scrollHeight<=shortList.clientHeight+2&&shortList.getBoundingClientRect().bottom<r('.day[data-date="2026-11-26"]').bottom-34;
 const emptyListDoesNotCaptureBlankSpace=emptyList.getBoundingClientRect().height<=2;
 const crowdedListStillScrolls=crowdedList.scrollHeight>crowdedList.clientHeight+2;
 crowdedList.scrollTop=24;const crowdedListMoves=crowdedList.scrollTop>0;crowdedList.scrollTop=0;
 const geometry=()=>[...document.querySelectorAll('#calendarGrid .day')].map(d=>{const b=d.getBoundingClientRect();return [b.x,b.y,b.width,b.height]});
 const gridGeometry=JSON.stringify(geometry()),baseList=crowdedList.getBoundingClientRect(),baseDay=crowdedList.closest('.day').getBoundingClientRect();
 const mouseOver=node=>node.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse',relatedTarget:document.body}));
 const mouseOut=node=>node.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,pointerType:'mouse',relatedTarget:document.body}));
 mouseOver(crowdedList);await tick();
 const expandedList=crowdedList.getBoundingClientRect();
 const hoverExpands=crowdedList.classList.contains('mws-day-list-expand-v1')&&expandedList.height>baseList.height+2&&expandedList.bottom>baseDay.bottom+2;
 const hoverTracksFixed=JSON.stringify(geometry())===gridGeometry;
 const revealed=[...crowdedList.querySelectorAll('.mini-event')].find(el=>{const b=el.getBoundingClientRect();return Math.min(b.bottom,expandedList.bottom)-Math.max(b.top,baseList.bottom)>3});
 const hoverRevealsCard=!!revealed&&(()=>{const b=revealed.getBoundingClientRect();return revealed.contains(document.elementFromPoint(b.left+b.width/2,(Math.max(b.top,baseList.bottom)+Math.min(b.bottom,expandedList.bottom))/2))})();
 mouseOut(crowdedList);await tick();
 const hoverCollapses=!crowdedList.classList.contains('mws-day-list-expand-v1')&&Math.abs(crowdedList.getBoundingClientRect().height-baseList.height)<1&&JSON.stringify(geometry())===gridGeometry;
 mouseOver(shortList);await tick();const hoverShortUnchanged=!shortList.classList.contains('mws-day-list-expand-v1');mouseOut(shortList);
 const pageScrollCanChain=[shortList,crowdedList,emptyList].every(node=>getComputedStyle(node).overscrollBehaviorY==='auto');
 const ordinaryCard=$('[data-evid="qa-26-0"]');
 const cardCSS=getComputedStyle(ordinaryCard);
 const matteCard=cardCSS.backgroundImage==='none'&&cardCSS.boxShadow!=='none'&&!cardCSS.boxShadow.includes('inset')&&cardCSS.transform==='none'&&cardCSS.borderLeftWidth==='3px'&&cardCSS.borderTopWidth==='0px'&&cardCSS.borderRightWidth==='0px';
 const ribbonCSS=getComputedStyle($('.calendar-continuous-ribbon-v1'));
 const ribbonClean=ribbonCSS.boxShadow==='none'&&ribbonCSS.backgroundImage==='none'&&ribbonCSS.height==='8px';
 const eventMain=ordinaryCard.querySelector('.mini-event-main'),eventTime=ordinaryCard.querySelector('time'),eventTitle=ordinaryCard.querySelector('.calendar-card-title-v2'),eventSlot=ordinaryCard.querySelector('.mws-steam-slot-v111');
 const day=ordinaryCard.closest('.day'),dayStyle=getComputedStyle(day),contentWidth=day.clientWidth-parseFloat(dayStyle.paddingLeft)-parseFloat(dayStyle.paddingRight);
 const timeBox=eventTime.getBoundingClientRect(),titleBox=eventTitle.getBoundingClientRect(),slotBox=eventSlot.getBoundingClientRect(),mainBox=eventMain.getBoundingClientRect();
 const wide=contentWidth>=215,adaptiveCard=wide?getComputedStyle(eventMain).flexDirection==='row'&&titleBox.left>=timeBox.right&&Math.abs(timeBox.top-titleBox.top)<=3:getComputedStyle(eventMain).flexDirection==='column'&&titleBox.top>=timeBox.bottom;
 const readableCard=eventTime.textContent==='13:55'&&eventTitle.textContent==='와우 포에버'&&Number(getComputedStyle(eventTime).fontWeight)<Number(getComputedStyle(eventTitle).fontWeight)&&getComputedStyle(eventTime).color!==getComputedStyle(eventTitle).color&&mainBox.right<=slotBox.left+1&&slotBox.width===24&&slotBox.height===24&&Math.abs(centerY(slotBox)-centerY(ordinaryCard.getBoundingClientRect()))<=1;
 const dateOffsets=[...document.querySelectorAll('#calendarGrid .day')].map(d=>{const box=d.getBoundingClientRect(),num=d.querySelector('.calendar-date-number-v3').getBoundingClientRect();return Math.abs(num.left+num.width/2-(box.left+box.width/2))});
 const fixedDateAlignment=dateOffsets.every(offset=>offset<=1)&&!$('.day[data-date="2026-11-18"] .calendar-day-more-v2').hidden;
 const badgeCards=[...document.querySelectorAll('#calendarGrid .mini-event[data-evid]')];
 const vrCards=badgeCards.filter(el=>el.querySelector('.calendar-vr-badge-v1'));
 const vrBadgeOnly=vrCards.length===5&&badgeCards.every(el=>Boolean(el.querySelector('.calendar-vr-badge-v1'))===data.events.some(e=>e.id===el.dataset.evid&&!e.restDay&&e.device==='VR'))&&vrCards.every(el=>el.getAttribute('aria-label').includes(' VR '));
 const vrBadgeLayout=vrCards.every(el=>{const badge=el.querySelector('.calendar-vr-badge-v1'),slot=el.querySelector('.mws-steam-slot-v111'),main=el.querySelector('.mini-event-main'),b=badge.getBoundingClientRect(),s=slot.getBoundingClientRect(),m=main.getBoundingClientRect(),style=getComputedStyle(badge);return badge.textContent==='VR'&&b.width===20&&b.height===20&&style.borderRadius==='50%'&&style.pointerEvents==='none'&&b.right<=s.left-2&&m.right<=b.left+1&&Math.abs(centerY(b)-centerY(s))<=1&&Math.abs(centerY(b)-centerY(el.getBoundingClientRect()))<=1});
 const groupedCard=$('[data-evid="qa-5-0"]'),groupAccent=getComputedStyle(groupedCard).borderLeftColor!==cardCSS.borderLeftColor&&getComputedStyle(groupedCard).outlineStyle==='none';
 const shadowGutter=Number.parseFloat(getComputedStyle(shortList).paddingInlineStart)>=3&&Number.parseFloat(getComputedStyle(shortList).paddingBottom)>=5;
 const preview=document.createElement('div');preview.id='calendarEventPreview';preview.className='calendar-event-preview open';document.body.append(preview);
 const alpha=color=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return ctx.getImageData(0,0,1,1).data[3]};
 const previewCSS=getComputedStyle(preview);
 const translucentPreview=alpha(previewCSS.backgroundColor)>=223&&alpha(previewCSS.backgroundColor)<=225&&previewCSS.backdropFilter==='none'&&previewCSS.boxShadow!=='none';
 preview.remove();
 $('[data-evid="qa-18-0"]').click();await tick();
 const popoverCSS=getComputedStyle($('#calendarEventDetailsV1'));
 const translucentPopover=alpha(popoverCSS.backgroundColor)>=223&&alpha(popoverCSS.backgroundColor)<=225&&popoverCSS.backdropFilter==='none'&&popoverCSS.opacity==='1'&&popoverCSS.boxShadow!=='none';
 const gridPaint=getComputedStyle($('#calendarGrid')),dayPaint=getComputedStyle($('.day:not(.out)'));
 const atmosphericGrid=gridPaint.backgroundColor==='rgb(12, 14, 18)'&&gridPaint.backgroundImage.includes('data:image/svg+xml')&&gridPaint.backgroundSize.includes('cover')&&dayPaint.backgroundColor==='rgba(12, 14, 18, 0.48)'&&dayPaint.backgroundImage.includes('linear-gradient');
 // A light theme retains an opaque date surface and has no landscape asset.
 const originalTheme=document.body.dataset.theme;document.body.dataset.theme='light';
 const alternateOpaque=!getComputedStyle($('#calendarGrid')).backgroundImage.includes('data:image/svg+xml')&&!getComputedStyle($('.day:not(.out)')).backgroundColor.startsWith('rgba(');
 document.body.dataset.theme=originalTheme;
 const panelPushes=Math.abs(r('#calendarGrid').width-closedWidth)<1&&getComputedStyle($('.app>.main')).transform==='none';
 const popup=r('#calendarEventDetailsV1'),card=r('[data-evid="qa-18-0"]');
 const saturdayVisible=popup.left>=11&&popup.right<=innerWidth-11&&popup.top>=11&&popup.bottom<=innerHeight-11&&(popup.right<=card.left||popup.left>=card.right);
 const dateButton=$('.day[data-date="2026-11-26"] [data-calendar-people-date]'),beforeHover=r('.day[data-date="2026-11-26"]');
 dateButton.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));
 const tip=$('#calendarPeopleHoverV1');const peopleHover=tip&&!tip.hidden&&tip.textContent.includes('테스트 참가자')&&r('.day[data-date="2026-11-26"]').height===beforeHover.height;
 dateButton.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,pointerType:'mouse',relatedTarget:document.body}));
 const peopleHide=tip?.hidden;dateButton.click();const peopleEdit=window.qaPeoplePickerDate==='2026-11-26';
 const participantRailClear=!$('.ohamsa-calendar-strip-local-v2')&&parseFloat(getComputedStyle(day).paddingBottom)<=5&&peopleHover&&peopleHide&&peopleEdit;
 const ribbonsKept=document.querySelectorAll('.calendar-continuous-ribbon-v1').length>=3;
 const openMonthFits=r('#calendarGrid').bottom<=innerHeight-10;
 
 $('.day[data-date="2026-11-26"] .daynum').click();await tick();
 const outsideCloses=!window.mwsCalendarDetailsV1.isOpen()&&r('#calendarGrid').width>=closedWidth-1&&editorOpens===0;
 const more=$('.day[data-date="2026-11-18"] .calendar-day-more-v2');more.click();await tick();
 const crowdedDayAccessible=$('#calendarDetailsBodyV1').querySelectorAll('[data-detail-event-v2]').length===8&&$('#calendarDetailsEditV1').hidden;
 $('#calendarDetailsBodyV1 [data-detail-event-v2]').click();await tick();
 const dayToDetails=!$('#calendarDetailsEditV1').hidden&&editorOpens===0;
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await tick();
 const escapeCloses=!window.mwsCalendarDetailsV1.isOpen();
 // Reopening while the previous detail is leaving must never hide the new panel.
 $('[data-evid="qa-18-0"]').click();
 const detailShell=$('#calendarEventDetailsV1');
 window.mwsCalendarDetailsV1.close({restoreFocus:false});
 const closingInert=detailShell.inert&&detailShell.getAttribute('aria-hidden')==='true';
 $('[data-evid="qa-5-0"]').click();await tick();
 const detailRect=detailShell.getBoundingClientRect(),detailStyle=getComputedStyle(detailShell);
 const rapidDetailReopen=closingInert&&detailShell===$('#calendarEventDetailsV1')&&!detailShell.hidden&&!detailShell.inert&&window.mwsCalendarDetailsV1.isOpen()&&$('[data-evid="qa-5-0"]').classList.contains('event-details-selected-v1')&&detailStyle.opacity==='1'&&detailStyle.translate==='none'&&detailRect.left>=11&&detailRect.right<=innerWidth-11&&Math.abs(r('#calendarGrid').width-closedWidth)<1;
 window.mwsCalendarDetailsV1.close();await tick();
 const detailExitSettled=detailShell.hidden&&detailShell.inert&&!window.mwsCalendarDetailsV1.isOpen();
 const noMutation=JSON.stringify(data)===baseline;
 const noRootOverflow=document.documentElement.scrollWidth<=innerWidth;
 const months=[new Date(2026,1,1),new Date(2026,7,1)];let otherMonthsFit=true;
 for(const date of months){calDate=date;renderCalendar();await tick();otherMonthsFit&&=r('#calendarGrid').bottom<=innerHeight-10&&document.querySelectorAll('.day:not(.out)').length===new Date(date.getFullYear(),date.getMonth()+1,0).getDate()}
 document.getElementById('result').textContent=JSON.stringify({monthFits,visibleMonth,monthNoScroll,toolbarIcons,quickSearchFits,centeredAdd,singleHeader,headerNoOverlap,headerClickable,trayInitiallyClosed,trayOpensWithoutResize,trayDragPassThrough,trayCloses,trayNativeDrop,trayPointerDrop,startTimeVisible,clockHidden,shortListDoesNotFillBlankSpace,emptyListDoesNotCaptureBlankSpace,crowdedListStillScrolls,crowdedListMoves,hoverExpands,hoverTracksFixed,hoverRevealsCard,hoverCollapses,hoverShortUnchanged,pageScrollCanChain,matteCard,ribbonClean,adaptiveCard,readableCard,fixedDateAlignment,vrBadgeOnly,vrBadgeLayout,groupAccent,shadowGutter,translucentPreview,translucentPopover,atmosphericGrid,alternateOpaque,panelPushes,saturdayVisible,participantRailClear,ribbonsKept,openMonthFits,outsideCloses,crowdedDayAccessible,dayToDetails,escapeCloses,rapidDetailReopen,detailExitSettled,noMutation,noRootOverflow,otherMonthsFit,headerGeometry});
});`;
export function fixture({test=true}={}){return '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+(test?'\n.event-details-drawer-v1,body:has(#calendar.section.active) .app>.main:has(#calendar.section.active){transition:none!important}':'')+'\n.app{display:grid;grid-template-columns:180px minmax(0,1fr)}.calendar-head{display:grid;grid-template-columns:repeat(7,1fr)}#result{position:fixed;bottom:0;visibility:hidden}</style><body data-theme="neon" class="mws-premium sidebar-pinned" data-resolution="fhd"><div class="app"><aside class="sidebar">MAWANG<br>캘린더</aside><main class="main">'+globalTop+'<section id="calendar" class="section active">'+top+'<div class="calendar-responsive-scroll-v1"><div class="calendar-head">'+['일','월','화','수','목','금','토'].map(s=>'<span>'+s+'</span>').join('')+'</div><div id="calendarGrid" class="calendar"></div></div>'+copyTray+'</section></main></div><pre id="result">pending</pre><script>'+read('assets/calendar-continuous-series-v1.js')+'</script><script>'+read('assets/calendar-details-v1.js')+'</script><script>'+read('assets/calendar-day-expand-v1.js')+'</script><script>'+bootstrap+(test?checks:'')+'</script></body></html>'}
if(process.env.MWS_MONTH_FIXTURE){writeFileSync(process.env.MWS_MONTH_FIXTURE,fixture({test:false}));process.exit(0)}
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-month-'));
let browser;
try{
 const file=path.join(temp,'index.html');writeFileSync(file,fixture());
 browser=await launchCalendarBrowser(temp);
 for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[2560,1080]]){
  await browser.navigate(pathToFileURL(file).href+'?size='+width+'x'+height,width,height);
  const result=await browser.evaluate(`new Promise((resolve,reject)=>{const start=performance.now();const check=()=>{const value=document.querySelector('#result')?.textContent;if(value&&value!=='pending'){resolve(JSON.parse(value));return}if(performance.now()-start>12000){reject(new Error('Missing month result'));return}setTimeout(check,25)};check()})`);
  for(const [key,value] of Object.entries(result))if(key!=='headerGeometry')assert.equal(value,true,width+'x'+height+' '+key+' '+JSON.stringify(result));console.log('CALENDAR_MONTH_VIEWPORT_OK',width,height,JSON.stringify(result));
 }
}finally{await browser?.close();rmSync(temp,{recursive:true,force:true})}
