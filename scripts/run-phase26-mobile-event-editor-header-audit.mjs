import fs from 'node:fs';

export function runPhase26MobileEventEditorHeaderAudit(){
  const issues=[];
  const warnings=[];
  const css=fs.readFileSync('assets/event-sidebar-tabs-v5.css','utf8');
  const index=fs.readFileSync('index.html','utf8');

  // Header and footer are outside the scrollable middle grid row, so sticky positioning is unnecessary.
  const mobileHeader=css.match(/body\[data-device-mode="mobile"\] #eventModal \.mws-event-editor-v6 \.event-modal-header\{([^}]+)\}/)?.[1]||'';
  const mobileClose=css.match(/body\[data-device-mode="mobile"\] #eventModal \.event-modal-header \[data-close="eventModal"\]\{([^}]+)\}/)?.[1]||'';
  if(!mobileHeader.includes('position:static!important'))issues.push('mobile event editor header must be outside the scrolling row');
  if(!css.includes('grid-template-rows:auto minmax(0,1fr) auto'))issues.push('event editor header/footer are not separated from scrollable content');
  if(!css.includes('overflow:auto!important;overflow-x:hidden!important;scrollbar-gutter:stable'))issues.push('mobile editor content does not have its own stable scrolling region');
  if(!mobileClose.includes('min-height:44px!important')||!mobileClose.includes('min-width:44px!important'))issues.push('mobile event editor close control has insufficient touch target');
  if(!index.includes('assets/event-sidebar-tabs-v5.css?v=8'))issues.push('event editor stylesheet cache revision missing');

  const summary={phase:26,name:'mobile-event-editor-sticky-header',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase26MobileEventEditorHeaderAudit();
