import fs from 'node:fs';

export function runPhase79DeadRuntimeReferenceAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const perf=fs.readFileSync('assets/perf-runtime-base.js','utf8');
  const perfLoader=fs.readFileSync('assets/perf-runtime.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');
  const online=fs.readFileSync('assets/online-v5-loader.js','utf8');

  if(index.includes('assets/test-v5.5.js'))issues.push('source index still references deleted test-v5.5.js');
  if(index.includes('assets/test-v5.6.js'))issues.push('source index still references deleted test-v5.6.js');
  if(perf.includes('searchKeyCache'))issues.push('dead performance searchKeyCache state remains');
  if(!perfLoader.includes('assets/perf-runtime-base.js?v=1.4.0-phase79'))issues.push('perf base cache-bust is not phase79');
  if(!post.includes('/assets/perf-runtime.js?v=1.4.0-phase79'))issues.push('post-login runtime cache-bust is not phase79');
  if(!index.includes('assets/perf-runtime.js?v=1.4.0-phase79'))issues.push('source index perf cache-bust is not phase79');
  if(!entry.includes('post-login-runtime-v130.js?v=1.4.0-phase79'))issues.push('Worker post-login cache-bust is not phase79');

  if(perf.includes('renderContacts=optimizedRenderContacts')||perf.includes('optimizedRenderContacts'))issues.push('legacy optimized contact renderer override remains');
  if(!online.includes('run(safeFeatures)'))issues.push('legacy V5 payload sanitizer was removed while compressed legacy matcher still exists');
  if(entry.includes("'test-v5\\.5\\.js'")&&entry.includes("'test-v5\\.6\\.js'"))warnings.push('Worker keeps deleted test-runtime names only as compatibility stripping guards; source index references are gone');

  const summary={phase:79,name:'dead-runtime-reference-cleanup',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase79DeadRuntimeReferenceAudit();
