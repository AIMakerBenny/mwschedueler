// R5-b104: strict full-JSON check for both new genuine Majoku 10-lap replays.
// Exempt ONLY the intentionally added read-only real20ms observer and port
// metadata in diagnostic browser caller stack. Never exempt physics or pits.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeMajokuScreenTransitions} from './lib/f1-r5b102-transitions.mjs';
const dir='artifacts/r5-b77-majoku/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const pinned=read(dir+'b100-pinned-historical-baseline.json');
const historical=read(dir+'b101-physical-pass-ledger.json');
const replay=read(dir+'replay.json');
const b88=read(dir+'b88-physical-fingerprints.json');
const b89=read(dir+'b89-live-ai-evidence-gate.json');
for(const x of [pinned,historical,replay,b88,b89])assert.equal(x.status,'PASS');
assert.equal(pinned.certifiedHistoricalBaselineBytes,true);
assert.equal(historical.inputArtifactPinnedByR5b100,true);
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.equal(b88.physicalOutcomesIdentical,true);
assert.equal(b89.sweptCollisionClearanceProven,false);
assert.equal(b89.mergeReservationSafetyProven,false);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const normalized=r=>{
 const copy=structuredClone(r);
 delete copy.real20ms;
 copy.screenTransitions=normalizeMajokuScreenTransitions(copy.screenTransitions);
 return copy;
};
const cases=[];
for(const pair of replay.pairs){
 const before=read(pair.originalFile),after=read(pair.observedFile);
 const seeded=historical.cases.find(x=>x.seed===pair.seed);
 const frozen=pinned.cases.find(x=>x.seed===pair.seed);
 const fingerprint=b88.cases.find(x=>x.seed===pair.seed);
 assert(seeded&&frozen&&fingerprint);
 assert.equal(after.status,'PASS');
 assert.equal(after.seedId,String(pair.seed));
 assert.equal(after.track,'majoku-ring-v1');
 assert.equal(after.mode,'NORMAL');
 assert.equal(after.laps,10);
 assert.equal(after.state,'FINISHING');
 assert.equal(after.finishedRows.length,12);
 assert.equal(after.physics.collisionStops,0);
 assert.deepEqual(after.physics.invalid,[]);
 assert.deepEqual(after.continuityErrors,[]);
 assert.deepEqual(after.pageErrors,[]);
 assert(after.real20ms?.acceptedFrames>=4400&&after.real20ms?.acceptedFrames<=4500);
 assert.deepEqual(normalized(after),normalized(before),
  'R5-b104 original and observed complete game output changed seed '+pair.seed);
 assert.deepEqual(after.physics.passEvents,before.physics.passEvents);
 assert.deepEqual(after.pitTransitions,before.pitTransitions);
 assert.deepEqual(after.pitStates,before.pitStates);
 assert.deepEqual(after.finishedRows,before.finishedRows);
 assert.equal(after.physics.passes,seeded.physicalPasses);
 assert.equal(after.physics.passes,frozen.passes);
 assert.equal(after.finishedRows.reduce((n,r)=>n+r.pits,0),seeded.completedPitStops);
 assert.equal(fingerprint.identicalOutcomes,true);
 cases.push({seed:pair.seed,drivers:12,laps:10,
  confirmedPhysicalPasses:after.physics.passes,
  genuinePitStops:seeded.completedPitStops,
  collisionStops:0,observed20msFrames:after.real20ms.acceptedFrames,
  allGameResultFieldsIdenticalExceptDiagnosticPort:true});
 console.log(JSON.stringify({phase:'R5-b104',status:'CASE_PASS',seed:pair.seed,
  confirmedPhysicalPasses:after.physics.passes,
  genuinePitStops:seeded.completedPitStops}));
}
const result={phase:'R5-b104',status:'PASS',track:'majoku-ring-v1',
 trulyReplayedNormalTenLapRaces:2,
 completeFullJsonOutcomeIdentical:true,
 readOnly20msObserver:true,cases,
 physicallySafeMergeProven:false,
 permissionToReduceSafetyBraking:false,
 permissionToBoostTrailingCars:false,
 otherSixWipTracksModified:false,
 disclaimer:'Only per-run data certification. A completed GitHub job and its artifacts are still required.'};
fs.writeFileSync(dir+'b104-full-physical-outcome-gate.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b104',status:'PASS',
 fullRaceVerifiedWithinCurrentJob:true,aiTuningAuthorized:false}));
