// Short geometry/physics checks using Chromium's real SVG paths for all 7 tracks.
// Isolated engine with stub pit/UI adapters, not complete races or balance results.
// Every real SVG circuit checks committed-frame continuity, body separation and input order.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {engine,setup} from './f1-unified-v11-fixture.mjs';
let chromium;
try{({chromium}=await import('playwright'));}catch(error){
  if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;
  ({chromium}=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'_resolve.cjs'))('playwright'));
}
const browser=await chromium.launch({headless:true,executablePath:process.env.MWS_CHROME_PATH||undefined,args:['--no-sandbox']});
try{
  const page=await browser.newPage();
  await page.setContent('<svg xmlns="http://www.w3.org/2000/svg"><path id="fixture"/></svg>');
  await page.addScriptTag({content:fs.readFileSync(new URL('../assets/f1-track-v1.js',import.meta.url),'utf8')});
  await page.addScriptTag({content:fs.readFileSync(new URL('../assets/f1-track-geometry-v2.js',import.meta.url),'utf8')});
  const tracks=await page.evaluate(()=>Object.values(window.MWS_F1_TRACKS_V182));
  assert.equal(tracks.length,7);
  const fixture=setup.replace(/const track=\{[^\n]+/,"const track=fixtureTrack,activeRaceSnapshotV187={track,createdAt:'real-svg',totalLaps:10};")
    .replace(/const path=\{[^\n]+/, 'const path=fixturePath;')
    .replaceAll('-i*9/5280','-i*12/track.lengthMeters')
    .replace("const getCornerPhaseAtProgressV194=()=>({phase:'STRAIGHT',corner:null});", 'const getCornerPhaseAtProgressV194=p=>fixtureCornerPhase(p);');
  const results=[];
  for(const track of tracks.filter(t=>!process.env.MWS_QA_TRACK||t.id===process.env.MWS_QA_TRACK)){
    const scenarios=[];
    for(const reverse of [false,true]){
    const result=await page.evaluate(({track,fixture,engine,reverse})=>{
      const svgPath=document.getElementById('fixture');svgPath.setAttribute('d',track.path);
      const geometry=window.mwsBuildF1CornerPhasesV194(track,window.mwsBuildF1TrackGeometryV193(track,svgPath));
      const phase=p=>window.mwsF1CornerPhaseAtProgressV194(geometry,p);
      const body=`
if(REVERSE)raceMotionV189.vehicles.reverse();
unifiedInitV11();const all=unifiedStateV11.path.samples;
const bound=track.geometry.trackWidthMeters/2-2.5;
let minimumMetric=Infinity;
for(const sample of all)for(const y of [-bound,0,bound]){
 const p=unifiedPathSampleV11(sample.s);minimumMetric=Math.min(minimumMetric,(p.dx+y*p.dnx)*p.tx+(p.dy+y*p.dny)*p.ty);
}
let slowRotation=null;
if(track.id==='majoku-ring-v1'){
 const a={s:5115.50089654988,y:-2.260609965360307,v:.5712807520623883,ref:{unifiedHeadingV11:-2.759027228798836}};
 const b={s:5121.056960367654,y:-3.7184049460479036,v:.22560219150729832,ref:{unifiedHeadingV11:-2.8206645264317998}};
 const ca=unifiedMotionV11(a,{v:0,y:-2.258672007780926},.02),cb=unifiedMotionV11(b,{v:.19857458114995863,y:b.y},.02);
 slowRotation={before:unifiedSweptWorldV11(a,{...ca,heading:ca.velocityHeading},b,{...cb,heading:cb.velocityHeading}),after:unifiedSweptWorldV11(a,ca,b,cb),delta:unifiedAngleV11(ca.heading-a.ref.unifiedHeadingV11)};
}
let ticks=0,maxStepPathMeters=0,checkedPairs=0,physicalOverlaps=[],continuityErrors=[];
for(let i=0;i<1500;i++){
 const previous=new Map(raceMotionV189.vehicles.map(v=>[String(v.id),{
   speed:Number(v.speedKph)||0,progress:Number(v.raceProgress)||0,path:Number(v.unifiedPathDistanceV11)||0
 }]));
 if(!simulateUnifiedRaceStepV11(20))break;
 ticks++;
 for(const v of raceMotionV189.vehicles){
   const old=previous.get(String(v.id));
   const traveled=(Number(v.unifiedPathDistanceV11)||0)-old.path;
   const upper=Math.max(old.speed,Number(v.speedKph)||0)/3.6*.02+.25;
   maxStepPathMeters=Math.max(maxStepPathMeters,traveled);
   if(!Number.isFinite(traveled)||traveled < -1e-7||traveled>upper+1e-6||
      (Number(v.raceProgress)||0)<old.progress-1e-8){
     continuityErrors.push({id:String(v.id),tick:i,traveled,upper,oldProgress:old.progress,progress:v.raceProgress});
   }
   if(!(Number(v.batteryMJ)>=0&&Number(v.batteryMJ)<=UNIFIED_ENGINE_V11.ersCapacity+1e-6)||
       !(Number(v.tyreWear)>=0&&Number(v.tyreWear)<=1)||
       !Number.isFinite(v.unifiedWorldPoseV11?.x)||!Number.isFinite(v.unifiedWorldPoseV11?.y)){
     continuityErrors.push({id:String(v.id),tick:i,reason:'NONFINITE_OR_ENERGY_WEAR_BOUNDS'});
   }
 }
 for(let a=0;a<raceMotionV189.vehicles.length;a++)
 for(let b=a+1;b<raceMotionV189.vehicles.length;b++){
   const one=raceMotionV189.vehicles[a],two=raceMotionV189.vehicles[b];
   if(one.finished||two.finished||one.pitState!=='TRACK'||two.pitState!=='TRACK')continue;
   checkedPairs++;
   if(unifiedBoxesOverlapV11(one.unifiedWorldPoseV11,two.unifiedWorldPoseV11))
     physicalOverlaps.push({tick:i,a:String(one.id),b:String(two.id)});
 }
 if(continuityErrors.length||physicalOverlaps.length)break;
}
return {track:track.id,reverse:REVERSE,ticks,maxStepPathMeters,checkedPairs,physicalOverlaps,continuityErrors,minimumMetric,slowRotation,lineRange:[Math.min(...all.map(p=>p.idealUnit)),Math.max(...all.map(p=>p.idealUnit))],errors:unifiedStateV11.telemetry.invalid,steps:unifiedStateV11.telemetry.steps,
 states:raceMotionV189.vehicles.map(v=>({id:String(v.id),s:v.raceProgress,v:v.speedKph,y:v.unifiedYV11,heading:v.unifiedHeadingV11,J:v.unifiedPathMetricV11,
 x:v.unifiedWorldPoseV11?.x,z:v.unifiedWorldPoseV11?.y,E:v.batteryMJ,wear:v.tyreWear,rng:v.unifiedRngV11}))
 .sort((a,b)=>a.id.localeCompare(b.id))};`;
      return new Function('fixtureTrack','fixturePath','fixtureCornerPhase',fixture+engine+body.replaceAll('REVERSE',String(reverse)))(track,svgPath,phase);
    },{track,fixture,engine,reverse});
    console.log(JSON.stringify({track:result.track,reverse:result.reverse,ticks:result.ticks,checkedPairs:result.checkedPairs,
      physicalOverlaps:result.physicalOverlaps.length,continuityErrors:result.continuityErrors.length,
      maxStepPathMeters:result.maxStepPathMeters,minimumMetric:result.minimumMetric,slowRotation:result.slowRotation,
      lineRange:result.lineRange,errors:result.errors}));
    if(result.slowRotation){assert.equal(result.slowRotation.before,true);assert.equal(result.slowRotation.after,false);}
    assert.equal(result.ticks,1500,result.track+' stopped early');assert.deepEqual(result.errors,[]);
    assert(result.checkedPairs>0,result.track+' did not check physical pairs');
    assert.deepEqual(result.physicalOverlaps,[],result.track+' overlapping world-space vehicle bodies');
    assert.deepEqual(result.continuityErrors,[],result.track+' discontinuous/unbounded committed physics');
    assert(result.lineRange.some(v=>Math.abs(v)>.1),result.track+' line geometry missing');
    assert(result.minimumMetric>.2,result.track+' offset path is singular');
    for(const state of result.states)assert(Object.entries(state).every(([key,value])=>key==='id'||Number.isFinite(value)));
    scenarios.push(result);
    }
    assert.deepEqual(scenarios[0].states,scenarios[1].states,
      track.id+' reversed input vehicle ordering changed unified physical outcome');
    results.push({track:track.id,seconds:scenarios[0].steps*.02,
      maxStepPathMeters:scenarios[0].maxStepPathMeters,
      checkedPairs:scenarios[0].checkedPairs,
      physicalOverlaps:scenarios[0].physicalOverlaps.length,
      continuityErrors:scenarios[0].continuityErrors.length,
      reversedInputIdentical:true,minimumMetric:scenarios[0].minimumMetric});
  }
  console.log(JSON.stringify({result:'PASS',tracks:results,warning:'Short isolated real-SVG invariants, not full races, ring visibility or pit integration.'}));
}finally{await browser.close();}
