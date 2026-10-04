import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase202F1ActiveAeroOvertakeAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!/assets\/f1-racing-v1\.js\?v=1\.0\.0-phase180-shell&p=(?:20[2-9]|[3-9]\d{2,})/.test(index))issues.push('Phase 202+ racing runtime asset link missing');
  for(const token of [
    "const VERSION202='phase202-active-aero-overtake';",
    'transitionMs:400',
    'detectionGapSeconds:1',
    'extraRechargeMJ:0.5',
    'overtakeFullPowerToKph:337',
    'overtakeCutoffKph:355',
    'function trackZoneAtProgressV202(progress){',
    "const requestedMode=zone?.type==='straight'?'STRAIGHT':'CORNER';",
    'function ersOvertakePowerLimitV202(speedKph){',
    '7100-20*speed',
    'function estimatedGapSecondsV202(vehicle){',
    'const eligible=Boolean(overtakeZone&&vehicle.carAheadId&&gapSeconds<=cfg.detectionGapSeconds);',
    'vehicle.overtakeActive=eligible;',
    'vehicle.overtakeRechargeAllowanceActive=true;',
    'const rechargeLimit=cfg.maxRechargePerLapMJ+(vehicle.overtakeRechargeAllowanceActive?ACTIVE_AERO_CONFIG_V202.extraRechargeMJ:0);',
    'const overtakeLimitKW=vehicle.overtakeActive?ersOvertakePowerLimitV202(vehicle.speedKph):normalLimitKW;',
    'updateActiveAeroAndOvertakeV202(vehicle,stepMs);',
    "row.dataset.activeAero=String(vehicle.activeAeroMode||'CORNER');",
    "row.dataset.overtakeActive=vehicle.overtakeActive?'1':'0';",
    'window.mwsF1GetActiveAeroOvertakeStatesV202=getActiveAeroOvertakeStatesV202;',
    'window.__mwsF1RacingV202=VERSION202;'
  ])if(!racing.includes(token))issues.push('Phase 202 active aero/overtake runtime missing: '+token);

  for(const token of ['node --check scripts/run-phase202-f1-active-aero-overtake-audit.mjs',"echo '[phase202] F1 active aero and overtake mode'"])if(!workflow.includes(token))issues.push('Phase 202 workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:202,name:'f1-active-aero-overtake',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase202F1ActiveAeroOvertakeAudit();
