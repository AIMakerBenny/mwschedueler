import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase326F1GachaImageFallbackQaAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of ["const VERSION326='phase326-f1-gacha-image-fallback-qa';",'object-fit:contain;object-position:center center',"const gachaInitials326=gachaCard319?.querySelector('.gacha-card-initials')"])if(!(core.includes(token)||diag.includes(token)))issues.push('Phase 326 token missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase326-f1-gacha-image-fallback-qa-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:326,name:'f1-gacha-image-fallback-qa',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase326F1GachaImageFallbackQaAudit();
