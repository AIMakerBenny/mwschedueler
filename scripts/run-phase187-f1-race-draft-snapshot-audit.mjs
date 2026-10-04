import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase187F1RaceDraftSnapshotAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'id="f1RacingProceedV187"',
    'id="f1RacingSetupSummaryV187"',
    'id="f1RacingSetupHintV187"',
    'id="f1RacingTransitionTrackV187"',
    'id="f1RacingTransitionDriversV187"',
    '>경기 진행<',
    '>RACE READY<'
  ])if(!index.includes(token))issues.push('Phase 187 setup/transition UI missing: '+token);

  for(const token of [
    "const VERSION187='phase187-race-draft-snapshot-transition';",
    'let activeRaceSnapshotV187=null;',
    'function getRaceDraftV187(){',
    'function buildRaceSnapshotV187(){',
    'function syncSetupActionV187(){',
    'function populateTransitionV187(snapshot){',
    'function startRaceFromSetupV187(){',
    "if(!setScreenStateV185('TRANSITION'))return false;",
    "setScreenStateV185('RACE');",
    'window.mwsF1BuildRaceSnapshotV187=buildRaceSnapshotV187;',
    'window.mwsF1StartRaceFromSetupV187=startRaceFromSetupV187;',
    'window.mwsF1GetActiveRaceSnapshotV187=getActiveRaceSnapshotV187;',
    'window.__mwsF1RacingV187=VERSION187;'
  ])if(!js.includes(token))issues.push('Phase 187 runtime missing: '+token);

  if(js.includes('localStorage.setItem')||js.includes('saveData(')||js.includes('persist('))issues.push('Race draft/snapshot must remain session-only in Phase 187');
  if(!js.includes("drivers.length<2||!track"))issues.push('Race readiness does not enforce minimum 2 drivers and a track');

  for(const token of [
    '.f1-racing-setup-action-v187{',
    '.f1-racing-transition-stage-v187{',
    '@keyframes f1TransitionFadeV187',
    '@keyframes f1RaceReadyPulseV187'
  ])if(!css.includes(token))issues.push('Phase 187 CSS missing: '+token);

  for(const token of [
    'node --check scripts/run-phase187-f1-race-draft-snapshot-audit.mjs',
    "echo '[phase187] F1 race draft snapshot and setup transition'"
  ])if(!workflow.includes(token))issues.push('Phase 187 production verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:187,name:'f1-race-draft-snapshot-transition',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase187F1RaceDraftSnapshotAudit();
