import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase330F1VisualSpacingContinuityAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION330='phase330-f1-visual-spacing-continuity';",
  'const VISUAL_SPACING_SMOOTH_V330=Object.freeze({',
  'function smoothVisualSpacingShiftV330(',
  'visualSpacingSmoothedShiftMetersV330',
  'targetShiftMetersV330',
  'function qaVisualSpacingContinuityV330(){',
  'window.mwsF1QaVisualSpacingContinuityV330=qaVisualSpacingContinuityV330;',
  'window.__mwsF1RacingV330=VERSION330;'
 ])if(!core.includes(token))issues.push('Phase 330 core missing: '+token);
 for(const token of ['Phase 330 runtime did not propagate to Recovery H browser','Phase 330 visual spacing continuity QA failed','Phase 330 spacing transition is too abrupt'])if(!diag.includes(token))issues.push('Phase 330 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase330-f1-visual-spacing-continuity-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:330,name:'f1-visual-spacing-continuity',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase330F1VisualSpacingContinuityAudit();
