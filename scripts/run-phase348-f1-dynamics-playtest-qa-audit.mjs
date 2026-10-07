import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase348F1DynamicsPlaytestQaAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION348='phase348-f1-dynamics-playtest-qa';",
    "gridMode='FIXED',raceMode='NORMAL'",
    "const totalLaps=normalizedRaceMode==='FAST'?RACE_COMPETITION_V345.fastLaps:requestedLaps;",
    "pitRequestHistoryV348:[]",
    "function qaDynamicsContractV348(){",
    "function qaDynamicsPlaytestV348(){",
    "window.mwsF1QaDynamicsPlaytestV348=qaDynamicsPlaytestV348;",
    "window.__mwsF1RacingV348=VERSION348;"
  ])if(!core.includes(token))issues.push('Phase 348 core missing: '+token);
  const legacyExitAcceleration=core.includes("const exitAcceleration=(phase==='EXIT'?CORNER_DYNAMICS_V343.exitAccelerationMultiplier:1)");
  const physicsExitAcceleration=core.includes("const exitAcceleration=(cornerRecoveryV351?CORNER_DYNAMICS_V343.exitAccelerationMultiplier*cornerSpecV351.exitAccel:1)");
  if(!legacyExitAcceleration&&!physicsExitAcceleration)issues.push('Phase 348 exit acceleration integration missing or unsupported');
  if(core.includes("const exitAcceleration=(phase==='EXIT'?CORNER_DYNAMICS_V270.exitAccelerationMultiplier:1)"))issues.push('Phase 348 actual exit acceleration still uses obsolete Phase 270 multiplier');
  for(const token of [
    "Phase 348 runtime did not propagate to Recovery H browser",
    "Phase 348 dynamics contract QA failed",
    "Phase 348 real dynamics playtest QA failed",
    "dynamicsPlaytestV348:dynamicsPlaytest348||null"
  ])if(!diag.includes(token))issues.push('Phase 348 Recovery H missing: '+token);
  for(const token of [
    "node --check scripts/run-phase348-f1-dynamics-playtest-qa-audit.mjs",
    "[phase348] F1 corner exit integration and real dynamics playtest QA",
    "window.__mwsF1RacingV348=VERSION348;"
  ])if(!workflow.includes(token))issues.push('Phase 348 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase348-f1-dynamics-playtest-qa-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:348,name:'f1-dynamics-playtest-qa',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase348F1DynamicsPlaytestQaAudit();
