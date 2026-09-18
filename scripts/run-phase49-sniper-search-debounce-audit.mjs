import fs from 'node:fs';

export function runPhase49SniperSearchDebounceAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!core.includes('let sniperSearchTimerV149=0'))issues.push('sniper search has no debounce timer');
  if(!core.includes('function scheduleSniperRenderV149(delay=90)'))issues.push('sniper search has no scheduled render helper');
  if(!core.includes("sniperSearch.oninput=e=>{scheduleSniperRenderV149(90)}"))issues.push('sniper search does not update during IME composition');
  if(!core.includes("sniperSearch.oncompositionend=()=>scheduleSniperRenderV149(0)"))issues.push('sniper search does not render immediately after composition ends');
  if(core.includes("document.getElementById('sniperSearch').oninput=renderSniperList"))issues.push('legacy immediate sniper render remains');
  if(core.includes('isComposing)return;'))issues.push('a core search still blocks live Korean IME input');
  if(!index.includes('assets/app-core.js?v=1.3.0-ime64'))issues.push('app-core cache-bust was not advanced for live IME search');

  const summary={phase:49,name:'sniper-search-debounce-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase49SniperSearchDebounceAudit();
