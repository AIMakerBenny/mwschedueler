// R5-b4 contract: pit strategy uses the exact same physical tyre wear law as cornering.
import assert from 'node:assert/strict';
import {setup,engine,src} from './f1-unified-v11-fixture.mjs';
assert(src.includes('function unifiedWearGripFactorV12('));
assert(src.includes('function unifiedPitForecastV12('));
const test=new Function(setup+engine+`
  track.pit={entry:.94,stop:.99,exit:.07,speedLimitKph:80};
  if(!unifiedInitV11())throw Error('Unified physics fixture init failed');
  const vehicle=raceMotionV189.vehicles[0];
  vehicle.tyreCompound='SOFT';
  vehicle.tyreStartRaceProgress=0;
  vehicle.unifiedTempCV11=95;
  vehicle.tyreWarmupFactor=1;
  const grip=[0,.4,.60,.70,.8,.9,1].map(w=>({wear:w,factor:unifiedWearGripFactorV12(w),
    grip:unifiedGripV11({...vehicle,tyreWear:w})}));
  const forecast=[.4,.6,.8,1].map(w=>unifiedPitForecastV12('SOFT',w,.115,3.5,85));
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
  return {grip,forecast,rows,hard,late};
`)();
assert(test.grip.every((v,i)=>v.factor>=.34&&v.factor<=1&&v.grip>0&&(i===0||v.factor<test.grip[i-1].factor)));
assert(test.grip[6].factor<test.grip[3].factor*.7,'Worn tyre grip does not physically deteriorate');
assert(test.forecast.every((x,i)=>Number.isFinite(x)&&(i===0||x>test.forecast[i-1])));
assert(test.rows.filter(x=>x.wear<=.6).every(x=>x.plan.decision==='GO_LONG'&&x.plan.reason==='TYRE_REMAINING_AT_LEAST_40'));
assert(test.rows.filter(x=>x.wear>.6).every(x=>Number.isFinite(x.plan.benefit)&&
 x.plan.candidates.length===3&&Number.isFinite(x.plan.pitLossSeconds)&&x.plan.forecast.model==='shared-physical-wear-v12'));
assert.equal(test.hard.decision,'GO_LONG');
assert.equal(test.late.reason,'TOO_LATE_TO_PIT');
assert(test.rows.filter(x=>x.wear>.6).some(x=>x.plan.decision==='BOX_NOW'),
 'Worn SOFT must have a genuinely favourable optional strategy in the representative scenario');
console.log(JSON.stringify({status:'PASS',phase:'R5-b4',grip:test.grip,
 candidates:test.rows.map(x=>({wear:x.wear,decision:x.plan.decision,reason:x.plan.reason,
 benefit:x.plan.benefit,loss:x.plan.pitLossSeconds,compound:x.plan.targetCompound})),
 noEarlyPit:true,noLatePit:true,pureForecast:true,
 notes:'This tests a representative real physics-model input; FULL NORMAL Chromium is the real outcomes test.'}));
