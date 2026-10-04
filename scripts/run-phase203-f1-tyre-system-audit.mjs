import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase203F1TyreSystemAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!index.includes('assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=203'))issues.push('Phase 203 racing asset link missing');
  for(const token of [
    "const VERSION203='phase203-tyre-system';",
    "SOFT:Object.freeze({code:'S'",
    "MEDIUM:Object.freeze({code:'M'",
    "HARD:Object.freeze({code:'H'",
    'function setVehicleTyreCompoundV203(driverId,compound){',
    'function updateTyreSystemV203(vehicle,stepMs,phase){',
    "const managementNorm=driverSkillNormV200(vehicle,'tyreManagement');",
    'const dirtyHeat=clamp01V198(vehicle.dirtyAirTyreHeatLoad);',
    'vehicle.tyreThermalDeg=Math.max(0,Math.min(1,(Number(vehicle.tyreThermalDeg)||0)+thermalDegGain));',
    'vehicle.tyreGraining=Math.max(0,Math.min(1,(Number(vehicle.tyreGraining)||0)+grainingGain));',
    'vehicle.tyreFlatSpot=Math.max(0,Math.min(1,(Number(vehicle.tyreFlatSpot)||0)+flatSpotGain));',
    'vehicle.tyreGrip=Math.max(TYRE_CONFIG_V203.minGrip,Math.min(TYRE_CONFIG_V203.maxGrip,spec.gripBias*tempGrip*wearGrip*damageGrip));',
    "tyreCompound:'MEDIUM'",
    "const tyreCornerFactor=(phase==='TURN_IN'||phase==='APEX'||phase==='EXIT')?tyreGrip:1;",
    'let brakeBase=Math.max(1,Number(track?.geometry?.referenceBrakeDecelMps2)||20)*tyreGrip*incidentState.brakeFactor;',
    "const tractionGrip=phase==='EXIT'?tyreGrip:1;",
    'updateTyreSystemV203(vehicle,stepMs,phase);',
    "row.dataset.tyreWear=(Number(vehicle.tyreWear)||0).toFixed(3);",
    "if(tyre)tyre.textContent=tyreCompoundSpecV203(vehicle.tyreCompound).code;",
    'window.mwsF1GetTyreStatesV203=getTyreStatesV203;',
    'window.__mwsF1RacingV203=VERSION203;'
  ])if(!racing.includes(token))issues.push('Phase 203 tyre runtime missing: '+token);

  for(const token of ['node --check scripts/run-phase203-f1-tyre-system-audit.mjs',"echo '[phase203] F1 tyre system'"])if(!workflow.includes(token))issues.push('Phase 203 workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:203,name:'f1-tyre-system',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase203F1TyreSystemAudit();
