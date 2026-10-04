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
  return groups.filter(([a,b])=>b-a+1>=minSamples).map(function([a,b],idx){
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
      lengthMeters:(b-a+1)*spacing
    };
  });
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
root.__mwsF1TrackGeometryV193='svg-sampling-curvature-corners-v1';
})(typeof window!=='undefined'?window:globalThis);
