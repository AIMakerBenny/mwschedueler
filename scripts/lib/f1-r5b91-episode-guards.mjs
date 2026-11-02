// R5-b91: pure validation contract for an R5-b86 400ms observation.
// Acceptance does not establish swept-body clearance or a valid merge reservation.
import assert from 'node:assert/strict';
export function assertMajokuFollow400ms(event,acceptedFrames=4500){
 assert(event&&typeof event==='object');
 assert.equal(event.physicsStepMs,20);
 assert.equal(event.consecutiveFrames,20);
 assert.equal(event.aiState,'FOLLOW');
 assert.equal(event.reportedMergeBlockers,0);
 assert.equal(event.sweptClearanceProven,false);
 assert.equal(event.mergeReservationClearanceProven,false);
 assert(Number.isInteger(event.firstFrameTick)&&event.firstFrameTick>=1);
 assert(Number.isInteger(event.lastFrameTick)&&event.lastFrameTick<=acceptedFrames);
 assert.equal(event.lastFrameTick-event.firstFrameTick,19);
 assert(event.leaderId&&event.followerId&&event.leaderId!==event.followerId);
 const frames=event.consecutive20msFrames;
 assert(Array.isArray(frames)&&frames.length===20,'Require all 20 accepted physical steps');
 for(let i=0;i<20;i++){
  const f=frames[i];
  assert(f&&typeof f==='object');
  assert.equal(f.tick,event.firstFrameTick+i,'Missing or reordered 20ms step');
  assert.equal(f.leaderId,event.leaderId,'Leader changed mid-episode');
  assert.equal(f.followerId,event.followerId,'Follower changed mid-episode');
  assert.equal(f.aiState,'FOLLOW','FOLLOW was interrupted');
  assert(Number.isInteger(f.candidateCount)&&f.candidateCount>0,'No route candidate');
  assert.equal(f.mergeBlockers,0,'Reported merge blocker');
  assert(Number.isInteger(f.simTimeMs),'Missing physical simulation time');
  if(i)assert.equal(f.simTimeMs-frames[i-1].simTimeMs,20,
   'Clock progressed without an observed 20ms accepted step');
  assert(Number.isFinite(f.gapMeters)&&f.gapMeters>0&&f.gapMeters<=70,'Gap out of range');
  assert(Number.isFinite(f.relativeSpeedMps)&&f.relativeSpeedMps>2,'Follower not closing faster');
 }
 const last=frames[19];
 assert.equal(last.candidateCount,event.candidateCount);
 assert.equal(last.mergeBlockers,event.reportedMergeBlockers);
 assert(Math.abs(last.gapMeters-event.gapMeters)<1e-9);
 assert(Math.abs(last.relativeSpeedMps-event.relativeSpeedMps)<1e-9);
 assert.equal(event.endSimMs,frames[19].simTimeMs);
 return true;
}
