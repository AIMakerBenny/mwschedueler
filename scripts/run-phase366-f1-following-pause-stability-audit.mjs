import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase366F1FollowingPauseStabilityAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "const VERSION366='phase366-f1-following-pause-stability';",
    'const FOLLOWING_STABILITY_V366=Object.freeze({',
    'function visualPassSeparationV366(',
    'function stagedHeadwayTargetV366(',
    'function followingOpeningCapV366(',
    'function naturalRaceSpacingControlV366(',
    "'FOLLOWING_GAP_OPEN_V366'",
    "'FOLLOWING_EMERGENCY_V366'",
    "'FOLLOWING_LIFT_V366'",
    'passSeparation.released',
    'const spacingControlV319=naturalRaceSpacingControlV366(vehicle,maxTarget);',
    'if(dt<=0){',
    'pausedHoldV366:true',
    'const freezeVisualV366=simClockV192.paused===true||!(Number(frameMs)>0);',
    'if(!freezeVisualV366)updateAutoRaceCameraV216(false);',
    'renderRaceVehiclesV189(simClockV192.paused?0:delta);',
    'function qaFollowingPauseStabilityV366(){',
    'window.mwsF1QaFollowingPauseStabilityV366=qaFollowingPauseStabilityV366;',
    'window.mwsF1GetFollowingStabilityTelemetryV366=followingStabilityTelemetrySnapshotV366;',
    'window.__mwsF1RacingV366=VERSION366;'
  ])if(!core.includes(token))issues.push('Phase 366 core missing: '+token);

  const controllerStart=core.indexOf('function naturalRaceSpacingControlV366(');
  const controllerEnd=core.indexOf('function followingStabilityTelemetrySnapshotV366(',controllerStart);
  const controllerSource=controllerStart>=0&&controllerEnd>controllerStart?core.slice(controllerStart,controllerEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(controllerSource))issues.push('Phase 366 following controller directly mutates progress');
  if(!controllerSource.includes('visualPassSeparationV366')||!controllerSource.includes('passSeparation.released'))issues.push('Phase 366 overtake release is not gated by real visual lateral separation');

  const lateralStart=core.indexOf('function updateVisualLateralOffsetV258(');
  const lateralEnd=core.indexOf('function qaLateralDynamicsV269(',lateralStart);
  const lateralSource=lateralStart>=0&&lateralEnd>lateralStart?core.slice(lateralStart,lateralEnd):'';
  if(!lateralSource.includes('if(dt<=0){')||!lateralSource.includes('pausedHoldV366:true'))issues.push('Phase 366 zero-delta lateral hold missing');
  if(lateralSource.includes('updateCornerLaneOccupancyV361')||lateralSource.includes('applyFourLaneOffsetV360'))issues.push('Phase 366 re-enabled forced lateral dispersion');

  const renderStart=core.indexOf('function renderRaceVehiclesV189(');
  const renderEnd=core.indexOf('function recordScreenCrowdingV363(',renderStart);
  const renderSource=renderStart>=0&&renderEnd>renderStart?core.slice(renderStart,renderEnd):'';
  if(!renderSource.includes('freezeVisualV366')||!renderSource.includes('if(!freezeVisualV366)updateAutoRaceCameraV216(false)'))issues.push('Phase 366 pause render freeze missing');

  for(const token of [
    'Phase 366 runtime did not propagate to Recovery H browser',
    'Phase 366 following/pause stability QA failed',
    'Phase 366 pause changed live marker transforms',
    'Phase 366 resume first frame jumped marker transforms',
    'followingPauseV366:followingPause366||null'
  ])if(!diag.includes(token))issues.push('Phase 366 Recovery H missing: '+token);

  for(const token of [
    'node --check scripts/run-phase366-f1-following-pause-stability-audit.mjs',
    '[phase366] F1 following and pause stability',
    'window.__mwsF1RacingV366=VERSION366;'
  ])if(!workflow.includes(token))issues.push('Phase 366 workflow missing: '+token);

  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase366-f1-following-pause-stability-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }

  const result={phase:366,name:'f1-following-pause-stability',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase366F1FollowingPauseStabilityAudit();
