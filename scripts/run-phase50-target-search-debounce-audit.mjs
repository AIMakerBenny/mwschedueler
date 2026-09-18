import fs from 'node:fs';

export function runPhase50TargetSearchDebounceAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');

  if(!core.includes('let targetSearchTimerV150=0'))issues.push('target-list search has no debounce timer');
  if(!core.includes('function scheduleTargetListRenderV150(delay=90)'))issues.push('target-list search has no scheduled render helper');
  if(!core.includes("targetSearch.oninput=e=>{scheduleTargetListRenderV150(90)}"))issues.push('target-list search does not update during IME composition');
  if(!core.includes("targetSearch.oncompositionend=()=>scheduleTargetListRenderV150(0)"))issues.push('target-list search does not render immediately after composition ends');
  if(core.includes("document.getElementById('targetSearch').oninput=renderTargetList"))issues.push('legacy immediate target-list render remains');

  const summary={phase:50,name:'target-list-search-debounce-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase50TargetSearchDebounceAudit();
