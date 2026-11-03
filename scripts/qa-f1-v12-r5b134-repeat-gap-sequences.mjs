// R5-b134: derive real chronological intervals between attempts against
// the SAME driver-target, using recorded event timestamps, never guessing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const pairs=read('b129-attack-pair-retries.json'),first=read('b133-first-repeat-outcomes.json');
for(const v of [pairs,first])assert.equal(v.status,'PASS');
const outcomes=['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED','ACTIVE'];
const cases=[];
for(const seed of [1,2]){
 const r=read('seed'+seed+'-observed10.json');assert.equal(r.status,'PASS');
 const prior=pairs.cases.find(x=>x.seed===seed);
 const original=first.cases.find(x=>x.seed===seed);
 assert(prior&&original&&r.real20ms?.attackLedger);
 const allEvents=r.real20ms.attackLedger.events;
 const byId=new Map(),byPair=new Map();
 for(const e of allEvents){
  if(!Number.isInteger(e.attemptId))continue;
  if(!byId.has(e.attemptId))byId.set(e.attemptId,[]);
  byId.get(e.attemptId).push(e);
 }
 for(const start of allEvents.filter(e=>e.type==='START')){
  const ev=byId.get(start.attemptId);assert(ev?.length&&ev[0].type==='START');
  const kinds=new Set(ev.map(e=>e.type));
  const outcome=kinds.has('SUCCESS')?'SUCCESS':
   outcomes.slice(1,-1).find(k=>kinds.has(k))||'ACTIVE';
  const endMs=ev.at(-1).ms;
  assert(Number.isInteger(start.ms)&&Number.isInteger(endMs)&&endMs>=start.ms);
  const key=start.driver+'|'+start.target;
  if(!byPair.has(key))byPair.set(key,[]);
  byPair.get(key).push({attemptId:start.attemptId,startMs:start.ms,endMs,
   outcome,driver:start.driver,target:start.target,retry:!!start.retry});
 }
 const gaps=[],previousOutcomes=Object.fromEntries(outcomes.map(x=>[x,0]));
 const quick={within1s:0,within2s:0,within5s:0,
  within1sAfterDisengagement:0,within1sAfterTargetChange:0,
  within1sAfterSuccess:0,within1sAfterPitInterrupt:0,
  within1sBefore90s:0};
 const samples=[];
 for(const seq of byPair.values()){
  for(let i=0;i<seq.length;i++){
   assert.equal(seq[i].retry,i>0);
   if(i===0)continue;
   const previous=seq[i-1],next=seq[i],gapMs=next.startMs-previous.endMs;
   assert(gapMs>=0,'Repeated attack cannot begin before last prior attempt ended');
   assert(previousOutcomes[previous.outcome]!==undefined);
   previousOutcomes[previous.outcome]++;
   gaps.push(gapMs);
   if(gapMs<=1000){
    quick.within1s++;
    if(previous.outcome==='DISENGAGED_UNCONFIRMED')quick.within1sAfterDisengagement++;
    if(previous.outcome==='TARGET_CHANGED')quick.within1sAfterTargetChange++;
    if(previous.outcome==='SUCCESS')quick.within1sAfterSuccess++;
    if(previous.outcome==='PIT_INTERRUPTED')quick.within1sAfterPitInterrupt++;
    if(next.startMs<=90000)quick.within1sBefore90s++;
    if(samples.length<24)samples.push({driver:next.driver,target:next.target,
     previousOutcome:previous.outcome,previousAttemptId:previous.attemptId,
     nextAttemptId:next.attemptId,
     nextStartSeconds:next.startMs/1000,fromPreviousEndMs:gapMs});
   }
   if(gapMs<=2000)quick.within2s++;
   if(gapMs<=5000)quick.within5s++;
  }
 }
 assert.equal(gaps.length,prior.repeatAttempts);
 assert.equal(gaps.length,original.repeated.starts);
 assert(quick.within1s<=quick.within2s&&quick.within2s<=quick.within5s&&quick.within5s<=gaps.length);
 assert.equal(Object.values(previousOutcomes).reduce((n,x)=>n+x,0),gaps.length);
 assert.equal(quick.within1sAfterDisengagement+quick.within1sAfterTargetChange+
  quick.within1sAfterSuccess+quick.within1sAfterPitInterrupt,quick.within1s);
 gaps.sort((a,b)=>a-b);
 const median=gaps.length?(gaps.length%2?gaps[(gaps.length-1)/2]:
  (gaps[gaps.length/2-1]+gaps[gaps.length/2])/2):null;
 const result={seed,repeatAttempts:prior.repeatAttempts,orderedPairCount:prior.uniqueOrderedDriverTargetPairs,
  minimumGapMilliseconds:gaps[0]??null,medianGapMilliseconds:median,
  maximumGapMilliseconds:gaps.at(-1)??null,
  shortGapCounts:quick,previousOutcomesOfAllRetryStarts:previousOutcomes,
  earlyRaceQuickRetryEvents:samples,
  completedTenLapPhysicalPasses:r.physics.passes,collisionStops:r.physics.collisionStops};
 assert.equal(result.collisionStops,0);
 cases.push(result);
 console.log(JSON.stringify({phase:'R5-b134',status:'CASE_PASS',seed,
  retries:result.repeatAttempts,underOneSecond:quick.within1s,
  medianGapMs:median,afterDisengagement:quick.within1sAfterDisengagement}));
}
const result={phase:'R5-b134',status:'PASS',track:'majoku-ring-v1',
 sourceRun:41553183438,realRaceEvents:true,
 livePhysicsChanged:false,aiTuningAllowed:false,
 semantics:'Gap measures next exact-target START minus last event of previous attempt against the same target. It does not measure headway between vehicles.',
 limitation:'Rapid re-engagement can be legitimate; neither a short gap nor the previous state proves unsafe or unnecessary braking.',
 cases};
fs.writeFileSync(dir+'b134-repeat-gap-sequences.json',JSON.stringify(result,null,2));
