import fs from 'node:fs';

export function runPhase36TodayPeopleStartupPollingAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('assets/test-v5.5.js','utf8');
  const runtime=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(src.includes('setInterval(()=>'))issues.push('Today People startup still uses a tight polling interval');
  if(src.includes('tries>240'))issues.push('Today People startup still performs up to 240 readiness checks');
  if(!src.includes('function tryInstallV136()'))issues.push('Today People startup has no bounded readiness retry helper');
  if(!src.includes("window.addEventListener('mws:post-login-ui-ready',tryInstallV136,{once:true})"))issues.push('Today People startup does not react to post-login UI readiness');
  if(!src.includes('const delays=[120,600,1800]'))issues.push('Today People startup retries are not bounded and backoff-based');
  if(!runtime.includes('test-v5.5.js?v=1.3.0-'))issues.push('Today People cache-bust revision is missing');

  const summary={phase:36,name:'today-people-startup-polling-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase36TodayPeopleStartupPollingAudit();
