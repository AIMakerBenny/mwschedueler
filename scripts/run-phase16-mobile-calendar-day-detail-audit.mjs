import fs from 'node:fs';

export function runPhase16MobileCalendarDayDetailAudit(){
  const issues=[];
  const warnings=[];
  const css=fs.readFileSync('assets/mobile-calendar-v130.css','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const feature=fs.readFileSync('assets/mobile-calendar-day-detail-v130.js','utf8');

  if(!runtime.includes("load('mobile-calendar-day-detail-v130','/assets/mobile-calendar-day-detail-v130.js?v="))issues.push('mobile calendar day-detail runtime is not loaded after login');
  if(!feature.includes("event.stopImmediatePropagation()"))issues.push('mobile day click does not override the legacy direct-add/direct-edit calendar click path');
  if(!feature.includes("if(typeof window.openEvent==='function')window.openEvent(id)"))issues.push('day-detail event card does not reuse the existing event editor');
  if(!feature.includes("game?.name"))issues.push('day-detail does not expose linked game names');
  if(!feature.includes("event?.participants||[]"))issues.push('day-detail does not expose event participants');
  if(!feature.includes("main.textContent=event?.restDay?'휴방':String(event?.title"))issues.push('mobile month cells are not normalized to title-only event text');
  if(!feature.includes("day.dataset.mobileMore=count>2?'+'+(count-2):''"))issues.push('mobile month overflow count is not populated');
  if(!css.includes(".mini-event>.mws-steam-slot-v111")||!css.includes("display:none!important"))issues.push('mobile month view does not hide Steam artwork');
  if(!css.includes(".mws-mobile-calendar-day-detail-v130"))issues.push('mobile day-detail sheet styling is missing');

  const summary={phase:16,name:'mobile-calendar-day-detail',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase16MobileCalendarDayDetailAudit();
