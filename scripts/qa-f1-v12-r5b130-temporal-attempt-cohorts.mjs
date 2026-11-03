// R5-b130 - timing of authentic driver-target START events and later
// successes. Cohorts are grouped by START time, not by pass crossing time.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=x=>JSON.parse(fs.readFileSync(dir+x,'utf8'));
const replay=read('replay.json');
const prior=read('b123-attempt-lifecycle.json');
const retry=read('b129-attack-pair-retries.json');
for(const r of [replay,prior,retry])assert.equal(r.status,'PASS');
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const cohorts=[
 {id:'0-to-90s',fromMs:0,toMs:90000},
 {id:'after-90-to-300s',fromMs:90000,toMs:300000},
 {id:'after-300s-to-finish',fromMs:300000,toMs:Infinity}
];
const names=['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED'];
const cases=[];
for(const pair of replay.pairs){
 const race=read('seed'+pair.seed+'-observed10.json');
 assert.equal(race.status,'PASS');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);assert.equal(race.physics.collisionStops,0);
 const ledger=race.real20ms?.attackLedger;
 assert(ledger&&!ledger.missingOverlap&&Array.isArray(ledger.events));
 const byId=new Map();
 for(const e of ledger.events){
  if(!Number.isInteger(e.attemptId))continue;
  if(!byId.has(e.attemptId))byId.set(e.attemptId,[]);
  byId.get(e.attemptId).push(e);
 }
 const starts=ledger.events.filter(x=>x.type==='START');
 assert.equal(starts.length,ledger.totalStarts);
 const sample=cohorts.map(c=>{
  const group=starts.filter(s=>s.ms>c.fromMs&&s.ms<=c.toMs);
  const terminalCounts=Object.fromEntries([...names,'ACTIVE_AT_FINISH'].map(n=>[n,0]));
  const linkedSuccessDelays=[];
  let retries=0,everBlocked=0;
  for(const start of group){
   const events=byId.get(start.attemptId)||[];
   const seen=new Set(events.map(e=>e.type));
   const outcome=seen.has('SUCCESS')?'SUCCESS':
    names.slice(1).find(x=>seen.has(x))||'ACTIVE_AT_FINISH';
   terminalCounts[outcome]++;
   if(start.retry)retries++;
   if(seen.has('BLOCKED'))everBlocked++;
   if(outcome==='SUCCESS'){
    const confirmed=events.find(e=>e.type==='SUCCESS');
    assert(confirmed&&confirmed.ms>=start.ms);
    linkedSuccessDelays.push((confirmed.ms-start.ms)/1000);
   }
  }
  return {id:c.id,fromSeconds:c.fromMs/1000,
   toSeconds:Number.isFinite(c.toMs)?c.toMs/1000:race.simulatedSeconds,
   startCount:group.length,repeatAttempts:retries,
   exactTargetSuccesses:terminalCounts.SUCCESS,
   attemptToConfirmedSuccessPercent:group.length?100*terminalCounts.SUCCESS/group.length:null,
   attemptsWithReportedMergeBlockers:everBlocked,
   outcomes:terminalCounts,
   meanStartToSuccessfulConfirmationSeconds:linkedSuccessDelays.length?
    linkedSuccessDelays.reduce((n,x)=>n+x,0)/linkedSuccessDelays.length:null};
 });
 const p=prior.cases.find(x=>x.seed===pair.seed);
 const r=retry.cases.find(x=>x.seed===pair.seed);
 assert(p&&r);
 assert.equal(sample.reduce((n,x)=>n+x.startCount,0),ledger.totalStarts);
 assert.equal(sample.reduce((n,x)=>n+x.exactTargetSuccesses,0),p.outcomes.SUCCESS);
 assert.equal(sample.reduce((n,x)=>n+x.repeatAttempts,0),r.repeatAttempts);
 assert.equal(sample[0].startCount,p.startsFirst90s);
 assert.equal(sample.slice(1).reduce((n,x)=>n+x.startCount,0),p.startsAfter90s);
 for(const name of names){
  assert.equal(sample.reduce((n,x)=>n+x.outcomes[name],0),p.outcomes[name]);
 }
 assert(sample.every(x=>x.toSeconds>x.fromSeconds));
 const row={seed:pair.seed,observedRaceSeconds:race.simulatedSeconds,
  allAttemptStarts:ledger.totalStarts,cohorts:sample,
  noClockInterpolation:true,physicalPassCount:race.physics.passes};
 cases.push(row);
 console.log(JSON.stringify({phase:'R5-b130',status:'CASE_PASS',seed:pair.seed,
  timeCohorts:sample.map(x=>({window:x.id,starts:x.startCount,successes:x.exactTargetSuccesses}))}));
}
const result={phase:'R5-b130',status:'PASS',track:'majoku-ring-v1',
 sourceRun:41553183438,newRaceExecuted:false,physicsChanged:false,
 interpretation:'Attempts are grouped by when the driver-target START was recorded. Later confirmed success is attributed to that START cohort.',
 warning:'Fixed time windows are not equal laps or track sectors; conversion ratios alone do not prove braking or passing safety',
 liveAiTuningAuthorized:false,cases};
fs.writeFileSync(dir+'b130-temporal-cohorts.json',JSON.stringify(result,null,2));
