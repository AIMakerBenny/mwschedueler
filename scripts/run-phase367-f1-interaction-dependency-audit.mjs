import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

function countMatches(source,regex){
  const flags=regex.flags.includes('g')?regex.flags:regex.flags+'g';
  return [...source.matchAll(new RegExp(regex.source,flags))].length;
}
function bodyBetween(source,startToken,endToken){
  const start=source.indexOf(startToken);
  if(start<0)return '';
  const end=endToken?source.indexOf(endToken,start+startToken.length):-1;
  return source.slice(start,end>start?end:source.length);
}
function hasAll(source,tokens){return tokens.every(token=>source.includes(token));}

export function runPhase367F1InteractionDependencyAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const phase319=fs.readFileSync('scripts/run-phase319-f1-ui-spacing-battle-audit.mjs','utf8');
  const phase350=fs.readFileSync('scripts/run-phase350-f1-rear-battle-pace-retention-audit.mjs','utf8');
  const phase365=fs.readFileSync('scripts/run-phase365-f1-natural-longitudinal-headway-audit.mjs','utf8');
  const phase366=fs.readFileSync('scripts/run-phase366-f1-following-pause-stability-audit.mjs','utf8');

  const dependencyCounts={
    battleState:countMatches(core,/\bbattleState\b/g),
    battleTargetId:countMatches(core,/\bbattleTargetId\b/g),
    racingLineMode:countMatches(core,/\bracingLineMode\b/g),
    defenceActive:countMatches(core,/\bdefenceActive\b/g),
    battleBlockedV319:countMatches(core,/\bbattleBlockedV319\b/g),
    trafficCarAheadId:countMatches(core,/\btrafficCarAheadId\b/g),
    carAheadId:countMatches(core,/\bcarAheadId\b/g)
  };
  const directWriters={
    battleState:countMatches(core,/\bbattleState\s*=/g),
    battleTargetId:countMatches(core,/\bbattleTargetId\s*=/g),
    racingLineMode:countMatches(core,/\bracingLineMode\s*=/g),
    defenceActive:countMatches(core,/\bdefenceActive\s*=/g),
    pitState:countMatches(core,/\bpitState\s*=/g)
  };

  const requiredRuntime=[
    'function buildBattleLocksV319(',
    'function battlePairBlockedV319(',
    'function updateTrafficAndDefenceV207(',
    'function updatePassStateMachineV208(',
    'function resolveSlipstreamV198(',
    'function resolveDirtyAirV199(',
    'function naturalRaceSpacingControlV366(',
    'function syncBattleLinksV256(',
    'function updateMicroBattleEventsV278(',
    'function applyGameVariabilityV303(',
    'function selectAutoCameraTargetV225(',
    'function updatePitPostStepV205('
  ];
  for(const token of requiredRuntime)if(!core.includes(token))issues.push('Phase 367 dependency baseline missing: '+token);

  const writersBaseline={
    battleState:directWriters.battleState>=4,
    battleTargetId:directWriters.battleTargetId>=4,
    racingLineMode:directWriters.racingLineMode>=12,
    defenceActive:directWriters.defenceActive>=5,
    pitState:directWriters.pitState>=8
  };
  if(!Object.values(writersBaseline).every(Boolean))issues.push('Phase 367 writer inventory unexpectedly incomplete: '+JSON.stringify(directWriters));

  const lockConsumers={
    dirtyAir:bodyBetween(core,'function resolveDirtyAirV199(','function updateDirtyAirStatesV199(').includes('battleBlockedV319'),
    gameVariability:bodyBetween(core,'function applyGameVariabilityV303(','function qaLiveDiversityV315(').includes('battleBlockedV319'),
    headway:bodyBetween(core,'function naturalHeadwayTargetV365(','function naturalHeadwayTelemetrySnapshotV365(').includes('battleBlockedV319'),
    passState:bodyBetween(core,'function updatePassStateMachineV208(','function getPassStatesV208(').includes('battleBlockedV319')
  };
  if(!Object.values(lockConsumers).every(Boolean))issues.push('Phase 367 battleBlocked dependency map changed before migration: '+JSON.stringify(lockConsumers));

  const lineWriterOwners={
    pit:hasAll(core,["vehicle.racingLineMode='PIT_LINE'","vehicle.pitPreviousRacingLineMode"]),
    trafficAttack:core.includes("vehicle.racingLineMode='ATTACK_INSIDE'"),
    trafficDefence:core.includes("ahead.racingLineMode='DEFENSIVE_INSIDE'"),
    passState:core.includes("if(['PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE'].includes(next)"),
    blueFlag:core.includes("vehicle.racingLineMode='OUTSIDE'"),
    gameVariability:bodyBetween(core,'function applyGameVariabilityV303(','function qaLiveDiversityV315(').includes("follower.racingLineMode='ATTACK_INSIDE'")
  };
  if(!Object.values(lineWriterOwners).every(Boolean))issues.push('Phase 367 racing-line writer inventory changed before arbiter migration: '+JSON.stringify(lineWriterOwners));

  const battleLinkBody=bodyBetween(core,'function syncBattleLinksV256(','function qaBattleLinksV256(');
  const slipstreamBody=bodyBetween(core,'function resolveSlipstreamV198(','function updateSlipstreamStatesV198(');
  const trafficBody=bodyBetween(core,'function updateTrafficAndDefenceV207(','function getTrafficStatesV207(');
  const pitExitBody=bodyBetween(core,'function completePitExitV205(','function updatePitWarmupV205(');
  const liveBody=bodyBetween(core,'function liveStateForCandidateV315(','function emitGameLiveV303(');
  const microBody=bodyBetween(core,'function microBattleVehicleStateV278(','function microBattleThresholdCrossingsV278(');
  const cameraBody=bodyBetween(core,'function selectAutoCameraTargetV225(','function raceCameraFocusV216(');

  const migrationHazards={
    battleLinkMissingPitGuard:!battleLinkBody.includes('pitState'),
    slipstreamMissingPitFilter:!slipstreamBody.includes('pitState'),
    trafficUsesOfficialAdjacentStandings:trafficBody.includes('standings[index-1].vehicle')&&trafficBody.includes("String(ahead.pitState||'TRACK')!=='TRACK'"),
    pitExitRestoresPreviousLine:pitExitBody.includes('pitPreviousRacingLineMode'),
    liveMoverMapsToPassCompleted:liveBody.includes("if(isMover)return 'PASS_COMPLETED'"),
    microBattleUsesOfficialStandings:microBody.includes('computeRaceStandingsV191()'),
    cameraBattleUsesIntervalOnly:cameraBody.includes('intervalSeconds')&&!cameraBody.includes('battleState')
  };
  if(!Object.values(migrationHazards).every(Boolean))issues.push('Phase 367 known migration hazard no longer matches inspected baseline: '+JSON.stringify(migrationHazards));

  const historicalContracts={
    phase319ExclusiveIsolation:phase319.includes('buildBattleLocksV319')&&phase319.includes('battlePairBlockedV319')&&phase319.includes('third-car battle isolation'),
    phase350RearBalance:phase350.includes('battleQueueSpeedControlV350')&&phase350.includes('battleBlockedV319'),
    phase365NaturalHeadway:phase365.includes('naturalRaceSpacingControlV365')&&phase365.includes('naturalHeadwayAttackIntentV365'),
    phase366PauseFreeze:phase366.includes('freezeVisualV366')&&phase366.includes('pause changed live marker transforms')
  };
  if(!Object.values(historicalContracts).every(Boolean))issues.push('Phase 367 historical audit dependency inventory incomplete: '+JSON.stringify(historicalContracts));

  const migrationOrder=[
    'interaction-snapshot',
    'track-interaction-order',
    'pit-and-finished-neighbor-filter',
    'shared-neighbor-graph',
    'line-intent-arbiter-shadow',
    'overtake-session-shadow',
    'pass-confirmation-hysteresis',
    'battleBlocked-consumer-migration',
    'single-line-writer-cutover',
    'exclusive-battle-lock-cutover',
    'presentation-adapter-cutover',
    'historical-audit-supersession'
  ];

  for(const file of [
    'assets/f1-racing-v1.js',
    'scripts/run-phase319-f1-ui-spacing-battle-audit.mjs',
    'scripts/run-phase350-f1-rear-battle-pace-retention-audit.mjs',
    'scripts/run-phase365-f1-natural-longitudinal-headway-audit.mjs',
    'scripts/run-phase366-f1-following-pause-stability-audit.mjs',
    'scripts/run-phase367-f1-interaction-dependency-audit.mjs'
  ]){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }

  const result={
    phase:367,
    name:'f1-interaction-dependency-inventory',
    dependencyCounts,
    directWriters,
    lockConsumers,
    lineWriterOwners,
    migrationHazards,
    historicalContracts,
    migrationOrder,
    runtimeBehaviorChanged:false,
    issues,
    warnings,
    pass:issues.length===0
  };
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase367F1InteractionDependencyAudit();
