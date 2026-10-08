import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase391F1TacticalPitAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const t of ['function tacticalPitValueV391(', 'function qaTacticalPitValueV391()', 'window.mwsF1QaTacticalPitValueV391=qaTacticalPitValueV391', 'UNDERCUT_PIT_VALUE_INSUFFICIENT_V391', 'COVER_PIT_VALUE_INSUFFICIENT_V391', 'tacticalPitValueApprovedV391:'])if(!core.includes(t))issues.push('missing runtime '+t);
 if(!diag.includes('Phase 391 tactical pit economics Chromium QA failed')||!diag.includes('tacticalPitV391:tacticalPit391||null'))issues.push('missing browser QA');
 if(!cum.includes('runPhase391F1TacticalPitAudit()')||!cum.includes('runPhase391FullIntegrationAudit()'))issues.push('missing cumulative audit');
 if(!core.includes("const shouldPit=(decision==='BOX_NOW'||decision==='UNDERCUT'||decision==='COVER_UNDERCUT')&&(wearReady||criticalTyre)&&!safeTyre;"))issues.push('40 percent guard altered');
 for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
  const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(r.status!==0)issues.push('syntax '+path+' '+String(r.stderr).slice(0,400));
 }
 const result={phase:391,name:'f1-tactical-pit-economics',issues,warnings,pass:!issues.length};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase391F1TacticalPitAudit();
