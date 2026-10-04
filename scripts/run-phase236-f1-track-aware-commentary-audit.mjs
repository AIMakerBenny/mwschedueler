import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase236F1TrackAwareCommentaryAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<236)issues.push('Phase 236 asset cache missing');
 for(const token of ["const VERSION236='phase236-track-aware-commentary';",'function trackCommentaryLineV236(track=activeRaceSnapshotV187?.track){',"+'에서 경기가 시작됐습니다. '+trackCommentaryLineV236(track)",'function qaTrackAwareCommentaryV236(){','window.mwsF1QaTrackAwareCommentaryV236=qaTrackAwareCommentaryV236;','window.__mwsF1RacingV236=VERSION236;'])if(!racing.includes(token))issues.push('Phase 236 runtime missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:236,name:'f1-track-aware-commentary',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase236F1TrackAwareCommentaryAudit();
