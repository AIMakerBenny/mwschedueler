import fs from 'node:fs';

function sliceFunction(source,name,nextName){
  const start=source.indexOf(`function ${name}`);
  if(start<0)return '';
  const end=nextName?source.indexOf(`function ${nextName}`,start+1):-1;
  return source.slice(start,end>start?end:Math.min(source.length,start+2400));
}

export function runPhase2StartupReadinessAudit(){
  const issues=[];
  const warnings=[];
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');
  const loader=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  const enter=sliceFunction(entry,'enterAppShell','revealReadyShell');
  const reveal=sliceFunction(entry,'revealReadyShell','markAppReady');
  const ready=sliceFunction(entry,'markAppReady','startHydration');

  if(!enter)issues.push('enterAppShell injection is missing');
  if(enter.includes('hideGate()'))issues.push('authentication still hides the gate before hydration/UI readiness');
  if(!enter.includes('mws-app-loading'))issues.push('authenticated loading state is not recorded');
  if(!reveal.includes('hideGate()'))issues.push('ready-shell reveal no longer owns gate removal');
  if(!ready.includes("mws:post-login-ui-ready"))issues.push('app readiness does not wait for post-login UI readiness');
  if(!ready.includes("mws:app-ready"))issues.push('app-ready dispatch is missing');
  const listenAt=ready.indexOf('mws:post-login-ui-ready');
  const dispatchAt=ready.lastIndexOf('mws:app-ready');
  if(listenAt<0||dispatchAt<0||listenAt>dispatchAt)issues.push('post-login readiness listener must be armed before app-ready dispatch');

  const flagAt=loader.indexOf('window.__mwsPostLoginUiReadyV130=true');
  const eventAt=loader.indexOf("mws:post-login-ui-ready");
  const deviceAt=loader.indexOf("await load('device-ui'");
  if(deviceAt<0||flagAt<0||eventAt<0)issues.push('post-login loader readiness chain is incomplete');
  else if(!(deviceAt<flagAt&&flagAt<eventAt))issues.push('post-login UI ready event fires before device UI is loaded');

  const result={phase:2,name:'startup-readiness-gate',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase2StartupReadinessAudit();
