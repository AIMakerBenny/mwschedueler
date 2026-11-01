// R5-b40: exhaustive contract for the original, proven pre-contact
// lateral reservation before running real Royal Street and Blue Coast races.
// The unsafe R5-b38 narrowing caused a genuine overlapping swept chassis.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const begin=src.indexOf('function unifiedReservationThreatV12(');
const end=src.indexOf('function simulateUnifiedRaceStepV11(',begin);
assert(begin>=0&&end>begin,'Missing actual reservation predicate');
const method=src.slice(begin,end);
assert(!/\b(?:speedKph|raceProgress|unifiedYV11|visualLateralOffsetMeters)\s*=/.test(method),
 'Reservation predicate cannot write physical state or visual offsets');
assert(src.includes('if(unifiedSweptWorldV11(a,ca,b,cb))'),
 'Actual swept-world chassis collision rejection must remain authoritative');
const beginLoop=src.indexOf('// Shared lane reservation. Anticipate lateral convergence');
const endLoop=src.indexOf('for(let i=0;i<rows.length;i++)if(cmds[i])unifiedMotionV11',beginLoop);
assert(beginLoop>0&&endLoop>beginLoop,'Missing active pre-commit reservation pass');
const active=src.slice(beginLoop,endLoop);
assert(active.includes('if(!unifiedReservationThreatV12(a,b,ca,cb))continue;'),
 'Collision-proof guard not invoked from the actual two-car reservation loop');
assert(active.includes('const near=Math.abs(unifiedGapV11(a,b))<Math.max(110,Math.abs(a.v-b.v)*2+45)'),
 'Existing long-range lateral pre-contact anticipation was weakened');
assert(active.includes('const outward=unifiedLateralV11('),
 'Reservations must remain genuine physical steering, not visual displacement');

const predicate=new Function(method+'return unifiedReservationThreatV12')();
const lateral=[-9,-7.5,-5,-2.48,-.25,-.24,0,.24,.25,1,2.48,5,7.5,9];
const planned=[-8,-5,-1,-.05,0,.05,1,5,8];
let checked=0,restrained=0;
for(const separation of lateral)for(const proposed of planned){
 const a={id:'a',y:separation/2,ref:{}};
 const b={id:'b',y:-separation/2,ref:{}};
 const ca={y:proposed/2},cb={y:-proposed/2};
 const before=JSON.stringify([a,b,ca,cb]);
 const expected=Math.abs(separation)>=.25&&Math.abs(separation)<=7.5&&
  Math.abs(proposed)<Math.abs(separation);
 const observed=predicate(a,b,ca,cb);
 assert.equal(observed,expected,
  'Original physical shared-lane reservation weakened: '+separation+'/'+proposed);
 assert.equal(JSON.stringify([a,b,ca,cb]),before,
  'Reservation guard mutated a physical candidate');
 checked++;
 if(observed)restrained++;
}
const royalA={id:'r5b3-driver-7',y:.9325405787607802,ref:{}};
const royalB={id:'r5b3-driver-8',y:-1.5431249023633191,ref:{}};
assert.equal(predicate(royalA,royalB,
 {y:.914230633866637},{y:-1.524404902363319}),true,
 'Do not reopen the 30.78s Royal Street physical chassis overlap');
const report={phase:'R5-b40',status:'PASS',checked,restrained,
 invariant:'Original lateral convergence veto retained for every sampled pair',
 regression:'Royal Street real chassis overlap at 30.78s held by reservation',
 note:'This is a fast contract, not a substitute for full browser Royal Street and Blue Coast physical races'};
console.log(JSON.stringify(report));
