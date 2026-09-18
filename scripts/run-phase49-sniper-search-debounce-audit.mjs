import fs from 'node:fs';

export function runPhase49SniperSearchDebounceAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!core.includes('let sniperSearchTimerV149=0'))issues.push('sniper search has no debounce timer');
  if(!core.includes('function scheduleSniperRenderV149(delay=90)'))issues.push('sniper search has no scheduled render helper');
  if(!core.includes("sniperSearch.oninput=e=>{if(e?.isComposing)return;scheduleSniperRenderV149(90)}"))issues.push('sniper search is not IME-aware and debounced');
  if(!core.includes("sniperSearch.oncompositionend=()=>scheduleSniperRenderV149(0)"))issues.push('sniper search does not render immediately after composition ends');
  if(core.includes("document.getElementById('sniperSearch').oninput=renderSniperList"))issues.push('legacy immediate sniper render remains');
  if(!index.includes('assets/app-core.js?v=1.3.0-perf51'))issues.push('app-core cache-bust was not advanced for search optimization');

  const summary={phase:49,name:'sniper-search-debounce-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase49SniperSearchDebounceAudit();
