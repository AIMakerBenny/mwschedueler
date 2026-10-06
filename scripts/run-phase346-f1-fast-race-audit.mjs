import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase346F1FastRaceAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),index=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('assets/f1-racing-r343-r346.css','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of ["const VERSION346='phase346-f1-fast-race-three-lap';","const FAST_RACE_CONFIG_V346=Object.freeze({laps:3,mode:'FAST'","let nextRaceModeV346='NORMAL';",'function startFastRaceV346(){',"totalLaps:mode==='FAST'?FAST_RACE_CONFIG_V346.laps:selectedTotalLapsRecoveryD","raceMode:String(draft.raceMode||'NORMAL')",'function qaFastRaceV346(){','window.mwsF1QaFastRaceV346=qaFastRaceV346;','window.__mwsF1RacingV346=VERSION346;'])if(!core.includes(token))issues.push('Phase 346 core missing: '+token);
 for(const token of ['id="f1RacingFastRaceV346"','패스트 레이스 3랩','assets/f1-racing-r343-r346.css?phase=346'])if(!index.includes(token))issues.push('Phase 346 UI missing: '+token);
 if(!css.includes('.f1-racing-fast-race-v346'))issues.push('Phase 346 CSS missing fast race button');
 for(const token of ['Phase 346 runtime did not propagate to Recovery H browser','Phase 346 fast race QA failed'])if(!diag.includes(token))issues.push('Phase 346 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/run-phase346-f1-fast-race-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:346,name:'f1-fast-race',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase346F1FastRaceAudit();
