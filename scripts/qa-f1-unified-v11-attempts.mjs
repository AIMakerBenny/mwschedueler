// Actual v1.1 AI-target-at-decision/committed-step attempt ledger QA.
// This intentionally does not classify a disengagement as a proven loss.
import assert from 'node:assert/strict';
import {setup,engine} from './f1-unified-v11-fixture.mjs';

const trial=reverse=>new Function(setup+engine+`
unifiedInitV11();if(${reverse})raceMotionV189.vehicles.reverse();
let ticks=0;
for(let k=0;k<6000;k++){if(!simulateUnifiedRaceStepV11(20))break;ticks++;}
return {ticks,events:unifiedStateV11.attemptHistory.map(e=>({...e})),
 active:[...unifiedStateV11.attempts].sort((a,b)=>a[0].localeCompare(b[0])),
 starts:unifiedStateV11.attemptSequence,passes:unifiedStateV11.telemetry.passes.length,
 rawCrossings:unifiedStateV11.telemetry.rawCrossings.map(x=>({...x})),
 errors:unifiedStateV11.telemetry.invalid};`)();
const regular=trial(false),reversed=trial(true);
assert.deepEqual(reversed,regular,'Attempt ledger depends on vehicle array iteration order');
assert.equal(regular.ticks,6000);assert.deepEqual(regular.errors,[]);
const byType={};for(const e of regular.events)byType[e.type]=(byType[e.type]||0)+1;
for(const type of ['START','BLOCKED','DISENGAGED_UNCONFIRMED','SIDE_BY_SIDE'])
 assert((byType[type]||0)>0,'Missing committed active AI transition: '+type);
assert(regular.events.some(e=>e.type==='START'&&e.retry===true),'No target-specific retry observed');
assert.equal(byType.START,regular.starts,'Duplicate or lost attempt openings');
assert.equal((byType.SUCCESS||0)+(byType.UNATTRIBUTED_PASS||0),regular.passes,
 'Confirmed overtake not classified without invention');
assert((byType.SUCCESS||0)>0,'Real physical passes were not linked to recorded attempts');
const openings=new Map(regular.events.filter(e=>e.type==='START').map(e=>[e.attemptId,e]));
for(const success of regular.events.filter(e=>e.type==='SUCCESS')){
 const initial=openings.get(success.attemptId);
 assert(initial,'Success was credited to an attempt that never opened');
 assert.equal(initial.driver,success.driver);assert.equal(initial.target,success.target);
 assert(regular.events.some(e=>e.type==='CROSSING'&&e.attemptId===success.attemptId&&
   e.crossingMs===success.crossingMs),'Success lacks a frozen physical crossing');
 assert(regular.rawCrossings.some(e=>e.front===success.driver&&
   e.pair===[success.driver,success.target].sort().join('|')&&
   Math.abs(e.t*1000-success.crossingMs)<=21),'Attribution is missing a real physical reversal');
}

const started=new Map();
for(const event of regular.events){
 if(event.type==='START'){
   assert(event.target&&event.driver!==event.target);
   assert(!started.has(event.attemptId),'Duplicate attempt ID');
   started.set(event.attemptId,event);
 }else if(event.type!=='UNATTRIBUTED_PASS'){
   assert(started.has(event.attemptId),'Non-start event has no committed opening');
   const origin=started.get(event.attemptId);
   assert.equal(event.driver,origin.driver);assert.equal(event.target,origin.target);
 }
}
const staged=new Function(setup+engine+`
unifiedInitV11();const v=raceMotionV189.vehicles[0];
const before=JSON.stringify({s:v.raceProgress,y:v.unifiedYV11,v:v.speedKph,rng:v.unifiedRngV11});
v.unifiedAiTargetV11='1';v.unifiedAiStateV11='PLAN_ATTACK';unifiedObserveAttackV11(20,[]);
v.unifiedAiStateV11='EXIT_DUEL';v.unifiedMergeBlockedV11=['1'];unifiedObserveAttackV11(40,[]);
v.unifiedAiStateV11='FOLLOW';unifiedObserveAttackV11(60,[]);
v.unifiedAiStateV11='PLAN_ATTACK';unifiedObserveAttackV11(80,[]);
const frozen={...unifiedStateV11.attempts.get('0')};
unifiedObserveAttackV11(100,[{front:'0',passed:'1',t:.08,crossingAttempt:frozen}],
 [{ms:80,front:'0',passed:'1',attempt:frozen}]);
return {events:unifiedStateV11.attemptHistory,
 unchanged:before===JSON.stringify({s:v.raceProgress,y:v.unifiedYV11,v:v.speedKph,rng:v.unifiedRngV11}),
 active:unifiedStateV11.attempts.size};`)();
assert.deepEqual(staged.events.map(e=>e.type),
 ['START','BLOCKED','DISENGAGED_UNCONFIRMED','START','CROSSING','SUCCESS']);
assert.equal(staged.events[3].retry,true);
assert.equal(staged.events[4].attemptId,staged.events[3].attemptId);
assert.equal(staged.events[5].attemptId,staged.events[3].attemptId);
assert(staged.unchanged);assert.equal(staged.active,0);
const rejection=new Function(setup+engine+`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,2);const [a,b]=raceMotionV189.vehicles;
b.raceProgress=1+3/5280;b.startOffset=b.raceProgress;a.pitState='PIT_BOX';a.pitBoxTimerMs=1000;
unifiedInitV11();const ok=simulateUnifiedRaceStepV11(20);
return {ok,events:unifiedStateV11.attemptHistory.length,starts:unifiedStateV11.attemptSequence};`)();
assert.equal(rejection.ok,false);assert.equal(rejection.events,0);assert.equal(rejection.starts,0);
console.log(JSON.stringify({result:'PASS',simulatedSeconds:120,vehicles:12,
 attempts:regular.starts,confirmedOvertakes:regular.passes,eventTypes:byType,
 activeAtEnd:regular.active.length,targetAware:true,inputOrderIndependent:true,
 controlledSuccessAndRetry:true,frozenCrossingAttribution:true,failedStepAtomic:true,
 note:'DISENGAGED_UNCONFIRMED is not automatically a lost duel. Unattributed physical passes remain explicit.'},null,2));
