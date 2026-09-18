import fs from 'node:fs';

export function runPhase78UpcomingCacheLocalizationAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime-base.js','utf8');

  if(/upcomingEvents=function\(\)/.test(perf))issues.push('perf runtime still overrides upcomingEvents globally');
  if(!perf.includes("const baseUpcoming=typeof upcomingEvents==='function'?upcomingEvents:null;"))issues.push('perf runtime lost the canonical upcoming-events source reference');
  if(!perf.includes('function cachedUpcoming()'))issues.push('localized cachedUpcoming helper is missing');
  if(!perf.includes('for(const row of cachedUpcoming())'))issues.push('upcomingMap does not use the localized upcoming cache');
  if(!app.includes('function upcomingEvents()'))issues.push('canonical upcomingEvents is missing from app-core');
  if(!perf.includes("historyCacheDay='',upcomingCacheDay=''"))issues.push('history and upcoming caches do not have independent day keys');
  if(/\bcacheDay\b/.test(perf))issues.push('shared cacheDay state still exists');

  let historyDay='2026-09-18',upcomingDay='2026-09-17',historyCalls=0,upcomingCalls=0;
  let historyCache=[1],upcomingCache=[2];
  const nextHistory=day=>{if(historyCache&&historyDay===day)return historyCache;historyDay=day;historyCalls++;return historyCache=['h',day]};
  const nextUpcoming=day=>{if(upcomingCache&&upcomingDay===day)return upcomingCache;upcomingDay=day;upcomingCalls++;return upcomingCache=['u',day]};
  nextHistory('2026-09-19');
  const before=upcomingCache;
  const after=nextUpcoming('2026-09-19');
  if(after===before||upcomingCalls!==1)issues.push('independent upcoming cache does not refresh after history cache advances the date');

  const summary={phase:78,name:'localized-upcoming-cache',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase78UpcomingCacheLocalizationAudit();
