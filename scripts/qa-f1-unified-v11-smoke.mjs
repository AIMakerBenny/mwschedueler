// Run with: node scripts/qa-f1-unified-v11-smoke.mjs
// Synthetic physics smoke only. This does not inspect Chromium visual overlaps.
import assert from 'node:assert/strict';
import {src,engine,setup} from './f1-unified-v11-fixture.mjs';
function scenario(body){return new Function(setup+engine+body)();}
function trial(reverse=false,iterations=6000){
const execute=String.raw`
if(REVERSE)raceMotionV189.vehicles.reverse();
let ticks=0;for(let i=0;i<ITERATIONS;i++){if(!simulateUnifiedRaceStepV11(20))break;ticks++;}
const v=raceMotionV189.vehicles.find(item=>item.id==='0');v.tyreWear=.60;v.unifiedPitEvalAtV11=0;
unifiedPitV11(unifiedSnapshotV11().find(row=>row.id===String(v.id)),simClockV192.simTimeMs/1000,track);
return {ticks,errors:unifiedStateV11.telemetry.invalid,passes:unifiedStateV11.telemetry.passes.length,pitCalls,
 states:raceMotionV189.vehicles.map(v=>({id:v.id,s:v.raceProgress,y:v.unifiedYV11,v:v.speedKph,e:v.batteryMJ,w:v.tyreWear}))
  .sort((a,b)=>a.id.localeCompare(b.id))};
`.replace('REVERSE',String(reverse)).replace('ITERATIONS',String(iterations));
return new Function(setup+engine+execute)();
}
const contacts=scenario(`
unifiedInitV11();
return [unifiedSweptContactV11(-8,1,10,6),unifiedSweptContactV11(0,3,1,0),
 unifiedSweptContactV11(0,0,0,0),unifiedGapV11({s:0},{s:5283})];`);
assert.deepEqual(contacts,[true,false,true,3],'Swept contact or lapped gap missed');
const atomic=scenario(`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,2);
const [a,b]=raceMotionV189.vehicles;b.raceProgress=1+3/5280;b.startOffset=b.raceProgress;
a.pitState='PIT_BOX';a.pitBoxTimerMs=1000;unifiedInitV11();
const before=JSON.stringify(raceMotionV189.vehicles);
const accepted=simulateUnifiedRaceStepV11(20);
return {accepted,same:before===JSON.stringify(raceMotionV189.vehicles),clock:simClockV192.simTimeMs,
 timer:a.pitBoxTimerMs,reason:unifiedStateV11.telemetry.invalid[0]?.reason};`);
assert.equal(atomic.accepted,false);assert.equal(atomic.same,true);assert.equal(atomic.clock,0);
assert.equal(atomic.timer,1000);assert.match(atomic.reason,/PHYSICAL_ENVELOPE/);
const paused=scenario(`
unifiedInitV11();simClockV192.paused=true;const before=JSON.stringify(raceMotionV189.vehicles);
for(let i=0;i<5;i++)simulateUnifiedRaceStepV11(20);
const unchanged=before===JSON.stringify(raceMotionV189.vehicles)&&simClockV192.simTimeMs===0;
simClockV192.paused=false;return {unchanged,resumed:simulateUnifiedRaceStepV11(20),clock:simClockV192.simTimeMs};`);
assert.deepEqual(paused,{unchanged:true,resumed:true,clock:20});
const recovery=scenario(`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,1);unifiedInitV11();
const v=raceMotionV189.vehicles[0];v.batteryMJ=1;const row={ref:v,s:0,v:50,E:1};
unifiedEnergyAndTyreV11(row,{ds:0,v:50,brake:1,actualBrake:0,ers:80000,extraW:300000,usedExtraW:0},.02,track);
return {e:v.batteryMJ,boost:v.boostPowerKW,recharge:v.energyRechargeKW};`);
assert.deepEqual(recovery,{e:1,boost:0,recharge:0},'Unexecuted power or braking generated energy');
const skills=scenario(`
const v={specialStartsV11:400,specialUntilV401:10400};
return [unifiedSkillPowerV11(v,0,'TRACK'),unifiedSkillPowerV11(v,400,'TRACK'),
 unifiedSkillPowerV11(v,9650,'TRACK'),unifiedSkillPowerV11(v,10400,'TRACK'),unifiedSkillPowerV11(v,400,'PIT_LANE')];`);
