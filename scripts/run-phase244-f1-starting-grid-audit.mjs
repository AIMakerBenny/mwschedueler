import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase244F1StartingGridAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<244)issues.push('Phase 244 asset cache missing');
 for(const token of ['f1-racing-grid-header-v244','f1-racing-grid-actions-v244','id="f1RacingGridStartRecoveryM"','id="f1RacingGridCancelRecoveryM"'])if(!index.includes(token))issues.push('Phase 244 grid structure missing: '+token);
 for(const token of ['.f1-racing-grid-header-v244{','.f1-racing-grid-actions-v244{'])if(!css.includes(token))issues.push('Phase 244 CSS missing: '+token);
 for(const token of ["const VERSION244='phase244-starting-grid-top-actions';",'function qaStartingGridLayoutV244(){','window.mwsF1QaStartingGridLayoutV244=qaStartingGridLayoutV244;','window.__mwsF1RacingV244=VERSION244;'])if(!racing.includes(token))issues.push('Phase 244 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:244,name:'f1-starting-grid-top-actions',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase244F1StartingGridAudit();
