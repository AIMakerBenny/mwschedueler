import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase388F1TyreThermalAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
  diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
  cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const k of ["const TYRE_THERMAL_BALANCE_V388=Object.freeze(","surface+=heatInput*dt*TYRE_THERMAL_BALANCE_V388.heatGainPerSecond;",
  "function qaTyreThermalBalanceV388(){","window.mwsF1QaTyreThermalBalanceV388=qaTyreThermalBalanceV388;","const safeTyre=pitRemainingGuardV349(context);"])
  if(!core.includes(k))issues.push('missing runtime '+k);
 for(const k of ["Phase 388 compound thermal Chromium QA failed","Phase 388 ten-lap early thermal saturation","tyreBalanceV388:tyreBalance388||null"])
  if(!diag.includes(k))issues.push('missing live check '+k);
 if(!cum.includes('runPhase388FullIntegrationAudit()')||!cum.includes('runPhase388F1TyreThermalAudit()'))issues.push('missing cumulative audit');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
  const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
  if(r.status!==0)issues.push('syntax '+p+': '+String(r.stderr).slice(0,350));
 }
 const res={phase:388,name:'tyre-thermal-rebalance',issues,warnings,pass:!issues.length};
 console.log(JSON.stringify(res));if(issues.length)process.exitCode=1;return res;
}
if(import.meta.url==='file://'+process.argv[1])runPhase388F1TyreThermalAudit();