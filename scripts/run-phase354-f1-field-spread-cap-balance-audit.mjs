import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase354F1FieldSpreadCapBalanceAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION354='phase354-f1-field-spread-cap-balance';",
    "normalCatchupCapMultiplier:1.25",
    "fastCatchupCapMultiplier:1.45",
    "function fieldSpreadCatchupCapMultiplierV354(){",
    "GAME_VARIABILITY_CONFIG_V303.maxTotalBiasKph*fieldSpreadCatchupCapMultiplierV354()",
    "function qaFieldSpreadCapBalanceV354(){",
    "window.mwsF1QaFieldSpreadCapBalanceV354=qaFieldSpreadCapBalanceV354;",
    "window.__mwsF1RacingV354=VERSION354;"
  ])if(!core.includes(token))issues.push('Phase 354 core missing: '+token);
  const helperStart=core.indexOf('function fieldSpreadCatchupCapMultiplierV354(');
  const helperEnd=core.indexOf('function applyGameVariabilityV303(',helperStart);
  const helperBody=helperStart>=0&&helperEnd>helperStart?core.slice(helperStart,helperEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(helperBody))issues.push('Phase 354 field cap helper directly mutates vehicle position');
  for(const token of [
    "Phase 354 runtime did not propagate to Recovery H browser",
    "Phase 354 field spread cap balance QA failed",
    "fieldCapV354:fieldCap354||null"
  ])if(!diag.includes(token))issues.push('Phase 354 Recovery H missing: '+token);
  for(const token of [
    "node --check scripts/run-phase354-f1-field-spread-cap-balance-audit.mjs",
    "[phase354] F1 field spread cap balance without forced position compression",
    "window.__mwsF1RacingV354=VERSION354;"
  ])if(!workflow.includes(token))issues.push('Phase 354 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase354-f1-field-spread-cap-balance-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:354,name:'f1-field-spread-cap-balance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase354F1FieldSpreadCapBalanceAudit();
