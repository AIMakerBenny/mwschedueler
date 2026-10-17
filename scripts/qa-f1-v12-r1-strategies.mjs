// R1 race-style policies use ONLY existing physical thrust/tyres/ERS.
import assert from 'node:assert/strict';
import {setup,engine,src} from './f1-unified-v11-fixture.mjs';
assert(src.includes('function unifiedStrategyPlanV12('));
assert(src.includes('window.mwsF1StrategyV12Report='));
const fixture=String.raw`
if(REVERSE)raceMotionV189.vehicles.reverse();
unifiedInitV11();
const assigned=raceMotionV189.vehicles.map(v=>({id:String(v.id),style:v.unifiedStrategyV12})).sort((a,b)=>a.id.localeCompare(b.id));
const policy={};
for(const style of UNIFIED_STRATEGY_V12.names){
 const v={unifiedStrategyV12:style,batteryMJ:4,tyreWear:.2,unifiedAiStateV11:'CRUISE'};
 policy[style]=[.02,.50,.94].map(x=>unifiedStrategyPlanV12(v,x));
}
let ticks=0;
for(let i=0;i<ITER;i++){if(!simulateUnifiedRaceStepV11(20))break;ticks++;}
return {ticks,assigned,policy,
 reports:window.mwsF1StrategyV12Report(),
 telemetry:window.mwsF1CompetitionBaselineV12(),
 collisions:unifiedStateV11.telemetry.collisionStops,
 invalid:unifiedStateV11.telemetry.invalid.length,
 cars:raceMotionV189.vehicles.map(v=>({id:String(v.id),speedKph:v.speedKph,progress:v.raceProgress,tyreWear:v.tyreWear,batteryMJ:v.batteryMJ,style:v.unifiedStrategyV12})).sort((a,b)=>a.id.localeCompare(b.id))};
`;
const run=(reverse,ticks)=>new Function(setup+engine+fixture.replace('REVERSE',String(reverse)).replace('ITER',String(ticks)))();
const trial=run(false,4500),reordered=run(true,4500);
assert.deepEqual(reordered,trial,'R1 driver-array input changes driving or strategy assignment');
assert.equal(trial.ticks,4500);assert.equal(trial.collisions,0);assert.equal(trial.invalid,0);
const roles=['FRONTRUNNER','BALANCED','CHASER','CLOSER'];
for(const role of roles)assert.equal(trial.assigned.filter(x=>x.style===role).length,3);
for(const row of Object.values(trial.policy)){
 for(const p of row){
  assert(p.ersKW>=0&&p.ersKW<=160);
  assert(p.effort>=.80&&p.effort<=1.23);
  assert(p.thrustScale>0&&p.wearScale>0);
 }
}
const [frontOpen,frontMid,frontLate]=trial.policy.FRONTRUNNER;
const [closerOpen,closerMid,closerLate]=trial.policy.CLOSER;
assert(frontOpen.ersKW>closerOpen.ersKW,'Front-runner did not spend early');
assert(closerLate.ersKW>closerOpen.ersKW*4,'Closer did not save for late');
assert(closerLate.effort>frontLate.effort,'Distinct late driving intent missing');
assert(frontOpen.effort>closerOpen.effort,'Distinct early driving intent missing');
assert.equal(trial.reports.entrants.length,12);
assert.equal(trial.telemetry.samples.length,18);
assert(trial.cars.every(v=>Number.isFinite(v.speedKph)&&Number.isFinite(v.progress)&&
 v.tyreWear>=0&&v.tyreWear<=1&&v.batteryMJ>=0&&v.batteryMJ<=4));
const isolated=new Function(setup+engine+String.raw`
unifiedInitV11();const before=unifiedStateV11.rng,driver=raceMotionV189.vehicles[0];
const local=driver.unifiedRngV11;let styles=[];
for(let i=0;i<200;i++)styles.push(unifiedStrategyPlanV12(driver,i/200));
const stage=window.mwsF1StrategyV12Report();stage.entrants[0].style='INJECTED';stage.styles[0]='HACKED';
const rerun=window.mwsF1StrategyV12Report();
const empty=unifiedStrategyPlanV12({...driver,batteryMJ:0},.65,'TRACK');
const pit=unifiedStrategyPlanV12({...driver,batteryMJ:4},.65,'PIT_LANE');
const good=unifiedStrategyPlanV12({...driver,tyreWear:.20},.65);
const worn=unifiedStrategyPlanV12({...driver,tyreWear:.85},.65);
return {rngStable:before===unifiedStateV11.rng&&local===driver.unifiedRngV11,
 reportIsolated:rerun.styles[0]!=='HACKED'&&rerun.entrants[0].style!=='INJECTED',
 emptyEnergy:empty.ersKW,pitEnergy:pit.ersKW,conservation:worn.effort<good.effort,
 statuses:styles.length};
`)();
assert(isolated.rngStable,'Strategy consumed shared or per-driver RNG');
assert(isolated.reportIsolated,'Strategy report exposes mutable internal state');
assert.equal(isolated.emptyEnergy,0);assert.equal(isolated.pitEnergy,0);
assert(isolated.conservation);
const rejection=new Function(setup+engine+String.raw`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,2);
const [a,b]=raceMotionV189.vehicles;b.raceProgress=1+3/5280;b.startOffset=b.raceProgress;
a.pitState='PIT_BOX';a.pitBoxTimerMs=1000;unifiedInitV11();
const before=JSON.stringify(raceMotionV189.vehicles);
const accepted=simulateUnifiedRaceStepV11(20);
return {accepted,vehiclesUnchanged:before===JSON.stringify(raceMotionV189.vehicles),
 clock:simClockV192.simTimeMs};
`)();
assert.deepEqual(rejection,{accepted:false,vehiclesUnchanged:true,clock:0});
console.log(JSON.stringify({result:'PASS',phase:'v1.2-R1',engagedStyles:roles,
 inputOrderIndependent:true,energyNotCreated:true,pitNoBoost:true,tyreConservation:true,
 rngUnchanged:true,rejectedAtomic:true,sharedPhysics:true,simulatedSeconds:90,
 baselineObservations:{confirmedPasses:trial.telemetry.confirmedPasses,leaderChanges:trial.telemetry.leaderChanges,
 leaderGapMeters:+trial.telemetry.samples.at(-1).leaderToP2Meters.toFixed(1)},
 scope:'90s synthetic test; full-race multi-seed balance and UI smoke separate'},null,2));
