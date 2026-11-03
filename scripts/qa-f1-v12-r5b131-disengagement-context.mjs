// R5-b131 - record what was OBSERVED before a cancelled attack, without
// claiming its reason or that a blocked alternative lane was safe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=x=>JSON.parse(fs.readFileSync(dir+x,'utf8'));
const replay=read('replay.json');
const lifecycle=read('b123-attempt-lifecycle.json');
const pairs=read('b129-attack-pair-retries.json');
const temporal=read('b130-temporal-cohorts.json');
for(const r of [replay,lifecycle,pairs,temporal])assert.equal(r.status,'PASS');
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const types=['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED'];
const cases=[];
for(const pair of replay.pairs){
 const race=read('seed'+pair.seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.physics.collisionStops,0);
 assert.equal(race.finishedRows.length,12);
 const events=race.real20ms?.attackLedger?.events;
 assert(Array.isArray(events));
 const p=lifecycle.cases.find(x=>x.seed===pair.seed);
 const pairAudit=pairs.cases.find(x=>x.seed===pair.seed);
 const phases=temporal.cases.find(x=>x.seed===pair.seed);
 assert(p&&pairAudit&&phases);
 const byId=new Map();
 for(const e of events){
  if(!Number.isInteger(e.attemptId))continue;
  if(!byId.has(e.attemptId))byId.set(e.attemptId,[]);
  byId.get(e.attemptId).push(e);
 }
 const cohort={};
 for(const type of [...types,'ACTIVE_AT_RACE_FINISH']){
  cohort[type]={count:0,hadReportedBlocker:0,hadSideBySide:0,
   repeatIntent:0,meanStartToLastEventSeconds:null};
 }
 const intervals=Object.fromEntries(Object.keys(cohort).map(x=>[x,[]]));
 const modes={},blockedNoSuccess=[];
 for(const sequence of byId.values()){
  const s=sequence[0];
  assert.equal(s.type,'START');
  const present=new Set(sequence.map(e=>e.type));
  const final=present.has('SUCCESS')?'SUCCESS':
   types.slice(1).find(t=>present.has(t))||'ACTIVE_AT_RACE_FINISH';
  const x=cohort[final];assert(x);
  x.count++;
  if(present.has('BLOCKED'))x.hadReportedBlocker++;
  if(present.has('SIDE_BY_SIDE'))x.hadSideBySide++;
  if(s.retry)x.repeatIntent++;
  const last=sequence.at(-1);
  assert(last.ms>=s.ms);
  intervals[final].push((last.ms-s.ms)/1000);
  if(final==='DISENGAGED_UNCONFIRMED'){
   const event=sequence.find(e=>e.type==='DISENGAGED_UNCONFIRMED');
   const mode=String(event?.mode||'UNRECORDED');
   modes[mode]=(modes[mode]||0)+1;
   if(present.has('BLOCKED')){
    blockedNoSuccess.push({driver:s.driver,target:s.target,attemptId:s.attemptId,
     startSeconds:s.ms/1000,endSeconds:event.ms/1000,mode,
     hadSideBySide:present.has('SIDE_BY_SIDE')});
   }
  }
 }
 for(const [key,x] of Object.entries(cohort)){
  const vals=intervals[key];
  x.meanStartToLastEventSeconds=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
  assert.equal(x.count,p.outcomes[key]);
  assert(x.hadReportedBlocker<=x.count);
  assert(x.hadSideBySide<=x.count);
 }
 const total=Object.values(cohort).reduce((n,x)=>n+x.count,0);
 assert.equal(total,p.attemptStarts);
 assert.equal(cohort.DISENGAGED_UNCONFIRMED.count,
  Object.values(modes).reduce((n,x)=>n+x,0));
 assert.equal(Object.values(cohort).reduce((n,x)=>n+x.hadReportedBlocker,0),
  p.attemptsWithBlockedObservation);
 assert.equal(Object.values(cohort).reduce((n,x)=>n+x.hadSideBySide,0),
  p.attemptsWithSideBySideObservation);
 assert.equal(Object.values(cohort).reduce((n,x)=>n+x.repeatIntent,0),
  pairAudit.repeatAttempts);
 assert.equal(blockedNoSuccess.length,
  cohort.DISENGAGED_UNCONFIRMED.hadReportedBlocker);
 assert.equal(phases.allAttemptStarts,total);
 const c={seed:pair.seed,attemptStarts:total,
  observedFinalStateCounts:cohort,
  disengagementRecordedModes:modes,
  disengagementWithPriorReportedBlocker:blockedNoSuccess.length,
  disengagementWithoutPriorReportedBlocker:
   cohort.DISENGAGED_UNCONFIRMED.count-blockedNoSuccess.length,
  successfulAttemptWithEarlierReportedBlocker:cohort.SUCCESS.hadReportedBlocker,
  reportedBlockerAndDisengagementExamples:blockedNoSuccess.slice(0,12),
  noCausalInferenceFromCooccurrence:true,
  noProvenAlternativeSafeLane:true};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b131',status:'CASE_PASS',seed:pair.seed,
  discontinued:cohort.DISENGAGED_UNCONFIRMED.count,
  modeCounts:modes,withBlocker:blockedNoSuccess.length,
  successfulWithEarlierBlocker:c.successfulAttemptWithEarlierReportedBlocker}));
}
const result={phase:'R5-b131',status:'PASS',track:'majoku-ring-v1',
 sourceRun:41553183438,engineChanged:false,readOnly:true,
 trafficConstraintIsNotUnnecessaryBrakeProof:true,
 safeLaneClearanceProven:false,liveAiPatchApproved:false,cases,
 conclusion:'Descriptive correlation only: observed FOLLOW discontinuations and earlier blockers do not establish whether a different lane or speed would have been physically safe'};
fs.writeFileSync(dir+'b131-disengagement-context.json',JSON.stringify(result,null,2));
