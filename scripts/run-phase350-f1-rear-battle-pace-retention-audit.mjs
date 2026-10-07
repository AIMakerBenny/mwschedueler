import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase350F1RearBattlePaceRetentionAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION350='phase350-f1-rear-battle-pace-retention';",
    "const REAR_BATTLE_BALANCE_V350=Object.freeze({",
    "function battleQueueSpeedControlV350(vehicle){",
    "const spacingControlV319=battleQueueSpeedControlV350(vehicle);",
    "retainedCatchupV350:true",
    "finishedAtSimMs:Number(vehicle.finishedAtSimMs)||0",
    "finishSpreadSeconds:Number(normalFinishSpreadSeconds.toFixed(3))",
    "function qaRearBattlePaceRetentionV350(){",
    "window.mwsF1QaRearBattlePaceRetentionV350=qaRearBattlePaceRetentionV350;",
    "window.__mwsF1RacingV350=VERSION350;"
  ])if(!core.includes(token))issues.push('Phase 350 core missing: '+token);
  const rearConfigStart=core.indexOf('const REAR_BATTLE_BALANCE_V350=Object.freeze({');
  const rearConfigEnd=core.indexOf('});',rearConfigStart);
  const rearConfig=rearConfigStart>=0&&rearConfigEnd>rearConfigStart?core.slice(rearConfigStart,rearConfigEnd+3):'';
  const activeScale=Number(rearConfig.match(/activeBattleDirtyAirScale:([0-9.]+)/)?.[1]);
  const blockedScale=Number(rearConfig.match(/blockedBattleDirtyAirScale:([0-9.]+)/)?.[1]);
  if(!Number.isFinite(activeScale)||!Number.isFinite(blockedScale)||activeScale<=0||blockedScale<=activeScale||blockedScale>.85)issues.push('Phase 350 rear battle dirty-air scales invalid: '+JSON.stringify({activeScale,blockedScale}));
  const queueStart=core.indexOf('function battleQueueSpeedControlV350(');
  const queueEnd=core.indexOf('function simulateVehicleDynamicsV196(',queueStart);
  const queueBody=queueStart>=0&&queueEnd>queueStart?core.slice(queueStart,queueEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(queueBody))issues.push('Phase 350 queue control directly mutates vehicle position');
  if(!queueBody.includes("gap<REAR_BATTLE_BALANCE_V350.overlapGuardMeters"))issues.push('Phase 350 collision-range guard missing');
  for(const token of [
    "Phase 350 runtime did not propagate to Recovery H browser",
    "Phase 350 rear battle pace retention QA failed",
    "rearBattleV350:rearBattle350||null"
  ])if(!diag.includes(token))issues.push('Phase 350 Recovery H missing: '+token);
  for(const token of [
    "node --check scripts/run-phase350-f1-rear-battle-pace-retention-audit.mjs",
    "[phase350] F1 rear battle pace retention without forced spacing",
    "window.__mwsF1RacingV350=VERSION350;"
  ])if(!workflow.includes(token))issues.push('Phase 350 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase350-f1-rear-battle-pace-retention-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:350,name:'f1-rear-battle-pace-retention',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase350F1RearBattlePaceRetentionAudit();
