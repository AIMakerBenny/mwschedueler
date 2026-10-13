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
const gates=scenario(`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,2);unifiedInitV11();
track.overtakeZones=[{id:'wrap',detection:.992,start:.018,end:.094}];
const [a,b]=raceMotionV189.vehicles;
a.raceProgress=.993;b.raceProgress=.991;a.pitState=b.pitState='TRACK';
simClockV192.simTimeMs=1000;
unifiedDetectionCrossingsV11([{ref:a,s:.991*5280,pit:'TRACK'}],20,track);
const first=a.unifiedDetectionV11.wrap;
b.raceProgress=.993;simClockV192.simTimeMs=1500;
unifiedDetectionCrossingsV11([{ref:b,s:.991*5280,pit:'TRACK'}],20,track);
const recorded=b.unifiedDetectionV11.wrap,before=b.overtakeActive;
b.raceProgress=1.03;unifiedOvertakeStateV11(b,track);const active=b.overtakeActive;
b.speedKph=0;unifiedOvertakeStateV11(b,track);const noSpeedFallback=b.overtakeActive;
b.pitState='PIT_ENTRY';unifiedOvertakeStateV11(b,track);const pit=b.overtakeActive;
b.pitState='TRACK';b.raceProgress=1.095;unifiedOvertakeStateV11(b,track);const expired=b.overtakeEligible;
b.raceProgress=2.03;unifiedOvertakeStateV11(b,track);const stale=b.overtakeActive;
b.unifiedDetectionV11={};b.raceProgress=1.03;unifiedOvertakeStateV11(b,track);const noRecord=b.overtakeEligible;
return {firstEligible:first.eligible,gap:recorded.gapSeconds,start:recorded.start,end:recorded.end,before,active,noSpeedFallback,pit,expired,stale,noRecord};`);
assert.equal(gates.firstEligible,false);assert(Math.abs(gates.gap-.5)<1e-10);assert(Math.abs(gates.start-1.018)<1e-10);assert(Math.abs(gates.end-1.094)<1e-10);
assert.equal(gates.before,false);assert.equal(gates.active,true);assert.equal(gates.noSpeedFallback,true);
assert.equal(gates.pit,false);assert.equal(gates.expired,false);assert.equal(gates.stale,false);assert.equal(gates.noRecord,false);
const pitPlan=scenario(`
unifiedInitV11();track.pit={entry:.9,stop:.97,exit:.05,speedLimitKph:80};
const v=raceMotionV189.vehicles[0];v.pitRequested=true;v.unifiedPathMetricV11=1;
const entry=unifiedPitTargetV11({ref:v,pit:'TRACK',s:.89*5280,v:80},track,32,100);
v.unifiedPitStopProgressV11=.97;
const stop=unifiedPitTargetV11({ref:v,pit:'PIT_LANE',s:.97*5280-.05,v:.05},track,32,100);
v.pitServiced=true;const release=unifiedPitTargetV11({ref:v,pit:'PIT_LANE',s:.97*5280,v:0},track,32,100);
return {entry,stop,release};`);
assert(pitPlan.entry<80&&pitPlan.entry>=80/3.6);assert.equal(pitPlan.stop,0);assert.equal(pitPlan.release,100);
const pitLoss=scenario(`
unifiedInitV11();const row=unifiedSnapshotV11()[0];row.v=60;track.pit={entry:.92,stop:.97,exit:.08,speedLimitKph:80};
const normal=unifiedPitLossV11(row,track);track.pit.speedLimitKph=60;const slow=unifiedPitLossV11(row,track);
track.pit.exit=.2;const long=unifiedPitLossV11(row,track);return {normal,slow,long};`);
assert(Number.isFinite(pitLoss.normal)&&pitLoss.normal>0);assert(pitLoss.slow>pitLoss.normal);assert(pitLoss.long>pitLoss.slow);
const gateOrder=reverse=>scenario(`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,2);unifiedInitV11();
track.overtakeZones=[{id:'g',detection:.1,start:.2,end:.3}];
const [a,b]=raceMotionV189.vehicles;a.raceProgress=.101;b.raceProgress=.1005;simClockV192.simTimeMs=1000;
const rows=[{ref:a,s:.099*5280,pit:'TRACK'},{ref:b,s:.099*5280,pit:'TRACK'}];
if(${reverse})rows.reverse();unifiedDetectionCrossingsV11(rows,20,track);
return raceMotionV189.vehicles.map(v=>v.unifiedDetectionV11.g);`);
assert.deepEqual(gateOrder(false),gateOrder(true),'Crossing order depends on array order');
const aeroAdapter=src.slice(src.indexOf('function updateActiveAeroAndOvertakeV202(vehicle,stepMs){'),src.indexOf('function getActiveAeroOvertakeStatesV202(){'));
const adapterGate=new Function(setup+engine+aeroAdapter+`
unifiedInitV11();const v=raceMotionV189.vehicles[0];v.raceProgress=.2;v.carAheadId='1';v.gapToCarAheadMeters=0;v.speedKph=300;
track.overtakeZones=[{id:'g',detection:.1,start:.15,end:.3}];
return updateActiveAeroAndOvertakeV202(v,1000).eligible;`)();
assert.equal(adapterGate,false,'Exported adapter reactivated an estimated gap fallback');
const gripEffects=scenario(`
unifiedInitV11();const v=raceMotionV189.vehicles[0];v.tyreCompound='MEDIUM';v.tyreWear=0;v.unifiedTempCV11=100;
v.tyreWarmupFactor=1;simClockV192.simTimeMs=2000;const warm=unifiedGripV11(v);
v.tyreWarmupFactor=.9;const cold=unifiedGripV11(v);
unifiedBeginErrorV11(v,'UNDERSTEER',2,true);const under=unifiedGripV11(v);
const count=v.understeerCount,active=unifiedActiveErrorV11(v),name=unifiedIncidentNameV11(active);
simClockV192.simTimeMs=4000;const expired=unifiedActiveErrorV11(v),recovered=unifiedGripV11(v);
v.pitState='PIT_LANE';const reject=unifiedBeginErrorV11(v,'LOCK_UP',4,true);
return {warm,cold,under,count,active,name,expired,recovered,reject};`);
assert.equal(gripEffects.warm,1);assert.equal(gripEffects.cold,.9);assert.equal(gripEffects.under,.9*.91);
assert.equal(gripEffects.count,1);assert.equal(gripEffects.name,'UNDERSTEER');assert.equal(gripEffects.expired,'');
assert.equal(gripEffects.recovered,.9);assert.equal(gripEffects.reject,'');
const phaseSetup=setup.replace("const getCornerPhaseAtProgressV194=()=>({phase:'STRAIGHT',corner:null});", "let qaPhase='STRAIGHT';const getCornerPhaseAtProgressV194=()=>({phase:qaPhase,corner:null});");
const phaseErrors=new Function(phaseSetup+engine+`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,1);unifiedInitV11();
const v=raceMotionV189.vehicles[0],row=unifiedSnapshotV11()[0];row.v=50;unifiedRandomVehicleV11=()=>0;
let result=[];for(const phase of ['STRAIGHT','BRAKING','TURN_IN','EXIT']){
 qaPhase=phase;v.unifiedErrorUntilV11=0;v.unifiedErrorCooldownV11=0;simClockV192.simTimeMs=2000;
 result.push(unifiedDrivingErrorV11(row,[row],.02,2));
}
row.pit='PIT_LANE';v.pitState='PIT_LANE';const pit=unifiedDrivingErrorV11(row,[row],.02,2);
return {result,pit,sequence:v.unifiedIncidentSequenceV11};`)();
assert.deepEqual(phaseErrors.result,['','LOCKUP','UNDERSTEER','EXIT_ERROR']);assert.equal(phaseErrors.pit,'');assert.equal(phaseErrors.sequence,3);
const incidentAdapters=src.slice(src.indexOf('function activeDrivingIncidentV204(vehicle){'),src.indexOf('function getDrivingIncidentStatesV204(){'));
const adapted=new Function(setup+engine+incidentAdapters+`
unifiedInitV11();const v=raceMotionV189.vehicles[0];simClockV192.simTimeMs=1000;
const forced=triggerDrivingIncidentV204(v,'LOCK_UP',.85,true),until=v.unifiedErrorUntilV11;
const physical=[v.raceProgress,v.speedKph,v.unifiedYV11],state=updateDrivingIncidentsV204(v,1e6,'STRAIGHT');
v.lockupActiveMs=99999;simClockV192.simTimeMs=2000;
return {forced,until,unchanged:until===v.unifiedErrorUntilV11&&JSON.stringify(physical)===JSON.stringify([v.raceProgress,v.speedKph,v.unifiedYV11]),state,expired:activeDrivingIncidentV204(v),count:v.lockupCount};`)();
assert.equal(adapted.forced.type,'LOCK_UP');assert.equal(adapted.count,1);assert.equal(adapted.unchanged,true);assert.equal(adapted.expired,'');
assert.equal(adapted.state.active,'LOCK_UP');assert.equal(adapted.state.speedFactor,1);assert.equal(adapted.state.brakeFactor,1);
const passAdapter=src.slice(src.indexOf('function commentaryPassTargetV230(vehicle,previous,byId){'),src.indexOf('function qaCommentaryEventOrderV230(){'));
const actualTarget=new Function(setup+engine+passAdapter+`
return commentaryPassTargetV230({id:'self',unifiedPassedIdV11:'actual',carAheadId:'next'}, {carAheadId:'wrong'},new Map([['actual',{id:'actual'}],['wrong',{id:'wrong'}],['next',{id:'next'}]])).id;`)();
assert.equal(actualTarget,'actual');
const frictionTrial=(warmup,braking)=>new Function((braking?setup.replace('raceFlagSpeedFactorV214=()=>1','raceFlagSpeedFactorV214=()=>.3'):setup)+engine+`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,1);unifiedInitV11();
const v=raceMotionV189.vehicles[0];v.tyreCompound='MEDIUM';v.tyreWear=0;v.unifiedTempCV11=100;v.tyreWarmupFactor=${warmup};
v.speedKph=${braking?320:150};v.batteryMJ=0;simClockV192.simTimeMs=1000;v.specialUntilV401=11000;
const accepted=simulateUnifiedRaceStepV11(20);return {accepted,v:v.speedKph,a:v.accelerationMps2};`)();
const warmDrive=frictionTrial(1,false),coldDrive=frictionTrial(.9,false),warmBrake=frictionTrial(1,true),coldBrake=frictionTrial(.9,true);
assert(warmDrive.accepted&&coldDrive.accepted&&warmBrake.accepted&&coldBrake.accepted);
assert(coldDrive.v<warmDrive.v,'Cold tyre factor did not reach actual traction');
assert(coldBrake.v>warmBrake.v&&warmBrake.a<0&&coldBrake.a<0,'Cold tyre factor did not reach actual braking');
const commentaryAdapters=src.slice(src.indexOf('function commentaryVehicleStateV219(vehicle){'),src.indexOf('function pitCommentaryEventV230('))+
 src.slice(src.indexOf('function incidentCommentaryTextV219(type,name){'),src.indexOf('function qaRaceCommentaryV219(){'));
