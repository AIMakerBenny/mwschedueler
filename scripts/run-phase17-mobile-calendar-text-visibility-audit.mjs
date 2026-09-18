import fs from 'node:fs';

export function runPhase17MobileCalendarTextVisibilityAudit(){
  const issues=[];
  const warnings=[];
  const css=fs.readFileSync('assets/mobile-calendar-v130.css','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const feature=fs.readFileSync('assets/mobile-calendar-day-detail-v130.js','utf8');
  const headers=fs.readFileSync('_headers','utf8');

  if(css.includes('.mini-event:nth-child(n+4)'))issues.push('mobile event visibility still depends on generic DOM child position');
  if(!css.includes('.mini-event.mws-mobile-event-hidden-v130'))issues.push('mobile event overflow class rule is missing');
  if(!css.includes('.day > .mws-mobile-calendar-extra-v130'))issues.push('legacy injected day-cell visuals are not explicitly hidden');
  if(!css.includes('#calendarGrid .day img'))issues.push('calendar day images are not universally hidden on mobile');
  if(!css.includes('.mini-event > :not(.mini-event-main)'))issues.push('non-title mini-event children are not hidden on mobile');
  if(!feature.includes("day.querySelectorAll(':scope > .mini-event[data-evid]')"))issues.push('mobile event count still depends on unrelated day-cell children');
  if(!feature.includes("child.classList.toggle('mws-mobile-calendar-extra-v130',mobile&&!keep)"))issues.push('legacy day-cell elements are not tagged for mobile suppression');
  if(!feature.includes("node.classList.toggle('mws-mobile-event-hidden-v130',mobile&&index>=2)"))issues.push('mobile overflow visibility is not based on actual event index');
  if(!feature.includes("main.textContent=event?.restDay?'휴방':String(event?.title||'컨텐츠')"))issues.push('mobile content title is not force-rendered from event data');
  if(!runtime.includes('mobile-calendar-text-fix2'))issues.push('mobile calendar asset cache-bust revision was not updated');
  if(!headers.includes('/assets/mobile-calendar-v130.css')||!headers.includes('/assets/mobile-calendar-day-detail-v130.js'))issues.push('mobile calendar assets are missing no-cache headers');

  const summary={phase:17,name:'mobile-calendar-text-visibility',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase17MobileCalendarTextVisibilityAudit();
