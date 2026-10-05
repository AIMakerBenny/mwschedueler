import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase272F1RandomStartingGridAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phases=[...index.matchAll(/recovery=N1&phase=(\d+)/g)].map(m=>Number(m[1]));if(!phases.some(v=>v>=272))issues.push('Phase 272 asset cache missing');
  for(const token of ["const VERSION272='phase272-random-seeded-starting-grid';",'function gridSeedV272(','function seededShuffleDriversV272(','function snapshotWithStartingGridV272(','function gridStartOffsetV272(','function reshuffleStartingGridV272(','gridPosition:Number(driver.gridPosition)||index+1','const orderedDrivers=(snapshot?.drivers||[]).slice().sort','function qaRandomStartingGridV272(){','window.mwsF1QaRandomStartingGridV272=qaRandomStartingGridV272;','window.__mwsF1RacingV272=VERSION272;'])if(!racing.includes(token))issues.push('Phase 272 runtime missing: '+token);
  for(const token of ['id="f1RacingGridShuffleV272"','id="f1RacingGridListV272"','RANDOM STARTING GRID'])if(!index.includes(token))issues.push('Phase 272 grid DOM missing: '+token);
  for(const token of ['/* Phase 272: seeded random starting grid */','.f1-racing-grid-card-v272','.f1-racing-grid-position-v272'])if(!css.includes(token))issues.push('Phase 272 grid CSS missing: '+token);
  for(const token of ['Phase 272 random starting grid QA failed','Phase 272 reshuffle did not change grid order','Phase 272 engine start offsets'])if(!live.includes(token))issues.push('Phase 272 Recovery H missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs']){const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim())}
  const result={phase:272,name:'f1-random-starting-grid',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase272F1RandomStartingGridAudit();
