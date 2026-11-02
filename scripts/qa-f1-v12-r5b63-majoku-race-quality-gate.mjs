// R5-b63 - guard real Majoku Ring on-track race quality without
// mistaking pit/finish leaderboard permutations for competitive passes.
// Thresholds are provisional regression floors from R5-b49 seeds 1 & 2,
// not a universal gameplay balance certificate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const provenance=read('artifacts/r5-b53-majoku/leader-provenance.json');
const quality=read('artifacts/r5-b53-majoku/competition-quality.json');
const attribution=read('artifacts/r5-b53-majoku/three-arm-attribution.json');
const decision=read('artifacts/r5-b53-majoku/balance-decision.json');
for(const obj of [provenance,quality,attribution,decision])
 assert.equal(obj.status,'PASS');
assert.equal(provenance.races.length,6);assert.equal(quality.groups.length,6);
assert.equal(attribution.aggregate.completedRaces,6);
const normal=quality.groups.filter(r=>r.scenario==='NATURAL');
assert.deepEqual(normal.map(r=>r.seed),[1,2]);
const reference={run:41460159785,seed1PhysicalPasses:46,seed2PhysicalPasses:32,
 provisionalMinimumPassesEachTenLap:20,minimumDistinctPassingDrivers:5,
 minimumTwoWayDuelPairs:1,minimumEntrantsCompleted:12};
const checks=[];
const check=(name,condition,details)=>{checks.push({name,pass:Boolean(condition),details});};
for(const r of normal){
 const source=read(provenance.races.find(x=>x.seed===r.seed&&x.scenario==='NATURAL').source);
 check('seed'+r.seed+': 12 real finishers',source.finishedRows.length===12,source.finishedRows.length);
 check('seed'+r.seed+': no physical collision stops',source.physics.collisionStops===0,source.physics.collisionStops);
 check('seed'+r.seed+': no invalid physical steps',source.physics.invalid.length===0,source.physics.invalid.length);
 check('seed'+r.seed+': no teleport / continuity failure',source.continuityErrors.length===0,source.continuityErrors.length);
 check('seed'+r.seed+': genuine 500ms passes',r.physicalPasses>=reference.provisionalMinimumPassesEachTenLap,r.physicalPasses);
 check('seed'+r.seed+': diverse physical passing',r.uniquePassingDrivers>=reference.minimumDistinctPassingDrivers,r.uniquePassingDrivers);
 check('seed'+r.seed+': genuine two-way passing duel',r.twoWayDuelPairs>=reference.minimumTwoWayDuelPairs,r.twoWayDuelPairs);
 check('seed'+r.seed+': full 10 lap times',source.finishedRows.every(x=>x.lapTimesMs.length===10),source.finishedRows.map(x=>x.lapTimesMs.length));
 check('seed'+r.seed+': valid finite podium gap',Number.isFinite(r.finishGapToRunnerUpSeconds)&&r.finishGapToRunnerUpSeconds>=0,r.finishGapToRunnerUpSeconds);
 const related=provenance.races.find(x=>x.seed===r.seed&&x.scenario==='NATURAL');
 check('seed'+r.seed+': no false 22 leadership claim',related.fiveSecondLeaderChanges<=related.acceptedTotalLeaderReorders,
  {sampled:related.fiveSecondLeaderChanges,reorders:related.acceptedTotalLeaderReorders});
}
const regressionPassed=checks.every(x=>x.pass);
const outcome={phase:'R5-b63',status:regressionPassed?'PASS':'FAIL',
 track:'majoku-ring-v1',scope:'actual 12-car NORMAL 10-lap Chromium races',
 reference,checks,realRaceQualityRegressionPassed:regressionPassed,
 balancedGameCertified:false,
 tuningDecision:'HOLD_UNVERIFIED_PHYSICS_CHANGES',
 limitations:['Two deterministic initial seeds are a regression floor, not proof across every initial grid',
  'Pits, initial compounds, driver abilities and specials are real in this comparison',
  'Leader reorders alone do not establish physical leadership overtakes',
  'No additional track has been unlocked, tuned or released']};
const output='artifacts/r5-b53-majoku/race-quality-gate.json';
fs.writeFileSync(output,JSON.stringify(outcome,null,2));
console.log(JSON.stringify({phase:'R5-b63',status:outcome.status,checks:checks.length,
 failed:checks.filter(x=>!x.pass),decision:outcome.tuningDecision,artifact:output}));
assert(regressionPassed,'Majoku full race quality regressed: '+JSON.stringify(checks.filter(x=>!x.pass)));
