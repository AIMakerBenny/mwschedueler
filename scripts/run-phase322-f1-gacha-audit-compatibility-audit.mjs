import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase322F1GachaAuditCompatibilityAudit(){
 const issues=[],warnings=[];
 const p319=fs.readFileSync('scripts/run-phase319-f1-ui-spacing-battle-audit.mjs','utf8');
 const p321=fs.readFileSync('scripts/run-phase321-f1-gacha-containment-audit.mjs','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of ["gachaOverflowCheck=diag.includes","gachaContainCheck=diag.includes"])if(!p319.includes(token))issues.push('Phase 322 future-safe Phase319 Gacha audit missing: '+token);
 if(p321.includes("['assets/app-core.js','scripts/diagnose-recovery-h-f1-live.mjs'"))issues.push('Phase 322 app-core Node syntax gate still present');
 for(const token of ['Phase 321 Gacha card overflows reveal viewport','Phase 321 F1 grid did not reuse the real Gacha card renderer'])if(!diag.includes(token))issues.push('Phase 322 live Gacha contract missing: '+token);
 for(const file of ['scripts/run-phase319-f1-ui-spacing-battle-audit.mjs','scripts/run-phase321-f1-gacha-containment-audit.mjs','scripts/run-phase322-f1-gacha-audit-compatibility-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:322,name:'f1-gacha-audit-compatibility',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase322F1GachaAuditCompatibilityAudit();
