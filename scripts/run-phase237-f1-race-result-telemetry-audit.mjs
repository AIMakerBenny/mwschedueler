import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase237F1RaceResultTelemetryAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<237)issues.push('Phase 237 asset cache missing');
 for(const token of ["const VERSION237='phase237-race-result-telemetry';",'function buildRaceTelemetryV237(','telemetry:buildRaceTelemetryV237(snapshot,raceMotionV189.vehicles),','function qaRaceResultTelemetryV237(){','window.mwsF1BuildRaceTelemetryV237=buildRaceTelemetryV237;','window.__mwsF1RacingV237=VERSION237;'])if(!racing.includes(token))issues.push('Phase 237 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:237,name:'f1-race-result-telemetry',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase237F1RaceResultTelemetryAudit();
