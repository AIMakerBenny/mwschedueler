import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase299F1RecoveryHContractRecheckAudit(){
 const issues=[],warnings=[];
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const recovery=fs.readFileSync('scripts/run-recovery-h-f1-live-qa-audit.mjs','utf8');
 const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 for(const token of [
  'mwsF1ResetFinalDesktopErrorsV292',
  "window.__mwsF1RacingV295==='phase295-f1-final-regression-gate'",
  'window.mwsF1QaFinalRegressionV295?.()',
  'Phase 291 finish must keep the race screen active',
  'f1RacingFinishOverlayV291',
  'f1RacingFinishOverlayNewRaceV291'
 ])if(!diag.includes(token))issues.push('Phase 299 Recovery H diagnose contract missing: '+token);
 for(const token of [
  "window.__mwsF1RacingV295==='phase295-f1-final-regression-gate'",
  'window.mwsF1QaFinalRegressionV295?.()',
  'f1RacingFinishOverlayV291'
 ])if(!recovery.includes(token))issues.push('Phase 299 Recovery H audit contract missing: '+token);
 if(!workflow.includes('node --check scripts/run-phase299-f1-recovery-h-contract-recheck-audit.mjs'))issues.push('Phase 299 workflow syntax gate missing');
 for(const file of ['scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-recovery-h-f1-live-qa-audit.mjs']){
  const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 }
 const result={phase:299,name:'f1-recovery-h-contract-recheck',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase299F1RecoveryHContractRecheckAudit();
