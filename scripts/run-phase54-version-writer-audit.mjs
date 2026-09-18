import fs from 'node:fs';

export function runPhase54VersionWriterAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const version=fs.readFileSync('assets/app-version-v120.js','utf8');
  const device=fs.readFileSync('assets/device-ui.js','utf8');
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');
  const planner=fs.readFileSync('assets/content-planner-host.js','utf8');

  if(!version.includes("const VERSION='1.4.0'"))issues.push('authoritative app version is not v1.4.0');
  if(!index.includes('data-build-version="MWS V 1.4.0"'))issues.push('initial body build version is stale');
  if(!index.includes('>Mawang Scheduler v 1.4.0</div>'))issues.push('initial visible version label is stale');
  if(device.includes('final version display guard'))issues.push('device UI still contains a competing version observer');
  if(device.includes("const BUILD='MWS V 1.3.0'"))issues.push('device UI still writes the version directly');
  if(!friend.includes("function setVersionLabel(){try{window.mwsApplyAppVersionV120?.()}catch(_){}}"))issues.push('Friend Finder does not delegate version display');
  if(!planner.includes("function forceVersion(){try{window.mwsApplyAppVersionV120?.()}catch(_){ }}"))issues.push('content planner host does not delegate version display');
  if(friend.includes("document.body?.setAttribute('data-build-version'"))issues.push('Friend Finder still writes build version directly');
  if(planner.includes("document.body?.setAttribute('data-build-version',BUILD)"))issues.push('content planner host still writes build version directly');

  const summary={phase:54,name:'single-version-writer',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase54VersionWriterAudit();
