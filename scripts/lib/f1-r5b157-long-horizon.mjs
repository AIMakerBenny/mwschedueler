// R5-b157: pure exact-time long-horizon QA. No game logic is modified.
export const LONG_HORIZON_OFFSETS_MS=Object.freeze([0,1000,5000,10000,20000,40000,70000]);
export function makeLongHorizonAttempt(e){
 if(e?.type!=='START'||e.retry!==true||!Number.isInteger(e.attemptId)||
  !Number.isSafeInteger(e.ms)||!e.driver||!e.target||e.driver===e.target)
  throw Error('INVALID_RETRY_START');
 return {attemptId:e.attemptId,startMs:e.ms,driver:String(e.driver),
  target:String(e.target),samples:{}};
}
export function exactLongHorizonPair(frame,driverId,targetId){
 if(!frame||!Number.isSafeInteger(frame.ms)||
  !(Number.isFinite(frame.trackLengthMeters)&&frame.trackLengthMeters>0)||
  !Array.isArray(frame.cars))throw Error('INVALID_EXACT_FRAME');
 const a=frame.cars.find(v=>v.id===driverId),b=frame.cars.find(v=>v.id===targetId);
 if(!a||!b||a===b)throw Error('PAIR_NOT_PRESENT');
 const valid=v=>typeof v==='number'&&Number.isFinite(v);
 const gap=valid(a.progress)&&valid(b.progress)?
  (b.progress-a.progress)*frame.trackLengthMeters:null;
 const speed=valid(a.speedKph)&&valid(b.speedKph)?
  (a.speedKph-b.speedKph)/3.6:null;
 return {ms:frame.ms,available:true,driver:driverId,target:targetId,
  signedTrackProgressGapMeters:gap,relativeClosingSpeedMps:speed,
  driverAiState:a.aiState,targetAiState:b.aiState,driverAiTarget:a.aiTarget,
  driverSpeedKph:a.speedKph,targetSpeedKph:b.speedKph,
  driverEnergyDeployKW:a.energyDeployKW,targetEnergyDeployKW:b.energyDeployKW,
  driverBatteryMJ:a.batteryMJ,targetBatteryMJ:b.batteryMJ,
  driverTyreWearFraction:a.tyreWearFraction,targetTyreWearFraction:b.tyreWearFraction,
  driverStrategyName:a.strategyName,targetStrategyName:b.strategyName,
  driverStillAttackingOriginalTarget:a.aiState==='PLAN_ATTACK'&&a.aiTarget===targetId,
  driverOnTrack:a.pitState==='TRACK'&&!a.finished,
  targetOnTrack:b.pitState==='TRACK'&&!b.finished,
  sweptBodyClearanceProven:false,causalEffectProven:false};
}
export function updateLongHorizonSamples(attempts,history,throughMs,finished){
 if(!Array.isArray(attempts)||!Array.isArray(history)||
  !Number.isSafeInteger(throughMs)||typeof finished!=='boolean')
  throw Error('INVALID_OBSERVATION_SOURCE');
 const byTime=new Map(history.map(f=>[f.ms,f]));
 for(const a of attempts){
  for(const offset of LONG_HORIZON_OFFSETS_MS){
   const key=String(offset),ms=a.startMs+offset;
   if(Object.hasOwn(a.samples,key))continue;
   if(ms>throughMs&&!finished)continue;
   const source=byTime.get(ms);
   if(source)a.samples[key]={offsetMs:offset,...exactLongHorizonPair(source,a.driver,a.target)};
   else a.samples[key]={offsetMs:offset,ms,available:false,
    reason:ms>throughMs?'AFTER_RACE_END':'EXACT_ACCEPTED_FRAME_UNAVAILABLE'};
  }
 }
 return attempts;
}
