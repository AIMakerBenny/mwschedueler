import assert from 'node:assert/strict';
import test from 'node:test';
import {findMajokuPhysicalFieldDifferences as diff} from './lib/f1-r5b95-physical-compare.mjs';
test('identical full-race field values yield no discrepancies',()=>{
 const x={finishedRows:[{id:'a',position:1,finishMs:123}],
  pitTransitions:[{id:'b',from:'TRACK',to:'PIT_ENTRY'}],
  physics:{passes:46,collisionStops:0},finishBoundary:{at:777}};
 const y=structuredClone(x);
 assert.deepEqual(diff(x,y,Object.keys(x)),[]);
});
test('physical pass mismatch is detected, not treated as harmless observation',()=>{
 const a={physics:{passes:46,collisionStops:0}};
 const b={physics:{passes:47,collisionStops:0}};
 assert.deepEqual(diff(a,b,['physics']).map(x=>x.field),['physics']);
});
test('a single pit transition mismatch must fail',()=>{
 const a={pitTransitions:[{to:'PIT_BOX'}]};
 const b={pitTransitions:[{to:'TRACK'}]};
 assert.equal(diff(a,b,['pitTransitions'])[0].reason,'PHYSICAL_OUTCOME_MISMATCH');
});
test('rank and lap-time modifications are identified',()=>{
 const a={finishedRows:[{position:1,lapTimesMs:[100,200]}]};
 const b={finishedRows:[{position:2,lapTimesMs:[100,201]}]};
 assert.deepEqual(diff(a,b,['finishedRows']).map(x=>x.field),['finishedRows']);
});
test('missing required field in both objects must not count as identical',()=>{
 const a={finishedRows:[]},b={finishedRows:[]};
 assert.deepEqual(diff(a,b,['physics']),[{
  field:'physics',reason:'REQUIRED_FIELD_MISSING',baselinePresent:false,probedPresent:false}]);
});
test('missing field on only one side is classified',()=>{
 assert.equal(diff({physics:{}},{},['physics'])[0].reason,'REQUIRED_FIELD_MISSING');
});
test('equal values with independent object identity remain identical',()=>{
 const a={samples:[{rank:[1,2],pit:0}]};
 const b={samples:[{rank:[1,2],pit:0}]};
 assert.deepEqual(diff(a,b,['samples']),[]);
});
