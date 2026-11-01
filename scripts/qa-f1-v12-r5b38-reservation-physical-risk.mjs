// R5-b39 - regression for restored production pre-contact lane reservation.
// The R5-b38 narrow-distance exception caused a real Royal Street overlap.
// Physical swept-world collision checks and step-integrator are untouched.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const begin=src.indexOf('function unifiedReservationThreatV12(');
const end=src.indexOf('function simulateUnifiedRaceStepV11(',begin);
assert(begin>=0&&end>begin,'Exact production restored safety predicate missing');
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
assert.equal(predict(a,b,2.56,-4.21),true,
 'Reinstated pre-contact guard must retain converging adjacent corridors');
assert.equal(JSON.stringify([a,b]),copy,'Read-only guard unexpectedly changes physical state');
a=car('pit-entry',0,2.57,95,-4.83);
b=car('parallel-near',80,-.5,95,-.5);
assert.equal(predict(a,b,2.56,-.49),true,
 'At the caller 110m pre-contact horizon, original reservation cannot be skipped');
b=car('closing-neighbor',45,0,60,0);
assert.equal(predict(a,b,2.54,.03),true,
 'Car approaching within lane-change horizon must preserve lateral reservation');
b=car('nearby-neighbor',12,0,95,0);
assert.equal(predict(a,b,2.54,.03),true,
 'Close current occupant must retain lane-merge reservation');
b=car('reversing-order',28,0,20,0);
assert.equal(predict(a,b,2.54,.03),true,
 'Longitudinal order crossing must retain conventional reservation');
a=car('wide-separated',0,4.0,70,0);
b=car('wide-peer',1,-3.8,70,0);
assert.equal(predict(a,b,3.95,-3.75),false,
 'Across empty wide lanes, minor convergence must not override real steering');
// The real rejected Royal Street pair was 1.10m apart longitudinally
// and converging at 2.48m lateral separation. Without this guard the
// swept-world checker rejected the entire 20ms step at 30.78 seconds.
a=car('royal-driver-7',835.89,.93254,39.77,.20);
b=car('royal-driver-8',834.79,-1.54312,30.40,-1.90);
assert.equal(predict(a,b,.91423,-1.52440),true,
 'Restore physical reservation for the exact R5-b38 Royal Street crash corridor');
a=car('same-lane',0,2,50,0);
b=car('same-lane-peer',12,1.9,50,0);
assert.equal(predict(a,b,1.95,1.9),false,
 'Legacy common-line formation remains exempt from aggressive countersteer');
a=car('zero-target',0,2.4,40,0);
b=car('zero-peer',28,0,30,0);
assert.equal(predict(a,b,2.39,0),true,
 'An explicitly commanded centerline target must be included in safety horizon');
console.log(JSON.stringify({phase:'R5-b39',status:'PASS',
 checks:['original converging-corridor reserve restored','110m pre-contact protection',
 'closing vehicle protected','near vehicle protected','order crossing protected',
 'wide lane nonconflict','Royal Street crash corridor protected',
 'common line unchanged','zero-meter target honored',
 'read-only advisory','swept collision validator preserved']}));
