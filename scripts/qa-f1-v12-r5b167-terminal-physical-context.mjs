// R5-b167: real 20ms physical and AI state just BEFORE each engine attempt
// terminates. An event's post-transition state is not automatically a cause.
// Treat a TARGET_CHANGED before the eventual SUCCESS as an intermediate event.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const replay=read('replay.json'),last=read('b161-attack-terminal-censor.json');
const durations=read('b163-terminal-reasons-by-driver.json');
const initial=read('b139-exact-retry-context.json');
for(const x of [replay,last,durations,initial])assert.equal(x.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const types=new Set(['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED']);
const offsets=[-1000,-200,-20,0];
const fresh=()=>({attempts:0,observedAtTerminal:0,missingAtTerminal:0,
 observedMinus20:0,observedMinus200DuringOriginalAttempt:0,
 missingMinus200DuringOriginalAttempt:0,pre200ToTerminalGapShrank:0,
 pre200ToTerminalGapExpanded:0,pre200ToTerminalGapUnchanged:0,
 pre200ToTerminalClosingSpeedImproved:0,pre200ToTerminalClosingSpeedWorsened:0,
 pre200ToTerminalClosingSpeedUnchanged:0,
 negativeClosingAtTerminal:0,positiveClosingAtTerminal:0,
 wasPlanAttack200msBeforeTerminal:0,wasFollow200msBeforeTerminal:0,
 wasPlanAttackAtTerminal:0,wasFollowAtTerminal:0,
 targetAlsoAttackingAtTerminal:0});
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);assert.equal(race.physics.collisionStops,0);
 const led=race.real20ms?.attackLedger;
 assert(led&&!led.missingOverlap);
 assert.deepEqual(led.terminalEventOffsetsMs,offsets);
 assert.equal(led.terminalEventAiCausalityProven,false);
 assert.equal(led.terminalEventSource,
  'accepted 20ms browser source frame or explicit unavailable');
 assert(Array.isArray(led.terminalEventWitnesses));
 const starts=new Map(led.events.filter(e=>e.type==='START').map(e=>[e.attemptId,e]));
 assert.equal(starts.size,led.totalStarts);
 const expected=led.events.filter(e=>types.has(e.type)&&starts.get(e.attemptId)?.retry===true);
 const witness=led.terminalEventWitnesses;
 assert.equal(witness.length,expected.length,
  'Each real terminal event of a retry must preserve its own witness');
 const byKey=new Map();
 const key=e=>e.attemptId+'|'+(e.terminalType||e.type)+'|'+(e.terminalMs??e.ms);
 for(const w of witness){
  const k=key(w);assert(!byKey.has(k),'Duplicate terminal event identity');
  byKey.set(k,w);
  const origin=starts.get(w.attemptId);assert(origin?.retry);
  assert.equal(w.attackStartMs,origin.ms);
  assert.equal(w.driver,origin.driver);
  assert.equal(w.target,origin.target);
  assert.equal(w.engineOutcomeConfirmed,w.terminalType==='SUCCESS');
  assert.equal(w.physicalSweptClearanceProven,false);
  assert.equal(w.causalAiFaultProven,false);
  assert(w.terminalMs>=w.attackStartMs);
  for(const off of offsets){
   const sample=w.offsetSamples?.[String(off)];
   assert(sample&&sample.ms===w.terminalMs+off);
   assert.equal(sample.offsetMs,off);
   assert.equal(typeof sample.available,'boolean');
   if(sample.available){
    assert.equal(sample.driver,w.driver);assert.equal(sample.target,w.target);
    assert.equal(sample.sweptBodyClearanceProven,false);
    assert.equal(sample.causalEffectProven,false);
    for(const field of ['signedTrackProgressGapMeters','relativeClosingSpeedMps',
     'driverBatteryMJ','targetBatteryMJ','driverEnergyDeployKW',
     'targetEnergyDeployKW','driverTyreWearFraction']){
      assert(sample[field]===null||Number.isFinite(sample[field]));
    }
   }else assert(['BEFORE_RACE_START','EXACT_ACCEPTED_20MS_FRAME_UNAVAILABLE']
    .includes(sample.reason));
  }
 }
 for(const e of expected){
  const match=byKey.get(key(e));assert(match,'Source terminal event not witnessed');
  assert.equal(match.terminalMs,e.ms);
  if(e.type==='SUCCESS')assert.equal(match.engineCrossingMs,e.crossingMs);
 }
 const end=last.cases.find(x=>x.seed===seed);
 const d=durations.cases.find(x=>x.seed===seed);
 const q=initial.cases.find(x=>x.seed===seed);
 assert(end&&d&&q);
 const terminalRows=new Map(end.rows.map(x=>[x.attemptId,x]));
 const quickIds=new Set(d.rows.map(x=>x.attemptId));
 assert.equal(quickIds.size,q.rapidSameTargetRetries);
 const categories=Object.fromEntries([...types].map(t=>[t,fresh()]));
 const rows=[];
 for(const attemptId of quickIds){
  const endRow=terminalRows.get(attemptId);assert(endRow);
  assert(types.has(endRow.terminalType));
  const w=byKey.get(attemptId+'|'+endRow.terminalType+'|'+endRow.terminalMs);
  assert(w,'Must observe the actual engine-selected final result, not a prior TARGET_CHANGED');
  const t=w.offsetSamples['0'],pre=w.offsetSamples['-200'],pre20=w.offsetSamples['-20'];
  const g=categories[endRow.terminalType];g.attempts++;
  g.observedAtTerminal+=Number(t.available);
  g.missingAtTerminal+=Number(!t.available);
  g.observedMinus20+=Number(pre20.available&&pre20.ms>=w.attackStartMs);
  const within=pre.ms>=w.attackStartMs;
  let gapDelta=null,speedDelta=null;
  if(within){
   if(pre.available)g.observedMinus200DuringOriginalAttempt++;
   else g.missingMinus200DuringOriginalAttempt++;
  }
  if(t.available){
   if(Number.isFinite(t.relativeClosingSpeedMps)){
    g.negativeClosingAtTerminal+=Number(t.relativeClosingSpeedMps<=0);
    g.positiveClosingAtTerminal+=Number(t.relativeClosingSpeedMps>0);
   }
   g.wasPlanAttackAtTerminal+=Number(t.driverAiState==='PLAN_ATTACK');
   g.wasFollowAtTerminal+=Number(t.driverAiState==='FOLLOW');
   g.targetAlsoAttackingAtTerminal+=Number(t.targetAiState==='PLAN_ATTACK');
  }
  if(within&&pre.available&&t.available){
   g.wasPlanAttack200msBeforeTerminal+=Number(pre.driverAiState==='PLAN_ATTACK');
   g.wasFollow200msBeforeTerminal+=Number(pre.driverAiState==='FOLLOW');
   if(Number.isFinite(pre.signedTrackProgressGapMeters)&&
    Number.isFinite(t.signedTrackProgressGapMeters)){
    gapDelta=t.signedTrackProgressGapMeters-pre.signedTrackProgressGapMeters;
    g.pre200ToTerminalGapShrank+=Number(gapDelta< -1e-7);
    g.pre200ToTerminalGapExpanded+=Number(gapDelta>1e-7);
    g.pre200ToTerminalGapUnchanged+=Number(Math.abs(gapDelta)<=1e-7);
   }
   if(Number.isFinite(pre.relativeClosingSpeedMps)&&
    Number.isFinite(t.relativeClosingSpeedMps)){
    speedDelta=t.relativeClosingSpeedMps-pre.relativeClosingSpeedMps;
    g.pre200ToTerminalClosingSpeedImproved+=Number(speedDelta>1e-8);
    g.pre200ToTerminalClosingSpeedWorsened+=Number(speedDelta< -1e-8);
    g.pre200ToTerminalClosingSpeedUnchanged+=Number(Math.abs(speedDelta)<=1e-8);
   }
  }
  rows.push({seed,attemptId,driver:w.driver,target:w.target,
   actualTerminalType:w.terminalType,actualTerminalMs:w.terminalMs,
   originalAttemptStartedMs:w.attackStartMs,
   last20msSourceAvailable:pre20.available&&pre20.ms>=w.attackStartMs,
   last200msSourceAvailable:pre.available&&within,
   exactTerminalSourceAvailable:t.available,
   terminalAiState:t.available?t.driverAiState:null,
   preTerminalAiState:pre.available&&within?pre.driverAiState:null,
   opponentAiAtTerminal:t.available?t.targetAiState:null,
   last200msSignedGapChangeMeters:gapDelta,
   last200msRelativeClosingSpeedChangeMps:speedDelta,
   lastInstantClosingSpeedMps:t.available?t.relativeClosingSpeedMps:null,
   safeAlternativeLaneEstablished:false,
   speedDropExplainsDisengagementCausally:false});
 }
 assert.equal(rows.length,q.rapidSameTargetRetries);
 assert.equal(rows.length,d.rapidRepeatAttemptStarts);
 assert.equal(rows.length,seed===1?22:18);
 assert.equal(Object.values(categories).reduce((a,b)=>a+b.attempts,0),rows.length);
 for(const [name,g]of Object.entries(categories)){
  assert.equal(g.observedAtTerminal+g.missingAtTerminal,g.attempts);
  assert(g.observedMinus200DuringOriginalAttempt+
   g.missingMinus200DuringOriginalAttempt<=g.attempts);
  assert(g.pre200ToTerminalGapShrank+g.pre200ToTerminalGapExpanded+
   g.pre200ToTerminalGapUnchanged<=g.observedMinus200DuringOriginalAttempt);
  assert(g.pre200ToTerminalClosingSpeedImproved+g.pre200ToTerminalClosingSpeedWorsened+
   g.pre200ToTerminalClosingSpeedUnchanged<=g.observedMinus200DuringOriginalAttempt);
  assert.equal(g.attempts,d.terminalReasonCounts[name]||0);
 }
 const c={seed,engineTerminalEventsFromTrueRetries:expected.length,
  eventWitnesses:witness.length,quickRetries:rows.length,terminalCategories:categories,
  missingOrPartialSourceFramesMayExist:true,rows,
  collisionStops:race.physics.collisionStops,
  physicalPasses:race.physics.passes};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b167',status:'CASE_PASS',seed,
  engineTerminalEvents:expected.length,quick:rows.length,
  disengage:categories.DISENGAGED_UNCONFIRMED.attempts,
  targetChanged:categories.TARGET_CHANGED.attempts,
  observedBeforeDisengagement:categories.DISENGAGED_UNCONFIRMED.observedMinus200DuringOriginalAttempt,
  missingAtEnd:categories.DISENGAGED_UNCONFIRMED.missingAtTerminal}));
}
const result={phase:'R5-b167',status:'PASS',track:'majoku-ring-v1',
 sourceChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 originalTrue10LapRaces:2,readOnly:true,enginePhysicsChanged:false,
 causalBrakingFaultProven:false, safeLateralMergeProven:false,
 limitation:'A terminal state and its previous speed and gap are measured facts, but cannot establish why the AI disengaged or whether another path was safe.',
 cases};
fs.writeFileSync(dir+'b167-terminal-physical-context.json',JSON.stringify(result,null,2));
