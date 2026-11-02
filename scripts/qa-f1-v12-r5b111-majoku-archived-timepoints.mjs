// R5-b111: independent read of the completed R5-b108 two-seed 10-lap
// replay artifact. A 250-accepted-step traffic window is NOT the same
// instant as the last observed 20ms step in the first 90s.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const replay=read(dir+'replay.json');
const traffic=read(dir+'traffic-attribution.json');
assert.equal(replay.status,'PASS');
assert.equal(traffic.status,'PASS');
assert.equal(replay.track,'majoku-ring-v1');
assert.equal(traffic.track,'majoku-ring-v1');
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
assert.deepEqual(traffic.cases.map(p=>p.seed),[1,2]);
const cases=[];
for(const p of replay.pairs){
 const tr=traffic.cases.find(t=>t.seed===p.seed);
 const raw=read(p.observedFile),windows=raw.real20ms?.trafficWindows;
 assert(tr&&Array.isArray(windows)&&windows.length>=17);
 assert.equal(raw.status,'PASS');
 assert.equal(raw.mode,'NORMAL');
 assert.equal(raw.track,'majoku-ring-v1');
 assert.equal(raw.laps,10);
 assert.equal(raw.finishedRows.length,12);
 assert.equal(raw.physics.collisionStops,0);
 const last=windows.at(-1),phase=tr.phases.at(-1);
 assert.equal(phase.toSeconds,last.endSeconds);
 assert.equal(phase.endGapMeters,last.leadGapMeters);
 assert.equal(p.first90EndGapMeters,raw.real20ms.first90EndGap);
 assert(raw.real20ms.acceptedFrames>=4400&&raw.real20ms.acceptedFrames<=4500);
 assert(last.endSeconds>0&&last.endSeconds<90);
 assert(Number.isFinite(last.leadGapMeters)&&last.leadGapMeters>=0);
 assert(Number.isFinite(p.first90EndGapMeters)&&p.first90EndGapMeters>=0);
 assert.notEqual(last.leadGapMeters,p.first90EndGapMeters,
  'Archived regression fixture must preserve distinct traffic-window and 90s samples');
 assert.deepEqual(raw.real20ms.trafficWindows.map(x=>x.endSeconds),
  [...raw.real20ms.trafficWindows.map(x=>x.endSeconds)].sort((a,b)=>a-b));
 cases.push({seed:p.seed,acceptedPhysicalProbeFrames:raw.real20ms.acceptedFrames,
  lastTrafficWindowSeconds:last.endSeconds,lastTrafficWindowGapMeters:last.leadGapMeters,
  finalProbeGapMeters:p.first90EndGapMeters,
  differentClockInstants:true,physicalOutcomeReplayedWithoutChange:true});
 console.log(JSON.stringify({phase:'R5-b111',status:'ARCHIVED_CASE_PASS',seed:p.seed,
  lastWindowSeconds:last.endSeconds,finalProbeGapMeters:p.first90EndGapMeters}));
}
const result={phase:'R5-b111',status:'PASS',track:'majoku-ring-v1',
 provenance:'GitHub Actions run 41547776746 successful real 10-lap 20ms replay',
 sourceRunId:41547776746,sourceRunConclusion:'SUCCESS',
 fullTenLapRacesAlreadyReplayed:2,newChromiumRacesExecuted:0,
 readOnly:true,aiAdjustmentAuthorized:false,cases,
 warning:'This archived-data regression is not proof of fresh 10-lap QA success'};
fs.writeFileSync(dir+'b111-archived-timepoint-regression.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b111',status:'PASS',cases:cases.length,
 newChromiumRacesExecuted:0}));
