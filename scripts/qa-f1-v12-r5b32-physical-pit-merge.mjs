// R5-b32: test exact production physical pit-merge guard in isolation.
// This allows a lane transition only when signed longitudinal clearance is
// preserved throughout the lateral travel. Real swept collision QA remains.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const start=source.indexOf('function unifiedPitMergeTargetV12(');
const end=source.indexOf('// v1.2 R2: AI-only multi-car corridor planner.',start);
assert(start>=0&&end>start,'Real physical pit-merge source missing');
assert(source.includes('if(unifiedSweptWorldV11(a,ca,b,cb))'),
 'Never delete full world-space collision protection');
const helper=source.slice(start,end);
assert(!/\.raceProgress\s*=|\.speedKph\s*=|\.unifiedYV11\s*=/.test(helper),
 'Pit-merge preview is advisory only: no physical state mutations');
const blockedIds=[];
const merge=new Function('env',`
 const {unifiedMergeTargetV11,unifiedGapV11,UNIFIED_ENGINE_V11}=env;
 ${helper}
 return unifiedPitMergeTargetV12;
`)({
 unifiedMergeTargetV11:(row,target)=>({target:blockedIds.length?row.y:target,
  blocked:blockedIds.slice()}),
 unifiedGapV11:(a,b)=>b.s-a.s,
 UNIFIED_ENGINE_V11:{physicalLength:5.2,clearance:.30}
});
const row={id:'entering',s:0,y:2.5,v:70,ref:{pitRequested:true}};
const peer=(s,v=70)=>({id:'neighbor',s,v,y:0});
const target=-4.5;
blockedIds.push('neighbor');
const far=merge(row,target,[row,peer(90)]);
assert.equal(far.target,target,
 'Far same-speed car must not block physically feasible pit-line positioning');
assert.deepEqual(far.blocked,[],
 'Far blocker must be cleared from the advisory merge reservation');
assert.equal(merge(row,target,[row,peer(20)]).target,row.y,
 'Close physical occupant must still block a lateral crossing');
assert.equal(merge(row,target,[row,peer(95,20)]).target,row.y,
 'Crossing into a slower vehicle during lateral transition must be blocked');
assert.equal(merge(row,target,[row,peer(-20)]).target,row.y,
 'A car close behind must not be crossed');
// R5-b34: lateral reachability is slower than 2.5m/s under pit braking.
const slow={...row,v:5,vy:0};
assert.equal(merge(slow,target,[slow,peer(40,0)]).target,row.y,
 'Slow pit entrant must not claim a corridor it cannot reach before closing');
const reversing={...row,vy:2.5};
assert.equal(merge(reversing,target,[reversing,peer(65,60)]).target,row.y,
 'A car steering away must account for direction reversal time');
assert.equal(merge(row,target,[row,peer(90)]).target,target,
 'Conservative low-speed rule must not disable a safe fast parallel entry');
blockedIds.push('missing');
assert.equal(merge(row,target,[row,peer(90)]).target,row.y,
 'Unknown blocker must fail closed');
blockedIds.pop();
blockedIds.push('rear');
assert.equal(merge(row,target,[row,peer(90),{id:'rear',s:-18,v:70,y:0}]).target,row.y,
 'One near blocker among several must prevent an unsafe lane transition');
blockedIds.pop();
assert.equal(merge(row,row.y,[row,peer(90)]).target,row.y,
 'Zero-distance lane request must remain unchanged');
blockedIds.pop();
assert.equal(merge(row,target,[row,peer(90)]).target,target,
 'Unblocked pit-side lane selection must preserve the normal target');
console.log(JSON.stringify({phase:'R5-b32',status:'PASS',
 checks:['distant same-speed physical clearance','normal lane target retained',
 'close vehicle blocked','closing trajectory blocked','rear contact protected',
 'unknown blocker fail-closed','multiple peers accounted','no displacement',
 'existing swept-world collision check retained',
 'slow lateral reachability guarded','counter-steering reversal time guarded',
 'safe fast pit-side move retained']}));
