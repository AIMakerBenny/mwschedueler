import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase205F1PitLaneAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  if(!/recovery=K1&phase=20[5-9]/.test(index))issues.push('Phase 205+ asset cache missing');
  for(const token of [
    "const VERSION205='phase205-pit-lane-stop-warmup';",
    "const PIT_STATES_V205=Object.freeze(['TRACK','PIT_ENTRY','PIT_LANE','PIT_BOX','PIT_EXIT']);",
    'function requestPitStopV205(driverId,compound=',
    'function pitControlV205(vehicle){',
    "if(state==='PIT_ENTRY'||state==='PIT_LANE')return {stationary:false,speedCapKph:limit",
    'function enterPitBoxV205(vehicle){',
    "vehicle.pitState='PIT_BOX';",
    'function completePitServiceV205(vehicle){',
    'setVehicleTyreCompoundV203(vehicle.id,compound);',
    'vehicle.pitWarmupRemainingLaps=PIT_CONFIG_V205.warmupLaps;',
    'function updatePitPostStepV205(vehicle,previousRaceProgress){',
    "passedTrackProgressV205(previousRaceProgress,current,pit.entry)",
    "passedTrackProgressV205(previousRaceProgress,current,pit.stop)",
    "passedTrackProgressV205(previousRaceProgress,current,pit.exit)",
    "vehicle.racingLineMode='PIT_LINE';",
    'const pitControl=updatePitPreStepV205(vehicle,stepMs);',
    'if(Number.isFinite(pitControl.speedCapKph))maxTarget=Math.min(maxTarget,pitControl.speedCapKph);',
    'updatePitPostStepV205(vehicle,previousRaceProgress);',
    'window.mwsF1RequestPitStopV205=requestPitStopV205;',
    'window.mwsF1GetPitStatesV205=getPitStatesV205;',
    'window.__mwsF1RacingV205=VERSION205;'
  ])if(!racing.includes(token))issues.push('Phase 205 runtime missing: '+token);
  for(const token of ["mwsF1QaPitCycleV205?.(incidentDriver,'SOFT')","PIT_ENTRY>PIT_LANE>PIT_BOX>PIT_LANE>PIT_EXIT>TRACK",'Phase 205 pit limiter cap mismatch','Phase 205 tyre warmup state missing'])if(!diag.includes(token))issues.push('Phase 205 live QA missing: '+token);
  for(const token of ['node --check scripts/run-phase205-f1-pit-lane-audit.mjs',"echo '[phase205] F1 pit lane stop and tyre warmup'"])if(!workflow.includes(token))issues.push('Phase 205 workflow missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:205,name:'f1-pit-lane-stop-warmup',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase205F1PitLaneAudit();
