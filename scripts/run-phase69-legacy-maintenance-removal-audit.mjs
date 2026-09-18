import fs from 'node:fs';

export function runPhase69LegacyMaintenanceRemovalAudit(){
  const issues=[];
  const warnings=[];
  const legacy='assets/cf-v5.7-runtime.js';
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const next=fs.readFileSync('assets/maintenance-runtime-v130.js','utf8');

  if(fs.existsSync(legacy))issues.push('retired cf-v5.7-runtime.js still exists after the removal phase');
  if(perf.includes('cf-v5.7-runtime.js'))issues.push('active performance runtime still references the deleted legacy maintenance file');
  if(!perf.includes("assets/maintenance-runtime-v130.js?v=1.3.0-stage68"))issues.push('maintenance successor is not the active runtime after legacy removal');
  if(!next.includes('window.__mwsMaintenanceRuntimeV130Ready=true'))issues.push('maintenance successor readiness marker is missing after legacy removal');
  for(const marker of ['installSaveRequestOptimizer','quickBackup','completeBackup','installCalendarClickGuard']){
    if(!next.includes(marker))issues.push(`maintenance successor lost required function after legacy removal: ${marker}`);
  }

  const runtimeFiles=['index.html','assets/post-login-runtime-v130.js','src/cf-v111-entry.js'];
  for(const file of runtimeFiles){
    if(fs.readFileSync(file,'utf8').includes('cf-v5.7-runtime.js'))issues.push(`deleted legacy maintenance file is still referenced by ${file}`);
  }

  const summary={phase:69,name:'legacy-maintenance-removal',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase69LegacyMaintenanceRemovalAudit();
