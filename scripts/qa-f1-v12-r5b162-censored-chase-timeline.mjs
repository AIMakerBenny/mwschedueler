// R5-b162: for real 1-second same-target retries, distinguish a physical
// sample recorded during the ORIGINAL attempt from an observation after
// the engine already terminated that attempt. Never extrapolate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const replay=read('replay.json'),end=read('b161-attack-terminal-censor.json');
const horizon=read('b159-long-horizon-follow-through.json');
const confirmed=read('b155-early-speed-vs-eventual-pass.json');
for(const r of [replay,end,horizon,confirmed])assert.equal(r.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const offsets=[1000,5000,10000,20000,40000,70000];
const create=offset=>({offsetMs:offset,quickRetries:0,
 actualFrameAvailable:0,actualFrameUnavailable:0,
 stillOriginalAttempt:0,terminatedBeforeOrAtOffset:0,
 originalAttemptAndFrameAvailable:0,originalAttemptAndFrameUnavailable:0,
 postTerminalPairFrameAvailable:0,opponentAttackingDuringOriginalAttempt:0,
 sameTargetAttackedDuringOriginalAttempt:0,originalAttemptGapShrank:0,
 originalAttemptGapExpanded:0,originalAttemptGapUnchanged:0,
 originalAttemptKnownGap:0,originalAttemptPositiveClosingSpeed:0,
 originalAttemptNonpositiveClosingSpeed:0,
 confirmedPhysicalCrossingByOffset:0});
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);assert.equal(race.physics.collisionStops,0);
 const ledger=race.real20ms?.attackLedger;
 assert(ledger&&ledger.missingOverlap===false);
 const source=new Map(ledger.longHorizonRetryAttempts.map(x=>[x.attemptId,x]));
 const ended=end.cases.find(c=>c.seed===seed);
 const observed=horizon.cases.find(c=>c.seed===seed);
 const passes=confirmed.cases.find(c=>c.seed===seed);
 assert(ended&&observed&&passes);
 const terminal=new Map(ended.rows.map(x=>[x.attemptId,x]));
 const original=new Map(passes.rows.map(x=>[x.attemptId,x]));
 const quickIds=new Set(observed.rows.map(x=>x.attemptId));
 assert.equal(quickIds.size,observed.rapidRetries);
 const timeline=Object.fromEntries(offsets.map(x=>[String(x),create(x)]));
 const rows=[];
 for(const id of quickIds){
  const trajectory=source.get(id),endRow=terminal.get(id),pass=original.get(id);
  assert(trajectory&&endRow&&pass);
  assert.equal(endRow.startMs,trajectory.startMs);
  assert.equal(endRow.terminalType,pass.eventualOutcome);
  const start=trajectory.samples['0'];assert(start?.available===true);
  const row={attemptId:id,driver:trajectory.driver,target:trajectory.target,
   startMs:trajectory.startMs,originalAttemptTerminalMs:endRow.terminalMs,
   originalAttemptTerminalType:endRow.terminalType,
   originalAttemptDurationMs:endRow.durationMs,
   eventuallyPhysicallyPassed:pass.eventualOutcome==='SUCCESS',
   offsets:{}};
  for(const offset of offsets){
   const sample=trajectory.samples[String(offset)],group=timeline[String(offset)];
   assert(sample&&sample.ms===trajectory.startMs+offset);
   const classification=endRow.offsetStatus[String(offset)];
   assert(classification&&classification.available===sample.available);
   group.quickRetries++;
   if(sample.available)group.actualFrameAvailable++;
   else group.actualFrameUnavailable++;
   const originalStillActive=classification.withinOriginalAttack;
   const alreadyEnded=classification.afterTerminal;
   assert(originalStillActive!==alreadyEnded);
   if(originalStillActive)group.stillOriginalAttempt++;
   if(alreadyEnded)group.terminatedBeforeOrAtOffset++;
   let gapDelta=null;
   if(originalStillActive){
    if(sample.available){
     group.originalAttemptAndFrameAvailable++;
     group.sameTargetAttackedDuringOriginalAttempt+=
      Number(sample.driverStillAttackingOriginalTarget);
     group.opponentAttackingDuringOriginalAttempt+=
      Number(sample.targetAiState==='PLAN_ATTACK');
     if(Number.isFinite(sample.relativeClosingSpeedMps)){
      if(sample.relativeClosingSpeedMps>0)group.originalAttemptPositiveClosingSpeed++;
      else group.originalAttemptNonpositiveClosingSpeed++;
     }
     if(Number.isFinite(sample.signedTrackProgressGapMeters)&&
      Number.isFinite(start.signedTrackProgressGapMeters)){
      gapDelta=sample.signedTrackProgressGapMeters-start.signedTrackProgressGapMeters;
      group.originalAttemptKnownGap++;
      group.originalAttemptGapShrank+=Number(gapDelta< -1e-7);
      group.originalAttemptGapExpanded+=Number(gapDelta>1e-7);
      group.originalAttemptGapUnchanged+=Number(Math.abs(gapDelta)<=1e-7);
     }
    }else group.originalAttemptAndFrameUnavailable++;
   }else if(sample.available)group.postTerminalPairFrameAvailable++;
   const crossed=pass.startToPhysicalCrossingSeconds!==null&&
    pass.startToPhysicalCrossingSeconds<=offset/1000;
   group.confirmedPhysicalCrossingByOffset+=Number(crossed);
   row.offsets[String(offset)]={sourceFrameAvailable:sample.available,
    originalAttemptStillActive:originalStillActive,
    terminalAlreadyReached:alreadyEnded,
    signedLongitudinalGapChangeDuringOriginalAttackMeters:gapDelta,
    observedPairAfterTerminalButNotSameAttempt:alreadyEnded&&sample.available,
    physicalCrossingAlreadyOccurred:crossed,
    validSafePassingLaneProven:false};
  }
  rows.push(row);
 }
 assert.equal(rows.length,observed.rapidRetries);
 assert.equal(rows.length,passes.quickRetryStarts);
 for(const g of Object.values(timeline)){
  assert.equal(g.quickRetries,rows.length);
  assert.equal(g.actualFrameAvailable+g.actualFrameUnavailable,rows.length);
  assert.equal(g.stillOriginalAttempt+g.terminatedBeforeOrAtOffset,rows.length);
  assert.equal(g.originalAttemptAndFrameAvailable+
   g.originalAttemptAndFrameUnavailable,g.stillOriginalAttempt);
  assert(g.originalAttemptGapShrank+g.originalAttemptGapExpanded+
   g.originalAttemptGapUnchanged===g.originalAttemptKnownGap);
  assert(g.postTerminalPairFrameAvailable<=g.terminatedBeforeOrAtOffset);
  assert(g.sameTargetAttackedDuringOriginalAttempt<=g.originalAttemptAndFrameAvailable);
 }
 const c={seed,quickRetries:rows.length,
  longHorizonSourceStarts:ledger.longHorizonRetryAttempts.length,
  timeline,rows,collisionStops:0,actualPhysicsPasses:race.physics.passes};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b162',status:'CASE_PASS',seed,
  quick:rows.length,activeAt1s:timeline['1000'].stillOriginalAttempt,
  activeAt10s:timeline['10000'].stillOriginalAttempt,
  activeAt40s:timeline['40000'].stillOriginalAttempt,
  afterTerminalVisibleAt70s:timeline['70000'].postTerminalPairFrameAvailable}));
}
const out={phase:'R5-b162',status:'PASS',track:'majoku-ring-v1',
 sourceActualChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 readOnly:true,gamePhysicsChanged:false,aiPatchAuthorized:false,
 safeSweptCollisionClearanceProven:false,postTerminalSamplesExcludedFromOriginalAttackStats:true,
 warning:'Pair coordinates observed after terminal cannot be credited to the original START, even if both drivers continue racing together.',
 cases};
fs.writeFileSync(dir+'b162-censored-chase-timeline.json',JSON.stringify(out,null,2));
