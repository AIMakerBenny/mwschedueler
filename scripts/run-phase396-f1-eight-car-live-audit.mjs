import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase396F1EightCarLiveAudit(){
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
    diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
    cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8'),issues=[],warnings=[];
  for(const token of ['function qaEightCarLiveRaceV396(){','engineQaV240.active=false','drivers:8,laps:3',
    'renderRaceVehiclesV189(16.67)','measureActualMarkerOverlapsV377(rendered,MARKER_OVERLAP_MONITOR_V377.maxZoom)',
    'competition&&noOverlaps','window.mwsF1QaEightCarLiveRaceV396=qaEightCarLiveRaceV396;'])
    if(!core.includes(token))issues.push('missing LIVE instrumentation '+token);
  if(!diag.includes('Phase 396 eight-car LIVE physics Chromium QA failed')||!diag.includes('eightCarLiveV396:eightCarLive396||null'))
    issues.push('missing Chromium LIVE regression');
  if(!cum.includes('runPhase396F1EightCarLiveAudit()')||!cum.includes('runPhase396FullIntegrationAudit()'))issues.push('missing cumulative audit');
  for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
    const s=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(s.status!==0)issues.push('syntax '+p+' '+String(s.stderr).slice(0,250));
  }
  const result={phase:396,name:'f1-eight-car-live-physics',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase396F1EightCarLiveAudit();
