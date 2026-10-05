import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase242F1RealEngineAlignmentAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<242)issues.push('Phase 242 asset cache missing');
 for(const token of ["const VERSION242='phase242-real-engine-benchmark-alignment';",'function realEngineBenchmarkAlignmentV242(','speedCorrelation>=.5&&lapCorrelation>=.5&&speedSpread>=8&&lapSpread>=3000','function qaRealEngineBenchmarkAlignmentV242(){','window.mwsF1RealEngineBenchmarkAlignmentV242=realEngineBenchmarkAlignmentV242;','window.__mwsF1RacingV242=VERSION242;'])if(!racing.includes(token))issues.push('Phase 242 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:242,name:'f1-real-engine-benchmark-alignment',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase242F1RealEngineAlignmentAudit();
