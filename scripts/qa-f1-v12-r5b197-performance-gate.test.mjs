import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateMatchedRaceGate} from './lib/f1-r5b197-performance-gate.mjs';
const measures=(passes,reorders)=>({passes,rankReorders:reorders,leaderChanges:12,
 collisionStops:0,starts:100,disengaged:60,targetChanged:30,quickRetries:8});
const pair=(p1=61,p2=41,r1=310,r2=256)=>[
 {seed:1,baseline:measures(46,287),previousR5b189:measures(61,310),modified:measures(p1,r1)},
 {seed:2,baseline:measures(32,280),previousR5b189:measures(41,256),modified:measures(p2,r2)},
];
test('real same-seed passing and ordering non-regression is accepted',()=>{
 const x=evaluateMatchedRaceGate(pair());
 assert.equal(x.accepted,true);assert.equal(x.after.passes,102);
});
test('R5-b193 actually observed loss of passes and rank reorders is rejected',()=>{
 const x=evaluateMatchedRaceGate(pair(48,38,272,249));
 assert.equal(x.accepted,false);assert.equal(x.checks.passesAtLeastR5b189,false);
 assert.equal(x.checks.rankReordersAtLeastR5b189,false);
});
test('physical collision stop always rejects even if overtakes rise',()=>{
 const d=pair(66,44,330,280);d[1].modified.collisionStops=1;
 assert.equal(evaluateMatchedRaceGate(d).accepted,false);
});
test('passing cannot fall below original in an individual seed',()=>{
 const x=evaluateMatchedRaceGate(pair(45,80,360,330));
 assert.equal(x.accepted,false);
 assert.equal(x.checks.eachSeedAtLeastOriginalPasses,false);
});
test('reject missing seed or unobserved counts rather than guessing',()=>{
 assert.throws(()=>evaluateMatchedRaceGate(pair().slice(0,1)));
 const d=pair();delete d[1].modified.passes;
 assert.throws(()=>evaluateMatchedRaceGate(d));
});
