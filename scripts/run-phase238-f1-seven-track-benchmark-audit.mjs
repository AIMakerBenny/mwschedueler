import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase238F1SevenTrackBenchmarkAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<238)issues.push('Phase 238 asset cache missing');
 for(const token of ["const VERSION238='phase238-seven-track-long-run-benchmark';",'function simulateTrackBenchmarkRunV238(','function aggregateTrackBenchmarkV238(','function runSevenTrackBenchmarkV238(options={}){','runs:18,drivers:10,laps:10','window.mwsF1RunSevenTrackBenchmarkV238=runSevenTrackBenchmarkV238;','window.__mwsF1RacingV238=VERSION238;'])if(!racing.includes(token))issues.push('Phase 238 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:238,name:'f1-seven-track-long-run-benchmark',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase238F1SevenTrackBenchmarkAudit();
