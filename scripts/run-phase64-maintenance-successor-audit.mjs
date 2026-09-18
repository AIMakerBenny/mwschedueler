import fs from 'node:fs';

export function runPhase64MaintenanceSuccessorAudit(){
  const issues=[];
  const warnings=[];
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const next=fs.readFileSync('assets/maintenance-runtime-v130.js','utf8');

  if(!perf.includes("assets/maintenance-runtime-v130.js?v=1.3.0-stage68"))issues.push('performance runtime does not use the activated maintenance successor');
  if(perf.includes("assets/cf-v5.7-runtime.js"))issues.push('performance runtime still references the legacy maintenance runtime after activation');
  if(!perf.includes("Mawang maintenance runtime readiness handshake failed"))issues.push('activated maintenance successor has no readiness failure signal');
  if(!next.includes('__mwsMaintenanceRuntimeV130'))issues.push('maintenance successor marker is missing');
  for(const marker of ['installSaveRequestOptimizer','quickBackup','completeBackup','installCalendarClickGuard']){
    if(!next.includes(marker))issues.push(`maintenance successor lost required function: ${marker}`);
  }
  const summary={phase:64,name:'maintenance-successor-staging',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase64MaintenanceSuccessorAudit();
