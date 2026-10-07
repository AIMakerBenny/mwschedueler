import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase377F1MarkerOverlapMonitorAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 const cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const token of ["const VERSION377='phase377-f1-actual-marker-overlap-monitor';",'function measureActualMarkerOverlapsV377(','function recordActualMarkerOverlapsV377(','function markerOverlapReportV377(','recordActualMarkerOverlapsV377(rendered);','function qaActualMarkerOverlapsV377(){','window.mwsF1QaActualMarkerOverlapsV377=qaActualMarkerOverlapsV377;','window.__mwsF1RacingV377=VERSION377;'])if(!core.includes(token))issues.push('Phase377 core missing '+token);
 if(!core.includes('MARKER_OVERLAP_MONITOR_V377.maxZoom')||!core.includes('raceMarkerScaleV245(zoom)'))issues.push('Phase377 does not use actual zoom and ring radius');
 if(!diag.includes('Phase 377 visible marker overlap detector QA failed')||!diag.includes('overlapMonitorV377:overlapMonitor377||null'))issues.push('Phase377 live browser verification missing');
 if(!workflow.includes("echo '[phase377] F1 actual visible marble center-distance overlap monitor'")||!workflow.includes('node --check scripts/run-phase377-f1-marker-overlap-monitor-audit.mjs'))issues.push('Phase377 workflow missing');
 if(!cumulative.includes('runPhase377F1MarkerOverlapMonitorAudit')||!cumulative.includes('export function runPhase377FullIntegrationAudit()'))issues.push('Phase377 cumulative missing');
 for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase377-f1-marker-overlap-monitor-audit.mjs']){
  const x=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(x.status!==0)issues.push('Syntax '+path+': '+String(x.stderr||x.stdout).slice(0,850));
 }
 const result={phase:377,name:'f1-marker-overlap-monitor',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase377F1MarkerOverlapMonitorAudit();
