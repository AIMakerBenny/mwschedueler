import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase195F1SpeedProfileAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const track=fs.readFileSync('assets/f1-track-v1.js','utf8');
  const geometry=fs.readFileSync('assets/f1-track-geometry-v2.js','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of ['assets/f1-track-v1.js?v=','assets/f1-track-geometry-v2.js?v=','assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p='])if(!index.includes(token))issues.push('Phase 195 asset link missing: '+token);
  for(const token of ['referenceAccelMps2:8.5','maxStraightKph:335','speedProfileIterations:6',"root.__mwsF1TrackSpeedProfileMetaV195='backward-brake-forward-accel-v1';"])if(!track.includes(token))issues.push('Phase 195 track speed metadata missing: '+token);
  for(const token of [
    'function buildSpeedProfile(track,geometry){',
    'for(let i=count-1;i>=0;i--){',
    'const allowed=Math.sqrt(Math.max(0,vNext*vNext+2*brake*spacing))*3.6;',
    'for(let i=0;i<count;i++){',
    'const allowed=Math.sqrt(Math.max(0,vPrev*vPrev+2*accel*spacing))*3.6;',
    'function speedTargetAtProgress(geometry,progress){',
    'root.mwsBuildF1SpeedProfileV195=buildSpeedProfile;',
    'root.mwsF1SpeedTargetAtProgressV195=speedTargetAtProgress;',
    "root.__mwsF1SpeedProfileV195='backward-brake-forward-accel-v1';"
  ])if(!geometry.includes(token))issues.push('Phase 195 speed profile engine missing: '+token);
  for(const token of [
    "const VERSION195='phase195-speed-profile';",
    "typeof window.mwsBuildF1SpeedProfileV195==='function'",
    'window.mwsBuildF1SpeedProfileV195(snapshot.track,raceGeometryV193);',
    'function getSpeedProfileV195(){',
    'function getSpeedTargetAtProgressV195(progress){',
    'window.mwsF1GetSpeedProfileV195=getSpeedProfileV195;',
    'window.__mwsF1RacingV195=VERSION195;'
  ])if(!racing.includes(token))issues.push('Phase 195 race integration missing: '+token);

  try{
    const holder={};
    Function('globalThis',geometry+';return globalThis;')(holder);
    const samples=Array.from({length:100},(_,i)=>({
      index:i,progress:i/100,distanceMeters:i*10,
      curvatureRadPerMeter:i>=42&&i<=48?0.012:i>=20&&i<=28?0.0009:0
    }));
    const base={trackId:'test',lengthMeters:1000,sampleMeters:10,samples,corners:[],cornerPhases:[]};
    const fakeTrack={lengthMeters:1000,geometry:{referenceBrakeDecelMps2:20,referenceAccelMps2:8.5,maxStraightKph:335,speedProfileIterations:6,cornerCurvatureThreshold:0.0018},zones:[
      {type:'straight',start:0,end:.2,targetKph:320},
      {type:'fastCorner',start:.2,end:.35,targetKph:220},
      {type:'straight',start:.35,end:.4,targetKph:320},
      {type:'hairpin',start:.4,end:.5,targetKph:90},
      {type:'straight',start:.5,end:1,targetKph:320}
    ]};
    const built=holder.mwsBuildF1SpeedProfileV195?.(fakeTrack,base);
    if(!built||built.speedProfile.length!==samples.length)issues.push('Speed profile smoke test length mismatch');
    const before=built?.speedProfile?.[35]?.targetKph;
    const straight=built?.speedProfile?.[15]?.targetKph;
    const gentle=built?.speedProfile?.[24]?.rawLimitKph;
    const apex=built?.speedProfile?.[45]?.targetKph;
    if(!(Number(before)<Number(straight)))issues.push('Backward braking pass did not lower speed before slow corner');
    if(!(Number(gentle)>280))issues.push('Gentle curvature is over-slowed: '+gentle);
    if(!(Number(apex)<=110))issues.push('Sharp corner target speed not respected: '+apex);
    const after=built?.speedProfile?.[55]?.targetKph;
    if(!(Number(after)<320))issues.push('Forward acceleration pass did not limit instant exit acceleration');
  }catch(error){issues.push('Speed profile smoke test failed: '+String(error?.message||error));}

  for(const file of ['assets/f1-track-v1.js','assets/f1-track-geometry-v2.js','assets/f1-racing-v1.js']){
    const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  }
  for(const token of ['node --check scripts/run-phase195-f1-speed-profile-audit.mjs',"echo '[phase195] F1 backward braking and forward acceleration speed profile'"])if(!workflow.includes(token))issues.push('Phase 195 workflow verification missing: '+token);
  const result={phase:195,name:'f1-speed-profile',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase195F1SpeedProfileAudit();
