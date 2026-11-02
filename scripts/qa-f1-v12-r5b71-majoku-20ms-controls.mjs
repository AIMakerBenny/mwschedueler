// R5-b71: compare the original Majoku 90s real-SVG physical run with
// the EXACT same seed/mode after the read-only 20ms corridor probe.
// No physics edits, no artificial passes or release of other WIP tracks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root='artifacts/r5-b71-majoku';
fs.mkdirSync(root,{recursive:true});
const source=JSON.parse(fs.readFileSync('artifacts/r5-b59-majoku/natural.json','utf8'));
assert.equal(source.variant,'NATURAL');
assert.equal(source.sum.scenarios,4);
const target=root+'/20ms.json';
const run=spawnSync(process.execPath,
 [path.join(path.dirname(fileURLToPath(import.meta.url)),'qa-f1-v12-r5-balance.mjs')],{
  encoding:'utf8',timeout:360000,maxBuffer:4*1024*1024,
  env:{...process.env,MWS_R5_TRACK_FILTER:'majoku-ring-v1',
   MWS_R5_MODE_FILTER:'NORMAL',MWS_R5_MAJOKU_VARIANT:'NATURAL',
   MWS_R5_SEEDS:'2',MWS_R5_WINDOW_SECONDS:'90',
   MWS_R5_MAJOKU_20MS:'1',MWS_R5_REPORT_PATH:target}
 });
if(run.error||run.status!==0||!fs.existsSync(target))
 throw Error('R5-b71 20ms probe failed: '+String(run.error||run.stderr||run.stdout).slice(-4000));
const observed=JSON.parse(fs.readFileSync(target,'utf8'));
assert.equal(observed.probe20ms,true);
assert.equal(observed.variant,'NATURAL');
assert.equal(observed.results.length,2);
const comparisons=[];
for(const current of observed.results){
 const original=source.results.find(x=>x.mode==='NORMAL'&&x.seed===current.seed);
 assert(original&&current.track==='majoku-ring-v1'&&current.mode==='NORMAL');
 assert.equal(current.seconds,90);
 assert.equal(current.ticks,4500);
 assert.equal(current.physical.stops,0);
 assert.deepEqual(current.physical.invalid,[]);
 assert.deepEqual(current.physical.overlaps,[]);
 assert.deepEqual(current.physical.continuity,[]);
 // The 20ms read-only probe MUST be observationally indistinguishable
 // from the uninstrumented unified solver for the same seed and track.
 for(const field of ['confirmedPasses','rawCrossings','leaderChanges',
  'rankReorders','trafficConstrainedSteps','lastSampleGapMeters',
  'lastSampleFinalGapMeters','openingLeader','endingLeader','initialGapMeters'])
  assert.deepEqual(current[field],original[field],
   '20ms diagnostic changed '+field+' for seed '+current.seed);
 assert.deepEqual(current.order,original.order,'20ms probe changed final ranks');
 assert.deepEqual(current.sampleTrace,original.sampleTrace,'20ms probe changed physical sampled history');
 assert.deepEqual(current.trafficTimeline,original.trafficTimeline,
  '20ms probe changed accepted traffic braking history');
 const d=current.diagnostic20ms;
 assert(d&&d.frames>0);
 assert(d.attackEligible<=d.frames);
 assert.equal(d.corridorClear+d.corridorBlocked,d.attackEligible);
 assert(d.clearButFollow<=d.corridorClear);
 assert(d.clearButBrake<=d.corridorClear);
 assert(d.brakeInAttack<=d.attackEligible);
 assert(d.notYetClose<=d.attackEligible);
 assert(d.examples.every(e=>e.ms>0&&e.ms<=90000&&e.leader!==e.follower));
 comparisons.push({seed:current.seed,physicsIdentical:true,
  grid:'9m isolated fixture, not actual starting clearance',
  passes:current.confirmedPasses,leaderChanges:current.leaderChanges,
  leadGapMeters:current.lastSampleGapMeters,diagnostics:d});
 console.log(JSON.stringify({phase:'R5-b71',status:'CASE_PASS',seed:current.seed,
  physicalPasses:current.confirmedPasses,eligibleFrames:d.attackEligible,
  freeCorridorButFollowing:d.clearButFollow,
  followerBrakeWithFreeCorridor:d.clearButBrake}));
}
assert.deepEqual(comparisons.map(x=>x.seed),[0,1]);
const report={phase:'R5-b71',status:'PASS',track:'majoku-ring-v1',
 true20msFrames:9000,unchangedPhysicsProvenAcrossTwoFixtures:true,
 completeTenLap:false,comparisons,
 limits:['The original isolated fixture places cars 9m apart, unlike the live starting grid',
  'A safe-looking corridor computed after a committed step may not remain available during a real merge',
  'The AI reevaluates targets periodically rather than on every physics step',
  'This test cannot prove a race-balance improvement or unnecessary braking']};
fs.writeFileSync(root+'/controls.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:'R5-b71',status:'PASS',
 controls:comparisons.length,artifact:root+'/controls.json'}));
