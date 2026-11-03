// R5-b150: test temporal ordering of exact accepted 20ms telemetry
// around a rapid START, without confusing 20ms co-observation with cause.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const provenance=read('replay.json');
const recovered=read('b149-approach-recovery.json');
const physical=read('b147-attack-time-series.json');
const exact=read('b139-exact-retry-context.json');
for(const x of [provenance,recovered,physical,exact])assert.equal(x.status,'PASS');
assert.equal(provenance.authenticPhysicsUnchanged,true);
assert.deepEqual(provenance.pairs.map(x=>x.seed),[1,2]);
const offsets=[-200,-100,0,100,200];
const initial=()=>({
 starts:0,knownPreStartPost:0,unknownPreStartPost:0,
 preToStartClosingImproved:0,preToStartClosingWorsened:0,
 startToPostClosingImproved:0,startToPostClosingWorsened:0,
 switchedFromFollowToPlanAttackAtStart:0,
 alreadyPlanAttack200msBeforeStart:0,
 changedToPositiveByPlus100ms:0,changedToPositiveByPlus200ms:0,
 stillNonpositiveAtPlus200ms:0,
 requestedErsIncreaseBeforeStart:0,
 requestedErsIncreaseAfterStart:0,
 actualErsOutputIncreaseBeforeStart:0,
 actualErsOutputIncreaseAfterStart:0,
 energyDeployZeroAtStart:0,outputOfTargetHigherAtStart:0,
 driverStrategyChangedIn400ms:0,
 samplesMissingAtOffset:Object.fromEntries(offsets.map(t=>[String(t),0]))
});
const cases=[];
const eps=1e-8;
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');
 assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const ledger=race.real20ms?.attackLedger;
 assert(ledger&&!ledger.missingOverlap);
 assert.deepEqual(ledger.trajectoryOffsetsMs,offsets);
 const traj=new Map(ledger.startTrajectories.map(x=>[x.attemptId,x]));
 assert.equal(traj.size,ledger.totalStarts);
 const old=physical.cases.find(x=>x.seed===seed);
 const earlier=recovered.cases.find(x=>x.seed===seed);
 const real=exact.cases.find(x=>x.seed===seed);
 assert(old&&earlier&&real);
 const groups={nonpositiveStart:initial(),positiveStart:initial()};
 const individual=[];
 for(const attack of real.rapidRetryWitnesses){
  const row=traj.get(attack.attemptId);assert(row);
  assert.equal(row.startMs,attack.startMs);
  assert.equal(row.driver,attack.driver);assert.equal(row.target,attack.target);
  const q=row.offsetSamples;
  const start=q['0'];
  assert(start.available);
  assert.equal(start.ms,attack.startMs);
  assert(Math.abs(start.relativeClosingSpeedMps-attack.relativeClosingSpeedMps)<eps);
  const group=attack.relativeClosingSpeedMps>0?'positiveStart':'nonpositiveStart';
  const g=groups[group];g.starts++;
  const missing=offsets.filter(offset=>{
   const a=q[String(offset)];
   assert(a&&a.ms===attack.startMs+offset);
   if(!a.available)g.samplesMissingAtOffset[String(offset)]++;
   return !a.available;
  });
  const pre=q['-200'],post=q['200'];
  const valid=pre.available&&start.available&&post.available&&
   [pre,start,post].every(x=>Number.isFinite(x.relativeClosingSpeedMps));
  if(!valid){g.unknownPreStartPost++;continue}
  g.knownPreStartPost++;
  const dv0=start.relativeClosingSpeedMps-pre.relativeClosingSpeedMps;
  const dv1=post.relativeClosingSpeedMps-start.relativeClosingSpeedMps;
  g.preToStartClosingImproved+=Number(dv0>eps);
  g.preToStartClosingWorsened+=Number(dv0< -eps);
  g.startToPostClosingImproved+=Number(dv1>eps);
  g.startToPostClosingWorsened+=Number(dv1< -eps);
  g.switchedFromFollowToPlanAttackAtStart+=Number(
   pre.driverAiState==='FOLLOW'&&start.driverAiState==='PLAN_ATTACK');
  g.alreadyPlanAttack200msBeforeStart+=Number(pre.driverAiState==='PLAN_ATTACK');
  if(group==='nonpositiveStart'){
   const mid=q['100'];
   const switchedAt100=mid.available&&Number.isFinite(mid.relativeClosingSpeedMps)&&
    mid.relativeClosingSpeedMps>0;
   const positivePost=post.relativeClosingSpeedMps>0;
   g.changedToPositiveByPlus100ms+=Number(switchedAt100);
   g.changedToPositiveByPlus200ms+=Number(positivePost);
   g.stillNonpositiveAtPlus200ms+=Number(!positivePost);
  }
  const comparisons=[
   ['driverErsRequestKW','requestedErsIncreaseBeforeStart','requestedErsIncreaseAfterStart'],
   ['driverEnergyDeployKW','actualErsOutputIncreaseBeforeStart','actualErsOutputIncreaseAfterStart']];
  for(const [field,earlierName,laterName]of comparisons){
   if(Number.isFinite(pre[field])&&Number.isFinite(start[field]))
    g[earlierName]+=Number(start[field]-pre[field]>eps);
   if(Number.isFinite(start[field])&&Number.isFinite(post[field]))
    g[laterName]+=Number(post[field]-start[field]>eps);
  }
  g.energyDeployZeroAtStart+=Number(start.driverEnergyDeployKW===0);
  if(Number.isFinite(start.targetEnergyDeployKW)&&Number.isFinite(start.driverEnergyDeployKW))
   g.outputOfTargetHigherAtStart+=Number(start.driverEnergyDeployKW<start.targetEnergyDeployKW);
  g.driverStrategyChangedIn400ms+=Number(
   pre.driverStrategyName!==null&&post.driverStrategyName!==null&&
   pre.driverStrategyName!==post.driverStrategyName);
  individual.push({seed,attemptId:attack.attemptId,driver:row.driver,
   target:row.target,startMs:row.startMs,
   relativeClosingStartMps:start.relativeClosingSpeedMps,
   relativeClosingBeforeMps:pre.relativeClosingSpeedMps,
   relativeClosingAfterMps:post.relativeClosingSpeedMps,
   preAiState:pre.driverAiState,startAiState:start.driverAiState,
   postAiState:post.driverAiState,
   actualErsPreKW:pre.driverEnergyDeployKW,
   actualErsStartKW:start.driverEnergyDeployKW,
   actualErsPostKW:post.driverEnergyDeployKW,
   requestedErsPreKW:pre.driverErsRequestKW,
   requestedErsStartKW:start.driverErsRequestKW,
   requestedErsPostKW:post.driverErsRequestKW,
   result:attack.resultOfCurrentAttack,
   missingOffsets:missing,physicalMergeClearanceProven:false});
 }
 assert.equal(groups.nonpositiveStart.starts,old.byStartClosingSign.nonpositive.attempts);
 assert.equal(groups.positiveStart.starts,old.byStartClosingSign.positive.attempts);
 assert.equal(groups.nonpositiveStart.starts+groups.positiveStart.starts,real.rapidSameTargetRetries);
 for(const [name,g] of Object.entries(groups)){
  const previous=earlier.groups[name];
  assert.equal(g.knownPreStartPost,previous.preAndPostKnown);
  assert.equal(g.knownPreStartPost+g.unknownPreStartPost,g.starts);
  for(const key of offsets.map(String))
   assert.equal(g.samplesMissingAtOffset[key],previous.missingFramesByOffset[key]);
  assert(g.preToStartClosingImproved+g.preToStartClosingWorsened<=g.knownPreStartPost);
  assert(g.startToPostClosingImproved+g.startToPostClosingWorsened<=g.knownPreStartPost);
  if(name==='nonpositiveStart')
   assert.equal(g.changedToPositiveByPlus200ms+g.stillNonpositiveAtPlus200ms,g.knownPreStartPost);
 }
 cases.push({seed,groups,quickRetryStarts:real.rapidSameTargetRetries,
  auditedPreStartPostRows:individual,
  missingIntermediateFramesPermittedButExplicit:true,
  confirmedPhysicalPasses:race.physics.passes,collisionStops:0});
 console.log(JSON.stringify({phase:'R5-b150',status:'CASE_PASS',seed,
  preAndPostKnown:groups.nonpositiveStart.knownPreStartPost+
   groups.positiveStart.knownPreStartPost,
  priorFollowToPlan:groups.nonpositiveStart.switchedFromFollowToPlanAttackAtStart+
   groups.positiveStart.switchedFromFollowToPlanAttackAtStart,
  rapidConvertedByPost:groups.nonpositiveStart.changedToPositiveByPlus200ms}));
}
const result={phase:'R5-b150',status:'PASS',track:'majoku-ring-v1',
 sourceGenuineChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 noNewRaceInThisReport:true,readOnly:true,physicsChanged:false,
 temporalCooccurrenceIsNotCausation:true,aiBrakingRelaxationAuthorized:false,
 safePassingCorridorProven:false,
 limitations:[
  'The five fixed physics timestamps are observational, not a randomized experiment',
  'An ERS increase within the same 20ms interval is not proof it caused a speed change',
  'No classification proves that merging into an alternative lane was physically safe'
 ],cases};
fs.writeFileSync(dir+'b150-attack-transition-order.json',JSON.stringify(result,null,2));
