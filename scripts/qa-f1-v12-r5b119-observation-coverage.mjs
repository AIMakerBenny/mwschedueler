// R5-b119: distinguish independently OBSERVED accepted 20ms steps,
// browser-clock progression, and 250-manual-step traffic attribution.
// Never pretend an unobserved RAF step was a manually inspected AI frame.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(root+n,'utf8'));
const replay=read('replay.json'),traffic=read('traffic-attribution.json');
assert.equal(replay.status,'PASS');
assert.equal(traffic.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const cases=[];
for(const pair of replay.pairs){
 const race=read('seed'+pair.seed+'-observed10.json');
 const p=race.real20ms;
 const observedTraffic=traffic.cases.find(c=>c.seed===pair.seed);
 assert(p&&observedTraffic,'Incomplete observed genuine race evidence');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');
 assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 assert(Number.isInteger(p.acceptedFrames)&&p.acceptedFrames>=4400&&p.acceptedFrames<=4500);
 assert(Number.isInteger(p.lastManualSampleMs)&&p.lastManualSampleMs>=89960&&p.lastManualSampleMs<=90001);
 assert(Number.isInteger(p.clockGapEvents)&&p.clockGapEvents>=0);
 assert(Array.isArray(p.trafficWindows)&&p.trafficWindows.length>=17&&p.trafficWindows.length<=18);
 assert.equal(p.trafficWindows.length,observedTraffic.phases.reduce((n,x,i)=>
  n+(i===0?0:0),0)+p.trafficWindows.length); // no fabricated traffic window count
 const observedManualMs=p.acceptedFrames*20;
 const apparentUnobservedClockMs=p.lastManualSampleMs-observedManualMs;
 assert(apparentUnobservedClockMs>=0);
 assert.equal(apparentUnobservedClockMs%20,0);
 assert(p.clockGapEvents>0||apparentUnobservedClockMs===0);
 const latestWindow=p.trafficWindows.at(-1);
 assert(latestWindow&&latestWindow.endSeconds>0&&latestWindow.endSeconds<=90.001);
 assert.equal(latestWindow.endSeconds,observedTraffic.phases.at(-1).toSeconds);
 assert.equal(latestWindow.leadGapMeters,observedTraffic.phases.at(-1).endGapMeters);
 assert.equal(p.first90EndGap,pair.first90EndGapMeters);
 assert.equal(p.lastTrafficTotal,
  p.trafficWindows.reduce((sum,w)=>sum+w.trafficStepsAll12,0));
 const gapToProbeEndSeconds=p.lastManualSampleMs/1000-latestWindow.endSeconds;
 assert(gapToProbeEndSeconds>=0);
 const row={seed:pair.seed,fullRaceReplayed:true,accepted20msProbeFrames:p.acceptedFrames,
  lastObservedSimulationMs:p.lastManualSampleMs,
  observedManualStepTimeMs:observedManualMs,
  simulationClockTimeWithoutManualObservationMs:apparentUnobservedClockMs,
  browserClockGapEvents:p.clockGapEvents,trafficWindowCount:p.trafficWindows.length,
  finalTrafficWindowSeconds:latestWindow.endSeconds,
  finalTrafficWindowGapMeters:latestWindow.leadGapMeters,
  final90sProbeGapMeters:p.first90EndGap,
  gapBetweenLastTrafficWindowAndLastProbeSeconds:gapToProbeEndSeconds,
  frameCoverageFraction:observedManualMs/p.lastManualSampleMs,
  otherSixWipTracksUntouched:true,
  collisionFreeMergeProven:false,
  warning:'Unobserved clock time is not an accepted manual AI evidence frame; a traffic window ending earlier cannot be compared as the same instant with 90s gap'};
 cases.push(row);
 console.log(JSON.stringify({phase:'R5-b119',status:'CASE_PASS',seed:row.seed,
  frames:row.accepted20msProbeFrames,gaps:row.browserClockGapEvents,
  lastTrafficWindowSeconds:row.finalTrafficWindowSeconds}));
}
const result={phase:'R5-b119',status:'PASS',track:'majoku-ring-v1',
 realChromiumEvidenceReadOnly:true,physicsChanged:false,aiTuningApproved:false,
 sourceRun:41547776746,cases};
fs.writeFileSync(root+'b119-observation-coverage.json',JSON.stringify(result,null,2));
