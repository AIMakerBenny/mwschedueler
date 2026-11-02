// R5-b117: true 12-car/10-lap grid-to-finish changes are not equivalent
// to physical passing. This is read-only evidence from a real browser run.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=name=>JSON.parse(fs.readFileSync(dir+name,'utf8'));
const replay=read('replay.json');
assert.equal(replay.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const expectedPositions=Array.from({length:12},(_,i)=>i+1);
const cases=[];
for(const pair of replay.pairs){
 const race=read('seed'+pair.seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.seedId,String(pair.seed));
 assert.equal(race.mode,'NORMAL');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.laps,10);
 assert.equal(race.state,'FINISHING');
 assert.equal(race.physics.collisionStops,0);
 assert.deepEqual(race.physics.invalid,[]);
 assert.equal(race.finishedRows.length,12);
 const sorted=[...race.finishedRows].sort((a,b)=>a.position-b.position);
 assert.deepEqual(sorted.map(r=>r.position),expectedPositions);
 assert.deepEqual([...sorted.map(r=>r.gridPosition)].sort((a,b)=>a-b),expectedPositions);
 assert.equal(new Set(sorted.map(r=>r.id)).size,12);
 assert(sorted.every(r=>Array.isArray(r.lapTimesMs)&&r.lapTimesMs.length===10));
 assert.equal(race.physics.passes,race.physics.passEvents.length);
 assert.equal(race.physics.passes,pair.seed===1?46:32);
 assert.equal(sorted.reduce((n,r)=>n+r.pits,0),7);
 const drivers=sorted.map(r=>({id:r.id,gridPosition:r.gridPosition,
  finishPosition:r.position,placesGained:r.gridPosition-r.position,
  completedPitStops:r.pits,bestLapMs:r.bestLapMs,finishMs:r.finishMs}));
 const gainSum=drivers.reduce((n,r)=>n+r.placesGained,0);
 assert.equal(gainSum,0,'Grid-position gains across all 12 finishers must sum to zero');
 const finishersAdvancing=drivers.filter(d=>d.placesGained>0).length;
 const finishersFalling=drivers.filter(d=>d.placesGained<0).length;
 const first=sorted[0],second=sorted[1];
 const gapSeconds=(second.finishMs-first.finishMs)/1000;
 assert(gapSeconds>0&&Number.isFinite(gapSeconds));
 cases.push({seed:pair.seed,participants:12,laps:10,finishers:12,
  physicalPasses:race.physics.passes,rawCrossings:race.physics.rawCrossings,
  completedPitStops:7,collisionStops:0,winnerGridPosition:first.gridPosition,
  podiumGridPositions:sorted.slice(0,3).map(r=>r.gridPosition),
  finishersAdvancing,finishersFalling,finishersWithNoNetRankChange:12-finishersAdvancing-finishersFalling,
  firstSecondFinishGapSeconds:gapSeconds,
  placesGainedAlgebraicSum:gainSum,drivers,
  caution:'Net grid-to-finish rank movement can result from pits or race timing; it is not a physical pass count'});
 console.log(JSON.stringify({phase:'R5-b117',seed:pair.seed,status:'CASE_PASS',
  physicalPasses:race.physics.passes,winnerGridPosition:first.gridPosition,
  advancing:finishersAdvancing,falling:finishersFalling}));
}
const output={phase:'R5-b117',status:'PASS',track:'majoku-ring-v1',
 source:'genuine two-seed 12-car normal 10-lap Chromium replay',
 sourceReadOnly:true,newRaceExecuted:false,physicsChanged:false,
 rankMovementNotMisclassifiedAsPhysicalPassing:true,cases};
fs.writeFileSync(dir+'b117-finish-rank-ledger.json',JSON.stringify(output,null,2));
