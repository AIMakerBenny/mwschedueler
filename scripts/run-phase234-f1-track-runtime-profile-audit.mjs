import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase234F1TrackRuntimeProfileAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<234)issues.push('Phase 234 asset cache missing');
 for(const token of ["const VERSION234='phase234-track-runtime-character-profile';",'function trackRuntimeProfileV234(track){','runtimeProfile:trackRuntimeProfileV234(track),','function qaTrackRuntimeProfilesV234(){','window.mwsF1QaTrackRuntimeProfilesV234=qaTrackRuntimeProfilesV234;','window.__mwsF1RacingV234=VERSION234;'])if(!racing.includes(token))issues.push('Phase 234 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:234,name:'f1-track-runtime-character-profile',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase234F1TrackRuntimeProfileAudit();
