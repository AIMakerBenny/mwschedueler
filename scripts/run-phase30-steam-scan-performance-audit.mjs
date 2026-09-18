import fs from 'node:fs';

export function runPhase30SteamScanPerformanceAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('assets/steam-game-v111.js','utf8');
  const loader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');

  if(src.includes('setInterval(scan,1200)'))issues.push('Steam integration still performs a permanent 1.2-second full DOM scan');
  if(src.includes("observe(target,{childList:true,subtree:true,attributes:true"))issues.push('Steam integration still observes the entire document subtree and class mutations');
  if(!src.includes("__mwsSteamGridObserverV111"))issues.push('Steam integration does not observe the calendar root directly');
  if(!src.includes("__mwsSteamDashboardObserverV111"))issues.push('Steam integration does not observe the dashboard root directly');
  if(!src.includes("__mwsSteamModalObserverV111"))issues.push('Steam editor state is not observed independently');
  if(!src.includes('if(document.hidden||scanTimer)return'))issues.push('Steam scanning is not suspended while the document is hidden');
  if(!src.includes('mwsSteamSignature'))issues.push('Steam slot rendering still rewrites identical slot markup on every scan');
  if(!loader.includes('steam-game-v111.js?v=1.1.4-perf30'))issues.push('Steam performance cache-bust revision is missing');

  const summary={phase:30,name:'steam-event-driven-scan-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase30SteamScanPerformanceAudit();
