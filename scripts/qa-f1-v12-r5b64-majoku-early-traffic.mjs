// R5-b64 - Majoku Ring genuine ten-lap race, pre-pit first 90s.
// Separates the 86m REAL start-grid gap from nine-meter isolated fixtures.
// Observational only: traffic braking correlation does not identify its cause.
// Reads R5-b49 genuine archived 10-lap Chromium evidence, never other tracks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const summary=read('artifacts/r5-b49-majoku/summary.json');
assert.equal(summary.status,'PASS');
assert.deepEqual(summary.cases.map(x=>x.seed),[1,2]);
const cases=[];
const round=n=>Math.round(n*1000)/1000;
const windows=[[0,30],[30,60],[60,90]];
for(const item of summary.cases){
 const race=read(item.outcomeFile);
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);assert.deepEqual(race.physics.invalid,[]);
 const raw=race.acceptedCompetition.samples;
 assert(raw.length>20);
 const firstPit=Math.min(Infinity,...race.pitTransitions.filter(x=>x.to!=='TRACK').map(x=>Number(x.time)));
 assert(firstPit>90,'First real pit transition occurs inside early-window analysis');
 const early=raw.filter(x=>x.simMs<=90020);
 const opening=early[0],startGap=opening.leaderToP2Meters;
 assert(startGap>80&&startGap<95,'Real Majoku grid gap must not be mistaken for 9m fixture');
 assert(early.every(x=>x.vehicles.length===12));
 const periods=windows.map(([begin,end])=>{
  const a=early.find(x=>x.simMs>=begin*1000-2);
  const b=early.find(x=>x.simMs>=end*1000-2);
  assert(a&&b,'Missing accepted 5s sample '+begin+'-'+end);
  const trafficDelta=b.trafficConstrainedSteps-a.trafficConstrainedSteps;
  assert(trafficDelta>=0);
  const leadGapChange=b.leaderToP2Meters-a.leaderToP2Meters;
  const leaderChanged=a.leader!==b.leader;
  const driverA=a.vehicles[0],driverB=a.vehicles[1];
  return {startSeconds:begin,endSeconds:end,leaderIdStart:a.leader,
   leaderIdEnd:b.leader,leaderChangedInWindow:leaderChanged,
   startGapMeters:round(a.leaderToP2Meters),endGapMeters:round(b.leaderToP2Meters),
   changeInGapMeters:round(leadGapChange),
   trafficConstrainedAcceptedSteps:trafficDelta,
   leadingDriverStart:{id:driverA.id,pace:driverA.pace,style:driverA.style,
    effort:driverA.effort,ersRequestKW:driverA.ersRequestKW,pit:driverA.pit},
   secondDriverStart:{id:driverB.id,pace:driverB.pace,style:driverB.style,
    effort:driverB.effort,ersRequestKW:driverB.ersRequestKW,pit:driverB.pit}};
 });
 assert(periods[0].startGapMeters===round(startGap));
 cases.push({seed:item.seed,fullTenLap:true,simulatedSeconds:race.simulatedSeconds,
  firstRealPitTransitionSeconds:Number.isFinite(firstPit)?firstPit:null,
  openingPhysicalGridGapMeters:round(startGap),
  first90sLeaderGapMeters:round(early.at(-1).leaderToP2Meters),
  first90sTrafficConstrainedSteps:early.at(-1).trafficConstrainedSteps,
  first90sLeadChanges:early.at(-1).leaderChanges,
  windows:periods,seededSetup:race.setupCreatedAt,
  interpretation:'Within-seed co-movement only; changes in traffic constraints are not independently assigned to the front two cars'});
}
assert(cases.length===2);
const report={phase:'R5-b64',status:'PASS',scope:'Two true Majoku NORMAL ten-lap races, first 90s analyzed with real grid and no pit transition',
 track:'majoku-ring-v1',dataAreFullRaces:true,observationPeriodSeconds:90,cases,
 knownLimits:['Initial real grid 1-to-2 distance is ~86m, not the 9m per-car isolated physics fixture',
  'Aggregated constrained steps across 12 cars cannot establish first/second-driver braking attribution',
  'No inference that gap changes were caused by traffic braking',
  'No production game logic changed']};
const path='artifacts/r5-b53-majoku/early-traffic.json';
fs.writeFileSync(path,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:report.phase,status:report.status,
 openingGapsMeters:cases.map(c=>c.openingPhysicalGridGapMeters),
 timeWindows:cases.map(c=>c.windows.map(w=>({window:w.startSeconds+'-'+w.endSeconds,traffic:w.trafficConstrainedAcceptedSteps,gapDelta:w.changeInGapMeters}))),
 artifact:path}));
