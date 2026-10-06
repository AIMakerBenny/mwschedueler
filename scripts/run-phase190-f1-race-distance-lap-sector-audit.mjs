import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase190F1RaceDistanceLapSectorAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of ['assets/f1-racing-v1.css?v=1.0.0-phase180-shell&p=','assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=','id="f1RacingRaceLapV188"'])if(!index.includes(token))issues.push('Phase 190 HTML missing: '+token);

  for(const token of [
    "const VERSION190='phase190-race-distance-lap-sector';",
    'const DEFAULT_TOTAL_LAPS_V190=10;',
    'function normalizedProgressV190(value){',
    'function sectorForProgressV190(track,progress){',
    'function syncVehicleRaceMetricsV190(vehicle,track=activeRaceSnapshotV187?.track){',
    'vehicle.raceDistanceMeters=Math.max(0,raceProgress*length);',
    'vehicle.completedLaps=Math.max(0,Math.floor(Math.max(0,raceProgress)));',
    "vehicle.sector=raceProgress<0?'GRID':sectorForProgressV190(track,vehicle.progress);",
    'function updateRaceProgressHudV190(){',
    'row.dataset.raceDistance=String(Math.round(vehicle.raceDistanceMeters||0));',
    'if(raceMotionV189.hudAccumulatorMs>=100)',
    'window.mwsF1SyncVehicleRaceMetricsV190=syncVehicleRaceMetricsV190;',
    'window.__mwsF1RacingV190=VERSION190;'
  ])if(!js.includes(token))issues.push('Phase 190 telemetry runtime missing: '+token);
  if(!js.includes('totalLaps:draft.totalLaps,')&&!js.includes('totalLaps:requestedLaps,'))issues.push('Phase 190 telemetry runtime missing: compatible total laps snapshot field');

  if(!js.includes('syncVehicleRaceMetricsV190(vehicle,track)')&&!js.includes('syncVehicleRaceMetricsV190(vehicle)'))issues.push('Race simulation does not update race distance/lap/sector telemetry');
  if(!js.includes('data-f1-current-sector'))issues.push('Timing row current-sector badge missing');
  for(const token of ['.f1-racing-timing-row-v188 .driver em[data-f1-current-sector]','[data-sector="S1"]','[data-sector="S2"]','[data-sector="S3"]'])if(!css.includes(token))issues.push('Phase 190 telemetry CSS missing: '+token);

  for(const token of ['node --check scripts/run-phase190-f1-race-distance-lap-sector-audit.mjs',"echo '[phase190] F1 race distance lap and sector telemetry'"])if(!workflow.includes(token))issues.push('Phase 190 workflow verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:190,name:'f1-race-distance-lap-sector',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase190F1RaceDistanceLapSectorAudit();
