// R5-b133: compare outcomes for first and repeated exact driver-target
// intent. Group by actual START retry flag, not approximate AI state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=p=>JSON.parse(fs.readFileSync(dir+p,'utf8'));
const repeat=read('b129-attack-pair-retries.json');
const lifecycle=read('b123-attempt-lifecycle.json');
assert.equal(repeat.status,'PASS');assert.equal(lifecycle.status,'PASS');
const term=['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED','ACTIVE_AT_RACE_FINISH'];
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 const r=repeat.cases.find(c=>c.seed===seed),l=lifecycle.cases.find(c=>c.seed===seed);
 assert(r&&l&&race.status==='PASS'&&race.track==='majoku-ring-v1');
 const ledger=race.real20ms?.attackLedger;assert(ledger&&!ledger.missingOverlap);
 const byId=new Map();
 for(const event of ledger.events){
  if(!Number.isInteger(event.attemptId))continue;
  if(!byId.has(event.attemptId))byId.set(event.attemptId,[]);
  byId.get(event.attemptId).push(event);
 }
 const count=()=>Object.fromEntries(term.map(x=>[x,0]));
 const group={first:{starts:0,outcomes:count(),blockers:0,sideBySide:0},
  repeated:{starts:0,outcomes:count(),blockers:0,sideBySide:0}};
 const firstPairIds=new Set();
 for(const event of ledger.events.filter(e=>e.type==='START')){
  const key=event.driver+'|'+event.target;
  const first=!firstPairIds.has(key);
  if(first)firstPairIds.add(key);
  assert.equal(Boolean(event.retry),!first,'START retry flag must match real driver-target order');
  const events=byId.get(event.attemptId);assert(events&&events[0].type==='START');
  const types=new Set(events.map(e=>e.type));
  const outcome=types.has('SUCCESS')?'SUCCESS':
   term.slice(1,-1).find(t=>types.has(t))||'ACTIVE_AT_RACE_FINISH';
  const g=first?group.first:group.repeated;
  g.starts++;g.outcomes[outcome]++;
  if(types.has('BLOCKED'))g.blockers++;
  if(types.has('SIDE_BY_SIDE'))g.sideBySide++;
 }
 assert.equal(group.first.starts,r.uniqueOrderedDriverTargetPairs);
 assert.equal(group.repeated.starts,r.repeatAttempts);
 assert.equal(group.first.starts+group.repeated.starts,r.attemptStarts);
 for(const outcome of term)assert.equal(group.first.outcomes[outcome]+
  group.repeated.outcomes[outcome],l.outcomes[outcome]);
 for(const g of Object.values(group)){
  assert.equal(Object.values(g.outcomes).reduce((n,x)=>n+x,0),g.starts);
  g.exactTargetSuccessPercent=g.starts?100*g.outcomes.SUCCESS/g.starts:null;
  g.disengagementPercent=g.starts?100*g.outcomes.DISENGAGED_UNCONFIRMED/g.starts:null;
  g.blockerObservedPercent=g.starts?100*g.blockers/g.starts:null;
 }
 assert.equal(group.first.blockers+group.repeated.blockers,l.attemptsWithBlockedObservation);
 assert.equal(group.first.sideBySide+group.repeated.sideBySide,l.attemptsWithSideBySideObservation);
 const result={seed,first:group.first,repeated:group.repeated,
  successDifferenceRepeatMinusFirstPercentagePoints:
   group.repeated.exactTargetSuccessPercent-group.first.exactTargetSuccessPercent,
  physicalPasses:race.physics.passes,collisionStops:race.physics.collisionStops};
 assert.equal(result.collisionStops,0);
 cases.push(result);
 console.log(JSON.stringify({phase:'R5-b133',status:'CASE_PASS',seed,
  initialStarts:group.first.starts,initialSuccess:group.first.outcomes.SUCCESS,
  retryStarts:group.repeated.starts,retrySuccess:group.repeated.outcomes.SUCCESS}));
}
const output={phase:'R5-b133',status:'PASS',track:'majoku-ring-v1',
 sourceRun:41553183438,readOnly:true,physicsChanged:false,
 safeAlternativePassingProven:false,aiTuningAuthorized:false,
 caveat:'First and repeat attempts are not randomized comparable groups; differences cannot establish causal effects of retrying.',
 cases};
fs.writeFileSync(dir+'b133-first-repeat-outcomes.json',JSON.stringify(output,null,2));
