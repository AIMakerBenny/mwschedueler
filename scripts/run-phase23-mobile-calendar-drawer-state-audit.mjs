import fs from 'node:fs';

export function runPhase23MobileCalendarDrawerStateAudit(){
  const issues=[];
  const warnings=[];
  const feature=fs.readFileSync('assets/mobile-calendar-day-detail-v130.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(!feature.includes(".mws-mobile-tabs [data-mobile-tab], .mobile-nav-toggle, .sidebar [data-tab]"))issues.push('day-detail does not close for every mobile navigation entry point');
  if(!feature.includes("if(root?.classList.contains('open'))closeSheet()"))issues.push('navigation actions do not clear an open day-detail state');
  if(!runtime.includes("mobile-calendar-day-detail-v130.js?v=1.3.0-"))issues.push('day-detail cache-bust revision is missing');

  const summary={phase:23,name:'mobile-calendar-drawer-state',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase23MobileCalendarDrawerStateAudit();
