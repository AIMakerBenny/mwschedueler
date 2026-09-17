import fs from 'node:fs';

function between(src,a,b){
  const start=src.indexOf(a);
  if(start<0)return '';
  const end=src.indexOf(b,start+a.length);
  return src.slice(start,end>start?end:src.length);
}

export function runPhase6HydrationFailureIsolationAudit(){
  const issues=[];
  const warnings=[];
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');
  const cloud=fs.readFileSync('assets/cloud-v1.1.js','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');

  if(!core.includes("localStorage.getItem('mawangSchedulerBeta')"))warnings.push('legacy local bootstrap source is no longer present; reproduction precondition changed');
  if(!cloud.includes("if(!allCached)throw new Error('필수 데이터와 IndexedDB 캐시를 모두 불러오지 못했습니다.')"))warnings.push('mandatory hydration failure trigger changed');

  const enter=between(entry,"function enterAppShell(chosen){","function revealReadyShell()");
  const hydration=between(entry,'async function startHydration(chosen){','async function adminLogin');
  const catchStart=hydration.indexOf('}catch(error){');
  const catchBody=catchStart>=0?hydration.slice(catchStart):'';

  if(!enter.includes('window.__mwsAppReadyV130=false'))issues.push('a new hydration attempt does not reset the prior app-ready state');
  if(!catchBody.includes('loadedParts.clear()'))issues.push('failed mandatory hydration leaves partially trusted loadedParts active');
  if(!catchBody.includes('baselineJson.clear()'))issues.push('failed mandatory hydration leaves partial save baselines active');
  if(!catchBody.includes('dirtyParts.clear()'))issues.push('failed mandatory hydration leaves dirty save state active');
  if(!catchBody.includes('showGate()'))issues.push('mandatory data failure can still expose the application shell');
  if(!catchBody.includes("setLoginError('로그인에는 성공했지만 필수 데이터를 불러오지 못했습니다."))issues.push('mandatory data failure is not explained on the access gate');
  if(catchBody.includes('markAppReady(chosen,true)'))issues.push('mandatory hydration failure is still promoted to app-ready');

  const model={legacyLocalData:true,mandatoryCloudOrCache:false,partialLoadedParts:true};
  const shouldReveal=model.mandatoryCloudOrCache;
  const shouldPermitSave=model.mandatoryCloudOrCache;
  if(shouldReveal||shouldPermitSave)issues.push('failure model incorrectly permits stale shell exposure or save');

  const result={phase:6,name:'mandatory-hydration-failure-isolation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase6HydrationFailureIsolationAudit();
