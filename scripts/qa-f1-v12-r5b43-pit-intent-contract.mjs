// R5-b43: pure unit regression for R5-b42 early pit-side intent.
// No race state, vehicle pose, rank, speed or physics is overwritten.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const start=src.indexOf('function unifiedPitLaneIntentV12(');
const end=src.indexOf('function unifiedChooseLaneV11(',start);
assert(start>=0&&end>start,'Missing isolated pit intent helper');
assert.equal(src.indexOf('function unifiedPitLaneIntentV12(',start+1),-1,
 'Pit-intent implementation duplicated');
const helperSource=src.slice(start,end);
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
const simulatedLine=v=>({
 PIT_LINE:-4.838,DEFENSIVE_INSIDE:.295,ATTACK_INSIDE:3.658,IDEAL:0
})[v.racingLineMode]??0;
const intent=new Function('unifiedClampV11','lineOffsetMetersV197',
 helperSource+'return unifiedPitLaneIntentV12;')(clamp,simulatedLine);
const driver={pitRequested:true,racingLineMode:'DEFENSIVE_INSIDE',progress:.54};
const row={pit:'TRACK',ref:driver};
const unchanged=JSON.stringify(row);
assert.equal(intent(row,5),-4.838,
 'Confirmed pit request must choose pit-side line before lifecycle changes mode');
assert.equal(JSON.stringify(row),unchanged,
 'Pit-side intent must not mutate pit state or racing-line mode');
assert.equal(intent({pit:'TRACK',ref:{...driver,pitRequested:false}},5),.295,
 'Normal defensive track line must remain unchanged');
assert.equal(intent({pit:'PIT_LANE',ref:driver},5),.295,
 'Only early TRACK pit requests may override the existing lifecycle line mode');
assert.equal(intent({pit:'TRACK',ref:{...driver,racingLineMode:'PIT_LINE'}},5),-4.838,
 'Existing late pit approach must preserve pit-side targeting');
assert.equal(intent({pit:'TRACK',ref:driver},3),-3,
 'Pit-side target must respect the physical allowed-lateral bound');
const choose=src.slice(end,src.indexOf('// Target-aware diagnostics only.',end));
assert(choose.includes("if(v.pitRequested||row.pit!=='TRACK'){target=unifiedPitLaneIntentV12(row,allowed);state='PIT';}"),
 'Actual PIT lane planner is not calling the early-intent helper');
assert(choose.includes("const merge=state==='PIT'?unifiedPitMergeTargetV12(row,target,rows):"),
 'The existing physical pit-merge safety planner must remain authoritative');
assert(src.includes('if(unifiedSweptWorldV11(a,ca,b,cb))'),
 'Actual swept-world collision rejection removed');
assert(src.includes('if(!unifiedReservationThreatV12(a,b,ca,cb))continue;'),
 'R5-b39 pre-contact reservation veto is no longer active');
const guard=src.slice(src.indexOf('function unifiedReservationThreatV12('),
 src.indexOf('function simulateUnifiedRaceStepV11('));
assert(guard.includes('Math.abs(initial)>=.25&&Math.abs(initial)<=7.5'),
 'R5-b39 lateral reservation protection modified');
console.log(JSON.stringify({phase:'R5-b43',status:'PASS',
 tests:6,unitScope:'early physical pit lane target only',
 invariants:['R5-b39 shared-lane guard preserved','swept-world collision check preserved',
 'physical pit merge planner preserved','pit lifecycle and ordinary racing lines unchanged'],
 limitation:'Synthetic target contract; full real 12-car 10-lap browser CI must verify outcomes'}));
