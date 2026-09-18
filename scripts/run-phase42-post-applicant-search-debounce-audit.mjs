import fs from 'node:fs';

export function runPhase42PostApplicantSearchDebounceAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!core.includes('let postApplicantSearchTimerV142=0'))issues.push('post applicant search has no debounce timer');
  if(!core.includes('function schedulePostApplicantRenderV142(delay=90)'))issues.push('post applicant search has no scheduled render helper');
  if(!core.includes("postSearch.addEventListener('input',e=>{schedulePostApplicantRenderV142(90)})"))issues.push('post applicant search does not update during IME composition');
  if(!core.includes('schedulePostApplicantRenderV142(90)'))issues.push('post applicant search is not debounced');
  if(!core.includes('schedulePostApplicantRenderV142(0)'))issues.push('post applicant search does not render immediately after composition ends');
  if(core.includes("document.getElementById('postApplicantSearch')?.addEventListener('input',renderPosts)"))issues.push('legacy immediate post applicant render remains');
  if(!index.includes('assets/app-core.js?v=1.3.0-ime64'))issues.push('live IME search cache-bust revision is missing');

  const summary={phase:42,name:'post-applicant-search-debounce-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase42PostApplicantSearchDebounceAudit();
