import fs from 'node:fs';

export function runPhase82PerformanceOwnershipCleanupAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime-base.js','utf8');
  const perfLoader=fs.readFileSync('assets/perf-runtime.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');
  const online=fs.readFileSync('assets/online-v5-loader.js','utf8');

  for(const marker of ['optimizedRenderContacts','cachedHistory','lastMap(','cachedUpcoming','upcomingMap(','baseNormalized','baseUpcoming','historyCacheDay','upcomingCacheDay']){
    if(perf.includes(marker))issues.push('dead performance ownership marker remains: '+marker);
  }
  if(!perf.includes('function invalidate(){}'))issues.push('compatibility invalidate entrypoint was not preserved');
  if(!perf.includes('window.mwsInvalidatePerformanceCaches=invalidate;'))issues.push('performance cache invalidation compatibility export is missing');
  if(!perf.includes('function applyContactSearch()'))issues.push('contact search fast-path is missing');
  if(!perf.includes('function renderActiveAfterSave(reason)'))issues.push('scoped post-save rendering optimization is missing');
  if(!perf.includes('scheduleImageTune()'))issues.push('lazy-image tuning optimization is missing');
  if(!app.includes('function renderContacts()'))issues.push('canonical renderContacts is missing');
  if(!app.includes("const mwsFastSearch=typeof window.mwsApplyContactSearch==='function';"))issues.push('canonical renderer is not fast-search aware');

  if(!perfLoader.includes('assets/perf-runtime-base.js?v=1.4.0-phase82'))issues.push('perf base cache-bust is not phase82');
  if(!post.includes('/assets/perf-runtime.js?v=1.4.0-phase82'))issues.push('post-login perf cache-bust is not phase82');
  if(!index.includes('assets/perf-runtime.js?v=1.4.0-phase82'))issues.push('index perf cache-bust is not phase82');
  if(!entry.includes('post-login-runtime-v130.js?v=1.4.0-phase82'))issues.push('Worker post-login cache-bust is not phase82');
  if(index.includes('assets/test-v5.5.js')||index.includes('assets/test-v5.6.js'))issues.push('deleted test runtimes are referenced again');

  if(online.includes('legacyContactMatcher'))warnings.push('online V5 still needs its legacy matcher sanitizer; keep until compressed payload is regenerated safely');

  const summary={phase:82,name:'performance-ownership-cleanup',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase82PerformanceOwnershipCleanupAudit();
