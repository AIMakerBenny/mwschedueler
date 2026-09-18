import fs from 'node:fs';

export function runPhase66MaintenanceSuccessorHandshakeAudit(){
  const issues=[];
  const warnings=[];
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const next=fs.readFileSync('assets/maintenance-runtime-v130.js','utf8');

  if(!fs.existsSync('assets/cf-v5.7-runtime.js'))issues.push('legacy maintenance fallback was removed before activation proof');
  if(!perf.includes("assets/maintenance-runtime-v130.js?v=1.3.0-stage66"))issues.push('maintenance successor cache-bust was not advanced for handshake validation');
  if(!perf.includes("assets/cf-v5.7-runtime.js?v=5.7.1"))issues.push('legacy maintenance fallback path is missing');
  if(!perf.includes('s.onerror=fallback'))issues.push('network load failure does not trigger the legacy fallback');
  if(!perf.includes("s.onload=()=>{if(window.__mwsMaintenanceRuntimeV130Ready)"))issues.push('successful script download is trusted without a runtime readiness handshake');
  if(!next.includes('window.__mwsMaintenanceRuntimeV130Ready=false'))issues.push('successor does not begin in an unready state');
  if(!next.includes('window.__mwsMaintenanceRuntimeV130Ready=true'))issues.push('successor never publishes a ready state');
  if(!next.includes('window.__mwsCf571Runtime=true'))issues.push('successor does not claim the legacy compatibility marker after successful installation');
  if(!next.includes('window.mwsApplyAppVersionV120?.()'))issues.push('maintenance successor does not delegate visible version writing to app-version-v120');
  if(next.includes("document.body?.setAttribute('data-build-version',BUILD)"))issues.push('maintenance successor still directly overwrites the visible app version');

  const readyPos=next.indexOf('window.__mwsMaintenanceRuntimeV130Ready=true');
  const installPos=next.indexOf('installBackupUi();');
  if(readyPos<0||installPos<0||readyPos<installPos)issues.push('maintenance successor announces readiness before required installers run');

  const summary={phase:66,name:'maintenance-successor-handshake',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase66MaintenanceSuccessorHandshakeAudit();
