import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase273F1StartingGridCardRevealAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phases=[...index.matchAll(/recovery=N1&phase=(\d+)/g)].map(m=>Number(m[1]));if(!phases.some(v=>v>=273))issues.push('Phase 273 asset cache missing');
 for(const token of ["const VERSION273='phase273-starting-grid-card-shuffle-reveal';",'const GRID_REVEAL_CONFIG_V273=Object.freeze({','function buildShuffleStackV273(','function runStartingGridRevealV273(','function waitGridRevealV273(','function qaStartingGridRevealV273(){','if(gridRevealStateV273.revealing)return false;','runStartingGridRevealV273(snapshot);','runStartingGridRevealV273(activeRaceSnapshotV187,{reshuffle:true});','window.mwsF1QaStartingGridRevealV273=qaStartingGridRevealV273;','window.__mwsF1RacingV273=VERSION273;'])if(!racing.includes(token))issues.push('Phase 273 runtime missing: '+token);
 for(const token of ['id="f1RacingGridShuffleStageV273"','id="f1RacingGridRevealStatusV273"'])if(!index.includes(token))issues.push('Phase 273 DOM missing: '+token);
 for(const token of ['/* Phase 273: contact-card shuffle and sequential grid reveal */','@keyframes f1GridShuffleFastV273','@keyframes f1GridCardLandV273','.grid-reveal-locked-v273'])if(!css.includes(token))issues.push('Phase 273 CSS missing: '+token);
 for(const token of ['Phase 273 starting grid reveal QA failed','Phase 273 reveal did not finish','Phase 273 start button unlocked before reveal completion'])if(!live.includes(token))issues.push('Phase 273 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs']){const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim())}
 const result={phase:273,name:'f1-starting-grid-card-reveal',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase273F1StartingGridCardRevealAudit();
