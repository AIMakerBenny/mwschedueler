import fs from 'node:fs';

export function runPhase25MobileDetailMediaFallbackAudit(){
  const issues=[];
  const warnings=[];
  const feature=fs.readFileSync('assets/mobile-calendar-day-detail-v130.js','utf8');

  if(!feature.includes('function replaceBrokenDetailImage(target)'))issues.push('day-detail has no broken-image fallback handler');
  if(!feature.includes("target.classList.contains('mws-mobile-day-game-image-v130')"))issues.push('broken game artwork has no placeholder fallback');
  if(!feature.includes("target.closest('.mws-mobile-day-person-avatar-v130')"))issues.push('broken participant artwork has no initials fallback');
  if(!feature.includes('data-mws-fallback-name='))issues.push('participant images do not retain a fallback display name');
  if(!feature.includes("root.addEventListener('error',event=>"))issues.push('day-detail does not capture media load failures');
  if(!feature.includes('replaceBrokenDetailImage(event.target)'))issues.push('captured media errors are not converted to fallback UI');

  const summary={phase:25,name:'mobile-detail-media-fallback',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase25MobileDetailMediaFallbackAudit();
