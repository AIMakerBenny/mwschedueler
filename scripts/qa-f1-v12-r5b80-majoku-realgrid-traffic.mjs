// R5-b80: study real Majoku grid traffic braking without claiming
// a safety error based on correlation or a corridor-candidate count.
// Input: actual twelve-car 10-lap matched physical replay, seeds 1 and 2.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const replay=read('artifacts/r5-b77-majoku/replay.json');
assert.equal(replay.status,'PASS');
assert.equal(replay.track,'majoku-ring-v1');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const cases=[];
for(const pair of replay.pairs){
 const observed=read(pair.observedFile),control=read(pair.originalFile);
 assert.equal(observed.status,'PASS');
 assert.equal(control.status,'PASS');
 assert.equal(observed.track,'majoku-ring-v1');
 assert.equal(observed.mode,'NORMAL');assert.equal(observed.laps,10);
 assert.deepEqual(observed.finishedRows,control.finishedRows);
 assert.deepEqual(observed.physics,control.physics);
 assert.deepEqual(observed.acceptedCompetition,control.acceptedCompetition);
 const p=observed.real20ms;
 assert(p&&p.acceptedFrames>=4500&&p.acceptedFrames<=4501);
 assert.equal(p.trafficWindows?.length,18);
 const windows=p.trafficWindows;
 for(const [i,w] of windows.entries()){
  assert(Math.abs(w.endSeconds-5*(i+1))<.005,
   'Expected one real 20ms accepted sample per 5s interval');
  assert(w.leaderAtEnd&&w.secondAtEnd&&w.leaderAtEnd!==w.secondAtEnd);
  assert(w.trafficStepsAll12>=0);
  assert(w.trafficStepsOfCurrentLeader>=0);
  assert(w.trafficStepsOfCurrentSecond>=0);
  assert(w.trafficStepsOfOthers>=0);
  assert.equal(w.trafficStepsAll12,
   w.trafficStepsOfCurrentLeader+w.trafficStepsOfCurrentSecond+
   w.trafficStepsOfOthers);
  assert(Number.isFinite(w.leadGapMeters)&&w.leadGapMeters>=0);
 }
 const phases=[[0,6],[6,12],[12,18]].map(([from,to])=>{
  const sample=windows.slice(from,to),sum=k=>sample.reduce((n,w)=>n+w[k],0);
  return {fromSeconds:from*5,toSeconds:to*5,
   trafficCarStepsAll12:sum('trafficStepsAll12'),
   attributedToLeaderAtWindowEnd:sum('trafficStepsOfCurrentLeader'),
   attributedToSecondAtWindowEnd:sum('trafficStepsOfCurrentSecond'),
   attributedToOtherTenAtWindowEnd:sum('trafficStepsOfOthers'),
   windowsSecondHadMoreBrakingThanLeader:
    sample.filter(w=>w.trafficStepsOfCurrentSecond>w.trafficStepsOfCurrentLeader).length,
   windowsWithSecondFollowing:
    sample.filter(w=>w.secondMode==='FOLLOW').length,
   windowsWithFollowingAndTrafficBrake:
    sample.filter(w=>w.secondMode==='FOLLOW'&&w.trafficStepsOfCurrentSecond>0).length,
   startGapMeters:from?windows[from-1].leadGapMeters:p.firstGridGap,
   endGapMeters:sample.at(-1).leadGapMeters};
 });
 const sumAll=phases.reduce((n,p)=>n+p.trafficCarStepsAll12,0);
 assert.equal(sumAll,p.lastTrafficTotal);
 assert.equal(sumAll,windows.reduce((n,w)=>n+w.trafficStepsAll12,0));
 const logged=observed.physics.passEvents.filter(x=>x.t<=90.001);
 cases.push({seed:pair.seed,realGrid:true,fullNaturalTenLap:true,
  actualFirstStepLeadGapMeters:p.firstGridGap,
  realPhysicalPassesFirst90s:logged.length,
  realPhysicalPassesFullTenLaps:observed.physics.passes,
  accepted20msFrames:p.acceptedFrames,
  closeFasterObservedFrames:p.closeFasterFrames,
  closeFasterFollowFrames:p.followCloseFaster,
  persistent400msFollowEpisodes:p.streak400ms,
  physicalTrafficBrakeCountsTotal90s:sumAll,
  phases,identicalCompleteRace:true,
  limits:['Each 5s traffic interval attributes the full interval to who was first/second at its end',
   'A traffic constraint is not proof of unnecessarily hard braking',
   'An apparent safe corridor is not proof that full merging clearance exists']});
 console.log(JSON.stringify({phase:'R5-b80',status:'CASE_PASS',seed:pair.seed,
  acceptedFrames:p.acceptedFrames,realPasses:logged.length,
  brakingCarSteps:sumAll,prolongedFollow:p.streak400ms}));
}
const result={phase:'R5-b80',status:'PASS',track:'majoku-ring-v1',
 seeds:cases.map(x=>x.seed),actualRealGridAndPitLifecycle:true,
 tenLapPhysicsIdentical:true,livePhysicsChangeAuthorized:false,cases,
 next:'Reconstruct safe swept lane change at specific timestamps before changing pursuit rules',
 notes:['Read-only counter-based evidence, not direct causal overbraking proof',
  'No six other WIP circuits changed']};
const output='artifacts/r5-b77-majoku/traffic-attribution.json';
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b80',status:'PASS',artifact:output}));
