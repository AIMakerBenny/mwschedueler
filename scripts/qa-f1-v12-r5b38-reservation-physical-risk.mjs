// R5-b38 - assert actual production lane-reservation guard respects
// yaw-aware lateral and longitudinal future chassis separation.
// Physical swept-world collision checks and step-integrator are untouched.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const begin=src.indexOf('function unifiedReservationThreatV12(');
const end=src.indexOf('function simulateUnifiedRaceStepV11(',begin);
assert(begin>=0&&end>begin,'Exact production R5-b38 reservation predicate missing');
assert(src.includes('if(unifiedSweptWorldV11(a,ca,b,cb))'),
 'Never remove real swept envelope contact checks');
const body=src.slice(begin,end);
assert(!/\.raceProgress\s*=|\.unifiedYV11\s*=|\.speedKph\s*=/.test(body),
 'Reservation risk query cannot warp committed vehicle positions or speed');
const risk=new Function('deps',`
 const {unifiedLateralClearanceV11,unifiedGapV11,UNIFIED_ENGINE_V11}=deps;
 ${body}
 return unifiedReservationThreatV12;
`)({
 unifiedLateralClearanceV11:()=>2.3,
 unifiedGapV11:(a,b)=>b.s-a.s,
 UNIFIED_ENGINE_V11:{physicalLength:5.2,clearance:.3}
});
const car=(id,s,y,v,target=y)=>({id,s,y,v,ref:{unifiedLaneTargetV11:target}});
const predict=(a,b,ay,by)=>risk(a,b,{y:ay},{y:by});
let a=car('pit-entry',0,2.57,95,-4.83);
let b=car('distant-side',3,-4.22,96,-4.83);
const copy=JSON.stringify([a,b]);
assert.equal(predict(a,b,2.56,-4.21),false,
 'R5-b38 must NOT countersteer across clearly empty lateral clearance');
assert.equal(JSON.stringify([a,b]),copy,'Read-only guard unexpectedly changes physical state');
a=car('pit-entry',0,2.57,95,-4.83);
b=car('parallel-near',80,-.5,95,-.5);
assert.equal(predict(a,b,2.56,-.49),false,
 'Parallel car 80m away with stable speed cannot veto pit lane preparation');
b=car('closing-neighbor',45,-.5,60,-.5);
assert.equal(predict(a,b,2.54,-.47),true,
 'Car approaching within lane-change horizon must preserve lateral reservation');
b=car('nearby-neighbor',12,-.5,95,-.5);
assert.equal(predict(a,b,2.54,-.47),true,
 'Close current occupant must retain lane-merge reservation');
b=car('reversing-order',28,-.5,20,-.5);
assert.equal(predict(a,b,2.54,-.47),true,
 'Longitudinal order crossing must retain conventional reservation');
a=car('wide-separated',0,4.0,70,0);
b=car('wide-peer',1,-3.8,70,0);
assert.equal(predict(a,b,3.95,-3.75),false,
 'Across empty wide lanes, minor convergence must not override real steering');
a=car('same-lane',0,2,50,0);
b=car('same-lane-peer',12,1.9,50,0);
assert.equal(predict(a,b,1.95,1.9),false,
 'Legacy common-line formation remains exempt from aggressive countersteer');
a=car('zero-target',0,2.4,40,0);
b=car('zero-peer',42,0,30,0);
assert.equal(predict(a,b,2.39,0),true,
 'An explicitly commanded centerline target must be included in safety horizon');
console.log(JSON.stringify({phase:'R5-b38',status:'PASS',
 checks:['clear lateral separation','safe parallel 80m gap',
 'closing vehicle protected','near vehicle protected','order crossing protected',
 'wide lane nonconflict','common line unchanged','zero-meter target honored',
 'read-only advisory','swept collision validator preserved']}));
