import fs from 'node:fs';

export function runPhase27MobileDayDetailScrollResetAudit(){
  const issues=[];
  const warnings=[];
  const feature=fs.readFileSync('assets/mobile-calendar-day-detail-v130.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(!feature.includes("const list=root.querySelector('#mwsMobileDayListV130')"))issues.push('day-detail open path does not resolve its scroll container');
  if(!feature.includes('if(list)list.scrollTop=0'))issues.push('day-detail retains the previous date scroll position when reopened');
  if(!runtime.includes("mobile-calendar-day-detail-v130.js?v=1.3.0-mobile-calendar-scroll-p27"))issues.push('day-detail cache-bust was not advanced for scroll reset');

  const summary={phase:27,name:'mobile-day-detail-scroll-reset',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase27MobileDayDetailScrollResetAudit();
