import fs from 'node:fs';

export function runPhase19MobileCalendarPcDragRestoreAudit(){
  const issues=[];
  const warnings=[];
  const feature=fs.readFileSync('assets/mobile-calendar-day-detail-v130.js','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');

  if(!core.includes('draggable="true"'))issues.push('base PC calendar no longer declares event rows draggable');
  if(!feature.includes("node.setAttribute('draggable','false')"))issues.push('mobile calendar does not explicitly disable event dragging');
  if(feature.includes("node.removeAttribute('draggable')"))issues.push('mobile-to-PC transition removes draggable instead of restoring the PC state');
  if(!feature.includes("node.setAttribute('draggable','true')"))issues.push('mobile-to-PC transition does not restore PC calendar dragging');

  const summary={phase:19,name:'mobile-calendar-pc-drag-restore',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase19MobileCalendarPcDragRestoreAudit();
