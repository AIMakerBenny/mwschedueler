import fs from 'node:fs';

export function runPhase40ParticipantSearchDebounceAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('assets/test-v5.6.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(!src.includes('let participantSearchTimerV140=0'))issues.push('participant search has no debounce timer');
  if(!src.includes('function scheduleParticipantRenderV140(delay=80)'))issues.push('participant search has no scheduled render helper');
  if(!src.includes('if(e?.isComposing)return'))issues.push('participant search does not avoid IME composition churn');
  if(!src.includes('scheduleParticipantRenderV140(80)'))issues.push('participant search is not debounced');
  if(!src.includes('scheduleParticipantRenderV140(0)'))issues.push('participant search does not render immediately after composition ends');
  if(src.includes('i.oninput=participantRender'))issues.push('legacy immediate participant render remains');
  if(!runtime.includes('test-v5.6.js?v=1.3.0-perf41'))issues.push('contact enhancement cache-bust was not advanced');

  const summary={phase:40,name:'participant-search-debounce-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase40ParticipantSearchDebounceAudit();
