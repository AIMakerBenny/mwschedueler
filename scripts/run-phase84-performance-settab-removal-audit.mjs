import fs from 'node:fs';

export function runPhase84PerformanceSetTabRemovalAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime-base.js','utf8');
  const perfLoader=fs.readFileSync('assets/perf-runtime.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(perf.includes("const baseSetTab=typeof setTab==='function'?setTab:null;"))issues.push('legacy performance setTab wrapper capture remains');
  if(/if\(baseSetTab\)\{setTab=function/.test(perf))issues.push('legacy performance setTab wrapper remains active');
  if(!app.includes("if(tab==='settings')safeRenderView('설정',renderSettings);"))issues.push('canonical settings refresh successor is missing');
  if(!app.includes('window.mwsScheduleImageTune?.()'))issues.push('canonical image-tune request successor is missing');
  if(!perf.includes('window.mwsScheduleImageTune=scheduleImageTune;'))issues.push('image-tune scheduler export was lost');
  if(!/assets\/perf-runtime-base\.js\?v=1\.4\.0-phase(?:8[4-9]|9[0-9]|[1-9][0-9]{2,})/.test(perfLoader))issues.push('perf base cache-bust is older than phase84');
  if(!/\/assets\/perf-runtime\.js\?v=1\.4\.0-phase(?:8[4-9]|9[0-9]|[1-9][0-9]{2,})/.test(post))issues.push('post-login perf cache-bust is older than phase84');
  if(!/assets\/perf-runtime\.js\?v=1\.4\.0-phase(?:8[4-9]|9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('index perf cache-bust is older than phase84');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:8[4-9]|9[0-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than phase84');

  if(perf.includes('optimizedRenderContacts'))issues.push('optimized contact renderer unexpectedly returned');
  if(perf.includes('contactMatches=function'))issues.push('contact matcher override unexpectedly returned');

  const summary={phase:84,name:'performance-settab-wrapper-removal',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase84PerformanceSetTabRemovalAudit();
