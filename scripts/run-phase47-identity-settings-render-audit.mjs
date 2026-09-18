import fs from 'node:fs';

export function runPhase47IdentitySettingsRenderAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');

  if(!core.includes('function refreshUserIdentityOnDataChangeV147()'))issues.push('identity settings datachange refresh has no visibility guard helper');
  if(!core.includes("if(!document.getElementById('settings')?.classList.contains('active'))return"))issues.push('identity settings still rerenders while settings is hidden');
  if(core.includes("window.addEventListener('mawang:datachange',()=>{try{renderUserIdentitySettings()}catch(_){}});"))issues.push('legacy unconditional identity-settings datachange render remains');
  if(!core.includes("window.addEventListener('mawang:datachange',refreshUserIdentityOnDataChangeV147)"))issues.push('guarded identity-settings datachange listener is missing');
  if((core.match(/if\(!window\.__mwsCf571Optimizer\)\{renderUserIdentitySettings\(\);refreshContactViews\(\)\}/g)||[]).length<2)issues.push('self-contact set/clear fallback does not avoid duplicate production rerenders');

  const summary={phase:47,name:'identity-settings-hidden-render-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase47IdentitySettingsRenderAudit();
