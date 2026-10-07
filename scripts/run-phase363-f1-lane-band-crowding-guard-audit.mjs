import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase363F1LaneBandCrowdingGuardAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION363='phase363-f1-lane-band-crowding-guard';",
    'const LANE_BAND_CROWDING_V363=Object.freeze({',
    'bandHalfGapRatio:.42',
    'pairMarkerScale:.82',
    'multiMarkerScale:.74',
    'function laneBandOffsetV363(',
    'laneTarget+nudge+bandOffset',
    'function recordScreenCrowdingV363(',
    'function screenCrowdingTelemetryV363(){',
    'marker.dataset.laneBandSlotV363',
    'marker.dataset.laneBandPeerCountV363',
    'function qaLaneBandCrowdingGuardV363(){',
    'window.mwsF1QaLaneBandCrowdingGuardV363=qaLaneBandCrowdingGuardV363;',
    'window.mwsF1GetScreenCrowdingV363=screenCrowdingTelemetryV363;',
    'window.__mwsF1RacingV363=VERSION363;'
  ])if(!core.includes(token))issues.push('Phase 363 core missing: '+token);
  const bandStart=core.indexOf('function laneBandOffsetV363('),bandEnd=core.indexOf('function applyFourLaneOffsetV360(',bandStart),bandSource=bandStart>=0&&bandEnd>bandStart?core.slice(bandStart,bandEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(bandSource))issues.push('Phase 363 lane band directly mutates progress');
  const lineStart=core.indexOf('function lineOffsetMetersV197('),lineEnd=core.indexOf('function phaseSpeedTargetV270(',lineStart),lineSource=lineStart>=0&&lineEnd>lineStart?core.slice(lineStart,lineEnd):'';
  if(lineSource.includes('V363')||lineSource.includes('laneBand'))issues.push('Phase 363 lane band leaked into physical racing line');
  for(const token of ['Phase 363 runtime did not propagate to Recovery H browser','Phase 363 lane band crowding guard QA failed','laneBandV363:laneBand363||null','screenCrowdingV363:screenCrowding363||null'])if(!diag.includes(token))issues.push('Phase 363 Recovery H missing: '+token);
  for(const token of ['node --check scripts/run-phase363-f1-lane-band-crowding-guard-audit.mjs','[phase363] F1 lane-band crowding guard','window.__mwsF1RacingV363=VERSION363;'])if(!workflow.includes(token))issues.push('Phase 363 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase363-f1-lane-band-crowding-guard-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:363,name:'f1-lane-band-crowding-guard',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase363F1LaneBandCrowdingGuardAudit();
