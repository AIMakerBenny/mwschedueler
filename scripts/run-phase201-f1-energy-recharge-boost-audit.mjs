import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase201F1EnergyRechargeBoostAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!index.includes('assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=201'))issues.push('Phase 201 racing asset link missing');
  for(const token of [
    "const VERSION201='phase201-energy-recharge-boost';",
    'usableCapacityMJ:4',
    'maxRechargePerLapMJ:7',
    'maxHarvestPowerKW:350',
    'maxDeployPowerKW:350',
    'maxBoostDeltaKW:150',
    'minStandingDeployKph:50',
    'function ersNormalPowerLimitV201(speedKph){',
    'if(speed<290)return cfg.maxDeployPowerKW;',
    'if(speed<340)return Math.max(0,Math.min(cfg.maxDeployPowerKW,1800-5*speed));',
    'if(speed<345)return Math.max(0,Math.min(cfg.maxDeployPowerKW,6900-20*speed));',
    'function trailingThreatScoreV201(vehicle,vehicles=raceMotionV189.vehicles){',
    'function updateEnergySystemV201(vehicle,stepMs,phase,throttle,brake){',
    'const lapRoom=Math.max(0,cfg.maxRechargePerLapMJ-(Number(vehicle.energyHarvestLapMJ)||0));',
    'const boostOpportunityScore=Math.max(attackOpportunityScore,defenceThreatScore);',
    'boostKW=(Number(throttle)>0&&normalLimitKW>0)',
    'const deployKW=Math.max(0,Math.min(requestedDeployKW,availableDeployKW));',
    'vehicle.energyHarvestLapMJ=(Number(vehicle.energyHarvestLapMJ)||0)+harvestedMJ;',
    'vehicle.boostActive=boostKW>0.01;',
    'batteryMJ:ENERGY_CONFIG_V201.usableCapacityMJ',
    'const propulsionThrottle=accelMps2>0?throttle:0;',
    'const energyState=updateEnergySystemV201(vehicle,stepMs,phase,propulsionThrottle,brake);',
    'if(accelMps2>0)accelMps2*=energyState.powerUnitFactor;',
    "row.dataset.energyMJ=(Number(vehicle.batteryMJ)||0).toFixed(3);",
    "row.dataset.boost=vehicle.boostActive?'1':'0';",
    'window.mwsF1GetEnergyStatesV201=getEnergyStatesV201;',
    'window.__mwsF1RacingV201=VERSION201;'
  ])if(!racing.includes(token))issues.push('Phase 201 energy runtime missing: '+token);

  if(/setInterval\s*\(/.test(racing))issues.push('Phase 201 introduced or retained per-runtime setInterval in F1 simulation');
  for(const token of ['node --check scripts/run-phase201-f1-energy-recharge-boost-audit.mjs',"echo '[phase201] F1 energy recharge boost'"])if(!workflow.includes(token))issues.push('Phase 201 workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:201,name:'f1-energy-recharge-boost',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase201F1EnergyRechargeBoostAudit();
