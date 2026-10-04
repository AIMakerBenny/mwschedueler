import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase235F1TrackBehaviorAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<235)issues.push('Phase 235 asset cache missing');
 for(const token of ["const VERSION235='phase235-track-character-driving-behavior';",'function activeTrackRuntimeProfileV235(){','function trackOvertakeFactorV235(){','function trackIncidentRiskFactorV235(){','*trackIncidentRiskFactorV235();','base*skill*trackFactor','TRAFFIC_CONFIG_V207.attackGapMeters*trackFactor','function qaTrackBehaviorModifiersV235(){','window.mwsF1QaTrackBehaviorModifiersV235=qaTrackBehaviorModifiersV235;','window.__mwsF1RacingV235=VERSION235;'])if(!racing.includes(token))issues.push('Phase 235 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:235,name:'f1-track-character-driving-behavior',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase235F1TrackBehaviorAudit();
