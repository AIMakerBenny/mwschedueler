import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase239F1TrackBenchmarkAlignmentAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<239)issues.push('Phase 239 asset cache missing');
 for(const token of ["const VERSION239='phase239-track-benchmark-alignment-gate';",'function pearsonV239(','function trackBenchmarkAlignmentV239(){',"overtakeCorrelation>=.72&&incidentCorrelation>=.72&&speedCorrelation>=.72",'window.mwsF1TrackBenchmarkAlignmentV239=trackBenchmarkAlignmentV239;','window.__mwsF1RacingV239=VERSION239;'])if(!racing.includes(token))issues.push('Phase 239 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:239,name:'f1-track-benchmark-alignment-gate',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase239F1TrackBenchmarkAlignmentAudit();
