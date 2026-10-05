import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryMF1ExplicitStartAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'id="f1RacingGridStartRecoveryM"',
    'id="f1RacingGridCancelRecoveryM"',
    'id="f1RacingGridTrackRecoveryM"',
    'f1-racing-grid-actions-v244',
    '우측 상단의 경기 시작 버튼을 누르면 레이스가 시작됩니다.'
  ])if(!index.includes(token))issues.push('Recovery M grid UI missing: '+token);
  const cachePhase=Number(index.match(/assets\/f1-racing-v1\.js\?v=1\.0\.0-phase180-shell&p=203&recovery=[M-Z][0-9]+&phase=(\d+)/)?.[1]||0);
  if(cachePhase<206)issues.push('Recovery M+ runtime cache missing');

  for(const token of [
    'function populateGridRecoveryM(snapshot){',
    "setScreenStateV185('GRID');",
    'function confirmRaceStartRecoveryM(){',
    "if(f1ScreenStateV185!=='GRID'||!activeRaceSnapshotV187)return false;",
    "if(!setScreenStateV185('RACE'))return false;",
    'renderRaceControlV188();',
    'const started=startRaceMotionV189();',
    'function bindManualRaceStartRecoveryM(){',
    "start.addEventListener('click',confirmRaceStartRecoveryM);",
    "'f1RacingGridCancelRecoveryM'",
    'window.mwsF1ConfirmRaceStartRecoveryM=confirmRaceStartRecoveryM;',
    "window.__mwsF1RecoveryM='explicit-grid-start-v1';"
  ])if(!racing.includes(token))issues.push('Recovery M runtime missing: '+token);

  const stagedBlock=racing.slice(racing.indexOf('function startRaceFromSetupV187(){'),racing.indexOf('function confirmRaceStartRecoveryM(){'));
  if(stagedBlock.includes("setScreenStateV185('RACE')"))issues.push('Setup preparation still enters RACE directly');
  if(stagedBlock.includes('startRaceMotionV189()'))issues.push('Setup preparation still starts race motion');

  for(const token of [
    "assert(window.mwsF1GetScreenStateV185?.()==='GRID','Race started before explicit grid start click');",
    "assert(Number(window.mwsF1GetSimulationClockV192?.().simTimeMs||0)===0,'Simulation advanced before explicit grid start click');",
    "manualStart.click();",
    'manualStartGate:true'
  ])if(!diag.includes(token))issues.push('Recovery M live browser QA missing: '+token);

  for(const token of ['node --check scripts/run-recovery-m-f1-explicit-start-audit.mjs',"echo '[recovery-m] F1 explicit grid start gate'"])if(!workflow.includes(token))issues.push('Recovery M workflow verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:'recovery-m',name:'f1-explicit-grid-start',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryMF1ExplicitStartAudit();
