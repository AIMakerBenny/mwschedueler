import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase342F1SpectatorAspectFitAudit(){
 const issues=[],warnings=[];
 const fit=fs.readFileSync('assets/f1-racing-r288-r290.js','utf8');
 const css=fs.readFileSync('assets/f1-racing-r342.css','utf8');
 const index=fs.readFileSync('index.html','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION342='phase342-f1-spectator-aspect-fit';",
  'const SPECTATOR_ASPECT_CONFIG_V342=Object.freeze({maxAspect:2.55',
  'function computeSpectatorViewportFitV342(',
  'function applySpectatorViewportFitV342(){',
  "race.style.setProperty('--f1-race-fit-width-v342'",
  'function qaSpectatorAspectFitV342(){',
  'window.mwsF1QaSpectatorAspectFitV342=qaSpectatorAspectFitV342;',
  'window.__mwsF1RacingV342=VERSION342;'
 ])if(!fit.includes(token))issues.push('Phase 342 fit runtime missing: '+token);
 for(const token of [
  '/* Phase 342: keep the live race console from stretching into an ultra-wide letterbox */',
  'width:min(100%,var(--f1-race-fit-width-v342,100%))!important',
  'max-width:var(--f1-race-fit-width-v342,100%)!important',
  'margin-inline:auto!important',
  'overflow:hidden!important'
 ])if(!css.includes(token))issues.push('Phase 342 CSS missing: '+token);
 for(const token of ['assets/f1-racing-r342.css?phase=342','fill=340&aspect=342'])if(!index.includes(token))issues.push('Phase 342 asset/cache link missing: '+token);
 for(const token of ['Phase 342 runtime did not propagate to Recovery H browser','Phase 342 spectator aspect-fit QA failed','Phase 342 race console overflows viewport width','Phase 342 page has horizontal overflow'])if(!diag.includes(token))issues.push('Phase 342 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-r288-r290.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase342-f1-spectator-aspect-fit-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:342,name:'f1-spectator-aspect-fit',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase342F1SpectatorAspectFitAudit();
