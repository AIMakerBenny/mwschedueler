import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase344F1StaggeredPitStrategyAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION344='phase344-f1-staggered-pit-strategy';",
  'const PIT_STAGGER_V344=Object.freeze({',
  'function pitWearThresholdV344(',
  "reason='TYRE_REMAINING_ABOVE_40'",
  "reason='PERSONAL_WEAR_THRESHOLD_NOT_REACHED'",
  'const shouldPit=(decision===',
  'window.mwsF1QaStaggeredPitStrategyV344=',
  'window.__mwsF1RacingV344=VERSION344;'
 ])if(!core.includes(token))issues.push('Phase 344 core missing: '+token);
 for(const token of ['Phase 344 runtime did not propagate to Recovery H browser','Phase 344 staggered pit strategy QA failed'])if(!diag.includes(token))issues.push('Phase 344 Recovery H missing: '+token);
 const run=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(run.status!==0)issues.push('core syntax failed: '+String(run.stderr||run.stdout||'').trim());
 const result={phase:344,name:'f1-staggered-pit-strategy',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase344F1StaggeredPitStrategyAudit();
