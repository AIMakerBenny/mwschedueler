import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase211F1TrackMarkerAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const track=fs.readFileSync('assets/f1-track-v1.js','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<211)issues.push('Phase 211 asset cache missing');
  for(const token of [
    "const VERSION211='phase211-track-marker-integration';",
    'function renderTrackMarkersV211(layer,path,track,scope=\'race\'){',
    "'추월 감지 '+(index+1)",
    "renderTrackMarkersV211(annotations,path,snapshot.track,'race')",
    'window.mwsF1QaTrackMarkersV211=qaTrackMarkersV211;',
    'window.__mwsF1RacingV211=VERSION211;'
  ])if(!racing.includes(token))issues.push('Phase 211 runtime missing: '+token);
  for(const token of ['detection:0.992','detection:0.078','detection:0.028',"root.__mwsF1TrackMarkersV211='full-track-markers-v1';"])
    if(!track.includes(token))issues.push('Phase 211 track marker metadata missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const trackSyntax=spawnSync(process.execPath,['--check','assets/f1-track-v1.js'],{encoding:'utf8'});if(trackSyntax.status!==0)issues.push('F1 track JS syntax failed');
  const result={phase:211,name:'f1-track-marker-integration',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase211F1TrackMarkerAudit();
