// R5-b100 - independently pin the REAL historical 12-driver full-race
// evidence from a particular successful Majoku job, not a cancelled run as a whole.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='artifacts/r5-b49-majoku/';
const expected=new Map([
 ['summary.json','25330deb7c946ed408682855259a52963ce09b517c7a3c7d15aeaded6a68bb0a'],
 ['seed1-normal10.json','d36417d0733e9330087203b3bab0a228dd6538d89b56f1d67bffc78d7bdb9b39'],
 ['seed2-normal10.json','dfd6138a90ebdec6e44567a357ae38fb523ea8b9a7e5b7b1a29f56ff8ddc223b']
]);
const hashes={};
for(const [name,digest] of expected){
 const path=root+name;
 assert(fs.existsSync(path),'Missing historical artifact file: '+path);
 const actual=createHash('sha256').update(fs.readFileSync(path)).digest('hex');
 assert.equal(actual,digest,'Unexpected baseline bytes: '+name);
 hashes[name]=actual;
}
const summary=JSON.parse(fs.readFileSync(root+'summary.json','utf8'));
assert.equal(summary.phase,'R5-b49');assert.equal(summary.status,'PASS');
assert.deepEqual(summary.cases.map(c=>c.seed),[1,2]);
const cases=[];
for(const c of summary.cases){
 const file=root+'seed'+c.seed+'-normal10.json';
 assert.equal(c.outcomeFile,file);
 const race=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(race.seedId,String(c.seed));
 assert.equal(race.mode,'NORMAL');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.laps,10);assert.equal(race.state,'FINISHING');
 assert.equal(race.finishedRows.length,12);
 assert(race.finishedRows.every(r=>r.lapTimesMs.length===10));
 assert.equal(race.physics.passes,c.passes);
 assert.equal(race.physics.passEvents.length,c.passes);
 assert.equal(race.physics.collisionStops,0);
 assert.equal(race.finishedRows.reduce((n,r)=>n+r.pits,0),c.completedPitStops);
 cases.push({seed:c.seed,finishers:12,passes:c.passes,
  completedPitStops:c.completedPitStops,collisionStops:0,
  sourceFileSha256:hashes['seed'+c.seed+'-normal10.json']});
}
const output={phase:'R5-b100',status:'PASS',track:'majoku-ring-v1',
 sourceRunId:41460159785,sourceArtifactId:13149386360,
 sourceWorkflowConclusion:'CANCELLED',sourceMajokuJobConclusion:'SUCCESS',
 certifiedHistoricalBaselineBytes:true,
 newTwentyMillisecondReplayVerified:false,
 hashes,cases};
fs.mkdirSync('artifacts/r5-b77-majoku',{recursive:true});
fs.writeFileSync('artifacts/r5-b77-majoku/b100-pinned-historical-baseline.json',
 JSON.stringify(output,null,2));
console.log(JSON.stringify({phase:'R5-b100',status:'PASS',cases,
 newTwentyMillisecondReplayVerified:false}));
