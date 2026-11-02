// R5-b101: audit the genuine physical PASS ledger separately from reorder,
// pit and finish effects, on pinned real 12-car, 10-lap Majoku baselines.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b49-majoku/',out='artifacts/r5-b77-majoku/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const pin=read(out+'b100-pinned-historical-baseline.json');
assert.equal(pin.status,'PASS');
assert.equal(pin.certifiedHistoricalBaselineBytes,true);
const baseline=read(dir+'summary.json');
const cases=[];
for(const c of baseline.cases){
 const r=read(c.outcomeFile);
 const events=r.physics.passEvents;
 assert(Array.isArray(events));
 assert.equal(events.length,r.physics.passes);
 assert.equal(events.length,c.passes);
 assert(r.physics.rawCrossings>=events.length);
 assert.equal(r.physics.rawCrossingEvents.length,r.physics.rawCrossings);
 assert.deepEqual(r.physics.invalid,[]);
 assert.equal(r.physics.collisionStops,0);
 let last=0;
 const participants=new Set(r.finishedRows.map(row=>row.id));
 assert.equal(participants.size,12);
 for(const event of events){
  assert(Number.isFinite(event.t)&&event.t>=last);
  assert(event.t<=r.simulatedSeconds);
  last=event.t;
  assert(participants.has(event.front)&&participants.has(event.passed));
  assert.notEqual(event.front,event.passed);
 }
 assert.equal(r.physics.autoPitPlans.length,r.pitRequests.length);
 assert.equal(r.pitRequests.length,c.pitRequests);
 assert.equal(r.finishedRows.reduce((n,row)=>n+row.pits,0),c.completedPitStops);
 assert.equal(r.finishEvents.length,12);
 assert.deepEqual(r.finishedRows.map(row=>row.position),[1,2,3,4,5,6,7,8,9,10,11,12]);
 const first=r.finishedRows[0],second=r.finishedRows[1];
 assert.equal(first.id,c.winnerId);assert.equal(second.id,c.runnerUpId);
 const gap=(second.finishMs-first.finishMs)/1000;
 assert(Math.abs(gap-c.firstToSecondFinishGapSeconds)<1e-8);
 cases.push({seed:c.seed,physicalPasses:events.length,
  rawCrossings:r.physics.rawCrossings,
  rawCrossingsUnconfirmed:r.physics.rawCrossings-events.length,
  pitRequests:r.pitRequests.length,completedPitStops:c.completedPitStops,
  completedTenLapFinishers:r.finishedRows.length,
  topTwoFinishGapSeconds:gap,collisionStops:0,
  interpretation:'Accepted physical pass events; pit and final-rank reorders are not counted as physical passes'});
 console.log(JSON.stringify({phase:'R5-b101',status:'PASS',seed:c.seed,passes:events.length,
  rawCrossings:r.physics.rawCrossings,pitStops:c.completedPitStops}));
}
const result={phase:'R5-b101',status:'PASS',track:'majoku-ring-v1',
 inputArtifactPinnedByR5b100:true,readOnly:true,cases,
 fullReplayWith20msObservationVerified:false,
 safetyClearanceProven:false,
 limitations:['The historical physical pass ledger is not a new observed 20ms replay',
  'Two deterministic ten-lap seeds do not certify all race balance']};
fs.writeFileSync(out+'b101-physical-pass-ledger.json',JSON.stringify(result,null,2));
