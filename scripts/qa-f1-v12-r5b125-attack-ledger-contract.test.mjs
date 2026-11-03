// R5-b125: exercise the real immutable engine attack event producer
// in a standalone Node unit test, without running or modifying game physics.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
const source=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const start=source.indexOf('function unifiedObserveAttackV11(');
const end=source.indexOf('function unifiedIncidentNameV11(',start);
assert(start>=0&&end>start,'Actual attack event producer missing');
const engineFunction=source.slice(start,end);
function fixture(){
 const a={id:'a',finished:false,pitState:'TRACK',raceProgress:1,
  unifiedAiStateV11:'PLAN_ATTACK',unifiedAiTargetV11:'b',unifiedMergeBlockedV11:[]};
 const b={id:'b',finished:false,pitState:'TRACK',raceProgress:1.01,
  unifiedAiStateV11:'CRUISE',unifiedAiTargetV11:'',unifiedMergeBlockedV11:[]};
 const state={attemptHistory:[],attempts:new Map(),attemptPrevious:new Map(),
  attemptCounts:new Map(),attemptSequence:0,
  competition:{attemptEventCounts:{}}};
 const vehicles=[a,b],raceMotionV189={vehicles},unifiedStateV11=state;
 const unifiedRaceOnTrackV11=v=>!v.finished&&v.pitState==='TRACK'&&v.raceProgress<10;
 const observe=new Function('unifiedStateV11','raceMotionV189',
  'unifiedRaceOnTrackV11',engineFunction+';return unifiedObserveAttackV11;')(
   unifiedStateV11,raceMotionV189,unifiedRaceOnTrackV11);
 return {a,b,state,observe,events:()=>state.attemptHistory};
}
test('START attaches to exact target and physical pass emits SUCCESS once',()=>{
 const f=fixture();
 f.observe(20);
 assert.equal(f.state.attemptSequence,1);
 assert.equal(f.events().filter(e=>e.type==='START').length,1);
 const captured={...f.state.attempts.get('a')};
 assert.equal(captured.driver,'a');assert.equal(captured.target,'b');
 f.observe(100,[],[{ms:100,front:'a',attempt:captured}]);
 f.observe(620,[{front:'a',passed:'b',t:.1,crossingAttempt:captured}]);
 const success=f.events().filter(e=>e.type==='SUCCESS');
 assert.equal(success.length,1);
 assert.equal(success[0].attemptId,captured.id);
 assert.equal(success[0].crossingMs,100);
 assert.equal(f.state.attempts.has('a'),false);
 assert.equal(f.state.competition.attemptEventCounts.SUCCESS,1);
});
test('physical pass without matching attack is UNATTRIBUTED_PASS not fabricated SUCCESS',()=>{
 const f=fixture();
 f.a.unifiedAiStateV11='CRUISE';
 f.observe(520,[{front:'a',passed:'b',t:.02,crossingAttempt:null}]);
 assert.equal(f.events().filter(e=>e.type==='SUCCESS').length,0);
 assert.equal(f.events().filter(e=>e.type==='UNATTRIBUTED_PASS').length,1);
 assert.equal(f.state.attemptSequence,0);
});
test('changing target interrupts existing attempt rather than pretending success',()=>{
 const f=fixture();f.observe(20);f.a.unifiedAiTargetV11='missing-target';
 f.observe(40);
 assert.equal(f.events().filter(e=>e.type==='TARGET_CHANGED').length,1);
 assert.equal(f.events().filter(e=>e.type==='SUCCESS').length,0);
 assert.equal(f.state.attempts.has('a'),false);
});
test('reported blocker is not physical clearance and does not end attempt',()=>{
 const f=fixture();f.observe(20);
 f.a.unifiedAiStateV11='EXIT_DUEL';
 f.a.unifiedMergeBlockedV11=['b'];
 f.observe(40);
 assert.equal(f.events().filter(e=>e.type==='BLOCKED').length,1);
 assert.equal(f.state.attempts.has('a'),true);
 assert.equal(f.events().filter(e=>e.type==='SUCCESS').length,0);
});
test('pit transition interrupts target-specific attack',()=>{
 const f=fixture();f.observe(20);f.a.pitState='ENTRY';
 f.observe(40);
 assert.equal(f.events().filter(e=>e.type==='PIT_INTERRUPTED').length,1);
 assert.equal(f.state.attempts.has('a'),false);
});
test('unblocked corridor is never asserted as a safe lane from the ledger',()=>{
 assert(!engineFunction.includes('safeLaneProven=true'));
 assert(!engineFunction.includes('sweptClearanceProven=true'));
});
