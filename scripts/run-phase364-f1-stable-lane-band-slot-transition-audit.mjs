import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase364F1StableLaneBandSlotTransitionAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION364='phase364-f1-stable-lane-band-slot-transition';",
    'const LANE_BAND_SLOT_STABILITY_V364=Object.freeze({lockMs:1200',
    'function laneBandSlotValuesV364(',
    'function laneBandClusterV364(',
    'function assignStableLaneBandSlotsV364(',
    'laneBandGroupKeyV364',
    'laneBandSlotLockedUntilV364',
    'preservedRaceOrderChanges',
    'function resetLaneBandStabilityTelemetryV364(){',
    'resetLaneBandStabilityTelemetryV364();',
    'marker.dataset.laneBandLockedSlotV364',
    'function qaLaneBandSlotStabilityV364(){',
    'window.mwsF1QaLaneBandSlotStabilityV364=qaLaneBandSlotStabilityV364;',
    'window.__mwsF1RacingV364=VERSION364;'
  ])if(!core.includes(token))issues.push('Phase 364 core missing: '+token);
  const slotStart=core.indexOf('function assignStableLaneBandSlotsV364('),slotEnd=core.indexOf('function resetLaneBandStabilityTelemetryV364(',slotStart),slotSource=slotStart>=0&&slotEnd>slotStart?core.slice(slotStart,slotEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(slotSource))issues.push('Phase 364 slot stability directly mutates progress');
  const lineStart=core.indexOf('function lineOffsetMetersV197('),lineEnd=core.indexOf('function phaseSpeedTargetV270(',lineStart),lineSource=lineStart>=0&&lineEnd>lineStart?core.slice(lineStart,lineEnd):'';
  if(lineSource.includes('V364')||lineSource.includes('laneBandLockedSlotV364'))issues.push('Phase 364 slot stability leaked into physical racing line');
  for(const token of ['Phase 364 runtime did not propagate to Recovery H browser','Phase 364 lane band slot stability QA failed','Phase 364 stable lane band overlap remained','laneStabilityV364:laneStability364||null'])if(!diag.includes(token))issues.push('Phase 364 Recovery H missing: '+token);
  for(const token of ['node --check scripts/run-phase364-f1-stable-lane-band-slot-transition-audit.mjs','[phase364] F1 stable lane-band slot transition','window.__mwsF1RacingV364=VERSION364;'])if(!workflow.includes(token))issues.push('Phase 364 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase364-f1-stable-lane-band-slot-transition-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:364,name:'f1-stable-lane-band-slot-transition',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase364F1StableLaneBandSlotTransitionAudit();
