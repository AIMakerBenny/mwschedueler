import fs from 'node:fs';

export function runPhase39TodayPeopleSyncDedupAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('assets/test-v5.5.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(!src.includes('function syncSignatureV139()'))issues.push('Today People sync has no change signature');
  if(!src.includes('function syncAllIfNeededV139(force=false)'))issues.push('Today People sync has no deduplicating wrapper');
  if(!src.includes('signature===lastSyncSignatureV139'))issues.push('Today People sync does not skip unchanged data');
  if(!src.includes('const wrappedSave=function(){syncAllIfNeededV139();'))issues.push('saveData wrapper still performs unconditional full sync');
  if(!src.includes('const wrappedRenderAll=function(){syncAllIfNeededV139();'))issues.push('renderAll wrapper still performs unconditional full sync');
  if(!src.includes('syncAllIfNeededV139(true)'))issues.push('initial Today People sync is not forced once');
  if(!runtime.includes('test-v5.5.js?v=1.3.0-perf39'))issues.push('Today People cache-bust was not advanced for sync deduplication');

  const summary={phase:39,name:'today-people-sync-dedup-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase39TodayPeopleSyncDedupAudit();
