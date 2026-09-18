import fs from 'node:fs';

export function runPhase81CanonicalRendererOwnershipAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime-base.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(/optimizedRenderContacts/.test(perf))issues.push('performance runtime still contains a duplicate contact renderer');
  if(/renderContacts\s*=/.test(perf)&&!/renderContacts\(\)/.test(perf))issues.push('performance runtime still reassigns renderContacts');
  if(!app.includes("const mwsFastSearch=typeof window.mwsApplyContactSearch==='function';"))issues.push('canonical renderer does not cooperate with the search fast-path');
  if(!app.includes("mwsSearchInput.value=''"))issues.push('canonical renderer does not render the complete card set for fast filtering');
  if(!app.includes('mws-contact-search-empty'))issues.push('canonical renderer lost the fast-search empty state');
  if(!app.includes('if(mwsFastSearch&&mwsSearchQuery)window.mwsApplyContactSearch();'))issues.push('canonical renderer does not restore the active query after render');
  if(!perf.includes('function applyContactSearch()'))issues.push('search fast-path was removed');
  if(!perf.includes('e?.isComposing?0:80'))issues.push('IME-aware search scheduling was removed');
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:8[1-9]|9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search81');

  const summary={phase:81,name:'canonical-contact-renderer-ownership',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase81CanonicalRendererOwnershipAudit();
