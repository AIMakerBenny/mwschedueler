// R5-b161 - actual engine attempt terminal boundary: never count a
// post-termination frame as continuing the same attack, even if the
// observer still sees the same pair of drivers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const replay=read('replay.json'),baseline=read('b123-attempt-lifecycle.json');
const physical=read('b155-early-speed-vs-eventual-pass.json');
for(const f of [replay,baseline,physical])assert.equal(f.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const offsets=[0,1000,5000,10000,20000,40000,70000];
const terminals=['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED','ACTIVE_AT_RACE_FINISH'];
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');assert.equal(race.mode,'NORMAL');
 assert.equal(race.laps,10);assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const ledger=race.real20ms?.attackLedger;assert(ledger&&!ledger.missingOverlap);
 assert.deepEqual(ledger.longHorizonOffsetsMs,offsets);
 const starts=ledger.events.filter(e=>e.type==='START');
 const repeated=starts.filter(e=>e.retry===true);
 const traces=ledger.longHorizonRetryAttempts;
 assert.equal(traces.length,repeated.length);
 const byId=new Map(),byTrace=new Map(traces.map(t=>[t.attemptId,t]));
 assert.equal(byTrace.size,traces.length);
 for(const event of ledger.events){
  if(!Number.isInteger(event.attemptId))continue;
  if(!byId.has(event.attemptId))byId.set(event.attemptId,[]);
  byId.get(event.attemptId).push(event);
 }
 const counts=Object.fromEntries(terminals.map(t=>[t,0]));
 const rows=[];let lateTargetChangePreserved=0,missingEndEvent=0;
 for(const start of repeated){
  const events=byId.get(start.attemptId),tr=byTrace.get(start.attemptId);
  assert(events?.length&&events[0].type==='START');
  assert(tr&&tr.startMs===start.ms&&tr.driver===start.driver&&tr.target===start.target);
  const success=events.find(e=>e.type==='SUCCESS');
  const crossing=events.find(e=>e.type==='CROSSING');
  const observedChanges=events.filter(e=>e.type==='TARGET_CHANGED');
  let type,terminal=null;
  if(success){
   assert(crossing&&success.crossingMs===crossing.ms);
   assert(success.ms>=crossing.ms);
   terminal=success;type='SUCCESS';
   lateTargetChangePreserved+=Number(observedChanges.some(e=>
    e.ms>=crossing.ms&&e.ms<success.ms));
  }else{
   assert(!crossing,'CROSSING without confirmed terminal SUCCESS requires separate evaluation');
   terminal=events.find(e=>['DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED'].includes(e.type))||null;
   type=terminal?.type||'ACTIVE_AT_RACE_FINISH';
  }
  counts[type]++;
  const endMs=terminal?.ms??null;
  if(endMs===null)missingEndEvent++;
  else assert(Number.isSafeInteger(endMs)&&endMs>=start.ms);
  const offsetStatus={};
  for(const off of offsets){
   const s=tr.samples[String(off)];assert(s&&s.ms===start.ms+off);
   assert.equal(typeof s.available,'boolean');
   const afterTerminal=endMs!==null&&s.ms>=endMs&&off!==0;
   const withinCurrentAttempt=!afterTerminal&&(endMs===null||s.ms<endMs||off===0);
   offsetStatus[String(off)]={available:s.available,
    withinOriginalAttack:withinCurrentAttempt,afterTerminal,
    reason:s.available?null:s.reason};
  }
  rows.push({attemptId:start.attemptId,driver:start.driver,target:start.target,
   startMs:start.ms,terminalType:type,terminalMs:endMs,
   durationMs:endMs===null?null:endMs-start.ms,
   confirmedPhysicalCrossingMs:crossing?.ms??null,
   offsetStatus,safeLaneProven:false});
 }
 assert.equal(rows.length,repeated.length);
 assert.equal(Object.values(counts).reduce((x,y)=>x+y,0),rows.length);
 const historical=baseline.cases.find(c=>c.seed===seed);assert(historical);
 assert.equal(ledger.totalStarts,historical.attemptStarts);
 assert.equal(rows.length,historical.retryAttempts??rows.length);
 const original=physical.cases.find(c=>c.seed===seed);assert(original);
 const quickIds=new Set(original.rows.map(x=>x.attemptId));
 assert.equal(quickIds.size,original.quickRetryStarts);
 for(const x of quickIds)assert(rows.some(r=>r.attemptId===x));
 const c={seed,retryStarts:repeated.length,terminalCounts:counts,
  unresolvedTerminalEvents:missingEndEvent,
  lateTargetChangesAfterCrossingPreserved:lateTargetChangePreserved,
  quickRetries:quickIds.size,rows,physicalPasses:race.physics.passes,collisionStops:0};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b161',status:'CASE_PASS',seed,
  retries:c.retryStarts,terminalCounts:counts,
  preservedLateTargetChanges:lateTargetChangePreserved}));
}
const out={phase:'R5-b161',status:'PASS',track:'majoku-ring-v1',
 sourceBrowserRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 readOnly:true,physicsChanged:false,aiPatchAuthorized:false,
 postTerminalPairObservationsCannotBeOriginalAttack:true,
 safeSweptClearanceProven:false,cases};
fs.writeFileSync(dir+'b161-attack-terminal-censor.json',JSON.stringify(out,null,2));
