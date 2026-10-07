import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase372F1RearLongRunPaceRetentionAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
  for(const token of ["const VERSION372='phase372-f1-rear-long-run-pace-retention';",'const LONG_RUN_REAR_PACE_V372=Object.freeze({normalMaxBoost:.0018,fastModeScale:.55});','function longRunRearPaceMultiplierV372(','*longRunRearPaceMultiplierV372Value','vehicle.longRunRearPaceMultiplierV372=longRunRearPaceMultiplierV372Value;','function qaLongRunRearPaceV372(){','window.mwsF1QaLongRunRearPaceV372=qaLongRunRearPaceV372;','window.__mwsF1RacingV372=VERSION372;'])if(!core.includes(token))issues.push('Phase 372 runtime missing: '+token);
  const source=core.slice(core.indexOf('function longRunRearPaceMultiplierV372('),core.indexOf('function fieldPaceRetentionMultiplierV356('));
  if(/\b(?:raceProgress|progress)\s*=/.test(source))issues.push('Phase 372 directly mutates race position');
  if(!diag.includes('Phase 372 long-run rear pace QA failed')||!diag.includes('rearPaceV372:rearPace372||null')||!diag.includes('Phase 359 normal field spread still excessive'))issues.push('Recovery H Phase 372 real pace regression missing');
  if(!workflow.includes("echo '[phase372] F1 rear long-run pace retention'")||!workflow.includes('node --check scripts/run-phase372-f1-rear-long-run-pace-retention-audit.mjs'))issues.push('Production workflow Phase 372 missing');
  if(!cumulative.includes('runPhase372F1RearLongRunPaceRetentionAudit')||!cumulative.includes('return runPhase372FullIntegrationAudit();'))issues.push('Cumulative Phase 372 audit missing');
  for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase372-f1-rear-long-run-pace-retention-audit.mjs']){
    const check=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
    if(check.status!==0)issues.push('Syntax error: '+path+' '+String(check.stderr||check.stdout||'').slice(0,800));
  }
  const result={phase:372,name:'f1-rear-long-run-pace-retention',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase372F1RearLongRunPaceRetentionAudit();
