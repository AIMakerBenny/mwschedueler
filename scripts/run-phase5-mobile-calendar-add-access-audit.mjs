import fs from 'node:fs';

export function runPhase5MobileCalendarAddAccessAudit(){
  const issues=[];
  const warnings=[];
  const loader=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const calendarCss=fs.readFileSync('assets/mobile-calendar-v130.css','utf8');

  const topbarHidden=calendarCss.includes(':has(#calendar.section.active[data-mobile-calendar-view="month"]) .topbar{display:none!important}');
  if(!topbarHidden)warnings.push('month view no longer hides the global topbar; Phase 5 dependency assumption changed');

  const loadAt=loader.indexOf("const quickAddResult=await load('mobile-calendar-quick-add-v130'");
  const guardAt=loader.indexOf("if(!quickAddResult.ok){markCriticalUiFailure(['mobile-calendar-quick-add-v130']);return;}");
  const readyAt=loader.indexOf('window.__mwsPostLoginUiReadyV130=true');
  if(loadAt<0)issues.push('mobile month quick-add module is not explicitly loaded before readiness');
  if(guardAt<0)issues.push('quick-add load failure is still treated as optional');
  if(readyAt<0)issues.push('UI ready marker is missing');
  if(loadAt>=0&&readyAt>=0&&loadAt>readyAt)issues.push('UI can become ready before quick-add module is loaded');
  if(guardAt>=0&&readyAt>=0&&guardAt>readyAt)issues.push('UI can become ready before quick-add failure is rejected');

  const simulated={mobileMonth:true,topbarHidden:true,quickAddLoaded:false};
  const hasAddEntrypoint=!simulated.mobileMonth||!simulated.topbarHidden||simulated.quickAddLoaded;
  if(hasAddEntrypoint)issues.push('Phase 5 reproduction model did not reproduce the missing add-entrypoint state');

  const result={phase:5,name:'mobile-calendar-add-entrypoint',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase5MobileCalendarAddAccessAudit();
