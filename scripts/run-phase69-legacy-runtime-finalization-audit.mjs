import fs from 'node:fs';

export function runPhase69LegacyRuntimeFinalizationAudit(){
  const issues=[];
  const warnings=[];
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const runtime=fs.readFileSync('assets/maintenance-runtime-v130.js','utf8');

  if(fs.existsSync('assets/cf-v5.7-runtime.js'))issues.push('legacy cf-v5.7 runtime file still exists');
  if(!perf.includes('assets/maintenance-runtime-v130.js?v=1.3.0-final69'))issues.push('performance runtime does not load finalized maintenance runtime');
  if(perf.includes('cf-v5.7-runtime.js')||perf.includes('loadLegacyRuntimeFeatures'))issues.push('performance runtime still references legacy runtime');
  if(!post.includes('__mwsPerfRuntimeV130'))issues.push('post-login runtime still expects the legacy performance flag');
  if(!runtime.includes('__mwsMaintenanceRuntimeV130'))issues.push('final maintenance runtime marker is missing');
  if(!runtime.includes('window.mwsCreateQuickBackupV130=quickBackup'))issues.push('quick backup was not preserved');
  if(!runtime.includes('window.mwsCreateCompleteBackupV130=completeBackup'))issues.push('complete backup was not preserved');
  if(/forceBuildVersion|installBuildVersionGuard|compressProfileImageV571|installSaveRequestOptimizer|migrateIndexedDbMedia|CF V5\.7\.1/.test(runtime))issues.push('conflicting legacy behavior remains in final maintenance runtime');

  const summary={phase:69,name:'legacy-runtime-finalization',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase69LegacyRuntimeFinalizationAudit();
