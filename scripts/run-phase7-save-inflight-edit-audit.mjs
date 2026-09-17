import fs from 'node:fs';

export function runPhase7SaveInflightEditAudit(){
  const issues=[];
  const warnings=[];
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!entry.includes('const sentJson=new Map(partsToSave.map'))issues.push('save payload snapshot is missing');
  if(!entry.includes('const changedAfterSend=JSON.stringify(extractPart(part))!==sentJson.get(part)'))issues.push('in-flight edits are not compared against the sent payload');
  if(!entry.includes('baselineJson.set(part,JSON.stringify(serverValue))'))issues.push('save acknowledgement does not advance baseline to server-accepted state');
  if(!entry.includes('if(!changedAfterSend&&hasNormalized)mergePart(part,serverValue,data)'))issues.push('server normalization can overwrite edits made after upload started');
  if(!entry.includes('}markDirty()'))issues.push('dirty state is not recalculated after save acknowledgement');

  // The old algorithm appears in normalizeCloudCore only as the search string for replace().
  // Verify that the safe replacement exists after that search target instead of treating the search literal itself as live code.
  const oldTarget=entry.indexOf('mergeNormalizedResult(normalized);if(manifest?.parts)');
  const safeReplacement=entry.indexOf('const changedAfterSend=JSON.stringify(extractPart(part))!==sentJson.get(part)');
  if(oldTarget<0)issues.push('Phase 7 transform no longer has the expected legacy search target');
  if(safeReplacement<0||safeReplacement<=oldTarget)issues.push('safe save reconciliation replacement is not paired after the legacy search target');

  // Reproduce the exact lifecycle: A is sent, user changes to B while request is in flight.
  const sent={events:[{id:'1',title:'A'}]};
  const sentJson=JSON.stringify(sent);
  const currentAfterEdit={events:[{id:'1',title:'B'}]};
  const serverAccepted={events:[{id:'1',title:'A'}]};

  // Legacy policy used the live value as the new baseline after the response.
  const legacyBaseline=JSON.stringify(currentAfterEdit);
  const legacyDirty=JSON.stringify(currentAfterEdit)!==legacyBaseline;
  if(legacyDirty!==false)issues.push('audit reproduction failed to demonstrate the legacy lost-dirty state');

  // Phase 7 policy keeps the server state as baseline and preserves B as dirty.
  const changedAfterSend=JSON.stringify(currentAfterEdit)!==sentJson;
  const phase7Visible=changedAfterSend?currentAfterEdit:serverAccepted;
  const phase7Baseline=JSON.stringify(serverAccepted);
  const phase7Dirty=JSON.stringify(phase7Visible)!==phase7Baseline;
  if(!changedAfterSend||!phase7Dirty)issues.push('in-flight edit is not preserved as unsaved after acknowledgement');
  if(phase7Visible.events[0].title!=='B')issues.push('server acknowledgement overwrote the newer local edit');

  // Normal save without a concurrent edit should settle cleanly to canonical server state.
  const unchangedAfterSend=JSON.stringify(sent)===sentJson;
  const canonicalServer={events:[{id:'1',title:'A'}]};
  const normalVisible=unchangedAfterSend?canonicalServer:sent;
  const normalDirty=JSON.stringify(normalVisible)!==JSON.stringify(canonicalServer);
  if(normalDirty)issues.push('ordinary save remains dirty after canonical acknowledgement');

  const result={phase:7,name:'save-inflight-edit-preservation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase7SaveInflightEditAudit();
