// R5-b149: classify changes in true accepted-20ms relative speed around
// genuine quick retry START. No fitted speed, ranking boost or safety inference.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=name=>JSON.parse(fs.readFileSync(dir+name,'utf8'));
const replay=read('replay.json');
const previous=read('b147-attack-time-series.json');
const original=read('b139-exact-retry-context.json');
assert.equal(replay.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(previous.status,'PASS');
assert.equal(previous.safeLaneAndSweptClearanceProven,false);
assert.equal(original.status,'PASS');
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const eps=1e-8;
const count=()=>({attempts:0,availableAtAllFiveOffsets:0,missingAnyOffset:0,
 confirmedPasses:0,preAndPostKnown:0,closingImproved:0,closingWorsened:0,
 closingUnchanged:0,negativeAtStart:0,positiveAtStart:0,
 fromPreNonpositiveToPostPositive:0,nonpositiveAtPost:0,
 postPositive:0,changedAiStatePreToStart:0,
 ersRequestRisenPreToPost:0,ersRequestFallenPreToPost:0,
 actualErsOutputRisenPreToPost:0,actualErsOutputFallenPreToPost:0,
 strategyNameChangedPreToPost:0,missingFramesByOffset:
 Object.fromEntries([-200,-100,0,100,200].map(x=>[String(x),0]))});
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const led=race.real20ms?.attackLedger;
 assert(led&&led.missingOverlap===false);
 assert.deepEqual(led.trajectoryOffsetsMs,[-200,-100,0,100,200]);
 assert.equal(led.trajectorySweptClearanceProven,false);
 const old=previous.cases.find(x=>x.seed===seed);
 const starts=original.cases.find(x=>x.seed===seed);
 assert(old&&starts);
 const byId=new Map(led.startTrajectories.map(t=>[t.attemptId,t]));
 assert.equal(byId.size,led.totalStarts);
 const groups={nonpositiveStart:count(),positiveStart:count()};
 const anomalies=[];
 for(const e of starts.rapidRetryWitnesses){
  const row=byId.get(e.attemptId);
  assert(row);
  assert.equal(row.startMs,e.startMs);
  assert.equal(row.driver,e.driver);
  assert.equal(row.target,e.target);
  const t=row.offsetSamples;
  const start=t['0'],pre=t['-200'],post=t['200'];
  assert(start?.available===true);
  assert(Math.abs(start.relativeClosingSpeedMps-e.relativeClosingSpeedMps)<eps);
  const group=e.relativeClosingSpeedMps>0?'positiveStart':'nonpositiveStart';
  const g=groups[group];
  g.attempts++;
  if(e.relativeClosingSpeedMps<=0)g.negativeAtStart++;
  else g.positiveAtStart++;
  g.confirmedPasses+=Number(e.resultOfCurrentAttack==='SUCCESS');
  const available=[-200,-100,0,100,200].every(o=>{
   const value=t[String(o)];
   assert(value&&value.ms===row.startMs+o);
   assert.equal(typeof value.available,'boolean');
   if(!value.available)g.missingFramesByOffset[String(o)]++;
   return value.available;
  });
  if(available)g.availableAtAllFiveOffsets++;
  else g.missingAnyOffset++;
  if(!pre.available||!post.available){
   anomalies.push({attemptId:e.attemptId,reason:'PRE_OR_POST_SOURCE_UNAVAILABLE'});
   continue;
  }
  assert.equal(pre.causalEffectProven,false);
  assert.equal(post.causalEffectProven,false);
  assert(Number.isFinite(pre.relativeClosingSpeedMps)&&Number.isFinite(post.relativeClosingSpeedMps));
  g.preAndPostKnown++;
  const dv=post.relativeClosingSpeedMps-pre.relativeClosingSpeedMps;
  if(dv>eps)g.closingImproved++;
  else if(dv< -eps)g.closingWorsened++;
  else g.closingUnchanged++;
  if(pre.relativeClosingSpeedMps<=0&&post.relativeClosingSpeedMps>0)
   g.fromPreNonpositiveToPostPositive++;
  if(post.relativeClosingSpeedMps<=0)g.nonpositiveAtPost++;
  else g.postPositive++;
  if(pre.driverAiState!==start.driverAiState)g.changedAiStatePreToStart++;
  if(Number.isFinite(pre.driverErsRequestKW)&&Number.isFinite(post.driverErsRequestKW)){
   if(post.driverErsRequestKW-pre.driverErsRequestKW>eps)g.ersRequestRisenPreToPost++;
   if(post.driverErsRequestKW-pre.driverErsRequestKW< -eps)g.ersRequestFallenPreToPost++;
  }
  if(Number.isFinite(pre.driverEnergyDeployKW)&&Number.isFinite(post.driverEnergyDeployKW)){
   if(post.driverEnergyDeployKW-pre.driverEnergyDeployKW>eps)g.actualErsOutputRisenPreToPost++;
   if(post.driverEnergyDeployKW-pre.driverEnergyDeployKW< -eps)g.actualErsOutputFallenPreToPost++;
  }
  if(pre.driverStrategyName!==null&&post.driverStrategyName!==null&&
   pre.driverStrategyName!==post.driverStrategyName)g.strategyNameChangedPreToPost++;
 }
 assert.equal(groups.nonpositiveStart.attempts,old.byStartClosingSign.nonpositive.attempts);
 assert.equal(groups.positiveStart.attempts,old.byStartClosingSign.positive.attempts);
 assert.equal(groups.nonpositiveStart.attempts+groups.positiveStart.attempts,old.quickRetries);
 for(const [name,g] of Object.entries(groups)){
  const oldGroup=old.byStartClosingSign[name==='positiveStart'?'positive':'nonpositive'];
  assert.equal(g.preAndPostKnown,oldGroup.earlySpeedAndLaterSpeedKnown);
  assert.equal(g.confirmedPasses,oldGroup.successfulPhysically);
  assert.equal(g.fromPreNonpositiveToPostPositive,oldGroup.nonPositiveToPositive);
  assert.equal(g.ersRequestRisenPreToPost+g.ersRequestFallenPreToPost<=g.preAndPostKnown,true);
  assert.equal(g.closingImproved+g.closingWorsened+g.closingUnchanged,g.preAndPostKnown);
  assert.equal(g.availableAtAllFiveOffsets+g.missingAnyOffset,g.attempts);
 }
 cases.push({seed,realTenLapSource:true,
  quickRetries:old.quickRetries,groups,
  unavailablePreOrPostFrames:anomalies,
  physicalPasses:race.physics.passes,collisionStops:0});
 console.log(JSON.stringify({phase:'R5-b149',status:'CASE_PASS',seed,
  nonpositiveAtStart:groups.nonpositiveStart.attempts,
  improving:groups.nonpositiveStart.closingImproved,
  preNonpositiveToPostPositive:groups.nonpositiveStart.fromPreNonpositiveToPostPositive,
  incompleteFiveOffsetFrames:groups.nonpositiveStart.missingAnyOffset+
   groups.positiveStart.missingAnyOffset}));
}
const result={phase:'R5-b149',status:'PASS',track:'majoku-ring-v1',
 sourceRealChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 newBrowserRuns:0,readOnly:true,gamePhysicsChanged:false,
 aiTuningApproved:false,sweptCollisionClearanceProven:false,
 causalEffectOfErsChangeProven:false,cases,
 caution:'A rising closing speed within 400ms is an observed association; it does not prove that ERS caused that change or that a pass was safe.'};
fs.writeFileSync(dir+'b149-approach-recovery.json',JSON.stringify(result,null,2));
