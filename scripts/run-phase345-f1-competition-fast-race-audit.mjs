import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase345F1CompetitionFastRaceAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),index=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('assets/f1-racing-r343-r345.css','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION345='phase345-f1-competition-fast-race';",
  'const RACE_COMPETITION_V345=Object.freeze({',
  'function activeRaceModeV345(){',
  'const competitionV345=raceCompetitionConfigV345();',
  "const requestedLaps=raceMode==='FAST'?RACE_COMPETITION_V345.fastLaps:draft.totalLaps;",
  "fast.addEventListener('click',()=>startRaceFromSetupV187('FAST'))",
  'window.mwsF1QaCompetitionFastRaceV345=',
  'window.__mwsF1RacingV345=VERSION345;'
 ])if(!core.includes(token))issues.push('Phase 345 core missing: '+token);
 for(const token of ['id="f1RacingFastRaceV345"','패스트 레이스 3랩','assets/f1-racing-r343-r345.css?phase=345','phase345=1'])if(!index.includes(token))issues.push('Phase 345 index missing: '+token);
 if(!css.includes('.f1-racing-fast-race-v345'))issues.push('Phase 345 CSS missing');
 for(const token of ['Phase 345 runtime did not propagate to Recovery H browser','Phase 345 fast race and competition QA failed'])if(!diag.includes(token))issues.push('Phase 345 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/run-phase345-f1-competition-fast-race-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:345,name:'f1-competition-fast-race',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase345F1CompetitionFastRaceAudit();
