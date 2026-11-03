// R5-b151: physical quick-retry context grouped by genuine driver and exact
// target. Prevent broad conclusions from a few concentrated repeated pairs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='artifacts/r5-b77-majoku/';
const read=name=>JSON.parse(fs.readFileSync(root+name,'utf8'));
const replay=read('replay.json');
const basis=read('b139-exact-retry-context.json');
const recovery=read('b149-approach-recovery.json');
const order=read('b150-attack-transition-order.json');
const pairs=read('b129-attack-pair-retries.json');
for(const x of [replay,basis,recovery,order,pairs])assert.equal(x.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');
 assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const observed=basis.cases.find(x=>x.seed===seed);
 const converted=recovery.cases.find(x=>x.seed===seed);
 const timed=order.cases.find(x=>x.seed===seed);
 const all=pairs.cases.find(x=>x.seed===seed);
 assert(observed&&converted&&timed&&all);
 const trails=new Map(race.real20ms.attackLedger.startTrajectories.map(x=>[x.attemptId,x]));
 assert.equal(trails.size,race.real20ms.attackLedger.totalStarts);
 const groups=new Map(),drivers=new Map(),ids=new Set();
 const create=(key,driver,target)=>({
  key,driver,target,starts:0,nonpositiveAtStart:0,
  positiveAtStart:0,physicalSuccesses:0,
  preAndPostAvailable:0,closingSpeedImproved:0,
  closingTurnedPositiveByPost:0,
  reportedMergeBlockerAtStart:0
 });
 for(const e of observed.rapidRetryWitnesses){
  assert(!ids.has(e.attemptId));ids.add(e.attemptId);
  const key=e.driver+'|'+e.target;
  if(!groups.has(key))groups.set(key,create(key,e.driver,e.target));
  if(!drivers.has(e.driver))drivers.set(e.driver,{driver:e.driver,
   attempts:0,positiveClosing:0,nonpositiveClosing:0,physicalSuccesses:0,
   knownPrePost:0,closingSpeedImproved:0});
  const p=groups.get(key),d=drivers.get(e.driver);
  const negative=e.relativeClosingSpeedMps<=0;
  const result=e.resultOfCurrentAttack==='SUCCESS';
  p.starts++;d.attempts++;
  p.nonpositiveAtStart+=Number(negative);d.nonpositiveClosing+=Number(negative);
  p.positiveAtStart+=Number(!negative);d.positiveClosing+=Number(!negative);
  p.physicalSuccesses+=Number(result);d.physicalSuccesses+=Number(result);
  p.reportedMergeBlockerAtStart+=Number(e.driverReportedMergeBlockers.length>0);
  const t=trails.get(e.attemptId);assert(t);
  assert.equal(t.startMs,e.startMs);
  const before=t.offsetSamples['-200'],after=t.offsetSamples['200'];
  assert(before&&after);
  if(before.available&&after.available&&
   Number.isFinite(before.relativeClosingSpeedMps)&&
   Number.isFinite(after.relativeClosingSpeedMps)){
   p.preAndPostAvailable++;d.knownPrePost++;
   const improved=after.relativeClosingSpeedMps-before.relativeClosingSpeedMps>1e-8;
   p.closingSpeedImproved+=Number(improved);
   d.closingSpeedImproved+=Number(improved);
   p.closingTurnedPositiveByPost+=Number(negative&&after.relativeClosingSpeedMps>0);
  }
 }
 const byPair=[...groups.values()].sort((a,b)=>b.starts-a.starts||
  a.key.localeCompare(b.key));
 const byDriver=[...drivers.values()].sort((a,b)=>b.attempts-a.attempts||
  a.driver.localeCompare(b.driver));
 const sum=(list,field)=>list.reduce((n,x)=>n+x[field],0);
 assert.equal(sum(byPair,'starts'),observed.rapidSameTargetRetries);
 assert.equal(sum(byDriver,'attempts'),observed.rapidSameTargetRetries);
 assert.equal(sum(byPair,'nonpositiveAtStart'),converted.groups.nonpositiveStart.attempts);
 assert.equal(sum(byPair,'positiveAtStart'),converted.groups.positiveStart.attempts);
 assert.equal(sum(byPair,'physicalSuccesses'),observed.rapidlyRetriedConfirmedPasses);
 assert.equal(sum(byPair,'preAndPostAvailable'),
  timed.groups.positiveStart.knownPreStartPost+timed.groups.nonpositiveStart.knownPreStartPost);
 assert.equal(sum(byPair,'closingSpeedImproved'),
  converted.groups.positiveStart.closingImproved+converted.groups.nonpositiveStart.closingImproved);
 assert.equal(sum(byPair,'closingTurnedPositiveByPost'),
  timed.groups.nonpositiveStart.changedToPositiveByPlus200ms);
 assert(byPair.length<=all.uniqueOrderedDriverTargetPairs);
 assert(byDriver.length<=12);
 const maxPair=byPair[0]?.starts||0;
 const report={seed,quickRetryStarts:ids.size,
  distinctQuickRetryDriverTargetPairs:byPair.length,
  driversWithAtLeastOneQuickRetry:byDriver.length,
  maxQuickRetryCountSingleExactPair:maxPair,
  shareOfQuickRetriesFromLargestPairPercent:ids.size?100*maxPair/ids.size:null,
  distinctTargetsByDriver:byDriver.map(d=>({
   driver:d.driver,targets:byPair.filter(p=>p.driver===d.driver).length
  })),
  perDriver:byDriver,perExactDriverTargetPair:byPair,
  allTwelveRaceDrivers:12,physicalPasses:race.physics.passes,
  collisionStops:race.physics.collisionStops,
  sampleDoesNotProveGlobalAiBias:true,
  anySafeAlternativeLaneProven:false};
 cases.push(report);
 console.log(JSON.stringify({phase:'R5-b151',status:'CASE_PASS',seed,
  total:ids.size,distinctPairs:byPair.length,affectedDrivers:byDriver.length,
  largestPairCount:maxPair}));
}
const out={phase:'R5-b151',status:'PASS',track:'majoku-ring-v1',
 sourceRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 originalRaces:2,newBrowserRacesInThisScript:0,readOnly:true,
 physicsChanged:false,safeMergeClearanceProven:false,
 aiBalanceModificationAuthorized:false,cases,
 interpretation:[
  'Same-target quick-retry counts are conditioned on 0-1s re-engagements, not the full race',
  'An observed speed trend does not imply the adjacent lane was safe',
  'A small repeated driver-target sample cannot determine global AI overtake balance'
 ]};
fs.writeFileSync(root+'b151-attack-pair-concentration.json',JSON.stringify(out,null,2));
