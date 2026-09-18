import fs from 'node:fs';

export function runPhase18MobileCalendarDetailMediaAudit(){
  const issues=[];
  const warnings=[];
  const css=fs.readFileSync('assets/mobile-calendar-v130.css','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const feature=fs.readFileSync('assets/mobile-calendar-day-detail-v130.js','utf8');
  const deviceCss=fs.readFileSync('assets/device-ui.css','utf8');

  if(!deviceCss.includes('.mws-mobile-tabs')||!deviceCss.includes('z-index:4900'))issues.push('mobile bottom navigation authority changed or is unavailable');
  if(!css.includes('bottom:var(--mws-mobile-nav-offset-v130,68px)'))issues.push('day detail does not reserve the measured bottom navigation height');
  if(!css.includes('z-index:4800'))issues.push('day detail is not layered below the mobile bottom navigation');
  if(!feature.includes("document.querySelector('.mws-mobile-tabs')"))issues.push('day detail does not measure the actual mobile bottom navigation');
  if(!feature.includes("root.style.setProperty('--mws-mobile-nav-offset-v130'"))issues.push('measured bottom navigation height is not applied to the detail layer');
  if(!feature.includes('participantVisuals(event)'))issues.push('participant visual rendering is missing');
  if(!feature.includes('person.image'))issues.push('participant profile images are not read from existing contact data');
  if(!feature.includes('gameVisual(event)'))issues.push('game visual rendering is missing');
  if(!feature.includes('game?.image||game?.headerImage'))issues.push('linked game artwork is not read from existing event data');
  if(!css.includes('.mws-mobile-day-person-avatar-v130 img'))issues.push('participant image styling is missing');
  if(!css.includes('.mws-mobile-day-game-image-v130'))issues.push('game image styling is missing');
  if(!runtime.includes("mobile-calendar-v130.css?v=1.3.0-")||!runtime.includes("mobile-calendar-day-detail-v130.js?v=1.3.0-"))issues.push('mobile detail asset cache-bust revision is missing');

  const summary={phase:18,name:'mobile-calendar-detail-media-and-nav',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase18MobileCalendarDetailMediaAudit();
