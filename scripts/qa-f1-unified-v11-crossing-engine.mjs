// Commit-path crossing boundaries. Physics and crossing detection are unmodified;
// controlled AI decisions isolate attribution from race-balance randomness.
import assert from 'node:assert/strict';
import {setup,engine,src} from './f1-unified-v11-fixture.mjs';

const finishAdapter=src.slice(src.indexOf('function markRaceFinishersRecoveryG(){'),
  src.indexOf('function buildRaceTelemetryV237('));
const liveFinishSetup=setup.replace('updateRaceLifecycleRecoveryG=()=>false',
  "updateRaceLifecycleRecoveryG=()=>{markRaceFinishersRecoveryG();return raceMotionV189.vehicles.every(v=>v.finished);}");
assert.notEqual(liveFinishSetup,setup);
const pitSetup=setup.replace('updatePitPostStepV205=()=>{},','');
assert.notEqual(pitSetup,setup);
const pitAdapters=src.slice(src.indexOf('function pitDistanceAheadV205('),src.indexOf('function requestPitStopV205('))+
 src.slice(src.indexOf('function completePitExitV205('),src.indexOf('function updatePitPreStepV205('))+
 src.slice(src.indexOf('function updatePitPostStepV205('),src.indexOf('function getPitStatesV205('));
const pitSupport=src.slice(src.indexOf('const PIT_CONFIG_V205='),src.indexOf('\n',src.indexOf('const PIT_CONFIG_V205=')))+String.raw`
const normalizedProgressV190=p=>((Number(p)%1)+1)%1,clamp01V198=n=>Math.max(0,Math.min(1,n));
const F1_LINE_MODES_V197=['IDEAL','OUTSIDE','PIT_LINE'];
// Legacy interaction/UI cleanup is outside these unified crossing assertions.
const clearPitInteractionStateV369=()=>{};
`;
const common=String.raw`
const options=OPTIONS;
let f1ScreenStateV185='RACE',finishCounterRecoveryG=0;
const DEFAULT_TOTAL_LAPS_V190=10;
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,options.finish?2:3);
const [a,b,c]=raceMotionV189.vehicles,len=track.lengthMeters;
const base=options.finish?10*len-(options.finishGap||3):options.lap?len-.5:100;
const states=[[a,base,-3.5,200],[b,base+.3,3.5,180]];
if(c)states.push([c,base+100,-3.5,180]);
if(options.multi){states[1][1]=base+.03;states[1][3]=170;states[2]=[c,base+.06,0,150];}
for(const [v,s,y,speed] of states){
 v.raceProgress=v.startOffset=s/len;v.lateralOffsetMeters=y;v.speedKph=speed;
}
if(options.reverse)raceMotionV189.vehicles.reverse();
unifiedInitV11();simClockV192.simTimeMs=1000;
for(const v of raceMotionV189.vehicles){v.unifiedAiAtV11=1e9;v.unifiedPitEvalAtV11=1e9;}
a.unifiedAiStateV11='PLAN_ATTACK';a.unifiedAiTargetV11='1';
const read=()=>JSON.parse(JSON.stringify({
 clock:simClockV192.simTimeMs,raw:unifiedStateV11.telemetry.rawCrossings,
 passes:unifiedStateV11.telemetry.passes,candidates:[...unifiedStateV11.passCandidates],
 events:unifiedStateV11.attemptHistory,active:[...unifiedStateV11.attempts],
 cars:raceMotionV189.vehicles.map(v=>({id:String(v.id),s:v.raceProgress,y:v.unifiedYV11,
   speed:v.speedKph,pit:v.pitState,finished:v.finished,finish:v.finishedAtSimMs,
   counter:Number(v.passCompletedCount)||0,rng:v.unifiedRngV11})).sort((x,y)=>x.id.localeCompare(y.id))
}));
const step=()=>{
 const invalidBefore=unifiedStateV11.telemetry.invalid.length;
 const accepted=simulateUnifiedRaceStepV11(20);
 if(unifiedStateV11.telemetry.invalid.length>invalidBefore)throw new Error(JSON.stringify(unifiedStateV11.telemetry.invalid));
 return accepted;
};
const until=ms=>{while(simClockV192.simTimeMs<ms){if(!step())throw new Error('Unexpected end before '+ms);}};
`;
function run(options,body){
 return new Function((options.finish?liveFinishSetup:options.pit?pitSetup:setup)+engine+finishAdapter+
   (options.pit?pitSupport+pitAdapters:'')+
   common.replace('OPTIONS',JSON.stringify(options))+body)();
}
function checkOrder(options,body){
 const result=run({...options,reverse:false},body);
 assert.deepEqual(run({...options,reverse:true},body),result,'Commit boundaries depend on vehicle enumeration');
 return result;
}
const cases=[];
const base=checkOrder({},String.raw`
until(1020);const opening=read();until(1060);const crossed=read();
simClockV192.paused=true;const paused=read();for(let i=0;i<5;i++)step();
const held=JSON.stringify(paused)===JSON.stringify(read());simClockV192.paused=false;
until(1540);const waiting=read();until(1560);const confirmed=read();until(1600);
return {opening,crossed,held,waiting,confirmed,final:read()};`);
assert.equal(base.opening.raw.length,0);
assert.equal(base.opening.events[0].type,'START');
assert.equal(base.crossed.raw.length,1);
assert.equal(base.crossed.candidates[0][1].at,1060);
assert.equal(base.waiting.passes.length,0,'Crossing was rewarded before 500ms');
assert(base.held,'Pause changed pending crossing/attempt state');
assert.equal(base.confirmed.passes.length,1);
assert.equal(base.final.passes.length,1,'A second step rewarded the same crossing');
assert.equal(base.final.cars[0].counter,1);
assert.equal(base.final.events.filter(e=>e.type==='SUCCESS').length,1);
cases.push('exact-500ms-once','pause-resume');

