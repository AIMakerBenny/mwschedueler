import fs from 'node:fs';

export function runPhase51TargetPickerSearchDebounceAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!core.includes('let targetPickerSearchTimerV151=0'))issues.push('target-picker search has no debounce timer');
  if(!core.includes('function scheduleTargetPickerRenderV151(delay=80)'))issues.push('target-picker search has no scheduled render helper');
  if(!core.includes("targetPickerSearch.oninput=e=>{scheduleTargetPickerRenderV151(80)}"))issues.push('target-picker search does not update during IME composition');
  if(!core.includes("targetPickerSearch.oncompositionend=()=>scheduleTargetPickerRenderV151(0)"))issues.push('target-picker search does not render immediately after composition ends');
  if(core.includes("document.getElementById('targetPickerSearch').oninput=renderTargetPicker"))issues.push('legacy immediate target-picker render remains');
  if(!index.includes('assets/app-core.js?v=1.3.0-ime64'))issues.push('app-core cache-bust was not advanced for live IME search');

  const summary={phase:51,name:'target-picker-search-debounce-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase51TargetPickerSearchDebounceAudit();
