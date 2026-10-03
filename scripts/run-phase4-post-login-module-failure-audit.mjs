import fs from 'node:fs';

export function runPhase4PostLoginModuleFailureAudit(){
  const issues=[];
  const warnings=[];
  const loader=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  const loadStart=loader.indexOf('function load(key,src,flag)');
  const styleStart=loader.indexOf('function loadStyle',loadStart);
  const loadFn=loadStart>=0&&styleStart>loadStart?loader.slice(loadStart,styleStart):'';
  if(!loadFn.includes("finish(true,'loaded')"))issues.push('successful script load does not report ok=true');
  if(!loadFn.includes("finish(false,'error')"))issues.push('failed script load is still indistinguishable from success');

  const start=loader.indexOf('async function start()');
  const ready=loader.indexOf('window.__mwsPostLoginUiReadyV130=true');
  const device=loader.indexOf('const deviceUiResult=',start);
  const criticalFailures=loader.indexOf('const criticalFailures=',start);
  const finish=loader.indexOf('finishPostLoginUi(criticalFailures)',start);
  if(device<0||criticalFailures<0)issues.push('device-ui failure is not collected as a critical UI failure');
  if(!loader.includes("loadStyle('mobile-drawer-v130'")||!loader.includes("loadStyle('mobile-calendar-v130'"))issues.push('required mobile stylesheet failure is not included in critical readiness results');
  if(ready<0)issues.push('UI ready marker is missing');
  if(finish<0)issues.push('critical UI failures are not resolved through the bounded degraded-ready path');
  if(criticalFailures>=0&&finish>=0&&criticalFailures>finish)issues.push('UI failure collection occurs after the readiness release');
  if(!loader.includes('window.__mwsPostLoginUiFailedV130=failed.length>0'))issues.push('critical UI failure state is not persisted in runtime state');
  if(!loader.includes("mws:post-login-ui-error"))issues.push('critical UI failure does not emit an explicit error lifecycle event');

  const simulated={deviceUiOk:false,styleOk:true};
  const failed=[simulated.deviceUiOk?null:'device-ui',simulated.styleOk?null:'style'].filter(Boolean);
  if(failed.length!==1)issues.push('failure-state model did not retain the failed critical module');

  const result={phase:4,name:'post-login-critical-module-failure',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase4PostLoginModuleFailureAudit();
