import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase360F1FourLaneLongCornerFlowAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION360='phase360-f1-four-lane-long-corner-flow';",
    "laneCount:4",
    "visualWidthScale:1.65",
    "function resolvedLaneIndexV360(",
    "function applyFourLaneOffsetV360(",
    "fourLaneEnabledV360:true",
    "function fourLaneGuideOffsetsV360(",
    "function offsetTrackPathDataV360(",
    "function renderFourLaneGuidesV360(",
    "if(path)renderFourLaneGuidesV360(path,snapshot.track);",
    "function longCornerClusterTelemetryV360(",
    "marker.dataset.fourLaneIndexV360",
    "function qaFourLaneTrackV360(){",
    "window.mwsF1QaFourLaneTrackV360=qaFourLaneTrackV360;",
    "window.mwsF1GetLongCornerClusterTelemetryV360=longCornerClusterTelemetryV360;",
    "window.__mwsF1RacingV360=VERSION360;"
  ])if(!core.includes(token))issues.push('Phase 360 core missing: '+token);
  const start=core.indexOf('function resolvedLaneIndexV360(');
  const end=core.indexOf('function setVehicleRacingLineV197(',start);
  const source=start>=0&&end>start?core.slice(start,end):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(source))issues.push('Phase 360 lane system directly mutates vehicle progress');
  const lineStart=core.indexOf('function lineOffsetMetersV197('),lineEnd=core.indexOf('function phaseSpeedTargetV270(',lineStart),lineSource=lineStart>=0&&lineEnd>lineStart?core.slice(lineStart,lineEnd):'';
  if(lineSource.includes('applyFourLaneOffsetV360')||lineSource.includes('FOUR_LANE_TRACK_V360'))issues.push('Phase 360 visual lanes leaked into physical racing-line logic');
  if(!core.includes('const physicalTarget=physicalLateralOffsetV258(vehicle);'))issues.push('Phase 360 visual lane target is not isolated after physical lateral calculation');
  for(const token of [
    '#f1RacingRaceTrackGlowV188{stroke:#1b2430;stroke-width:58',
    '.f1-racing-race-lane-guides-v360{pointer-events:none}',
    '.f1-racing-race-lane-guide-v360{fill:none;'
  ])if(!css.includes(token))issues.push('Phase 360 CSS missing: '+token);
  for(const token of [
    'Phase 360 runtime did not propagate to Recovery H browser',
    'Phase 360 four-lane track QA failed',
    'Phase 360 long-corner clustering telemetry missing',
    'fourLaneV360:fourLane360||null',
    'longCornerV360:longCorner360||null'
  ])if(!diag.includes(token))issues.push('Phase 360 Recovery H missing: '+token);
  for(const token of [
    'node --check scripts/run-phase360-f1-four-lane-long-corner-flow-audit.mjs',
    '[phase360] F1 four-lane wide track and long-corner flow',
    'window.__mwsF1RacingV360=VERSION360;',
    '.f1-racing-race-lane-guide-v360'
  ])if(!workflow.includes(token))issues.push('Phase 360 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase360-f1-four-lane-long-corner-flow-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:360,name:'f1-four-lane-long-corner-flow',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase360F1FourLaneLongCornerFlowAudit();