for(const sameTarget of [false,true]){
 const switched=checkOrder({},String.raw`
until(1060);const first=read().candidates[0][1].crossingAttempt;
${sameTarget?"a.unifiedAiStateV11='FOLLOW';step();a.unifiedAiStateV11='PLAN_ATTACK';":
   "a.unifiedAiTargetV11=String(c.id);"}
step();const second={...unifiedStateV11.attempts.get('0')};
until(1560);return {first,second,final:read()};`);
 const success=switched.final.events.filter(e=>e.type==='SUCCESS');
 assert.equal(success.length,1);assert.equal(success[0].attemptId,switched.first.id);
 assert.notEqual(switched.first.id,switched.second.id);
 assert.deepEqual(switched.final.active.find(([id])=>id==='0')[1],switched.second,
   'Delayed success terminated the newer attack');
 cases.push(sameTarget?'same-opponent-retry-survives':'new-opponent-attack-survives');
}

const recrossed=checkOrder({},String.raw`
until(1060);a.speedKph=100;b.speedKph=250;step();const reversed=read();
a.speedKph=300;b.speedKph=100;step();const recrossed=read();
until(1580);const oldDeadline=read();until(1600);const settled=read();until(1640);
return {reversed,recrossed,oldDeadline,settled,final:read()};`);
assert.equal(recrossed.reversed.candidates[0][1].front,'1');
assert.equal(recrossed.recrossed.candidates[0][1].front,'0');
assert.equal(recrossed.oldDeadline.passes.length,0,'Reversal retained the obsolete crossing deadline');
assert.equal(recrossed.settled.passes.length,1);
assert.equal(recrossed.final.passes.length,1);
assert.equal(recrossed.final.events.find(e=>e.type==='SUCCESS').crossingMs,1100);
cases.push('recross-restarts-confirmation');

