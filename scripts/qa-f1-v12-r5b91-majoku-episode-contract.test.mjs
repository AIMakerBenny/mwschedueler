// R5-b91 mutation tests: a forged candidate streak must never pass as genuine.
import assert from 'node:assert/strict';
import test from 'node:test';
import {assertMajokuFollow400ms} from './lib/f1-r5b91-episode-guards.mjs';
const witness=()=>({
 firstFrameTick:101,lastFrameTick:120,physicsStepMs:20,consecutiveFrames:20,
 leaderId:'a',followerId:'b',endSimMs:2400,
 gapMeters:20,relativeSpeedMps:3,aiState:'FOLLOW',
 candidateCount:1,reportedMergeBlockers:0,
 sweptClearanceProven:false,mergeReservationClearanceProven:false,
 consecutive20msFrames:Array.from({length:20},(_,i)=>({
  tick:101+i,leaderId:'a',followerId:'b',aiState:'FOLLOW',
  candidateCount:1,mergeBlockers:0,gapMeters:20,relativeSpeedMps:3
 }))
});
test('20 exact accepted FOLLOW frames pass as advisory evidence',()=>{
 assert.equal(assertMajokuFollow400ms(witness()),true);
});
const cases=[
 ['nineteen frames',w=>w.consecutive20msFrames.pop()],
 ['nonadjacent tick',w=>w.consecutive20msFrames[8].tick+=1],
 ['changed leader',w=>w.consecutive20msFrames[8].leaderId='c'],
 ['changed follower',w=>w.consecutive20msFrames[8].followerId='c'],
 ['interrupted FOLLOW',w=>w.consecutive20msFrames[8].aiState='PLAN_ATTACK'],
 ['zero candidate',w=>w.consecutive20msFrames[8].candidateCount=0],
 ['reported merge block',w=>w.consecutive20msFrames[8].mergeBlockers=1],
 ['non closing speed',w=>w.consecutive20msFrames[8].relativeSpeedMps=2],
 ['gap outside limit',w=>w.consecutive20msFrames[8].gapMeters=71],
 ['invalid physical step',w=>w.physicsStepMs=100],
 ['wrong event end tick',w=>w.lastFrameTick=121],
 ['forged cleared sweep',w=>w.sweptClearanceProven=true],
 ['forged cleared reservation',w=>w.mergeReservationClearanceProven=true],
 ['inconsistent final speed',w=>w.relativeSpeedMps=4],
 ['inconsistent final gap',w=>w.gapMeters=30],
 ['inconsistent final candidates',w=>w.candidateCount=2],
 ['forged event time',w=>w.endSimMs=5000]
];
for(const [label,mutate] of cases){
 test('reject '+label,()=>{const w=witness();mutate(w);assert.throws(()=>assertMajokuFollow400ms(w));});
}
test('reject incomplete 90s physical window',()=>{
 assert.throws(()=>assertMajokuFollow400ms(witness(),119));
});
