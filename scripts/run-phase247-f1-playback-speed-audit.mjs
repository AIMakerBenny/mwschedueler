import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase247F1PlaybackSpeedAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<247)issues.push('Phase 247 asset cache missing');
 for(const token of ["const VERSION247='phase247-rebased-race-playback';","const RACE_PLAYBACK_BASE_V247=2;","function simulationPlaybackRateV247(","simClockV192.accumulatorMs+=delta*simulationPlaybackRateV247();","maxStepsPerFrame:32","window.mwsF1QaRacePlaybackSpeedV247=qaRacePlaybackSpeedV247;","window.__mwsF1RacingV247=VERSION247;"])if(!racing.includes(token))issues.push('Phase 247 runtime missing: '+token);
 if(!racing.includes("simClockV192.timeScale=1;simClockV192.simTimeMs=0"))issues.push('Phase 247 default UI scale is not reset to 1x');
 for(const token of ['data-f1-timescale="1" aria-pressed="true">1배','data-f1-timescale="2" aria-pressed="false">2배','data-f1-timescale="4" aria-pressed="false">4배'])if(!index.includes(token))issues.push('Phase 247 speed control contract missing: '+token);
 for(const token of ['mwsF1QaRacePlaybackSpeedV247','effectiveTimeScale','Phase 247 default playback did not advance near rebased 2x','Phase 247 2x control did not select effective 4x'])if(!live.includes(token))issues.push('Phase 247 Recovery H playback QA missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+syntax.stderr);
 const result={phase:247,name:'f1-rebased-race-playback',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase247F1PlaybackSpeedAudit();
