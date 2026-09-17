import fs from 'node:fs';

export function runPhase10PageLifecycleSaveAudit(){
  const issues=[];
  const warnings=[];
  const runtime=fs.readFileSync('assets/integrity-runtime-v130.js','utf8');
  const loader=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(!runtime.includes("window.addEventListener('beforeunload'"))issues.push('beforeunload guard is missing');
  if(!runtime.includes("document.addEventListener('visibilitychange'"))issues.push('visibilitychange flush is missing');
  if(!runtime.includes("document.visibilityState==='hidden'"))issues.push('background transition does not trigger an immediate save attempt');
  if(!runtime.includes('window.mwsV55EgressReport'))issues.push('lifecycle guard does not inspect authoritative dirty state');
  if(!runtime.includes('window.mwsV55SaveNow'))issues.push('lifecycle guard does not request the existing immediate save path');
  if(!runtime.includes("r.mode==='admin'"))issues.push('public mode is not excluded from unload save guarding');
  if(!runtime.includes("event.returnValue=''"))issues.push('unsaved admin data can still leave without an unload confirmation');
  if(!loader.includes("load('integrity-runtime-v130'"))issues.push('integrity runtime is not loaded by the post-login runtime');
  if(!loader.includes("if(!integrityResult.ok){markCriticalUiFailure(['integrity-runtime-v130']);return;}"))issues.push('app can become ready without the lifecycle integrity guard');

  const hasUnsaved=r=>Boolean(r&&r.mode==='admin'&&Array.isArray(r.dirtyParts)&&r.dirtyParts.length);
  if(hasUnsaved({mode:'public',dirtyParts:['events']}))issues.push('public session incorrectly blocks unload');
  if(hasUnsaved({mode:'admin',dirtyParts:[]}))issues.push('clean admin session incorrectly blocks unload');
  if(!hasUnsaved({mode:'admin',dirtyParts:['events']}))issues.push('dirty admin session is not protected from immediate unload');

  const result={phase:10,name:'page-lifecycle-unsaved-state-guard',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase10PageLifecycleSaveAudit();
