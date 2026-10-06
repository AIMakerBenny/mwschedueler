import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase339F1LivePresenceAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-r335-r341.css','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 if(!core.includes("const VERSION339='phase339-f1-live-presence-glow';")||!core.includes('window.__mwsF1RacingV339=VERSION339;'))issues.push('Phase 339 runtime marker missing');
 for(const token of [
  '/* Phase 339: stronger LIVE broadcast presence */',
  'border:1px solid color-mix',
  '0 0 44px color-mix',
  'f1LiveGlowV339',
  'f1LiveSweepV339',
  '.f1-racing-live-cutin-v264::before',
  '.f1-racing-live-cutin-v264::after'
 ])if(!css.includes(token))issues.push('Phase 339 CSS missing: '+token);
 for(const token of ['Phase 339 runtime did not propagate to Recovery H browser','Phase 339 LIVE visual presence effect missing'])if(!diag.includes(token))issues.push('Phase 339 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase339-f1-live-presence-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:339,name:'f1-live-presence',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase339F1LivePresenceAudit();
