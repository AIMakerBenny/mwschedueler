// R5-b145 - compare simultaneous source-recorded relative pace, energy,
// tyre and ERS states at the exact START of each real same-target quick retry.
// Correlation is not attribution of cause, clearance, or a gameplay patch.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const replay=read('replay.json');
const exact=read('b139-exact-retry-context.json');
const evidence=read('b122-attack-attribution.json');
assert.equal(replay.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(exact.status,'PASS');
assert.equal(evidence.status,'PASS');
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const cases=[];
const sampleFields=['driverPaceRating','targetPaceRating',
 'driverBatteryMJ','targetBatteryMJ','driverEnergyDeployKW',
 'targetEnergyDeployKW','driverErsRequestKW','targetErsRequestKW',
 'driverTyreWearFraction','targetTyreWearFraction',
 'driverStrategyEffort','targetStrategyEffort'];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');
 assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const led=race.real20ms?.attackLedger;
 assert(led&&!led.missingOverlap);
 const byId=new Map(led.startWitnesses.map(w=>[w.attemptId,w]));
 assert.equal(byId.size,led.startWitnesses.length);
 const quick=exact.cases.find(x=>x.seed===seed)?.rapidRetryWitnesses;
 const prior=evidence.cases.find(x=>x.seed===seed);
 assert(Array.isArray(quick)&&prior);
 const cohorts={
  positiveClosing:{total:0,successes:0,known:0,paceAdvantaged:0,
   outputLower:0,ersRequestLower:0,batteryLower:0,
   tyreWearHigher:0,strategyDifferent:0,effortLower:0},
  nonPositiveClosing:{total:0,successes:0,known:0,paceAdvantaged:0,
   outputLower:0,ersRequestLower:0,batteryLower:0,
   tyreWearHigher:0,strategyDifferent:0,effortLower:0}
 };
 const rows=[];
 for(const event of quick){
  const w=byId.get(event.attemptId);
  assert(w,'No exact accepted 20ms witness at quick retry START');
  assert.equal(w.ms,event.startMs);
  assert.equal(w.driver,event.driver);
  assert.equal(w.target,event.target);
  assert(Math.abs(w.closingSpeedMps-event.relativeClosingSpeedMps)<1e-8);
  assert.equal(w.physicalOvertakingClearanceProven,false);
  assert.equal(event.safeLateralMergeProven,false);
  for(const name of sampleFields)assert(Object.hasOwn(w,name),'Missing resource source field '+name);
  const complete=sampleFields.every(name=>Number.isFinite(w[name]));
  const targetGapMeters=w.targetAheadLongitudinalMeters;
  assert(Number.isFinite(targetGapMeters));
  const flags=complete?{
   paceAdvantaged:w.driverPaceRating>w.targetPaceRating,
   outputLower:w.driverEnergyDeployKW<w.targetEnergyDeployKW,
   ersRequestLower:w.driverErsRequestKW<w.targetErsRequestKW,
   batteryLower:w.driverBatteryMJ<w.targetBatteryMJ,
   tyreWearHigher:w.driverTyreWearFraction>w.targetTyreWearFraction,
   strategyDifferent:w.driverStrategyName!==w.targetStrategyName,
   effortLower:w.driverStrategyEffort<w.targetStrategyEffort
  }:null;
  const group=w.closingSpeedMps>0?'positiveClosing':'nonPositiveClosing';
  const c=cohorts[group];c.total++;
  if(event.resultOfCurrentAttack==='SUCCESS')c.successes++;
  if(complete){
   c.known++;
   for(const [k,v]of Object.entries(flags))c[k]+=Number(v);
  }
  rows.push({
   attemptId:w.attemptId,seed,driver:w.driver,target:w.target,
   startMs:w.ms,firstOrRepeated:'REPEATED',
   relativeClosingSpeedMps:w.closingSpeedMps,
   signedTargetAheadTrackMeters:targetGapMeters,
   exactPhysicalResourceValuesAvailable:complete,
   driverPaceRating:w.driverPaceRating,targetPaceRating:w.targetPaceRating,
   driverEnergyDeployKW:w.driverEnergyDeployKW,targetEnergyDeployKW:w.targetEnergyDeployKW,
   driverBatteryMJ:w.driverBatteryMJ,targetBatteryMJ:w.targetBatteryMJ,
   driverTyreWearFraction:w.driverTyreWearFraction,
   targetTyreWearFraction:w.targetTyreWearFraction,
   driverStrategyEffort:w.driverStrategyEffort,targetStrategyEffort:w.targetStrategyEffort,
   driverStrategyName:w.driverStrategyName,targetStrategyName:w.targetStrategyName,
   flags,success:event.resultOfCurrentAttack==='SUCCESS',
   safeLateralMergeProven:false
  });
 }
 assert.equal(rows.length,seed===1?22:18);
 assert.equal(cohorts.positiveClosing.total+cohorts.nonPositiveClosing.total,rows.length);
 assert.equal(cohorts.positiveClosing.successes+cohorts.nonPositiveClosing.successes,
  rows.filter(x=>x.success).length);
 assert.equal(rows.filter(x=>x.success).length,seed===1?2:1);
 for(const c of Object.values(cohorts)){
  assert(c.known<=c.total);
  for(const k of ['paceAdvantaged','outputLower','ersRequestLower','batteryLower',
   'tyreWearHigher','strategyDifferent','effortLower'])assert(c[k]<=c.known);
 }
 cases.push({seed,sourceAttackStarts:prior.engineAttemptStarts,
  quickRetryStarts:rows.length,cohorts,rows,
  noEnergyCausationProven:true,physicsPasses:race.physics.passes,
  collisionStops:race.physics.collisionStops});
 console.log(JSON.stringify({phase:'R5-b145',status:'CASE_PASS',seed,
  positiveClosing:cohorts.positiveClosing,
  nonPositiveClosing:cohorts.nonPositiveClosing}));
}
const result={phase:'R5-b145',status:'PASS',track:'majoku-ring-v1',
 sourceBrowserRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
  Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 physicalPhysicsChanged:false,liveAiModified:false,readOnly:true,
 causalAiFailureConfirmed:false,sweptSafeCorridorConfirmed:false,
 originalRealRaceSeeds:2,cases,
 warnings:[
  'Instantaneous driver pace ratings are not the same as instantaneous speed',
  'An ERS, tyre or strategy difference at attack START cannot explain an earlier speed difference causally',
  'Only exact accepted physics step values are counted, never a 5-second strategy snapshot'
 ]};
fs.writeFileSync(dir+'b145-relative-pace-resource-crosstab.json',JSON.stringify(result,null,2));
