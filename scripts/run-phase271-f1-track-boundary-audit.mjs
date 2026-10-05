import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase271F1TrackBoundaryAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phases=[...index.matchAll(/recovery=N1&phase=(\d+)/g)].map(m=>Number(m[1]));
  if(!phases.some(v=>v>=271))issues.push('Phase 271 asset cache missing');
  if(!index.includes('f1-track-geometry-v2.js?v=1.0.0-phase195-speed-profile&recovery=L1&phase=270&exitrecovery=3'))issues.push('Phase 270 geometry cache bust missing');

  for(const token of [
    "const VERSION271='phase271-track-boundary-wall-riding-fix';",
    'const TRACK_BOUNDARY_V271=Object.freeze({',
    'function trackLateralLimitV271(',
    'function trackBoundaryStateV271(',
    'function boundaryOvertakeEligibleV271(',
    'vehicle.trackBoundaryExceededV271=boundary.offTrack',
    'maxTarget*=boundaryStateV271.speedFactor;',
    "vehicle.battleState='PASS_FAILED'",
    'const visualLimitV271=trackLateralLimitV271(vehicle);',
    'function qaTrackBoundaryV271(){',
    'window.mwsF1QaTrackBoundaryV271=qaTrackBoundaryV271;',
    'window.__mwsF1RacingV271=VERSION271;'
  ])if(!racing.includes(token))issues.push('Phase 271 runtime missing: '+token);

  for(const token of ['Phase 271 track boundary QA failed','Phase 271 off-track penalty missing'])
    if(!live.includes(token))issues.push('Phase 271 Recovery H missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:271,name:'f1-track-boundary-wall-riding-fix',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase271F1TrackBoundaryAudit();
