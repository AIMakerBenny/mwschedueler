import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryGF1LifecycleAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/f1-racing-v1.css?v=1.0.0-phase180-shell&p=196&recovery=G1',
    'assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=203&recovery=G1',
    'id="f1RacingFinishingTitleRecoveryG"',
    'id="f1RacingShowPodiumRecoveryG"',
    'id="f1RacingPodiumRowsRecoveryG"',
    'id="f1RacingPodiumResultRecoveryG"',
    'id="f1RacingResultRowsRecoveryG"',
    'id="f1RacingResultNewRaceRecoveryG"',
    'id="f1RacingResultSetupRecoveryG"'
  ])if(!index.includes(token))issues.push('Recovery G lifecycle UI missing: '+token);

  for(const token of [
    'let activeRaceResultRecoveryG=null;',
    'let finishCounterRecoveryG=0;',
    'finished:false,finishPosition:0,finishedAtSimMs:0,',
    'function markRaceFinishersRecoveryG(){',
    'function buildRaceResultRecoveryG(){',
    'function finishRaceRecoveryG(force=false){',
    'function updateRaceLifecycleRecoveryG(){',
    'function showPodiumRecoveryG(){',
    'function showResultRecoveryG(){',
    'function returnToSetupRecoveryG(){',
    'function newRaceSameSettingsRecoveryG(){',
    'function bindRaceLifecycleRecoveryG(){',
    'if(vehicle.finished)continue;',
    'if(updateRaceLifecycleRecoveryG())return false;',
    'window.mwsF1ForceFinishRecoveryG=function(){return finishRaceRecoveryG(true)};',
    "window.__mwsF1RecoveryG='complete-race-lifecycle-v1';"
  ])if(!racing.includes(token))issues.push('Recovery G lifecycle runtime missing: '+token);

  for(const token of [
    '/* Recovery G: complete race lifecycle screens */',
    '.f1-racing-lifecycle-card-recovery-g{',
    '.f1-racing-podium-recovery-g{',
    '.f1-racing-result-list-recovery-g{',
    '.f1-racing-result-row-recovery-g{'
  ])if(!css.includes(token))issues.push('Recovery G lifecycle CSS missing: '+token);

  for(const token of ['node --check scripts/run-recovery-g-f1-lifecycle-audit.mjs',"echo '[recovery-g] F1 complete race lifecycle'"])if(!workflow.includes(token))issues.push('Recovery G workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:'recovery-g',name:'f1-complete-race-lifecycle',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryGF1LifecycleAudit();
