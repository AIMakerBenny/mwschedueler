import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase338F1BestLapOverlayAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-r335-r341.css','utf8'),index=fs.readFileSync('index.html','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION338='phase338-f1-best-lap-overlay';",
  'const bestLapOverlayStateV338=',
  'function ensureBestLapOverlayV338(){',
  "root.id='f1RacingBestLapOverlayV338'",
  'function syncBestLapOverlayV338(',
  'function resetBestLapOverlayV338(){',
  'function qaBestLapOverlayV338(){',
  'syncBestLapOverlayV338(state);',
  'window.mwsF1QaBestLapOverlayV338=qaBestLapOverlayV338;',
  'window.mwsF1SyncBestLapOverlayV338=syncBestLapOverlayV338;',
  'window.__mwsF1RacingV338=VERSION338;'
 ])if(!core.includes(token))issues.push('Phase 338 core missing: '+token);
 for(const token of ['#f1RacingBestLapOverlayV338.f1-racing-best-lap-v338','top:16px','right:16px','.is-new-v338','f1BestLapPopV338','f1BestLapAuraV338','f1BestLapNewV338'])if(!css.includes(token))issues.push('Phase 338 CSS missing: '+token);
 if(!index.includes('assets/f1-racing-r335-r341.css?phase=341')||!index.includes('phase333=1&phase338=1'))issues.push('Phase 338 asset/cache link missing');
 for(const token of ['Phase 338 runtime did not propagate to Recovery H browser','Phase 338 BEST LAP overlay QA failed'])if(!diag.includes(token))issues.push('Phase 338 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase338-f1-best-lap-overlay-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:338,name:'f1-best-lap-overlay',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase338F1BestLapOverlayAudit();
