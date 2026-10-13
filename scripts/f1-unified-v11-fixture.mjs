// Shared isolated-engine fixture. Pit/UI adapters are stubs; browser integration tests cover them separately.
import fs from 'node:fs';
import assert from 'node:assert/strict';
export const src=fs.readFileSync(new URL('../assets/f1-racing-v1.js',import.meta.url),'utf8');
new Function(src);
const start=src.indexOf('// Unified redesign v1.1.'),end=src.indexOf('function simulateRaceStepV192(stepMs){',start);
assert(start>0&&end>start&&src.includes('return simulateUnifiedRaceStepV11(stepMs)'));
// Reuse only the existing pure line geometry; legacy speed/cap functions are excluded.
const lineConfig=src.slice(src.indexOf('const CORNER_DYNAMICS_V343='),src.indexOf('const TYRE_DYNAMICS_V343='));
const lineGeometry=src.slice(src.indexOf('function alignedCornerDistanceV270('),src.indexOf('function idealRacingLineOffsetV270('));
export const engine=lineConfig+lineGeometry+src.slice(start,end);
export const setup=String.raw`
const raceMarkerScaleV245=z=>Math.max(.22,Math.min(1,1/Math.max(1,z)));
const window={},TRACK_PRESENTATION_V365={visualWidthScale:1},MARKER_OVERLAP_MONITOR_V377={ringRadiusSvg:18,clearanceMultiplier:1.03,maxZoom:4.5},simClockV192={paused:false,simTimeMs:0},engineQaV240={active:true};
const track={id:'circle',lengthMeters:5280,geometry:{trackWidthMeters:14,visualTrackWidthSvg:26,maxStraightKph:335}},activeRaceSnapshotV187={track,createdAt:'smoke',totalLaps:10};
const path={getTotalLength:()=>1000,getPointAtLength:n=>({x:500+(1000/(2*Math.PI))*Math.cos(n/1000*2*Math.PI),y:500+(1000/(2*Math.PI))*Math.sin(n/1000*2*Math.PI)})};
const document={getElementById:k=>k==='f1RacingRaceTrackPathV188'?path:null};
const raceMotionV189={vehicles:Array.from({length:12},(_,i)=>({id:String(i),driver:{name:'D'+i},
 driverProfile:{pace:i===11?95:75,braking:75,cornering:75,tyreManagement:75,start:75,racecraft:75,aggression:75,errorResistance:75,consistency:75},
 raceProgress:-i*9/5280,startOffset:-i*9/5280,travel:0,speedKph:0,tyreCompound:i%3===0?'SOFT':'MEDIUM',
 tyreWear:0,batteryMJ:4,finished:false,pitState:'TRACK',pitStopCount:0}))};
const hashDriverV189=str=>{let x=2166136261;for(const c of String(str))x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0;};
const raceFlagStateV214={flag:'GREEN'},raceFlagSpeedFactorV214=()=>1,syncSimulationControlsV192=()=>true;
const syncVehicleRaceMetricsV190=v=>{v.raceProgress=v.startOffset+v.travel;v.progress=((v.raceProgress%1)+1)%1;return v;};
const updatePitPreStepV205=v=>{if(v.pitState==='PIT_BOX')v.pitBoxTimerMs=Math.max(0,(v.pitBoxTimerMs||0)-20);},pitControlV205=v=>({stationary:v.pitState==='PIT_BOX',speedCapKph:v.pitState==='PIT_BOX'?0:Infinity,state:v.pitState}),
 updatePitPostStepV205=()=>{},updateLapTimingV248=()=>{},activeTrackRuntimeProfileV235=()=>({tyreStressFactor:1});
let pitCalls=0;const requestPitStopV205=()=>{pitCalls++;return false;};
const gearForSpeedV196=()=>7,rpmForSpeedAndGearV196=()=>10000,updateInteractionSnapshotShadowV368=()=>{},
 recordRaceOrderFlowV309=()=>{},updateRaceCommentaryV219=()=>{},updateRaceNarrativeV222=()=>{},updateRaceLifecycleRecoveryG=()=>false;
const specialStateV401={cinematic:false,lastMs:-Infinity},specialStageV401=()=>null,specialPhraseV401=()=>({}),playSpecialV401=()=>{};
const lineOffsetMetersV197=()=>-4.5;
const getCornerPhaseAtProgressV194=()=>({phase:'STRAIGHT',corner:null});
`;
