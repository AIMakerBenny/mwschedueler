// R5-b45: audit actual recorded physical passes and collisions across real
// 10-lap races plus 90-second all-track physics. No physics or rank overrides.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const full=JSON.parse(fs.readFileSync('artifacts/r5-b5/summary.json','utf8'));
const short=JSON.parse(fs.readFileSync('artifacts/f1-v12-r5-balance.json','utf8'));
assert.equal(full.status,'PASS','Three-track full-race source not successful');
assert.deepEqual(full.failures,[],'Full-race source contains failures');
assert.equal(full.runCount,6,'Require three circuits times two seeds');
assert.equal(full.driversObserved,72,'Require 12 drivers in each full race');
const expected=['castle-street-circuit-v1','blue-coast-speedway-v1',
 'royal-street-circuit-v1'];
assert.deepEqual(full.tracks,expected,'Unexpected full-race tracks');
assert.deepEqual(full.seeds,[1,2],'Unexpected real-race seeds');
const races=full.scenarios;
assert.equal(races.length,6,'Missing a completed full-race scenario');
const keyed=new Set();
for(const r of races){
 const key=r.track+'/'+r.seed;
 assert(expected.includes(r.track)&&[1,2].includes(r.seed)&&!keyed.has(key),
  'Duplicate or invalid full-race track/seed '+key);
 keyed.add(key);
 assert.equal(r.entrants,12,'Non-12-driver full race '+key);
 assert.equal(r.laps,10,'Incomplete official lap count '+key);
 assert.equal(r.state,'FINISHING','Full race never reached finish '+key);
 assert.equal(r.physicsFailures,0,'Real physics collision/invalid step '+key);
 assert(Number.isFinite(r.confirmedPasses)&&r.confirmedPasses>0,
  'Physical confirmed passing vanished in '+key);
 assert(Number.isFinite(r.rawCrossings)&&r.confirmedPasses<=r.rawCrossings,
  'Confirmed passes exceed actual physical crossings '+key);
 assert.equal(r.pitRequests,r.completedPitStops,
  'Requested full-life-cycle pit stop not completed '+key);
 assert(new Set(r.finishOrder).size===12&&r.finishOrder.length===12,
  'Finish order must contain exactly 12 distinct drivers '+key);
 assert(Number.isFinite(r.firstFinishSeconds)&&
  Number.isFinite(r.lastFinishSeconds)&&r.lastFinishSeconds>=r.firstFinishSeconds,
  'Invalid physical race finish ledger '+key);
}
const fullPasses=races.reduce((sum,r)=>sum+r.confirmedPasses,0);
assert.equal(full.passCount,fullPasses,'Full-race pass totals not reconciled');
assert(fullPasses>0,'No genuine full-race passing');
assert.equal(short.results?.length,28,'Require 7 real SVG circuits, 2 modes and 2 seeds');
assert.equal(short.sum?.scenarios,28,'All-track summary count inconsistent');
assert.equal(short.sum?.observationOnly,true,'Short-race evidence must not claim ten-lap coverage');
const shortPasses=short.results.reduce((sum,r)=>sum+r.confirmedPasses,0);
const shortLeadChanges=short.results.reduce((sum,r)=>sum+r.leaderChanges,0);
assert.equal(short.sum.totalPasses,shortPasses,'Short-race pass count inconsistent');
assert.equal(short.sum.totalLeaderChanges,shortLeadChanges,'Leader changes inconsistent');
assert(shortPasses>0&&shortLeadChanges>0,'Natural track competition absent');
assert.equal(new Set(short.results.map(r=>r.track)).size,7,'Missing one of seven SVG circuits');
for(const r of short.results){
 assert(r.confirmedPasses>=0&&r.rawCrossings>=r.confirmedPasses,
  'Short-run pass count lacks physical crossing support');
 assert.equal(r.physical?.stops,0,'Short-run physical collision stop');
 assert.deepEqual(r.physical.invalid,[],'Short-run invalid solver state');
 assert.deepEqual(r.physical.overlaps,[],'Actual world-space overlap');
 assert.deepEqual(r.physical.continuity,[],'Non-physical displacement detected');
 assert(r.physical.checks>0,'No real chassis checks');
}
const report={phase:'R5-b45',status:'PASS',
 fullRaces:{scenarios:races.length,drivers:full.driversObserved,laps:10,
  confirmedPasses:fullPasses,automaticPitStops:full.totalAutoStops,
  perTrack:expected.map(track=>({track,
   passes:races.filter(r=>r.track===track).reduce((n,r)=>n+r.confirmedPasses,0)}))},
 shortTrackPhysics:{scenarios:short.results.length,tracks:7,
  confirmedPasses:shortPasses,leaderChanges:shortLeadChanges,
  zeroPassScenarios:short.sum.zeroPassScenarios},
 limits:['Short-track 90-second competition is not a full race',
  'Confirmed engine passes are distinct from visual leaderboard changes',
  'This gate does not claim every random seed is collision-free']};
fs.mkdirSync('artifacts',{recursive:true});
const output='artifacts/f1-v12-r5b45-competition-gate.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,artifact:output}));
