import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase250F1DriverProfileMarkerAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<250)issues.push('Phase 250 asset cache missing');

  const upgraded=racing.includes("const VERSION257='phase257-embedded-driver-profile-marker';");
  const runtimeTokens=upgraded?[
    "const VERSION250='phase250-driver-profile-marker';",
    'function driverProfileInitialsV250(',
    'function syncDriverProfileMarkerV250(',
    'function syncEmbeddedDriverMarkerV257(',
    "class:'car-profile-image-v257'",
    "class:'car-profile-initials-v257'",
    'function qaDriverProfileMarkersV250(){',
    'window.mwsF1QaDriverProfileMarkersV250=qaDriverProfileMarkersV250;',
    'window.__mwsF1RacingV250=VERSION250;'
  ]:[
    "const VERSION250='phase250-driver-profile-marker';",
    'function driverProfileInitialsV250(',
    'function syncDriverProfileMarkerV250(',
    "class:'car-profile-connector-v250'",
    "class:'car-profile-ring-v250'",
    "class:'car-profile-image-v250'",
    "class:'car-profile-initials-v250'",
    'function qaDriverProfileMarkersV250(){',
    'window.mwsF1QaDriverProfileMarkersV250=qaDriverProfileMarkersV250;',
    'window.__mwsF1RacingV250=VERSION250;'
  ];
  for(const token of runtimeTokens)if(!racing.includes(token))issues.push('Phase 250 runtime missing: '+token);

  const cssTokens=upgraded?[
    '/* Phase 257: driver portrait embedded directly inside live vehicle marker */',
    '.car-profile-image-v257',
    '.car-profile-initials-v257'
  ]:[
    '/* Phase 250: profile portrait tethered above each live vehicle marker */',
    '.car-profile-connector-v250',
    '.car-profile-ring-v250',
    '.car-profile-image-v250',
    '.car-profile-initials-v250'
  ];
  for(const token of cssTokens)if(!css.includes(token))issues.push('Phase 250 CSS compatibility missing: '+token);

  for(const token of ['mwsF1QaDriverProfileMarkersV250','Phase 250 driver profile marker QA failed'])
    if(!live.includes(token))issues.push('Phase 250 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:250,name:'f1-driver-profile-marker',upgradedToEmbeddedV257:upgraded,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase250F1DriverProfileMarkerAudit();
