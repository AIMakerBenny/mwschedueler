import fs from 'node:fs';import {spawnSync} from 'node:child_process';
export function runPhase400F1FinishedMarkerAudit(){
 const index=fs.readFileSync('index.html','utf8');
 if(!index.includes('&finishedmarker400=1'))issues.push('Phase 400 asset cache version not updated');
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
   diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
   cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8'),issues=[],warnings=[];
 for(const token of ["if(vehicle.finished){marker.setAttribute('visibility','hidden')","function qaFinishedMarkersV400(){",
 'window.mwsF1QaFinishedMarkersV400=qaFinishedMarkersV400','marker.removeAttribute(\'visibility\')'])
   if(!core.includes(token))issues.push('missing runtime '+token);
 if(!diag.includes('Phase 400 finished car visible marker Chromium QA failed')||!diag.includes('finishedMarkersV400:window.__mwsF1FinishedMarkerQaV400||null'))
   issues.push('missing Chromium QA');
 if(!cum.includes('runPhase400F1FinishedMarkerAudit()')||!cum.includes('runPhase400FullIntegrationAudit()'))issues.push('missing cumulative');
 for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
   const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(r.status!==0)issues.push('syntax '+path+' '+String(r.stderr).slice(0,250));
 }
 const result={phase:400,name:'f1-finished-marker-retirement',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase400F1FinishedMarkerAudit();
