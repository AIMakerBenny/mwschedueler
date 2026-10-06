import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase343F1CornerRacingModelAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),geo=fs.readFileSync('assets/f1-track-geometry-v2.js','utf8'),index=fs.readFileSync('index.html','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of ["const VERSION343='phase343-f1-corner-racing-model';",'const CORNER_RACE_CONFIG_V343=Object.freeze({','function phaseSpeedTargetV343(','function qaRaceCornerModelV343(){','const baseTarget=phaseSpeedTargetV343(vehicle,targetData,phaseInfoV270);','window.mwsF1QaRaceCornerModelV343=qaRaceCornerModelV343;','window.__mwsF1RacingV343=VERSION343;'])if(!core.includes(token))issues.push('Phase 343 core missing: '+token);
 for(const token of ["function visualTurnDirectionV343(signedTurn){","return Number(signedTurn)>=0?'right':'left';","direction:visualTurnDirectionV343(signed),","cornerSeverityV343","root.__mwsF1CornerGeometryV343='svg-y-down-out-in-out-v1';"])if(!geo.includes(token))issues.push('Phase 343 geometry missing: '+token);
 if(geo.includes("direction:signed>=0?'left':'right'"))issues.push('Phase 343 legacy SVG-inverted corner direction remains');
 for(const token of ['phase343=1','phase346=1'])if(!index.includes(token))issues.push('Phase 343 cache bust missing: '+token);
 for(const token of ['Phase 343 runtime did not propagate to Recovery H browser','Phase 343 corner racing model QA failed'])if(!diag.includes(token))issues.push('Phase 343 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','assets/f1-track-geometry-v2.js','scripts/run-phase343-f1-corner-racing-model-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:343,name:'f1-corner-racing-model',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase343F1CornerRacingModelAudit();
