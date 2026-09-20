import fs from 'node:fs';

export function runPhase34MobileDayObserverPerformanceAudit(){
  const issues=[];
  const warnings=[];
  const feature=fs.readFileSync('assets/mobile-calendar-day-detail-v130.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(feature.includes("observe(grid,{childList:true,subtree:true})"))issues.push('mobile day detail still observes every nested calendar mutation');
  if(!feature.includes("observe(grid,{childList:true})"))issues.push('mobile day detail no longer observes direct calendar rebuilds');
  if(!feature.includes('if(document.hidden||decorateQueued)return'))issues.push('mobile day detail decoration is not suspended in hidden tabs');
  if(!feature.includes("document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueDecorate()})"))issues.push('mobile day detail does not resynchronize after tab visibility returns');
  if(!runtime.includes('mobile-calendar-day-detail-v130.js?v=1.3.0-perf35'))issues.push('day-detail cache-bust was not advanced for observer optimization');

  const summary={phase:34,name:'mobile-day-observer-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase34MobileDayObserverPerformanceAudit();
