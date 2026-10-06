import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase314F1RaceDynamicsRebalanceAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 for(const token of [
  "const VERSION314='phase314-f1-race-dynamics-rebalance';","wearPerLap:0.115","wearPerLap:0.090","wearPerLap:0.068",
  "openingLaps:3","severePressure:0.68","normalPressure:0.34","tacticalMinWear:0.48","overcutCompleteMinWear:0.55",
  "positionCatchupMaxPct:.045","maxTotalBiasKph:14","function positionCatchupPercentV314(","function positionCatchupBonusV314(",
  "follower.positionCatchupPctV314=catchup.pct","frontFieldShare:.60","frontRankPressureScale:.72","function frontRankPressureV314(",
  "role='FRONT_RUNNER'","vehicle.leaderPressureRankFactorV314=context.rankFactor","function qaRaceDynamicsV314(){",
  "window.mwsF1QaRaceDynamicsV314=qaRaceDynamicsV314;","window.__mwsF1RacingV314=VERSION314;"
 ])if(!core.includes(token))issues.push('Phase 314 core missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/run-phase314-f1-race-dynamics-rebalance-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:314,name:'f1-race-dynamics-rebalance',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase314F1RaceDynamicsRebalanceAudit();
