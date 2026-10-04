import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase192F1SimulationClockAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'id="f1RacingRaceControlsV192"',
    'id="f1RacingPauseV192"',
    'data-f1-timescale="1"',
    'data-f1-timescale="2"',
    'data-f1-timescale="4"'
  ])if(!index.includes(token))issues.push('Phase 192 control UI missing: '+token);

  for(const token of [
    "const VERSION192='phase192-simulation-clock';",
    'const simClockV192={',
    'fixedStepMs:20',
    'function setSimulationTimeScaleV192(scale){',
    'if(![1,2,4].includes(next))return false;',
    'function toggleSimulationPauseV192(force){',
    'function bindSimulationControlsV192(){',
    'function simulateRaceStepV192(stepMs){',
    'simClockV192.accumulatorMs+=delta*simClockV192.timeScale;',
    'while(simClockV192.accumulatorMs>=simClockV192.fixedStepMs',
    'renderRaceVehiclesV189();',
    'window.mwsF1SetSimulationTimeScaleV192=setSimulationTimeScaleV192;',
    'window.mwsF1ToggleSimulationPauseV192=toggleSimulationPauseV192;',
    'window.__mwsF1RacingV192=VERSION192;'
  ])if(!js.includes(token))issues.push('Phase 192 simulation clock runtime missing: '+token);

  const frameStart=js.indexOf('function raceFrameV189(timestamp){');
  const frameEnd=js.indexOf('function startRaceMotionV189(){',frameStart);
  const frame=frameStart>=0&&frameEnd>frameStart?js.slice(frameStart,frameEnd):'';
  if(!frame.includes('requestAnimationFrame(raceFrameV189)'))issues.push('Shared render RAF missing from race frame');
  if(!frame.includes('simulateRaceStepV192(simClockV192.fixedStepMs)'))issues.push('Fixed simulation step is not separated from rendering');
  if(frame.includes('vehicle.travel+=delta/vehicle.lapDurationMs'))issues.push('Raw render delta still directly advances vehicle physics');

  for(const token of ['#f1RacingRaceControlsV192 button{','#f1RacingPauseV192.active{'])if(!css.includes(token))issues.push('Phase 192 controls CSS missing: '+token);
  for(const token of ['node --check scripts/run-phase192-f1-simulation-clock-audit.mjs',"echo '[phase192] F1 simulation clock pause and time scale'"])if(!workflow.includes(token))issues.push('Phase 192 workflow verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:192,name:'f1-simulation-clock',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase192F1SimulationClockAudit();
