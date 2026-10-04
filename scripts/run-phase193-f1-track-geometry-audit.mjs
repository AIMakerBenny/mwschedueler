import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase193F1TrackGeometryAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const track=fs.readFileSync('assets/f1-track-v1.js','utf8');
  const geometry=fs.readFileSync('assets/f1-track-geometry-v2.js','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/f1-track-v1.js?v=',
    'assets/f1-track-geometry-v2.js?v=',
    'assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p='
  ])if(!index.includes(token))issues.push('Phase 193 asset link missing: '+token);

  for(const token of [
    'geometry:Object.freeze({',
    'sampleMeters:20',
    'cornerCurvatureThreshold:0.0018',
    'trackWidthMeters:14',
    "root.__mwsF1TrackGeometryMetaV193='sample-curvature-width-v1';"
  ])if(!track.includes(token))issues.push('Phase 193 track metadata missing: '+token);

  for(const token of [
    'function makeSamples(track,pathElement){',
    'function detectCorners(track,samples){',
    'curvatureRadPerMeter:angle/actualSpacing',
    "id:'C'+String(idx+1).padStart(2,'0')",
    'function buildTrackGeometry(track,pathElement){',
    'root.mwsBuildF1TrackGeometryV193=buildTrackGeometry;',
    "root.__mwsF1TrackGeometryV193='svg-sampling-curvature-corners-v1';"
  ])if(!geometry.includes(token))issues.push('Phase 193 geometry engine missing: '+token);

  for(const token of [
    "const VERSION193='phase193-track-geometry-v2';",
    'let raceGeometryV193=null;',
    'geometry:Object.freeze({...track.geometry}),',
    'function refreshRaceGeometryV193(',
    'window.mwsBuildF1TrackGeometryV193',
    'window.mwsF1GetRaceGeometryV193=getRaceGeometryV193;',
    'window.__mwsF1RacingV193=VERSION193;'
  ])if(!racing.includes(token))issues.push('Phase 193 race integration missing: '+token);

  try{
    const holder={};
    Function('globalThis',geometry+';return globalThis;')(holder);
    const radius=100,total=2*Math.PI*radius;
    const fakePath={
      getTotalLength(){return total},
      getPointAtLength(d){const a=(Math.max(0,Math.min(total,d))/total)*Math.PI*2;return {x:radius*Math.cos(a),y:radius*Math.sin(a)}}
    };
    const fakeTrack={id:'test',lengthMeters:1000,geometry:{sampleMeters:20,cornerCurvatureThreshold:0.001,minCornerLengthMeters:40,mergeGapMeters:20,trackWidthMeters:14}};
    const built=holder.mwsBuildF1TrackGeometryV193?.(fakeTrack,fakePath);
    if(!built||built.samples.length<40)issues.push('Geometry engine sampling smoke test failed');
    if(!built?.samples?.every(s=>Number.isFinite(s.curvatureRadPerMeter)))issues.push('Geometry curvature smoke test produced non-finite values');
    if(!built?.corners?.length)issues.push('Geometry corner detection smoke test found no corner on circular path');
  }catch(error){
    issues.push('Geometry engine smoke test failed: '+String(error?.message||error));
  }

  for(const file of ['assets/f1-track-v1.js','assets/f1-track-geometry-v2.js','assets/f1-racing-v1.js']){
    const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  }

  for(const token of [
    'node --check assets/f1-track-geometry-v2.js',
    'node --check scripts/run-phase193-f1-track-geometry-audit.mjs',
    "echo '[phase193] F1 track geometry sampling and curvature'"
  ])if(!workflow.includes(token))issues.push('Phase 193 workflow verification missing: '+token);

  const result={phase:193,name:'f1-track-geometry-v2',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase193F1TrackGeometryAudit();
