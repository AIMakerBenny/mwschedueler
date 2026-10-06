import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase333F1GachaResponsiveViewportAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-r330-r333.css','utf8'),index=fs.readFileSync('index.html','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION333='phase333-f1-gacha-responsive-viewport';",
  'const GRID_GACHA_VIEWPORT_CONFIG_V333=Object.freeze({',
  'function gridGachaViewportMetricsV333(',
  'function syncGridGachaViewportV333(){',
  "window.addEventListener('resize',scheduleGridGachaViewportV333",
  "gridGachaResizeObserverV333=new ResizeObserver(scheduleGridGachaViewportV333)",
  "list.style.setProperty('--f1-grid-stage-h-v333'",
  'function qaGridGachaViewportV333(){',
  'window.mwsF1QaGridGachaViewportV333=qaGridGachaViewportV333;',
  'window.__mwsF1RacingV333=VERSION333;'
 ])if(!core.includes(token))issues.push('Phase 333 core missing: '+token);
 for(const token of ['--f1-grid-stage-h-v333','--f1-grid-card-w-v333','--f1-grid-card-h-v333','max-height:calc(100dvh - 24px)!important'])if(!css.includes(token))issues.push('Phase 333 CSS missing: '+token);
 for(const token of ['assets/f1-racing-r330-r333.css?phase=333','phase324=1&phase333=1'])if(!index.includes(token))issues.push('Phase 333 cache/link missing: '+token);
 for(const token of ['Phase 333 runtime did not propagate to Recovery H browser','Phase 333 responsive Gacha viewport QA failed','Phase 333 Gacha stage did not fit current viewport'])if(!diag.includes(token))issues.push('Phase 333 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase333-f1-gacha-responsive-viewport-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:333,name:'f1-gacha-responsive-viewport',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase333F1GachaResponsiveViewportAudit();
