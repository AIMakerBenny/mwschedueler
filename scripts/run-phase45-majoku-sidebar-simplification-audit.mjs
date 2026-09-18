import fs from 'node:fs';

export function runPhase45MajokuSidebarSimplificationAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('assets/device-ui.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(src.includes('mwsMajokuSubnavV130'))issues.push('Majoku Castle expandable game subnav still exists');
  if(src.includes('mws-majoku-toggle-v130'))issues.push('Majoku Castle game-list toggle still exists');
  if(src.includes('mws-majoku-subnav-collapsed-v130'))issues.push('Majoku Castle collapsed-state storage still exists');
  if(src.includes('data-majoku-game'))issues.push('Majoku Castle sidebar still creates direct game shortcut buttons');
  if(!src.includes("document.querySelector('#gameMajoku .majoku-castle-frame')"))issues.push('Majoku Castle iframe helper was removed with the subnav');
  if(!src.includes("const records=doc.querySelector('.records-wrap')"))issues.push('Majoku Castle legacy records cleanup was unintentionally removed');
  if(!runtime.includes('device-ui.js?v=1.3.0-majoku-menu-p45'))issues.push('post-login device UI cache-bust was not advanced');
  if(!index.includes('assets/device-ui.js?v=1.3.0-majoku-menu-p45'))issues.push('source document device UI cache-bust was not advanced');

  const summary={phase:45,name:'majoku-sidebar-game-list-removal',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase45MajokuSidebarSimplificationAudit();
