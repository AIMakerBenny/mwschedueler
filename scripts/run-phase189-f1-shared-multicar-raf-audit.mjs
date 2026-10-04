import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase189F1SharedMultiCarRafAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of ['assets/f1-racing-v1.css?v=1.0.0-phase180-shell&p=','assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=','id="f1RacingRaceVehicleLayerV188"'])if(!index.includes(token))issues.push('Phase 189 HTML missing: '+token);
  for(const token of [
    "const VERSION189='phase189-shared-multicar-raf';",
    'const raceMotionV189={',
    'function createRaceVehiclesV189(snapshot){',
    'function ensureRaceVehicleMarkerV189(vehicle,index){',
    'function renderRaceVehiclesV189(){',
    'function initializeRaceMotionV189(snapshot=activeRaceSnapshotV187){',
    'function raceFrameV189(timestamp){',
    'for(const vehicle of raceMotionV189.vehicles)',
    'raceMotionV189.rafId=requestAnimationFrame(raceFrameV189);',
    'function startRaceMotionV189(){',
    'function pauseRaceMotionV189(suspended=false){',
    'window.mwsF1StartRaceMotionV189=startRaceMotionV189;',
    'window.__mwsF1RacingV189=VERSION189;'
  ])if(!js.includes(token))issues.push('Phase 189 shared motion runtime missing: '+token);

  if(js.includes('setInterval(raceFrameV189')||js.includes('setTimeout(raceFrameV189'))issues.push('Race motion must not use interval or timeout');
  if(!js.includes('const delta=Math.min(50,Math.max(0,timestamp-raceMotionV189.lastTimestamp));'))issues.push('Race frame delta clamp missing');
  if(!js.includes("if(raceMotionV189.running)pauseRaceMotionV189(true);"))issues.push('Background suspension guard missing');
  for(const token of ['.f1-racing-race-vehicle-v189{','.f1-racing-race-vehicle-v189 .car-label{'])if(!css.includes(token))issues.push('Phase 189 CSS missing: '+token);
  for(const token of ['node --check scripts/run-phase189-f1-shared-multicar-raf-audit.mjs',"echo '[phase189] F1 shared multi-car requestAnimationFrame loop'"])if(!workflow.includes(token))issues.push('Phase 189 workflow verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:189,name:'f1-shared-multicar-raf',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase189F1SharedMultiCarRafAudit();
