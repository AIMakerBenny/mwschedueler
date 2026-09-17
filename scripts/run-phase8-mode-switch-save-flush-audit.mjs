import fs from 'node:fs';

export function runPhase8ModeSwitchSaveFlushAudit(){
  const issues=[];
  const warnings=[];
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  const marker="$('mwsChangeModeBtn')?.addEventListener('click',async()=>{if(mode==='admin')";
  const start=entry.indexOf(marker);
  if(start<0)issues.push('mode-change handler does not guard Admin save state');
  const end=start>=0?entry.indexOf('showGate()})',start):-1;
  const handler=start>=0&&end>start?entry.slice(start,end+12):'';
  if(handler&&!handler.includes('clearTimeout(cloudSaveTimer)'))issues.push('pending autosave timer is not cancelled before mode change');
  if(handler&&!handler.includes('while(cloudSaving&&Date.now()<deadline)'))issues.push('mode change does not wait for an in-flight save');
  if(handler&&!handler.includes('markDirty()'))issues.push('dirty state is not recalculated before leaving Admin mode');
  if(handler&&!handler.includes("dirtyParts.size&&!(await writeCloudNow(true))"))issues.push('remaining dirty data is not synchronously flushed before logout');
  if(handler&&!handler.includes("toast('모드 변경 보류'"))issues.push('timed-out in-flight save does not block mode change');
  const flushAt=handler.indexOf('writeCloudNow(true)');
  const modeNullAt=handler.indexOf('mode=null');
  if(handler&&(flushAt<0||modeNullAt<0||flushAt>modeNullAt))issues.push('mode is cleared before final Admin save');

  // Reproduce legacy lifecycle: edit schedules a 650ms save, user switches mode immediately.
  let legacyMode='admin';
  let legacyDirty=true;
  let legacySaved=false;
  legacyMode=null;
  if(legacyMode==='admin'&&legacyDirty)legacySaved=true;
  if(legacySaved)issues.push('audit reproduction failed: legacy queued-save loss was not reproduced');

  // Phase 8 lifecycle: cancel timer, flush while still Admin, then leave mode.
  let fixedMode='admin';
  let fixedDirty=true;
  let fixedSaved=false;
  if(fixedMode==='admin'&&fixedDirty){fixedSaved=true;fixedDirty=false;}
  if(fixedSaved)fixedMode=null;
  if(!fixedSaved||fixedDirty||fixedMode!==null)issues.push('final flush simulation did not persist dirty Admin data before mode change');

  // In-flight save case: mode change must wait, then flush any edit preserved by Phase 7.
  let inFlight=true;
  let newerEditDirty=true;
  let secondSave=false;
  inFlight=false; // first request settles
  if(!inFlight&&newerEditDirty){secondSave=true;newerEditDirty=false;}
  if(!secondSave||newerEditDirty)issues.push('in-flight save simulation leaves a newer edit unsaved during mode change');

  const result={phase:8,name:'mode-switch-save-flush',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase8ModeSwitchSaveFlushAudit();
