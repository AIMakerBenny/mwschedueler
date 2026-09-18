import fs from 'node:fs';

export function runPhase28EventEditorScrollResetAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!core.includes("eventModal.querySelector('.event-modalbox')"))issues.push('event editor does not reset the outer modal scroll container');
  if(!core.includes("eventModal.querySelector('.event-info-panel')"))issues.push('event editor does not reset its information-panel scroll container');
  if(!core.includes("eventModal.querySelector('.event-memo-panel')"))issues.push('event editor does not reset its memo-panel scroll container');
  if(!core.includes('target.scrollTop=0'))issues.push('event editor scroll targets are not returned to the top on open');
  if(!index.includes('assets/app-core.js?v=1.3.0-'))issues.push('app-core cache-bust revision is missing');

  const summary={phase:28,name:'event-editor-scroll-reset',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase28EventEditorScrollResetAudit();
