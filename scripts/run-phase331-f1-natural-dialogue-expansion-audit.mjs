import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase331F1NaturalDialogueExpansionAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION331='phase331-f1-natural-dialogue-expansion';",
  'const DIALOGUE_NATURAL_LINES_V331=Object.freeze({',
  "const natural=DIALOGUE_NATURAL_LINES_V331[key]||[];",
  'const DIALOGUE_RECENT_TEXT_LIMIT_V279=160;',
  'function qaNaturalDialogueV331(){',
  "const banned=['자리 지킨다','자리 막는다','바로 막는다','계속 막는다','여긴 내 자리다'];",
  'window.mwsF1QaNaturalDialogueV331=qaNaturalDialogueV331;',
  'window.__mwsF1RacingV331=VERSION331;'
 ])if(!core.includes(token))issues.push('Phase 331 core missing: '+token);
 for(const token of ['Phase 331 runtime did not propagate to Recovery H browser','Phase 331 natural dialogue QA failed','Phase 331 dialogue variety/naturalness regression'])if(!diag.includes(token))issues.push('Phase 331 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase331-f1-natural-dialogue-expansion-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:331,name:'f1-natural-dialogue-expansion',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase331F1NaturalDialogueExpansionAudit();
