import fs from 'node:fs';

export function runPhase44PreviewObserverPerformanceAudit(){
  const issues=[];
  const warnings=[];
  const ui=fs.readFileSync('assets/ui-fixes-v121.js','utf8');
  const loader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');

  if(!ui.includes('let previewTuneFrameV144=0'))issues.push('preview observer has no shared animation-frame gate');
  if(!ui.includes('function queuePreviewTuneV144()'))issues.push('preview observer has no coalescing queue');
  if(!ui.includes('if(document.hidden||previewTuneFrameV144)return'))issues.push('preview tuning is not suspended or deduplicated');
  if(!ui.includes("mutations.some(m=>m.type==='childList')"))issues.push('preview observer does not filter to structural changes');
  if(ui.includes('characterData:true'))issues.push('preview observer still watches all text mutations');
  if(!ui.includes("document.addEventListener('visibilitychange'"))issues.push('preview observer does not resync after returning to a hidden tab');
  if(!loader.includes('ui-fixes-v121.js?v=1.2.3-perf44'))issues.push('UI fixes cache-bust was not advanced for preview observer optimization');

  const summary={phase:44,name:'calendar-preview-observer-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase44PreviewObserverPerformanceAudit();
