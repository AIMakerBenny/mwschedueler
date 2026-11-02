// R5-b59: one-circuit real-SVG accepted-step matched screening.
// Three browser-only variants x two modes x two seeds, 90s each.
// The genuine 10-lap Chromium race remains the final balance evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const dir='artifacts/r5-b59-majoku';
fs.mkdirSync(dir,{recursive:true});
const variants=['NATURAL','EQUAL_PACE_75','BALANCED_STRATEGY'];
const results=new Map();
for(const [index,variant] of variants.entries()){
 const file=dir+'/'+variant.toLowerCase()+'.json';
 const run=spawnSync(process.execPath,[path.join(here,'qa-f1-v12-r5-balance.mjs')],{
  env:{...process.env,MWS_R5_TRACK_FILTER:'majoku-ring-v1',MWS_R5_SEEDS:'2',
   MWS_R5_WINDOW_SECONDS:'90',MWS_R5_STOP_AT_LAP_LIMIT:'0',
   MWS_R5_MAJOKU_VARIANT:variant,MWS_R5_REPORT_PATH:file},
  encoding:'utf8',timeout:360000,maxBuffer:3*1024*1024
 });
 if(run.stdout)for(const line of run.stdout.trim().split('\n').slice(-6))
  if(line.includes('"status":"PASS"')||line.includes('"track":"majoku-ring-v1"'))console.log(line);
 if(run.error||run.status!==0||!fs.existsSync(file))
  throw Error('Majoku 90s physics '+variant+' failed '+String(run.error||run.stderr||run.stdout).slice(-4000));
 const data=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(data.variant,variant);
 assert.equal(data.sum.observationOnly,true);
 assert.equal(data.sum.scenarios,4);
 assert.equal(data.results?.length,4);
 assert(data.results.every(r=>r.track==='majoku-ring-v1'&&r.variant===variant));
 assert.deepEqual(data.results.map(x=>x.mode+'|'+x.seed).sort(),
  ['FAST|0','FAST|1','NORMAL|0','NORMAL|1']);
 for(const r of data.results){
  assert.equal(r.physical.stops,0);
  assert.deepEqual(r.physical.invalid,[]);
  assert.deepEqual(r.physical.overlaps,[]);
  assert.deepEqual(r.physical.continuity,[]);
  assert.equal(r.ticks,4500);
  assert(r.confirmedPasses<=r.rawCrossings);
  assert.equal(r.sampleTrace.length,18,'90s accepted interval must include 18 five-second samples');
  assert(r.sampleTrace.every(s=>s.vehicles?.length===12));
 }
 results.set(variant,data);
 console.log(JSON.stringify({phase:'R5-b59',status:'VARIANT_PASS',variant,
  races:data.results.length,confirmedPhysicalPasses:data.sum.totalPasses,
  leaderChanges:data.sum.totalLeaderChanges,largeGaps:data.sum.largeLeadScenarios}));
}
const lookup=(v,mode,seed)=>results.get(v).results.find(x=>x.mode===mode&&x.seed===seed);
const pairs=[];
for(const mode of ['FAST','NORMAL'])for(const seed of [0,1]){
 const natural=lookup('NATURAL',mode,seed),equal=lookup('EQUAL_PACE_75',mode,seed),
  strategy=lookup('BALANCED_STRATEGY',mode,seed);
 assert(natural&&equal&&strategy,'Matched race setup missing');
 for(const r of [natural,equal,strategy]){
  assert.equal(r.mode,mode);assert.equal(r.seed,seed);
  assert.equal(r.laps,mode==='FAST'?3:10);
  assert.equal(r.initialGapMeters,natural.initialGapMeters);
  assert.equal(r.openingLeader,natural.openingLeader);
  assert.equal(r.sampleTrace[0].vehicles.length,12);
 }
 assert(equal.sampleTrace.every(s=>s.vehicles.every(v=>v.pace===75)));
 assert(strategy.sampleTrace.every(s=>s.vehicles.every(v=>v.style==='BALANCED')));
 // Seed 0 is a strict unmodified pace control; both arms must reproduce
 // exactly because every generated driver already has pace 75.
 if(seed===0){
  assert.equal(equal.confirmedPasses,natural.confirmedPasses,
   'Equal-pace no-op unexpectedly changes real physical overtakes');
  assert.equal(equal.lastSampleGapMeters,natural.lastSampleGapMeters,
   'Equal-pace no-op unexpectedly changes accepted physical leader gap');
 }
 pairs.push({mode,seed,track:'majoku-ring-v1',windowSeconds:90,
  natural:{gapMeters:natural.lastSampleGapMeters,passes:natural.confirmedPasses,
   leadChanges:natural.leaderChanges},
  equalPace:{gapMeters:equal.lastSampleGapMeters,passes:equal.confirmedPasses,
   leadChanges:equal.leaderChanges},
  equalStrategy:{gapMeters:strategy.lastSampleGapMeters,passes:strategy.confirmedPasses,
   leadChanges:strategy.leaderChanges}});
}
const summary={phase:'R5-b59',status:'PASS',track:'majoku-ring-v1',
 realPhysics:true,completeRace:false,pitLifecycle:'stubbed',
 evidence:'12 accepted 90s real-SVG scenario runs only',
 variants,matchedConditions:pairs.length,pairs,
 notes:['This source is not a natural starting grid or a finished 10-lap race',
  'Seed 1 is purposefully stronger on pole, seed 0 equal pace',
  'Do not treat gap changes alone as a fun or fairness verdict']};
const output=dir+'/summary.json';
fs.writeFileSync(output,JSON.stringify(summary,null,2));
console.log(JSON.stringify({phase:'R5-b59',status:'PASS',matchedConditions:pairs.length,
 scenarios:12,artifact:output}));
