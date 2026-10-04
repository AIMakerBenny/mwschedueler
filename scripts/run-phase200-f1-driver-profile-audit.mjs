import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase200F1DriverProfileAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!index.includes('assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=200'))issues.push('Phase 200 racing asset link missing');
  for(const token of [
    "const VERSION200='phase200-driver-pace-consistency-racecraft';",
    "const DRIVER_PROFILE_KEYS_V200=Object.freeze(['pace','braking','cornering','racecraft','consistency','tyreManagement','start','aggression','errorResistance']);",
    'function createDriverProfileV200(driver,snapshot){',
    "String(snapshot?.createdAt||'race')+'|phase200'",
    'function updateDriverPaceStateV200(vehicle,stepMs){',
    'vehicle.paceNoise=(Number(vehicle.paceNoise)||0)*Math.max(0,1-reversion*dt);',
    'const volatility=DRIVER_PACE_CONFIG_V200.noiseBase+(1-consistency)*DRIVER_PACE_CONFIG_V200.noiseRange;',
    'function driverTargetMultiplierV200(vehicle,phase){',
    "driverSkillNormV200(vehicle,'pace')*cfg.paceRange",
    "if(phase==='BRAKING')multiplier*=1+driverSkillNormV200(vehicle,'braking')*cfg.brakingRange;",
    "if(phase==='TURN_IN'||phase==='APEX'||phase==='EXIT')multiplier*=1+driverSkillNormV200(vehicle,'cornering')*cfg.corneringRange;",
    'const driverProfile=createDriverProfileV200(driver,snapshot);',
    'driverProfile,driverRandomState:raceSeed||1,paceNoise:0,nextPaceNoiseMs:0,driverPaceMultiplier:1',
    'updateDriverPaceStateV200(vehicle,stepMs);',
    "const racecraftNorm=driverSkillNormV200(vehicle,'racecraft');",
    "const aggressionNorm=driverSkillNormV200(vehicle,'aggression');",
    'const maxTarget=baseTarget*driverPaceMultiplier*aeroGripMultiplier+towStrength*SLIPSTREAM_CONFIG_V198.maxTargetBonusKph;',
    "row.dataset.driverConsistency=String(vehicle.driverProfile?.consistency||'');",
    'window.mwsF1GetDriverProfilesV200=getDriverProfilesV200;',
    'window.__mwsF1RacingV200=VERSION200;'
  ])if(!racing.includes(token))issues.push('Phase 200 driver runtime missing: '+token);

  for(const token of ['node --check scripts/run-phase200-f1-driver-profile-audit.mjs',"echo '[phase200] F1 driver pace consistency racecraft'"])if(!workflow.includes(token))issues.push('Phase 200 workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:200,name:'f1-driver-pace-consistency-racecraft',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase200F1DriverProfileAudit();
