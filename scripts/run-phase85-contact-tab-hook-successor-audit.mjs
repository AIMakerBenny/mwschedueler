import fs from 'node:fs';

export function runPhase85ContactTabHookSuccessorAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const contact=fs.readFileSync('assets/contact-runtime-v130.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!app.includes('window.mwsContactRuntimeOnTabV130?.(tab)'))issues.push('canonical setTab does not invoke the contact-runtime tab hook');
  if(!contact.includes('window.mwsContactRuntimeOnTabV130=function(t)'))issues.push('contact runtime does not expose its tab hook');
  if(!contact.includes("if(t==='contacts')queueInjectAddV141();"))issues.push('contact tab hook lost add-card injection');
  if(!contact.includes("if(t==='sniper')setTimeout(historyUI,0);"))issues.push('contact tab hook lost sniper history UI injection');
  if(!contact.includes('function hookTab()'))issues.push('legacy contact setTab wrapper was removed in the successor activation phase');
  if(!contact.includes('window.mwsContactRuntimeOnTabV130(t)'))issues.push('legacy wrapper does not delegate to the successor hook');
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:8[5-9]|9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search85');
  if(!/contact-runtime-v130\.js\?v=1\.3\.0-search(?:8[5-9]|9[0-9]|[1-9][0-9]{2,})/.test(post))issues.push('contact runtime cache-bust is older than search85');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:8[5-9]|9[0-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than phase85');

  const summary={phase:85,name:'contact-tab-hook-successor-activation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase85ContactTabHookSuccessorAudit();
