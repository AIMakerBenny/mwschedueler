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
  name:'마주쿠 링',
  archetype:'종합 밸런스형',
  country:'Mawang',
  viewBox:[0,0,1000,600],
  path:'M 205 430 C 125 385 105 305 145 225 C 195 125 320 95 410 145 C 485 188 545 175 610 115 C 690 42 830 70 875 165 C 925 270 855 355 760 370 C 675 383 645 425 605 490 C 558 566 438 555 385 500 C 330 444 270 468 205 430 Z',
  lengthMeters:5280,
  startFinish:0,
  geometry:{sampleMeters:20,cornerCurvatureThreshold:0.0018,minCornerLengthMeters:40,mergeGapMeters:20,trackWidthMeters:14,visualTrackWidthSvg:26,racingLineMarginMeters:1.5,referenceBrakeDecelMps2:20,approachLeadMeters:80,apexWindowMeters:30,referenceAccelMps2:8.5,maxStraightKph:335,speedProfileIterations:6,direction:'clockwise'},
  sectors:[{id:'S1',start:0,end:0.333333},{id:'S2',start:0.333333,end:0.666667},{id:'S3',start:0.666667,end:1}],
  pit:{entry:0.918,stop:0.972,exit:0.084,speedLimitKph:80},
  speedTraps:[{id:'ST1',label:'Sector 1 Trap',progress:0.287},{id:'ST2',label:'Sector 2 Trap',progress:0.648},{id:'FL',label:'Finish Line',progress:0.992}],
  overtakeZones:[{id:'O1',detection:0.992,start:0.018,end:0.094},{id:'O2',detection:0.574,start:0.604,end:0.716}],
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
  name:'캐슬 스트리트 서킷',
  archetype:'테크니컬 스트리트형',
  country:'Mawang',
  viewBox:[0,0,1000,600],
  path:'M 155 410 C 105 350 112 245 180 190 C 235 145 305 155 350 205 L 430 295 C 470 338 525 330 555 282 L 635 150 C 675 88 780 82 835 135 C 902 200 885 300 825 350 C 770 397 700 390 650 430 L 555 510 C 485 565 365 550 310 485 C 268 438 220 454 155 410 Z',
  lengthMeters:4675,
  startFinish:0,
  geometry:{sampleMeters:18,cornerCurvatureThreshold:0.0020,minCornerLengthMeters:32,mergeGapMeters:18,trackWidthMeters:12,visualTrackWidthSvg:24,racingLineMarginMeters:1.3,referenceBrakeDecelMps2:20,approachLeadMeters:72,apexWindowMeters:26,referenceAccelMps2:8.2,maxStraightKph:318,speedProfileIterations:6,direction:'clockwise'},
  sectors:[{id:'S1',start:0,end:0.318},{id:'S2',start:0.318,end:0.672},{id:'S3',start:0.672,end:1}],
  pit:{entry:0.948,stop:0.986,exit:0.105,speedLimitKph:60},
  speedTraps:[{id:'ST1',label:'Castle Straight',progress:0.255},{id:'ST2',label:'Harbour Avenue',progress:0.704},{id:'FL',label:'Finish Line',progress:0.040}],
  overtakeZones:[{id:'O1',detection:0.078,start:0.105,end:0.245},{id:'O2',detection:0.635,start:0.666,end:0.758}],
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
  name:'블루 코스트 스피드웨이',
  archetype:'고속 스피드형',
  country:'Mawang',
  viewBox:[0,0,1000,600],
  path:'M 145 335 C 145 195 265 105 430 105 C 560 105 625 145 700 128 C 808 103 895 175 895 285 C 895 410 790 475 680 460 C 590 448 535 505 430 505 C 265 505 145 450 145 335 Z',
  lengthMeters:6120,
  startFinish:0,
  geometry:{sampleMeters:22,cornerCurvatureThreshold:0.00135,minCornerLengthMeters:48,mergeGapMeters:24,trackWidthMeters:15,visualTrackWidthSvg:28,racingLineMarginMeters:1.6,referenceBrakeDecelMps2:20,approachLeadMeters:88,apexWindowMeters:34,referenceAccelMps2:8.7,maxStraightKph:348,speedProfileIterations:7,direction:'clockwise'},
  sectors:[{id:'S1',start:0,end:0.345},{id:'S2',start:0.345,end:0.658},{id:'S3',start:0.658,end:1}],
  pit:{entry:0.925,stop:0.978,exit:0.075,speedLimitKph:80},
  speedTraps:[{id:'ST1',label:'Ocean Straight',progress:0.245},{id:'ST2',label:'North Straight',progress:0.575},{id:'FL',label:'Finish Line',progress:0.010}],
  overtakeZones:[{id:'O1',detection:0.028,start:0.055,end:0.255},{id:'O2',detection:0.488,start:0.515,end:0.675}],
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
const MAWANG_SPEED_PARK=freezeTrack({
  id:'mawang-speed-park-v1',
  name:'마왕 스피드 파크',
  archetype:'초고속 직선·시케인형',
  country:'Mawang',
  viewBox:[0,0,1000,600],
  path:'M 120 330 L 390 330 L 445 285 L 500 335 L 555 285 L 620 330 L 875 330 C 925 330 930 245 875 220 L 715 145 C 650 115 590 125 540 170 L 465 235 L 365 205 L 240 150 C 170 120 110 175 120 245 L 145 285 C 155 305 145 325 120 330 Z',
  lengthMeters:5920,
  startFinish:0,
  geometry:{sampleMeters:20,cornerCurvatureThreshold:0.00145,minCornerLengthMeters:34,mergeGapMeters:20,trackWidthMeters:14,visualTrackWidthSvg:26,racingLineMarginMeters:1.5,referenceBrakeDecelMps2:21,approachLeadMeters:92,apexWindowMeters:30,referenceAccelMps2:8.9,maxStraightKph:355,speedProfileIterations:7,direction:'clockwise'},
  sectors:[{id:'S1',start:0,end:0.34},{id:'S2',start:0.34,end:0.665},{id:'S3',start:0.665,end:1}],
  pit:{entry:0.925,stop:0.973,exit:0.055,speedLimitKph:80},
  speedTraps:[{id:'ST1',label:'Main Straight',progress:0.215},{id:'ST2',label:'Back Straight',progress:0.615},{id:'FL',label:'Finish Line',progress:0.992}],
  overtakeZones:[{id:'O1',detection:0.975,start:0.025,end:0.235},{id:'O2',detection:0.535,start:0.565,end:0.690}],
  zones:[
    {id:'M01',type:'straight',start:0.000,end:0.235,targetKph:352},
    {id:'M02',type:'slowCorner',start:0.235,end:0.285,targetKph:112},
    {id:'M03',type:'straight',start:0.285,end:0.405,targetKph:328},
    {id:'M04',type:'mediumCorner',start:0.405,end:0.485,targetKph:182},
    {id:'M05',type:'straight',start:0.485,end:0.690,targetKph:355},
    {id:'M06',type:'hairpin',start:0.690,end:0.750,targetKph:82},
    {id:'M07',type:'fastCorner',start:0.750,end:0.825,targetKph:255},
    {id:'M08',type:'straight',start:0.825,end:0.915,targetKph:330},
    {id:'M09',type:'mediumCorner',start:0.915,end:0.955,targetKph:175},
    {id:'M10',type:'straight',start:0.955,end:1.000,targetKph:340}
  ]
});
const ROYAL_STREET_CIRCUIT=freezeTrack({
  id:'royal-street-circuit-v1',
  name:'왕성 스트리트 서킷',
  archetype:'초저속·연속 코너 스트리트형',
  country:'Mawang',
  viewBox:[0,0,1000,600],
  path:'M 170 480 L 170 360 L 245 325 L 190 270 L 260 205 L 350 235 L 390 155 L 500 170 L 535 250 L 620 215 L 690 275 L 645 345 L 735 390 L 820 350 L 850 430 L 780 500 L 650 480 L 585 525 L 455 500 L 360 535 L 265 500 L 170 480 Z',
  lengthMeters:3480,
  startFinish:0,
  geometry:{sampleMeters:14,cornerCurvatureThreshold:0.0023,minCornerLengthMeters:24,mergeGapMeters:14,trackWidthMeters:10,visualTrackWidthSvg:20,racingLineMarginMeters:1.0,referenceBrakeDecelMps2:19,approachLeadMeters:55,apexWindowMeters:20,referenceAccelMps2:7.6,maxStraightKph:286,speedProfileIterations:7,direction:'clockwise'},
  sectors:[{id:'S1',start:0,end:0.325},{id:'S2',start:0.325,end:0.67},{id:'S3',start:0.67,end:1}],
  pit:{entry:0.935,stop:0.978,exit:0.065,speedLimitKph:60},
  speedTraps:[{id:'ST1',label:'Palace Straight',progress:0.175},{id:'ST2',label:'Harbour Lane',progress:0.555},{id:'FL',label:'Finish Line',progress:0.990}],
  overtakeZones:[{id:'O1',detection:0.985,start:0.025,end:0.155},{id:'O2',detection:0.510,start:0.535,end:0.610}],
  zones:[
    {id:'R01',type:'straight',start:0.000,end:0.150,targetKph:275},
    {id:'R02',type:'hairpin',start:0.150,end:0.225,targetKph:72},
    {id:'R03',type:'slowCorner',start:0.225,end:0.310,targetKph:98},
    {id:'R04',type:'mediumCorner',start:0.310,end:0.390,targetKph:145},
    {id:'R05',type:'slowCorner',start:0.390,end:0.475,targetKph:92},
    {id:'R06',type:'straight',start:0.475,end:0.610,targetKph:282},
    {id:'R07',type:'hairpin',start:0.610,end:0.690,targetKph:68},
    {id:'R08',type:'slowCorner',start:0.690,end:0.765,targetKph:105},
    {id:'R09',type:'mediumCorner',start:0.765,end:0.840,targetKph:138},
    {id:'R10',type:'slowCorner',start:0.840,end:0.915,targetKph:88},
    {id:'R11',type:'straight',start:0.915,end:1.000,targetKph:258}
  ]
});
const INFINITY_EIGHT_CIRCUIT=freezeTrack({
  id:'infinity-eight-circuit-v1',
  name:'무한 8자 서킷',
  archetype:'8자 교차·복합 코너형',
  country:'Mawang',
  viewBox:[0,0,1000,600],
  path:'M 120 300 C 150 115 350 95 500 300 C 650 505 850 485 885 300 C 850 115 650 95 500 300 C 350 505 150 485 120 300 Z',
  lengthMeters:5780,
  startFinish:0,
  geometry:{sampleMeters:18,cornerCurvatureThreshold:0.0017,minCornerLengthMeters:36,mergeGapMeters:18,trackWidthMeters:13,visualTrackWidthSvg:24,racingLineMarginMeters:1.35,referenceBrakeDecelMps2:20,approachLeadMeters:78,apexWindowMeters:28,referenceAccelMps2:8.4,maxStraightKph:332,speedProfileIterations:7,direction:'clockwise'},
  sectors:[{id:'S1',start:0,end:0.333333},{id:'S2',start:0.333333,end:0.666667},{id:'S3',start:0.666667,end:1}],
  pit:{entry:0.920,stop:0.970,exit:0.075,speedLimitKph:80},
  speedTraps:[{id:'ST1',label:'Upper Sweep',progress:0.255},{id:'ST2',label:'Lower Sweep',progress:0.705},{id:'FL',label:'Finish Line',progress:0.992}],
  overtakeZones:[{id:'O1',detection:0.015,start:0.045,end:0.180},{id:'O2',detection:0.520,start:0.550,end:0.700}],
  zones:[
    {id:'I01',type:'straight',start:0.000,end:0.120,targetKph:318},
    {id:'I02',type:'fastCorner',start:0.120,end:0.220,targetKph:258},
    {id:'I03',type:'mediumCorner',start:0.220,end:0.325,targetKph:188},
    {id:'I04',type:'fastCorner',start:0.325,end:0.425,targetKph:242},
    {id:'I05',type:'straight',start:0.425,end:0.560,targetKph:326},
    {id:'I06',type:'mediumCorner',start:0.560,end:0.670,targetKph:178},
    {id:'I07',type:'fastCorner',start:0.670,end:0.780,targetKph:250},
    {id:'I08',type:'mediumCorner',start:0.780,end:0.880,targetKph:182},
    {id:'I09',type:'straight',start:0.880,end:1.000,targetKph:330}
  ]
});
const HIGHLAND_FLOW_RING=freezeTrack({
  id:'highland-flow-ring-v1',
  name:'하이랜드 플로우 링',
  archetype:'고속 연속 코너 플로잉형',
  country:'Mawang',
  viewBox:[0,0,1000,600],
  path:'M 135 420 C 95 310 155 175 290 150 C 390 130 430 215 500 220 C 570 225 610 115 735 135 C 875 160 920 280 850 370 C 785 455 685 410 620 455 C 545 510 455 535 350 490 C 265 455 190 500 135 420 Z',
  lengthMeters:5885,
  startFinish:0,
  geometry:{sampleMeters:19,cornerCurvatureThreshold:0.0015,minCornerLengthMeters:44,mergeGapMeters:21,trackWidthMeters:14,visualTrackWidthSvg:27,racingLineMarginMeters:1.55,referenceBrakeDecelMps2:20,approachLeadMeters:85,apexWindowMeters:32,referenceAccelMps2:8.7,maxStraightKph:342,speedProfileIterations:7,direction:'clockwise'},
  sectors:[{id:'S1',start:0,end:0.338},{id:'S2',start:0.338,end:0.674},{id:'S3',start:0.674,end:1}],
  pit:{entry:0.930,stop:0.975,exit:0.070,speedLimitKph:80},
  speedTraps:[{id:'ST1',label:'North Rise',progress:0.285},{id:'ST2',label:'Valley Straight',progress:0.625},{id:'FL',label:'Finish Line',progress:0.993}],
  overtakeZones:[{id:'O1',detection:0.010,start:0.040,end:0.155},{id:'O2',detection:0.590,start:0.620,end:0.720}],
  zones:[
    {id:'H01',type:'straight',start:0.000,end:0.115,targetKph:332},
    {id:'H02',type:'fastCorner',start:0.115,end:0.225,targetKph:272},
    {id:'H03',type:'fastCorner',start:0.225,end:0.330,targetKph:248},
    {id:'H04',type:'mediumCorner',start:0.330,end:0.420,targetKph:205},
    {id:'H05',type:'fastCorner',start:0.420,end:0.535,targetKph:278},
    {id:'H06',type:'straight',start:0.535,end:0.720,targetKph:340},
    {id:'H07',type:'fastCorner',start:0.720,end:0.815,targetKph:258},
    {id:'H08',type:'mediumCorner',start:0.815,end:0.885,targetKph:198},
    {id:'H09',type:'fastCorner',start:0.885,end:0.950,targetKph:246},
    {id:'H10',type:'straight',start:0.950,end:1.000,targetKph:326}
  ]
});
const TRACKS=Object.freeze({
  [MAJOKU_RING.id]:MAJOKU_RING,
  [CASTLE_STREET_CIRCUIT.id]:CASTLE_STREET_CIRCUIT,
  [BLUE_COAST_SPEEDWAY.id]:BLUE_COAST_SPEEDWAY,
  [MAWANG_SPEED_PARK.id]:MAWANG_SPEED_PARK,
  [ROYAL_STREET_CIRCUIT.id]:ROYAL_STREET_CIRCUIT,
  [INFINITY_EIGHT_CIRCUIT.id]:INFINITY_EIGHT_CIRCUIT,
  [HIGHLAND_FLOW_RING.id]:HIGHLAND_FLOW_RING
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
  if(Array.isArray(track.overtakeZones)&&track.overtakeZones.some(zone=>!(Number(zone.detection)>=0&&Number(zone.detection)<1)))issues.push('overtake detection lines missing');
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
root.__mwsF1TrackMarkersV211='full-track-markers-v1';
root.__mwsF1TrackCatalogV220='seven-diverse-tracks-v1';
})(typeof window!=='undefined'?window:globalThis);
