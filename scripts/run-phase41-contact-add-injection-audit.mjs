import fs from 'node:fs';

export function runPhase41ContactAddInjectionAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('assets/contact-runtime-v130.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(!src.includes('existing.dataset.groupKey===key'))issues.push('contact add control is still recreated even when its host/group is unchanged');
  if(!src.includes('b.dataset.groupKey=key'))issues.push('contact add control does not retain its host/group identity');
  if(!src.includes('function queueInjectAddV141()'))issues.push('contact add injection has no coalescing queue');
  if(!src.includes('if(injectQueuedV141)return'))issues.push('contact add injection does not collapse duplicate refresh requests');
  if(!src.includes('queueMicrotask(()=>{injectQueuedV141=false;injectAdd()})'))issues.push('contact add injection is not coalesced into one microtask');
  if(src.includes("setTimeout(()=>{visibility();injectAdd()},0)"))issues.push('legacy repeated setTimeout contact injection remains');
  if(!/contact-runtime-v130\.js\?v=1\.3\.0-search(?:6[7-9]|[7-9][0-9]|[1-9][0-9]{2,})/.test(runtime))issues.push('contact enhancement cache-bust is older than search67');

  const summary={phase:41,name:'contact-add-dom-churn-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase41ContactAddInjectionAudit();
