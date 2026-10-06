import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase343F1CornerTyreDynamicsAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION343='phase343-f1-corner-tyre-dynamics';",
  'const CORNER_DYNAMICS_V343=Object.freeze({',
  'function idealRacingLineOffsetV343(',
  'function phaseSpeedTargetV343(',
  'const baseTarget=phaseSpeedTargetV343(',
  'const wearMultiplier=TYRE_DYNAMICS_V343.wearMultiplier',
  'const wearRisk=clamp01V198((wear-TYRE_DYNAMICS_V343.incidentWearStart)',
  'window.mwsF1QaCornerTyreDynamicsV343=',
  'window.__mwsF1RacingV343=VERSION343;'
 ])if(!core.includes(token))issues.push('Phase 343 core missing: '+token);
 for(const token of ['Phase 343 runtime did not propagate to Recovery H browser','Phase 343 corner and tyre dynamics QA failed'])if(!diag.includes(token))issues.push('Phase 343 Recovery H missing: '+token);
 const run=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(run.status!==0)issues.push('core syntax failed: '+String(run.stderr||run.stdout||'').trim());
 const result={phase:343,name:'f1-corner-tyre-dynamics',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase343F1CornerTyreDynamicsAudit();
