import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase355F1RearPaceBalanceAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION355='phase355-f1-rear-pace-balance';",
    "positionCatchupMaxPct:.050",
    "function qaRearPaceBalanceV355(){",
    "window.mwsF1QaRearPaceBalanceV355=qaRearPaceBalanceV355;",
    "window.__mwsF1RacingV355=VERSION355;"
  ])if(!core.includes(token))issues.push('Phase 355 core missing: '+token);
  const start=core.indexOf('function positionCatchupPercentV314(');
  const end=core.indexOf('function applyGameVariabilityV303(',start);
  const source=start>=0&&end>start?core.slice(start,end):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(source))issues.push('Phase 355 catchup logic directly mutates vehicle position');
  for(const token of [
    "Phase 355 runtime did not propagate to Recovery H browser",
    "Phase 355 rear pace balance QA failed",
    "rearPaceV355:rearPace355||null"
  ])if(!diag.includes(token))issues.push('Phase 355 Recovery H missing: '+token);
  for(const token of [
    "node --check scripts/run-phase355-f1-rear-pace-balance-audit.mjs",
    "[phase355] F1 rear pace balance without position forcing",
    "window.__mwsF1RacingV355=VERSION355;"
  ])if(!workflow.includes(token))issues.push('Phase 355 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase355-f1-rear-pace-balance-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:355,name:'f1-rear-pace-balance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase355F1RearPaceBalanceAudit();
