import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase361F1CornerLaneOccupancyPitHudAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION361='phase361-f1-corner-lane-occupancy-pit-hud';",
    'const CORNER_LANE_OCCUPANCY_V361=Object.freeze({',
    'const PIT_HUD_V361=Object.freeze({maxVisible:6,bottomOffsetPx:116});',
    'function cornerLanePeersV361(',
    'function chooseCornerLaneIndexV361(',
    'function updateCornerLaneOccupancyV361(',
    'function applyDenseLabelStaggerV361(',
    'vehicle.lateralOffsetMeters=physicalTarget;',
    'marker.dataset.cornerLaneDensityV361',
    'function ensurePitHudV361(){',
    'function pitHudRemainingSecondsV361(',
    'function pitHudRowsV361(){',
    'function renderPitHudV361(){',
    'function qaCornerLaneOccupancyV361(){',
    'function qaPitHudV361(){',
    'window.mwsF1QaCornerLaneOccupancyV361=qaCornerLaneOccupancyV361;',
    'window.mwsF1QaPitHudV361=qaPitHudV361;',
    'window.__mwsF1RacingV361=VERSION361;'
  ])if(!core.includes(token))issues.push('Phase 361 core missing: '+token);
  const occupancyStart=core.indexOf('function cornerLanePeersV361('),occupancyEnd=core.indexOf('function applyFourLaneOffsetV360(',occupancyStart),occupancySource=occupancyStart>=0&&occupancyEnd>occupancyStart?core.slice(occupancyStart,occupancyEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(occupancySource))issues.push('Phase 361 corner occupancy directly mutates vehicle progress');
  const lineStart=core.indexOf('function lineOffsetMetersV197('),lineEnd=core.indexOf('function phaseSpeedTargetV270(',lineStart),lineSource=lineStart>=0&&lineEnd>lineStart?core.slice(lineStart,lineEnd):'';
  if(lineSource.includes('V361')||lineSource.includes('cornerLane'))issues.push('Phase 361 visual occupancy leaked into physical racing-line logic');
  const pitStart=core.indexOf('function ensurePitHudV361('),pitEnd=core.indexOf("function qaPitCycleV205(",pitStart),pitSource=pitStart>=0&&pitEnd>pitStart?core.slice(pitStart,pitEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(pitSource))issues.push('Phase 361 PIT HUD directly mutates vehicle progress');
  for(const token of [
    '.f1-racing-pit-hud-v361{position:absolute;right:14px;bottom:116px;',
    '.f1-racing-pit-card-v361{display:grid;',
    '.pit-tyres-v361{display:inline-flex;',
    '.f1-racing-pit-more-v361{align-self:flex-end;'
  ])if(!css.includes(token))issues.push('Phase 361 CSS missing: '+token);
  for(const token of [
    'Phase 361 runtime did not propagate to Recovery H browser',
    'Phase 361 corner lane occupancy QA failed',
    'Phase 361 PIT HUD QA failed',
    'cornerLaneV361:cornerLane361||null',
    'pitHudV361:pitHud361||null'
  ])if(!diag.includes(token))issues.push('Phase 361 Recovery H missing: '+token);
  for(const token of [
    'node --check scripts/run-phase361-f1-corner-lane-occupancy-pit-hud-audit.mjs',
    '[phase361] F1 corner lane occupancy and PIT HUD',
    'window.__mwsF1RacingV361=VERSION361;',
    '.f1-racing-pit-hud-v361'
  ])if(!workflow.includes(token))issues.push('Phase 361 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase361-f1-corner-lane-occupancy-pit-hud-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:361,name:'f1-corner-lane-occupancy-pit-hud',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase361F1CornerLaneOccupancyPitHudAudit();
