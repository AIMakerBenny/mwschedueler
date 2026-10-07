import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase357F1RankedFieldPaceRetentionAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 for(const token of [
  "const VERSION357='phase357-f1-ranked-field-pace-retention';",
  "rankedRearPaceMax:.005,rankedRearPaceExponent:1.20",
  "function updateRankedFieldPaceRetentionV357(){",
  "function rankedFieldPaceMultiplierV357(vehicle){",
  "updateRankedFieldPaceRetentionV357();",
  "rankedFieldPaceMultiplierV357Value",
  "function qaRankedFieldPaceRetentionV357(){",
  "window.mwsF1QaRankedFieldPaceRetentionV357=qaRankedFieldPaceRetentionV357;",
  "window.__mwsF1RacingV357=VERSION357;"
 ])if(!core.includes(token))issues.push('Phase 357 core missing: '+token);
 const s=core.slice(core.indexOf('function updateRankedFieldPaceRetentionV357('),core.indexOf('function fieldPaceRetentionMultiplierV356('));
 if(/\b(?:raceProgress|progress)\s*=/.test(s))issues.push('Phase 357 ranked pace logic directly mutates vehicle position');
 for(const token of ['Phase 357 runtime did not propagate to Recovery H browser','Phase 357 ranked field pace retention QA failed','rankedPaceV357:rankedPace357||null'])if(!diag.includes(token))issues.push('Phase 357 Recovery H missing: '+token);
 for(const token of ['node --check scripts/run-phase357-f1-ranked-field-pace-retention-audit.mjs','[phase357] F1 ranked field pace retention without position forcing','window.__mwsF1RacingV357=VERSION357;'])if(!workflow.includes(token))issues.push('Phase 357 workflow missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase357-f1-ranked-field-pace-retention-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:357,name:'f1-ranked-field-pace-retention',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase357F1RankedFieldPaceRetentionAudit();
