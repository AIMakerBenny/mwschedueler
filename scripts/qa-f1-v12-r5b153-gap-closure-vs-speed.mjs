// R5-b153: distinguish increased instantaneous approach speed from
// genuine signed circuit-progress separation shrinking over the same 400ms.
// Read only. Longitudinal progress != swept body collision clearance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const base=read('replay.json'),quick=read('b139-exact-retry-context.json');
const recovery=read('b149-approach-recovery.json');
const ordered=read('b150-attack-transition-order.json');
for(const v of [base,quick,recovery,ordered])assert.equal(v.status,'PASS');
assert.equal(base.authenticPhysicsUnchanged,true);
assert.deepEqual(base.pairs.map(x=>x.seed),[1,2]);
const tolerance=1e-7;
const fresh=()=>({attempts:0,preAndPostPhysicalFrames:0,
 gapShrank:0,gapExpanded:0,gapEssentiallyUnchanged:0,
 speedImproved:0,speedWorsened:0,speedUnchanged:0,
 speedImprovedYetGapExpanded:0,speedImprovedAndGapShrank:0,
 confirmedSuccessWithGapShrinking:0,confirmedSuccessWithGapExpanding:0,
 incompleteFrames:0,targetGapPositiveAtStart:0,targetGapNegativeAtStart:0,
 missingGapOrSpeed:0});
