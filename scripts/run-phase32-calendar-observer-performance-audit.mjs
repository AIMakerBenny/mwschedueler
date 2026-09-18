import fs from 'node:fs';

export function runPhase32CalendarObserverPerformanceAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('assets/device-ui.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(src.includes("observe(document.getElementById('calendarGrid'),{childList:true,subtree:true})"))issues.push('device refresh still wakes for every nested calendar mutation');
  if(src.includes("observe(grid,{childList:true,subtree:true})"))issues.push('mobile calendar view still wakes for every nested event-card mutation');
  if(!src.includes("observe(document.getElementById('calendarGrid'),{childList:true})"))issues.push('device refresh no longer observes direct calendar rebuilds');
  if(!src.includes("observe(grid,{childList:true})"))issues.push('mobile calendar view no longer observes direct calendar rebuilds');
  if(!src.includes('if(document.hidden||queued)return'))issues.push('device UI refresh is not suspended in hidden tabs');
  if(!src.includes('if(document.hidden||scheduled)return'))issues.push('mobile calendar rendering is not suspended in hidden tabs');
  if((src.match(/visibilitychange/g)||[]).length<2)issues.push('device UI does not resynchronize both observer paths after returning to the tab');
  if(!runtime.includes('device-ui.js?v=1.3.0-'))issues.push('post-login device UI cache-bust revision is missing');
  if(!index.includes('assets/device-ui.js?v=1.3.0-'))issues.push('source document device UI cache-bust revision is missing');

  const summary={phase:32,name:'calendar-observer-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase32CalendarObserverPerformanceAudit();
