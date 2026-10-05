import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase286F1AutoCameraJitterAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),patch=fs.readFileSync('assets/f1-racing-r283-r287.js','utf8');
 for(const token of ["const VERSION286='phase286-f1-r11-auto-camera-jitter-suppression';",'const AUTO_CAMERA_SMOOTH_CONFIG_V286=Object.freeze({','function smoothAutoCameraBoxV286(raw){','function installAutoCameraSmoothingV286(){','function qaAutoCameraJitterSuppressionV286(){','window.__mwsF1RacingV286=VERSION286;'])if(!patch.includes(token))issues.push('Phase 286 patch missing: '+token);
 if(!index.includes('assets/f1-racing-r283-r287.js?phase=286'))issues.push('Phase 286 patch cache link missing');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r283-r287.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('Phase 286 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:286,name:'f1-r11-auto-camera-jitter-suppression',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase286F1AutoCameraJitterAudit();
