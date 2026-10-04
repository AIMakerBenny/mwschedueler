import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase225F1CameraDirectorAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<225)issues.push('Phase 225 asset cache missing');
  for(const token of [
    "const VERSION225='phase225-camera-director';",
    "const CAMERA_MODES_V216=Object.freeze(['AUTO','FULL','LEADER','FRONT','BATTLE','MANUAL']);",
    'function cameraFocusForVehiclesV225(vehicles,preferredZoom=2.4){',
    'function selectAutoCameraTargetV225(standings=computeRaceStandingsV191()){',
    "cameraDirectorV225.lockUntilSimMs=now+(kind==='BATTLE'?3200:2600);",
    "data-f1-camera-mode=\"FRONT\"",
    'window.mwsF1QaCameraDirectorV225=qaCameraDirectorV225;',
    'window.__mwsF1RacingV225=VERSION225;'
  ])if(!racing.includes(token))issues.push('Phase 225 camera director missing: '+token);
  if(!css.includes('/* Phase 225: camera director controls */'))issues.push('Phase 225 camera CSS missing');
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:225,name:'f1-camera-director',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase225F1CameraDirectorAudit();
