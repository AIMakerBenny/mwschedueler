import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase353F1CornerComplexRecoveryAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION353='phase353-f1-corner-complex-recovery';",
    "const CORNER_COMPLEX_RECOVERY_V353=Object.freeze({",
    "hairpin:Object.freeze({min:75,max:120,entryRetention:.30,brakeScale:1.05,recoveryLead:.22",
    "fast:Object.freeze({min:225,max:305,entryRetention:.77,brakeScale:.88,recoveryLead:.15",
    "function cornerUnderSpeedRecoveryV353(",
    "cornerUnimpededMinSpeedByClassV353",
    "cornerUnderSpeedRecoveryCountV353",
    "function qaCornerComplexRecoveryV353(){",
    "window.mwsF1QaCornerComplexRecoveryV353=qaCornerComplexRecoveryV353;",
    "window.__mwsF1RacingV353=VERSION353;"
  ])if(!core.includes(token))issues.push('Phase 353 core missing: '+token);
  const helperStart=core.indexOf('function cornerUnderSpeedRecoveryV353(');
  const helperEnd=core.indexOf('function trackLateralLimitV271(',helperStart);
  const helperBody=helperStart>=0&&helperEnd>helperStart?core.slice(helperStart,helperEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(helperBody))issues.push('Phase 353 recovery directly mutates vehicle position');
  if(!core.includes('const cleanCornerV353=!spacingControlV319.active'))issues.push('Phase 353 clean telemetry does not exclude traffic constraints');
  for(const token of [
    "Phase 353 runtime did not propagate to Recovery H browser",
    "Phase 353 corner complex recovery QA failed",
    "cornerComplexV353:cornerComplex353||null"
  ])if(!diag.includes(token))issues.push('Phase 353 Recovery H missing: '+token);
  for(const token of [
    "node --check scripts/run-phase353-f1-corner-complex-recovery-audit.mjs",
    "[phase353] F1 corner complex recovery and real braking envelope",
    "window.__mwsF1RacingV353=VERSION353;"
  ])if(!workflow.includes(token))issues.push('Phase 353 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase353-f1-corner-complex-recovery-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:353,name:'f1-corner-complex-recovery',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase353F1CornerComplexRecoveryAudit();
