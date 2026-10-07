import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase370F1CornerTrainSeparationPauseLockAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION370='phase370-f1-corner-train-separation-pause-lock';",
    'const CORNER_TRAIN_GUARD_V370=Object.freeze({',
    'function strictPassSeparationV370(',
    'released=base.visualReady===true',
    'function stagedHeadwayTargetV370(',
    'function followingOpeningCapV370(',
    'function naturalRaceSpacingControlV370(',
    "'CORNER_TRAIN_GUARD_V370'",
    "'TRAIN_EMERGENCY_V370'",
    "'CORNER_TRAIN_LIFT_V370'",
    'const spacingControlV319=naturalRaceSpacingControlV370(vehicle,maxTarget);',
    'function qaCornerTrainSeparationPauseLockV370(){',
    'window.mwsF1QaCornerTrainSeparationPauseLockV370=qaCornerTrainSeparationPauseLockV370;',
    'window.__mwsF1RacingV370=VERSION370;'
  ])if(!core.includes(token))issues.push('Phase 370 core missing: '+token);
  const controllerStart=core.indexOf('function naturalRaceSpacingControlV370(');
  const controllerEnd=core.indexOf('function cornerTrainGuardTelemetrySnapshotV370(',controllerStart);
  const controllerSource=controllerStart>=0&&controllerEnd>controllerStart?core.slice(controllerStart,controllerEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(controllerSource))issues.push('Phase 370 controller directly mutates progress');
  if(!controllerSource.includes('strictPassSeparationV370')||!controllerSource.includes('passSeparation.released'))issues.push('Phase 370 strict lateral release gate missing');
  if(controllerSource.includes('applyFourLaneOffsetV360')||controllerSource.includes('updateCornerLaneOccupancyV361'))issues.push('Phase 370 forced lateral dispersion regression');
  const strictStart=core.indexOf('function strictPassSeparationV370(');
  const strictEnd=core.indexOf('function stagedHeadwayTargetV370(',strictStart);
  const strictSource=strictStart>=0&&strictEnd>strictStart?core.slice(strictStart,strictEnd):'';
  if(!strictSource.includes('released=base.visualReady===true'))issues.push('Phase 370 timed-only release remains');
  if(!core.includes('renderRaceVehiclesV189(simClockV192.paused?0:delta);'))issues.push('Phase 370 resume zero-delta freeze missing');
  for(const token of ['Phase 370 runtime did not propagate to Recovery H browser','Phase 370 corner train separation/pause lock QA failed','cornerTrainV370:cornerTrain370||null'])if(!diag.includes(token))issues.push('Phase 370 Recovery H missing: '+token);
  for(const token of ['node --check scripts/run-phase370-f1-corner-train-separation-pause-lock-audit.mjs','[phase370] F1 corner train separation and pause lock','window.__mwsF1RacingV370=VERSION370;'])if(!workflow.includes(token))issues.push('Phase 370 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase370-f1-corner-train-separation-pause-lock-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:370,name:'f1-corner-train-separation-pause-lock',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase370F1CornerTrainSeparationPauseLockAudit();
