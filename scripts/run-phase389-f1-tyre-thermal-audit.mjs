import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase389F1TyreThermalAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const x of ['function tyreCoolingRateV389(', 'tyreCoolingRateV389(speedKph)', "function qaTyreThermalAndTractionV389()","window.mwsF1QaTyreThermalAndTractionV389=qaTyreThermalAndTractionV389","tyreGrip,vehicle.tyreCompound"])if(!core.includes(x))issues.push('missing core '+x);
 if(!diag.includes('Phase 389 tyre thermal and traction Chromium QA failed')||!diag.includes('tyreThermalV389:tyreThermal389||null'))issues.push('missing Chromium QA');
 if(!cum.includes('runPhase389FullIntegrationAudit()')||!cum.includes('runPhase389F1TyreThermalAudit()'))issues.push('missing cumulative integration');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
  const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
  if(r.status!==0)issues.push('syntax '+p+' '+String(r.stderr).slice(0,400));
 }
 const result={phase:389,name:'f1-tyre-thermal-balance-and-traction',issues,warnings,pass:!issues.length};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase389F1TyreThermalAudit();
