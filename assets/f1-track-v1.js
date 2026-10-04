(function(root){
'use strict';
const TRACK=Object.freeze({
  id:'majoku-ring-v1',
  name:'Majoku Ring',
  country:'Mawang',
  viewBox:Object.freeze([0,0,1000,600]),
  path:'M 205 430 C 125 385 105 305 145 225 C 195 125 320 95 410 145 C 485 188 545 175 610 115 C 690 42 830 70 875 165 C 925 270 855 355 760 370 C 675 383 645 425 605 490 C 558 566 438 555 385 500 C 330 444 270 468 205 430 Z',
  lengthMeters:5280,
  startFinish:0,
  geometry:Object.freeze({
    sampleMeters:20,
    cornerCurvatureThreshold:0.0018,
    minCornerLengthMeters:40,
    mergeGapMeters:20,
    trackWidthMeters:14,
    visualTrackWidthSvg:26,
    racingLineMarginMeters:1.5,
    referenceBrakeDecelMps2:20,
    approachLeadMeters:80,
    apexWindowMeters:30,
    referenceAccelMps2:8.5,
    maxStraightKph:335,
    speedProfileIterations:6,
    direction:'clockwise'
  }),
  sectors:Object.freeze([
    Object.freeze({id:'S1',start:0,end:0.333333}),
    Object.freeze({id:'S2',start:0.333333,end:0.666667}),
    Object.freeze({id:'S3',start:0.666667,end:1})
  ]),
  pit:Object.freeze({entry:0.918,stop:0.972,exit:0.084,speedLimitKph:80}),
  speedTraps:Object.freeze([
    Object.freeze({id:'ST1',label:'Sector 1 Trap',progress:0.287}),
    Object.freeze({id:'ST2',label:'Sector 2 Trap',progress:0.648}),
    Object.freeze({id:'FL',label:'Finish Line',progress:0.992})
  ]),
  overtakeZones:Object.freeze([
    Object.freeze({id:'O1',start:0.018,end:0.094}),
    Object.freeze({id:'O2',start:0.604,end:0.716})
  ]),
  zones:Object.freeze([
    Object.freeze({id:'Z01',type:'straight',start:0.000,end:0.100,targetKph:315}),
    Object.freeze({id:'Z02',type:'fastCorner',start:0.100,end:0.180,targetKph:250}),
    Object.freeze({id:'Z03',type:'mediumCorner',start:0.180,end:0.280,targetKph:185}),
    Object.freeze({id:'Z04',type:'straight',start:0.280,end:0.410,targetKph:320}),
    Object.freeze({id:'Z05',type:'hairpin',start:0.410,end:0.490,targetKph:95}),
    Object.freeze({id:'Z06',type:'mediumCorner',start:0.490,end:0.600,targetKph:175}),
    Object.freeze({id:'Z07',type:'straight',start:0.600,end:0.730,targetKph:310}),
    Object.freeze({id:'Z08',type:'slowCorner',start:0.730,end:0.820,targetKph:125}),
    Object.freeze({id:'Z09',type:'fastCorner',start:0.820,end:0.910,targetKph:235}),
    Object.freeze({id:'Z10',type:'straight',start:0.910,end:1.000,targetKph:325})
  ])
});
function cloneTrack(track){
  return {...track,viewBox:[...track.viewBox],geometry:{...track.geometry},sectors:track.sectors.map(x=>({...x})),pit:{...track.pit},speedTraps:track.speedTraps.map(x=>({...x})),overtakeZones:track.overtakeZones.map(x=>({...x})),zones:track.zones.map(x=>({...x}))};
}
function getTrack(id='majoku-ring-v1'){return id===TRACK.id?cloneTrack(TRACK):null}
function validateTrack(track){
  const issues=[];
  if(!track||typeof track!=='object')return ['track missing'];
  if(!track.id||!track.name)issues.push('identity missing');
  if(!Array.isArray(track.viewBox)||track.viewBox.length!==4)issues.push('viewBox invalid');
  if(typeof track.path!=='string'||!track.path.startsWith('M '))issues.push('SVG path invalid');
  if(!(Number(track.lengthMeters)>1000))issues.push('lengthMeters invalid');
  if(!Array.isArray(track.sectors)||track.sectors.length!==3)issues.push('sector count invalid');
  if(!track.geometry||!(track.geometry.sampleMeters>0)||!(track.geometry.cornerCurvatureThreshold>0)||!(track.geometry.trackWidthMeters>0))issues.push('geometry metadata invalid');
  if(!(track.geometry.visualTrackWidthSvg>0)||!(track.geometry.racingLineMarginMeters>=0))issues.push('racing line metadata invalid');
  if(!(track.geometry.referenceBrakeDecelMps2>0)||!(track.geometry.approachLeadMeters>=0)||!(track.geometry.apexWindowMeters>0))issues.push('corner phase metadata invalid');
  if(!(track.geometry.referenceAccelMps2>0)||!(track.geometry.maxStraightKph>0)||!(track.geometry.speedProfileIterations>=2))issues.push('speed profile metadata invalid');
  if(!track.pit||!(track.pit.entry>=0&&track.pit.entry<1)||!(track.pit.exit>=0&&track.pit.exit<1))issues.push('pit metadata invalid');
  if(!Array.isArray(track.speedTraps)||track.speedTraps.length<3)issues.push('speed traps missing');
  if(!Array.isArray(track.zones)||!track.zones.length)issues.push('speed zones missing');
  if(Array.isArray(track.zones)){
    let cursor=0;
    for(const zone of track.zones){
      if(Math.abs(Number(zone.start)-cursor)>0.000001)issues.push('zone gap at '+zone.id);
      if(!(zone.end>zone.start&&zone.end<=1))issues.push('zone range invalid '+zone.id);
      if(!(Number(zone.targetKph)>0))issues.push('zone speed invalid '+zone.id);
      cursor=Number(zone.end);
    }
    if(Math.abs(cursor-1)>0.000001)issues.push('zones do not end at 1');
  }
  return issues;
}
root.MWS_F1_TRACKS_V182=Object.freeze({[TRACK.id]:TRACK});
root.mwsGetF1TrackV182=getTrack;
root.mwsValidateF1TrackV182=validateTrack;
root.__mwsF1TrackModelV182='majoku-ring-metadata-v1';
root.__mwsF1TrackGeometryMetaV193='sample-curvature-width-v1';
root.__mwsF1TrackCornerMetaV194='brake-turn-apex-exit-v1';
root.__mwsF1TrackSpeedProfileMetaV195='backward-brake-forward-accel-v1';
root.__mwsF1TrackRacingLineMetaV197='track-width-line-offset-v1';
})(typeof window!=='undefined'?window:globalThis);
