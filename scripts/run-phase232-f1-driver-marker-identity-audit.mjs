import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase232F1DriverMarkerIdentityAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<232)issues.push('Phase 232 asset cache missing');
  for(const token of [
    "const VERSION232='phase232-driver-marker-number-identity';",
    'function driverNumberV232(vehicle,index=0){',
    "class:'car-number-v232'",
    'marker.dataset.driverNumberV232=driverNumberV232(vehicle,index);',
    'function qaDriverMarkerIdentityV232(){',
    'window.mwsF1QaDriverMarkerIdentityV232=qaDriverMarkerIdentityV232;',
    'window.__mwsF1RacingV232=VERSION232;'
  ])if(!racing.includes(token))issues.push('Phase 232 marker identity runtime missing: '+token);
  if(!css.includes('.f1-racing-race-vehicle-v189 .car-number-v232{'))issues.push('Phase 232 marker number CSS missing');
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:232,name:'f1-driver-marker-number-identity',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase232F1DriverMarkerIdentityAudit();
