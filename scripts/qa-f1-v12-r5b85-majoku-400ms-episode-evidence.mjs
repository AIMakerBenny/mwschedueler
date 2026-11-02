// R5-b85 read-only real 20ms FOLLOW evidence audit.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root='artifacts/r5-b77-majoku/';
const replay=read(root+'replay.json'),corridor=read(root+'corridor-evidence.json');
assert.equal(replay.status,'PASS');assert.equal(corridor.status,'PASS');
assert.equal(replay.track,'majoku-ring-v1');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const cases=[];
for(const pair of replay.pairs){
 const original=read(pair.originalFile),observed=read(pair.observedFile),p=observed.real20ms;
 const c=corridor.cases.find(x=>x.seed===pair.seed);
 assert(c&&p);
 assert.equal(original.status,'PASS');assert.equal(observed.status,'PASS');
 assert.equal(observed.track,'majoku-ring-v1');
 assert.equal(observed.mode,'NORMAL');assert.equal(observed.laps,10);
 assert.equal(observed.profileScenario,'NATURAL');
 assert.equal(observed.finishedRows.length,12);
 assert.equal(observed.physics.collisionStops,0);
 assert.deepEqual(observed.physics.invalid,[]);
 assert.deepEqual(observed.continuityErrors,[]);
 assert.deepEqual(observed.pageErrors,[]);
 for(const k of ['finishedRows','finishEvents','pitRequests','pitTransitions',
  'physics','acceptedCompetition','initialOrder','startingCompounds',
  'tickCount','simulatedSeconds'])
  assert.deepEqual(observed[k],original[k], 'Read-only probe altered '+k);
 assert.equal(p.acceptedFrames,4500);
 assert.equal(p.followCloseFaster,p.followWithoutCandidateFrames+
  p.followCandidateBlockedFrames+p.followCandidateUnblockedFrames);
 assert.equal(p.candidateUnblocked400msEpisodes,c.sustained400msUnblockedCandidateFollowingEpisodes);
 const samples=p.candidateUnblocked400msSamples;
 assert(Array.isArray(samples));
 assert.equal(samples.length,p.candidateUnblocked400msEpisodes);
 assert.equal(samples.length>0,p.candidateUnblockedLongestFrames>=20);
 let lastTick=0;
 for(const e of samples){
  assert.equal(e.physicsStepMs,20);
  assert.equal(e.consecutiveFrames,20);
  assert.equal(e.lastFrameTick-e.firstFrameTick,19);
  assert(e.firstFrameTick>=1&&e.lastFrameTick<=p.acceptedFrames);
  assert(e.lastFrameTick>lastTick);lastTick=e.lastFrameTick;
  assert.equal(e.endSimMs,e.consecutive20msFrames?.[19]?.simTimeMs);
  assert(e.consecutive20msFrames.every((f,i,frames)=>
   !i||f.simTimeMs-frames[i-1].simTimeMs===20));
  assert(e.leaderId&&e.followerId&&e.leaderId!==e.followerId);
  assert(e.gapMeters>0&&e.gapMeters<=70);
  assert(e.relativeSpeedMps>2);
  assert.equal(e.aiState,'FOLLOW');assert(e.candidateCount>0);
  assert.equal(e.reportedMergeBlockers,0);
  assert.equal(e.sweptClearanceProven,false);
  assert.equal(e.mergeReservationClearanceProven,false);
 }
 cases.push({seed:pair.seed,finishers:12,passes:observed.physics.passes,
  pitStops:observed.finishedRows.reduce((n,r)=>n+r.pits,0),collisionStops:0,
  continuous400msEpisodes:samples.length,classification:samples.length?
   'CANDIDATE_UNBLOCKED_FOLLOW_OBSERVED':'NO_400MS_EPISODES_OBSERVED',
  episodes:samples});
 console.log(JSON.stringify({phase:'R5-b85',status:'CASE_PASS',seed:pair.seed,episodes:samples.length}));
}
const result={phase:'R5-b85',status:'PASS',track:'majoku-ring-v1',
 races:2,physicalOutcomeUnchanged:true,readOnlyProbe:true,cases,
 physicalClearanceProven:false,safeAiPatchApproved:false,
 limitations:['A corridor candidate is not a swept-body clearance proof',
  'No safe merge reservation has been reconstructed',
  'Only the first 90s of two 10-lap real-grid races are probed']};
fs.writeFileSync(root+'b85-episode-evidence.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b85',status:'PASS',safeAiPatchApproved:false}));
