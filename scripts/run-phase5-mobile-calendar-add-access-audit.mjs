import fs from 'node:fs';

export function runPhase5MobileCalendarAddAccessAudit(){
  const issues=[];
  const warnings=[];
  const loader=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const calendarCss=fs.readFileSync('assets/mobile-calendar-v130.css','utf8');

  const topbarHidden=calendarCss.includes(':has(#calendar.section.active[data-mobile-calendar-view="month"]) .topbar{display:none!important}');
  if(!topbarHidden)warnings.push('month view no longer hides the global topbar; Phase 5 dependency assumption changed');

  const loadAt=loader.indexOf("load('mobile-calendar-quick-add-v130'");
  const criticalAt=loader.indexOf('const criticalFailures=');
  const finishAt=loader.indexOf('finishPostLoginUi(criticalFailures)');
  if(loadAt<0)issues.push('mobile month quick-add module is not explicitly loaded before readiness');
  if(criticalAt<0||!loader.includes('criticalResults.filter'))issues.push('quick-add load failure is not retained in critical UI failure state');
  if(finishAt<0)issues.push('UI readiness release is missing');
  if(loadAt>=0&&finishAt>=0&&loadAt>finishAt)issues.push('UI can become ready before quick-add module is attempted');

  const simulated={mobileMonth:true,topbarHidden:true,quickAddLoaded:false};
  const hasAddEntrypoint=!simulated.mobileMonth||!simulated.topbarHidden||simulated.quickAddLoaded;
  if(hasAddEntrypoint)issues.push('Phase 5 reproduction model did not reproduce the missing add-entrypoint state');

  const result={phase:5,name:'mobile-calendar-add-entrypoint',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase5MobileCalendarAddAccessAudit();
