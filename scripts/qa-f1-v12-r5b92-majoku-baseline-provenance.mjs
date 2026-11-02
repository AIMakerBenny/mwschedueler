// R5-b92: verify source artifact represents the historical genuine 10-lap
// Majoku baseline, not a synthetic 90s grid or a claim of overall CI success.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='artifacts/r5-b77-majoku/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const summary=read('artifacts/r5-b49-majoku/summary.json');
assert.equal(summary.status,'PASS');
assert.equal(summary.phase,'R5-b49');
assert.equal(summary.physicsUnchanged,true);
assert.equal(summary.cases?.length,2);
assert.deepEqual(summary.cases.map(c=>c.seed),[1,2]);
const cases=[];
for(const c of summary.cases){
 assert.equal(c.track,'majoku-ring-v1');
 assert.equal(c.mode,'NORMAL');
 assert.equal(c.lapCount,10);
 assert.equal(c.fullRace,true);
 assert.equal(c.finishers,12);
 assert(Number.isFinite(c.firstToSecondFinishGapSeconds)&&c.firstToSecondFinishGapSeconds>=0);
 assert(Number.isInteger(c.passes)&&c.passes>=0);
 assert(Number.isInteger(c.completedPitStops)&&c.completedPitStops>=0);
 assert.equal(c.collisionStops,0);
 assert.equal(typeof c.outcomeFile,'string');
 assert(/^artifacts\/r5-b49-majoku\/seed[12]-normal10\.json$/.test(c.outcomeFile));
 assert.equal(c.outcomeFile,`artifacts/r5-b49-majoku/seed${c.seed}-normal10.json`);
 assert(fs.existsSync(c.outcomeFile),'Historical artifact missing: '+c.outcomeFile);
 const r=read(c.outcomeFile);
 assert.equal(r.status,'PASS');
 assert.equal(r.track,'majoku-ring-v1');
 assert.equal(r.seedId,String(c.seed));
 assert.equal(r.mode,'NORMAL');
 assert.equal(r.laps,10);
 assert.equal(r.state,'FINISHING');
 assert.equal(r.profileScenario,'NATURAL');
 assert.equal(r.setupCreatedAt,r.seededIso);
 assert.equal(r.finishedRows.length,12);
 assert.equal(r.finishEvents.length,12);
 assert(r.finishedRows.every(x=>x.finishMs>0&&x.lapTimesMs.length===10));
 assert.deepEqual(r.finishedRows.map(x=>x.position),Array.from({length:12},(_,i)=>i+1));
 assert.equal(r.physics.collisionStops,0);
 assert.deepEqual(r.physics.invalid,[]);
 assert.deepEqual(r.continuityErrors,[]);
 assert.equal(r.physics.passes,c.passes);
 assert.equal(r.finishedRows.reduce((sum,x)=>sum+x.pits,0),c.completedPitStops);
 assert.equal(r.pitRequests.length,c.pitRequests);
 assert.equal(c.winnerId,r.finishedRows[0].id);
 assert.equal(c.runnerUpId,r.finishedRows[1].id);
 const sec=(r.finishedRows[1].finishMs-r.finishedRows[0].finishMs)/1000;
 assert(Math.abs(sec-c.firstToSecondFinishGapSeconds)<1e-8);
 cases.push({seed:c.seed,finishers:12,confirmedPasses:c.passes,
  pitStops:c.completedPitStops,collisionStops:0,verifiedOutcomeFile:c.outcomeFile,
  historicalSourceRunId:41460159785,sourceRunOverallConclusion:'CANCELLED',
  sourceMajokuJobConclusionAtPriorCheck:'SUCCESS'});
 console.log(JSON.stringify({phase:'R5-b92',status:'BASELINE_CASE_PASS',seed:c.seed,
  confirmedPasses:c.passes,realPitStops:c.completedPitStops}));
}
const output={phase:'R5-b92',status:'PASS',track:'majoku-ring-v1',
 genuineHistoricalFullTenLapRaces:2,originalArtifactMatchesSummary:true,cases,
 sourceRunId:41460159785,wholeSourceRunSucceeded:false,
 note:'Historical per-job success is not overall workflow success; new 20ms replay is separately required',
 current20msPhysicsIdentical:null,current20msJobSuccess:null,
 changesToGameEngine:false,aiTuningApproved:false};
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(dir+'b92-historical-baseline-provenance.json',JSON.stringify(output,null,2));
console.log(JSON.stringify({phase:'R5-b92',status:'PASS',
 artifact:dir+'b92-historical-baseline-provenance.json',current20msJobSuccess:null}));
