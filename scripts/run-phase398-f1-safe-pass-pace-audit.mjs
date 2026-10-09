import fs from 'node:fs';import {spawnSync} from 'node:child_process';
export function runPhase398F1SafePassPaceAudit(){
const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8'),issues=[],warnings=[];
for(const s of ['function liveSafePassPaceV398(', 'function qaLiveSafePassPaceV398(){','liveSafePassPaceV398(vehicle,aheadV398,phase)',
'window.mwsF1QaLiveSafePassPaceV398=qaLiveSafePassPaceV398;','maxTarget+=livePassPaceV398;'])
if(!core.includes(s))issues.push('missing runtime '+s);
if(!diag.includes('Phase 398 safe passing pace Chromium QA failed')||!diag.includes('passPaceV398:pace398||null'))issues.push('missing browser QA');
if(!cum.includes('runPhase398F1SafePassPaceAudit()')||!cum.includes('runPhase398FullIntegrationAudit()'))issues.push('missing cumulative audit');
for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
 const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status!==0)issues.push('syntax '+p+' '+String(r.stderr).slice(0,320));}
const result={phase:398,name:'f1-safe-pass-pace',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase398F1SafePassPaceAudit();
