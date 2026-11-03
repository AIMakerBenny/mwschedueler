// R5-b123: terminal lifecycle of exact driver-target attack attempts,
// built from the engine's emitted events, never inferred from AI snapshots.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(root+n,'utf8'));
const attribution=read('b122-attack-attribution.json');
const replay=read('replay.json');
assert.equal(attribution.status,'PASS');
assert.equal(replay.status,'PASS');
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const terminal=['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED'];
const cases=[];
for(const pair of replay.pairs){
 const raw=read('seed'+pair.seed+'-observed10.json');
 const ledger=raw.real20ms?.attackLedger;
 assert(ledger&&!ledger.missingOverlap&&Array.isArray(ledger.events));
 const starts=ledger.events.filter(x=>x.type==='START');
 assert.equal(starts.length,ledger.totalStarts);
 const perAttempt=new Map(starts.map(e=>[e.attemptId,{
  id:e.attemptId,driver:e.driver,target:e.target,startMs:e.ms,
  retry:Boolean(e.retry),blocked:false,sideBySide:false,terminal:null,
  terminalMs:null,passCrossingMs:null
 }]));
 assert.equal(perAttempt.size,starts.length);
 for(const e of ledger.events){
  if(e.attemptId===null)continue;
  const a=perAttempt.get(e.attemptId);
  assert(a,'Lifecycle event missing its START');
  assert.equal(e.driver,a.driver);assert.equal(e.target,a.target);
  assert(e.ms>=a.startMs);
  if(e.type==='BLOCKED')a.blocked=true;
  if(e.type==='SIDE_BY_SIDE')a.sideBySide=true;
  if(terminal.includes(e.type)){
   assert.equal(a.terminal,null,'One attempt recorded multiple terminal outcomes');
   a.terminal=e.type;a.terminalMs=e.ms;
   if(e.type==='SUCCESS'){
    assert(Number.isInteger(e.crossingMs));
    a.passCrossingMs=e.crossingMs;
   }
  }
 }
 const lifecycle=[...perAttempt.values()].sort((a,b)=>a.id-b.id);
 const byOutcome=Object.fromEntries([...terminal,'ACTIVE_AT_RACE_FINISH'].map(x=>[x,0]));
 for(const a of lifecycle)byOutcome[a.terminal||'ACTIVE_AT_RACE_FINISH']++;
 assert.equal(Object.values(byOutcome).reduce((a,b)=>a+b,0),starts.length);
 const seedAttribution=attribution.cases.find(c=>c.seed===pair.seed);
 assert(seedAttribution);
 assert.equal(byOutcome.SUCCESS,seedAttribution.exactTargetAttemptSuccesses);
 assert.equal(starts.filter(e=>e.ms<=90000).length+
  starts.filter(e=>e.ms>90000).length,starts.length);
 const knownDrivers=new Set(raw.finishedRows.map(x=>x.id));
 assert.equal(knownDrivers.size,12);
 const byDriver=[...knownDrivers].sort().map(driver=>{
  const my=lifecycle.filter(x=>x.driver===driver);
  return {driver,starts:my.length,successes:my.filter(x=>x.terminal==='SUCCESS').length,
   blockedAttempts:my.filter(x=>x.blocked).length,
   targetChanges:my.filter(x=>x.terminal==='TARGET_CHANGED').length,
   pitInterrupted:my.filter(x=>x.terminal==='PIT_INTERRUPTED').length,
   disengagedUnconfirmed:my.filter(x=>x.terminal==='DISENGAGED_UNCONFIRMED').length,
   unresolvedAtFinish:my.filter(x=>x.terminal===null).length};
 });
 assert.equal(byDriver.reduce((n,x)=>n+x.starts,0),starts.length);
 assert.equal(byDriver.reduce((n,x)=>n+x.successes,0),byOutcome.SUCCESS);
 const successDurations=lifecycle.filter(x=>x.terminal==='SUCCESS')
  .map(x=>(x.terminalMs-x.startMs)/1000);
 assert(successDurations.every(x=>x>=0));
 const c={seed:pair.seed,attemptStarts:starts.length,
  startsFirst90s:starts.filter(x=>x.ms<=90000).length,
  startsAfter90s:starts.filter(x=>x.ms>90000).length,
  outcomes:byOutcome,
  attemptsWithBlockedObservation:lifecycle.filter(x=>x.blocked).length,
  attemptsWithSideBySideObservation:lifecycle.filter(x=>x.sideBySide).length,
  meanElapsedStartToSuccessSeconds:successDurations.length?
    successDurations.reduce((n,x)=>n+x,0)/successDurations.length:null,
  drivers:byDriver,physicsPassCount:raw.physics.passes,
  noInferredSafeLane:true};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b123',status:'CASE_PASS',seed:c.seed,
  starts:c.attemptStarts,outcomes:c.outcomes}));
}
const result={phase:'R5-b123',status:'PASS',track:'majoku-ring-v1',
 source:'Full engine attackLedger from actual 10-lap browser simulation',
 races:2,readOnly:true,livePhysicsChanges:false,aiChangesApproved:false,
 noAutomaticBalanceConclusion:true,cases,
 notes:['START means a concrete driver-target intent, not a confirmed crossing',
  'Only exact physical SUCCESS events count as an attributed successful attempt',
  'An incomplete attempt at finish is not necessarily an AI fault',
  'BLOCKED does not prove an alternate corridor could be safely entered']};
fs.writeFileSync(root+'b123-attempt-lifecycle.json',JSON.stringify(result,null,2));
