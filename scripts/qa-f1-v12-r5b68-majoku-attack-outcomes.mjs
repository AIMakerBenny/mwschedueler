// R5-b68 - Distinguish front-runner attack opportunity sightings from
// actual 500ms-confirmed passes in Majoku Ring real ten-lap race.
// Conservatively interpret sampled AI state, never assert false overbraking.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const modes=read('artifacts/r5-b53-majoku/chase-modes.json');
assert.equal(modes.status,'PASS');assert.equal(modes.scenarios.length,2);
const cases=[];
for(const row of modes.scenarios){
 const race=read(row.realTenLapSource);
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.physics.collisionStops,0);assert.deepEqual(race.physics.invalid,[]);
 const passes=race.physics.passEvents.filter(p=>p.t<=90.02);
 assert(passes.every(p=>Number.isFinite(p.t)&&p.front!==p.passed));
 const eventKeys=new Set(passes.map(p=>[p.t,p.front,p.passed].join('|')));
 assert.equal(eventKeys.size,passes.length,'Duplicate physical pass ledger event');
 const frames=row.frames;
 assert.equal(frames.length,19);
 const sights=[];
 for(let i=0;i<frames.length-1;i++){
  const now=frames[i],next=frames[i+1],first=now.leading[0],second=now.leading[1];
  assert.equal(first.id,now.leaderId);assert.equal(second.id,now.secondId);
  const closing=second.speedKph-first.speedKph;
  const inAeroRange=now.leadGapMeters<=70&&now.leadGapMeters>0;
  const physicalPasses=passes.filter(e=>e.t>now.seconds&&e.t<=next.seconds+.02);
  const runnerUpPass=physicalPasses.some(e=>e.front===second.id&&e.passed===first.id);
  const nearTopPasses=physicalPasses.filter(e=>
   [first.id,second.id].includes(e.front)||[first.id,second.id].includes(e.passed));
  sights.push({seconds:now.seconds,endingSeconds:next.seconds,
   leaderId:first.id,secondId:second.id,
   gapMeters:now.leadGapMeters,closingSpeedDifferenceKph:closing,
   in70mAeroRange:inAeroRange,
   nearClosingOpportunity:inAeroRange&&closing>2,
   secondState:second.mode,secondAttackPlanner:second.mode==='PLAN_ATTACK',
   secondSideBySide:second.mode==='SIDE_BY_SIDE',secondFollowing:second.mode==='FOLLOW',
   secondBlocked:second.blocked>0,secondCorridorOptions:second.corridorCandidates,
   trafficLimitedAll12SincePriorSample:i===0?0:
    now.trafficLimitedCumulative-frames[i-1].trafficLimitedCumulative,
   confirmedRealPassEventsInNext5s:physicalPasses.length,
   confirmedPhysicalPassAmongStartingFirstTwo:runnerUpPass,
   nearTopPhysicalPasses:nearTopPasses.length,
   nextObservedLeaderChanged:now.leaderId!==next.leaderId});
 }
 assert.equal(sights.length,18);
 const sum={
  aeroRangeObservations:sights.filter(s=>s.in70mAeroRange).length,
  aeroRangeWithAttackPlanner:sights.filter(s=>s.in70mAeroRange&&s.secondAttackPlanner).length,
  aeroRangeWithFollow:sights.filter(s=>s.in70mAeroRange&&s.secondFollowing).length,
  aeroRangeWithBlockedOptions:sights.filter(s=>s.in70mAeroRange&&s.secondBlocked).length,
  closeAndFasterObservations:sights.filter(s=>s.nearClosingOpportunity).length,
  closeAndFasterButFollowing:sights.filter(s=>s.nearClosingOpportunity&&s.secondFollowing).length,
  closeAndFasterButNoCorridor:sights.filter(s=>s.nearClosingOpportunity&&s.secondCorridorOptions===0).length,
  physicallyConfirmedPassEventsFirst90s:passes.length,
  physicalLeaderPairPassIntervals:sights.filter(s=>s.confirmedPhysicalPassAmongStartingFirstTwo).length,
  sampledLeaderIdentityChanges:sights.filter(s=>s.nextObservedLeaderChanged).length
 };
 assert(sum.physicalLeaderPairPassIntervals<=sum.physicallyConfirmedPassEventsFirst90s);
 cases.push({seed:row.seed,scope:'actual race first 90s prior to pit',summary:sum,sights,
  note:'A closer car can be following due to valid stopping-distance protection or unavailable safe lane; cannot call overbraking without a controlled safe-lane counterfactual'});
 console.log(JSON.stringify({phase:'R5-b68',status:'CASE_PASS',seed:row.seed,
  closeAndFaster:sum.closeAndFasterObservations,
  closeAndFasterFollowing:sum.closeAndFasterButFollowing,
  physicalLeaderPairPassIntervals:sum.physicalLeaderPairPassIntervals}));
}
assert.equal(cases.length,2);
const report={phase:'R5-b68',status:'PASS',track:'majoku-ring-v1',cases,
 interpretation:'Physical overtakes are separately confirmed; ATTACK/FOLLOW samples are possible explanations, not proven faults',
 restrictions:['No rank-based or trailing-car speed boosts',
  'No bypass of active merged-lane collision reservations or swept-world guard',
  'Do not label 5-second AI snapshots as direct 20ms causes',
  'No other circuit tested or unlocked']};
const out='artifacts/r5-b53-majoku/attack-outcomes.json';
fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:report.phase,status:report.status,artifact:out}));
