// R5-b135: empirical outcomes of the NEXT attempt at the SAME driver-target
// after a previous attempt. No rule is proposed or retroactive pass credited.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const initial=read('b133-first-repeat-outcomes.json');
const durations=read('b134-repeat-gap-sequences.json');
const pairs=read('b129-attack-pair-retries.json');
for(const x of [initial,durations,pairs])assert.equal(x.status,'PASS');
const outcomes=['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED','ACTIVE_AT_RACE_FINISH'];
const groupNames=['atMost1s','over1to2s','over2to5s','over5s'];
const empty=()=>({attempts:0,outcomes:Object.fromEntries(outcomes.map(x=>[x,0])),
 prevOutcome:Object.fromEntries(outcomes.map(x=>[x,0])),
 matchedPhysicalSuccessPercent:null,prevDisengagementWithoutNewSuccess:0});
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');assert.equal(race.physics.collisionStops,0);
 const r=durations.cases.find(c=>c.seed===seed);
 const p=pairs.cases.find(c=>c.seed===seed);
 const f=initial.cases.find(c=>c.seed===seed);
 assert(r&&p&&f);
 const ledger=race.real20ms.attackLedger;
 const byId=new Map(),byPair=new Map();
 for(const event of ledger.events){
  if(!Number.isInteger(event.attemptId))continue;
  if(!byId.has(event.attemptId))byId.set(event.attemptId,[]);
  byId.get(event.attemptId).push(event);
 }
 for(const s of ledger.events.filter(e=>e.type==='START')){
  const ev=byId.get(s.attemptId);assert(ev?.length&&ev[0].type==='START');
  const kinds=new Set(ev.map(x=>x.type));
  const outcome=kinds.has('SUCCESS')?'SUCCESS':
   outcomes.slice(1,-1).find(x=>kinds.has(x))||'ACTIVE_AT_RACE_FINISH';
  const key=s.driver+'|'+s.target;
  if(!byPair.has(key))byPair.set(key,[]);
  byPair.get(key).push({start:s.ms,end:ev.at(-1).ms,outcome,id:s.attemptId});
 }
 const groups=Object.fromEntries(groupNames.map(n=>[n,empty()]));
 const transitions=Object.fromEntries(outcomes.map(n=>[n,Object.fromEntries(outcomes.map(m=>[m,0]))]));
 for(const seq of byPair.values()){
  for(let i=1;i<seq.length;i++){
   const prev=seq[i-1],cur=seq[i];
   assert(cur.start>=prev.end);
   const gap=cur.start-prev.end;
   const name=gap<=1000?'atMost1s':gap<=2000?'over1to2s':gap<=5000?'over2to5s':'over5s';
   const g=groups[name];
   g.attempts++;g.outcomes[cur.outcome]++;g.prevOutcome[prev.outcome]++;
   transitions[prev.outcome][cur.outcome]++;
   if(prev.outcome==='DISENGAGED_UNCONFIRMED'&&cur.outcome!=='SUCCESS')
    g.prevDisengagementWithoutNewSuccess++;
  }
 }
 const sum=field=>Object.values(groups).reduce((n,x)=>n+x[field],0);
 assert.equal(sum('attempts'),p.repeatAttempts);
 assert.equal(sum('attempts'),f.repeated.starts);
 for(const o of outcomes){
  assert.equal(Object.values(groups).reduce((n,x)=>n+x.outcomes[o],0),
   f.repeated.outcomes[o]);
 }
 assert.equal(groups.atMost1s.attempts,r.shortGapCounts.within1s);
 assert.equal(groups.atMost1s.attempts+groups.over1to2s.attempts,
  r.shortGapCounts.within2s);
 assert.equal(groups.atMost1s.attempts+groups.over1to2s.attempts+
  groups.over2to5s.attempts,r.shortGapCounts.within5s);
 for(const g of Object.values(groups)){
  assert.equal(Object.values(g.outcomes).reduce((n,x)=>n+x,0),g.attempts);
  g.matchedPhysicalSuccessPercent=g.attempts?100*g.outcomes.SUCCESS/g.attempts:null;
 }
 assert.equal(Object.values(transitions).reduce((n,m)=>n+
  Object.values(m).reduce((v,x)=>v+x,0),0),p.repeatAttempts);
 const out={seed,repeatAttempts:p.repeatAttempts,
  gapBasedNextAttemptGroups:groups,previousToNextAttemptOutcomeCounts:transitions,
  nextSuccessesAfterAtMost1Second:groups.atMost1s.outcomes.SUCCESS,
  nextFailuresOrInterruptionsAfterAtMost1Second:
    groups.atMost1s.attempts-groups.atMost1s.outcomes.SUCCESS,
  shortRepeatAfterDisengagement:
    groups.atMost1s.prevOutcome.DISENGAGED_UNCONFIRMED,
  physicalPasses:race.physics.passes,collisionStops:0,
  noCausalPenaltyOrBoostInferred:true};
 cases.push(out);
 console.log(JSON.stringify({phase:'R5-b135',status:'CASE_PASS',seed,
  oneSecondRepeats:groups.atMost1s.attempts,
  oneSecondRepeatPasses:groups.atMost1s.outcomes.SUCCESS,
  afterDisengagement:out.shortRepeatAfterDisengagement}));
}
const result={phase:'R5-b135',status:'PASS',track:'majoku-ring-v1',
 sourceRun:41553183438,readOnly:true,aiTuningApproved:false,
 sourceFixedSeeds:2,safeCorridorProven:false,physicsModified:false,
 note:'Success rate after a shorter re-engagement interval is an observational association, not proof that delaying AI attempts will improve finishes or preserve physical safety.',
 cases};
fs.writeFileSync(dir+'b135-retry-transition-matrix.json',JSON.stringify(result,null,2));