const cases=[];
for(const seed of [1,2]){
 const r=read('seed'+seed+'-observed10.json');
 assert.equal(r.status,'PASS');assert.equal(r.track,'majoku-ring-v1');
 assert.equal(r.mode,'NORMAL');assert.equal(r.laps,10);
 assert.equal(r.finishedRows.length,12);assert.equal(r.physics.collisionStops,0);
 const ledger=r.real20ms?.attackLedger;
 assert(ledger&&!ledger.missingOverlap);
 assert.deepEqual(ledger.trajectoryOffsetsMs,[-200,-100,0,100,200]);
 const source=new Map(ledger.startTrajectories.map(t=>[t.attemptId,t]));
 assert.equal(source.size,ledger.totalStarts);
 const q=quick.cases.find(x=>x.seed===seed);
 const recover=recovery.cases.find(x=>x.seed===seed);
 const temporal=ordered.cases.find(x=>x.seed===seed);
 assert(q&&recover&&temporal);
 const groups={nonpositiveAtStart:fresh(),positiveAtStart:fresh()},rows=[];
 for(const item of q.rapidRetryWitnesses){
  const tr=source.get(item.attemptId);assert(tr);
  assert.equal(tr.startMs,item.startMs);
  assert.equal(tr.driver,item.driver);assert.equal(tr.target,item.target);
  const pre=tr.offsetSamples['-200'],at=tr.offsetSamples['0'],post=tr.offsetSamples['200'];
  assert(pre&&at&&post&&at.available);
  assert(Math.abs(at.relativeClosingSpeedMps-item.relativeClosingSpeedMps)<tolerance);
  const key=item.relativeClosingSpeedMps>0?'positiveAtStart':'nonpositiveAtStart';
  const g=groups[key];g.attempts++;
  if(at.signedTargetAheadTrackMeters>0)g.targetGapPositiveAtStart++;
  else if(at.signedTargetAheadTrackMeters<0)g.targetGapNegativeAtStart++;
  if(!pre.available||!post.available){g.incompleteFrames++;continue}
  const vals=[pre,post];
  if(!vals.every(v=>Number.isFinite(v.signedTargetAheadTrackMeters)&&
   Number.isFinite(v.relativeClosingSpeedMps))){
   g.missingGapOrSpeed++;continue;
  }
  g.preAndPostPhysicalFrames++;
  const gapDelta=post.signedTargetAheadTrackMeters-pre.signedTargetAheadTrackMeters;
  const speedDelta=post.relativeClosingSpeedMps-pre.relativeClosingSpeedMps;
  const shrink=gapDelta< -tolerance,expand=gapDelta>tolerance;
  const improved=speedDelta>tolerance,worsened=speedDelta< -tolerance;
  g.gapShrank+=Number(shrink);g.gapExpanded+=Number(expand);
  g.gapEssentiallyUnchanged+=Number(!shrink&&!expand);
  g.speedImproved+=Number(improved);g.speedWorsened+=Number(worsened);
  g.speedUnchanged+=Number(!improved&&!worsened);
  g.speedImprovedYetGapExpanded+=Number(improved&&expand);
  g.speedImprovedAndGapShrank+=Number(improved&&shrink);
  const succeeded=item.resultOfCurrentAttack==='SUCCESS';
  g.confirmedSuccessWithGapShrinking+=Number(succeeded&&shrink);
  g.confirmedSuccessWithGapExpanding+=Number(succeeded&&expand);
  rows.push({attemptId:item.attemptId,seed,driver:item.driver,target:item.target,
   startMs:item.startMs,relativeClosingAtStartMps:item.relativeClosingSpeedMps,
   preToPostGapChangeMeters:gapDelta,preToPostRelativeSpeedChangeMps:speedDelta,
   physicalConfirmedPass:succeeded,
   driverAiStart:at.driverAiState,targetAiStart:at.targetAiState,
   measuredGapChangeIsNotSafeLateralClearance:true});
 }
 assert.equal(groups.nonpositiveAtStart.attempts,q.rapidRetriesWithNonpositiveClosingSpeed);
 assert.equal(groups.positiveAtStart.attempts,q.rapidRetriesWithPositiveClosingSpeed);
 for(const [key,g] of Object.entries(groups)){
  const previous=recover.groups[key==='positiveAtStart'?'positiveStart':'nonpositiveStart'];
  const old=temporal.groups[key==='positiveAtStart'?'positiveStart':'nonpositiveStart'];
  assert.equal(g.attempts,previous.attempts);
  assert.equal(g.preAndPostPhysicalFrames,old.knownPreStartPost);
  assert.equal(g.preAndPostPhysicalFrames,g.gapShrank+g.gapExpanded+g.gapEssentiallyUnchanged);
  assert.equal(g.preAndPostPhysicalFrames,g.speedImproved+g.speedWorsened+g.speedUnchanged);
  assert.equal(g.speedImproved,previous.closingImproved);
  assert.equal(g.speedWorsened,previous.closingWorsened);
  assert.equal(g.incompleteFrames+g.missingGapOrSpeed+g.preAndPostPhysicalFrames,g.attempts);
 }
 assert.equal(rows.length,groups.nonpositiveAtStart.preAndPostPhysicalFrames+
  groups.positiveAtStart.preAndPostPhysicalFrames);
 const c={seed,recordedRapidRetryStarts:q.rapidSameTargetRetries,
  knownGapComparisons:rows.length,groups,rows,
  collisionStops:0,actualPhysicsPasses:r.physics.passes,
  physicalSweptClearanceProven:false,unnecessaryBrakingProven:false};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b153',status:'CASE_PASS',seed,
  quickRetries:c.recordedRapidRetryStarts,
  gapShrank:groups.positiveAtStart.gapShrank+groups.nonpositiveAtStart.gapShrank,
  gapExpanded:groups.positiveAtStart.gapExpanded+groups.nonpositiveAtStart.gapExpanded,
  fasterButStillExpanding:groups.positiveAtStart.speedImprovedYetGapExpanded+
   groups.nonpositiveAtStart.speedImprovedYetGapExpanded}));
}
const result={phase:'R5-b153',status:'PASS',track:'majoku-ring-v1',
 sourceActualChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 readOnly:true,gamePhysicsModified:false,alternateLaneSafelyOpenProven:false,
 explanatoryLimitations:[
  'Signed progress gap can shrink or expand without proving body clearance',
  'A 400ms change in closing speed does not necessarily result in 400ms gap reduction',
  'Two seeded real races do not prove a global causal AI tuning improvement'
 ],cases};
fs.writeFileSync(dir+'b153-gap-closure-vs-speed.json',JSON.stringify(result,null,2));