assert.deepEqual(skills,[0,300000,150000,0,0],'Skill timing, fade or pit isolation failed');
const obstacle=scenario(`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,2);
const [a,b]=raceMotionV189.vehicles;a.raceProgress=0;a.startOffset=0;a.speedKph=180;
b.raceProgress=180/5280;b.startOffset=b.raceProgress;b.pitState='PIT_BOX';b.pitBoxTimerMs=1e9;
unifiedInitV11();let ticks=0;for(let i=0;i<1000;i++){if(!simulateUnifiedRaceStepV11(20))break;ticks++;}
return {ticks,errors:unifiedStateV11.telemetry.invalid,still:b.speedKph,position:b.raceProgress,states:raceMotionV189.vehicles.map(v=>({s:v.raceProgress*5280,y:v.unifiedYV11,v:v.speedKph}))};`);
assert.equal(obstacle.ticks,1000);assert.deepEqual(obstacle.errors,[]);assert.equal(obstacle.still,0);
assert.equal(obstacle.position,180/5280,'Stationary pit car moved');
// Exercise the real cut-in adapter with controlled wall-clock callbacks.
const adapters=src.slice(src.indexOf('function applySpecialV401(entry){'),src.indexOf('function startSpecialV401(driver,rank,standings){'));
const cinematicSetup=setup.replace("const specialStateV401={cinematic:false,lastMs:-Infinity},specialStageV401=()=>null,specialPhraseV401=()=>({}),playSpecialV401=()=>{};", `
const SPECIAL_V401={sceneMs:1120},specialStateV401={token:1,cinematic:true,index:0,queue:[],boosts:0,history:[]};
const pending=[],stage={remove(){},innerHTML:''};
const specialStageV401=()=>stage,specialPhraseV401=()=>({title:'QA',line:'QA'}),escapeHtml=x=>String(x),initials=()=>'';
const setTimeout=fn=>{pending.push(fn);return pending.length;};`);
const cinematic=new Function(cinematicSetup+engine+adapters+`
unifiedInitV11();const cars=raceMotionV189.vehicles.slice(0,3);
specialStateV401.queue=cars.map((vehicle,i)=>({vehicle,rank:i+1,chain:i>0,unifiedDelayMsV11:i*400,phrase:specialPhraseV401()}));
simClockV192.paused=true;const before=JSON.stringify(raceMotionV189.vehicles);
playSpecialV401(1);const held=simulateUnifiedRaceStepV11(20)===false&&before===JSON.stringify(raceMotionV189.vehicles);
while(pending.length)pending.shift()();
return {held,paused:simClockV192.paused,clock:simClockV192.simTimeMs,boosts:specialStateV401.boosts,
 starts:cars.map(v=>v.specialStartsV11),ends:cars.map(v=>v.specialUntilV401)};`)();
