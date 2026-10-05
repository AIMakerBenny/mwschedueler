import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase294F1RecoveryHFinalOverlayAudit(){
 const issues=[],warnings=[];
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const recovery=fs.readFileSync('scripts/run-recovery-h-f1-live-qa-audit.mjs','utf8');
 const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 for(const token of [
  "window.__mwsF1RacingV292==='phase292-f1-r17-integrated-desktop-qa'",
  'Phase 288-292 final extension QA',
  "window.mwsF1QaFinalDesktopV292?.()",
  "f1RacingFinishOverlayV291",
  "Phase 291 finish must keep the race screen active",
  "f1RacingFinishOverlayNewRaceV291",
  "document.getElementById('f1RacingViewRaceV185')?.hidden===false"
 ])if(!diag.includes(token))issues.push('Phase 294 Recovery H scenario missing: '+token);
 for(const token of [
  "window.__mwsF1RacingV292==='phase292-f1-r17-integrated-desktop-qa'",
  'window.mwsF1QaFinalDesktopV292?.()',
  'f1RacingFinishOverlayV291',
  'f1RacingFinishOverlayNewRaceV291'
 ])if(!recovery.includes(token))issues.push('Phase 294 Recovery H contract missing: '+token);
 if(!workflow.includes('node --check scripts/run-phase294-f1-recovery-h-final-overlay-audit.mjs'))issues.push('Phase 294 workflow syntax gate missing');
 for(const file of ['scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-recovery-h-f1-live-qa-audit.mjs']){
  const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 }
 const result={phase:294,name:'f1-recovery-h-final-overlay',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase294F1RecoveryHFinalOverlayAudit();
