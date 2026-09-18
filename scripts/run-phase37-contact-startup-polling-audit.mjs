import fs from 'node:fs';

export function runPhase37ContactStartupPollingAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('assets/contact-runtime-v130.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(src.includes('setInterval(()=>'))issues.push('contact enhancement startup still uses a tight polling interval');
  if(src.includes('n>240'))issues.push('contact enhancement startup still performs up to 240 readiness checks');
  if(!src.includes('function tryBootV137()'))issues.push('contact enhancement startup has no bounded readiness retry helper');
  if(!src.includes("window.addEventListener('mws:post-login-ui-ready',tryBootV137,{once:true})"))issues.push('contact enhancement startup does not react to post-login UI readiness');
  if(!src.includes('const delays=[120,600,1800]'))issues.push('contact enhancement retries are not bounded and backoff-based');
  if(!runtime.includes('test-v5.6.js?v=1.3.0-'))issues.push('contact enhancement cache-bust revision is missing');

  const summary={phase:37,name:'contact-startup-polling-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase37ContactStartupPollingAudit();
