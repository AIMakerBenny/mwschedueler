import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase254F1LiveMarkerPositionAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<254)issues.push('Phase 254 asset cache missing');

  for(const token of [
    "const VERSION254='phase254-live-marker-position-tag';",
    'function syncRaceMarkerPositionV254(',
    "class:'car-position-tag-v254'",
    "class:'car-position-box-v254'",
    "class:'car-position-text-v254'",
    'syncRaceMarkerPositionV254(marker,Number(vehicle.position)||Number(vehicle.driver?.gridPosition)||index+1);',
    'syncRaceMarkerPositionV254(vehicle.marker,standing.position)',
    'function qaRaceMarkerPositionV254(){',
    'window.mwsF1QaRaceMarkerPositionV254=qaRaceMarkerPositionV254;',
    'window.__mwsF1RacingV254=VERSION254;'
  ])if(!racing.includes(token))issues.push('Phase 254 runtime missing: '+token);

  for(const token of [
    '/* Phase 254: live position tag attached to each track vehicle marker */',
    '.car-position-tag-v254',
    '.car-position-box-v254',
    '.car-position-text-v254',
    '.leader-position-v254'
  ])if(!css.includes(token))issues.push('Phase 254 CSS missing: '+token);

  for(const token of [
    'mwsF1QaRaceMarkerPositionV254',
    'Phase 254 live marker position QA failed',
    'Phase 254 marker position tag geometry invalid'
  ])if(!live.includes(token))issues.push('Phase 254 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:254,name:'f1-live-marker-position-tag',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase254F1LiveMarkerPositionAudit();
