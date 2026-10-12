// Run with: node scripts/qa-f1-unified-v11-smoke.mjs
// Synthetic physics smoke only. This does not inspect Chromium visual overlaps.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../assets/f1-racing-v1.js',import.meta.url),'utf8');
new Function(src);
const start=src.indexOf('// Unified redesign v1.1.'),end=src.indexOf('function simulateRaceStepV192(stepMs){',start);
assert(start>0&&end>start&&src.includes('return simulateUnifiedRaceStepV11(stepMs)'));
const engine=src.slice(start,end);
function trial(reverse=false,iterations=6000){
const setup=String.raw`
const window={},TRACK_PRESENTATION_V365={visualWidthScale:1},MARKER_OVERLAP_MONITOR_V377={ringRadiusSvg:18,clearanceMultiplier:1.03},simClockV192={paused:false,simTimeMs:0},engineQaV240={active:true};
const track={id:'circle',lengthMeters:5280,geometry:{trackWidthMeters:14,visualTrackWidthSvg:26,maxStraightKph:335}},activeRaceSnapshotV187={track,createdAt:'smoke',totalLaps:10};
const path={getTotalLength:()=>1000,getPointAtLength:n=>({x:500+160*Math.cos(n/1000*2*Math.PI),y:500+160*Math.sin(n/1000*2*Math.PI)})};
const document={getElementById:k=>k==='f1RacingRaceTrackPathV188'?path:null};
const raceMotionV189={vehicles:Array.from({length:12},(_,i)=>({id:String(i),driver:{name:'D'+i},
 driverProfile:{pace:i===11?95:75,braking:75,cornering:75,tyreManagement:75,start:75,racecraft:75,aggression:75,errorResistance:75,consistency:75},
 raceProgress:-i*9/5280,startOffset:-i*9/5280,travel:0,speedKph:0,tyreCompound:i%3===0?'SOFT':'MEDIUM',
 tyreWear:0,batteryMJ:4,finished:false,pitState:'TRACK',pitStopCount:0}))};
const hashDriverV189=str=>{let x=2166136261;for(const c of String(str))x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0;};
const raceFlagStateV214={flag:'GREEN'},raceFlagSpeedFactorV214=()=>1,syncSimulationControlsV192=()=>true;
const syncVehicleRaceMetricsV190=v=>{v.raceProgress=v.startOffset+v.travel;v.progress=((v.raceProgress%1)+1)%1;return v;};
const updatePitPreStepV205=()=>({stationary:false}),pitControlV205=()=>({stationary:false,speedCapKph:Infinity,state:'TRACK'}),
 updatePitPostStepV205=()=>{},updateLapTimingV248=()=>{},activeTrackRuntimeProfileV235=()=>({tyreStressFactor:1});
let pitCalls=0;const requestPitStopV205=()=>{pitCalls++;return false;};
const gearForSpeedV196=()=>7,rpmForSpeedAndGearV196=()=>10000,updateInteractionSnapshotShadowV368=()=>{},
 recordRaceOrderFlowV309=()=>{},updateRaceCommentaryV219=()=>{},updateRaceNarrativeV222=()=>{},updateRaceLifecycleRecoveryG=()=>false;
const specialStateV401={cinematic:false,lastMs:-Infinity},specialStageV401=()=>null,specialPhraseV401=()=>({}),playSpecialV401=()=>{};
const getCornerPhaseAtProgressV194=()=>({phase:'STRAIGHT',corner:null});
`;
const execute=String.raw`
if(REVERSE)raceMotionV189.vehicles.reverse();
let ticks=0;for(let i=0;i<ITERATIONS;i++){if(!simulateUnifiedRaceStepV11(20))break;ticks++;}
const v=raceMotionV189.vehicles.find(item=>item.id==='0');v.tyreWear=.60;v.unifiedPitEvalAtV11=0;
unifiedPitV11(unifiedSnapshotV11().find(row=>row.id===String(v.id)),simClockV192.simTimeMs/1000,track);
return {ticks,errors:unifiedStateV11.telemetry.invalid,passes:unifiedStateV11.telemetry.passes.length,pitCalls,
 states:raceMotionV189.vehicles.map(v=>({id:v.id,s:v.raceProgress,y:v.unifiedYV11,v:v.speedKph,e:v.batteryMJ,w:v.tyreWear}))
  .sort((a,b)=>a.id.localeCompare(b.id))};
`.replace('REVERSE',String(reverse)).replace('ITERATIONS',String(iterations));
return new Function(setup+engine+execute)();
}
const a=trial(false),b=trial(true);
assert.equal(a.ticks,6000);assert.equal(b.ticks,6000);assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
assert.deepEqual(a.states,b.states,'Vehicle input order affected physical state');assert.equal(a.pitCalls,0);
const long=trial(false,24000);
assert.equal(long.ticks,24000);assert.deepEqual(long.errors,[]);assert(long.passes>0);
for(const v of long.states){assert(v.e>=0&&v.e<=4);assert(v.w>=0&&v.w<=1);assert([v.s,v.y,v.v].every(Number.isFinite));}
console.log(JSON.stringify({result:'PASS',syntheticSeconds:480,cars:12,passes:long.passes,
 warning:'Not Chromium or a real-circuit balance/overlap verification'},null,2));
