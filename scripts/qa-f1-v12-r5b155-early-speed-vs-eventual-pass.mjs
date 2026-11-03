// R5-b155: first 400ms of approaching speed is NOT a physical overtake.
// Reconcile full engine attempt events with 500ms-confirmed physical crossings,
// including delayed target change during the confirmation window.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=name=>JSON.parse(fs.readFileSync(dir+name,'utf8'));
const replay=read('replay.json'),quick=read('b139-exact-retry-context.json');
const gap=read('b153-gap-closure-vs-speed.json'),opponents=read('b154-opponent-attack-context.json');
for(const x of [replay,quick,gap,opponents])assert.equal(x.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const categories=['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED','ACTIVE_AT_RACE_FINISH'];
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);assert.equal(race.physics.collisionStops,0);
 const led=race.real20ms?.attackLedger;
 assert(led&&!led.missingOverlap);
 const q=quick.cases.find(x=>x.seed===seed);
 const g=gap.cases.find(x=>x.seed===seed);
 const o=opponents.cases.find(x=>x.seed===seed);
 assert(q&&g&&o);
 const source=new Map();
 for(const event of led.events){
  if(!Number.isInteger(event.attemptId))continue;
  if(!source.has(event.attemptId))source.set(event.attemptId,[]);
  source.get(event.attemptId).push(event);
 }
 const observed=new Map(g.rows.map(x=>[x.attemptId,x]));
 const outcomes=Object.fromEntries(categories.map(x=>[x,0]));
 let earlierBlockers=0,earlierSideBySide=0,confirmationTargetChanges=0;
 const crosses=[],passDelays=[],rows=[];
 for(const intent of q.rapidRetryWitnesses){
  const events=source.get(intent.attemptId);assert(events?.length&&events[0].type==='START');
  const start=events[0];
  assert.equal(start.ms,intent.startMs);
  assert.equal(start.driver,intent.driver);
  assert.equal(start.target,intent.target);
  assert.equal(start.retry,true);
  const types=new Set(events.map(x=>x.type));
  const outcome=types.has('SUCCESS')?'SUCCESS':
   categories.slice(1,-1).find(x=>types.has(x))||'ACTIVE_AT_RACE_FINISH';
  assert.equal(outcome,intent.resultOfCurrentAttack);
  outcomes[outcome]++;
  earlierBlockers+=Number(types.has('BLOCKED'));
  earlierSideBySide+=Number(types.has('SIDE_BY_SIDE'));
  const pass=events.find(x=>x.type==='SUCCESS')||null;
  const crossing=events.find(x=>x.type==='CROSSING')||null;
  assert.equal(Boolean(pass),outcome==='SUCCESS');
  assert.equal(Boolean(crossing),outcome==='SUCCESS');
  const gapWitness=observed.get(intent.attemptId);
  assert(gapWitness,'All quick retries must have actual -200ms and +200ms gap data');
  assert.equal(gapWitness.physicalConfirmedPass,outcome==='SUCCESS');
  let passingDelaySeconds=null,confirmationDelayMs=null;
  if(pass){
   assert(Number.isInteger(pass.crossingMs));
   assert(Number.isInteger(pass.ms));
   assert.equal(pass.crossingMs,crossing.crossingMs);
   assert.equal(crossing.ms,pass.crossingMs);
   assert(pass.ms>=pass.crossingMs);
   assert(pass.crossingMs>=start.ms);
   const changed=events.some(e=>e.type==='TARGET_CHANGED'&&
    e.ms>=crossing.ms&&e.ms<pass.ms);
   confirmationTargetChanges+=Number(changed);
   passingDelaySeconds=(crossing.ms-start.ms)/1000;
   confirmationDelayMs=pass.ms-pass.crossingMs;
   crosses.push(passingDelaySeconds);
   passDelays.push(confirmationDelayMs);
  }else{
   assert(!events.some(e=>e.type==='CROSSING'),
    'Crossing without confirmed pass must not be silently classified as failed');
  }
  rows.push({
   seed,attemptId:intent.attemptId,driver:intent.driver,target:intent.target,
   initialClosingSpeedMps:intent.relativeClosingSpeedMps,
   initial400msGapChangeMeters:gapWitness.preToPostGapChangeMeters,
   initialGapShrank:gapWitness.preToPostGapChangeMeters< -1e-7,
   initialGapExpanded:gapWitness.preToPostGapChangeMeters>1e-7,
   targetAiStateAtStart:intent.targetAiState,
   eventualOutcome:outcome,
   priorReportedBlocker:types.has('BLOCKED'),
   priorSideBySide:types.has('SIDE_BY_SIDE'),
   startToPhysicalCrossingSeconds:passingDelaySeconds,
   crossingToPhysicalConfirmationMilliseconds:confirmationDelayMs,
   physicallyProvenSafeAlternativeLane:false
  });
 }
 assert.equal(rows.length,q.rapidSameTargetRetries);
 assert.equal(rows.length,g.recordedRapidRetryStarts);
 assert.equal(Object.values(outcomes).reduce((a,b)=>a+b,0),rows.length);
 assert.equal(outcomes.SUCCESS,q.rapidlyRetriedConfirmedPasses);
 assert.equal(o.groups.opponentAttackingAtStart.successfulPhysicalOvertakes+
  o.groups.opponentNotAttackingAtStart.successfulPhysicalOvertakes,outcomes.SUCCESS);
 assert.equal(passDelays.length,outcomes.SUCCESS);
 assert(passDelays.every(x=>x>=0));
 const successWithInitiallyExpandingGap=rows.filter(x=>x.eventualOutcome==='SUCCESS'&&
  x.initialGapExpanded).length;
 const successWithInitiallyShrinkingGap=rows.filter(x=>x.eventualOutcome==='SUCCESS'&&
  x.initialGapShrank).length;
 const c={seed,quickRetryStarts:rows.length,outcomes,
  beforeFinalOutcomeBlockers:earlierBlockers,
  sideBySideObservations:earlierSideBySide,
  successWithInitiallyExpandingGap,
  successWithInitiallyShrinkingGap,
  successWithTargetChangedAfterCrossingBeforeConfirmation:confirmationTargetChanges,
  physicalCrossingDelaysSeconds:crosses,
  crossingConfirmationDelaysMs:passDelays,
  sameStepPassFromEarlyGapClosingNotAssumed:true,
  physicsPasses:race.physics.passes,collisionStops:0,rows};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b155',status:'CASE_PASS',seed,
  quick:rows.length,success:outcomes.SUCCESS,
  beforePhysicalCrossingSeconds:crosses,
  initialGapGrowingYetEventuallyPassed:successWithInitiallyExpandingGap,
  initiallyGapShrinkingAndEventuallyPassed:successWithInitiallyShrinkingGap}));
}
const report={phase:'R5-b155',status:'PASS',track:'majoku-ring-v1',
 sourceRealChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
  Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 sourceRealTenLapRaces:2,newChromiumRacesInThisCheck:0,readOnly:true,
 aiChangesAuthorized:false,physicalSweptCollisionClearanceProven:false,
 interpretation:[
  'A speed or gap improvement within 400ms is not a pass. Only the physical crossing plus engine confirmation is SUCCESS',
  'Some eventually successful attacks initially increased signed target gap',
  'One success is not an approval for unsafe lane entry or reduced collision braking'
 ],cases};
fs.writeFileSync(dir+'b155-early-speed-vs-eventual-pass.json',JSON.stringify(report,null,2));
