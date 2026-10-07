import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

function bodyBetween(source,startToken,endToken){
  const start=source.indexOf(startToken);
  if(start<0)return '';
  const end=source.indexOf(endToken,start+startToken.length);
  return source.slice(start,end>start?end:source.length);
}

export function runPhase369F1PitInteractionIsolationAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "const VERSION369='phase369-f1-pit-interaction-isolation';",
    'function trackInteractionEligibleV369(',
    "String(vehicle.pitState||'TRACK')==='TRACK'",
    'function trackInteractionVehiclesV369(',
    'snapshot.trackInteractionOrder',
    'function clearAeroWakeV369(',
    'function clearPitInteractionStateV369(',
    "vehicle.pitPreviousRacingLineMode='IDEAL';",
    'function qaPitInteractionIsolationV369(){',
    'window.mwsF1TrackInteractionEligibleV369=trackInteractionEligibleV369;',
    'window.mwsF1ClearPitInteractionStateV369=clearPitInteractionStateV369;',
    'window.mwsF1QaPitInteractionIsolationV369=qaPitInteractionIsolationV369;',
    'window.__mwsF1RacingV369=VERSION369;'
  ])if(!core.includes(token))issues.push('Phase 369 core missing: '+token);

  const slip=bodyBetween(core,'function resolveSlipstreamV198(','function updateSlipstreamStatesV198(');
  const dirty=bodyBetween(core,'function resolveDirtyAirV199(','function updateDirtyAirStatesV199(');
  const traffic=bodyBetween(core,'function updateTrafficAndDefenceV207(','function getTrafficStatesV207(');
  const pit=bodyBetween(core,'function updatePitPostStepV205(','function getPitStatesV205(');
  const links=bodyBetween(core,'function syncBattleLinksV256(','function qaBattleLinksV256(');
  const cleanup=bodyBetween(core,'function clearPitInteractionStateV369(','function qaPitInteractionIsolationV369(');

  if(!slip.includes('trackInteractionEligibleV369(vehicle)')||!slip.includes('trackInteractionEligibleV369(candidate)'))issues.push('Phase 369 slipstream pit/finished eligibility guard missing');
  if(!dirty.includes('trackInteractionEligibleV369(vehicle)')||!dirty.includes('trackInteractionEligibleV369(ahead)'))issues.push('Phase 369 dirty-air pit/finished eligibility guard missing');
  if(!traffic.includes('trackInteractionVehiclesV369(raceMotionV189.vehicles,track)')||traffic.includes('standings[index-1].vehicle'))issues.push('Phase 369 traffic still depends on official adjacent standings');
  if(!pit.includes("clearPitInteractionStateV369(vehicle,raceMotionV189.vehicles,'PIT_ENTRY')"))issues.push('Phase 369 PIT_ENTRY immediate cleanup missing');
  if(!links.includes('trackInteractionEligibleV369(attacker)')||!links.includes('trackInteractionEligibleV369(target)'))issues.push('Phase 369 battle-link pit/finished guard missing');
  for(const token of ['battleTargetId','trafficCarAheadId','carAheadId','trafficThreatFromId','chaseBurstTargetIdV275','clearBattleLinksForVehicleV369'])if(!cleanup.includes(token))issues.push('Phase 369 cleanup missing dependency: '+token);

  for(const token of [
    'Phase 369 runtime did not propagate to Recovery H browser',
    'Phase 369 pit interaction isolation QA failed',
    'pitInteractionV369:pitInteraction369||null'
  ])if(!diag.includes(token))issues.push('Phase 369 Recovery H missing: '+token);

  for(const token of [
    'node --check scripts/run-phase369-f1-pit-interaction-isolation-audit.mjs',
    "[phase369] F1 pit interaction isolation",
    'window.__mwsF1RacingV369=VERSION369;'
  ])if(!workflow.includes(token))issues.push('Phase 369 workflow missing: '+token);

  for(const file of [
    'assets/f1-racing-v1.js',
    'scripts/diagnose-recovery-h-f1-live.mjs',
    'scripts/run-phase367-f1-interaction-dependency-audit.mjs',
    'scripts/run-phase369-f1-pit-interaction-isolation-audit.mjs'
  ]){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }

  const result={phase:369,name:'f1-pit-interaction-isolation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase369F1PitInteractionIsolationAudit();
