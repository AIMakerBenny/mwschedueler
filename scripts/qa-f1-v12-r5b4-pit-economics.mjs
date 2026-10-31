// R5-b4 contract: pit strategy uses the exact same physical tyre wear law as cornering.
import assert from 'node:assert/strict';
import {setup,engine,src} from './f1-unified-v11-fixture.mjs';
assert(src.includes('function unifiedWearGripFactorV12('));
assert(src.includes('function unifiedPitForecastV12('));
assert(src.includes('function unifiedPitGripTimeRatioV12('));
assert(src.includes('function unifiedPitReferenceLapV12('));
const test=new Function(setup+engine+`
  track.pit={entry:.94,stop:.99,exit:.07,speedLimitKph:80};
  if(!unifiedInitV11())throw Error('Unified physics fixture init failed');
  // A representative test-only corner/straight profile in the isolated synthetic track.
  // The LIVE benchmark always uses untouched genuine SVG curvature.
  unifiedStateV11.path.samples.forEach((p,i)=>{p.k=i%7<3?.012:.00003});
  unifiedPreparePitGripCurveV12(track);
  const vehicle=raceMotionV189.vehicles[0];
  vehicle.lapTimesMs=[65000,70000,68000];
  vehicle.tyreCompound='SOFT';
  vehicle.tyreStartRaceProgress=0;
  vehicle.unifiedTempCV11=95;
  vehicle.tyreWarmupFactor=1;
  const grip=[0,.4,.60,.70,.8,.9,1].map(w=>({wear:w,factor:unifiedWearGripFactorV12(w),
    grip:unifiedGripV11({...vehicle,tyreWear:w})}));
  const forecast=[.4,.6,.8,1].map(w=>unifiedPitForecastV12('SOFT',w,.115,3.5,85,track));
  const physicalCornerRatios=[.45,.70,1,1.06].map(g=>unifiedPitGripTimeRatioV12(g,track));
  // R5-b7 diagnostic: identical physics forecast for all three compounds.
  // This is a cost comparison, never a forced compound allocation.
  const horizons=[2,4,6,8,10,12].map(laps=>{
    const perCompound=['SOFT','MEDIUM','HARD'].map(compound=>{
      const spec=unifiedTyreSpecV11(compound);
      const wearRate=.115*spec.wear/unifiedTyreSpecV11('SOFT').wear;
      return {compound,wearRate,finishWear:Math.min(1,wearRate*laps),
        lossSeconds:unifiedPitForecastV12(compound,0,wearRate,laps,68,track)};
    }).sort((a,b)=>a.lossSeconds-b.lossSeconds);
    return {laps,best:perCompound[0].compound,perCompound};
  });

  const referenceLap=unifiedPitReferenceLapV12(vehicle,track);
  const rows=[.59,.60,.61,.70,.80,.92].map(w=>{
    vehicle.tyreWear=w;vehicle.raceProgress=6.1;vehicle.speedKph=195;
    const row={ref:vehicle,id:vehicle.id,s:6.1*unifiedStateV11.path.len,
      v:vehicle.speedKph/3.6,pit:'TRACK',finished:false};
    const before=JSON.stringify(vehicle),plan=unifiedPitPlanV11(row,track);
    if(before!==JSON.stringify(vehicle))throw Error('Pit forecasting mutated vehicle');
    return {wear:w,plan};
  });
  vehicle.tyreWear=.4;vehicle.tyreCompound='HARD';
  const hard=unifiedPitPlanV11({ref:vehicle,id:vehicle.id,s:6.1*unifiedStateV11.path.len,
    v:195/3.6,pit:'TRACK',finished:false},track);
  vehicle.tyreWear=.95;vehicle.tyreCompound='SOFT';
  const late=unifiedPitPlanV11({ref:vehicle,id:vehicle.id,s:9.2*unifiedStateV11.path.len,
    v:195/3.6,pit:'TRACK',finished:false},track);
  return {grip,forecast,physicalCornerRatios,referenceLap,rows,hard,late,horizons};
`)();
// Straight-only geometry excludes the corner-only time model. The calibrated
// accepted-lap loss must still capture high-wear traction/braking slowdown.
const straightCalibration=new Function(setup+engine+`
unifiedInitV11();
unifiedStateV11.path.samples.forEach(p=>{p.k=.00000001});
unifiedPreparePitGripCurveV12(track);
const wear=[.4,.6,.7,.9,1].map(w=>({wear:w,loss:unifiedPitForecastV12('SOFT',w,0,1,64,track)}));
const compounds=['SOFT','MEDIUM','HARD'].map(compound=>({
 compound,loss:unifiedPitForecastV12(compound,0,.02,5,64,track)
}));
return {wear,compounds};
`)();
assert(straightCalibration.wear.every((x,i)=>i===0||
 x.loss>=straightCalibration.wear[i-1].loss-1e-8));
