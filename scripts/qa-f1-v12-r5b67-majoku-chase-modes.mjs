// R5-b67 - REAL Majoku NORMAL 10-lap, accepted 5-second front-field AI
// observations, first 90 seconds before pits. No solver or WIP track changes.
// Coarse snapshots are observational; states between samples are unknown.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const src=read('artifacts/r5-b49-majoku/summary.json');
assert.equal(src.status,'PASS');
assert.deepEqual(src.cases.map(x=>x.seed),[1,2]);
const scenarios=[];
for(const item of src.cases){
 const race=read(item.outcomeFile);
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.laps,10);assert.equal(race.mode,'NORMAL');
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 assert.deepEqual(race.physics.invalid,[]);
 assert.deepEqual(race.continuityErrors,[]);
 const firstPit=Math.min(Infinity,...race.pitTransitions.filter(x=>x.to!=='TRACK').map(x=>Number(x.time)));
 assert(firstPit>90,'Race enters pit lane during early study');
 const frames=race.acceptedCompetition.samples.filter(s=>s.simMs<=90020);
 assert.equal(frames.length,19,'Expected 0-90s inclusive real 5s frames');
 const rows=frames.map((s,i)=>{
  assert.equal(s.vehicles.length,12);
  const leader=s.vehicles[0],second=s.vehicles[1],third=s.vehicles[2];
  assert.equal(leader.id,s.leader);
  assert.equal(second.id,s.second);
  return {seconds:Number((s.simMs/1000).toFixed(3)),
   leaderId:leader.id,secondId:second.id,thirdId:third.id,
   leadGapMeters:s.leaderToP2Meters,
   trafficLimitedCumulative:s.trafficConstrainedSteps,
   leading:[leader,second,third].map((v,position)=>({
    position:position+1,id:v.id,pace:v.pace,effort:v.effort,
    mode:v.mode,style:v.style,speedKph:v.speedKph,
    corridorCandidates:v.corridorCandidates,blocked:v.blocked,
    ersRequestKW:v.ersRequestKW,tyreWear:v.tyreWear,pit:v.pit})),
   confirmedPassesCumulative:s.confirmedPasses};
 });
 const regimes=[[0,30],[30,60],[60,90]].map(([start,end])=>{
  const slice=rows.filter(x=>x.seconds>=start&&x.seconds<end);
  assert.equal(slice.length,6);
  const summaryMode=rank=>{
   const counts={};
   for(const row of slice)counts[row.leading[rank].mode]=(counts[row.leading[rank].mode]||0)+1;
   return counts;
  };
  const count=rank=>slice.filter(x=>x.leading[rank].blocked>0).length;
  const withOptions=rank=>slice.filter(x=>x.leading[rank].corridorCandidates>0).length;
  const before=rows[start/5],after=rows[end/5];
  return {startSeconds:start,endSeconds:end,
   initialLeadGapMeters:before.leadGapMeters,finalLeadGapMeters:after.leadGapMeters,
   leadGapChangeMeters:after.leadGapMeters-before.leadGapMeters,
   confirmedPassesDuringInterval:after.confirmedPassesCumulative-before.confirmedPassesCumulative,
   trafficLimitedCarSteps:after.trafficLimitedCumulative-before.trafficLimitedCumulative,
   firstPlace:{states:summaryMode(0),blockedSnapshots:count(0),corridorCandidateSnapshots:withOptions(0)},
   secondPlace:{states:summaryMode(1),blockedSnapshots:count(1),corridorCandidateSnapshots:withOptions(1)},
   thirdPlace:{states:summaryMode(2),blockedSnapshots:count(2),corridorCandidateSnapshots:withOptions(2)}};
 });
 const secondStates=Object.fromEntries([...new Set(rows.map(x=>x.leading[1].mode))]
  .map(key=>[key,rows.filter(x=>x.leading[1].mode===key).length]));
 const entry={seed:item.seed,realTenLapSource:item.outcomeFile,track:race.track,
  earlySamples:rows.length,firstPitAtSeconds:firstPit,
  startGapMeters:rows[0].leadGapMeters,end90GapMeters:rows.at(-1).leadGapMeters,
  secondPlaceObservedStates:secondStates,
  secondPlaceAttackPlanSnapshots:secondStates.PLAN_ATTACK||0,
  secondPlaceFollowingSnapshots:secondStates.FOLLOW||0,
  windows:regimes,frames:rows};
 scenarios.push(entry);
 console.log(JSON.stringify({phase:'R5-b67',status:'CASE_PASS',seed:item.seed,
  secondModes:secondStates,leadGapAt90m:entry.end90GapMeters}));
}
assert.equal(scenarios.length,2);
const report={phase:'R5-b67',status:'PASS',track:'majoku-ring-v1',
 data:'two authentic 12-car NORMAL 10-lap Chromium races, first 90s only',
 scenarios,physicsModified:false,
 limitations:['AI state is sampled every 5s, not every committed 20ms solver command',
  'Corridor candidates count is not the count of valid reachable passes',
  'Leader and second identity may change within a 5-second interval',
  'Sampled FOLLOW is not evidence that traffic braking was unnecessary']};
const output='artifacts/r5-b53-majoku/chase-modes.json';
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:'R5-b67',status:'PASS',artifact:output}));
