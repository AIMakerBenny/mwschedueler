import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase241F1SevenTrackEngineSuiteAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<241)issues.push('Phase 241 asset cache missing');
 for(const token of ["const VERSION241='phase241-seven-track-real-engine-suite';",'function runSevenTrackEngineSuiteV241(options={}){',"runs.push(runAcceleratedEngineRaceV240(trackId",'function qaSevenTrackEngineSuiteV241(){','window.mwsF1RunSevenTrackEngineSuiteV241=runSevenTrackEngineSuiteV241;','window.__mwsF1RacingV241=VERSION241;'])if(!racing.includes(token))issues.push('Phase 241 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:241,name:'f1-seven-track-real-engine-suite',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase241F1SevenTrackEngineSuiteAudit();
