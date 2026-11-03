// R5-b171: independently audit original browser 20ms terminal evidence
// integrity and source coverage. No imputation, AI change or physical clearance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=name=>JSON.parse(fs.readFileSync(dir+name,'utf8'));
const replay=read('replay.json');
const context=read('b167-terminal-physical-context.json');
const contrast=read('b169-terminal-cause-contrast.json');
const transition=read('b170-preterminal-ai-transition.json');
for(const r of [replay,context,contrast,transition])assert.equal(r.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const types=new Set(['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED']);
const offsets=[-1000,-200,-20,0];
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);assert.equal(race.physics.collisionStops,0);
 const ledger=race.real20ms?.attackLedger;
 assert(ledger&&!ledger.missingOverlap);
 assert.equal(ledger.terminalEventAiCausalityProven,false);
 assert.deepEqual(ledger.terminalEventOffsetsMs,offsets);
 assert.equal(ledger.terminalEventSource,
  'accepted 20ms browser source frame or explicit unavailable');
 const starts=ledger.events.filter(x=>x.type==='START');
 const byStart=new Map(starts.map(x=>[x.attemptId,x]));
 assert.equal(byStart.size,starts.length);
 assert.equal(starts.length,ledger.totalStarts);
 const originalEvents=ledger.events.filter(e=>
  types.has(e.type)&&byStart.get(e.attemptId)?.retry===true);
 const recorded=ledger.terminalEventWitnesses;
 assert.equal(recorded.length,originalEvents.length);
 const observedKeys=new Map();
 const makeKey=(id,type,ms)=>[id,type,ms].join('|');
 for(const w of recorded){
  const start=byStart.get(w.attemptId);assert(start?.retry);
  assert.equal(w.driver,start.driver);assert.equal(w.target,start.target);
  assert.equal(w.attackStartMs,start.ms);
  assert(w.terminalMs>=start.ms);
  assert(types.has(w.terminalType));
  const key=makeKey(w.attemptId,w.terminalType,w.terminalMs);
  assert(!observedKeys.has(key),'Duplicate terminal event physical witness');
  observedKeys.set(key,w);
 }
 for(const e of originalEvents){
  const w=observedKeys.get(makeKey(e.attemptId,e.type,e.ms));
  assert(w,'Every real engine terminal event must be witnessed');
  assert.equal(w.driver,e.driver);assert.equal(w.target,e.target);
  assert.equal(w.engineOutcomeConfirmed,e.type==='SUCCESS');
  assert.equal(w.physicalSweptClearanceProven,false);
  assert.equal(w.causalAiFaultProven,false);
  if(e.type==='SUCCESS')assert.equal(w.engineCrossingMs,e.crossingMs);
 }
 const coverage=Object.fromEntries(offsets.map(ms=>[String(ms),{
  sourceEvents:recorded.length,actualSourceFrames:0,
  explicitUnavailableFrames:0,beforeStartOrRaceCount:0,
  unknownSourceValueCount:0
 }]));
 let crossingBeforeSuccessWithTargetChanged=0,unconfirmedCrossingInterrupts=0;
 const allByAttempt=new Map();
 for(const e of ledger.events){
  if(!Number.isSafeInteger(e.attemptId))continue;
  if(!allByAttempt.has(e.attemptId))allByAttempt.set(e.attemptId,[]);
  allByAttempt.get(e.attemptId).push(e);
 }
 for(const [id,events] of allByAttempt){
  if(!byStart.get(id)?.retry)continue;
  const crossing=events.find(e=>e.type==='CROSSING');
  const success=events.find(e=>e.type==='SUCCESS');
  if(crossing&&success){
   assert(success.ms>=crossing.ms);
   crossingBeforeSuccessWithTargetChanged+=Number(events.some(e=>
    e.type==='TARGET_CHANGED'&&e.ms>=crossing.ms&&e.ms<success.ms));
  }else if(crossing){
   assert(events.some(e=>['PIT_INTERRUPTED','TARGET_CHANGED','DISENGAGED_UNCONFIRMED'].includes(e.type)),
    'Unconfirmed crossing must not be credited as physical SUCCESS');
   unconfirmedCrossingInterrupts++;
  }
 }
 for(const w of recorded){
  for(const offset of offsets){
   const key=String(offset),m=w.offsetSamples[key];
   assert(m&&m.offsetMs===offset);
   assert.equal(m.ms,w.terminalMs+offset);
   assert.equal(typeof m.available,'boolean');
   const v=coverage[key];
   if(m.available){
    v.actualSourceFrames++;
    assert.equal(m.driver,w.driver);assert.equal(m.target,w.target);
    assert.equal(m.sweptBodyClearanceProven,false);
    assert.equal(m.causalEffectProven,false);
    for(const f of ['signedTrackProgressGapMeters','relativeClosingSpeedMps']){
     if(m[f]===null)v.unknownSourceValueCount++;
     else assert(Number.isFinite(m[f]),'Non-finite physical source '+f);
    }
   }else{
    v.explicitUnavailableFrames++;
    assert(['BEFORE_RACE_START','EXACT_ACCEPTED_20MS_FRAME_UNAVAILABLE'].includes(m.reason));
    v.beforeStartOrRaceCount+=Number(m.reason==='BEFORE_RACE_START');
   }
  }
 }
 for(const c of Object.values(coverage))assert.equal(
  c.actualSourceFrames+c.explicitUnavailableFrames,c.sourceEvents);
 const old=context.cases.find(x=>x.seed===seed);
 const c1=contrast.cases.find(x=>x.seed===seed);
 const c2=transition.cases.find(x=>x.seed===seed);
 assert(old&&c1&&c2);
 assert.equal(old.engineTerminalEventsFromTrueRetries,recorded.length);
 assert.equal(old.eventWitnesses,recorded.length);
 assert.equal(old.quickRetries,c1.rapidQuickRetryAttempts);
 assert.equal(old.quickRetries,c2.quickRetries);
 const finalReasonCounts=Object.fromEntries(
  ['DISENGAGED_UNCONFIRMED','TARGET_CHANGED','SUCCESS','PIT_INTERRUPTED'].map(
  type=>[type,c1.byTerminalReason[type].attempts]));
 assert.equal(Object.values(finalReasonCounts).reduce((a,b)=>a+b,0),old.quickRetries);
 for(const [type,count]of Object.entries(finalReasonCounts))
  assert.equal(count,c2.byReason[type].attempts);
 const c={seed,actualEngineStarts:starts.length,
  repeatedEngineStarts:starts.filter(x=>x.retry===true).length,
  totalTerminalEventsRecorded:recorded.length,
  certifiedTerminalSourceCoverage:coverage,
  rapidRetryStarts:old.quickRetries,
  rapidFinalTerminalCounts:finalReasonCounts,
  targetChangeAfterCrossingBeforeSuccess:crossingBeforeSuccessWithTargetChanged,
  crossingCancelledBeforeSuccess:unconfirmedCrossingInterrupts,
  collisionStops:race.physics.collisionStops,physicalPasses:race.physics.passes,
  noLateralClearanceInference:true,noCausalAiFinding:true};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b171',status:'CASE_PASS',seed,
  terminalEvents:c.totalTerminalEventsRecorded,
  sourceFramesAtMinus20:coverage['-20'].actualSourceFrames,
  missingTerminalFrames:coverage['0'].explicitUnavailableFrames,
  lateTargetChanges:crossingBeforeSuccessWithTargetChanged,
  unconfirmedCrossings:unconfirmedCrossingInterrupts}));
}
const result={phase:'R5-b171',status:'PASS',track:'majoku-ring-v1',
 sourceChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 oldOriginalRaces:2,readOnly:true,physicalRaceChanged:false,
 physicalClearanceProven:false,causalAiFaultProven:false,cases,
 limitations:[
  'Terminals after a CROSSING can contain intermediate target-change events',
  'An exact source frame at the terminal can reflect the post-decision mode',
  'Only missingness and event identity are audited; no change to AI or physics'
 ]};
fs.writeFileSync(dir+'b171-terminal-source-coverage.json',JSON.stringify(result,null,2));
