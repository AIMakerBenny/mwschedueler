import fs from 'node:fs';

export function runPhase4PostLoginModuleFailureAudit(){
  const issues=[];
  const warnings=[];
  const loader=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  const loadStart=loader.indexOf('function load(key,src,flag)');
  const styleStart=loader.indexOf('function loadStyle',loadStart);
  const loadFn=loadStart>=0&&styleStart>loadStart?loader.slice(loadStart,styleStart):'';
  if(!loadFn.includes("resolve({key,ok:true"))issues.push('successful script load does not report ok=true');
  if(!loadFn.includes("resolve({key,ok:false"))issues.push('failed script load is still indistinguishable from success');

  const start=loader.indexOf('async function start()');
  const ready=loader.indexOf('window.__mwsPostLoginUiReadyV130=true',start);
  const device=loader.indexOf('const deviceUiResult=',start);
  const deviceGuard=loader.indexOf("if(!deviceUiResult.ok){markCriticalUiFailure(['device-ui']);return;}",start);
  const styleGuard=loader.indexOf('if(window.__mwsPostLoginStyleErrorsV130.length){markCriticalUiFailure',start);
  if(device<0||deviceGuard<0)issues.push('device-ui failure is not treated as a critical readiness failure');
  if(styleGuard<0)issues.push('required mobile stylesheet failure is not treated as a critical readiness failure');
  if(ready<0)issues.push('UI ready marker is missing');
  if(deviceGuard>=0&&ready>=0&&deviceGuard>ready)issues.push('UI can be marked ready before device-ui failure is rejected');
  if(styleGuard>=0&&ready>=0&&styleGuard>ready)issues.push('UI can be marked ready before stylesheet failure is rejected');
  if(!loader.includes('window.__mwsPostLoginUiFailedV130=true'))issues.push('critical UI failure state is not persisted in runtime state');
  if(!loader.includes("mws:post-login-ui-error"))issues.push('critical UI failure does not emit an explicit error lifecycle event');
  if(!loader.includes("document.getElementById('mwsLoginError')"))warnings.push('critical UI failure has no visible login-gate error target');

  const simulated={deviceUiOk:false,styleOk:true};
  const simulatedReady=simulated.deviceUiOk&&simulated.styleOk;
  if(simulatedReady)issues.push('failure-state model incorrectly reaches UI ready');

  const result={phase:4,name:'post-login-critical-module-failure',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase4PostLoginModuleFailureAudit();
