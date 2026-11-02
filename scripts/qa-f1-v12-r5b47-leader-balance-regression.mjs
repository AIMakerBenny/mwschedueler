// R5-b47 - fail CI if the verified R5-b43 fixed-seed competitive profile
// worsens while retaining the R5-b39 physical safety contract.
// These are 90-second tests with pit stubs; not full ten-lap balance claims.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const raw=JSON.parse(fs.readFileSync('artifacts/f1-v12-r5-balance.json','utf8'));
const gap=JSON.parse(fs.readFileSync('artifacts/f1-v12-r5b46-lead-gap-causes.json','utf8'));
assert.equal(raw.results?.length,28,'Need all 28 accepted SVG race windows');
assert.equal(raw.sum?.observationOnly,true,'Cannot substitute fake visual finishes');
assert.equal(gap.status,'PASS','R5-b46 observed gap attribution must pass');
const situations=raw.results;
const keys=new Set(situations.map(r=>r.track+'|'+r.mode+'|'+r.seed));
assert.equal(keys.size,28,'Missing or duplicated fixed-seed circuit conditions');
for(const r of situations){
 assert([0,1].includes(r.seed)&&['FAST','NORMAL'].includes(r.mode));
 assert(r.sampleTrace?.length>=12,'Missing accepted 5-second replay history');
 assert.equal(r.physical?.stops,0,'Real physics collision stop');
 assert.deepEqual(r.physical?.invalid,[],'Invalid solver state');
 assert.deepEqual(r.physical?.overlaps,[],'Physical chassis overlap');
 assert.deepEqual(r.physical?.continuity,[],'Position teleport or nonphysical movement');
 assert(Number.isFinite(r.confirmedPasses)&&r.confirmedPasses>0,
  'Real overtakes completely disappeared in '+r.track+' '+r.mode+' seed'+r.seed);
}
const statistics={
 scenarios:situations.length,
 confirmedPasses:situations.reduce((s,r)=>s+r.confirmedPasses,0),
 leaderChanges:situations.reduce((s,r)=>s+r.leaderChanges,0),
 scenariosWithLeadChanges:situations.filter(r=>r.leaderChanges>0).length,
 openingLeaderHeld:situations.filter(r=>r.openingLeader===r.endingLeader).length,
 gapsOver100Meters:situations.filter(r=>r.lastSampleGapMeters>100).length,
 bySeed:Object.fromEntries([0,1].map(seed=>{
  const cases=situations.filter(r=>r.seed===seed);
  return [seed,{cases:cases.length,confirmedPasses:cases.reduce((s,r)=>s+r.confirmedPasses,0),
   leaderChanges:cases.reduce((s,r)=>s+r.leaderChanges,0),
   gapsOver100Meters:cases.filter(r=>r.lastSampleGapMeters>100).length}];
 }))
};
assert.equal(statistics.confirmedPasses,raw.sum.totalPasses,'Actual pass count mismatch');
assert.equal(statistics.leaderChanges,raw.sum.totalLeaderChanges,'Actual leader change count mismatch');
assert.equal(statistics.gapsOver100Meters,gap.totals.over100,'R5-b46 gap report inconsistent');
assert.equal(statistics.bySeed[0].gapsOver100Meters,gap.bySeed[0].over100);
assert.equal(statistics.bySeed[1].gapsOver100Meters,gap.bySeed[1].over100);
// Evidence: the last fully green R5-b43 run 41447728733 showed 423 physical
// passes, 43 lead changes, 10 lead-change scenarios, 22 retained poles, and
// 17 large leader gaps: 5 equal-pace and 12 strong-pole. Preserve tolerance
// on number of passes/changes but do not allow already excessive gap counts
// to grow unnoticed.
const reference={run:41447728733,passes:423,changes:43,
 leadChangeScenarios:10,held:22,gap100:17,equalGap100:5,strongPoleGap100:12};
const checks=[
 ['minimum 400 genuine passes',statistics.confirmedPasses>=400],
 ['minimum 40 actual lead changes',statistics.leaderChanges>=40],
 ['at least 10 scenarios with lead changes',statistics.scenariosWithLeadChanges>=10],
 ['at most 22 original leaders still first',statistics.openingLeaderHeld<=22],
 ['at most 17 large-gap scenarios',statistics.gapsOver100Meters<=17],
 ['equal-pace seed 0 at most 5 large gaps',statistics.bySeed[0].gapsOver100Meters<=5],
 ['strong-pole seed 1 at most 12 large gaps',statistics.bySeed[1].gapsOver100Meters<=12]
];
const failures=checks.filter(([,ok])=>!ok).map(([name])=>name);
const report={phase:'R5-b47',status:failures.length?'FAIL':'PASS',
 statistics,reference,checks:Object.fromEntries(checks),failures,
 caveat:'Fixed seed 90s isolated physics only. The run 41447728733 benchmark is observational and not an all-seed guarantee. No speed, rank or steering correction is applied.'};
fs.mkdirSync('artifacts',{recursive:true});
const output='artifacts/f1-v12-r5b47-leader-balance.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,artifact:output}));
assert.equal(report.status,'PASS',failures.join('; '));
