// R5-b165. Exact accepted-20ms terminal event witnesses for genuine retry
// attempts. These values are read-only, and a missing frame is NOT estimated.
export const TERMINAL_OFFSETS_MS=Object.freeze([-1000,-200,-20,0]);
export const TERMINAL_EVENT_TYPES=Object.freeze([
 'SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED']);
export function makeAttemptTerminalWitness(event,start,frameHistory,snapshotPair){
 if(!event||!TERMINAL_EVENT_TYPES.includes(event.type)||
  !Number.isSafeInteger(event.ms)||!Number.isSafeInteger(event.attemptId)||
  !start||start.type!=='START'||start.retry!==true||
  !Number.isSafeInteger(start.ms)||start.attemptId!==event.attemptId||
  start.ms>event.ms||!start.driver||!start.target||
  start.driver!==event.driver||start.target!==event.target||
  !Array.isArray(frameHistory)||typeof snapshotPair!=='function')
  throw Error('INVALID_TERMINAL_SOURCE_EVENT');
 const frames=new Map(frameHistory.map(f=>[f.ms,f]));
 const terminal={
  attemptId:start.attemptId,driver:start.driver,target:start.target,
  attackStartMs:start.ms,terminalMs:event.ms,terminalType:event.type,
  engineOutcomeConfirmed:event.type==='SUCCESS',
  engineCrossingMs:Number.isSafeInteger(event.crossingMs)?event.crossingMs:null,
  attemptDurationMs:event.ms-start.ms,offsetSamples:{},
  physicalSweptClearanceProven:false,causalAiFaultProven:false
 };
 for(const offset of TERMINAL_OFFSETS_MS){
  const ms=event.ms+offset,key=String(offset),frame=frames.get(ms);
  if(frame){
   const sample=snapshotPair(frame,start.driver,start.target);
   if(sample.ms!==ms||sample.driver!==start.driver||sample.target!==start.target)
    throw Error('MISMATCHED_TERMINAL_FRAME');
   terminal.offsetSamples[key]={offsetMs:offset,...sample};
  }else{
   terminal.offsetSamples[key]={offsetMs:offset,ms,available:false,
    reason:ms<0?'BEFORE_RACE_START':'EXACT_ACCEPTED_20MS_FRAME_UNAVAILABLE'};
  }
 }
 return terminal;
}
