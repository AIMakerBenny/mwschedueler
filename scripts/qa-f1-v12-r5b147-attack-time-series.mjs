// R5-b147: exact accepted-20ms 5-frame longitudinal, ERS, tyre and
// AI-state trajectories around authentic START. No interpolation or causal claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(root+n,'utf8'));
const replay=read('replay.json');
const exact=read('b139-exact-retry-context.json');
const cross=read('b145-relative-pace-resource-crosstab.json');
for(const d of [replay,exact,cross])assert.equal(d.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(cross.causalAiFailureConfirmed,false);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const offsets=[-200,-100,0,100,200];
const names=['relativeClosingSpeedMps','driverBatteryMJ','targetBatteryMJ',
 'driverEnergyDeployKW','targetEnergyDeployKW','driverTyreWearFraction',
 'targetTyreWearFraction','driverErsRequestKW','targetErsRequestKW',
 'driverStrategyEffort','targetStrategyEffort'];
const stats=()=>({attempts:0,sourceSamples:Object.fromEntries(offsets.map(x=>[String(x),0])),
 unavailableSamples:Object.fromEntries(offsets.map(x=>[String(x),0])),
 earlySpeedAndLaterSpeedKnown:0,nonPositiveToPositive:0,
 positiveToNonPositive:0,speedStayedNonPositive:0,speedStayedPositive:0,
 earlyAndLaterBatteryKnown:0,driverBatteryReduced:0,driverBatteryIncreased:0,
 earlyAndLaterErsKnown:0,driverErsIncreased:0,driverErsDecreased:0,
 earlyAndLaterTyreKnown:0,driverTyreWearIncreased:0,driverTyreWearDecreased:0,
 earlyAndLaterStrategyKnown:0,driverStrategyChanged:0,
 earlyAndLaterTargetKnown:0,aiTargetChanged:0,
 successfulPhysically:0});
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.mode,'NORMAL');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.laps,10);assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const led=race.real20ms?.attackLedger;
 assert(led&&!led.missingOverlap);
 assert.deepEqual(led.trajectoryOffsetsMs,offsets);
 assert.equal(led.trajectorySource,
  'exact accepted 20ms simulation frames, missing values explicit');
 assert.equal(led.trajectorySweptClearanceProven,false);
 assert(Array.isArray(led.startTrajectories));
 assert.equal(led.startTrajectories.length,led.totalStarts);
 const byTrajectory=new Map();
 for(const row of led.startTrajectories){
  assert(Number.isInteger(row.attemptId));
  assert(!byTrajectory.has(row.attemptId),'Duplicate START trajectory');
  assert(Number.isInteger(row.startMs));
  assert(row.driver&&row.target&&row.driver!==row.target);
  assert(row.offsetSamples&&typeof row.offsetSamples==='object');
  for(const off of offsets){
   const sample=row.offsetSamples[String(off)];
   assert(sample,'Missing explicit observed OR unavailable timestamp');
   assert.equal(sample.ms,row.startMs+off);
   assert.equal(sample.offsetMs,off);
   assert.equal(typeof sample.available,'boolean');
   if(sample.available){
    assert.equal(sample.driver,row.driver);
    assert.equal(sample.target,row.target);
    assert.equal(sample.sweptBodyClearanceProven,false);
    assert.equal(sample.causalEffectProven,false);
    for(const k of names){
     assert(Object.hasOwn(sample,k),'Missing required simultaneous physical field '+k);
     assert(sample[k]===null||Number.isFinite(sample[k]));
    }
   }else{
    assert(['BEFORE_RACE_START','AFTER_FINAL_ACCEPTED_STEP','NO_EXACT_20MS_SAMPLE']
     .includes(sample.reason),'Unavailable reason was not audited');
   }
  }
  byTrajectory.set(row.attemptId,row);
 }
 const starts=new Map(led.events.filter(e=>e.type==='START').map(e=>[e.attemptId,e]));
 assert.equal(starts.size,led.totalStarts);
 for(const [id,r] of byTrajectory){
  const start=starts.get(id);
  assert(start&&start.ms===r.startMs&&start.driver===r.driver&&start.target===r.target);
 }
 const speed=exact.cases.find(x=>x.seed===seed);
 const crossSeed=cross.cases.find(x=>x.seed===seed);
 assert(speed&&crossSeed);
 const statsByClosing={positive:stats(),nonpositive:stats()};
 const witnessRows=[];
 for(const rapid of speed.rapidRetryWitnesses){
  const trajectory=byTrajectory.get(rapid.attemptId);
  assert(trajectory,'Quick retry missing trajectory');
  const zero=trajectory.offsetSamples['0'];
  assert(zero.available,'R5-b139 already proved quick retry exact START frame exists');
  assert.equal(zero.ms,rapid.startMs);
  assert(Math.abs(zero.relativeClosingSpeedMps-rapid.relativeClosingSpeedMps)<1e-8);
  assert(Math.abs(zero.signedTargetAheadTrackMeters-
    rapid.signedTargetAheadTrackMeters)<1e-5);
  const group=rapid.relativeClosingSpeedMps>0?'positive':'nonpositive';
  const s=statsByClosing[group];
  s.attempts++;
  s.successfulPhysically+=Number(rapid.resultOfCurrentAttack==='SUCCESS');
  for(const off of offsets){
   const sample=trajectory.offsetSamples[String(off)];
   if(sample.available)s.sourceSamples[String(off)]++;
   else s.unavailableSamples[String(off)]++;
  }
  const before=trajectory.offsetSamples['-200'];
  const after=trajectory.offsetSamples['200'];
  if(before.available&&after.available){
   const beforeSpeed=before.relativeClosingSpeedMps,afterSpeed=after.relativeClosingSpeedMps;
   if(Number.isFinite(beforeSpeed)&&Number.isFinite(afterSpeed)){
    s.earlySpeedAndLaterSpeedKnown++;
    if(beforeSpeed<=0&&afterSpeed>0)s.nonPositiveToPositive++;
    else if(beforeSpeed>0&&afterSpeed<=0)s.positiveToNonPositive++;
    else if(beforeSpeed<=0&&afterSpeed<=0)s.speedStayedNonPositive++;
    else s.speedStayedPositive++;
   }
   const beforeBattery=before.driverBatteryMJ,afterBattery=after.driverBatteryMJ;
   if(Number.isFinite(beforeBattery)&&Number.isFinite(afterBattery)){
    s.earlyAndLaterBatteryKnown++;
    if(afterBattery<beforeBattery)s.driverBatteryReduced++;
    if(afterBattery>beforeBattery)s.driverBatteryIncreased++;
   }
   if(Number.isFinite(before.driverEnergyDeployKW)&&
    Number.isFinite(after.driverEnergyDeployKW)){
    s.earlyAndLaterErsKnown++;
    if(after.driverEnergyDeployKW>before.driverEnergyDeployKW)s.driverErsIncreased++;
    if(after.driverEnergyDeployKW<before.driverEnergyDeployKW)s.driverErsDecreased++;
   }
   if(Number.isFinite(before.driverTyreWearFraction)&&
    Number.isFinite(after.driverTyreWearFraction)){
    s.earlyAndLaterTyreKnown++;
    if(after.driverTyreWearFraction>before.driverTyreWearFraction)s.driverTyreWearIncreased++;
    if(after.driverTyreWearFraction<before.driverTyreWearFraction)s.driverTyreWearDecreased++;
   }
   if(typeof before.driverStrategyName==='string'&&
    typeof after.driverStrategyName==='string'){
    s.earlyAndLaterStrategyKnown++;
    if(before.driverStrategyName!==after.driverStrategyName)s.driverStrategyChanged++;
   }
   if(typeof before.driverAiTarget==='string'&&
    typeof after.driverAiTarget==='string'){
    s.earlyAndLaterTargetKnown++;
    if(before.driverAiTarget!==after.driverAiTarget)s.aiTargetChanged++;
   }
  }
  witnessRows.push({attemptId:rapid.attemptId,driver:rapid.driver,target:rapid.target,
   startMs:rapid.startMs,startClosingSpeedMps:rapid.relativeClosingSpeedMps,
   physicallySuccessful:rapid.resultOfCurrentAttack==='SUCCESS',
   sourceSamples:trajectory.offsetSamples,bodyClearanceProven:false});
 }
 assert.equal(witnessRows.length,speed.rapidSameTargetRetries);
 assert.equal(witnessRows.length,crossSeed.quickRetryStarts);
 assert.equal(statsByClosing.positive.attempts,speed.rapidRetriesWithPositiveClosingSpeed);
 assert.equal(statsByClosing.nonpositive.attempts,speed.rapidRetriesWithNonpositiveClosingSpeed);
 assert.equal(statsByClosing.positive.successfulPhysically+
   statsByClosing.nonpositive.successfulPhysically,speed.rapidlyRetriedConfirmedPasses);
 assert.equal(statsByClosing.positive.sourceSamples['0']+
   statsByClosing.nonpositive.sourceSamples['0'],witnessRows.length);
 for(const s of Object.values(statsByClosing)){
  for(const off of offsets)
   assert.equal(s.sourceSamples[String(off)]+s.unavailableSamples[String(off)],s.attempts);
  assert.equal(s.nonPositiveToPositive+s.positiveToNonPositive+
    s.speedStayedNonPositive+s.speedStayedPositive,s.earlySpeedAndLaterSpeedKnown);
  assert(s.driverBatteryReduced+s.driverBatteryIncreased<=s.earlyAndLaterBatteryKnown);
  assert(s.driverErsDecreased+s.driverErsIncreased<=s.earlyAndLaterErsKnown);
 }
 const out={seed,totalAttemptStarts:led.totalStarts,
  observedExactStarts:led.startWitnesses.length,
  unavailableExactStarts:led.missingStartWitnesses.length,
  quickRetries:witnessRows.length,byStartClosingSign:statsByClosing,
  genuineConfirmedPasses:race.physics.passes,
  gamePhysicsUnchanged:true,causalImprovementProven:false,
  sweptClearanceProven:false,witnessRows};
 cases.push(out);
 console.log(JSON.stringify({phase:'R5-b147',status:'CASE_PASS',seed,
  quickRetries:out.quickRetries,
  completeBeforeAfter:statsByClosing.positive.earlySpeedAndLaterSpeedKnown+
   statsByClosing.nonpositive.earlySpeedAndLaterSpeedKnown,
  nonpositiveChangedToPositive:statsByClosing.positive.nonPositiveToPositive+
   statsByClosing.nonpositive.nonPositiveToPositive}));
}
const result={phase:'R5-b147',status:'PASS',track:'majoku-ring-v1',
 sourceBrowserRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 newPhysicsCode:false,realBrowserRaces:2,readOnly:true,
 safeLaneAndSweptClearanceProven:false,aiPatchesApproved:false,
 limits:[
  'A 400ms two-sided time window around START is descriptive and does not prove cause',
  'Each timepoint is a genuine accepted frame or explicitly unavailable',
  'Lateral and merge reservation safety cannot be inferred from signed track-progress gaps'
 ],cases};
fs.writeFileSync(root+'b147-attack-time-series.json',JSON.stringify(result,null,2));