const multiple=checkOrder({multi:true},String.raw`
// Record the selected attack via a committed step before the simultaneous reversals.
a.speedKph=b.speedKph=c.speedKph=100;step();
a.speedKph=200;b.speedKph=170;c.speedKph=150;step();
const crossed=read();until(1540);const confirmed=read();until(1600);
return {crossed,confirmed,final:read()};`);
assert.equal(multiple.crossed.raw.length,3);
assert.equal(multiple.confirmed.passes.length,3);
assert.equal(multiple.final.passes.length,3);
assert.equal(multiple.final.events.filter(e=>e.type==='SUCCESS').length,1);
assert.equal(multiple.final.events.filter(e=>e.type==='UNATTRIBUTED_PASS').length,2);
assert.deepEqual(multiple.final.cars.map(v=>v.counter),[2,1,0]);
cases.push('three-simultaneous-crossings-exact-target-only');

const lap=checkOrder({lap:true},String.raw`
until(1060);const crossed=read();until(1600);return {crossed,final:read()};`);
assert(lap.crossed.cars[0].s>1&&lap.crossed.cars[1].s>1);
assert.equal(lap.final.passes.length,1);
assert.equal(lap.final.events.filter(e=>e.type==='SUCCESS').length,1);
cases.push('lap-wrap');

// Actual TRACK -> PIT_ENTRY adapter, on either side of an existing crossing.
for(const entrant of ['a','b']){
 const pit=checkOrder({pit:true},String.raw`
until(1060);const first=read();
const entrant=${entrant};entrant.pitRequested=true;
track.pit={entry:entrant.raceProgress+.5/len,stop:.9,exit:.95,speedLimitKph:80};
step();const entered=read();until(1600);return {first,entered,final:read()};`);
 assert.equal(pit.first.candidates.length,1);
 assert.equal(pit.entered.cars.find(v=>v.id===(entrant==='a'?'0':'1')).pit,'PIT_ENTRY');
 assert.deepEqual(pit.entered.candidates,[],'Pit entry retained an unsettled crossing');
 assert.deepEqual(pit.entered.active,[],'Pit entry left an attack against an unavailable car');
 assert.equal(pit.entered.events.filter(e=>e.type==='PIT_INTERRUPTED').length,1);
 assert.deepEqual(pit.final.passes,[],'Pit-interrupted crossing was later rewarded');
 cases.push(entrant==='a'?'attacker-pit-entry':'opponent-pit-entry');
}

// Real finish adapter executes after the ledger in the same final committed step.
// With no subsequent race tick, its active attacks/candidates must already be closed.
const finish=checkOrder({finish:true},String.raw`
step();step();const running=read();const accepted=step();
return {running,accepted,final:read()};`);
assert.equal(finish.running.events[0].type,'START');
assert.equal(finish.accepted,false);assert(finish.final.cars.every(v=>v.finished));
assert.deepEqual(finish.final.active,[],'Final committed finish left an active attack forever');
assert.deepEqual(finish.final.candidates,[],'Final committed finish left a pending crossing forever');
assert.deepEqual(finish.final.passes,[],'A post-finish order change was rewarded');
assert.equal(finish.final.events.filter(e=>e.type==='PIT_INTERRUPTED').length,1);
cases.push('last-step-finish-cleanup');

const finishPending=checkOrder({finish:true,finishGap:10},String.raw`
until(1060);const crossed=read();let running=true;
while(running&&simClockV192.simTimeMs<2000)running=step();
return {crossed,running,final:read()};`);
assert.equal(finishPending.crossed.candidates.length,1);
assert.equal(finishPending.running,false);
assert(finishPending.final.cars.every(v=>v.finished));
assert.deepEqual(finishPending.final.candidates,[],'Finish kept a crossing created on an earlier step');
assert.deepEqual(finishPending.final.active,[]);
assert.deepEqual(finishPending.final.passes,[]);
cases.push('finish-during-pending-confirmation');

