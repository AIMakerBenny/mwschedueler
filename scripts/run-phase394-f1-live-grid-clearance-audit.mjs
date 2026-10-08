import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase394F1LiveGridClearanceAudit(){
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
    cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8'),issues=[],warnings=[];
  for(const token of ['function gridStartSpacingMetersV394(', 'gridStartSpacingMetersV394(activeRaceSnapshotV187?.track)',
    'function qaLiveGridSpacingV394()', 'window.mwsF1QaLiveGridSpacingV394=qaLiveGridSpacingV394;',
    'liveCameraClearanceMetersV386(track)', 'measureActualMarkerOverlapsV377(rendered,raceCameraV216.zoom)',
    'measureActualMarkerOverlapsV377(rendered,MARKER_OVERLAP_MONITOR_V377.maxZoom)'])
    if(!core.includes(token))issues.push('missing runtime '+token);
  if(!diag.includes('Phase 394 actual starting grid marker clearance Chromium QA failed')||
    !diag.includes('liveGridV394:liveGrid394||null'))issues.push('missing Chromium test');
  if(!cum.includes('runPhase394F1LiveGridClearanceAudit()')||
    !cum.includes('runPhase394FullIntegrationAudit()'))issues.push('missing cumulative audit');
  if(!core.includes("if(engineQaV240.active)return -(Math.max(0,Number(index)||0)*Math.min(.008,.08/Math.max(1,Number(count)||1)));"))
    issues.push('engine QA baseline grid was altered');
  for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
    const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
    if(r.status!==0)issues.push('syntax '+path+' '+String(r.stderr).slice(0,400));
  }
  const result={phase:394,name:'f1-live-grid-clearance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase394F1LiveGridClearanceAudit();
