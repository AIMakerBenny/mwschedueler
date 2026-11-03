import assert from 'node:assert/strict';
import test from 'node:test';
import {makeAttemptTerminalWitness,TERMINAL_OFFSETS_MS,TERMINAL_EVENT_TYPES}
 from './lib/f1-r5b165-terminal-witness.mjs';
import {snapshotAttemptContextFrame} from './lib/f1-r5b137-attempt-context.mjs';
import {exactLongHorizonPair} from './lib/f1-r5b157-long-horizon.mjs';
const start={type:'START',attemptId:20,ms:4000,driver:'a',target:'b',retry:true};
const event={type:'DISENGAGED_UNCONFIRMED',attemptId:20,ms:6000,driver:'a',target:'b',mode:'FOLLOW'};
const frame=ms=>snapshotAttemptContextFrame(ms,2000,
 Array.from({length:12},(_,i)=>({id:i===0?'a':i===1?'b':'d'+i,
 raceProgress:i===0?1.5:i===1?1.51:2+i*.01,
 speedKph:i===0?130:i===1?140:120,
 unifiedAiStateV11:i===0?'FOLLOW':'PLAN_ATTACK',
 unifiedAiTargetV11:i===0?'b':'',
 batteryMJ:i===0?2:3,energyDeployKW:i===0?0:60,
 pitState:'TRACK',finished:false})));
test('R5-b165 terminal captures exactly source frames at -1000,-200,-20,0',()=>{
 const times=[5000,5800,5980,6000],history=times.map(frame);
 const w=makeAttemptTerminalWitness(event,start,history,exactLongHorizonPair);
 assert.equal(w.attemptDurationMs,2000);
 assert.equal(w.engineOutcomeConfirmed,false);
 assert.deepEqual(TERMINAL_OFFSETS_MS,[-1000,-200,-20,0]);
 assert.equal(TERMINAL_EVENT_TYPES.length,4);
 for(const t of TERMINAL_OFFSETS_MS)assert.equal(w.offsetSamples[String(t)].available,true);
 assert.equal(w.offsetSamples['0'].driverAiState,'FOLLOW');
 assert(Math.abs(w.offsetSamples['0'].relativeClosingSpeedMps+10/3.6)<1e-8);
 assert.equal(w.physicalSweptClearanceProven,false);
});
test('R5-b165 explicitly unavailable absent exact accepted frame',()=>{
 const w=makeAttemptTerminalWitness(event,start,[frame(5800),frame(6000)],exactLongHorizonPair);
 assert.equal(w.offsetSamples['-1000'].available,false);
 assert.equal(w.offsetSamples['-1000'].reason,'EXACT_ACCEPTED_20MS_FRAME_UNAVAILABLE');
 assert.equal(w.offsetSamples['-200'].available,true);
 assert.equal(w.offsetSamples['-20'].available,false);
});
test('R5-b165 START and terminal identity and order must match exactly',()=>{
 const h=[frame(6000)];
 assert.throws(()=>makeAttemptTerminalWitness({...event,target:'x'},start,h,exactLongHorizonPair),/INVALID_TERMINAL_SOURCE_EVENT/);
 assert.throws(()=>makeAttemptTerminalWitness(event,{...start,retry:false},h,exactLongHorizonPair),/INVALID_TERMINAL_SOURCE_EVENT/);
 assert.throws(()=>makeAttemptTerminalWitness({...event,ms:3000},start,h,exactLongHorizonPair),/INVALID_TERMINAL_SOURCE_EVENT/);
});
test('R5-b165 physical CROSSING alone is not a terminal SUCCESS',()=>{
 const h=[frame(6000)];
 assert.throws(()=>makeAttemptTerminalWitness({...event,type:'CROSSING'},start,h,exactLongHorizonPair),/INVALID_TERMINAL_SOURCE_EVENT/);
 const e={...event,type:'PIT_INTERRUPTED'};
 const w=makeAttemptTerminalWitness(e,start,h,exactLongHorizonPair);
 assert.equal(w.engineOutcomeConfirmed,false);
 const success=makeAttemptTerminalWitness({...event,type:'SUCCESS',crossingMs:5500},start,h,exactLongHorizonPair);
 assert.equal(success.engineOutcomeConfirmed,true);
 assert.equal(success.engineCrossingMs,5500);
});
