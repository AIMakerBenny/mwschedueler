(function(root){
'use strict';
function freezeTrack(track){
  return Object.freeze({
    ...track,
    viewBox:Object.freeze([...track.viewBox]),
    geometry:Object.freeze({...track.geometry}),
    sectors:Object.freeze(track.sectors.map(row=>Object.freeze({...row}))),
    pit:Object.freeze({...track.pit}),
    speedTraps:Object.freeze(track.speedTraps.map(row=>Object.freeze({...row}))),
    overtakeZones:Object.freeze(track.overtakeZones.map(row=>Object.freeze({...row}))),
    zones:Object.freeze(track.zones.map(row=>Object.freeze({...row})))
  });
}
const MAJOKU_RING=freezeTrack({
  id:'majoku-ring-v1',
  name:'Majoku Ring',
  country:'Mawang',
  viewBox:[0,0,1000,600],
  path:'M 205 430 C 125 385 105 305 145 225 C 195 125 320 95 410 145 C 485 188 545 175 610 115 C 690 42 830 70 875 165 C 925 270 855 355 760 370 C 675 383 645 425 605 490 C 558 566 438 555 385 500 C 330 444 270 468 205 430 Z',
  lengthMeters:5280,
  startFinish:0,
  geometry:{sampleMeters:20,cornerCurvatureThreshold:0.0018,minCornerLengthMeters:40,mergeGapMeters:20,trackWidthMeters:14,visualTrackWidthSvg:26,racingLineMarginMeters:1.5,referenceBrakeDecelMps2:20,approachLeadMeters:80,apexWindowMeters:30,referenceAccelMps2:8.5,maxStraightKph:335,speedProfileIterations:6,direction:'clockwise'},
  sectors:[{id:'S1',start:0,end:0.333333},{id:'S2',start:0.333333,end:0.666667},{id:'S3',start:0.666667,end:1}],
  pit:{entry:0.918,stop:0.972,exit:0.084,speedLimitKph:80},
  speedTraps:[{id:'ST1',label:'Sector 1 Trap',progress:0.287},{id:'ST2',label:'Sector 2 Trap',progress:0.648},{id:'FL',label:'Finish Line',progress:0.992}],
  overtakeZones:[{id:'O1',start:0.018,end:0.094},{id:'O2',start:0.604,end:0.716}],
  zones:[
    {id:'Z01',type:'straight',start:0.000,end:0.100,targetKph:315},
    {id:'Z02',type:'fastCorner',start:0.100,end:0.180,targetKph:250},
    {id:'Z03',type:'mediumCorner',start:0.180,end:0.280,targetKph:185},
    {id:'Z04',type:'straight',start:0.280,end:0.410,targetKph:320},
    {id:'Z05',type:'hairpin',start:0.410,end:0.490,targetKph:95},
    {id:'Z06',type:'mediumCorner',start:0.490,end:0.600,targetKph:175},
    {id:'Z07',type:'straight',start:0.600,end:0.730,targetKph:310},
    {id:'Z08',type:'slowCorner',start:0.730,end:0.820,targetKph:125},
    {id:'Z09',type:'fastCorner',start:0.820,end:0.910,targetKph:235},
    {id:'Z10',type:'straight',start:0.910,end:1.000,targetKph:325}
  ]
});
const CASTLE_STREET_CIRCUIT=freezeTrack({
  id:'castle-street-circuit-v1',
  name:'Castle Street Circuit',
  country:'Mawang',
  viewBox:[0,0,1000,600],
  path:'M 155 410 C 105 350 112 245 180 190 C 235 145 305 155 350 205 L 430 295 C 470 338 525 330 555 282 L 635 150 C 675 88 780 82 835 135 C 902 200 885 300 825 350 C 770 397 700 390 650 430 L 555 510 C 485 565 365 550 310 485 C 268 438 220 454 155 410 Z',
  lengthMeters:4675,
  startFinish:0,
  geometry:{sampleMeters:18,cornerCurvatureThreshold:0.0020,minCornerLengthMeters:32,mergeGapMeters:18,trackWidthMeters:12,visualTrackWidthSvg:24,racingLineMarginMeters:1.3,referenceBrakeDecelMps2:20,approachLeadMeters:72,apexWindowMeters:26,referenceAccelMps2:8.2,maxStraightKph:318,speedProfileIterations:6,direction:'clockwise'},
  sectors:[{id:'S1',start:0,end:0.318},{id:'S2',start:0.318,end:0.672},{id:'S3',start:0.672,end:1}],
  pit:{entry:0.948,stop:0.986,exit:0.105,speedLimitKph:60},
  speedTraps:[{id:'ST1',label:'Castle Straight',progress:0.255},{id:'ST2',label:'Harbour Avenue',progress:0.704},{id:'FL',label:'Finish Line',progress:0.040}],
  overtakeZones:[{id:'O1',start:0.105,end:0.245},{id:'O2',start:0.666,end:0.758}],
  zones:[
    {id:'C01',type:'straight',start:0.000,end:0.105,targetKph:278},
    {id:'C02',type:'mediumCorner',start:0.105,end:0.190,targetKph:165},
    {id:'C03',type:'straight',start:0.190,end:0.305,targetKph:305},
    {id:'C04',type:'slowCorner',start:0.305,end:0.405,targetKph:120},
    {id:'C05',type:'mediumCorner',start:0.405,end:0.515,targetKph:170},
    {id:'C06',type:'hairpin',start:0.515,end:0.590,targetKph:88},
    {id:'C07',type:'straight',start:0.590,end:0.735,targetKph:318},
    {id:'C08',type:'fastCorner',start:0.735,end:0.820,targetKph:225},
    {id:'C09',type:'slowCorner',start:0.820,end:0.905,targetKph:115},
    {id:'C10',type:'straight',start:0.905,end:1.000,targetKph:286}
  ]
});
const BLUE_COAST_SPEEDWAY=freezeTrack({
  id:'blue-coast-speedway-v1',
  name:'Blue Coast Speedway',
  country:'Mawang',
  viewBox:[0,0,1000,600],
  path:'M 145 335 C 145 195 265 105 430 105 C 560 105 625 145 700 128 C 808 103 895 175 895 285 C 895 410 790 475 680 460 C 590 448 535 505 430 505 C 265 505 145 450 145 335 Z',
  lengthMeters:6120,
  startFinish:0,
  geometry:{sampleMeters:22,cornerCurvatureThreshold:0.00135,minCornerLengthMeters:48,mergeGapMeters:24,trackWidthMeters:15,visualTrackWidthSvg:28,racingLineMarginMeters:1.6,referenceBrakeDecelMps2:20,approachLeadMeters:88,apexWindowMeters:34,referenceAccelMps2:8.7,maxStraightKph:348,speedProfileIterations:7,direction:'clockwise'},
  sectors:[{id:'S1',start:0,end:0.345},{id:'S2',start:0.345,end:0.658},{id:'S3',start:0.658,end:1}],
  pit:{entry:0.925,stop:0.978,exit:0.075,speedLimitKph:80},
  speedTraps:[{id:'ST1',label:'Ocean Straight',progress:0.245},{id:'ST2',label:'North Straight',progress:0.575},{id:'FL',label:'Finish Line',progress:0.010}],
  overtakeZones:[{id:'O1',start:0.055,end:0.255},{id:'O2',start:0.515,end:0.675}],
  zones:[
    {id:'B01',type:'straight',start:0.000,end:0.145,targetKph:340},
    {id:'B02',type:'fastCorner',start:0.145,end:0.245,targetKph:265},
    {id:'B03',type:'straight',start:0.245,end:0.355,targetKph:348},
    {id:'B04',type:'mediumCorner',start:0.355,end:0.450,targetKph:195},
    {id:'B05',type:'fastCorner',start:0.450,end:0.535,targetKph:245},
    {id:'B06',type:'straight',start:0.535,end:0.680,targetKph:342},
    {id:'B07',type:'mediumCorner',start:0.680,end:0.770,targetKph:188},
    {id:'B08',type:'straight',start:0.770,end:0.855,targetKph:325},
    {id:'B09',type:'fastCorner',start:0.855,end:0.930,targetKph:238},
    {id:'B10',type:'straight',start:0.930,end:1.000,targetKph:335}
  ]
});
const TRACKS=Object.freeze({
  [MAJOKU_RING.id]:MAJOKU_RING,
  [CASTLE_STREET_CIRCUIT.id]:CASTLE_STREET_CIRCUIT,
  [BLUE_COAST_SPEEDWAY.id]:BLUE_COAST_SPEEDWAY
});
function cloneTrack(track){
  return track?{...track,viewBox:[...track.viewBox],geometry:{...track.geometry},sectors:track.sectors.map(x=>({...x})),pit:{...track.pit},speedTraps:track.speedTraps.map(x=>({...x})),overtakeZones:track.overtakeZones.map(x=>({...x})),zones:track.zones.map(x=>({...x}))}:null;
}
function getTrack(id='majoku-ring-v1'){return cloneTrack(TRACKS[String(id||'')])}
function validateTrack(track){
  const issues=[];
  if(!track||typeof track!=='object')return ['track missing'];
  if(!track.id||!track.name)issues.push('identity missing');
  if(!Array.isArray(track.viewBox)||track.viewBox.length!==4)issues.push('viewBox invalid');
  if(typeof track.path!=='string'||!track.path.startsWith('M '))issues.push('SVG path invalid');
  if(!(Number(track.lengthMeters)>1000))issues.push('lengthMeters invalid');
  if(!(Number(track.startFinish)>=0&&Number(track.startFinish)<1))issues.push('startFinish invalid');
  if(!Array.isArray(track.sectors)||track.sectors.length!==3)issues.push('sector count invalid');
  if(!track.geometry||!(track.geometry.sampleMeters>0)||!(track.geometry.cornerCurvatureThreshold>0)||!(track.geometry.trackWidthMeters>0))issues.push('geometry metadata invalid');
  if(!(track.geometry.visualTrackWidthSvg>0)||!(track.geometry.racingLineMarginMeters>=0))issues.push('racing line metadata invalid');
  if(!(track.geometry.referenceBrakeDecelMps2>0)||!(track.geometry.approachLeadMeters>=0)||!(track.geometry.apexWindowMeters>0))issues.push('corner phase metadata invalid');
  if(!(track.geometry.referenceAccelMps2>0)||!(track.geometry.maxStraightKph>0)||!(track.geometry.speedProfileIterations>=2))issues.push('speed profile metadata invalid');
  if(!track.pit||!(track.pit.entry>=0&&track.pit.entry<1)||!(track.pit.exit>=0&&track.pit.exit<1))issues.push('pit metadata invalid');
  if(!Array.isArray(track.speedTraps)||track.speedTraps.length<3)issues.push('speed traps missing');
  if(!Array.isArray(track.overtakeZones)||track.overtakeZones.length<1)issues.push('overtake zones missing');
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
root.MWS_F1_TRACKS_V182=TRACKS;
root.mwsGetF1TrackV182=getTrack;
root.mwsValidateF1TrackV182=validateTrack;
root.__mwsF1TrackModelV182='majoku-ring-metadata-v1';
root.__mwsF1TrackRecoveryA='three-track-catalog-v1';
root.__mwsF1TrackGeometryMetaV193='sample-curvature-width-v1';
root.__mwsF1TrackCornerMetaV194='brake-turn-apex-exit-v1';
root.__mwsF1TrackSpeedProfileMetaV195='backward-brake-forward-accel-v1';
root.__mwsF1TrackRacingLineMetaV197='track-width-line-offset-v1';
})(typeof window!=='undefined'?window:globalThis);