assert.deepEqual(cinematic,{held:true,paused:false,clock:0,boosts:3,starts:[0,400,800],ends:[10000,10400,10800]});
const finishAdapter=src.slice(src.indexOf('function markRaceFinishersRecoveryG(){'),src.indexOf('function buildRaceTelemetryV237('));
const finishOrder=new Function(setup+engine+finishAdapter+`
let f1ScreenStateV185='RACE',finishCounterRecoveryG=0;
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,2);
const [a,b]=raceMotionV189.vehicles;a.raceProgress=10.1;b.raceProgress=10.2;
a.unifiedFinishCrossingMsV11=12;b.unifiedFinishCrossingMsV11=16;simClockV192.simTimeMs=20;
markRaceFinishersRecoveryG();return raceMotionV189.vehicles.map(v=>[v.finishPosition,v.finishedAtSimMs]);`)();
assert.deepEqual(finishOrder,[[1,12],[2,16]],'Finish order used overshoot instead of crossing time');
const geometry=scenario(`
unifiedInitV11();const R=5280/(2*Math.PI),row={s:100,y:4,vy:0,v:30,ref:{}};
const command={v:30,y:4};unifiedMotionV11(row,command,.02);
const curvature=unifiedPathSampleV11(100).k;
const close=unifiedBoxesOverlapV11({x:0,y:0,heading:0},{x:3.8,y:0,heading:Math.PI/2});
const clear=unifiedBoxesOverlapV11({x:0,y:0,heading:0},{x:4.0,y:0,heading:Math.PI/2});
return {curvature,expected:1/R,metric:command.metric,expectedMetric:1-4/R,path:command.pathDistance,close,clear};`);
assert(Math.abs(geometry.curvature-geometry.expected)<1e-8,'Circle curvature was halved');
assert(Math.abs(geometry.metric-geometry.expectedMetric)<2e-5,'Offset path length was ignored');
assert.equal(geometry.path,.6);assert.equal(geometry.close,true);assert.equal(geometry.clear,false);
const tunnel=scenario(`
unifiedInitV11();unifiedWorldPoseV11=(s,y,h)=>({x:s,y,heading:h||0});
unifiedStateV11.path.maxCenterRate=1;unifiedStateV11.path.maxNormalRate=0;
const a={s:0,y:0,ref:{unifiedHeadingV11:0}},b={s:10,y:0,ref:{unifiedHeadingV11:Math.PI/2}};
return unifiedSweptWorldV11(a,{ds:20,y:0,heading:0},b,{ds:0,y:0,heading:Math.PI/2});`);
assert.equal(tunnel,true,'World swept contact tunneled through crossing vehicle');
const screen=scenario(`
const pair=d=>[{vehicle:{id:'a'},point:{x:0,y:0}},{vehicle:{id:'b'},point:{x:d,y:0}}];
return [unifiedScreenFitV11(pair(20)),unifiedScreenFitV11(pair(3))];`);
assert.equal(screen[0].supported,true);assert(Math.abs(screen[0].minimumFeasibleZoom-1.854)<1e-10);
assert.equal(screen[1].supported,false);assert.equal(screen[1].minimumFeasibleZoom,null);
const power=boost=>scenario(`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,1);unifiedInitV11();
const v=raceMotionV189.vehicles[0];v.speedKph=200;v.batteryMJ=0;
simClockV192.simTimeMs=1000;v.specialUntilV401=${boost?11000:0};
const accepted=simulateUnifiedRaceStepV11(20);
return {accepted,v:v.speedKph,e:v.batteryMJ,actual:v.boostPowerKW};`);
const basePower=power(false),skillPower=power(true);
assert(basePower.accepted&&skillPower.accepted);assert(skillPower.v>basePower.v+.05,'Path planner suppressed skill acceleration');
assert.equal(skillPower.e,0);assert(skillPower.actual>0,'Virtual power was not accounted');
const a=trial(false),b=trial(true);
assert.equal(a.ticks,6000);assert.equal(b.ticks,6000);assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
assert.deepEqual(a.states,b.states,'Vehicle input order affected physical state');assert.equal(a.pitCalls,0);
const long=trial(false,24000);
assert.equal(long.ticks,24000);assert.deepEqual(long.errors,[]);assert(long.passes>0);
for(const v of long.states){assert(v.e>=0&&v.e<=4);assert(v.w>=0&&v.w<=1);assert([v.s,v.y,v.v].every(Number.isFinite));}
console.log(JSON.stringify({result:'PASS',syntheticSeconds:480,cars:12,passes:long.passes,regressions:['swept-contact','lapped-traffic','atomic-rejection','pause-resume','actual-energy','skill-timing','stationary-obstacle','cinematic-chain','finish-crossing','offset-length','world-rotation','world-swept','zoom-feasibility','planned-skill-power'],
 warning:'Not Chromium or a real-circuit balance/overlap verification'},null,2));
