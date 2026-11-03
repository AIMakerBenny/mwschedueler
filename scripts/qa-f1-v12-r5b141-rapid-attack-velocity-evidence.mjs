// R5-b141 - recorded exact-20ms re-engagement speed, track gap, and outcome.
// Negative closing speed at the START does not imply a physics or AI fault.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=name=>JSON.parse(fs.readFileSync(dir+name,'utf8'));
const sourceRunEnv=process.env.MWS_F1_RACE_ARTIFACT_RUN_ID;
if(sourceRunEnv!==undefined)assert(/^[1-9][0-9]*$/.test(sourceRunEnv),
 'Invalid explicit original Chromium artifact run identifier');
const sourceRunId=sourceRunEnv===undefined?null:Number(sourceRunEnv);
const replay=read('replay.json');
const exact=read('b139-exact-retry-context.json');
const previous=read('b136-retry-provenance.json');
assert.equal(replay.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(exact.status,'PASS');
assert.equal(exact.safeLateralMergeProven,false);
assert.equal(previous.status,'PASS');
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const cases=[];
for(const pair of replay.pairs){
 const seed=pair.seed,race=read('seed'+seed+'-observed10.json');
 const evidence=exact.cases.find(c=>c.seed===seed);
 const earlier=previous.cases.find(c=>c.seed===seed);
 assert(evidence&&earlier&&race.status==='PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const led=race.real20ms?.attackLedger;
 assert(led&&!led.missingOverlap);
 const starts=new Map(led.events.filter(x=>x.type==='START').map(x=>[x.attemptId,x]));
 assert.equal(starts.size,led.totalStarts);
 const groups=Object.fromEntries(['positiveClosing','nonPositiveClosing'].map(name=>
  [name,{count:0,physicalSuccesses:0,priorDisengagements:0,
   reportedMergeBlockersAtStart:0,attemptsByTargetAiState:{},
   signedTrackGapsMeters:[],relativeSpeedsMps:[]}]));
 const unique=new Set();
 for(const w of evidence.rapidRetryWitnesses){
  assert(!unique.has(w.attemptId),'Duplicate quick retry witness');
  unique.add(w.attemptId);
  const original=starts.get(w.attemptId);
  assert(original);
  assert.equal(original.ms,w.startMs);
  assert.equal(original.driver,w.driver);
  assert.equal(original.target,w.target);
  assert.equal(original.retry,true);
  assert(w.fromPriorFinalEventMs>=0&&w.fromPriorFinalEventMs<=1000);
  assert(Number.isFinite(w.relativeClosingSpeedMps));
  assert(Number.isFinite(w.signedTargetAheadTrackMeters));
  assert(Math.abs(w.relativeClosingSpeedMps-
   (w.driverSpeedKph-w.targetSpeedKph)/3.6)<1e-8);
  assert.equal(w.safeLateralMergeProven,false);
  const k=w.relativeClosingSpeedMps>0?'positiveClosing':'nonPositiveClosing';
  const g=groups[k];g.count++;
  g.signedTrackGapsMeters.push(w.signedTargetAheadTrackMeters);
  g.relativeSpeedsMps.push(w.relativeClosingSpeedMps);
  g.physicalSuccesses+=Number(w.resultOfCurrentAttack==='SUCCESS');
  g.priorDisengagements+=Number(w.previousTerminalEvent==='DISENGAGED_UNCONFIRMED');
  g.reportedMergeBlockersAtStart+=Number(w.driverReportedMergeBlockers.length>0);
  const mode=w.targetAiState;
  g.attemptsByTargetAiState[mode]=(g.attemptsByTargetAiState[mode]||0)+1;
 }
 const median=a=>{
  const list=[...a].sort((a,b)=>a-b);
  return list.length?(list.length%2?list[(list.length-1)/2]:
   (list[list.length/2-1]+list[list.length/2])/2):null;
 };
 for(const g of Object.values(groups)){
  g.medianSignedTrackGapMeters=median(g.signedTrackGapsMeters);
  g.medianRelativeSpeedMps=median(g.relativeSpeedsMps);
  g.successPercent=g.count?100*g.physicalSuccesses/g.count:null;
  delete g.signedTrackGapsMeters;delete g.relativeSpeedsMps;
 }
 assert.equal(unique.size,evidence.rapidSameTargetRetries);
 assert.equal(unique.size,earlier.sameTargetRetryWithinOneSecond);
 assert.equal(groups.positiveClosing.count,evidence.rapidRetriesWithPositiveClosingSpeed);
 assert.equal(groups.nonPositiveClosing.count,evidence.rapidRetriesWithNonpositiveClosingSpeed);
 assert.equal(groups.positiveClosing.count+groups.nonPositiveClosing.count,unique.size);
 assert.equal(groups.positiveClosing.physicalSuccesses+
  groups.nonPositiveClosing.physicalSuccesses,evidence.rapidlyRetriedConfirmedPasses);
 const c={seed,rapidRetryStarts:unique.size,sourceStarts:led.totalStarts,
  exactFrameStarts:evidence.verifiedStartWitnessFrames,
  missingOtherStarts:evidence.unmatchedStartWitnesses,missingQuickRetryFrames:0,
  closingSpeedAtStart:groups,physicalPasses:race.physics.passes,
  collisionStops:race.physics.collisionStops,
  causalAiFaultProven:false,safeLaneProven:false};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b141',status:'CASE_PASS',seed,
  positive:groups.positiveClosing.count,
  nonpositive:groups.nonPositiveClosing.count,
  successesFromNonpositive:groups.nonPositiveClosing.physicalSuccesses}));
}
const result={phase:'R5-b141',status:'PASS',track:'majoku-ring-v1',
 sourceChromiumRun:sourceRunId,actualFullTenLapSeedCount:2,
 readOnly:true,gameEngineChanged:false,aiTuningAuthorized:false,
 causalEffectOfNegativeClosingSpeedNotProven:true,
 physicalCollisionClearanceNotProven:true,cases,
 limitations:[
  'Relative speed is measured at START, not a guaranteed later pass speed',
  'Target AI mode is descriptive and does not give priority or swept clearance',
  'Missing exact frames outside rapid retries remain missing and are not imputed'
 ]};
fs.writeFileSync(dir+'b141-rapid-attack-velocity-evidence.json',JSON.stringify(result,null,2));