const shortEvents=new Function(setup.replace('updateRaceCommentaryV219=()=>{},','')+engine+incidentAdapters+commentaryAdapters+`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,1);unifiedInitV11();const v=raceMotionV189.vehicles[0];
const messages=[],recordTechnicalCommentaryV263=(text,type)=>messages.push({text,type}),emitRaceNarrativeV263=()=>{},appendRaceCommentaryV219=()=>{};
const computeRaceStandingsV191=()=>[{vehicle:v}],commentaryStateV219={initialized:true,lastPollSimMs:0,lastLeaderId:'',lastLeaderLap:0,lastFlag:'GREEN',vehicle:new Map([[v.id,commentaryVehicleStateV219(v)]])};
simClockV192.simTimeMs=2000;triggerDrivingIncidentV204(v,'LOCK_UP',.85,true);
simClockV192.simTimeMs=2300;updateRaceCommentaryV219(true);
simClockV192.simTimeMs=2400;triggerDrivingIncidentV204(v,'LOCK_UP',.85,true);
simClockV192.simTimeMs=2700;updateRaceCommentaryV219(true);updateRaceCommentaryV219(true);
return messages;`)();
assert.equal(shortEvents.length,2,'Short or repeated incident was missed or emitted twice');
assert(shortEvents.every(r=>r.type==='MISTAKE'&&r.text.includes('타이어를 잠갔')));
const slowYaw=scenario(`
unifiedInitV11();const v=raceMotionV189.vehicles[0],s=100,p=unifiedPathSampleV11(s),base=Math.atan2(p.ty,p.tx);
v.unifiedHeadingV11=base+.06;
const row={s,y:0,v:.571280752,ref:v},cmd={v:0,y:.001938,vy:.0969};unifiedMotionV11(row,cmd,.02);
const end=unifiedPathSampleV11(s+cmd.ds),relative=cmd.heading-Math.atan2(end.ty,end.tx),delta=unifiedAngleV11(relative-.06);
const stopped={s,y:0,v:0,ref:v},still=unifiedMotionV11(stopped,{v:0,y:0},.02);
return {delta,bound:cmd.pathDistance/UNIFIED_ENGINE_V11.physicalLength,velocityDelta:Math.abs(cmd.velocityHeading-base),stationaryDelta:unifiedAngleV11(still.heading-v.unifiedHeadingV11)};`);
assert(Math.abs(slowYaw.delta)<=slowYaw.bound+1e-12);assert(slowYaw.velocityDelta>.1);assert(Math.abs(slowYaw.stationaryDelta)<1e-12);
const a=trial(false),b=trial(true);
assert.equal(a.ticks,6000);assert.equal(b.ticks,6000);assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
assert.deepEqual(a.states,b.states,'Vehicle input order affected physical state');assert.equal(a.pitCalls,0);
const long=trial(false,24000);
assert.equal(long.ticks,24000);assert.deepEqual(long.errors,[]);assert(long.passes>0);
for(const v of long.states){assert(v.e>=0&&v.e<=4);assert(v.w>=0&&v.w<=1);assert([v.s,v.y,v.v].every(Number.isFinite));}
console.log(JSON.stringify({result:'PASS',syntheticSeconds:480,cars:12,passes:long.passes,regressions:['swept-contact','lapped-traffic','atomic-rejection','pause-resume','actual-energy','skill-timing','stationary-obstacle','cinematic-chain','finish-crossing','offset-length','world-rotation','world-swept','zoom-feasibility','planned-skill-power','timing-gate-wrap','pit-braking-plan','pit-loss-components','gate-order','warmup-friction','incident-expiry','phase-incidents','incident-adapter','pass-commentary-target','cold-traction-braking','expired-live-event','low-speed-yaw'],
 warning:'Not Chromium or a real-circuit balance/overlap verification'},null,2));
