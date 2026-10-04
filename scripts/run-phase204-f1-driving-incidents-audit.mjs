import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase204F1DrivingIncidentAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  if(!index.includes('recovery=K1&phase=204'))issues.push('Phase 204 asset cache missing');
  for(const token of [
    "const VERSION204='phase204-driving-incidents';",
    'const INCIDENT_CONFIG_V204=Object.freeze({',
    'function triggerDrivingIncidentV204(vehicle,type,severity=.7,forced=false){',
    'function updateDrivingIncidentsV204(vehicle,stepMs,phase,controls={}){',
    "vehicle.tyreFlatSpot=Math.max(0,Math.min(1,(Number(vehicle.tyreFlatSpot)||0)+.012+s*.028));",
    "const underRisk=(phase==='TURN_IN'||phase==='APEX')",
    "const overRisk=(phase==='EXIT'||phase==='TURN_IN')",
    'maxTarget*=incidentState.speedFactor;',
    '*tyreGrip*incidentState.brakeFactor;',
    '*incidentState.throttleFactor;',
    "marker.dataset.incident=activeDrivingIncidentV204(vehicle)||'';",
    'window.mwsF1GetDrivingIncidentStatesV204=getDrivingIncidentStatesV204;',
    'window.mwsF1ForceDrivingIncidentV204=forceDrivingIncidentV204;',
    'window.__mwsF1RacingV204=VERSION204;'
  ])if(!racing.includes(token))issues.push('Phase 204 runtime missing: '+token);
  for(const token of ['/* Phase 204: driving incident marker feedback */','[data-incident="LOCK_UP"]'])if(!css.includes(token))issues.push('Phase 204 CSS missing: '+token);
  for(const token of ["mwsF1ForceDrivingIncidentV204?.(incidentDriver,'LOCK_UP',.9)",'Phase 204 lock-up did not add flat spot',"incidentMarker?.dataset.incident==='LOCK_UP'"])if(!diag.includes(token))issues.push('Phase 204 live QA missing: '+token);
  for(const token of ['node --check scripts/run-phase204-f1-driving-incidents-audit.mjs',"echo '[phase204] F1 driving incidents'"])if(!workflow.includes(token))issues.push('Phase 204 workflow missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:204,name:'f1-driving-incidents',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase204F1DrivingIncidentAudit();
