import fs from 'node:fs';

export function runPhase86ContactSetTabRemovalAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const contact=fs.readFileSync('assets/contact-runtime-v130.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!app.includes('window.mwsContactRuntimeOnTabV130?.(tab)'))issues.push('canonical setTab lost contact-runtime tab hook invocation');
  if(!contact.includes('window.mwsContactRuntimeOnTabV130=function(t)'))issues.push('contact-runtime successor tab hook is missing');
  if(!contact.includes("if(t==='contacts')queueInjectAddV141();"))issues.push('contact tab hook lost add-card injection');
  if(!/if\(t==='sniper'\)setTimeout\(historyUI,0\);?/.test(contact))issues.push('contact tab hook lost sniper history UI injection');

  if(contact.includes('function hookTab()'))issues.push('legacy contact setTab hook function remains');
  if(contact.includes('hookTab();'))issues.push('legacy contact setTab hook boot call remains');
  if(/window\.setTab\s*=\s*w/.test(contact))issues.push('contact runtime still reassigns window.setTab');

  if(!/contact-runtime-v130\.js\?v=1\.3\.0-search(?:8[6-9]|9[0-9]|[1-9][0-9]{2,})/.test(post))issues.push('contact runtime cache-bust is older than search86');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:8[6-9]|9[0-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than phase86');

  const summary={phase:86,name:'contact-settab-wrapper-removal',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase86ContactSetTabRemovalAudit();
