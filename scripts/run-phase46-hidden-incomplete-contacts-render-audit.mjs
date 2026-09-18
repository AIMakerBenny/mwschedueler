import fs from 'node:fs';

export function runPhase46HiddenIncompleteContactsRenderAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');

  if(!core.includes('function refreshIncompleteContactsOnDataChangeV146()'))issues.push('incomplete-contact datachange refresh has no visibility guard helper');
  if(!core.includes("if(!section?.classList.contains('active')||contactView!=='incomplete')return"))issues.push('incomplete-contact datachange refresh still runs while its view is hidden');
  if(core.includes("window.addEventListener('mawang:datachange',()=>{try{renderIncompleteContacts()}catch(_){}});"))issues.push('legacy unconditional incomplete-contact datachange render remains');
  if(!core.includes("window.addEventListener('mawang:datachange',refreshIncompleteContactsOnDataChangeV146)"))issues.push('guarded incomplete-contact datachange listener is missing');

  const summary={phase:46,name:'hidden-incomplete-contact-render-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase46HiddenIncompleteContactsRenderAudit();
