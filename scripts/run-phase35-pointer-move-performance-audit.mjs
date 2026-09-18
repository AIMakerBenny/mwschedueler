import fs from 'node:fs';

export function runPhase35PointerMovePerformanceAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const ui=fs.readFileSync('assets/ui-fixes-v121.js','utf8');
  const loader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');

  if(!core.includes('function attachCalendarPointerDragListeners()'))issues.push('calendar drag does not attach high-frequency pointer listeners on demand');
  if(!core.includes('function detachCalendarPointerDragListeners()'))issues.push('calendar drag does not detach high-frequency pointer listeners after use');
  if(!core.includes('attachCalendarPointerDragListeners();'))issues.push('calendar drag does not enable pointer tracking when dragging starts');
  if(!core.includes('detachCalendarPointerDragListeners();'))issues.push('calendar drag does not disable pointer tracking when dragging ends');
  if(!ui.includes('function startGamePreviewTracking()'))issues.push('Steam hover preview does not attach mouse tracking on demand');
  if(!ui.includes('function stopGamePreviewTracking()'))issues.push('Steam hover preview does not detach mouse tracking when hidden');
  if(!ui.includes("document.addEventListener('mousemove',trackGamePreviewMove,true)"))issues.push('Steam hover preview tracking listener is missing');
  if(!ui.includes("document.removeEventListener('mousemove',trackGamePreviewMove,true)"))issues.push('Steam hover preview tracking listener is never removed');
  if(ui.includes("document.addEventListener('mousemove',e=>{const slot=slotFromEvent(e)"))issues.push('legacy always-on Steam mousemove handler remains');
  if(!loader.includes('ui-fixes-v121.js?v=1.2.'))issues.push('UI fixes cache-bust revision is missing');

  const summary={phase:35,name:'high-frequency-pointer-listener-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase35PointerMovePerformanceAudit();
