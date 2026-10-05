import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase262F1RaceMomentumAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<262)issues.push('Phase 262 asset cache missing');

  for(const token of [
    "const VERSION262='phase262-race-momentum-rebalance';",
    'const RACE_MOMENTUM_CONFIG_V262=Object.freeze({',
    'paceRange:.02',
    'function raceMomentumSeedV262(',
    'function nextMomentumRandomV262(',
    'function raceMomentumPaceMultiplierV262(',
    'function applyRaceMomentumEventV262(',
    'function updateRaceMomentumV262(',
    'function getRaceMomentumStatesV262(){',
    'function qaRaceMomentumV262(){',
    'updateRaceMomentumV262(vehicle,stepMs,phase);',
    'const momentumPaceMultiplier=raceMomentumPaceMultiplierV262(vehicle);',
    'driverPaceMultiplier=rawDriverPaceMultiplier*longRunPaceMultiplier*momentumPaceMultiplier',
    'raceMomentum:0',
    'momentumRandomStateV262:momentumSeed',
    'function raceMomentumBenchmarkV262(',
    'runSevenTrackBenchmarkV238({runs:8,drivers,laps})',
    'realEngineBenchmarkAlignmentV242(engineSuiteCacheV241)',
    "runAcceleratedEngineRaceV240(trackId,{drivers,laps,runIndex:26200+index",
    'gridFinishCorrelation',
    'averageOvertakes',
    'p1Retention',
    'top3Variation',
    'abnormalGapRuns',
    'deterministicRepeat',
    'window.mwsF1QaRaceMomentumV262=qaRaceMomentumV262;',
    'window.mwsF1QaRaceMomentumBenchmarkV262=qaRaceMomentumBenchmarkV262;',
    'window.__mwsF1RacingV262=VERSION262;'
  ])if(!racing.includes(token))issues.push('Phase 262 runtime missing: '+token);

  const coreStart=racing.indexOf('function updateRaceMomentumV262(');
  const coreEnd=racing.indexOf('function getRaceMomentumStatesV262()',coreStart);
  const core=coreStart>=0&&coreEnd>coreStart?racing.slice(coreStart,coreEnd):'';
  for(const forbidden of ['gridPosition','finishPosition','leaderId','currentPosition','behindPosition']){
    if(core.includes(forbidden))issues.push('Phase 262 core momentum contains prohibited position rubber-banding input: '+forbidden);
  }
  if(core.includes('Math.random'))issues.push('Phase 262 momentum must use seeded deterministic PRNG, not Math.random');

  for(const token of [
    'Phase 262 momentum deterministic QA failed',
    'Phase 262 momentum benchmark failed',
    'gridFinishCorrelation',
    'p1Retention',
    'top3Variation',
    'abnormalGapRuns',
    'deterministicRepeat'
  ])if(!live.includes(token))issues.push('Phase 262 Recovery H QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:262,name:'f1-race-momentum-rebalance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase262F1RaceMomentumAudit();
