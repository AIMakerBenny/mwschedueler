import fs from 'node:fs';

export function runPhase26MobileEventEditorHeaderAudit(){
  const issues=[];
  const warnings=[];
  const css=fs.readFileSync('assets/device-ui.css','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!css.includes('body[data-device-mode="mobile"] #eventModal .event-modal-header'))issues.push('mobile event editor header has no dedicated layout rule');
  if(!css.includes('position:sticky!important'))issues.push('mobile event editor header is not sticky');
  if(!css.includes('z-index:60!important'))issues.push('sticky event editor header does not stay above editor content');
  if(!css.includes('[data-close="eventModal"]'))issues.push('mobile event editor close control has no guaranteed touch target');
  if(!css.includes('min-height:44px!important'))issues.push('mobile event editor close control is smaller than the intended touch target');
  if(!index.includes('assets/device-ui.css?v=4'))issues.push('device UI stylesheet cache-bust was not advanced for the sticky header');

  const summary={phase:26,name:'mobile-event-editor-sticky-header',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase26MobileEventEditorHeaderAudit();
