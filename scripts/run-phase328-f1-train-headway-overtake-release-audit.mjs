import fs from 'node:fs';import {spawnSync} from 'node:child_process';
export function runPhase328F1TrainHeadwayOvertakeReleaseAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of ["const VERSION328='phase328-f1-train-headway-overtake-release';","overtakeReleaseClosingKph:4.5","function qaTrainHeadwayOvertakeReleaseV328(){","window.__mwsF1RacingV328=VERSION328;"])if(!core.includes(token))issues.push('Phase 328 core missing: '+token);
 const legacyRelease=core.includes("const overtakeOpportunity=closingKph>=RACE_SPACING_CONFIG_V319.overtakeReleaseClosingKph");
 const dynamicRelease=core.includes("const releaseClosingKphV345=")&&core.includes("const overtakeOpportunity=closingKph>=releaseClosingKphV345");
 if(!legacyRelease&&!dynamicRelease)issues.push('Phase 328 overtake release logic missing');
 for(const token of ['Phase 328 runtime readiness','Phase 328 train headway/overtake release QA failed','Phase 328 overtake release threshold invalid'])if(!diag.includes(token))issues.push('Phase 328 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase328-f1-train-headway-overtake-release-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:328,name:'f1-train-headway-overtake-release',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase328F1TrainHeadwayOvertakeReleaseAudit();