import fs from 'node:fs';

export function runPhase83SetTabSuccessorAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime-base.js','utf8');
  const perfLoader=fs.readFileSync('assets/perf-runtime.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!app.includes("if(tab==='settings')safeRenderView('설정',renderSettings);"))issues.push('canonical setTab does not own settings refresh parity');
  if(!app.includes('window.mwsScheduleImageTune?.()'))issues.push('canonical setTab does not request lazy-image tuning');
  if(!perf.includes('window.mwsScheduleImageTune=scheduleImageTune;'))issues.push('performance runtime does not expose the existing image-tune scheduler');
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:8[3-9]|9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search83');
  if(!/assets\/perf-runtime-base\.js\?v=1\.4\.0-phase(?:8[3-9]|9[0-9]|[1-9][0-9]{2,})/.test(perfLoader))issues.push('perf base cache-bust is older than phase83');
  if(!/\/assets\/perf-runtime\.js\?v=1\.4\.0-phase(?:8[3-9]|9[0-9]|[1-9][0-9]{2,})/.test(post))issues.push('post-login perf cache-bust is older than phase83');
  if(!/assets\/perf-runtime\.js\?v=1\.4\.0-phase(?:8[3-9]|9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('index perf cache-bust is older than phase83');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:8[3-9]|9[0-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than phase83');

  if(!perf.includes("const baseSetTab=typeof setTab==='function'?setTab:null;"))warnings.push('legacy performance setTab wrapper is already absent; Phase 84 removal may already have occurred');

  const summary={phase:83,name:'settab-successor-activation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase83SetTabSuccessorAudit();
