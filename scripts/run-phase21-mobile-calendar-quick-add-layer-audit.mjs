import fs from 'node:fs';

export function runPhase21MobileCalendarQuickAddLayerAudit(){
  const issues=[];
  const warnings=[];
  const quick=fs.readFileSync('assets/mobile-calendar-quick-add-v130.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(!quick.includes("mws-mobile-day-detail-open-v130 .mws-mobile-calendar-quick-add-v130"))issues.push('quick-add bar is not hidden while the day-detail sheet is open');
  if(!quick.includes("!document.body.classList.contains('mws-mobile-day-detail-open-v130')"))issues.push('quick-add visibility state ignores the open day-detail sheet');
  if(!quick.includes("attributeFilter:['data-device-mode','data-resolution','class']"))issues.push('quick-add does not react when the day-detail body class changes');
  if(!quick.includes("bottom:calc(var(--mws-mobile-nav-offset-v130,68px) + 14px)"))issues.push('quick-add still uses a fixed bottom offset instead of the real mobile navigation height');
  if(!quick.includes("document.querySelector('.mws-mobile-tabs')"))issues.push('quick-add does not measure the mobile bottom navigation');
  if(!runtime.includes('mobile-calendar-ui-p23'))issues.push('quick-add cache-bust revision was not updated');

  const summary={phase:21,name:'mobile-calendar-quick-add-layer',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase21MobileCalendarQuickAddLayerAudit();
