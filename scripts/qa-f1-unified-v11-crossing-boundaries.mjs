// Crossing-time attack attribution boundaries: historical attempt ownership,
// new-attack survival, no invented success, deterministic order and pure physics.
import assert from 'node:assert/strict';
import {setup,engine} from './f1-unified-v11-fixture.mjs';
const scenario=reverse=>new Function(setup+engine+`
unifiedInitV11();
const cars=raceMotionV189.vehicles.slice(0,3);
if(${reverse})raceMotionV189.vehicles.reverse();
const driver=cars[0],opponent=cars[1],other=cars[2];
const physical=()=>JSON.stringify(cars.map(v=>({
 id:v.id,s:v.raceProgress,y:v.unifiedYV11,v:v.speedKph,E:v.batteryMJ,rng:v.unifiedRngV11
})).sort((a,b)=>a.id.localeCompare(b.id)));
const initial=physical();
driver.unifiedAiStateV11='PLAN_ATTACK';driver.unifiedAiTargetV11=String(opponent.id);
unifiedObserveAttackV11(20,[]);
const first={...unifiedStateV11.attempts.get(String(driver.id))};
unifiedObserveAttackV11(40,[],[{ms:40,front:String(driver.id),passed:String(opponent.id),attempt:first}]);
// Before the 500ms crossing confirmation, the AI changes opponents.
driver.unifiedAiTargetV11=String(other.id);unifiedObserveAttackV11(60,[]);
driver.unifiedAiStateV11='FOLLOW';unifiedObserveAttackV11(80,[]);
driver.unifiedAiStateV11='PLAN_ATTACK';unifiedObserveAttackV11(100,[]);
const second={...unifiedStateV11.attempts.get(String(driver.id))};
// Settlement must award the frozen first attempt, leaving the newer attempt live.
unifiedObserveAttackV11(540,[{front:String(driver.id),passed:String(opponent.id),t:.04,crossingAttempt:first}],[]);
const stillActive={...unifiedStateV11.attempts.get(String(driver.id))};
// Unrelated physical pass must never steal the second attempt.
unifiedObserveAttackV11(560,[{front:String(driver.id),passed:'not-target',t:.55,crossingAttempt:null}],[]);
return {first,second,stillActive,events:unifiedStateV11.attemptHistory,
 before:initial,after:physical(),clock:simClockV192.simTimeMs,steps:unifiedStateV11.telemetry.steps,
 vehicleOrder:raceMotionV189.vehicles.map(v=>v.id)};
`)();
const base=scenario(false),reversed=scenario(true);
const {vehicleOrder:_orderA,...a}=base,{vehicleOrder:_orderB,...b}=reversed;
assert.deepEqual(a,b,'Crossing ownership changes with vehicle enumeration order');
assert(a.first.id!==a.second.id,'New opponent retained the old attempt id');
assert.deepEqual(a.stillActive,a.second,'Frozen older success removed the newer attempt');
assert.equal(a.before,a.after,'Passive ledger mutated committed physical fields');
assert.equal(a.clock,0);assert.equal(a.steps,0);
assert.deepEqual(a.events.map(e=>e.type),
 ['START','CROSSING','TARGET_CHANGED','START','SUCCESS','UNATTRIBUTED_PASS']);
const success=a.events.find(e=>e.type==='SUCCESS');
assert.equal(success.attemptId,a.first.id);
assert.equal(success.crossingMs,40);
assert.equal(a.events.find(e=>e.type==='UNATTRIBUTED_PASS').attemptId,null);
assert(a.events.every(e=>e.ms>=20&&e.ms<=560));
console.log(JSON.stringify({result:'PASS',crossingId:a.first.id,
 newerAttemptId:a.second.id,newerSurvived:true,unattributedNotClaimed:true,
 physicalStateUnchanged:true,orderIndependent:true,eventTypes:a.events.map(e=>e.type)}));
