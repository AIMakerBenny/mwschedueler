import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase240F1AcceleratedEngineAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<240)issues.push('Phase 240 asset cache missing');
 for(const token of ["const VERSION240='phase240-accelerated-real-engine-runner';",'function buildEngineQaSnapshotV240(','function runAcceleratedEngineRaceV240(','simulateRaceStepV192(stepMs);steps+=1;',"if(f1ScreenStateV185!=='SETUP')return",'window.mwsF1RunAcceleratedEngineRaceV240=runAcceleratedEngineRaceV240;','window.__mwsF1RacingV240=VERSION240;'])if(!racing.includes(token))issues.push('Phase 240 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:240,name:'f1-accelerated-real-engine-runner',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase240F1AcceleratedEngineAudit();
