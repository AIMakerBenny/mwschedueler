import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase199F1DirtyAirAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!/assets\/f1-racing-v1\.js\?v=1\.0\.0-phase180-shell&p=(?:199|[2-9]\d{2,})/.test(index))issues.push('Phase 199+ racing runtime asset link missing');
  for(const token of [
    "const VERSION199='phase199-dirty-air';",
    'const DIRTY_AIR_CONFIG_V199=Object.freeze({',
    'function resolveDirtyAirV199(vehicle,vehicles=raceMotionV189.vehicles){',
    "const phaseWeight=phase==='BRAKING'?.35:phase==='TURN_IN'?.8:phase==='APEX'?1:phase==='EXIT'?.65:phase==='APPROACH'?.12:0;",
    'const strength=clamp01V198(gapEffect*alignmentEffect*lateralEffect*phaseWeight*Math.max(.25,curvatureEffect));',
    'vehicle.aeroGripMultiplier=aeroGripMultiplier;',
    'vehicle.understeerRisk=understeerRisk;',
    'vehicle.slideRisk=slideRisk;',
    'vehicle.dirtyAirTyreHeatLoad=tyreHeatLoad;',
    'function updateDirtyAirStatesV199(){',
    'updateDirtyAirStatesV199();',
    'const aeroGripMultiplier=Math.max(.85,Math.min(1,Number(vehicle.aeroGripMultiplier)||1));',
    'const maxTarget=baseTarget*aeroGripMultiplier+towStrength*SLIPSTREAM_CONFIG_V198.maxTargetBonusKph;',
    "row.dataset.dirtyAir=(Number(vehicle.dirtyAirStrength)||0).toFixed(3);",
    'window.mwsF1ResolveDirtyAirV199=resolveDirtyAirV199;',
    'window.__mwsF1RacingV199=VERSION199;'
  ])if(!racing.includes(token))issues.push('Phase 199 dirty air runtime missing: '+token);

  for(const token of ['node --check scripts/run-phase199-f1-dirty-air-audit.mjs',"echo '[phase199] F1 dirty air corner grip'"])if(!workflow.includes(token))issues.push('Phase 199 workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:199,name:'f1-dirty-air-corner-grip',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase199F1DirtyAirAudit();
