// Short geometry/physics checks using Chromium's real SVG paths for all 7 tracks.
// Isolated engine with stub pit/UI adapters, not complete races or balance results.
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
    const result=await page.evaluate(({track,fixture,engine})=>{
      const svgPath=document.getElementById('fixture');svgPath.setAttribute('d',track.path);
      const geometry=window.mwsBuildF1CornerPhasesV194(track,window.mwsBuildF1TrackGeometryV193(track,svgPath));
      const phase=p=>window.mwsF1CornerPhaseAtProgressV194(geometry,p);
      const body=`
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
let ticks=0;for(let i=0;i<1500;i++){if(!simulateUnifiedRaceStepV11(20))break;ticks++;}
return {track:track.id,ticks,minimumMetric,slowRotation,lineRange:[Math.min(...all.map(p=>p.idealUnit)),Math.max(...all.map(p=>p.idealUnit))],errors:unifiedStateV11.telemetry.invalid,steps:unifiedStateV11.telemetry.steps,
 states:raceMotionV189.vehicles.map(v=>({s:v.raceProgress,v:v.speedKph,y:v.unifiedYV11,heading:v.unifiedHeadingV11,J:v.unifiedPathMetricV11,
 x:v.unifiedWorldPoseV11?.x,z:v.unifiedWorldPoseV11?.y}))};`;
      return new Function('fixtureTrack','fixturePath','fixtureCornerPhase',fixture+engine+body)(track,svgPath,phase);
    },{track,fixture,engine});
    console.log(JSON.stringify({track:result.track,ticks:result.ticks,minimumMetric:result.minimumMetric,slowRotation:result.slowRotation,lineRange:result.lineRange,errors:result.errors}));
    if(result.slowRotation){assert.equal(result.slowRotation.before,true);assert.equal(result.slowRotation.after,false);}
    assert.equal(result.ticks,1500,result.track+' stopped early');assert.deepEqual(result.errors,[]);
    assert(result.lineRange.some(v=>Math.abs(v)>.1),result.track+' line geometry missing');
    assert(result.minimumMetric>.2,result.track+' offset path is singular');
    for(const state of result.states)assert(Object.values(state).every(Number.isFinite));
    results.push({track:result.track,seconds:result.steps*.02,minimumMetric:result.minimumMetric});
  }
  console.log(JSON.stringify({result:'PASS',tracks:results,warning:'Short isolated real-SVG physics, not full races, ring visibility or pit integration.'}));
}finally{await browser.close();}
