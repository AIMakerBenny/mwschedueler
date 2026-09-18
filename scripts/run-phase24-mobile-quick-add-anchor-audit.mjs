import fs from 'node:fs';

export function runPhase24MobileQuickAddAnchorAudit(){
  const issues=[];
  const warnings=[];
  const quick=fs.readFileSync('assets/mobile-calendar-quick-add-v130.js','utf8');

  if(!quick.includes('const mobileMonth=isMobileMonth();'))issues.push('quick-add does not separate month membership from visible state');
  if(!quick.includes("const show=mobileMonth&&!document.body.classList.contains('mws-mobile-day-detail-open-v130')"))issues.push('quick-add visibility does not account for an open day-detail sheet');
  if(!quick.includes('if(mobileMonth){'))issues.push('quick-add is not kept in its mobile anchor while the month view remains active');
  if(!quick.includes("bar.classList.toggle('is-visible',show)"))issues.push('quick-add visibility is not toggled without moving its DOM anchor');
  const mobileStart=quick.indexOf('if(mobileMonth){');
  const elseAt=quick.indexOf('}else{',mobileStart);
  const restoreAt=quick.indexOf('restoreButton()',mobileStart);
  if(mobileStart<0||elseAt<0||restoreAt<0||restoreAt<elseAt)issues.push('quick-add restores to the desktop toolbar while mobile month view is still active');

  const summary={phase:24,name:'mobile-quick-add-anchor-stability',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase24MobileQuickAddAnchorAudit();