const pitExit=checkOrder({pit:true},String.raw`
until(1060);const crossed=read();b.pitState='PIT_EXIT';
track.pit={entry:.01,stop:.02,exit:.03,speedLimitKph:80};
b.pitExitRaceProgress=b.raceProgress-PIT_CONFIG_V205.exitMergeProgress;
step();const returned=read();until(1600);return {crossed,returned,final:read()};`);
assert.equal(pitExit.crossed.candidates.length,1);
assert.equal(pitExit.returned.cars[1].pit,'TRACK','Real pit-exit adapter was not exercised');
assert.deepEqual(pitExit.returned.candidates,[],'Pit-exit return preserved the old on-track crossing');
assert.deepEqual(pitExit.final.passes,[],'Pit-exit return revived a canceled overtake');
cases.push('pit-exit-return-no-revival');

const rejected=checkOrder({},String.raw`
until(1060);const previous={...c};
c.startOffset=a.raceProgress;c.travel=0;c.raceProgress=a.raceProgress;
c.unifiedYV11=a.unifiedYV11;c.pitState='PIT_BOX';c.pitBoxTimerMs=1000;
const before=read(),accepted=simulateUnifiedRaceStepV11(20),after=read();
const invalid=unifiedStateV11.telemetry.invalid.length;
for(const key of Object.keys(c))if(!(key in previous))delete c[key];Object.assign(c,previous);
simClockV192.paused=false;until(1560);return {before,accepted,after,invalid,final:read()};`);
assert.equal(rejected.accepted,false);assert.equal(rejected.invalid,1);
assert.deepEqual(rejected.after,rejected.before,'Rejected step changed a pending crossing, attack, clock or physical state');
assert.equal(rejected.final.passes.length,1);
assert.equal(rejected.final.events.filter(e=>e.type==='SUCCESS').length,1);
cases.push('pending-crossing-reject-resume');

// Public ledger copies, bounded event memory and race reset are passive contracts.
const ledger=run({},String.raw`
const markerOverlapReportV377=()=>[],raceCameraV216={zoom:1};
until(1020);a.unifiedAiStateV11='EXIT_DUEL';a.unifiedMergeBlockedV11=['1'];step();
const original=JSON.stringify(window.mwsF1UnifiedV11Report().attackLedger);
const report=window.mwsF1UnifiedV11Report().attackLedger;
report.active[0].target='mutated';report.events.find(e=>e.blockedBy).blockedBy.push('mutated');
report.events[0].target='mutated';report.events.length=0;
const copied=original===JSON.stringify(window.mwsF1UnifiedV11Report().attackLedger);
const physical=()=>JSON.stringify(raceMotionV189.vehicles.map(v=>({id:v.id,s:v.raceProgress,y:v.unifiedYV11,
 v:v.speedKph,E:v.batteryMJ,w:v.tyreWear,rng:v.unifiedRngV11})));
const before=physical(),clock=simClockV192.simTimeMs;
for(let i=0;i<1100;i++){
 a.unifiedAiStateV11='FOLLOW';unifiedObserveAttackV11(clock);
 a.unifiedAiStateV11='PLAN_ATTACK';unifiedObserveAttackV11(clock);
}
const bounded=window.mwsF1UnifiedV11Report().attackLedger;
const unchanged=before===physical()&&clock===simClockV192.simTimeMs;
unifiedResetV11();const reset=window.mwsF1UnifiedV11Report().attackLedger;
unifiedInitV11();const restarted=window.mwsF1UnifiedV11Report().attackLedger;
return {copied,unchanged,size:bounded.events.length,totalStarts:bounded.totalStarts,reset,restarted,pending:unifiedStateV11.passCandidates.size};`);
assert(ledger.copied,'Public report exposes mutable attempt/blocked-event state');
assert(ledger.unchanged,'Passive ledger changed vehicle physics or clock');
assert.equal(ledger.size,2048);assert.equal(ledger.totalStarts,1101);
assert.deepEqual(ledger.reset,{active:[],events:[],totalStarts:0});
assert.deepEqual(ledger.restarted,ledger.reset);assert.equal(ledger.pending,0);
cases.push('report-copy-memory-bound-reset');

console.log(JSON.stringify({result:'PASS',cases,orderIndependent:true,
 scope:'Actual 20ms engine commits with controlled AI and real post-step pit/finish adapters; full pit/UI journeys are covered separately.'},null,2));
