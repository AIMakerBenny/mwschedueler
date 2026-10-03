import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase173PostLoginTimeoutReleaseAudit(){
  const issues=[];
  const warnings=[];
  const loader=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!loader.includes('const POST_LOGIN_LOAD_TIMEOUT_MS=6000;'))issues.push('post-login asset timeout is missing or changed unexpectedly');
  const loadStart=loader.indexOf('function load(key,src,flag)');
  const styleStart=loader.indexOf('function loadStyle',loadStart);
  const failureStart=loader.indexOf('function markCriticalUiFailure',styleStart);
  const loadFn=loadStart>=0&&styleStart>loadStart?loader.slice(loadStart,styleStart):'';
  const styleFn=styleStart>=0&&failureStart>styleStart?loader.slice(styleStart,failureStart):'';
  if(!loadFn.includes("finish(false,'timeout')"))issues.push('script loader can still wait forever');
  if(!styleFn.includes("finish(false,'timeout')"))issues.push('stylesheet loader can still wait forever');
  if(!loader.includes('function finishPostLoginUi(failed=[])'))issues.push('bounded login-gate release function is missing');
  if(!loader.includes("window.__mwsPostLoginUiReadyV130=true"))issues.push('post-login ready flag is missing');
  if(!loader.includes("window.dispatchEvent(new Event('mws:post-login-ui-ready'))"))issues.push('post-login ready event is missing');

  const finishCall=loader.indexOf('finishPostLoginUi(criticalFailures)');
  const achievementLoad=loader.indexOf("load('achievement-media-v1621'",finishCall);
  if(finishCall<0)issues.push('critical asset results do not release the login gate');
  if(achievementLoad<0||achievementLoad<finishCall)issues.push('achievement extras still block login readiness');
  if(!loader.includes("void Promise.all([\n    load('perf-runtime'"))issues.push('noncritical performance/contact enhancements still block login readiness');
  if(!loader.includes("window.__mwsPostLoginUiFailedV130=failed.length>0"))issues.push('degraded UI state is not retained when a bounded load fails');
  if(!entry.includes('post-login-runtime-v130.js?v=1.6.21-phase173-login-timeout'))issues.push('HTML transform does not cache-bust the Phase 173 loader');

  const syntaxFiles=['assets/post-login-runtime-v130.js','src/cf-v111-entry.js'];
  for(const file of syntaxFiles){
    const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(check.status!==0)issues.push(file+' syntax check failed: '+String(check.stderr||check.stdout||'').trim());
  }

  const result={phase:173,name:'post-login-timeout-release',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase173PostLoginTimeoutReleaseAudit();
