import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase349F1StrictPitStaggeringAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION349='phase349-f1-strict-pit-staggering';",
    "function pitRemainingGuardV349(context){",
    "const safeTyre=pitRemainingGuardV349(context);",
    "const unsafePitRequests=pitRequests.filter(row=>Number(row.tyreRemaining)>=TYRE_DYNAMICS_V343.pitSafeRemainingRatio);",
    "const firstPitLaps=",
    "function qaStrictPitStaggeringV349(){",
    "window.mwsF1QaStrictPitStaggeringV349=qaStrictPitStaggeringV349;",
    "window.__mwsF1RacingV349=VERSION349;"
  ])if(!core.includes(token))issues.push('Phase 349 core missing: '+token);
  if(core.includes("const safeTyre=context.tyreRemaining>=TYRE_DYNAMICS_V343.pitSafeRemainingRatio&&!criticalTyre;"))issues.push('Phase 349 legacy critical-tyre bypass remains');
  for(const token of [
    "Phase 349 runtime did not propagate to Recovery H browser",
    "Phase 349 strict pit staggering contract QA failed",
    "pitGuardV349:pitGuard349||null"
  ])if(!diag.includes(token))issues.push('Phase 349 Recovery H missing: '+token);
  for(const token of [
    "node --check scripts/run-phase349-f1-strict-pit-staggering-audit.mjs",
    "[phase349] F1 strict 40 percent pit guard and first-stop staggering",
    "window.__mwsF1RacingV349=VERSION349;"
  ])if(!workflow.includes(token))issues.push('Phase 349 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase349-f1-strict-pit-staggering-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:349,name:'f1-strict-pit-staggering',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase349F1StrictPitStaggeringAudit();
