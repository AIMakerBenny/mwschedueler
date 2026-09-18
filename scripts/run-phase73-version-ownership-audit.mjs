import fs from 'node:fs';

export function runPhase73VersionOwnershipAudit(){
  const issues=[];
  const warnings=[];
  const version=fs.readFileSync('assets/app-version-v120.js','utf8');
  const tools=fs.readFileSync('assets/tools.js','utf8');
  const planner=fs.readFileSync('assets/content-planner-host.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!version.includes("const VERSION='1.4.0'"))issues.push('authoritative writer is not v1.4.0');
  if(tools.includes("const BUILD='Mawang Scheduler v1.0'"))issues.push('legacy tools BUILD owner remains');
  if(tools.includes("setAttribute('data-build-version'"))issues.push('tools still writes data-build-version');
  if(tools.includes("mwsBuildVersion")||tools.includes("sidebar-build-version"))issues.push('tools still targets visible version nodes');
  if(!tools.includes("window.mwsApplyAppVersionV120?.()"))issues.push('tools no longer delegates version display');
  if(planner.includes("const BUILD='Mawang Scheduler v1.0'"))issues.push('planner still carries obsolete version owner state');
  if(!planner.includes("tools.js?v=1.4.0-phase73"))issues.push('planner does not cache-bust the fixed tools runtime');
  if(perf.includes("setAttribute('data-build-version'"))issues.push('perf runtime still writes build version');
  if(perf.includes("label.textContent='Mawang Scheduler v 1.3.0'"))issues.push('perf runtime still has stale visible-version fallback');
  if(!perf.includes("content-planner-host.js?v=1.4.0-phase73"))issues.push('perf runtime does not load the fixed planner host');
  if(!post.includes("/assets/perf-runtime.js?v=1.4.0-phase73"))issues.push('post-login loader does not load the fixed perf runtime');
  if(!index.includes("assets/perf-runtime.js?v=1.4.0-phase73"))issues.push('source index cache-bust is not phase73');
  if(!entry.includes("post-login-runtime-v130.js?v=1.4.0-phase73"))issues.push('Worker does not inject phase73 post-login runtime');
  if(!entry.includes("app-version-v120.js?v=1.4.0-phase73"))issues.push('Worker compatibility loader does not cache-bust the authoritative version writer');
  if(!entry.includes("source.replace('app-version-v120.js?v=1.3.0','app-version-v120.js?v=1.4.0-phase73')"))issues.push('Worker compatibility loader version rewrite is missing');

  const summary={phase:73,name:'single-version-owner-runtime',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase73VersionOwnershipAudit();
