// R5-b129 - actual 12-car, 10-lap attempt pair / retry frequency.
// Observational data only. Retries do not prove pathing or braking error.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=x=>JSON.parse(fs.readFileSync(dir+x,'utf8'));
const replay=read('replay.json'),baseline=read('b123-attempt-lifecycle.json');
assert.equal(replay.status,'PASS');
assert.equal(baseline.status,'PASS');
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const cases=[];
for(const pair of replay.pairs){
 const race=read('seed'+pair.seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const ledger=race.real20ms?.attackLedger;
 assert(ledger&&!ledger.missingOverlap);
 const starts=ledger.events.filter(x=>x.type==='START');
 assert.equal(starts.length,ledger.totalStarts);
 const eventsById=new Map();
 for(const event of ledger.events){
  if(!Number.isInteger(event.attemptId))continue;
  if(!eventsById.has(event.attemptId))eventsById.set(event.attemptId,[]);
  eventsById.get(event.attemptId).push(event);
 }
 const group=new Map(),seenAttempts=new Set();
 let retries=0;
 for(const s of starts){
  assert(!seenAttempts.has(s.attemptId),'Duplicated attempt identity');
  seenAttempts.add(s.attemptId);
  const key=s.driver+'|'+s.target,record=group.get(key)||
   {driver:s.driver,target:s.target,attempts:0,retries:0,successes:0,
    disengaged:0,targetChanged:0,pitInterrupted:0,blocked:0,sideBySide:0};
  record.attempts++;
  assert.equal(s.attemptNumber,record.attempts,
   'Actual engine driver-target retry ordinal changed');
  assert.equal(Boolean(s.retry),record.attempts>1);
  if(s.retry){retries++;record.retries++}
  const events=eventsById.get(s.attemptId)||[];
  assert(events.length&&events[0].type==='START');
  const types=new Set(events.map(e=>e.type));
  const outcome=types.has('SUCCESS')?'SUCCESS':
   ['TARGET_CHANGED','DISENGAGED_UNCONFIRMED','PIT_INTERRUPTED']
    .find(k=>types.has(k))||'ACTIVE';
  if(outcome==='SUCCESS')record.successes++;
  if(outcome==='DISENGAGED_UNCONFIRMED')record.disengaged++;
  if(outcome==='TARGET_CHANGED')record.targetChanged++;
  if(outcome==='PIT_INTERRUPTED')record.pitInterrupted++;
  if(types.has('BLOCKED'))record.blocked++;
  if(types.has('SIDE_BY_SIDE'))record.sideBySide++;
  group.set(key,record);
 }
 assert.equal(eventsById.size,starts.length);
 const ordered=[...group.values()].sort((a,b)=>b.attempts-a.attempts||
  a.driver.localeCompare(b.driver)||a.target.localeCompare(b.target));
 const old=baseline.cases.find(x=>x.seed===pair.seed);
 assert(old);
 assert.equal(old.attemptStarts,starts.length);
 assert.equal(ordered.reduce((n,x)=>n+x.attempts,0),starts.length);
 assert.equal(ordered.reduce((n,x)=>n+x.successes,0),old.outcomes.SUCCESS);
 assert.equal(ordered.reduce((n,x)=>n+x.disengaged,0),old.outcomes.DISENGAGED_UNCONFIRMED);
 assert.equal(ordered.reduce((n,x)=>n+x.targetChanged,0),old.outcomes.TARGET_CHANGED);
 assert.equal(ordered.reduce((n,x)=>n+x.pitInterrupted,0),old.outcomes.PIT_INTERRUPTED);
 assert.equal(retries,starts.length-ordered.length);
 assert.equal(ordered.reduce((n,x)=>n+x.blocked,0),old.attemptsWithBlockedObservation);
 const drivers=[...new Set(starts.map(x=>x.driver))].sort().map(driver=>{
  const rows=ordered.filter(x=>x.driver===driver);
  return {driver,uniqueTargets:rows.length,starts:rows.reduce((n,x)=>n+x.attempts,0),
   retries:rows.reduce((n,x)=>n+x.retries,0),
   successes:rows.reduce((n,x)=>n+x.successes,0)};
 });
 assert.equal(drivers.reduce((n,x)=>n+x.starts,0),starts.length);
 const result={seed:pair.seed,attemptStarts:starts.length,uniqueOrderedDriverTargetPairs:ordered.length,
  repeatAttempts:retries,repeatAttemptSharePercent:starts.length?100*retries/starts.length:0,
  largestPairAttemptCount:ordered[0]?.attempts||0,
  mostRepeatedPairs:ordered.slice(0,10),allPairs:ordered,drivers,
  physicalPasses:race.physics.passes,collisionStops:0};
 cases.push(result);
 console.log(JSON.stringify({phase:'R5-b129',status:'CASE_PASS',seed:pair.seed,
  attempts:starts.length,distinctPairs:ordered.length,repeats:retries,
  maxPerPair:result.largestPairAttemptCount}));
}
const report={phase:'R5-b129',status:'PASS',track:'majoku-ring-v1',
 genuineTenLapSource:true,sourceRun:41553183438,readOnly:true,
 liveGameChanged:false,sweptSafetyProven:false,aiBalanceCertified:false,
 interpretiveLimitations:['A repeated target is not proof of an unsafe or wasteful AI decision',
  'Each START is an engine-recorded exact driver-target attack intent',
  'A pass without a matching intent is not assigned retroactively'],cases};
fs.writeFileSync(dir+'b129-attack-pair-retries.json',JSON.stringify(report,null,2));
