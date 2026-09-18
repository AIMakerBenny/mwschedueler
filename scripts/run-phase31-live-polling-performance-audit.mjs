import fs from 'node:fs';

export function runPhase31LivePollingPerformanceAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('assets/v130-live-contact-fix.js','utf8');
  const loader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');

  if(!src.includes('const LIVE_INTERVAL=30000'))issues.push('LIVE fallback polling interval was not relaxed');
  if(!src.includes("const active=document.querySelector('.section.active')"))issues.push('LIVE fallback still searches hidden sections instead of the active section');
  if(!src.includes('if(liveBusy||document.hidden)return'))issues.push('LIVE refresh is not suspended in hidden browser tabs');
  if(!src.includes('function stopLiveTimer()'))issues.push('LIVE polling has no explicit stop path');
  if(!src.includes("document.addEventListener('visibilitychange'"))issues.push('LIVE polling does not react to tab visibility');
  if(src.includes("new MutationObserver(()=>{if(friendRoot())scheduleLive()}).observe(document.body,{childList:true,subtree:true})"))issues.push('LIVE fallback still observes all DOM mutations');
  if(src.includes('[data-tab="friendFinder"],[data-tab="friends"],button'))issues.push('LIVE refresh is still triggered by every application button');
  if(src.includes('new MutationObserver(installVisitFix).observe(document.body'))issues.push('contact station fix still observes the entire DOM permanently');
  if(!loader.includes('v130-live-contact-fix.js?v=1.3.0-perf31'))issues.push('LIVE performance cache-bust revision is missing');

  const summary={phase:31,name:'live-active-tab-polling-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase31LivePollingPerformanceAudit();
