import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryCF1RaceCancelAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'id="f1RacingTransitionCancelRecoveryC"',
    'id="f1RacingRaceCancelRecoveryC"',
    /assets\/f1-racing-v1\.js\?v=1\.0\.0-phase180-shell&p=203&recovery=[C-Z][0-9]+/.test(index)?'__RECOVERY_C_JS_OK__':'__RECOVERY_C_JS_MISSING__'
  ])if(token==='__RECOVERY_C_JS_OK__'?false:token==='__RECOVERY_C_JS_MISSING__'?true:!index.includes(token))issues.push('Recovery C UI missing: '+token);

  for(const token of [
    "RACE:Object.freeze(['SETUP','FINISHING'])",
    'function cancelRaceToSetupRecoveryC(){',
    "if(!['TRANSITION','GRID','RACE'].includes(f1ScreenStateV185))return false;",
    'clearTimeout(raceTransitionTimerV187);',
    'resetRaceMotionV189();',
    'activeRaceSnapshotV187=null;',
    "setScreenStateV185('SETUP',{force:true});",
    'renderTrackChoicesV186();',
    'renderContacts();',
    'renderSelected();',
    'syncSetupActionV187();',
    'function bindRaceCancelRecoveryC(){',
    'window.mwsF1CancelRaceRecoveryC=cancelRaceToSetupRecoveryC;',
    "window.__mwsF1RecoveryC='race-cancel-setup-return-v1';"
  ])if(!racing.includes(token))issues.push('Recovery C runtime missing: '+token);

  if(racing.includes('selectedIds.splice(0);resetRaceMotionV189();'))issues.push('Cancel path appears to clear selected participants');
  for(const token of ['node --check scripts/run-recovery-c-f1-race-cancel-audit.mjs',"echo '[recovery-c] F1 cancel race to setup'"])if(!workflow.includes(token))issues.push('Recovery C workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:'recovery-c',name:'f1-cancel-race-to-setup',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryCF1RaceCancelAudit();
