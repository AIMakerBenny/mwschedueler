import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Observe real public-mode controls on the deployed app, never create/edit an event.
const base=process.env.MWS_LIVE_BASE||'https://mawang-scheduler.majoku.workers.dev';
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-live-drawer-'));
let browser;
try{
  browser=await launchCalendarBrowser(dir);
  const url=base.replace(/\/$/,'')+'/?calendar-popover-v2='+Date.now();
  await browser.navigate(url,1366,768);
  // Public mode may navigate during boot. Poll across document changes rather than
  // holding a pending evaluation in the outgoing page. Wait for hydrated UI and
  // late startup scripts to settle before measuring actual interactive playback.
  let ready,readySince=0,documentOrigin,lastState;
  const until=Date.now()+60000;
  while(Date.now()<until){
    let state;
    try{state=await browser.evaluate(String.raw`(()=>{
      const $=s=>document.querySelector(s);
      const gate=$('#mwsAccessGate');
      if(!document.body)return null;
      const publicMode=document.body.classList.contains('mws-public-mode');
      const visibleGate=gate&&getComputedStyle(gate).display!=='none'&&gate.getBoundingClientRect().width>0;
      if(!$('#mws-public-entry-style')&&document.readyState==='complete'&&visibleGate&&$('#mwsModePublic')&&!$('#mwsLoginSubmit')?.disabled){
        // Clicking before the runtime binds the form submits a native navigation.
        // A successful mode selection proves its handler has been installed.
        if($('#mwsLoginForm')?.dataset.mode!=='public')$('#mwsModePublic').click();
        if($('#mwsLoginForm')?.dataset.mode==='public'&&(!window.__mwsPopoverQaLoginAt||performance.now()-window.__mwsPopoverQaLoginAt>=3000)){
          window.__mwsPopoverQaLoginAt=performance.now();$('#mwsLoginSubmit')?.click();
        }
      }
      if(document.readyState==='complete'&&publicMode&&!visibleGate&&window.__mwsAppReadyV130&&!document.body.classList.contains('mws-app-loading')&&$('#calendarGrid .mini-event[data-evid]')&&$('#calendarEventDetailsV1')){
        // The welcome notice is a native modal; verify its live content and
        // dismiss it normally before interacting with the calendar behind it.
        const notice=$('#mwsAnnouncementDialog[open]');
        if(notice){
          const images=[...notice.querySelectorAll('.mws-notice-slide img')];
          if(images.some(img=>!img.complete))return {waiting:true,announcementLoading:true};
          window.__mwsLiveAnnouncementQaV1={count:images.length,loaded:images.every(img=>img.naturalWidth===1448&&img.naturalHeight===1086),initial:notice.dataset.noticeIndex,hideToday:!!notice.querySelector('.mws-notice-today')};
          notice.querySelector('.mws-notice-close').click();
        }
        const latestScript=Math.max(0,...performance.getEntriesByType('resource').filter(e=>e.initiatorType==='script').map(e=>e.responseEnd));
        const interactionStyles=[...document.styleSheets].some(sheet=>sheet.href&&new URL(sheet.href).pathname==='/assets/ui-interactions-v1.css'&&Number(new URL(sheet.href).searchParams.get('v'))>=4);
        return {cards:document.querySelectorAll('#calendarGrid .mini-event[data-evid]').length,version:[...document.scripts].some(s=>s.src.includes('calendar-details-v1.js?v=12&motion-fallback=1'))&&!!window.mwsUiInteractionsV1&&interactionStyles,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,noPreferenceControl:!$('#calendarDetailsMotionV6')&&$('#calendarEventDetailsV1').classList.contains('event-details-popover-v2'),origin:performance.timeOrigin,quiet:performance.now()-latestScript>=800,announcementEnabled:!!window.__mwsAnnouncementCarouselV1,announcement:window.__mwsLiveAnnouncementQaV1||null};
      }
      return {waiting:true,readyState:document.readyState,publicMode,visibleGate:!!visibleGate,mode:$('#mwsLoginForm')?.dataset.mode,submitDisabled:$('#mwsLoginSubmit')?.disabled,cards:document.querySelectorAll('#calendarGrid .mini-event[data-evid]').length,popup:!!$('#calendarEventDetailsV1')};
    })()`)}catch(error){if(!/Inspected target navigated or closed|Cannot find context|Execution context was destroyed/.test(String(error)))throw error;state=null}
    if(state)lastState=state;
    if(state?.quiet){if(documentOrigin!==state.origin||!readySince){documentOrigin=state.origin;readySince=Date.now()}
      if(Date.now()-readySince>=1200){ready=state;break}
    }else readySince=0;
    await new Promise(resolve=>setTimeout(resolve,125));
  }
  assert(ready,'No stable hydrated public calendar: '+JSON.stringify(lastState));
  assert(ready.cards>0&&ready.version&&!ready.reduced&&ready.noPreferenceControl,JSON.stringify(ready));
  const startupExpression=`(()=>{const sidebar=document.querySelector('.sidebar'),head=sidebar?.querySelector('.sidebar-head'),nav=sidebar?.querySelector('.nav');return {commit:window.__mwsCalendarStartupRenderV2,writes:window.__mwsCalendarRenderHistoryV2,metrics:window.mwsV55EgressReport?.().requests.filter(r=>r.type==='calendar-startup-batch'||r.type==='calendar-startup-commit'||r.type==='hydrate-complete'),request:performance.getEntriesByType('resource').find(e=>e.name.includes('/api/calendar-startup'))?.startTime,sidebar:sidebar&&head&&nav?{scroll:sidebar.scrollTop,top:sidebar.getBoundingClientRect().top,head:head.getBoundingClientRect().top,nav:nav.getBoundingClientRect().top,overflow:getComputedStyle(sidebar).overflowY}:null}})()`;
  const verifyStartup=startup=>{
    assert(startup.commit?.cards>0&&startup.writes?.length===1&&startup.writes[0].cards===startup.commit.cards,JSON.stringify(startup));
    assert(startup.metrics?.[0]?.type==='calendar-startup-batch'&&startup.metrics.some(r=>r.type==='calendar-startup-commit')&&Number.isFinite(startup.request),JSON.stringify(startup));
    assert(['posts','miniGames','wardogs'].every(p=>!startup.commit.parts.includes(p)),JSON.stringify(startup));
  };
  const startup=await browser.evaluate(startupExpression);verifyStartup(startup);
  console.log('MWS_LIVE_CALENDAR_ATOMIC_COLD',JSON.stringify(startup));
  if(ready.announcementEnabled){assert(ready.announcement?.count===3&&ready.announcement.loaded&&ready.announcement.initial==='0'&&ready.announcement.hideToday,JSON.stringify(ready));console.log('MWS_LIVE_ANNOUNCEMENTS',JSON.stringify(ready.announcement))}
  const publicEntry=await browser.evaluate(`(()=>{
    const $=id=>document.getElementById(id),gate=$('mwsAccessGate'),button=$('mwsChangeModeBtn'),app=document.querySelector('.app');
    const visible=()=>!gate.classList.contains('hidden')&&getComputedStyle(gate).display!=='none';
    const initial=!visible()&&!app.inert&&document.body.dataset.mwsMode==='public'&&!button.disabled&&button.textContent==='관리자 로그인';
    button.click();const form=visible()&&app.inert&&$('mwsLoginForm').dataset.mode==='admin'&&$('mwsLoginTitle').textContent==='관리자 로그인'&&getComputedStyle($('mwsModePublic').parentElement).display==='none';
    $('mwsLoginBack').click();const returned=!visible()&&!app.inert&&document.body.dataset.mwsMode==='public';
    return {initial,form,returned};
  })()`);
  assert(publicEntry.initial&&publicEntry.form&&publicEntry.returned,JSON.stringify(publicEntry));console.log('MWS_LIVE_PUBLIC_ENTRY',JSON.stringify(publicEntry));
  const surface=await browser.evaluate(String.raw`(()=>{
    const card=document.querySelector('#calendarGrid .mini-event[data-evid]'),preview=document.querySelector('#calendarEventPreview'),popover=document.querySelector('#calendarEventDetailsV1');
    const alpha=color=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return ctx.getImageData(0,0,1,1).data[3]};
    const cardCSS=getComputedStyle(card),previewCSS=getComputedStyle(preview),popoverCSS=getComputedStyle(popover);
    const dates=[...document.querySelectorAll('#calendarGrid .day[data-date]')];
    const badges=[...document.querySelectorAll('#calendarGrid .calendar-vr-badge-v1')];
    const fixedDateAlignment=dates.length>=28&&dates.every(d=>{const b=d.getBoundingClientRect(),n=d.querySelector('.calendar-date-number-v3').getBoundingClientRect();return Math.abs(n.left+n.width/2-b.left-b.width/2)<=1});
    const vrBadgeLayout=badges.every(badge=>{const card=badge.closest('.mini-event'),slot=card.querySelector('.mws-steam-slot-v111'),main=card.querySelector('.mini-event-main'),b=badge.getBoundingClientRect(),s=slot.getBoundingClientRect(),m=main.getBoundingClientRect();return badge.textContent==='VR'&&card.classList.contains('calendar-event-vr-v1')&&card.getAttribute('aria-label').includes(' VR ')&&b.width===20&&b.height===20&&getComputedStyle(badge).borderRadius==='50%'&&m.right<=b.left+1&&b.right<=s.left-2&&Math.abs(b.top+b.height/2-s.top-s.height/2)<=1});
    return {fixedDateAlignment,vrBadgeLayout,vrBadgeCount:badges.length,version:!!document.querySelector('link[href*="calendar-details-v1.css?v=21"]'),matte:cardCSS.backgroundImage==='none'&&cardCSS.boxShadow!=='none'&&!cardCSS.boxShadow.includes('inset')&&cardCSS.borderLeftWidth==='3px'&&cardCSS.borderTopWidth==='0px',readable:[...document.querySelectorAll('#calendarGrid .mini-event[data-evid]:has(time)')].filter(e=>e.getBoundingClientRect().height>0).every(e=>{const t=e.querySelector('time'),name=e.querySelector('.calendar-card-title-v2'),slot=e.querySelector('.mws-steam-slot-v111'),main=e.querySelector('.mini-event-main');return t&&name&&slot&&getComputedStyle(t).fontWeight==='500'&&getComputedStyle(name).fontWeight==='600'&&main.getBoundingClientRect().right<=slot.getBoundingClientRect().left+1&&slot.getBoundingClientRect().width===24}),previewAlpha:alpha(previewCSS.backgroundColor),popoverAlpha:alpha(popoverCSS.backgroundColor),previewNoBlur:previewCSS.backdropFilter==='none',popoverNoBlur:popoverCSS.backdropFilter==='none',theme:document.body.dataset.theme,bodyColor:getComputedStyle(document.body).getPropertyValue('--bg').trim(),gridColor:getComputedStyle(document.querySelector('#calendarGrid')).backgroundColor};
  })()`);
  assert(surface.version&&surface.matte&&surface.readable&&surface.fixedDateAlignment&&surface.vrBadgeLayout&&surface.previewAlpha>=223&&surface.previewAlpha<=225&&surface.popoverAlpha>=223&&surface.popoverAlpha<=225&&surface.previewNoBlur&&surface.popoverNoBlur,JSON.stringify(surface));
  if(surface.theme==='neon')assert(surface.bodyColor==='#0d0f14'&&surface.gridColor==='rgb(12, 14, 18)',JSON.stringify(surface));
  console.log('MWS_LIVE_CALENDAR_DEPTH_V3',JSON.stringify(surface));
  const trayLayout=await browser.evaluate(String.raw`(async()=>{
    const $=s=>document.querySelector(s),r=s=>$(s).getBoundingClientRect(),tick=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const button=$('#calendarCopyTrayToggleV4'),tray=$('#calendarCopyTray'),before=r('#calendarGrid'),hidden=getComputedStyle(tray).display==='none';
    const icons=[...document.querySelectorAll('.calendar-topbar-v4 button')].every(b=>getComputedStyle(b,'::before').maskImage!=='none'&&getComputedStyle(b).fontSize==='0px');
    const add=$('#newEventBtn'),icon=getComputedStyle(add,'::before'),style=getComputedStyle(add),boxAdd=r('#newEventBtn'),scale=$('#pageTextScaleControlV54');
    const centeredAdd=icon.position==='absolute'&&Math.abs(parseFloat(style.borderLeftWidth)+parseFloat(icon.left)-boxAdd.width/2)<1&&Math.abs(parseFloat(style.borderTopWidth)+parseFloat(icon.top)-boxAdd.height/2)<1&&icon.transform==='matrix(1, 0, 0, 1, -9.5, -9.5)';
    const controls=[...document.querySelectorAll('#pageTitle,.calendar-topbar-v4 button,.calendar-topbar-v4 select,.topbar .sync-status,#newEventBtn')].filter(el=>el.getBoundingClientRect().width>0);
    const cy=box=>box.top+box.height/2,header=r('.topbar');
    const singleHeader=header.height<=45&&controls.every(el=>Math.abs(cy(el.getBoundingClientRect())-cy(boxAdd))<=3)&&r('.calendar-head').top>=header.bottom-1&&r('.calendar-head').top-header.bottom<=10;
    const headerNoOverlap=controls.map(el=>el.getBoundingClientRect()).sort((a,b)=>a.left-b.left).every((box,i,all)=>i===0||box.left>=all[i-1].right-1);
    const headerClickable=controls.filter(el=>el.matches('button,select')).every(el=>{const box=el.getBoundingClientRect();return el.contains(document.elementFromPoint(box.left+box.width/2,cy(box)))});
    const sidebarLayoutChildren=[...$('.sidebar').children].filter(e=>!e.matches('script,style,template'));
    const scaleInSidebar=scale.parentElement===$('.sidebar')&&sidebarLayoutChildren[sidebarLayoutChildren.indexOf(scale)-1]?.classList.contains('nav')&&!$('.topbar').contains(scale);
    const monthFits=before.top>=0&&before.bottom<=innerHeight&&document.querySelectorAll('#calendarGrid .day:not(.out)').length>=28;
    button.click();await tick();const after=r('#calendarGrid'),box=r('#calendarCopyTray');
    const open=button.getAttribute('aria-expanded')==='true'&&getComputedStyle(tray).position==='fixed'&&box.top>=r('#calendarCopyTrayToggleV4').bottom&&box.right<=innerWidth&&box.bottom<=innerHeight;
    const stable=Math.abs(before.top-after.top)<1&&Math.abs(before.height-after.height)<1&&Math.abs(before.width-after.width)<1;
    $('#calendarCopyTrayCloseV4').click();await tick();
    return {hidden,icons,centeredAdd,singleHeader,headerNoOverlap,headerClickable,scaleInSidebar,monthFits,open,stable,closed:getComputedStyle(tray).display==='none',scrollHeight:document.documentElement.scrollHeight,viewport:innerHeight};
  })()`);
  assert(trayLayout.hidden&&trayLayout.icons&&trayLayout.centeredAdd&&trayLayout.singleHeader&&trayLayout.headerNoOverlap&&trayLayout.headerClickable&&trayLayout.scaleInSidebar&&trayLayout.monthFits&&trayLayout.open&&trayLayout.stable&&trayLayout.closed,JSON.stringify(trayLayout));
  console.log('MWS_LIVE_CALENDAR_LAYOUT_V4',JSON.stringify(trayLayout));
  const target=await browser.evaluate(String.raw`(()=>{
    const cards=[...document.querySelectorAll('#calendarGrid .mini-event[data-evid] .mini-event-main')];
    for(const card of cards){const rect=card.getBoundingClientRect(),x=rect.left+Math.min(20,rect.width/2),y=rect.top+rect.height/2;if(rect.width>10&&y>0&&y<innerHeight&&document.elementFromPoint(x,y)?.closest('.mini-event[data-evid]')===card.closest('.mini-event[data-evid]'))return{x,y}}
    return null;
  })()`);
  assert(target,'A visible calendar card is required');
  async function observe(open,point,reduced=false){
    const sample=browser.evaluate(String.raw`(async()=>{
      const drawer=document.querySelector('#calendarEventDetailsV1'),tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));
      const grid=document.querySelector('#calendarGrid'),before=grid.getBoundingClientRect(),initial=drawer.classList.contains('open');
      const start=performance.now(),positions=[];let duration=null,fadeOnly=true,stableGrid=true,stablePopup=true,origin=null,changed=false;
      while(performance.now()-start<2500){
        const t=await tick(),animation=drawer.getAnimations()[0];
        const g=grid.getBoundingClientRect();stableGrid&&=Math.abs(g.width-before.width)<1&&Math.abs(g.left-before.left)<1;
        changed||=drawer.classList.contains('open')!==initial;
        if(!animation){if(changed)break;continue}
        duration=animation.effect.getTiming().duration;fadeOnly&&=animation.effect.getKeyframes().every(f=>f.transform===undefined&&f.opacity!==undefined);
        const r=drawer.getBoundingClientRect();origin??=r;stablePopup&&=Math.abs(r.left-origin.left)<1&&Math.abs(r.top-origin.top)<1;
        positions.push(Number(getComputedStyle(drawer).opacity));
      }
      const r=drawer.getBoundingClientRect(),selected=document.querySelector('#calendarGrid .event-details-selected-v1')?.getBoundingClientRect();
      return {duration,frames:positions.length,fadeOnly,stableGrid,stablePopup,monotonic:positions.every((v,i)=>!i||(initial?v<=positions[i-1]+.001:v>=positions[i-1]-.001)),settled:!drawer.hidden&&drawer.classList.contains('open'),hidden:drawer.hidden,inViewport:r.left>=11&&r.top>=11&&r.right<=innerWidth-11&&r.bottom<=innerHeight-11,anchored:!!selected&&(r.right<=selected.left||r.left>=selected.right||r.bottom<=selected.top||r.top>=selected.bottom),noTransform:getComputedStyle(drawer).transform==='none'};
    })()`);
    await browser.clickPoint(point.x,point.y);
    const result=await sample;
    assert(result.stableGrid&&result.stablePopup&&result.fadeOnly&&result.noTransform&&result.monotonic&&result.settled===open&&(open?result.inViewport&&result.anchored:result.hidden),JSON.stringify(result));
    assert(reduced?result.duration===null:result.duration===(open?150:110),JSON.stringify(result));
    console.log('MWS_LIVE_CALENDAR_POPOVER_V2',reduced?'reduced':'normal',open?'open':'close',JSON.stringify(result));
  }
  await observe(true,target);
  const closePoint=()=>browser.evaluate(`(()=>{const b=document.getElementById('calendarDetailsCloseV1').getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}})()`);
  const close=await closePoint();
  await observe(false,close);
  await browser.setReducedMotion(true);
  assert(await browser.evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.getElementById('calendarDetailsMotionV6')`));
  await observe(true,target,true);
  await observe(false,await closePoint(),true);
  // A real repeat navigation in the same profile exercises cached version hints.
  await browser.setReducedMotion(false);
  await browser.navigate(url+'&reload=1',1366,768);
  let warm;
  for(let i=0;i<160;i++){
    warm=await browser.evaluate(startupExpression);
    if(warm.commit&&warm.metrics?.some(r=>r.type==='hydrate-complete'))break;
    await new Promise(r=>setTimeout(r,125));
  }
  verifyStartup(warm);
  assert(startup.sidebar&&warm.sidebar&&startup.sidebar.scroll===0&&warm.sidebar.scroll===0&&startup.sidebar.overflow==='clip'&&warm.sidebar.overflow==='clip'&&Math.abs(warm.sidebar.head-startup.sidebar.head)<1&&Math.abs(warm.sidebar.nav-startup.sidebar.nav)<1,JSON.stringify({cold:startup.sidebar,warm:warm.sidebar}));
  console.log('MWS_LIVE_CALENDAR_ATOMIC_WARM',JSON.stringify(warm));
  const upcoming=await browser.evaluate(`(()=>{
    setTab('dashboard');
    const now=Date.now(),today=todayKST(new Date(now));
    const start=e=>e.start&&e.start!=='TBD'?Date.parse(e.date+'T'+e.start+':00+09:00'):NaN;
    const expected=activeEvents().filter(e=>!e.restDay&&e.date>=today&&(!Number.isFinite(start(e))||start(e)>now)).sort((a,b)=>(Number.isFinite(start(a))?start(a):Date.parse(a.date+'T23:59:59+09:00'))-(Number.isFinite(start(b))?start(b):Date.parse(b.date+'T23:59:59+09:00')));
    const ids=[...document.querySelectorAll('#upcomingDashboard .dashboard-upcoming-card')].map(el=>el.dataset.eventId);
    return {expected:expected.slice(0,15).map(e=>e.id),visible:ids,allCount:expected.length,startedToday:activeEvents().filter(e=>!e.restDay&&e.date===today&&Number.isFinite(start(e))&&start(e)<=now).length,next:dashboardDefaultEvent()?.id||null};
  })()`);
  assert.deepEqual(upcoming.visible,upcoming.expected,JSON.stringify(upcoming));
  assert.equal(upcoming.next,upcoming.expected[0]||null);
  console.log('MWS_LIVE_DASHBOARD_FUTURE_ONLY',JSON.stringify({visible:upcoming.visible.length,allCount:upcoming.allCount,startedTodayExcluded:upcoming.startedToday}));
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
