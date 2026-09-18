import fs from 'node:fs';

export function runPhase29MobileDayDetailViewportAudit(){
  const issues=[];
  const warnings=[];
  const css=fs.readFileSync('assets/mobile-calendar-v130.css','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(!css.includes('max-height:min(82dvh,760px,calc(100dvh - var(--mws-mobile-nav-offset-v130,68px) - 12px))'))issues.push('day-detail sheet does not use the dynamic mobile viewport and measured navigation height');
  if(!css.includes('.mws-mobile-day-sheet-v130{')||!css.includes('flex-direction:column'))issues.push('day-detail sheet is not a bounded flex column');
  if(!css.includes('.mws-mobile-day-list-v130{')||!css.includes('flex:1 1 auto'))issues.push('day-detail list cannot flex within the dynamic sheet height');
  if(!css.includes('max-height:none'))issues.push('legacy fixed list height still constrains the dynamic sheet');
  if(!runtime.includes("mobile-calendar-v130.css?v=1.3.0-mobile-calendar-viewport-p29"))issues.push('mobile calendar stylesheet cache-bust was not advanced for viewport sizing');

  const summary={phase:29,name:'mobile-day-detail-dynamic-viewport',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase29MobileDayDetailViewportAudit();
