import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase335F1ActualTrackSpacingAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION335='phase335-f1-actual-track-spacing';",
  "const targetShiftMetersV330=0;",
  "vehicle.visualSpacingModeV335='ACTUAL_RACE_PROGRESS';",
  "marker.dataset.visualSpacingModeV335=String(vehicle.visualSpacingModeV335||'ACTUAL_RACE_PROGRESS');",
  "function qaActualTrackSpacingV335(){",
  "window.mwsF1QaActualTrackSpacingV335=qaActualTrackSpacingV335;",
  "window.__mwsF1RacingV335=VERSION335;"
 ])if(!core.includes(token))issues.push('Phase 335 core missing: '+token);
 const renderStart=core.indexOf('function renderRaceVehiclesV189('),renderEnd=core.indexOf('function initializeRaceMotionV189(',renderStart),render=renderStart>=0&&renderEnd>renderStart?core.slice(renderStart,renderEnd):'';
 if(!render.includes('const displayRaceProgressV319=actualRaceProgressV330-smoothShiftMetersV330/trackLengthV330;'))issues.push('Phase 335 renderer is not anchored to actual race progress');
 if(render.includes('const targetShiftMetersV330=Math.max(0,'))issues.push('Phase 335 legacy presentation spacing still drives the renderer');
 for(const token of ['Phase 335 runtime did not propagate to Recovery H browser','Phase 335 actual track spacing QA failed','Phase 335 live markers are still presentation-spaced instead of actual race progress'])if(!diag.includes(token))issues.push('Phase 335 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase335-f1-actual-track-spacing-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:335,name:'f1-actual-track-spacing',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase335F1ActualTrackSpacingAudit();
