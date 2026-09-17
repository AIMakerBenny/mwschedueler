import fs from 'node:fs';

export function runPhase3PostLoginStyleReadinessAudit(){
  const issues=[];
  const warnings=[];
  const loader=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  const styleStart=loader.indexOf('function loadStyle');
  const startStart=loader.indexOf('async function start()');
  const styleFn=styleStart>=0&&startStart>styleStart?loader.slice(styleStart,startStart):'';
  if(!styleFn.includes('new Promise'))issues.push('loadStyle does not expose stylesheet completion as a Promise');
  if(!styleFn.includes('link.onload'))issues.push('stylesheet onload is not observed');
  if(!styleFn.includes('link.onerror'))issues.push('stylesheet onerror is not observed');

  const awaitStyles=loader.indexOf('await Promise.all([');
  const readyFlag=loader.indexOf('window.__mwsPostLoginUiReadyV130=true');
  const readyEvent=loader.indexOf("mws:post-login-ui-ready");
  if(awaitStyles<0)issues.push('required mobile styles are not awaited as a readiness barrier');
  if(readyFlag<0||readyEvent<0)issues.push('post-login UI ready marker/event is missing');
  if(awaitStyles>=0&&readyFlag>=0&&awaitStyles>readyFlag)issues.push('UI is marked ready before required styles finish loading');
  if(readyFlag>=0&&readyEvent>=0&&readyFlag>readyEvent)issues.push('UI ready event is dispatched before the ready flag is set');
  if(!loader.includes("loadStyle('mobile-drawer-v130'"))issues.push('authoritative mobile drawer stylesheet is absent from readiness barrier');
  if(!loader.includes("loadStyle('mobile-calendar-v130'"))issues.push('authoritative mobile calendar stylesheet is absent from readiness barrier');

  const result={phase:3,name:'post-login-style-readiness',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase3PostLoginStyleReadinessAudit();
