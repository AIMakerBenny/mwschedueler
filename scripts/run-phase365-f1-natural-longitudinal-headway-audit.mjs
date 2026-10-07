import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase365F1NaturalLongitudinalHeadwayAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION365='phase365-f1-natural-longitudinal-headway';",
    'const TRACK_PRESENTATION_V365=Object.freeze({visualWidthScale:FOUR_LANE_TRACK_V360.visualWidthScale,trackStrokeWidth:58});',
    'const NATURAL_HEADWAY_V365=Object.freeze({',
    'function naturalHeadwayTargetV365(',
    'function naturalRaceSpacingControlV365(',
    'NATURAL_HEADWAY_BRAKE_V365',
    'NATURAL_HEADWAY_LIFT_V365',
    'NATURAL_EMERGENCY_V365',
    'const spacingControlV319=naturalRaceSpacingControlV365(vehicle);',
    'const rawTarget=physicalTarget;',
    '*TRACK_PRESENTATION_V365.visualWidthScale;',
    'const scale=raceMarkerScaleV245(zoom);',
    'function qaNaturalLongitudinalHeadwayV365(){',
    'window.mwsF1QaNaturalLongitudinalHeadwayV365=qaNaturalLongitudinalHeadwayV365;',
    'window.__mwsF1RacingV365=VERSION365;'
  ])if(!core.includes(token))issues.push('Phase 365 core missing: '+token);
  const spacingStart=core.indexOf('function naturalRaceSpacingControlV365('),spacingEnd=core.indexOf('function naturalHeadwayTelemetrySnapshotV365(',spacingStart),spacingSource=spacingStart>=0&&spacingEnd>spacingStart?core.slice(spacingStart,spacingEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(spacingSource))issues.push('Phase 365 headway controller directly mutates progress');
  const lateralStart=core.indexOf('function updateVisualLateralOffsetV258('),lateralEnd=core.indexOf('function qaLateralDynamicsV269(',lateralStart),lateralSource=lateralStart>=0&&lateralEnd>lateralStart?core.slice(lateralStart,lateralEnd):'';
  if(lateralSource.includes('updateCornerLaneOccupancyV361')||lateralSource.includes('applyFourLaneOffsetV360'))issues.push('Phase 365 runtime still laterally disperses normal cars');
  if(!css.includes('/* Phase 365: restore normal track presentation, keep 4 guide lines */')||!css.includes('#f1RacingRaceTrackGlowV188{stroke-width:58}'))issues.push('Phase 365 track presentation restore missing');
  for(const token of ['Phase 365 runtime did not propagate to Recovery H browser','Phase 365 natural longitudinal headway QA failed','naturalHeadwayV365:naturalHeadway365||null'])if(!diag.includes(token))issues.push('Phase 365 Recovery H missing: '+token);
  for(const token of ['node --check scripts/run-phase365-f1-natural-longitudinal-headway-audit.mjs','[phase365] F1 natural longitudinal headway','window.__mwsF1RacingV365=VERSION365;'])if(!workflow.includes(token))issues.push('Phase 365 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase365-f1-natural-longitudinal-headway-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:365,name:'f1-natural-longitudinal-headway',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase365F1NaturalLongitudinalHeadwayAudit();
