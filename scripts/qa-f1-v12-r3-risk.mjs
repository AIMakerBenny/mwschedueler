// R3: committed context-sensitive driver risk and legacy error types.
import assert from 'node:assert/strict';
import {src,setup,engine} from './f1-unified-v11-fixture.mjs';
assert(src.includes('function unifiedRiskUpdateV12('));
assert(src.includes('window.mwsF1RiskV12Report='));
const scenario=String.raw`
unifiedInitV11();
const v=raceMotionV189.vehicles[0],p=raceMotionV189.vehicles[1],q=raceMotionV189.vehicles[2];
const me={id:'me',ref:v,s:100,y:0,v:50,w:.2,pit:'TRACK',finished:false},
 behind={id:'behind',ref:p,s:76,y:0,v:55,pit:'TRACK',finished:false},
 ahead={id:'ahead',ref:q,s:122,y:0,v:48,pit:'TRACK',finished:false};
const alone=unifiedPressureContextV12(me,[me]),close=unifiedPressureContextV12(me,[me,behind,ahead]);
const fresh=unifiedIncidentRateV11(v,.2,alone.pressure,0,{stress:0,pushing:0,heat:0});
const hot=unifiedIncidentRateV11(v,.85,close.pressure,1,{stress:.9,pushing:1,heat:1});
v.unifiedStrategyEffortV12=1.22;v.unifiedAiStateV11='PLAN_ATTACK';
for(let i=0;i<300;i++)unifiedRiskUpdateV12(me,[me,behind,ahead],.02);
const loaded=v.unifiedRiskStressV12;v.unifiedStrategyEffortV12=.85;v.unifiedAiStateV11='CRUISE';
for(let i=0;i<2000;i++)unifiedRiskUpdateV12(me,[me],.02);
const recovered=v.unifiedRiskStressV12;
v.unifiedRiskStressV12=0;v.unifiedRiskContextV12=null;v.unifiedAiStateV11='CRUISE';
if(REVERSE)raceMotionV189.vehicles.reverse();
let ticks=0;
for(let k=0;k<ITER;k++){if(!simulateUnifiedRaceStepV11(20))break;ticks++;}
const report=window.mwsF1RiskV12Report();report.entrants[0].stress=9;report.events.push({fake:true});
const read=window.mwsF1RiskV12Report();
return {alone,close,fresh,hot,loaded,recovered,ticks,
 readonly:read.entrants[0].stress!==9&&!read.events.some(x=>x.fake),
 collisions:unifiedStateV11.telemetry.collisionStops,invalid:unifiedStateV11.telemetry.invalid.length,
 eventCount:read.events.length,
 vehicles:raceMotionV189.vehicles.map(v=>({id:v.id,s:v.raceProgress,y:v.unifiedYV11,
  stress:v.unifiedRiskStressV12,incidents:v.unifiedIncidentSequenceV11})).sort((a,b)=>a.id.localeCompare(b.id))};
`;
const run=(rev,n)=>new Function(setup+engine+scenario.replace('REVERSE',String(rev)).replace('ITER',String(n)))();
const a=run(false,6000),b=run(true,6000);
assert.deepEqual(a,b,'Input vehicle ordering changes R3');
assert.equal(a.ticks,6000);assert.equal(a.collisions,0);assert.equal(a.invalid,0);
assert(a.close.pressure>a.alone.pressure&&a.hot>a.fresh);
assert(a.loaded>a.recovered&&a.readonly);
assert(a.vehicles.every(v=>Number.isFinite(v.s)&&Number.isFinite(v.y)&&v.stress>=0&&v.stress<=1));
const phases=setup.replace("const getCornerPhaseAtProgressV194=()=>({phase:'STRAIGHT',corner:null});",
 "let qaPhase='STRAIGHT';const getCornerPhaseAtProgressV194=()=>({phase:qaPhase,corner:null});");
const errors=new Function(phases+engine+String.raw`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,1);unifiedInitV11();
const v=raceMotionV189.vehicles[0],row={...unifiedSnapshotV11()[0],v:48};
unifiedRandomVehicleV11=()=>0;
const cases=[];
for(const phase of ['STRAIGHT','BRAKING','TURN_IN','EXIT']){
 qaPhase=phase;v.unifiedErrorUntilV11=0;v.unifiedErrorCooldownV11=0;simClockV192.simTimeMs=3000;
 cases.push(unifiedDrivingErrorV11(row,[row],.02,3));
}
return {cases,seq:v.unifiedIncidentSequenceV11};
`)();
assert.deepEqual(errors,{cases:['','LOCKUP','UNDERSTEER','EXIT_ERROR'],seq:3});
const pit=new Function(setup+engine+String.raw`
unifiedInitV11();const v=raceMotionV189.vehicles[0],row={...unifiedSnapshotV11()[0],pit:'PIT_LANE'};
v.pitState='PIT_LANE';v.unifiedRiskStressV12=.8;
const ctx=unifiedRiskUpdateV12(row,[row],1);
const before=JSON.stringify([v.raceProgress,v.speedKph,v.unifiedYV11]);
const incident=unifiedDrivingErrorV11(row,[row],.02,2);
return {risk:ctx.riskPerSecond,incident,unchanged:before===JSON.stringify([v.raceProgress,v.speedKph,v.unifiedYV11])};
`)();
assert.equal(pit.risk,0);assert.equal(pit.incident,'');assert(pit.unchanged);
const atomic=new Function(setup+engine+String.raw`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,2);
const [a,b]=raceMotionV189.vehicles;b.raceProgress=1+3/5280;b.startOffset=b.raceProgress;
a.pitState='PIT_BOX';a.pitBoxTimerMs=1000;unifiedInitV11();
const before=JSON.stringify(raceMotionV189.vehicles);
const accepted=simulateUnifiedRaceStepV11(20),report=window.mwsF1RiskV12Report();
return {accepted,rollback:before===JSON.stringify(raceMotionV189.vehicles),
 clock:simClockV192.simTimeMs,events:report.events.length};
`)();
assert.deepEqual(atomic,{accepted:false,rollback:true,clock:0,events:0});
console.log(JSON.stringify({result:'PASS',phase:'v1.2-R3',seconds:120,
 calmRate:a.fresh,highLoadRate:a.hot,stressPeak:a.loaded,stressAfterRest:a.recovered,
 eventCount:a.eventCount,orderIndependent:true,phaseCorrect:true,pitSafe:true,
 noPhysicsCollision:true,readonly:true,rejectedStepAtomic:true,
 limitation:'Short synthetic circle, not full race or all-tracks balance'},null,2));
