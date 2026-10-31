// R5-b27 - genuine 12-car, 10-lap accepted-physics regression.
// Compare the same Blue Coast fixed seeds to observed R5-b25 evidence.
// A collision-free steering manoeuvre must never be replaced by a visual offset.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const seed=Number(process.env.MWS_R5B9_SEED||1);
assert([1,2].includes(seed),'Seed must be 1 or 2');
const input='artifacts/f1-v12-r5b9-blue-coast-seed'+seed+'.json';
const data=JSON.parse(fs.readFileSync(input,'utf8'));
assert.equal(data.status,'PASS','Completed real-pit, accepted-physics race required');
assert.equal(data.seed,seed);
const base=data.baseline,trace=data.pitAvoidance;
assert(base&&trace&&data.rootCauseTelemetry,'Missing R5-b26 physical pit-avoidance evidence');
assert.equal(base.collisionStops,0,'The actual race must have zero physical collision stops');
assert.deepEqual(base.invalid,[],'No invalid swept-world steps are permitted');
assert(base.rows?.length===12&&base.rows.every(r=>
 r.finishMs>0&&r.lapTimesMs?.length===10),
 'The natural full-length race must finish all 12 cars at all ten laps');
assert(trace.frames>=0&&trace.steeringTargetFrames>=0&&
 Number.isFinite(trace.seconds),'Malformed accepted steering counts');
const frames=base.peerChainFrames||[];
const selected=frames.flatMap(f=>(f.cars||[]).filter(c=>
 c.pit==='TRACK'&&c.pitAvoidPeer).map(c=>({...c,t:f.t})));
assert(selected.length>=trace.frames,'Accepted steering car count below frame count');
const physicalMoves=selected.filter(c=>Number.isFinite(c.pitAvoidTarget)&&
 Math.abs(c.pitAvoidTarget-c.lateralMeters)>.15);
assert(trace.steeringTargetFrames<=selected.length,
 'Steering targets cannot exceed selected physical vehicles');
for(const c of selected){
 assert(Number.isFinite(c.lateralMeters)&&Number.isFinite(c.candidateLateralMeters)&&
 Number.isFinite(c.pitAvoidTarget),
  'A chosen pit-avoid lane must be finite in real physical coordinates');
 assert(Math.abs(c.lateralMeters)<20,
  'Pit-avoid physical coordinate unexpectedly outside circuit width');
}
const under95=Number(data.rootCauseTelemetry.slowTrackSeconds);
const constrained=Number(data.rootCauseTelemetry.predictedTrafficLimitedSlowSeconds);
const historical=seed===2?{under95:34.88,constrained:21.94}:
 {under95:0,constrained:0};
assert(Number.isFinite(under95)&&Number.isFinite(constrained)&&under95>=0&&constrained>=0,
 'Missing actual accepted low-speed physics');
const improved=seed===2?under95<historical.under95:false;
const report={
 phase:'R5-b27',seed,status:'PASS',trackId:data.trackId,
 realRace:{cars:base.rows.length,laps:10,collisionStops:base.collisionStops,
  invalidSteps:base.invalid.length},
 physicalSteering:{frames:trace.frames,steeringTargetFrames:trace.steeringTargetFrames,
  selectedVehicleSamples:selected.length,
  samplesStillMovingToAvoidTarget:physicalMoves.length,
  first:trace.first},
 lowSpeed:{historicalSeconds:historical.under95,actualSeconds:under95,
  deltaSeconds:under95-historical.under95,improved},
 trafficLimited:{historicalSeconds:historical.constrained,actualSeconds:constrained,
  deltaSeconds:constrained-historical.constrained},
 limitations:'This compares repeatable whole-race fixed-seed observations, not an isolated intervention. Zero solver collision stops is verified; subjective race quality requires manual play.'
};
const output='artifacts/f1-v12-r5b27-active-pit-avoidance-seed'+seed+'.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:report.phase,seed,status:report.status,
 physicalSteering:report.physicalSteering,lowSpeed:report.lowSpeed,
 trafficLimited:report.trafficLimited,collisionStops:base.collisionStops,artifact:output}));
// The known traffic cascade must improve without overriding physical collision safety.
if(seed===2){
 assert(trace.frames>0&&trace.steeringTargetFrames>0,
  'R5-b26 real lane-avoidance command never reached the physical controller');
 assert(improved,
  'R5-b26 did not reduce the verified Blue Coast seed2 below-95km/h traffic delay');
}
