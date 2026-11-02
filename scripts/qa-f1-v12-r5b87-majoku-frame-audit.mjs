// R5-b87: validate every actual 20ms frame of the R5-b86 follow episodes.
// This is evidence of an advisory candidate, NOT a proved safe lane change.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const replay=read(dir+'replay.json'),witness=read(dir+'b85-episode-evidence.json');
assert.equal(replay.status,'PASS');
assert.equal(witness.status,'PASS');
assert.equal(replay.track,'majoku-ring-v1');
assert.equal(witness.track,'majoku-ring-v1');
assert.equal(witness.physicsUnchanged??witness.physicalOutcomeUnchanged,true);
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const cases=[];
for(const pair of replay.pairs){
 const raw=read(pair.observedFile),p=raw.real20ms;
 const w=witness.cases.find(c=>c.seed===pair.seed);
 assert(w&&p&&Array.isArray(p.candidateUnblocked400msSamples));
 assert.equal(w.continuous400msEpisodes,p.candidateUnblocked400msEpisodes);
 assert.equal(w.episodes.length,p.candidateUnblocked400msSamples.length);
 let priorEnd=0;
 const episodes=[];
 for(const event of w.episodes){
  const frames=event.consecutive20msFrames;
  assert(Array.isArray(frames),'Missing per-frame proof, cannot promote last-frame observation');
  assert.equal(frames.length,20,'400ms must consist of twenty genuine 20ms steps');
  assert.equal(event.firstFrameTick,frames[0].tick);
  assert.equal(event.lastFrameTick,frames[19].tick);
  assert(event.firstFrameTick>priorEnd,'Overlapping or out-of-order episode');
  priorEnd=event.lastFrameTick;
  assert(event.lastFrameTick<=p.acceptedFrames);
  assert.equal(event.consecutiveFrames,20);
  assert.equal(event.physicsStepMs,20);
  assert.equal(event.aiState,'FOLLOW');
  assert(event.candidateCount>0);
  assert.equal(event.reportedMergeBlockers,0);
  assert.equal(event.sweptClearanceProven,false);
  assert.equal(event.mergeReservationClearanceProven,false);
  for(let i=0;i<20;i++){
   const frame=frames[i];
   assert.equal(frame.tick,event.firstFrameTick+i);
   assert.equal(frame.leaderId,event.leaderId);
   assert.equal(frame.followerId,event.followerId);
   assert.notEqual(frame.leaderId,frame.followerId);
   assert.equal(frame.aiState,'FOLLOW');
   assert(Number.isFinite(frame.gapMeters)&&frame.gapMeters>0&&frame.gapMeters<=70);
   assert(Number.isFinite(frame.relativeSpeedMps)&&frame.relativeSpeedMps>2);
   assert(Number.isInteger(frame.candidateCount)&&frame.candidateCount>0);
   assert.equal(frame.mergeBlockers,0);
  }
  assert.equal(frames.length*event.physicsStepMs,400);
  episodes.push({
   firstTick:event.firstFrameTick,lastTick:event.lastFrameTick,
   leaderId:event.leaderId,followerId:event.followerId,
   firstGapMeters:frames[0].gapMeters,lastGapMeters:frames[19].gapMeters,
   minimumCandidateCount:Math.min(...frames.map(f=>f.candidateCount)),
   maximumReportedMergeBlockers:Math.max(...frames.map(f=>f.mergeBlockers)),
   classification:'ADVISORY_CANDIDATE_UNBLOCKED_NOT_PHYSICALLY_CLEARED'
  });
 }
 assert.equal(episodes.length>0,p.candidateUnblockedLongestFrames>=20);
 cases.push({seed:pair.seed,accepted20msFrames:p.acceptedFrames,
  followCandidateUnblockedFrames:p.followCandidateUnblockedFrames,
  continuous400msEpisodes:episodes.length,
  physicalOutcomeIdentical:pair.physicsIdentical&&pair.finishIdentical&&pair.pitsIdentical,
  episodes});
 console.log(JSON.stringify({phase:'R5-b87',status:'CASE_PASS',seed:pair.seed,
  continuous400msEpisodes:episodes.length}));
}
const result={phase:'R5-b87',status:'PASS',track:'majoku-ring-v1',
 frameCountPerEpisode:20,physicsStepMs:20,readOnly:true,cases,
 sweptClearanceProven:false,mergeReservationClearanceProven:false,
 aiOrSpeedChangesAuthorized:false};
fs.writeFileSync(dir+'b87-contiguous-episode-audit.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b87',status:'PASS',
 artifact:dir+'b87-contiguous-episode-audit.json'}));
