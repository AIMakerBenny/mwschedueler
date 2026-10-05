import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase245F1ZoomMarkerAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<245)issues.push('Phase 245 asset cache missing');
 for(const token of ["const VERSION245='phase245-zoom-aware-marker-scale';",'function raceMarkerScaleV245(','function syncRaceMarkerScaleV245(){','raceMarkerTransformV245(point,raceCameraV216.zoom)','syncRaceMarkerScaleV245();','function qaZoomAwareMarkerScaleV245(){','window.mwsF1QaZoomAwareMarkerScaleV245=qaZoomAwareMarkerScaleV245;','window.__mwsF1RacingV245=VERSION245;'])if(!racing.includes(token))issues.push('Phase 245 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:245,name:'f1-zoom-aware-marker-scale',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase245F1ZoomMarkerAudit();
