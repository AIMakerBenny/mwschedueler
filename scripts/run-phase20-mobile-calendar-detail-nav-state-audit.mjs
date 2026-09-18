import fs from 'node:fs';

export function runPhase20MobileCalendarDetailNavStateAudit(){
  const issues=[];
  const warnings=[];
  const feature=fs.readFileSync('assets/mobile-calendar-day-detail-v130.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(!feature.includes('aria-modal="false"'))issues.push('day detail still declares itself modal even though bottom navigation must remain interactive');
  if(!feature.includes("target.closest('.mws-mobile-tabs [data-mobile-tab]')"))issues.push('day detail does not observe bottom navigation actions');
  if(!feature.includes("if(root?.classList.contains('open'))closeSheet()"))issues.push('bottom navigation does not clear an open day-detail state');
  if(!runtime.includes('mobile-calendar-bugfix-p20'))issues.push('day-detail cache-bust revision was not updated for the interaction fix');

  const summary={phase:20,name:'mobile-calendar-detail-nav-state',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase20MobileCalendarDetailNavStateAudit();
