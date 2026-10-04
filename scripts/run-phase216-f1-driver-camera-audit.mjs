import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase216F1DriverCameraAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<216)issues.push('Phase 216 asset cache missing');
  for(const token of [
    "const VERSION216='phase216-driver-markers-camera';",
    'const DRIVER_COLORS_V216=Object.freeze([',
    "const CAMERA_MODES_V216=Object.freeze(['AUTO','FULL','LEADER','BATTLE','MANUAL']);",
    'function ensureRaceCameraControlsV216(){',
    "stage.addEventListener('wheel'",
    "raceCameraV216.mode='MANUAL'",
    "stage.addEventListener('pointerdown'",
    'function updateAutoRaceCameraV216(immediate=false){',
    "marker.style.setProperty('--f1-driver-color',color);",
    'window.mwsF1QaDriverMarkerCameraV216=qaDriverMarkerCameraV216;',
    'window.__mwsF1RacingV216=VERSION216;'
  ])if(!racing.includes(token))issues.push('Phase 216 runtime missing: '+token);
  for(const token of [
    '/* Phase 216: distinct driver markers and interactive race camera */',
    '.f1-racing-camera-controls-v216{',
    'background:var(--f1-driver-color',
    '#f1RacingRaceTrackSvgV188{cursor:grab'
  ])if(!css.includes(token))issues.push('Phase 216 CSS missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:216,name:'f1-driver-markers-camera',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase216F1DriverCameraAudit();
