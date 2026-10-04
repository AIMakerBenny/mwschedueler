import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase196F1VehicleDynamicsAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of ['assets/f1-racing-v1.css?v=1.0.0-phase180-shell&p=196','assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=196'])if(!index.includes(token))issues.push('Phase 196 asset link missing: '+token);
  for(const token of [
    "const VERSION196='phase196-vehicle-dynamics-telemetry';",
    'speedKph:0,targetSpeedKph:0,throttle:0,brake:0,accelerationMps2:0,gear:1,rpm:8500',
    'function gearForSpeedV196(speedKph){',
    'function rpmForSpeedAndGearV196(speedKph,gear){',
    'function simulateVehicleDynamicsV196(vehicle,stepMs){',
    'const targetData=getSpeedTargetAtProgressV195(vehicle.progress);',
    'accelMps2=-brakeBase*brake;',
    'vehicle.travel+=distanceMeters/Math.max(1,Number(track.lengthMeters)||1);',
    'simulateVehicleDynamicsV196(vehicle,stepMs);',
    "const gear=row.querySelector('.gear');",
    "const rpm=row.querySelector('.rpm');",
    "const speed=row.querySelector('.speed');",
    'window.mwsF1SimulateVehicleDynamicsV196=simulateVehicleDynamicsV196;',
    'window.__mwsF1RacingV196=VERSION196;'
  ])if(!racing.includes(token))issues.push('Phase 196 vehicle dynamics missing: '+token);

  const simStart=racing.indexOf('function simulateRaceStepV192(stepMs){');
  const simEnd=racing.indexOf('function raceFrameV189(timestamp){',simStart);
  const sim=simStart>=0&&simEnd>simStart?racing.slice(simStart,simEnd):'';
  if(!sim.includes('simulateVehicleDynamicsV196(vehicle,stepMs);'))issues.push('Fixed simulation clock is not driving vehicle dynamics');
  if(sim.includes('vehicle.travel+=stepMs/vehicle.lapDurationMs'))issues.push('Legacy constant lap-duration motion still advances race travel');

  for(const token of ['.f1-racing-timing-row-v188 .gear,.f1-racing-timing-row-v188 .rpm,.f1-racing-timing-row-v188 .speed{'])if(!css.includes(token))issues.push('Phase 196 telemetry CSS missing: '+token);
  for(const token of ['node --check scripts/run-phase196-f1-vehicle-dynamics-audit.mjs',"echo '[phase196] F1 vehicle speed throttle brake gear and RPM'"])if(!workflow.includes(token))issues.push('Phase 196 workflow verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:196,name:'f1-vehicle-dynamics-telemetry',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase196F1VehicleDynamicsAudit();
