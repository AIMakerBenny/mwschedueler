// R5-b77 - replay TWO GENUINE 12-car, 10-lap Majoku races with an
// observational 20ms front-pair probe. Compare with historical unprobed
// seed-matched real-game results. Do not replace these with synthetic grids.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const dir='artifacts/r5-b77-majoku';
fs.mkdirSync(dir,{recursive:true});
const base=JSON.parse(fs.readFileSync('artifacts/r5-b49-majoku/summary.json','utf8'));
assert.equal(base.status,'PASS');
assert.deepEqual(base.cases.map(c=>c.seed),[1,2]);
const pairs=[];
for(const [index,original] of base.cases.entries()){
 const seed=original.seed,output=dir+'/seed'+seed+'-observed10.json';
 const run=spawnSync(process.execPath,[path.join(here,'qa-f1-v12-r5b3-normal-auto-pit.mjs')],{
  encoding:'utf8',timeout:360000,maxBuffer:5*1024*1024,
  env:{...process.env,MWS_R5B3_TRACK:'majoku-ring-v1',MWS_R5B3_SEED:String(seed),
   MWS_R5B3_PROFILE_SCENARIO:'NATURAL',
   MWS_R5B3_REAL_20MS_PROBE:'1',MWS_R5B3_PORT:String(8990+index),
   MWS_R5B3_OUTPUT:output}
 });
 if(run.error||run.status!==0||!fs.existsSync(output))
  throw Error('Real-grid 20ms Majoku seed '+seed+' failed: '+
   String(run.error||run.stderr||run.stdout).slice(-4000));
 const before=JSON.parse(fs.readFileSync(original.outcomeFile,'utf8')),
  after=JSON.parse(fs.readFileSync(output,'utf8'));
 assert.equal(before.status,'PASS');assert.equal(after.status,'PASS');
 assert.equal(before.track,'majoku-ring-v1');assert.equal(after.track,'majoku-ring-v1');
 assert.equal(after.mode,'NORMAL');assert.equal(after.laps,10);
 assert.equal(after.seedId,String(seed));assert.equal(after.state,'FINISHING');
 assert.equal(before.real20ms??null,null);
 assert(after.real20ms&&after.real20ms.acceptedFrames>=4500);
 assert.equal(after.finishedRows.length,12);
 assert(after.finishedRows.every(r=>r.lapTimesMs.length===10));
 assert.equal(after.physics.collisionStops,0);
 assert.deepEqual(after.physics.invalid,[]);
 assert.deepEqual(after.continuityErrors,[]);
 assert.deepEqual(after.pageErrors,[]);
 const requiredEqual=[
  'seededIso','setupCreatedAt','profileScenario',
  'initialOrder','startingCompounds','originalProfiles','appliedProfiles',
  'originalStrategies','appliedStrategies','finishedRows',
  'finishEvents','pitRequests','pitTransitions','finishBoundary',
  'physics','acceptedCompetition','samples','strategySummary',
  'screenTransitions','tickCount','simulatedSeconds','view','pitPlanViolations'];
 for(const key of requiredEqual)
  assert.deepEqual(after[key],before[key],
   '20ms observation must not change genuine 10-lap outcome '+key+' seed '+seed);
 const p=after.real20ms;
 assert(p.closeFasterFrames<=p.frontFrames&&p.frontFrames<=p.acceptedFrames);
 assert(p.followCloseFaster<=p.closeFasterFrames);
 assert(p.planAttackCloseFaster<=p.closeFasterFrames);
 assert(p.corridorCandidateFrames<=p.closeFasterFrames);
 assert(p.streak400ms<=p.followCloseFaster);
 assert(p.examples.length<=80);
 assert(p.firstGridGap>0);
 pairs.push({seed,actualRealGrid:true,fullTenLap:true,
  originalFile:original.outcomeFile,observedFile:output,
  physicsIdentical:true,finishIdentical:true,pitsIdentical:true,
  trueOpeningGapMeters:p.firstGridGap,
  first90EndGapMeters:p.first90EndGap,
  accepted20msFrames:p.acceptedFrames,
  nearFasterFrames:p.closeFasterFrames,
  followingNearFaster:p.followCloseFaster,
  attackPlanningNearFaster:p.planAttackCloseFaster,
  persistent400msFollow:p.streak400ms,
  offeredCorridorCandidateFrames:p.corridorCandidateFrames,
  mergeBlockedFrames:p.blockedFrames,
  examples:p.examples});
 console.log(JSON.stringify({phase:'R5-b77',status:'CASE_PASS',seed,
  realGridGap:p.firstGridGap,nearFaster:p.closeFasterFrames,
  prolongedFollow:p.streak400ms,
  physicsPasses:after.physics.passes}));
}
assert.equal(pairs.length,2);
const summary={phase:'R5-b77',status:'PASS',track:'majoku-ring-v1',
 fullTenLapRaces:2,entrants:12,laps:10,comparison:'same seeded real-game race with read-only 20ms probe',
 authenticPhysicsUnchanged:true,pairs,
 limitations:['Only seed 1 and seed 2 have been replayed',
  'Available corridor count is not a proof of a safe 20ms merge',
  'Observation limited to first 90s; all 10 laps still complete normally',
  'Do not automatically tune speed, rank, collision or any WIP track']};
fs.writeFileSync(dir+'/replay.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify({phase:'R5-b77',status:'PASS',races:pairs.length,
 artifact:dir+'/replay.json'}));
