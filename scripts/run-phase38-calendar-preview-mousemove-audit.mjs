import fs from 'node:fs';

export function runPhase38CalendarPreviewMoveAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!core.includes('function queueCalendarEventPreviewPositionV138(clientX,clientY)'))issues.push('calendar event preview mouse movement is not frame-throttled');
  if(!core.includes('calendarPreviewMoveFrameV138=requestAnimationFrame'))issues.push('calendar preview position updates are not coalesced with requestAnimationFrame');
  if(!core.includes('cancelAnimationFrame(calendarPreviewMoveFrameV138)'))issues.push('pending calendar preview frame is not cancelled when the preview closes');
  if(core.includes('el.onmousemove=e=>positionCalendarEventPreview(e.clientX,e.clientY)'))issues.push('calendar mini events still perform direct layout work on every mousemove');
  if(!core.includes('el.onmousemove=e=>queueCalendarEventPreviewPositionV138(e.clientX,e.clientY)'))issues.push('calendar mini events do not use the throttled position queue');
  if(!index.includes('assets/app-core.js?v=1.3.0-'))issues.push('app-core cache-bust revision is missing');

  const summary={phase:38,name:'calendar-preview-mousemove-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase38CalendarPreviewMoveAudit();
