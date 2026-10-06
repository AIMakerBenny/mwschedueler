import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase344F1TyreWearPitStrategyAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of ["const VERSION344='phase344-f1-tyre-wear-pit-strategy';",'const TYRE_DYNAMICS_V344=Object.freeze({','pitRemainingMax:.40','function tyreCornerSpeedFactorV344(','function effectiveTyreWearPerLapV344(','function pitRemainingThresholdV344(','function wornTyreIncidentMultiplierV344(','const compoundWearScale=Number(TYRE_DYNAMICS_V344.wearScale','const tyreCompoundCornerFactorV344=tyreCornerSpeedFactorV344(','const wearAuthorizedV344=context.remainingTyre<TYRE_DYNAMICS_V344.pitRemainingMax','function qaTyreWearPitStrategyV344(){','window.mwsF1QaTyreWearPitStrategyV344=qaTyreWearPitStrategyV344;','window.__mwsF1RacingV344=VERSION344;'])if(!core.includes(token))issues.push('Phase 344 core missing: '+token);
 for(const token of ['Phase 344 runtime did not propagate to Recovery H browser','Phase 344 tyre wear and pit strategy QA failed'])if(!diag.includes(token))issues.push('Phase 344 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/run-phase344-f1-tyre-wear-pit-strategy-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:344,name:'f1-tyre-wear-pit-strategy',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase344F1TyreWearPitStrategyAudit();
