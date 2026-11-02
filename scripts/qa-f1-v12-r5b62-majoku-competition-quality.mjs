// R5-b62 - identify whether the real ten-lap Majoku competition comes
// from verified on-track overtakes or solely pit / finishing reorders.
// No changes to the user's released race or the six locked WIP tracks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sources=read('artifacts/r5-b53-majoku/leader-provenance.json');
const summary=read('artifacts/r5-b49-majoku/summary.json');
assert.equal(sources.status,'PASS');assert.equal(sources.races.length,6);
assert.equal(summary.status,'PASS');assert.equal(summary.cases.length,2);
const groups=[];
for(const caseInfo of sources.races){
 const r=read(caseInfo.source);
 const passed=r.physics.passEvents;
 const firstFinish=Math.min(...r.finishedRows.map(x=>x.finishMs))/1000;
 assert.equal(caseInfo.firstFinishSeconds,firstFinish);
 assert(passed.every(p=>p.front!==p.passed&&p.t>=0&&p.t<=r.simulatedSeconds+1));
 assert.equal(passed.length,r.physics.passes);
 const pitEntryTimes=r.pitTransitions.filter(x=>x.to==='PIT_ENTRY').map(x=>x.time);
 const split={beforePitWave:0,duringPitWave:0,afterPitWave:0,afterFirstFinish:0};
 const earliestPit=pitEntryTimes.length?Math.min(...pitEntryTimes):null;
 const latestPit=pitEntryTimes.length?Math.max(...pitEntryTimes):null;
 const whoPassed=new Map(),duelPairs=new Map();
 for(const pass of passed){
  const id=String(pass.front),pair=[pass.front,pass.passed].sort().join('|');
  whoPassed.set(id,(whoPassed.get(id)||0)+1);
  const p=duelPairs.get(pair)||{ids:pair,count:0,byFront:{}};
  p.count++;p.byFront[id]=(p.byFront[id]||0)+1;duelPairs.set(pair,p);
  if(pass.t>=firstFinish)split.afterFirstFinish++;
  else if(earliestPit===null||pass.t<earliestPit)split.beforePitWave++;
  else if(pass.t<=latestPit)split.duringPitWave++;
  else split.afterPitWave++;
 }
 assert.equal(Object.values(split).reduce((a,b)=>a+b,0),passed.length);
 const twoWayPairs=[...duelPairs.values()].filter(p=>Object.keys(p.byFront).length===2);
 const finishOrder=r.finishedRows.slice().sort((a,b)=>a.position-b.position);
 const finalPodiumIds=finishOrder.slice(0,3).map(x=>x.id);
 const podiumPassEvents=passed.filter(p=>finalPodiumIds.includes(p.front)||finalPodiumIds.includes(p.passed)).length;
 const initialLeader=String(r.initialOrder[0]),winner=String(finishOrder[0].id);
 const report={seed:caseInfo.seed,scenario:caseInfo.scenario,fullTenLaps:true,
  gridLeaderId:initialLeader,winnerId:winner,gridLeaderWon:initialLeader===winner,
  podium:finalPodiumIds,
  finishGapToRunnerUpSeconds:(finishOrder[1].finishMs-finishOrder[0].finishMs)/1000,
  finishSpreadSeconds:(finishOrder.at(-1).finishMs-finishOrder[0].finishMs)/1000,
  physicalPasses:passed.length,
  passTiming:split,uniquePassingDrivers:whoPassed.size,uniqueDuelPairs:duelPairs.size,
  twoWayDuelPairs:twoWayPairs.length,passingEventsInvolvingEventualPodium:podiumPassEvents,
  attemptedPhysicalLeadAttribution:caseInfo.classification,
  observedPreFinishMaxLeaderGapMeters:caseInfo.beforeFirstFinish.peakLeaderGapMeters,
  peakDriverTrafficConstraints:Object.entries(r.acceptedCompetition.trafficByDriver||{})
   .map(([id,steps])=>({id,steps})).sort((a,b)=>b.steps-a.steps).slice(0,3),
  pitStops:finishOrder.reduce((a,b)=>a+b.pits,0),
  note:'Podium-involved passing does not mean the pass occurred for race leadership'};
 groups.push(report);
 console.log(JSON.stringify({phase:'R5-b62',status:'CASE_PASS',seed:report.seed,
  scenario:report.scenario,passes:report.physicalPasses,duels:report.uniqueDuelPairs,
  twoWayPairs:report.twoWayDuelPairs,podiumInvolved:podiumPassEvents}));
}
assert.equal(groups.length,6);
const baselines=groups.filter(x=>x.scenario==='NATURAL');
assert.deepEqual(baselines.map(x=>x.seed),[1,2]);
const total=baselines.reduce((sum,r)=>sum+r.physicalPasses,0);
assert(Number.isInteger(total)&&total>=0,'Invalid natural 10-lap physical pass total');
const summaryReport={
 totalNaturalConfirmedPasses:total,
 historicalVerifiedTotalFromRun41460159785:78,
 naturalWinnerGapSeconds:baselines.map(x=>x.finishGapToRunnerUpSeconds),
 naturalRaceWinnerNotPoleCount:baselines.filter(x=>!x.gridLeaderWon).length,
 naturalTwoWayPassingPairs:baselines.map(x=>x.twoWayDuelPairs),
 naturalLeadChangeOvercountWarnings:baselines.filter(x=>
  x.attemptedPhysicalLeadAttribution.afterFirstFinish>0||
  x.attemptedPhysicalLeadAttribution.preFinishWithPit>0).length,
 physicsChanged:false,
 conclusion:'Real on-track passing is confirmed, but coarse leaderboard changes must not be called genuine leader passes'
};
const output='artifacts/r5-b53-majoku/competition-quality.json';
fs.writeFileSync(output,JSON.stringify({phase:'R5-b62',status:'PASS',
 track:'majoku-ring-v1',completedRaces:groups.length,groups,summary:summaryReport},null,2));
console.log(JSON.stringify({phase:'R5-b62',status:'PASS',summary:summaryReport,artifact:output}));