assert(straightCalibration.wear[3].loss-straightCalibration.wear[1].loss>12,
 'High wear must add longitudinal recovery loss above 60% wear');
assert(Math.abs(straightCalibration.wear[4].loss-straightCalibration.wear[1].loss-32)<1e-5,
 'Full wear must increase forecast by 50% baseline lap relative to 60% wear');
assert(straightCalibration.compounds.every((x,i)=>i===0||
 x.loss>straightCalibration.compounds[i-1].loss),
 'Fresh-compound SOFT, MEDIUM, HARD forecast ordering lost on a straight');
assert(straightCalibration.compounds[2].loss-straightCalibration.compounds[0].loss>1.5,
 'Physical longitudinal grip recovery must distinguish tyre compounds');
assert(test.grip.every((v,i)=>v.factor>=.34&&v.factor<=1&&v.grip>0&&(i===0||v.factor<test.grip[i-1].factor)));
assert(test.grip[6].factor<test.grip[3].factor*.7,'Worn tyre grip does not physically deteriorate');
assert(test.forecast.every((x,i)=>Number.isFinite(x)&&(i===0||x>test.forecast[i-1])));
assert.equal(test.referenceLap,68,'Real completed median lap ignored');
assert.equal(test.horizons.length,6);
assert(test.horizons.every(h=>h.perCompound.length===3&&h.perCompound.every(x=>Number.isFinite(x.lossSeconds)&&x.finishWear>=0&&x.finishWear<=1)));
assert(test.horizons.every((h,i)=>i===0||h.laps>test.horizons[i-1].laps));
assert(test.horizons.some(h=>h.best==='SOFT'),'Short-stint SOFT advantage not represented');
// A harder compound must be allowed to win on a long enough physical stint.
assert(test.horizons.some(h=>h.best!=='SOFT'),'All stint horizons prefer SOFT; audit wear/curve/forecast');
assert(test.physicalCornerRatios[0]>test.physicalCornerRatios[1]&&test.physicalCornerRatios[1]>test.physicalCornerRatios[2]);
assert(Math.abs(test.physicalCornerRatios[2]-1)<1e-9,'SVG curve normalized corner grip baseline wrong');
assert(test.rows.filter(x=>x.wear<=.6).every(x=>x.plan.decision==='GO_LONG'&&x.plan.reason==='TYRE_REMAINING_AT_LEAST_40'));
assert(test.rows.filter(x=>x.wear>.6).every(x=>Number.isFinite(x.plan.benefit)&&
 x.plan.candidates.length===3&&Number.isFinite(x.plan.pitLossSeconds)&&x.plan.forecast.model==='svg-curvature-observed-lap-v12'&&x.plan.forecast.lapSeconds===68));
assert.equal(test.hard.decision,'GO_LONG');
assert.equal(test.late.reason,'TOO_LATE_TO_PIT');
assert(test.rows.filter(x=>x.wear>.6).some(x=>x.plan.decision==='BOX_NOW'),
 'Worn SOFT must have a genuinely favourable optional strategy in the representative scenario');
console.log(JSON.stringify({status:'PASS',phase:'R5-b4/R5-b6',grip:test.grip,physicalCornerRatios:test.physicalCornerRatios,referenceLap:test.referenceLap,
 horizonWinners:test.horizons.map(h=>({laps:h.laps,best:h.best,losses:h.perCompound})),
 candidates:test.rows.map(x=>({wear:x.wear,decision:x.plan.decision,reason:x.plan.reason,
 benefit:x.plan.benefit,loss:x.plan.pitLossSeconds,compound:x.plan.targetCompound})),
 noEarlyPit:true,noLatePit:true,pureForecast:true,
 straightCalibration,
 notes:'Longitudinal traction/braking forecast calibrated from two Blue Coast seeds; genuine Chromium race QA is the authoritative validation.'}));
