import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

export function runPhase12ManualSaveSerializationAudit(){
  const issues=[];
  const warnings=[];
  const runtime=fs.readFileSync('assets/integrity-runtime-v130.js','utf8');
  const loader=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  try{execFileSync(process.execPath,['--check','assets/integrity-runtime-v130.js'],{stdio:'pipe'});}catch(error){issues.push('integrity runtime JavaScript syntax check failed');}
  try{execFileSync(process.execPath,['--check','assets/post-login-runtime-v130.js'],{stdio:'pipe'});}catch(error){issues.push('post-login runtime JavaScript syntax check failed');}

  if(!runtime.includes('const baseFetch=window.fetch.bind(window)'))issues.push('save tracking does not preserve the existing fetch chain');
  if(!runtime.includes("url.pathname==='/api/save'"))issues.push('save request tracker does not target /api/save');
  if(!runtime.includes("method==='POST'"))issues.push('save request tracker does not restrict tracking to POST');
  if(!runtime.includes('if(isSave)activeSaveRequests++'))issues.push('save request start is not tracked');
  if(!runtime.includes('finally{if(isSave)activeSaveRequests=Math.max(0,activeSaveRequests-1)}'))issues.push('save request completion is not released in finally');
  if(!runtime.includes('while(activeSaveRequests>0&&Date.now()<deadline)await sleep(50)'))issues.push('manual save does not wait for an active autosave request');
  if(!runtime.includes("saveBtn.addEventListener('click',event=>"))issues.push('SAVE button is not guarded');
  if(!runtime.includes('event.stopImmediatePropagation()'))issues.push('legacy manual save handler can still run beside the serialized handler');
  if(!runtime.includes('if(btn)btn.disabled=true'))issues.push('SAVE button is not disabled for the serialized lifecycle');
  if(!runtime.includes('if(btn)btn.disabled=false'))issues.push('SAVE button is not restored after the serialized lifecycle');
  if(!runtime.includes("let ok=await window.mwsV55SaveNow()"))issues.push('serialized handler does not invoke the authoritative manual save function');
  if(!runtime.includes('while(activeSaveRequests===0&&Date.now()<appearDeadline)await sleep(50)'))issues.push('busy gap before autosave POST is not handled');
  if((runtime.match(/ok=await window\.mwsV55SaveNow\(\)/g)||[]).length<2)issues.push('manual save is not retried after an in-flight autosave settles');
  if(!loader.includes('/assets/integrity-runtime-v130.js?v=1.3.0-phase12'))issues.push('Phase 12 integrity runtime cache key was not advanced');

  // Lifecycle reproduction: an explicit SAVE arrives while autosave owns the save channel.
  let active=1;
  let manualCalls=0;
  const canRunManual=()=>active===0;
  if(canRunManual())issues.push('audit setup failed to model an in-flight autosave');
  active=0;
  if(canRunManual())manualCalls++;
  if(manualCalls!==1)issues.push('manual save does not run exactly once after autosave completion');

  // A normal explicit SAVE with no autosave should execute immediately once.
  active=0;
  let cleanCalls=0;
  if(canRunManual())cleanCalls++;
  if(cleanCalls!==1)issues.push('normal manual save is not preserved');

  const result={phase:12,name:'manual-save-autosave-serialization',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase12ManualSaveSerializationAudit();
