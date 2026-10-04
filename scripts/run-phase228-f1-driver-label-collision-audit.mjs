import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase228F1DriverLabelCollisionAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<228)issues.push('Phase 228 asset cache missing');
  for(const token of [
    "const VERSION228='phase228-driver-label-collision-avoidance';",
    'function layoutRaceVehicleLabelsV228(rendered=[]){',
    'function countLabelOverlapsV228(placements=[]){',
    'layoutRaceVehicleLabelsV228(rendered);',
    'window.mwsF1QaDriverLabelCollisionV228=qaDriverLabelCollisionV228;',
    'window.__mwsF1RacingV228=VERSION228;'
  ])if(!racing.includes(token))issues.push('Phase 228 label collision runtime missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:228,name:'f1-driver-label-collision-avoidance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase228F1DriverLabelCollisionAudit();
