import fs from 'node:fs';

export function runPhase22MobileModalLayerAudit(){
  const issues=[];
  const warnings=[];
  const css=fs.readFileSync('assets/device-ui.css','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const calendarCss=fs.readFileSync('assets/mobile-calendar-v130.css','utf8');

  if(!css.includes('body[data-device-mode="mobile"] .modal{padding:8px!important;align-items:flex-end!important;z-index:5200!important}'))issues.push('mobile modal layer does not sit above the 4900 bottom navigation');
  if(!css.includes('.mws-mobile-tabs{position:fixed')||!css.includes('z-index:4900'))issues.push('mobile bottom navigation layer authority is missing');
  if(!calendarCss.includes('z-index:4800'))issues.push('non-modal calendar detail no longer stays below the bottom navigation');
  if(!index.includes('assets/device-ui.css?v='))issues.push('device UI stylesheet cache-bust is missing');

  const summary={phase:22,name:'mobile-modal-layer-order',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase22MobileModalLayerAudit();
