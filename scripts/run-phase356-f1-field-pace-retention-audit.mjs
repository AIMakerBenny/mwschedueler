import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase356F1FieldPaceRetentionAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION356='phase356-f1-field-pace-retention';",
    "paceRetentionScale:.08",
    "function fieldPaceRetentionMultiplierV356(vehicle){",
    "const fieldPaceRetentionMultiplierV356Value=fieldPaceRetentionMultiplierV356(vehicle);",
    "raceFormMultiplierV345*fieldPaceRetentionMultiplierV356Value",
    "function qaFieldPaceRetentionV356(){",
    "window.mwsF1QaFieldPaceRetentionV356=qaFieldPaceRetentionV356;",
    "window.__mwsF1RacingV356=VERSION356;"
  ])if(!core.includes(token))issues.push('Phase 356 core missing: '+token);
  const start=core.indexOf('function fieldPaceRetentionMultiplierV356(');
  const end=core.indexOf('function simulateVehicleDynamicsV196(',start);
  const source=start>=0&&end>start?core.slice(start,end):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(source))issues.push('Phase 356 field pace helper directly mutates vehicle position');
  for(const token of [
    "Phase 356 runtime did not propagate to Recovery H browser",
    "Phase 356 field pace retention QA failed",
    "fieldPaceV356:fieldPace356||null"
  ])if(!diag.includes(token))issues.push('Phase 356 Recovery H missing: '+token);
  for(const token of [
    "node --check scripts/run-phase356-f1-field-pace-retention-audit.mjs",
    "[phase356] F1 field pace retention without position forcing",
    "window.__mwsF1RacingV356=VERSION356;"
  ])if(!workflow.includes(token))issues.push('Phase 356 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase356-f1-field-pace-retention-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:356,name:'f1-field-pace-retention',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase356F1FieldPaceRetentionAudit();
