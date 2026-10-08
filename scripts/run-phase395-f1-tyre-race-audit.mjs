import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase395F1TyreRaceAudit(){
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
   cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8'),issues=[],warnings=[];
 for(const token of ["function qaControlledCompoundRaceV395()", "window.mwsF1QaControlledCompoundRaceV395=qaControlledCompoundRaceV395;",
 "qaCompoundOverrideV395:", "snapshot?.qaCompoundOverrideV395?snapshot.qaCompoundOverrideV395:", "wearOrder&&paceDistinct&&noWarp"])
   if(!core.includes(token))issues.push('missing runtime '+token);
 if(!diag.includes('Phase 395 controlled S/M/H races Chromium QA failed')||!diag.includes('compoundRacesV395:compoundRaces395||null'))issues.push('missing browser test');
 if(!cum.includes('runPhase395F1TyreRaceAudit()')||!cum.includes('runPhase395FullIntegrationAudit()'))issues.push('missing cumulative audit');
 if(!core.includes("if(engineQaV240.active)return -(Math.max(0,Number(index)||0)*Math.min(.008,.08/Math.max(1,Number(count)||1)));"))issues.push('engine grid modified');
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
   const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
   if(check.status!==0)issues.push('syntax '+file+' '+String(check.stderr).slice(0,250));
 }
 const result={phase:395,name:'f1-controlled-compound-racing',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase395F1TyreRaceAudit();
