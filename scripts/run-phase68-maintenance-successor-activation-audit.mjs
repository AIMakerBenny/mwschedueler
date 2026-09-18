import fs from 'node:fs';

export function runPhase68MaintenanceSuccessorActivationAudit(){
  const issues=[];
  const warnings=[];
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const next=fs.readFileSync('assets/maintenance-runtime-v130.js','utf8');

  if(!perf.includes("assets/maintenance-runtime-v130.js?v=1.3.0-stage68"))issues.push('active maintenance loader does not point to the successor');
  if(perf.includes('cf-v5.7-runtime.js'))issues.push('active performance runtime still references cf-v5.7-runtime.js');
  if(perf.includes('mwsCf571RuntimeFallback'))issues.push('legacy maintenance fallback DOM path is still active');
  if(!next.includes('window.__mwsMaintenanceRuntimeV130Ready=true'))issues.push('successor readiness marker is missing');
  for(const marker of ['installSaveRequestOptimizer','quickBackup','completeBackup','installCalendarClickGuard']){
    if(!next.includes(marker))issues.push(`activated maintenance successor lost required function: ${marker}`);
  }

  const productionFiles=['index.html','assets/post-login-runtime-v130.js','src/cf-v111-entry.js','.github/workflows/deploy-cloudflare-production.yml'];
  for(const file of productionFiles){
    const src=fs.readFileSync(file,'utf8');
    if(src.includes('cf-v5.7-runtime.js'))issues.push(`production reference to cf-v5.7-runtime.js remains in ${file}`);
  }

  const summary={phase:68,name:'maintenance-successor-activation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase68MaintenanceSuccessorActivationAudit();
