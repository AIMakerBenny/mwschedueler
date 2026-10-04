import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase194F1CornerPhaseAudit(){
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
  ])if(!index.includes(token))issues.push('Phase 194 asset link missing: '+token);

  for(const token of [
    'referenceBrakeDecelMps2:20',
    'approachLeadMeters:80',
    'apexWindowMeters:30',
    "root.__mwsF1TrackCornerMetaV194='brake-turn-apex-exit-v1';"
  ])if(!track.includes(token))issues.push('Phase 194 track corner metadata missing: '+token);

  for(const token of [
    'function targetKphAtProgress(track,progress){',
    'function classifyCornerBySpeed(apexKph){',
    'function buildCornerPhases(track,geometry){',
    'const brakingDistanceMeters=Math.max(0,(v0*v0-v1*v1)/(2*decel));',
    'const brakingProgress=normalizeProgress(brakingPointDistanceMeters/length);',
    'approachDistanceMeters,',
    'brakingPointDistanceMeters,',
    'turnInDistanceMeters,',
    'apexDistanceMeters,',
    'exitDistanceMeters,',
    'approachProgress,',
    'turnInProgress,',
    'apexProgress,',
    'exitProgress,',
    'function cornerPhaseAtProgress(geometry,progress){',
    "phase:'APPROACH'",
    "phase:'BRAKING'",
    "phase:'TURN_IN'",
    "phase:'APEX'",
    "phase:'EXIT'",
    'root.mwsBuildF1CornerPhasesV194=buildCornerPhases;',
    'root.mwsF1CornerPhaseAtProgressV194=cornerPhaseAtProgress;',
    "root.__mwsF1TrackCornerPhasesV194='approach-brake-turn-apex-exit-v1';"
  ])if(!geometry.includes(token))issues.push('Phase 194 corner phase engine missing: '+token);

  for(const token of [
    "const VERSION194='phase194-corner-phase-model';",
    "typeof window.mwsBuildF1CornerPhasesV194==='function'",
    'window.mwsBuildF1CornerPhasesV194(snapshot.track,raceGeometryV193);',
    'function getCornerPhasesV194(){',
    'function getCornerPhaseAtProgressV194(progress){',
    'window.mwsF1GetCornerPhasesV194=getCornerPhasesV194;',
    'window.mwsF1GetCornerPhaseAtProgressV194=getCornerPhaseAtProgressV194;',
    'window.__mwsF1RacingV194=VERSION194;'
  ])if(!racing.includes(token))issues.push('Phase 194 race integration missing: '+token);

  try{
    const holder={};
    Function('globalThis',geometry+';return globalThis;')(holder);
    const radius=100,total=2*Math.PI*radius;
    const fakePath={
      getTotalLength(){return total},
      getPointAtLength(d){const a=(Math.max(0,Math.min(total,d))/total)*Math.PI*2;return {x:radius*Math.cos(a),y:radius*Math.sin(a)}}
    };
    const fakeTrack={
      id:'test',
      lengthMeters:1000,
      geometry:{sampleMeters:20,cornerCurvatureThreshold:0.001,minCornerLengthMeters:40,mergeGapMeters:20,trackWidthMeters:14,referenceBrakeDecelMps2:20,approachLeadMeters:80,apexWindowMeters:30},
      zones:[
        {start:0,end:0.25,targetKph:300},
        {start:0.25,end:0.75,targetKph:120},
        {start:0.75,end:1,targetKph:300}
      ]
    };
    const base=holder.mwsBuildF1TrackGeometryV193?.(fakeTrack,fakePath);
    const enriched=holder.mwsBuildF1CornerPhasesV194?.(fakeTrack,base);
    const corner=enriched?.cornerPhases?.[0];
    if(!corner)issues.push('Corner phase smoke test produced no corner');
    if(corner&&!(corner.brakingDistanceMeters>=0))issues.push('Corner braking distance is invalid');
    if(corner&&![corner.approachProgress,corner.brakingProgress,corner.turnInProgress,corner.apexProgress,corner.exitProgress].every(Number.isFinite))issues.push('Corner phase progress contains non-finite value');
    const probe=corner?holder.mwsF1CornerPhaseAtProgressV194?.(enriched,corner.apexProgress):null;
    if(corner&&!probe)issues.push('Corner phase lookup failed at apex');
  }catch(error){
    issues.push('Corner phase smoke test failed: '+String(error?.message||error));
  }

  for(const file of ['assets/f1-track-v1.js','assets/f1-track-geometry-v2.js','assets/f1-racing-v1.js']){
    const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  }

  for(const token of [
    'node --check scripts/run-phase194-f1-corner-phase-audit.mjs',
    "echo '[phase194] F1 braking turn-in apex and exit model'"
  ])if(!workflow.includes(token))issues.push('Phase 194 workflow verification missing: '+token);

  const result={phase:194,name:'f1-corner-phase-model',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase194F1CornerPhaseAudit();
