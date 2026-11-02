// R5-b50: observational attribution only for true Majoku Ring 12-car
// NORMAL 10-lap Chromium results. No physics changes or invented outcomes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b49-majoku';
const summary=JSON.parse(fs.readFileSync(dir+'/summary.json','utf8'));
assert.equal(summary.status,'PASS');
assert.equal(summary.cases?.length,2);
const median=values=>{
 const x=[...values].sort((a,b)=>a-b),m=Math.floor(x.length/2);
 return x.length?(x.length%2?x[m]:(x[m-1]+x[m])/2):null;
};
const round=value=>value===null?null:Math.round(value*1000)/1000;
const causes=[];
for(const entry of summary.cases){
 const source=JSON.parse(fs.readFileSync(entry.outcomeFile,'utf8'));
 assert.equal(source.status,'PASS');assert.equal(source.profileScenario,'NATURAL');
 assert.equal(source.track,'majoku-ring-v1');assert.equal(source.seedId,String(entry.seed));
 const samples=source.samples||[];
 assert(samples.length>=25,'Insufficient authentic 5-second telemetry');
 const original=source.originalProfiles,applied=source.appliedProfiles;
 assert(original&&applied&&Object.keys(original).length===12);
 assert.deepEqual(original,applied,'Natural run should never override driver ratings');
 const observations=samples.map((sample,index)=>{
  assert(Number.isFinite(sample.simSeconds)&&Number.isFinite(sample.leaderGapMeters));
  if(index)assert(sample.simSeconds>samples[index-1].simSeconds);
  assert.equal(sample.drivers?.length,12);
  const first=sample.drivers[0],second=sample.drivers[1];
  assert.equal(String(first.id),String(sample.leader));
  assert(first.speedKph>=0&&second.speedKph>=0);
  return {seconds:sample.simSeconds,leader:first.id,second:second.id,
   gapMeters:sample.leaderGapMeters,
   speedDifferenceKph:round(first.speedKph-second.speedKph),
   paceDifference:first.pace-second.pace,
   leaderStrategy:first.strategy,secondStrategy:second.strategy,
   effortDifference:round(first.strategyEffort-second.strategyEffort),
   ersRequestedDifferenceKW:round(first.ersRequestKW-second.ersRequestKW),
   ersDeliveredDifferenceKW:round(first.actualErsKW-second.actualErsKW),
   batteryDifferenceMJ:round(first.batteryMJ-second.batteryMJ),
   leaderWear:first.wear,secondWear:second.wear,
   leaderState:first.state,secondState:second.state,
   confirmedPasses:sample.confirmedPasses,pitRequests:sample.requests};
 });
 const first100=observations.find(x=>x.gapMeters>100)||null;
 const opening=observations[0],ending=observations.at(-1);
 const sampleLeaders=[...new Set(observations.map(x=>x.leader))];
 const early=observations.filter(x=>x.seconds<=60);
 const byId=Object.entries(original).map(([id,profile])=>({id,
  pace:profile.pace,grid:source.initialOrder.indexOf(id)+1,
  strategy:source.samples.find(s=>s.drivers.some(d=>d.id===id))?.drivers.find(d=>d.id===id)?.strategy||'',
  finish:source.finishedRows.find(r=>r.id===id)?.position||null}));
 causes.push({seed:entry.seed,fullRace:true,lapCount:10,drivers:12,
  actualRaceWinner:entry.winnerId,
  gridLeader:entry.gridLeaderId,gridLeaderWon:entry.gridLeaderWon,
  observedLeaderIds:sampleLeaders,
  observedLeadChanges:observations.slice(1).filter((x,i)=>x.leader!==observations[i].leader).length,
  recordedConfirmedPasses:entry.passes,
  firstGapMeters:round(opening.gapMeters),lastGapMeters:round(ending.gapMeters),
  peakGapMeters:round(Math.max(...observations.map(x=>x.gapMeters))),
  firstOver100Seconds:first100?.seconds??null,
  medianEarlySpeedDifferenceKph:round(median(early.map(x=>x.speedDifferenceKph))),
  medianEarlyPaceDifference:round(median(early.map(x=>x.paceDifference))),
  medianEarlyEffortDifference:round(median(early.map(x=>x.effortDifference))),
  medianEarlyRequestedErsDifferenceKW:round(median(early.map(x=>x.ersRequestedDifferenceKW))),
  medianEarlyDeliveredErsDifferenceKW:round(median(early.map(x=>x.ersDeliveredDifferenceKW))),
  firstToSecondFinishGapSeconds:entry.firstToSecondFinishGapSeconds,
  pitRequests:entry.pitRequests,completedPitStops:entry.completedPitStops,
  initialDriverProfiles:byId,
  observations,
  notes:['Changing leader identity makes sequential leader gaps noncausal',
   'ERS requests and deployed ERS are distinct measurements',
   'Mixed initial tyre fixtures are not randomized or matched for compound effects']});
 console.log(JSON.stringify({phase:'R5-b50',status:'CASE_PASS',seed:entry.seed,
  peakGapMeters:causes.at(-1).peakGapMeters,
  firstOver100Seconds:causes.at(-1).firstOver100Seconds,
  observedLeadChanges:causes.at(-1).observedLeadChanges}));
}
const result={phase:'R5-b50',status:'PASS',sourcePhase:'R5-b49',track:'majoku-ring-v1',
 completeTenLapRaces:causes.length,observational:true,
 cases:causes,
 restrictions:['No modified engine or actor rankings',
  'Association in field telemetry does not establish cause',
  'Race-specific pit and special events can confound comparisons']};
fs.writeFileSync(dir+'/cause-audit.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b50',status:'PASS',
 seeds:causes.map(c=>c.seed),artifact:dir+'/cause-audit.json'}));
