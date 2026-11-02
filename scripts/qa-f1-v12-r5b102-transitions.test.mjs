import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeMajokuScreenTransitions as norm} from './lib/f1-r5b102-transitions.mjs';
const transitions=port=>[
 {from:'SETUP',to:'GRID',ms:0,caller:'at setup (http://127.0.0.1:'+port+'/assets/f1-racing-v1.js:10:1)'},
 {from:'GRID',to:'RACE',ms:0,caller:'at start (http://127.0.0.1:'+port+'/assets/f1-racing-v1.js:20:2)'},
 {from:'RACE',to:'FINISHING',ms:687580,
  caller:'at finish (http://127.0.0.1:'+port+'/assets/f1-racing-v1.js:30:3)'}
];
test('only diagnostic localhost port differs between real seeded browser runs',()=>{
 assert.deepEqual(norm(transitions(8940)),norm(transitions(8990)));
});
test('real physical finish tick remains different and fails',()=>{
 const t=transitions(8990);t[2].ms+=20;
 assert.notDeepEqual(norm(transitions(8940)),norm(t));
});
test('screen state transitions remain different and fail',()=>{
 const t=transitions(8990);t[1].to='FINISHING';
 assert.notDeepEqual(norm(transitions(8940)),norm(t));
});
test('missing browser state transition remains different',()=>{
 assert.notDeepEqual(norm(transitions(8940)),norm(transitions(8990).slice(1)));
});
test('stack call site differences other than port remain different',()=>{
 const t=transitions(8990);t[1].caller=t[1].caller.replace('20:2','99:2');
 assert.notDeepEqual(norm(transitions(8940)),norm(t));
});
test('non-loopback origin is not normalized',()=>{
 const t=transitions(8990);t[1].caller=t[1].caller.replace('127.0.0.1','other.host');
 assert.notDeepEqual(norm(transitions(8940)),norm(t));
});
