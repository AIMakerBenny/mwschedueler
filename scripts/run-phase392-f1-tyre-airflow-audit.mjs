import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase392F1TyreAirflowAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
   diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
   cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const t of ['function tyreSurfaceCoolingV392(', 'tyreSurfaceCoolingV392(speedKph);',
   'function qaTyreCoolingV392(){', 'window.mwsF1QaTyreCoolingV392=qaTyreCoolingV392;',
   'surfaceTemp:Number(vehicle.tyreSurfaceTemp)||0'])if(!core.includes(t))issues.push('missing runtime '+t);
 if(!diag.includes('Phase 392 tyre airflow cooling Chromium QA failed')||!diag.includes('tyreCoolingV392:tyreCooling392||null'))issues.push('missing browser QA');
 if(!cum.includes('runPhase392F1TyreAirflowAudit()')||!cum.includes('runPhase392FullIntegrationAudit()'))issues.push('missing cumulative integration');
 for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
   const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(r.status!==0)issues.push('syntax '+path+' '+String(r.stderr).slice(0,300));
 }
 const result={phase:392,name:'f1-airflow-thermal-recovery',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase392F1TyreAirflowAudit();
