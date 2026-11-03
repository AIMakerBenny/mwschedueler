// R5-b122: exact-target START -> SUCCESS versus confirmed 500ms physical
// pass. A plan/near-faster sample is not an attempt and is not a pass.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='artifacts/r5-b77-majoku/';
const read=p=>JSON.parse(fs.readFileSync(root+p,'utf8'));
const replay=read('replay.json');
assert.equal(replay.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const cases=[];
for(const pair of replay.pairs){
 const r=read('seed'+pair.seed+'-observed10.json');
 const raw=r.real20ms?.attackLedger,events=raw?.events;
 assert(r.status==='PASS'&&r.track==='majoku-ring-v1'&&r.mode==='NORMAL');
 assert.equal(r.laps,10);assert.equal(r.finishedRows.length,12);
 assert.equal(r.physics.collisionStops,0);
 assert.deepEqual(r.physics.invalid,[]);
 assert(raw&&Array.isArray(events),'No complete engine attempt ledger');
 assert.equal(raw.missingOverlap,false,'Engine event ring rolled without successful capture');
 assert(raw.probes>=2);
 const starts=events.filter(e=>e.type==='START'),successes=events.filter(e=>e.type==='SUCCESS');
 const unattributed=events.filter(e=>e.type==='UNATTRIBUTED_PASS');
 assert(Number.isInteger(raw.totalStarts)&&raw.totalStarts>=0);
 assert.equal(starts.length,raw.totalStarts,
  'The rolling engine history must contain every attempt START, or fail closed');
 const byId=new Map();
 let previousMs=-1;
 for(const e of events){
  assert(Number.isFinite(e.ms)&&e.ms>=previousMs,'Attempt events must be chronological');
  previousMs=e.ms;
  assert(typeof e.driver==='string'&&typeof e.target==='string');
  assert.notEqual(e.driver,e.target);
  if(e.type==='START'){
   assert(Number.isInteger(e.attemptId)&&e.attemptId>=1);
   assert(!byId.has(e.attemptId),'Duplicate attemptId START');
   byId.set(e.attemptId,e);
  }
  if(e.attemptId!==null)assert(Number.isInteger(e.attemptId));
 }
 const uniquePhysical=new Set(),physical= r.physics.passEvents;
 assert.equal(physical.length,r.physics.passes);
 for(const p of physical){
  const key=p.front+'|'+p.passed+'|'+Math.round(p.t*1000);
  assert(!uniquePhysical.has(key),'Duplicate confirmed physical pass');
  uniquePhysical.add(key);
 }
 const credited=new Set();
 for(const success of successes){
  const begun=byId.get(success.attemptId);
  assert(begun,'SUCCESS has no captured START');
  assert.equal(success.driver,begun.driver);
  assert.equal(success.target,begun.target);
  assert(success.ms>=begun.ms);
  assert(Number.isInteger(success.crossingMs));
  assert(success.ms-success.crossingMs>=499,
   'Confirmed pass must sustain the 500ms on-track lead');
  const key=success.driver+'|'+success.target+'|'+success.crossingMs;
  assert(uniquePhysical.has(key),'SUCCESS not linked to physical pass');
  assert(!credited.has(key),'Physical pass credited more than once');
  credited.add(key);
 }
 for(const event of unattributed){
  assert.equal(event.attemptId,null);
  assert(Number.isInteger(event.crossingMs));
  const key=event.driver+'|'+event.target+'|'+event.crossingMs;
  assert(uniquePhysical.has(key),'Unattributed event has no physical pass');
  assert(!credited.has(key),'Physical pass attributed twice');
  credited.add(key);
 }
 assert.equal(credited.size,physical.length,
  'Every physical pass must be accounted for, regardless of attack status');
 assert.equal(successes.length+unattributed.length,physical.length);
 const linkedAttemptCount=new Set(successes.map(e=>e.attemptId)).size;
 assert.equal(linkedAttemptCount,successes.length,'A single START cannot claim multiple pass successes');
 const sample={seed:pair.seed,physicalConfirmedPasses:physical.length,
  engineAttemptStarts:starts.length,exactTargetAttemptSuccesses:successes.length,
  physicallyConfirmedPassesWithoutMatchingLiveAttempt:unattributed.length,
  independentlyAccountedPhysicalPasses:credited.size,
  creditedAttemptsUnique:linkedAttemptCount===successes.length,
  startToPhysicalSuccessPercent:starts.length?successes.length/starts.length*100:null,
  startToPhysicalSuccessMeasureDefined:starts.length>0,
  readOnly:true,noSafetyClearanceInferred:true};
 cases.push(sample);
 console.log(JSON.stringify({phase:'R5-b122',status:'CASE_PASS',...sample}));
}
const result={phase:'R5-b122',status:'PASS',track:'majoku-ring-v1',seeds:[1,2],
 physicsChanged:false,realTenLapPhysicsIdentical:true,liveAiTuningAuthorized:false,
 cases,limitations:[
 'Exact-target success is not the same as any rank reorder, pit merge or sampling state',
 'Active or non-successful attempts cannot be assumed to have a safe overtaking lane',
 'Two ten-lap seeds are insufficient for overall balance certification'
 ]};
fs.writeFileSync(root+'b122-attack-attribution.json',JSON.stringify(result,null,2));
