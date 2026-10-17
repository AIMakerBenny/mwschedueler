// R2: continuous multicar lane planning; no alternate physics solver.
import assert from 'node:assert/strict';
import {src,setup,engine} from './f1-unified-v11-fixture.mjs';
assert(src.includes('function unifiedAttackCorridorV12('));
assert(!src.includes('const candidate=[...new Set([-allowed,0,allowed])'));
const caseBody=String.raw`
unifiedInitV11();
const [v0,v1,v2]=raceMotionV189.vehicles;
const me={id:'me',ref:v0,s:100,y:0,v:38,pit:'TRACK',finished:false},
 ahead={id:'ahead',ref:v1,s:140,y:0,v:32,pit:'TRACK',finished:false},
 blocker={id:'blocker',ref:v2,s:113,y:-2.7,v:34,pit:'TRACK',finished:false};
const open=unifiedAttackCorridorV12(me,ahead,[me,ahead],14);
const blocked=unifiedAttackCorridorV12(me,ahead,[me,ahead,blocker],14);
const merging=unifiedAttackCorridorV12(me,ahead,[me,ahead,{...blocker,pit:'PIT_LANE'}],14);
const narrow=unifiedAttackCorridorV12(me,ahead,[me,ahead],4);
if(REVERSE)raceMotionV189.vehicles.reverse();
let ticks=0;
for(let i=0;i<ITER;i++){if(!simulateUnifiedRaceStepV11(20))break;ticks++;}
return {open,blocked,merging,narrow,ticks,invalid:unifiedStateV11.telemetry.invalid,
 stops:unifiedStateV11.telemetry.collisionStops,
 passes:unifiedStateV11.telemetry.passes.length,attempts:unifiedStateV11.attemptSequence,
 attackEvents:unifiedStateV11.competition?.attemptEventCounts,
 vehicles:raceMotionV189.vehicles.map(v=>({id:v.id,s:v.raceProgress,y:v.unifiedYV11,
  state:v.unifiedAiStateV11,blocked:v.unifiedMergeBlockedV11})).sort((a,b)=>a.id.localeCompare(b.id))};
`;
const run=(reverse,n)=>new Function(setup+engine+caseBody.replace('REVERSE',String(reverse)).replace('ITER',String(n)))();
const result=run(false,6000),reverse=run(true,6000);
assert.deepEqual(result,reverse,'Vehicle array order changed world motion or R2 decision');
assert.equal(result.ticks,6000);assert.deepEqual(result.invalid,[]);assert.equal(result.stops,0);
assert(result.open.candidates>3&&result.open.target!==null);
assert(result.blocked.target>0,'Third-car defence was not avoided');
assert(result.merging.target>0,'Nearby pit merge collision protection was bypassed');
assert.equal(result.narrow.target,null);
assert(result.attempts>0);
assert.equal((result.attackEvents.SUCCESS||0)+(result.attackEvents.UNATTRIBUTED_PASS||0),result.passes);
assert(result.vehicles.every(v=>Number.isFinite(v.s)&&Number.isFinite(v.y)));
const pure=new Function(setup+engine+String.raw`
unifiedInitV11();const rows=unifiedSnapshotV11();
const before=JSON.stringify(raceMotionV189.vehicles),rng=unifiedStateV11.rng;
unifiedAttackCorridorV12(rows[1],rows[0],rows,14);
return {same:before===JSON.stringify(raceMotionV189.vehicles),rng:sameRandom(rng)};
function sameRandom(seed){return seed===unifiedStateV11.rng;}
`)();
assert(pure.same&&pure.rng,'Predictive corridor mutated vehicle state or RNG');
console.log(JSON.stringify({result:'PASS',phase:'v1.2-R2',scenario:'12 cars / 120s synthetic circuit',
 openCandidates:result.open.candidates,
 thirdPartySafe:true,pitMergeSafe:true,narrowTrackGuard:true,
 physicalPasses:result.passes,attempts:result.attempts,
 noCollisionStops:true,vehicleOrderIndependent:true,
 limitation:'Actual 7 SVG short physics and full multi-seed balance are separate'},null,2));
