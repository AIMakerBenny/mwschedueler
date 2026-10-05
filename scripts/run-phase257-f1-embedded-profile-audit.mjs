import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase257F1EmbeddedProfileAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<257)issues.push('Phase 257 asset cache missing');

  for(const token of [
    "const VERSION257='phase257-embedded-driver-profile-marker';",
    'function syncEmbeddedDriverMarkerV257(',
    "class:'car-profile-embedded-v257'",
    "class:'car-profile-image-v257'",
    "class:'car-profile-initials-v257'",
    "class:'car-number-badge-v257'",
    "marker.querySelector('.car-profile-v250')?.remove();",
    'function qaEmbeddedDriverProfilesV257(){',
    'window.mwsF1QaEmbeddedDriverProfilesV257=qaEmbeddedDriverProfilesV257;',
    'window.__mwsF1RacingV257=VERSION257;'
  ])if(!racing.includes(token))issues.push('Phase 257 runtime missing: '+token);

  if(racing.includes("class:'car-profile-connector-v250'"))issues.push('Legacy Phase 250 profile connector is still created at runtime');
  if(racing.includes("class:'car-profile-ring-v250'"))issues.push('Legacy detached profile ring is still created at runtime');

  for(const token of [
    '/* Phase 257: driver portrait embedded directly inside live vehicle marker */',
    '.car-profile-embedded-v257',
    '.car-profile-image-v257',
    '.car-profile-initials-v257',
    '.car-number-badge-v257'
  ])if(!css.includes(token))issues.push('Phase 257 CSS missing: '+token);

  for(const token of [
    'mwsF1QaEmbeddedDriverProfilesV257',
    'Phase 257 embedded driver profile QA failed',
    'Phase 257 embedded driver profile geometry invalid'
  ])if(!live.includes(token))issues.push('Phase 257 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:257,name:'f1-embedded-driver-profile-marker',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase257F1EmbeddedProfileAudit();
