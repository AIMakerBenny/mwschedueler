import fs from 'node:fs';

export function runPhase87SafeRuntimeDedupAudit(){
  const issues=[];
  const warnings=[];
  const device=fs.readFileSync('assets/device-ui.js','utf8');
  const planner=fs.readFileSync('assets/content-planner-host.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of ['function refreshModeUi()','function refreshNavState()','function refreshCalendarDates()','function refresh()']){
    if(!device.includes(token))issues.push('device UI split refresh missing: '+token);
  }
  if(!device.includes('new MutationObserver(queueNav)'))issues.push('sidebar observer is not scoped to nav refresh');
  if(!device.includes('new MutationObserver(queueCalendar)'))issues.push('calendar observer is not scoped to calendar-date refresh');
  if(device.includes("new MutationObserver(update).observe(document.querySelector('.sidebar .nav')"))issues.push('legacy full-refresh sidebar observer remains');
  if(!device.includes("window.addEventListener('mawang:datachange',queueFull)"))issues.push('device UI data-change refresh safety was lost');
  if(!device.includes("document.addEventListener('visibilitychange'"))issues.push('device UI visibility refresh safety was lost');

  if(!planner.includes('const INSTALL_RETRY_DELAYS=[0,100,300,800,1600,3000,3500];'))issues.push('planner retry safety schedule changed');
  if(!planner.includes('function installReady()'))issues.push('planner completion check missing');
  if(!planner.includes('function cancelInstallRetries()'))issues.push('planner retry cancellation missing');
  if(!planner.includes('if(installReady()){installSettled=true;cancelInstallRetries()}'))issues.push('planner does not cancel retries after successful install');
  if(!planner.includes("window.addEventListener('DOMContentLoaded',install,{once:true})"))issues.push('planner DOMContentLoaded fallback was lost');
  if(!planner.includes("window.addEventListener('load',install,{once:true})"))issues.push('planner load fallback was lost');
  if(!planner.includes("window.addEventListener('mawang:datachange'"))issues.push('planner data sync listener was lost');
  for(const token of ['ensureStyle();','ensureSection();','ensureNav();','installOrderGuard();','ensureEmoticonManagerV114();','loadTools();']){
    if(!planner.includes(token))issues.push('planner install feature missing: '+token);
  }

  if(!/assets\/device-ui\.js\?v=1\.3\.0-perf(?:8[7-9]|9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('index device UI cache-bust is older than perf87');
  if(!/\/assets\/device-ui\.js\?v=1\.3\.0-perf(?:8[7-9]|9[0-9]|[1-9][0-9]{2,})/.test(post))issues.push('post-login device UI cache-bust is older than perf87');
  if(!/content-planner-host\.js\?v=1\.4\.0-phase(?:8[7-9]|9[0-9]|[1-9][0-9]{2,})/.test(perf))issues.push('planner host cache-bust is older than phase87');
  if(!/assets\/perf-runtime\.js\?v=1\.4\.0-phase(?:8[7-9]|9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('index perf runtime cache-bust is older than phase87');
  if(!/\/assets\/perf-runtime\.js\?v=1\.4\.0-phase(?:8[7-9]|9[0-9]|[1-9][0-9]{2,})/.test(post))issues.push('post-login perf runtime cache-bust is older than phase87');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:8[7-9]|9[0-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than phase87');

  const summary={phase:87,name:'safe-runtime-dedup',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase87SafeRuntimeDedupAudit();
