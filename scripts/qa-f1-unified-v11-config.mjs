// Isolated configuration ownership checks. Overrides below never modify the app's defaults.
// Optional --baseline=<git-ref> compares default motion and energy against a previous engine.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {src,engine,setup} from './f1-unified-v11-fixture.mjs';
function configured(overrides={}){
  return engine.replace(/const UNIFIED_ENGINE_V11=Object.freeze\(\{[\s\S]*?\}\);/,match=>
    match.replace(/(\w+):([.\d]+)/g,(field,key)=>key in overrides?`${key}:${overrides[key]}`:field));
}
function run(body,overrides={},fixture=setup){return new Function(fixture+configured(overrides)+body)();}
const stepBody=`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,1);unifiedInitV11();
const v=raceMotionV189.vehicles[0];v.speedKph=180;v.specialUsesV401=2;simClockV192.simTimeMs=2000;
v.unifiedAiAtV11=1e9;v.unifiedAiStateV11='CRUISE';
const accepted=simulateUnifiedRaceStepV11(20);
return {accepted,speed:v.speedKph,deploy:v.energyDeployKW,battery:v.batteryMJ};`;
const normal=run(stepBody);
assert(normal.accepted);
assert(run(stepBody,{mass:1600}).speed<normal.speed,'Mass override did not reach actual acceleration');
assert(run(stepBody,{drive:7}).speed<normal.speed,'Drive override did not reach actual acceleration');
assert(run(stepBody,{traction:9}).speed<normal.speed,'Traction override did not reach actual acceleration');
assert(run(stepBody,{lateral:3}).speed<normal.speed,'Lateral grip override did not reach friction budget');
assert(run(stepBody,{baseBoostKW:40}).deploy<normal.deploy,'Cruise ERS override did not reach actual energy');
const attack=stepBody.replace("v.unifiedAiStateV11='CRUISE'","v.unifiedAiStateV11='PLAN_ATTACK'");
assert(run(attack,{attackBoostKW:40}).deploy<run(attack).deploy,'Attack ERS override did not reach actual energy');
const skill=stepBody.replace('const accepted=', 'v.specialStartsV11=0;v.specialUntilV401=12000;const accepted=');
assert(run(skill,{additionalPower:20000}).speed<run(skill).speed,'Additional power ceiling did not reach actual acceleration');
assert(run(skill,{specialPower:0}).speed<run(skill).speed,'Special power override did not reach actual acceleration');
const braking=stepBody.replace('v.speedKph=180','v.speedKph=432');
assert(run(braking,{brake:16}).speed>run(braking).speed,'Brake override did not reach actual deceleration');
const pitBody=`
unifiedInitV11();track.pit={entry:.9,exit:.1,speedLimitKph:80};
return unifiedPitLossV11({...unifiedSnapshotV11()[0],v:60},track);`;
assert(run(pitBody,{brake:16})>run(pitBody),'Pit estimate retained a separate brake constant');
assert(run(pitBody,{drive:7})>run(pitBody),'Pit estimate retained a separate drive constant');
const capacity=run(`
unifiedInitV11();const v=raceMotionV189.vehicles[0],initial=v.batteryMJ;
v.batteryMJ=1.999;const row={...unifiedSnapshotV11()[0],v:50,E:v.batteryMJ};
unifiedEnergyAndTyreV11(row,{ds:0,v:50,brake:1,actualBrake:20,ers:0,usedExtraW:0},.02,track);
const full={charge:v.batteryMJ,target:v.energyTargetMJ,harvest:v.energyHarvestMJ};
v.batteryMJ=3;unifiedEnergyAndTyreV11({...row,E:3},{ds:0,v:50,brake:1,actualBrake:20,ers:0,usedExtraW:0},.02,track);
return {initial,full,overflow:{charge:v.batteryMJ,recharge:v.energyRechargeKW}};`,{ersCapacity:2});
assert.equal(capacity.initial,2);assert.equal(capacity.full.charge,2);assert.equal(capacity.full.target,2);
assert(Math.abs(capacity.full.harvest-.001)<1e-12);
assert.deepEqual(capacity.overflow,{charge:2,recharge:0},'Overflow charge created negative harvest');
const empty=run(stepBody,{ersCapacity:0});assert.equal(empty.battery,0);assert.equal(empty.deploy,0);
const clearanceBody=`
unifiedInitV11();const a={...unifiedSnapshotV11()[0],s:100,y:0},b={...unifiedSnapshotV11()[1],s:100,y:3};
const heading=unifiedWorldPoseV11(100,0).heading;a.ref.unifiedHeadingV11=b.ref.unifiedHeadingV11=heading;
return unifiedSweptWorldV11(a,{ds:0,y:0,heading},b,{ds:0,y:3,heading});`;
assert.equal(run(clearanceBody),false);assert.equal(run(clearanceBody,{clearance:2}),true);
const report=run(`
const markerOverlapReportV377=()=>({}),raceCameraV216={zoom:1};simClockV192.fixedStepMs=20;
const before=JSON.stringify({vehicles:raceMotionV189.vehicles,clock:simClockV192});
const report=window.mwsF1UnifiedV11Report();
return {shared:report.physics===UNIFIED_ENGINE_V11,revision:report.revision,step:report.simulationStepMs,unchanged:before===JSON.stringify({vehicles:raceMotionV189.vehicles,clock:simClockV192})};`);
assert.deepEqual(report,{shared:true,revision:'shared-physics-config-v11',step:20,unchanged:true});
const baselineRef=process.argv.find(arg=>arg.startsWith('--baseline='))?.slice(11);
let baseline='Not available';
if(baselineRef){
  const old=execFileSync('git',['show',`${baselineRef}:assets/f1-racing-v1.js`],{encoding:'utf8',maxBuffer:4*1024*1024});
  const start=old.indexOf('// Unified redesign v1.1.'),end=old.indexOf('function simulateRaceStepV192(stepMs){',start);
  assert(start>0&&end>start);
  const currentStart=engine.indexOf('// Unified redesign v1.1.');
  const oldEngine=engine.slice(0,currentStart)+old.slice(start,end);
  const body=`
let ticks=0;for(let i=0;i<6000;i++){if(!simulateUnifiedRaceStepV11(20))break;ticks++;}
return {ticks,clock:simClockV192.simTimeMs,vehicles:raceMotionV189.vehicles,telemetry:unifiedStateV11.telemetry,rng:unifiedStateV11.rng};`;
  const before=new Function(setup+oldEngine+body)(),after=new Function(setup+engine+body)();
  assert.equal(after.ticks,6000);assert.deepEqual(after,before,'Default physics or RNG changed during configuration wiring');
  baseline={ref:baselineRef,cars:12,seconds:120,exactStates:true,exactTelemetry:true};
}
console.log(JSON.stringify({result:'PASS',overrides:'isolated fixture only',checks:['mass','drive','traction','lateral','brake','cruise-ers','attack-ers','power-ceiling','special-power','pit-estimate','capacity','nonnegative-harvest','physical-clearance','read-only-config-report'],baseline},null,2));
