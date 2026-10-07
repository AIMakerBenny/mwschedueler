(function(root){
'use strict';

function clamp(value,min,max){return Math.min(max,Math.max(min,value))}
function signedTurnAngle(ax,ay,bx,by){
  const dot=ax*bx+ay*by;
  const cross=ax*by-ay*bx;
  return Math.atan2(cross,dot);
}
function makeSamples(track,pathElement){
  const lengthMeters=Math.max(1,Number(track?.lengthMeters)||1);
  const totalSvg=Number(pathElement?.getTotalLength?.())||0;
  if(!(totalSvg>0))return [];
  const sampleMeters=Math.max(5,Number(track?.geometry?.sampleMeters)||20);
  const count=Math.max(24,Math.round(lengthMeters/sampleMeters));
  const actualSpacing=lengthMeters/count;
  const points=[];
  for(let i=0;i<count;i++){
    const progress=i/count;
    const p=pathElement.getPointAtLength(progress*totalSvg);
    points.push({index:i,progress,distanceMeters:progress*lengthMeters,x:Number(p.x),y:Number(p.y)});
  }
  return points.map(function(point,i){
    const prev=points[(i-1+count)%count];
    const next=points[(i+1)%count];
    const inX=point.x-prev.x,inY=point.y-prev.y;
    const outX=next.x-point.x,outY=next.y-point.y;
    const angle=signedTurnAngle(inX,inY,outX,outY);
    const heading=Math.atan2(next.y-prev.y,next.x-prev.x);
    return {...point,headingRad:heading,turnAngleRad:angle,curvatureRadPerMeter:angle/actualSpacing};
  });
}
function detectCorners(track,samples){
  if(!samples.length)return [];
  const threshold=Math.max(0.00001,Number(track?.geometry?.cornerCurvatureThreshold)||0.0018);
  const spacing=Math.max(1,Number(track?.lengthMeters)||1)/samples.length;
  const minSamples=Math.max(1,Math.round((Number(track?.geometry?.minCornerLengthMeters)||40)/spacing));
  const mergeGapSamples=Math.max(0,Math.round((Number(track?.geometry?.mergeGapMeters)||20)/spacing));
  const hot=samples.map(s=>Math.abs(s.curvatureRadPerMeter)>=threshold);
  const groups=[];
  let start=-1,lastHot=-1;
  for(let i=0;i<hot.length;i++){
    if(hot[i]){
      if(start<0)start=i;
      lastHot=i;
    }else if(start>=0&&i-lastHot>mergeGapSamples){
      groups.push([start,lastHot]);
      start=-1;lastHot=-1;
    }
  }
  if(start>=0)groups.push([start,lastHot]);
  const directional=[];
  for(const [a,b] of groups){
    let segStart=a;
    let sign=Math.sign(Number(samples[a]?.curvatureRadPerMeter)||0)||1;
    for(let i=a+1;i<=b;i++){
      const curvature=Number(samples[i]?.curvatureRadPerMeter)||0;
      const nextSign=Math.sign(curvature)||sign;
      if(nextSign===sign||Math.abs(curvature)<threshold*1.05)continue;
      const confirmA=Number(samples[Math.min(b,i+1)]?.curvatureRadPerMeter)||0;
      const confirmed=Math.sign(confirmA)===nextSign||i===b;
      const leftLength=i-segStart,rightLength=b-i+1;
      if(confirmed&&leftLength>=minSamples&&rightLength>=minSamples){
        directional.push([segStart,i-1]);
        segStart=i;
        sign=nextSign;
      }
    }
    directional.push([segStart,b]);
  }
  return directional.filter(([a,b])=>b-a+1>=minSamples).map(function([a,b],idx){
    let apex=a;
    for(let i=a+1;i<=b;i++)if(Math.abs(samples[i].curvatureRadPerMeter)>Math.abs(samples[apex].curvatureRadPerMeter))apex=i;
    const signed=samples.slice(a,b+1).reduce((sum,s)=>sum+s.curvatureRadPerMeter,0);
    return {
      id:'C'+String(idx+1).padStart(2,'0'),
      startIndex:a,
      apexIndex:apex,
      endIndex:b,
      startProgress:samples[a].progress,
      apexProgress:samples[apex].progress,
      endProgress:samples[b].progress,
      direction:signed>=0?'left':'right',
      peakCurvature:Math.abs(samples[apex].curvatureRadPerMeter),
      lengthMeters:(b-a+1)*spacing,
       turnAngleDegrees:samples.slice(a,b+1).reduce((sum,s)=>sum+Math.abs(Number(s.turnAngleRad)||0),0)*180/Math.PI,
       radiusMeters:1/Math.max(.00001,Math.abs(Number(samples[apex].curvatureRadPerMeter)||0))
    };
  });
}
function normalizeProgress(value){return ((Number(value)||0)%1+1)%1}
function zoneAtProgressRecoveryL(track,progress){
  const p=normalizeProgress(progress);
  const zones=Array.isArray(track?.zones)?track.zones:[];
  return zones.find(z=>p>=Number(z.start)&&p<Number(z.end))||zones[zones.length-1]||null;
}
function targetKphAtProgress(track,progress){
  const zone=zoneAtProgressRecoveryL(track,progress);
  return Math.max(1,Number(zone?.targetKph)||180);
}
function curvatureSeverityRecoveryL(track,curvature){
  const threshold=Math.max(0.00001,Number(track?.geometry?.cornerCurvatureThreshold)||0.0018);
  const abs=Math.abs(Number(curvature)||0);
  const soft=threshold*.45;
  const full=threshold*2.35;
  const linear=Math.max(0,Math.min(1,(abs-soft)/Math.max(0.000001,full-soft)));
  return linear*linear*(3-2*linear);
}
function curvatureWeightedZoneLimitRecoveryL(track,sample,maxKph){
  const zone=zoneAtProgressRecoveryL(track,sample?.progress);
  const zoneTarget=Math.min(maxKph,Math.max(1,Number(zone?.targetKph)||maxKph));
  const type=String(zone?.type||'').toLowerCase();
  if(type==='straight')return maxKph;
  const severity=curvatureSeverityRecoveryL(track,sample?.curvatureRadPerMeter);
  const typeFloor=type==='fastcorner'?.18:type==='mediumcorner'?.28:type==='slowcorner'?.42:type==='hairpin'?.62:.24;
  const influence=Math.max(typeFloor*severity,severity);
  return maxKph-(maxKph-zoneTarget)*influence;
}
function classifyCornerBySpeed(apexKph){
  if(apexKph<110)return 'hairpin';
  if(apexKph<160)return 'slow';
  if(apexKph<220)return 'medium';
  return 'fast';
}
function buildCornerPhases(track,geometry){
  if(!track||!geometry?.corners?.length)return {...geometry,cornerPhases:[]};
  const length=Math.max(1,Number(track.lengthMeters)||1);
  const decel=Math.max(1,Number(track?.geometry?.referenceBrakeDecelMps2)||20);
  const lead=Math.max(0,Number(track?.geometry?.approachLeadMeters)||80);
  const phases=geometry.corners.map(function(corner){
    const turnInProgress=normalizeProgress(corner.startProgress);
    const apexProgress=normalizeProgress(corner.apexProgress);
    const apexKph=targetKphAtProgress(track,apexProgress);
    const candidates=[0.03,0.05,0.08].map(offset=>targetKphAtProgress(track,turnInProgress-offset));
    const approachKph=Math.max(apexKph+20,...candidates);
    const v0=approachKph/3.6,v1=apexKph/3.6;
    const brakingDistanceMeters=Math.max(0,(v0*v0-v1*v1)/(2*decel));
    const turnInDistanceMeters=Number(corner.startProgress)*length;
    const apexDistanceMeters=Number(corner.apexProgress)*length;
    const detectedExitDistanceMeters=Number(corner.endProgress)*length;
    const exitExtensionMeters=Math.max(30,Math.min(90,Number(corner.lengthMeters||40)*.35));
    const exitDistanceMeters=detectedExitDistanceMeters+exitExtensionMeters;
    const exitProgress=normalizeProgress(exitDistanceMeters/length);
    const brakingPointDistanceMeters=turnInDistanceMeters-brakingDistanceMeters;
    const approachDistanceMeters=brakingPointDistanceMeters-lead;
    const brakingProgress=normalizeProgress(brakingPointDistanceMeters/length);
    const approachProgress=normalizeProgress(approachDistanceMeters/length);
    return {
      ...corner,
      approachProgress,
      brakingProgress,
      turnInProgress,
      apexProgress,
      exitProgress,
      approachDistanceMeters,
      brakingPointDistanceMeters,
      turnInDistanceMeters,
      apexDistanceMeters,
      detectedExitDistanceMeters,
      exitExtensionMeters,
      exitDistanceMeters,
      referenceApproachKph:approachKph,
      referenceApexKph:apexKph,
      referenceBrakeDecelMps2:decel,
       angleSeverity:clamp((Number(corner.turnAngleDegrees||0)-18)/145,0,1),
      brakingDistanceMeters,
      cornerClass:classifyCornerBySpeed(apexKph)
    };
  });
  return {...geometry,cornerPhases:phases};
}
function cornerPhaseAtProgress(geometry,progress){
  const lapLength=Math.max(1,Number(geometry?.lengthMeters)||1);
  const baseDistance=normalizeProgress(progress)*lapLength;
  const candidates=[];
  const priority={APPROACH:1,EXIT:2,BRAKING:3,TURN_IN:4,APEX:5};
  for(const corner of geometry?.cornerPhases||[]){
    const start=Number(corner.approachDistanceMeters);
    const end=Number(corner.exitDistanceMeters);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)continue;
    let here=baseDistance;
    while(here<start)here+=lapLength;
    while(here-lapLength>=start)here-=lapLength;
    if(here>end)continue;
    let phase='EXIT';
    if(here<Number(corner.brakingPointDistanceMeters))phase='APPROACH';
    else if(here<Number(corner.turnInDistanceMeters))phase='BRAKING';
    else if(here<Number(corner.apexDistanceMeters))phase='TURN_IN';
    else{
      const apexWindowMeters=Math.max(5,Number(corner.lengthMeters||40)*0.18);
      if(here<Math.min(end,Number(corner.apexDistanceMeters)+apexWindowMeters))phase='APEX';
    }
    candidates.push({corner,phase,here,priority:priority[phase]||0});
  }
  candidates.sort((a,b)=>b.priority-a.priority||Number(b.corner.startProgress)-Number(a.corner.startProgress));
  return candidates[0]||null;
}
function alignedDistanceForCornerV270(track,corner,progress){
  const length=Math.max(1,Number(track?.lengthMeters)||1);
  let here=normalizeProgress(progress)*length;
  const start=Number(corner?.approachDistanceMeters);
  if(Number.isFinite(start)){while(here<start)here+=length;while(here-length>=start)here-=length}
  return here;
}
function exitRawLimitV270(track,geometry,sample,baseLimit,curveLimit,maxKph){
  const phaseInfo=cornerPhaseAtProgress(geometry,sample?.progress);
  if(phaseInfo?.phase!=='EXIT'||!phaseInfo.corner)return baseLimit;
  const corner=phaseInfo.corner;
  const here=alignedDistanceForCornerV270(track,corner,sample.progress);
  const exitStart=Number(corner.apexDistanceMeters);
  const ratio=clamp((here-exitStart)/Math.max(1,Number(corner.exitDistanceMeters)-exitStart),0,1);
  const eased=ratio*ratio*(3-2*ratio);
  const apex=Math.max(corner.cornerClass==='hairpin'?72:corner.cornerClass==='slow'?92:0,Number(corner.referenceApexKph)||baseLimit);
  const afterProgress=normalizeProgress(Number(corner.exitProgress)+Math.max(.006,105/Math.max(1,Number(track.lengthMeters)||1)));
  const nextTarget=Math.max(apex+24,targetKphAtProgress(track,afterProgress));
  const recovery=apex+(nextTarget-apex)*eased;
  const dynamicCurveCap=Math.min(maxKph,curveLimit+70*eased);
  return Math.min(maxKph,dynamicCurveCap,Math.max(baseLimit,recovery));
}
function buildSpeedProfile(track,geometry){
  if(!track||!geometry?.samples?.length)return {...geometry,speedProfile:[]};
  const samples=geometry.samples;
  const count=samples.length;
  const spacing=Math.max(1,Number(geometry.sampleMeters)||Number(track.lengthMeters)/count||20);
  const brake=Math.max(1,Number(track?.geometry?.referenceBrakeDecelMps2)||20);
  const accel=Math.max(0.5,Number(track?.geometry?.referenceAccelMps2)||8.5);
  const maxKph=Math.max(100,Number(track?.geometry?.maxStraightKph)||335);
  const iterations=Math.max(2,Math.round(Number(track?.geometry?.speedProfileIterations)||6));
  const raw=samples.map(function(sample){
    const zoneLimit=curvatureWeightedZoneLimitRecoveryL(track,sample,maxKph);
    const curvature=Math.abs(Number(sample.curvatureRadPerMeter)||0);
    const curveLimit=curvature>0.00001
      ?Math.min(maxKph,Math.max(70,Math.sqrt(25/curvature)*3.6))
      :maxKph;
    const baseLimit=Math.min(maxKph,zoneLimit,curveLimit);
    return exitRawLimitV270(track,geometry,sample,baseLimit,curveLimit,maxKph);
  });
  const speed=raw.slice();
  for(let pass=0;pass<iterations;pass++){
    for(let i=count-1;i>=0;i--){
      const next=(i+1)%count;
      const vNext=speed[next]/3.6;
      const allowed=Math.sqrt(Math.max(0,vNext*vNext+2*brake*spacing))*3.6;
      speed[i]=Math.min(speed[i],raw[i],allowed);
    }
    for(let i=0;i<count;i++){
      const prev=(i-1+count)%count;
      const vPrev=speed[prev]/3.6;
      const allowed=Math.sqrt(Math.max(0,vPrev*vPrev+2*accel*spacing))*3.6;
      speed[i]=Math.min(speed[i],raw[i],allowed);
    }
  }
  const speedProfile=samples.map(function(sample,index){
    return {
      index,
      progress:sample.progress,
      distanceMeters:sample.distanceMeters,
      rawLimitKph:raw[index],
      targetKph:speed[index],
      cornerPhase:cornerPhaseAtProgress(geometry,sample.progress)?.phase||'STRAIGHT'
    };
  });
  return {...geometry,speedProfile};
}
function speedTargetAtProgress(geometry,progress){
  const profile=geometry?.speedProfile||[];
  if(!profile.length)return null;
  const p=normalizeProgress(progress);
  const scaled=p*profile.length;
  const i0=Math.floor(scaled)%profile.length;
  const i1=(i0+1)%profile.length;
  const t=scaled-Math.floor(scaled);
  const a=profile[i0],b=profile[i1];
  return {
    targetKph:Number(a.targetKph)+(Number(b.targetKph)-Number(a.targetKph))*t,
    rawLimitKph:Number(a.rawLimitKph)+(Number(b.rawLimitKph)-Number(a.rawLimitKph))*t,
    cornerPhase:t<0.5?a.cornerPhase:b.cornerPhase
  };
}
function buildTrackGeometry(track,pathElement){
  if(!track||!pathElement)return null;
  const samples=makeSamples(track,pathElement);
  if(!samples.length)return null;
  const corners=detectCorners(track,samples);
  return {
    trackId:String(track.id||''),
    lengthMeters:Number(track.lengthMeters)||0,
    sampleMeters:(Number(track.lengthMeters)||0)/samples.length,
    trackWidthMeters:Number(track?.geometry?.trackWidthMeters)||14,
    samples,
    corners
  };
}
function sampleAtProgress(geometry,progress){
  const samples=geometry?.samples||[];
  if(!samples.length)return null;
  const p=((Number(progress)||0)%1+1)%1;
  const index=Math.round(p*samples.length)%samples.length;
  return samples[index]||null;
}

root.mwsBuildF1TrackGeometryV193=buildTrackGeometry;
root.mwsF1TrackGeometrySampleAtProgressV193=sampleAtProgress;
root.mwsBuildF1CornerPhasesV194=buildCornerPhases;
root.mwsF1CornerPhaseAtProgressV194=cornerPhaseAtProgress;
root.mwsBuildF1SpeedProfileV195=buildSpeedProfile;
root.mwsF1SpeedTargetAtProgressV195=speedTargetAtProgress;
root.mwsF1CurvatureSeverityRecoveryL=curvatureSeverityRecoveryL;
root.mwsF1CurvatureWeightedZoneLimitRecoveryL=curvatureWeightedZoneLimitRecoveryL;
root.__mwsF1TrackGeometryV193='svg-sampling-curvature-corners-v1';
root.__mwsF1TrackCornerPhasesV194='approach-brake-turn-apex-exit-v1';
root.__mwsF1SpeedProfileV195='backward-brake-forward-accel-v1';
root.__mwsF1RecoveryL='curvature-weighted-speed-v1';
root.__mwsF1CornerDynamicsV270='direction-split-exit-recovery-v1';
})(typeof window!=='undefined'?window:globalThis);
