import fs from 'node:fs';

export function runPhase43SelfContactSearchDebounceAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!core.includes('let selfContactSearchTimerV143=0'))issues.push('self-contact search has no debounce timer');
  if(!core.includes('function scheduleUserIdentityRenderV143(delay=80)'))issues.push('self-contact search has no scheduled render helper');
  if(!core.includes("selfSearch.addEventListener('input',e=>{if(e?.isComposing)return;scheduleUserIdentityRenderV143(80)})"))issues.push('self-contact search is not IME-aware and debounced');
  if(!core.includes("selfSearch.addEventListener('compositionend',()=>scheduleUserIdentityRenderV143(0))"))issues.push('self-contact search does not render immediately after composition ends');
  if(core.includes("document.getElementById('selfContactSearch')?.addEventListener('input',renderUserIdentitySettings)"))issues.push('legacy immediate self-contact render remains');
  if(!index.includes('assets/app-core.js?v=1.3.0-'))issues.push('app-core cache-bust revision is missing');

  const summary={phase:43,name:'self-contact-search-debounce-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase43SelfContactSearchDebounceAudit();
