import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase265F1GrandPrixPodiumAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<265)issues.push('Phase 265 asset cache missing');
 for(const token of ["const VERSION265='phase265-grand-prix-podium-redesign';",'function podiumMovementV265(','function podiumCardHtmlV265(','function renderPodiumTrackV265(','function qaPodiumV265(){',"image:String(vehicle.driver?.image||'')",'passCompletedCount:Number(vehicle.passCompletedCount)||0','f1RacingPodiumReplayV265:newRaceSameSettingsRecoveryG','window.mwsF1QaPodiumV265=qaPodiumV265;','window.__mwsF1RacingV265=VERSION265;'])if(!racing.includes(token))issues.push('Phase 265 runtime missing: '+token);
 for(const token of ['GRAND PRIX RESULT','id="f1RacingPodiumTrackNameV265"','id="f1RacingPodiumMetaV265"','id="f1RacingPodiumTrackSilhouetteV265"','id="f1RacingPodiumReplayV265"','같은 설정으로 다시 경기'])if(!index.includes(token))issues.push('Phase 265 UI missing: '+token);
 for(const token of ['/* Phase 265: Grand Prix result podium redesign */','.f1-racing-podium-card-v265.p1','.f1-racing-podium-card-v265.p2','.f1-racing-podium-card-v265.p3','@keyframes f1PodiumRevealV265','@keyframes f1WinnerGlowV265'])if(!css.includes(token))issues.push('Phase 265 CSS missing: '+token);
 for(const token of ['Phase 265 podium QA failed','singleSafe','bestLap','overtakes'])if(!live.includes(token))issues.push('Phase 265 Recovery H QA missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:265,name:'f1-grand-prix-podium-redesign',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase265F1GrandPrixPodiumAudit();
