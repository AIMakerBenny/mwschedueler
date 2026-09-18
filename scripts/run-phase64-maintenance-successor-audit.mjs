import fs from 'node:fs';

export function runPhase64MaintenanceSuccessorAudit(){
  const issues=[];
  const warnings=[];
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const next=fs.readFileSync('assets/maintenance-runtime-v130.js','utf8');

  if(!fs.existsSync('assets/cf-v5.7-runtime.js'))issues.push('legacy maintenance fallback was removed before successor validation');
  if(!perf.includes("assets/maintenance-runtime-v130.js?v=1.3.0-stage66"))issues.push('performance runtime does not prefer the staged maintenance successor');
  if(!perf.includes("assets/cf-v5.7-runtime.js?v=5.7.1"))issues.push('maintenance runtime has no legacy fallback');
  if(!perf.includes('s.onerror=fallback'))issues.push('maintenance successor load failure does not fall back safely');
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
