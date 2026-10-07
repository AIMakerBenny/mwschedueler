import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase358F1CornerSpeedBrakeReleaseCalibrationAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 for(const token of [
  "const VERSION358='phase358-f1-corner-speed-brake-release-calibration';",
  "const CORNER_BRAKE_RELEASE_V358=Object.freeze({coastDecelMps2:.55",
  "const delta=Math.max(0,(Number(entryKph)||0)-apexTarget);",
  "hairpin:Object.freeze({min:75,max:120,entryRetention:.30,brakeScale:1.05,recoveryLead:.34",
  "slow:Object.freeze({min:105,max:170,entryRetention:.43,brakeScale:.98,recoveryLead:.28",
  "const clearRecoveryV358=cornerRecoveryV351",
  "vehicle.cornerBrakeReleasedV358=true;",
  "function qaCornerSpeedBrakeReleaseCalibrationV358(){",
  "window.mwsF1QaCornerSpeedBrakeReleaseCalibrationV358=qaCornerSpeedBrakeReleaseCalibrationV358;",
  "window.__mwsF1RacingV358=VERSION358;"
 ])if(!core.includes(token))issues.push('Phase 358 core missing: '+token);
 if(core.includes("const delta=Math.max(0,Number(entryKph)||0-apexTarget);"))issues.push('Phase 358 legacy entry/apex delta precedence bug remains');
 for(const token of ['Phase 358 runtime did not propagate to Recovery H browser','Phase 358 corner speed/brake release calibration QA failed','cornerBrakeV358:cornerBrake358||null'])if(!diag.includes(token))issues.push('Phase 358 Recovery H missing: '+token);
 for(const token of ['node --check scripts/run-phase358-f1-corner-speed-brake-release-calibration-audit.mjs','[phase358] F1 entry-speed braking and apex brake-release calibration','window.__mwsF1RacingV358=VERSION358;'])if(!workflow.includes(token))issues.push('Phase 358 workflow missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase358-f1-corner-speed-brake-release-calibration-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:358,name:'f1-corner-speed-brake-release-calibration',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase358F1CornerSpeedBrakeReleaseCalibrationAudit();
