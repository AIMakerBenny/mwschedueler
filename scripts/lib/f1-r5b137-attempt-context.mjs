// R5-b137. Pure read-only source shared by Node tests and browser QA.
// All distances are longitudinal track progress estimates, NOT body clearance.
export function snapshotAttemptContextFrame(simTimeMs,trackLengthMeters,cars){
 if(!Number.isSafeInteger(simTimeMs)||simTimeMs<0)throw Error('INVALID_FRAME_CLOCK');
 if(!(Number.isFinite(trackLengthMeters)&&trackLengthMeters>0))throw Error('INVALID_TRACK_LENGTH');
 if(!Array.isArray(cars)||cars.length!==12)throw Error('INVALID_FIELD_SIZE');
 const ids=new Set();
 const records=cars.map(v=>{
  const id=String(v.id||'');
  if(!id||ids.has(id))throw Error('INVALID_DRIVER_ID');
  ids.add(id);
  const numeric=(value)=>typeof value==='number'&&Number.isFinite(value)?value:null;
  return {id,progress:numeric(v.raceProgress),speedKph:numeric(v.speedKph),
   lateralUnit:numeric(v.unifiedYV11),aiState:String(v.unifiedAiStateV11||''),
   aiTarget:String(v.unifiedAiTargetV11||''),
   pitState:String(v.pitState||'TRACK'),finished:Boolean(v.finished),
   reportedMergeBlockers:Array.isArray(v.unifiedMergeBlockedV11)?
    v.unifiedMergeBlockedV11.map(String).sort():[]};
 });
 return {ms:simTimeMs,trackLengthMeters,cars:records};
}
export function deriveExactAttackStartWitness(event,frame){
 if(!event||event.type!=='START'||!Number.isSafeInteger(event.ms)||
  !Number.isSafeInteger(event.attemptId))throw Error('INVALID_START_EVENT');
 if(!frame||frame.ms!==event.ms)throw Error('START_CLOCK_MISMATCH');
 const driver=frame.cars.find(x=>x.id===String(event.driver));
 const target=frame.cars.find(x=>x.id===String(event.target));
 if(!driver||!target||driver===target)throw Error('START_DRIVER_TARGET_MISSING');
 const onTrack=driver.pitState==='TRACK'&&target.pitState==='TRACK'&&
  !driver.finished&&!target.finished;
 if(!onTrack||driver.aiState!=='PLAN_ATTACK'||
  driver.aiTarget!==target.id)throw Error('START_AI_STATE_TARGET_MISMATCH');
 if(driver.progress===null||target.progress===null||
  driver.speedKph===null||target.speedKph===null)
  throw Error('START_PHYSICAL_CONTEXT_UNAVAILABLE');
 return {
  attemptId:event.attemptId,ms:event.ms,driver:driver.id,target:target.id,
  retry:Boolean(event.retry),attemptNumber:event.attemptNumber,
  driverProgressLaps:driver.progress,targetProgressLaps:target.progress,
  targetAheadLongitudinalMeters:(target.progress-driver.progress)*frame.trackLengthMeters,
  closingSpeedMps:(driver.speedKph-target.speedKph)/3.6,
  driverSpeedKph:driver.speedKph,targetSpeedKph:target.speedKph,
  driverAiState:driver.aiState,driverAiTarget:driver.aiTarget,
  targetAiState:target.aiState,
  driverLateralCoordinateUnit:driver.lateralUnit,
  targetLateralCoordinateUnit:target.lateralUnit,
  reportedMergeBlockers:driver.reportedMergeBlockers,
  onTrackPair:true,
  metricType:'longitudinal circuit progress, not Euclidean or swept-body clearance',
  physicalOvertakingClearanceProven:false
 };
}
