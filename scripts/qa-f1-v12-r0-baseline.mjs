// v1.2 R0 baseline: committed-step diagnostics, independent of input ordering.
import assert from 'node:assert/strict';
import {src,setup,engine} from './f1-unified-v11-fixture.mjs';
assert(src.includes('function unifiedCompetitionRecordV12('));
assert(src.includes('window.mwsF1CompetitionBaselineV12='));
const body=String.raw`
raceMotionV189.vehicles[0].driverProfile.pace=95;
raceMotionV189.vehicles[11].driverProfile.pace=75;
if(REVERSE)raceMotionV189.vehicles.reverse();
unifiedInitV11();
let ticks=0;
for(let k=0;k<ITER;k++){if(!simulateUnifiedRaceStepV11(20))break;ticks++;}
const report=window.mwsF1CompetitionBaselineV12();
const before=JSON.stringify(raceMotionV189.vehicles.map(v=>({id:v.id,p:v.raceProgress,s:v.speedKph})).sort((a,b)=>a.id.localeCompare(b.id)));
report.samples[0].vehicles[0].speedKph=-1000;report.aiModeSteps.FOLLOW=999999;report.previousOrder.push('forgery');
const after=JSON.stringify(raceMotionV189.vehicles.map(v=>({id:v.id,p:v.raceProgress,s:v.speedKph})).sort((a,b)=>a.id.localeCompare(b.id)));
const fresh=window.mwsF1CompetitionBaselineV12();
return {ticks,report:fresh,readOnly:before===after&&fresh.samples[0].vehicles[0].speedKph>=0&&fresh.aiModeSteps.FOLLOW!==999999&&fresh.previousOrder.length===12,
 states:raceMotionV189.vehicles.map(v=>({id:v.id,p:v.raceProgress,s:v.speedKph})).sort((a,b)=>a.id.localeCompare(b.id))};
`;
const run=(reverse,ticks)=>new Function(setup+engine+body.replace('REVERSE',String(reverse)).replace('ITER',String(ticks)))();
const normal=run(false,4500),reverse=run(true,4500);
assert.deepEqual(reverse,normal,'R0 instrumentation changes when vehicle input order reverses');
assert(normal.readOnly,'R0 report is a live writable reference');
assert.equal(normal.ticks,4500);assert.equal(normal.report.lastRecordedMs,90000);
assert.equal(normal.report.samples.length,18);assert.equal(normal.report.samples[0].leader,'0');
assert(normal.report.leaderChanges>=0); // R0 metrics are observations, not mandated outcomes.
assert(normal.report.attemptEventCounts.START>0);
assert(normal.report.trafficConstrainedSteps>0);
const start=normal.report.samples[0],finish=normal.report.samples.at(-1);
assert(finish.leaderToP2Meters>=0);
assert.equal(finish.vehicles.length,12);
assert.equal(normal.report.confirmedPasses,finish.confirmedPasses);
const failed=new Function(setup+engine+String.raw`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,2);
const [a,b]=raceMotionV189.vehicles;b.raceProgress=1+3/5280;b.startOffset=b.raceProgress;
a.pitState='PIT_BOX';a.pitBoxTimerMs=1000;unifiedInitV11();
const ok=simulateUnifiedRaceStepV11(20),r=window.mwsF1CompetitionBaselineV12();
return {ok,samples:r.samples.length,clock:r.lastRecordedMs,collision:r.collisionStops};
`)();
assert.deepEqual(failed,{ok:false,samples:0,clock:0,collision:1});
const clean=new Function(setup+engine+String.raw`
unifiedInitV11();simulateUnifiedRaceStepV11(20);const before=window.mwsF1CompetitionBaselineV12().samples.length;
unifiedResetV11();const r=window.mwsF1CompetitionBaselineV12();
return {before,samples:r.samples.length,clock:r.lastRecordedMs,attempts:Object.keys(r.attemptEventCounts).length};
`)();
assert.deepEqual(clean,{before:1,samples:0,clock:0,attempts:0});
console.log(JSON.stringify({result:'PASS',phase:'v1.2-R0',scenario:'12 cars, synthetic circle, 90 seconds',
  orderIndependent:true,readOnly:true,rejectedAtomic:true,resetClean:true,
  observations:{initialGapMeters:+start.leaderToP2Meters.toFixed(1),lastGapMeters:+finish.leaderToP2Meters.toFixed(1),
   lastVehicleGapMeters:+finish.leaderToLastMeters.toFixed(1),
   leadChanges:normal.report.leaderChanges,confirmedPasses:normal.report.confirmedPasses,
   attackEvents:normal.report.attemptEventCounts,trafficConstrainedSteps:normal.report.trafficConstrainedSteps},
  limitation:'Isolated pit/UI adapters and circle geometry; no real-SVG full-race balance claims'},null,2));
