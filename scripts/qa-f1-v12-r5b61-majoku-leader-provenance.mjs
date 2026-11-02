// R5-b61 - Majoku Ring FULL ten-lap leaderboard provenance.
// A 5s observed rank change is NOT automatically a confirmed track pass.
// Pit transitions and completed finishers cannot count as live rival overtakes.
// Source: six true Chromium 12-car 10-lap matched seed races (R5-b49..b57).
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const base=read('artifacts/r5-b49-majoku/summary.json');
const pace=read('artifacts/r5-b51-majoku/paired-pace.json');
const style=read('artifacts/r5-b53-majoku/paired-strategy.json');
for(const v of [base,pace,style])assert.equal(v.status,'PASS');
assert.deepEqual(base.cases.map(c=>c.seed),[1,2]);
const races=[];
for(const bc of base.cases){
 const seed=bc.seed,pr=pace.pairs.find(x=>x.seed===seed),sr=style.pairs.find(x=>x.seed===seed);
 assert(pr&&sr,'Missing corresponding real 10-lap comparison');
 const files=[
  {scenario:'NATURAL',source:bc.outcomeFile},
  {scenario:'EQUAL_PACE_75',source:pr.sourceFiles.equalPace},
  {scenario:'EQUAL_STRATEGY_BALANCED',source:sr.sourceFiles.allBalanced}
 ];
 for(const {scenario,source} of files){
  const race=read(source);
  assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
  assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);assert.equal(race.seedId,String(seed));
  assert.equal(race.profileScenario,scenario);assert.equal(race.finishedRows.length,12);
  assert.equal(race.physics.collisionStops,0);assert.deepEqual(race.physics.invalid,[]);
  const samples=race.acceptedCompetition.samples,passes=race.physics.passEvents;
  assert(samples.length>25&&Array.isArray(passes)&&passes.length===race.physics.passes);
  const firstFinishSeconds=Math.min(...race.finishedRows.map(r=>r.finishMs))/1000;
  assert(firstFinishSeconds>0);
  const pitChanges=race.pitTransitions||[];
  const grouped={preFinishNoPit:0,preFinishWithPit:0,afterFirstFinish:0,passLinked:0,unresolved:0};
  const events=[];
  for(let i=1;i<samples.length;i++){
   const before=samples[i-1],after=samples[i];
   if(before.leader===after.leader)continue;
   const fromSec=before.simMs/1000,toSec=after.simMs/1000;
   assert(toSec>fromSec);
   const finishedByNow=toSec>=firstFinishSeconds;
   const actualPits=pitChanges.filter(p=>p.time>fromSec&&p.time<=toSec);
   const hasPit=actualPits.length>0||
    [before,after].some(s=>s.vehicles?.slice(0,2).some(v=>v.pit!=='TRACK'));
   const relevantPasses=passes.filter(p=>p.front===after.leader&&p.passed===before.leader&&
    p.t>=fromSec-.5&&p.t<=toSec+.5);
   const category=finishedByNow?'AFTER_FIRST_FINISH':hasPit?'PIT_AMBIGUOUS':
    relevantPasses.length?'CONFIRMED_PASS_LINKED':'UNRESOLVED_NO_PASS_LINK';
   if(finishedByNow)grouped.afterFirstFinish++;
   else if(hasPit)grouped.preFinishWithPit++;
   else grouped.preFinishNoPit++;
   if(category==='CONFIRMED_PASS_LINKED')grouped.passLinked++;
   if(category==='UNRESOLVED_NO_PASS_LINK')grouped.unresolved++;
   events.push({fromSec,toSec,fromLeader:before.leader,toLeader:after.leader,
    category,pitTransitions:actualPits.length,matchingPhysicalPassEvents:relevantPasses.length});
  }
  assert.equal(events.length,grouped.preFinishNoPit+grouped.preFinishWithPit+grouped.afterFirstFinish);
  assert.equal(grouped.passLinked+grouped.unresolved,grouped.preFinishNoPit);
  assert(race.acceptedCompetition.leaderChanges>=events.length);
  const beforeFinishSamples=samples.filter(s=>s.simMs/1000<firstFinishSeconds);
  const gapSeries=beforeFinishSamples.map(s=>s.leaderToP2Meters);
  assert(gapSeries.every(x=>Number.isFinite(x)&&x>=0));
  const result={seed,scenario,source,track:'majoku-ring-v1',firstFinishSeconds,
   acceptedTotalLeaderReorders:race.acceptedCompetition.leaderChanges,
   fiveSecondLeaderChanges:events.length,classification:grouped,
   confirmedOnTrackPasses:passes.length,
   beforeFirstFinish:{sampleCount:gapSeries.length,peakLeaderGapMeters:Math.max(...gapSeries),
    above100mSamples:gapSeries.filter(g=>g>100).length},
   events,caveat:'5s-sampled leader transitions cannot certify every 20ms lead pass'};
  races.push(result);
  console.log(JSON.stringify({stage:'R5-b61',status:'CASE_PASS',seed,scenario,
   confirmedPasses:passes.length,committedLeadReorders:result.acceptedTotalLeaderReorders,
   preFinishPassLinkedLeaderChanges:grouped.passLinked,
   excludedAfterFinish:grouped.afterFirstFinish}));
 }
}
assert.equal(races.length,6);
const result={phase:'R5-b61',status:'PASS',track:'majoku-ring-v1',fullRaces:6,
 readOnly:true,races,
 caveats:['Leader reorders may include pits, finish and incomplete lead transitions',
  'Pass-linked is grounded in 500ms-confirmed on-track crossing, but 5s windows are coarse',
  'Only two seeded complete runs per intervention, not a comprehensive balance proof']};
const output='artifacts/r5-b53-majoku/leader-provenance.json';
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b61',status:'PASS',artifact:output}));
