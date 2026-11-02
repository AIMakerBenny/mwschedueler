// R5-b75: Compare isolated Majoku physical 20ms observations across
// 9m and approximately 86m grid spacing. Not a full 10-lap real-grid test.
// Physics, collisions, rankings and all six locked tracks remain untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const dir='artifacts/r5-b75-majoku';
fs.mkdirSync(dir,{recursive:true});
const base=JSON.parse(fs.readFileSync('artifacts/r5-b71-majoku/controls.json','utf8'));
assert.equal(base.status,'PASS');
assert.equal(base.unchangedPhysicsProvenAcrossTwoFixtures,true);
assert.deepEqual(base.comparisons.map(x=>x.seed),[0,1]);
const output=dir+'/grid86.json';
const runner=path.join(path.dirname(fileURLToPath(import.meta.url)),
 'qa-f1-v12-r5-balance.mjs');
const run=spawnSync(process.execPath,[runner],{
 encoding:'utf8',timeout:360000,maxBuffer:4*1024*1024,
 env:{...process.env,
  MWS_R5_TRACK_FILTER:'majoku-ring-v1',MWS_R5_MODE_FILTER:'NORMAL',
  MWS_R5_MAJOKU_VARIANT:'NATURAL',MWS_R5_MAJOKU_20MS:'1',
  MWS_R5_SEEDS:'2',MWS_R5_WINDOW_SECONDS:'90',
  MWS_R5_GRID_GAP_METERS:'86',MWS_R5_REPORT_PATH:output}
});
if(run.error||run.status!==0||!fs.existsSync(output))
 throw Error('Majoku grid86 run failed: '+
  String(run.error||run.stderr||run.stdout).slice(-4000));
const data=JSON.parse(fs.readFileSync(output,'utf8'));
assert.equal(data.variant,'NATURAL');
assert.equal(data.probe20ms,true);
assert.equal(data.gridGapMeters,86);
assert.equal(data.results.length,2);
const cases=[];
for(const race of data.results){
 const control=base.comparisons.find(x=>x.seed===race.seed);
 assert(control);
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.gridGapMeters,86);assert.equal(race.seconds,90);
 assert.equal(race.ticks,4500);
 assert.equal(race.physical.stops,0);
 assert.deepEqual(race.physical.invalid,[]);
 assert.deepEqual(race.physical.overlaps,[]);
 assert.deepEqual(race.physical.continuity,[]);
 const d=race.diagnostic20ms;
 assert(d&&d.frames<=4500&&d.attackEligible<=d.frames);
 assert.equal(d.corridorClear+d.corridorBlocked,d.attackEligible);
 assert(d.closeFastClearFollow<=d.clearButFollow);
 assert(d.closeFastClearBrake<=d.clearButBrake);
 assert(d.stableFollowRuns400ms<=d.closeFastClearFollow);
 assert(d.longestCloseFastFollowFrames<=d.closeFastClearFollow);
 assert(d.examples.every(e=>e.nextDecisionInMs>=0&&
  Number.isFinite(e.nextDecisionInMs)));
 const nine=control.diagnostics;
 const delta={
  passes:race.confirmedPasses-control.passes,
  finalGapMeters:race.lastSampleGapMeters-control.leadGapMeters,
  brakeWithClearCorridor:d.clearButBrake-nine.clearButBrake,
  prolongedCloseFastFollowing:d.stableFollowRuns400ms-nine.stableFollowRuns400ms
 };
 cases.push({seed:race.seed,initialSpacingMeters:[9,86],
  originalNineMeter:{passes:control.passes,gap:control.leadGapMeters,
   diagnostic:nine},
  comparedEightySixMeter:{passes:race.confirmedPasses,
   gap:race.lastSampleGapMeters,diagnostic:d},
  delta,collisionFree:true});
 console.log(JSON.stringify({phase:'R5-b75',status:'CASE_PASS',seed:race.seed,delta}));
}
assert.deepEqual(cases.map(x=>x.seed),[0,1]);
const result={phase:'R5-b75',status:'PASS',track:'majoku-ring-v1',
 windows:4,eachWindowSeconds:90,realTenLapRace:false,
 driverRatings:'same artificial fixture profiles',pit:'stubbed',
 physicsModified:false,cases,
 liveAiChangeAuthorized:false,
 limitations:['The measured actual-grid first step was about 86.16m, not exactly 86m',
  'Changing artificial grid does not reproduce authentic driver ratings or pit lifecycle',
  'An attack corridor candidate does not prove physically unnecessary braking',
  'This experiment does not certify actual ten-lap gameplay balance']};
fs.writeFileSync(dir+'/comparison.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b75',status:'PASS',
 artifact:dir+'/comparison.json'}));
