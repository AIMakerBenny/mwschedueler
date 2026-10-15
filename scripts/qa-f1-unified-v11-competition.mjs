// Current unified engine's real committed collision, race-traffic and pit-exclusion paths.
// Controlled initial states and stub pit lifecycle; not a full-race balance benchmark.
import assert from 'node:assert/strict';
import {engine,setup} from './f1-unified-v11-fixture.mjs';

const body=String.raw`
raceMotionV189.vehicles=raceMotionV189.vehicles.slice(0,3);
const trackMeters=track.lengthMeters;
const [first,second,third]=raceMotionV189.vehicles;
if(PIT_FIXTURE){
 first.raceProgress=25/trackMeters;first.pitState='PIT_EXIT';first.speedKph=60;first.lateralOffsetMeters=-3.5;
 second.raceProgress=40/trackMeters;second.speedKph=65;second.lateralOffsetMeters=-3.5;
 third.raceProgress=5/trackMeters;third.speedKph=90;third.lateralOffsetMeters=3.5;
}else{
 first.raceProgress=30/trackMeters;first.lateralOffsetMeters=3.5;first.speedKph=80;
 second.raceProgress=25/trackMeters;second.lateralOffsetMeters=0;second.speedKph=85;
 third.raceProgress=20/trackMeters;third.lateralOffsetMeters=-3.5;third.speedKph=90;
}
for(const vehicle of raceMotionV189.vehicles)vehicle.startOffset=vehicle.raceProgress;
if(REVERSE_ORDER)raceMotionV189.vehicles.reverse();
unifiedInitV11();
const rows=unifiedSnapshotV11(),entrant=rows.find(row=>row.id===(PIT_FIXTURE?'0':'2'));
const merge=unifiedMergeTargetV11(entrant,3.5,rows);
if(PIT_FIXTURE)unifiedStateV11.passCandidates.set('0|1',{at:-600,front:'0',pair:['0','1']});
let ticks=0,bodyOverlaps=0;
for(let k=0;k<(PIT_FIXTURE?30:100);k++){
 if(!simulateUnifiedRaceStepV11(20))break;ticks++;
 const cars=raceMotionV189.vehicles;
 for(let a=0;a<cars.length;a++)for(let b=a+1;b<cars.length;b++)
  if(unifiedBoxesOverlapV11(cars[a].unifiedWorldPoseV11,cars[b].unifiedWorldPoseV11))bodyOverlaps++;
}
return {ticks,bodyOverlaps,merge,
 invalid:unifiedStateV11.telemetry.invalid.length,
 rawCrossings:unifiedStateV11.telemetry.rawCrossings.length,
 confirmedPasses:unifiedStateV11.telemetry.passes.length,
 candidates:unifiedStateV11.passCandidates.size,
 states:raceMotionV189.vehicles.map(vehicle=>({
  id:String(vehicle.id),s:vehicle.raceProgress,y:vehicle.unifiedYV11,
  ai:vehicle.unifiedAiStateV11,pit:vehicle.pitState
 })).sort((a,b)=>a.id.localeCompare(b.id))};
`;
function run(pit,reverse){
 return new Function(setup+engine+body.replaceAll('PIT_FIXTURE',String(pit))
   .replaceAll('REVERSE_ORDER',String(reverse)))();
}
const check=(pit)=>{
 const regular=run(pit,false),reversed=run(pit,true);
 assert.deepEqual(reversed,regular,'Vehicle array order modified competition outcome');
 assert.equal(regular.ticks,pit?30:100,'Race step unexpectedly stopped');
 assert.equal(regular.bodyOverlaps,0,'World-space bodies overlapped');
 assert.equal(regular.invalid,0,'Unified physics rejected a valid initialized situation');
 assert.equal(regular.rawCrossings,0,'Unrealized crossing was recorded');
 assert.equal(regular.confirmedPasses,0,'Unrealized pass was awarded');
 assert.equal(regular.candidates,0,'Expired/pit candidate survived');
 assert.equal(regular.merge.target,-3.5,'Blocked lane merge changed physical target');
 assert.deepEqual(regular.merge.blocked,pit?['2']:['0','1'],
   'Three-car defender or pit-exit merge exclusion changed');
 if(pit)assert.equal(regular.states.find(v=>v.id==='0').pit,'PIT_EXIT');
 else assert(regular.states.every(v=>v.pit==='TRACK'));
 return {ticks:regular.ticks,bodyOverlaps:regular.bodyOverlaps,
   rawCrossings:regular.rawCrossings,confirmedPasses:regular.confirmedPasses,
   mergeBlocked:regular.merge.blocked,orderIndependent:true};
};
const convoy=check(false),pitExit=check(true);
console.log(JSON.stringify({result:'PASS',engine:'unified-v1.1',convoy,pitExit,
 limitation:'Controlled positions with stub pit lifecycle; pass confirmations in the separate 480s smoke.'},null,2));
