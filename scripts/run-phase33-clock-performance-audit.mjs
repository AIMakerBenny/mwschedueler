import fs from 'node:fs';

export function runPhase33ClockPerformanceAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(core.includes('setInterval(tickClock,1000)'))issues.push('clock still runs through a permanent one-second interval');
  if(!core.includes('clockTimeFormatterV133=new Intl.DateTimeFormat'))issues.push('clock time formatter is not cached');
  if(!core.includes('clockDateFormatterV133=new Intl.DateTimeFormat'))issues.push('clock date formatter is not cached');
  if(!core.includes('if(document.hidden)return'))issues.push('clock work is not suspended in hidden tabs');
  if(!core.includes("document.addEventListener('visibilitychange',scheduleClockV133)"))issues.push('clock does not restart from visibility state changes');
  if(!core.includes('setTimeout(scheduleClockV133,delay)'))issues.push('clock does not use a visibility-aware scheduled timeout');
  if(!index.includes('assets/app-core.js?v=1.3.0-perf35'))issues.push('app-core cache-bust was not advanced for performance fixes');

  const summary={phase:33,name:'clock-background-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase33ClockPerformanceAudit();
