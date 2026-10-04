import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryHF1LiveQaAudit(){
  const issues=[],warnings=[];
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "const port=9444;",
    "window.mwsF1GetTrackCatalogV186?.()||[]",
    "#f1RacingTrackAnnotationsV183 [data-f1-start-finish=\"1\"]",
    "#f1RacingRaceAnnotationsRecoveryB [data-f1-start-finish=\"1\"]",
    "window.mwsF1GetSimulationClockV192?.().paused===true",
    "new PointerEvent('pointerdown'",
    "afterResize.w!==beforeResize.w||afterResize.h!==beforeResize.h",
    "docked.x===0&&docked.w===6",
    "window.mwsF1GetScreenStateV185?.()==='SETUP'",
    "window.mwsF1ForceFinishRecoveryG?.()===true",
    "window.mwsF1GetScreenStateV185?.()==='PODIUM'",
    "window.mwsF1GetScreenStateV185?.()==='RESULT'",
    "RECOVERY_H_SCREENSHOT_JPEG_BASE64=",
    "recoveryHLiveBrowser"
  ])if(!diag.includes(token))issues.push('Recovery H live QA contract missing: '+token);

  for(const token of [
    'node --check scripts/diagnose-recovery-h-f1-live.mjs',
    'node --check scripts/run-recovery-h-f1-live-qa-audit.mjs',
    '- name: Recovery H F1 live browser QA',
    'run: node scripts/diagnose-recovery-h-f1-live.mjs'
  ])if(!workflow.includes(token))issues.push('Recovery H workflow integration missing: '+token);

  for(const file of ['scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-recovery-h-f1-live-qa-audit.mjs']){
    const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  }
  const result={phase:'recovery-h',name:'f1-live-browser-qa-contract',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryHF1LiveQaAudit();
