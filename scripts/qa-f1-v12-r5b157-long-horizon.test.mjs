import assert from 'node:assert/strict';
import test from 'node:test';
import {LONG_HORIZON_OFFSETS_MS,makeLongHorizonAttempt,exactLongHorizonPair,
 updateLongHorizonSamples} from './lib/f1-r5b157-long-horizon.mjs';
const get=ms=>({ms,trackLengthMeters:2000,cars:[
 {id:'a',progress:1.5,speedKph:150,aiState:'PLAN_ATTACK',aiTarget:'b',
  pitState:'TRACK',finished:false,energyDeployKW:80,batteryMJ:2,tyreWearFraction:.3,strategyName:'CHASER'},
 {id:'b',progress:1.51,speedKph:140,aiState:'FOLLOW',aiTarget:'',
  pitState:'TRACK',finished:false,energyDeployKW:40,batteryMJ:3,tyreWearFraction:.2,strategyName:'BALANCED'}
]});
const start={type:'START',retry:true,attemptId:9,ms:5000,driver:'a',target:'b'};
test('R5-b157 only authentic repeated START is sampled',()=>{
 assert.equal(makeLongHorizonAttempt(start).attemptId,9);
 assert.throws(()=>makeLongHorizonAttempt({...start,retry:false}),/INVALID_RETRY_START/);
 assert.deepEqual(LONG_HORIZON_OFFSETS_MS,[0,1000,5000,10000,20000,40000,70000]);
});
test('R5-b157 exact gap and speed are not body clearance',()=>{
 const x=exactLongHorizonPair(get(5000),'a','b');
 assert(Math.abs(x.signedTrackProgressGapMeters-20)<1e-7);
 assert(Math.abs(x.relativeClosingSpeedMps-10/3.6)<1e-7);
 assert.equal(x.sweptBodyClearanceProven,false);
});
test('R5-b157 unavailable future offsets are not guessed before finish',()=>{
 const t=makeLongHorizonAttempt(start);
 updateLongHorizonSamples([t],[get(5000)],5000,false);
 assert.equal(t.samples['0'].available,true);
 assert.equal(Object.hasOwn(t.samples,'1000'),false);
});
test('R5-b157 finished race is explicit unavailable for future offsets',()=>{
 const t=makeLongHorizonAttempt(start);
 updateLongHorizonSamples([t],[get(5000)],5000,true);
 assert.equal(t.samples['70000'].reason,'AFTER_RACE_END');
});
test('R5-b157 no interpolation across absent accepted frames',()=>{
 const t=makeLongHorizonAttempt(start);
 updateLongHorizonSamples([t],[get(5000),get(10000)],10000,false);
 assert.equal(t.samples['1000'].available,false);
 assert.equal(t.samples['5000'].available,true);
});
test('R5-b157 absent target is rejected and unknown speed stays unavailable',()=>{
 assert.throws(()=>exactLongHorizonPair(get(5000),'a','x'),/PAIR_NOT_PRESENT/);
 const f=get(5000);f.cars[0].speedKph=undefined;
 assert.equal(exactLongHorizonPair(f,'a','b').relativeClosingSpeedMps,null);
});
