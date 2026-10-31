// R5-b26: regression for the REAL production pit-avoidance planning function.
// The test extracts that exact source, rather than reproducing its decisions.
// Physical motion, traffic braking and swept-world contacts remain unmodified.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const src=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const begin=src.indexOf('function unifiedPitAvoidanceV12(');
const end=src.indexOf('function unifiedChooseLaneV11(',begin);
assert(begin>=0&&end>begin,'Missing real production pit-avoidance planner');
assert(src.includes('if(unifiedSweptWorldV11(a,ca,b,cb))'),
 'Physical swept-world overlap validation must never be removed');
const method=src.slice(begin,end);
assert(!/\.speedKph\s*=|\.raceProgress\s*=|\.unifiedYV11\s*=|\.visualLateralOffsetMeters\s*=/.test(method),
 'A pit-avoid planner must not warp accepted physical state');
let obstructed=false;
const factory=new Function('stubs',`
 const {unifiedGapV11,unifiedLateralClearanceV11,unifiedClampV11,
  unifiedIdealLaneV11,unifiedMergeTargetV11,UNIFIED_ENGINE_V11}=stubs;
 ${method}
 return unifiedPitAvoidanceV12;
`);
const plan=factory({
 UNIFIED_ENGINE_V11:{physicalWidth:2,physicalLength:5.2},
 unifiedGapV11:(a,b)=>b.s-a.s,
 unifiedLateralClearanceV11:()=>2.7,
 unifiedClampV11:(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),
 unifiedIdealLaneV11:()=>3.3,
 unifiedMergeTargetV11:(row,target)=>({target,blocked:obstructed?['blocked-vehicle']:[]})
});
function fixture(pitS=160){
 const vehicle={pitRequested:false};
 return {me:{id:'track-9',pit:'TRACK',y:3.3,s:0,v:70,ref:vehicle},
  peer:{id:'pit-0',pit:'PIT_LANE',y:2.55,s:pitS,v:22,finished:false},vehicle};
}
const good=fixture(),orig=structuredClone(good);
const target=plan(good.me,[good.me,good.peer],14);
assert(target&&target.peer==='pit-0','Expected predictive pit avoidance at ample gap');
assert(target.target<0,'Expected a true separate real steering target from pit y=2.55');
assert(Math.abs(target.target-good.peer.y)>=2.7+.45,
 'Selected lateral path must clear the real physical body reserve');
assert.deepEqual(good,orig,'The AI planner must be read-only until physics accepts a command');
// R5-b28: the fixed-seed Driver 9 missed its lateral escape because
// Driver 0 had not transitioned from TRACK to PIT_LANE when braking began.
const warned=fixture(230);
warned.peer.pit='TRACK';
warned.peer.ref={pitRequested:true};
warned.peer.y=2.55;
warned.me.y=3.33;
const beforeWarned=structuredClone(warned);
const warning=plan(warned.me,[warned.me,warned.peer],14);
assert(warning&&warning.peer==='pit-0'&&warning.target<0,
 'A requested pit stop 230m ahead must enable early physical escape steering');
assert.deepEqual(warned,beforeWarned,'Advance-warning AI may not warp physical state');
const notRequested=fixture(230);
notRequested.peer.pit='TRACK';
notRequested.peer.ref={pitRequested:false};
assert.equal(plan(notRequested.me,[notRequested.me,notRequested.peer],14),null,
 'Do not swerve early around an ordinary TRACK vehicle');
const closePending=fixture(30);
closePending.peer.pit='TRACK';
closePending.peer.ref={pitRequested:true};
assert.equal(plan(closePending.me,[closePending.me,closePending.peer],14),null,
 'Even with advance pit knowledge a physically late lane jump is forbidden');
const late=fixture(30);
assert.equal(plan(late.me,[late.me,late.peer],14),null,
 'Unsafe last-moment lane jump must leave original braking in control');
const behind=fixture(-20);
assert.equal(plan(behind.me,[behind.me,behind.peer],14),null,'Rear pit car is not ahead');
const clear=fixture();
clear.me.y=-3.3;
assert.equal(plan(clear.me,[clear.me,clear.peer],14),null,
 'Already physically separated traffic does not need another avoidance');
const requested=fixture();requested.vehicle.pitRequested=true;
assert.equal(plan(requested.me,[requested.me,requested.peer],14),null,
 'The pit-entering vehicle must remain on its own pit line');
const blocked=fixture();obstructed=true;
assert.equal(plan(blocked.me,[blocked.me,blocked.peer],14),null,
 'Physical lane reservation prevents blocked lateral moves');
obstructed=false;
const held=fixture(55);
held.me.y=-1;
held.vehicle.unifiedPitAvoidPeerV12='pit-0';
held.vehicle.unifiedPitAvoidTargetV12=target.target;
assert.equal(plan(held.me,[held.me,held.peer],14)?.target,target.target,
 'Already steering on a physical pit-avoid route should hold its intent');
console.log(JSON.stringify({phase:'R5-b26',status:'PASS',
 checks:['predictive clearance','physical read-only intent',
 'pre-entry pit request detected','normal traffic unchanged','late pit-request merge rejected',
 'late braking preserved',
 'rear pit excluded','separated lane unaffected','pit entrants unchanged',
 'blocked merge rejected','ongoing physical steering preserved',
 'swept collision validation retained']}));
