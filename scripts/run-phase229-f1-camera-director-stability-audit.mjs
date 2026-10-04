import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase229F1CameraDirectorStabilityAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<229)issues.push('Phase 229 asset cache missing');
  for(const token of [
    "const VERSION229='phase229-camera-director-stability';",
    'const CAMERA_DIRECTOR_STABILITY_V229=Object.freeze({candidateHoldMs:700,minSwitchMs:1800,urgentBattleGapSeconds:0.55,focusDeadbandSvg:3,zoomDeadband:0.025});',
    "candidateKey:'',candidateSinceSimMs:0",
    'stableFor>=CAMERA_DIRECTOR_STABILITY_V229.candidateHoldMs',
    'const deadband=smooth&&raceCameraV216.initialized',
    'window.mwsF1QaCameraDirectorStabilityV229=qaCameraDirectorStabilityV229;',
    'window.__mwsF1RacingV229=VERSION229;'
  ])if(!racing.includes(token))issues.push('Phase 229 camera stability runtime missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:229,name:'f1-camera-director-stability',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase229F1CameraDirectorStabilityAudit();
