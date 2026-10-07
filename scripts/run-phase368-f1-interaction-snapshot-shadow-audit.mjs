import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

function bodyBetween(source,startToken,endToken){
  const start=source.indexOf(startToken);
  if(start<0)return '';
  const end=source.indexOf(endToken,start+startToken.length);
  return source.slice(start,end>start?end:source.length);
}

export function runPhase368F1InteractionSnapshotShadowAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "const VERSION368='phase368-f1-interaction-snapshot-shadow';",
    'const interactionSnapshotStateV368={snapshot:null,builds:0,lastSimTimeMs:0};',
    'function interactionVehicleSnapshotV368(',
    'function interactionRowSortV368(',
    'function buildInteractionSnapshotV368(',
    "row.pitState==='TRACK'",
    'trackInteractionOrder',
    'excludedFromTrackOrder',
    'function updateInteractionSnapshotShadowV368(){',
    'function resetInteractionSnapshotV368(){',
    'function qaInteractionSnapshotV368(){',
    'shadowOnlyNoVehicleMutation',
    'updateInteractionSnapshotShadowV368();\n  updateSlipstreamStatesV198();',
    'window.mwsF1GetInteractionSnapshotV368=getInteractionSnapshotV368;',
    'window.mwsF1QaInteractionSnapshotV368=qaInteractionSnapshotV368;',
    'window.__mwsF1RacingV368=VERSION368;'
  ])if(!core.includes(token))issues.push('Phase 368 core missing: '+token);

  const snapshotBody=bodyBetween(core,'function buildInteractionSnapshotV368(','function updateInteractionSnapshotShadowV368(');
  if(/\bvehicle\.[A-Za-z0-9_]+\s*=/.test(snapshotBody))issues.push('Phase 368 snapshot builder mutates live vehicle objects');
  if(!snapshotBody.includes("!row.finished&&row.pitState==='TRACK'"))issues.push('Phase 368 track order does not exclude pit and finished vehicles');
  if(!snapshotBody.includes('officialOrder')||!snapshotBody.includes('trackInteractionOrder'))issues.push('Phase 368 does not preserve separate official and track interaction orders');

  const trafficBody=bodyBetween(core,'function updateTrafficAndDefenceV207(','function getTrafficStatesV207(');
  const slipstreamBody=bodyBetween(core,'function resolveSlipstreamV198(','function updateSlipstreamStatesV198(');
  const dirtyAirBody=bodyBetween(core,'function resolveDirtyAirV199(','function updateDirtyAirStatesV199(');
  const passBody=bodyBetween(core,'function updatePassStateMachineV208(','function getPassStatesV208(');
  const shadowOnly=!trafficBody.includes('V368')&&!slipstreamBody.includes('V368')&&!dirtyAirBody.includes('V368')&&!passBody.includes('V368');
  if(!shadowOnly)issues.push('Phase 368 shadow layer is already influencing live interaction consumers');

  const stepBody=bodyBetween(core,'function simulateRaceStepV192(','function raceFrameV189(');
  const snapshotIndex=stepBody.indexOf('updateInteractionSnapshotShadowV368();');
  const slipIndex=stepBody.indexOf('updateSlipstreamStatesV198();');
  if(snapshotIndex<0||slipIndex<0||snapshotIndex>slipIndex)issues.push('Phase 368 snapshot is not captured before live interaction updates');

  for(const token of [
    'Phase 368 runtime did not propagate to Recovery H browser',
    'Phase 368 interaction snapshot shadow QA failed',
    'interactionSnapshotV368:interactionSnapshot368||null'
  ])if(!diag.includes(token))issues.push('Phase 368 Recovery H missing: '+token);

  for(const token of [
    'node --check scripts/run-phase368-f1-interaction-snapshot-shadow-audit.mjs',
    "[phase368] F1 interaction snapshot shadow",
    'window.__mwsF1RacingV368=VERSION368;'
  ])if(!workflow.includes(token))issues.push('Phase 368 workflow missing: '+token);

  for(const file of [
    'assets/f1-racing-v1.js',
    'scripts/diagnose-recovery-h-f1-live.mjs',
    'scripts/run-phase368-f1-interaction-snapshot-shadow-audit.mjs'
  ]){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }

  const result={phase:368,name:'f1-interaction-snapshot-shadow',shadowOnly,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase368F1InteractionSnapshotShadowAudit();
