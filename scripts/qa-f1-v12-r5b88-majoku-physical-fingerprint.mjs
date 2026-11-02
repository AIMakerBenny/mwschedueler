// R5-b88: independent field-by-field and SHA-256 equality for authentic Majoku
// seed-matched unprobed/probed 12-car NORMAL 10-lap race outcomes.
// Hashes contain no observer fields, and do not infer merge clearance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const dir='artifacts/r5-b77-majoku/';
const base=read('artifacts/r5-b49-majoku/summary.json');
const replay=read(dir+'replay.json');
assert.equal(base.status,'PASS');assert.equal(replay.status,'PASS');
assert.equal(replay.track,'majoku-ring-v1');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const keys=[
 'seededIso','setupCreatedAt','profileScenario','initialOrder',
 'startingCompounds','originalProfiles','appliedProfiles',
 'originalStrategies','appliedStrategies','finishedRows','finishEvents',
 'pitRequests','pitTransitions','finishBoundary','physics',
 'acceptedCompetition','samples','strategySummary','screenTransitions',
 'tickCount','simulatedSeconds','view','pitPlanViolations'
];
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':
 x!==null&&typeof x==='object'?
 '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':
 JSON.stringify(x);
const sha=x=>createHash('sha256').update(stable(x)).digest('hex');
const cases=[];
for(const pair of replay.pairs){
 const baselineCase=base.cases.find(c=>c.seed===pair.seed);
 assert(baselineCase&&baselineCase.finishers===12);
 const unprobed=read(pair.originalFile),observed=read(pair.observedFile);
 assert.equal(unprobed.status,'PASS');assert.equal(observed.status,'PASS');
 for(const r of [unprobed,observed]){
  assert.equal(r.track,'majoku-ring-v1');
  assert.equal(r.mode,'NORMAL');assert.equal(r.laps,10);
  assert.equal(r.seedId,String(pair.seed));
  assert.equal(r.profileScenario,'NATURAL');
  assert.equal(r.finishedRows.length,12);
  assert(r.finishedRows.every(v=>v.finishMs>0&&v.lapTimesMs.length===10));
  assert.equal(r.physics.collisionStops,0);
  assert.deepEqual(r.physics.invalid,[]);
  assert.deepEqual(r.continuityErrors,[]);
  assert.deepEqual(r.pageErrors,[]);
 }
 assert.equal(unprobed.real20ms??null,null);
 assert.equal(observed.real20ms?.acceptedFrames,4500);
 assert.equal(observed.physics.passes,baselineCase.passes);
 assert.equal(observed.finishedRows.reduce((n,r)=>n+r.pits,0),
  baselineCase.completedPitStops);
 const fieldHashes={};
 for(const key of keys){
  assert.deepEqual(observed[key],unprobed[key],
   '20ms probe changed physical race outcome: '+key+' seed '+pair.seed);
  const before=sha(unprobed[key]),after=sha(observed[key]);
  assert.equal(after,before,'Deterministic content changed: '+key);
  fieldHashes[key]=before;
 }
 const fingerprint=sha(keys.map(k=>[k,unprobed[k]]));
 assert.equal(fingerprint,sha(keys.map(k=>[k,observed[k]])));
 assert(pair.physicsIdentical&&pair.finishIdentical&&pair.pitsIdentical);
 cases.push({seed:pair.seed,sourceWithoutProbe:pair.originalFile,
  sourceWithProbe:pair.observedFile,sha256:fingerprint,fieldHashes,
  finishers:observed.finishedRows.length,passes:observed.physics.passes,
  stops:baselineCase.completedPitStops,collisionStops:0,
  identicalOutcomes:true});
 console.log(JSON.stringify({phase:'R5-b88',status:'CASE_PASS',seed:pair.seed,
  fingerprint,passes:observed.physics.passes}));
}
const result={phase:'R5-b88',status:'PASS',track:'majoku-ring-v1',
 fullRealTenLapRaces:2,sha256CanonicalJson:true,
 observed20msFramesPerSeed:4500,readOnly:true,physicalOutcomesIdentical:true,
 cases,safetyClearanceProven:false,aiPatchAuthorized:false};
fs.writeFileSync(dir+'b88-physical-fingerprints.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b88',status:'PASS',
 artifact:dir+'b88-physical-fingerprints.json'}));
