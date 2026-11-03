// R5-b163: actual quick retry terminal reasons and lifetimes. Each event
// belongs to the engine attack attempt, not to later proximity of the pair.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const replay=read('replay.json');
const boundaries=read('b161-attack-terminal-censor.json');
const filtered=read('b162-censored-chase-timeline.json');
const physical=read('b155-early-speed-vs-eventual-pass.json');
for(const r of [replay,boundaries,filtered,physical])assert.equal(r.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const names=['SUCCESS','DISENGAGED_UNCONFIRMED','TARGET_CHANGED',
 'PIT_INTERRUPTED','ACTIVE_AT_RACE_FINISH'];
const makeCounts=()=>Object.fromEntries(names.map(n=>[n,0]));
const median=a=>{
 const v=[...a].sort((x,y)=>x-y);
 return v.length?(v.length%2?v[(v.length-1)/2]:
  (v[v.length/2-1]+v[v.length/2])/2):null;
};
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);assert.equal(race.physics.collisionStops,0);
 const led=race.real20ms?.attackLedger;assert(led&&!led.missingOverlap);
 const b=boundaries.cases.find(x=>x.seed===seed);
 const q=filtered.cases.find(x=>x.seed===seed);
 const f=physical.cases.find(x=>x.seed===seed);
 assert(b&&q&&f);
 const byId=new Map(b.rows.map(x=>[x.attemptId,x]));
 const group=makeCounts(),byDriver=new Map();
 const durations=[],durationByEnd=Object.fromEntries(names.map(x=>[x,[]]));
 const endsByOffset=Object.fromEntries([1000,5000,10000,20000,40000,70000].map(x=>[String(x),0]));
 const rows=[];
 for(const sample of q.rows){
  const orig=byId.get(sample.attemptId);
  assert(orig&&orig.startMs===sample.startMs);
  assert.equal(orig.terminalType,sample.originalAttemptTerminalType);
  assert.equal(orig.terminalMs,sample.originalAttemptTerminalMs);
  assert(names.includes(orig.terminalType));
  group[orig.terminalType]++;
  if(!byDriver.has(orig.driver))byDriver.set(orig.driver,{
   driver:orig.driver,attempts:0,outcomes:makeCounts(),
   knownDurationMs:[],targetIds:new Set()});
  const d=byDriver.get(orig.driver);
  d.attempts++;d.outcomes[orig.terminalType]++;
  d.targetIds.add(orig.target);
  if(orig.durationMs!==null){
   assert(orig.durationMs>=0);
   durations.push(orig.durationMs);durationByEnd[orig.terminalType].push(orig.durationMs);
   d.knownDurationMs.push(orig.durationMs);
  }
  for(const [off,key]of [[1000,'1000'],[5000,'5000'],[10000,'10000'],
   [20000,'20000'],[40000,'40000'],[70000,'70000']]){
   if(orig.terminalMs!==null&&orig.terminalMs<=orig.startMs+off)
    endsByOffset[key]++;
   assert.equal(sample.offsets[key].terminalAlreadyReached,
    orig.terminalMs!==null&&orig.terminalMs<=orig.startMs+off);
  }
  rows.push({attemptId:orig.attemptId,driver:orig.driver,target:orig.target,
   engineTerminalType:orig.terminalType,durationMs:orig.durationMs,
   after1sAlreadyEnded:sample.offsets['1000'].terminalAlreadyReached,
   after10sAlreadyEnded:sample.offsets['10000'].terminalAlreadyReached,
   after40sAlreadyEnded:sample.offsets['40000'].terminalAlreadyReached});
 }
 assert.equal(rows.length,q.quickRetries);
 assert.equal(rows.length,f.quickRetryStarts);
 assert.equal(Object.values(group).reduce((n,x)=>n+x,0),rows.length);
 assert.equal(group.SUCCESS,f.outcomes.SUCCESS);
 for(const [key,count]of Object.entries(endsByOffset)){
  assert.equal(count,q.timeline[key].terminatedBeforeOrAtOffset);
 }
 const drivers=[...byDriver.values()].map(x=>({
  driver:x.driver,quickRetryStarts:x.attempts,
  numberOfDistinctTargets:x.targetIds.size,
  terminalReasons:x.outcomes,medianEngineAttemptSeconds:
   x.knownDurationMs.length?median(x.knownDurationMs)/1000:null
 })).sort((a,b)=>b.quickRetryStarts-a.quickRetryStarts||a.driver.localeCompare(b.driver));
 assert.equal(drivers.reduce((n,x)=>n+x.quickRetryStarts,0),rows.length);
 const c={seed,rapidRepeatAttemptStarts:rows.length,
  terminalReasonCounts:group,
  attemptDurationsAvailable:durations.length,
  medianTerminalDurationSeconds:durations.length?median(durations)/1000:null,
  medianDurationSecondsByTerminalType:Object.fromEntries(names.map(name=>
   [name,durationByEnd[name].length?median(durationByEnd[name])/1000:null])),
  alreadyEndedByHorizonMs:endsByOffset,
  distinctDriversWithRapidRetry:drivers.length,drivers,rows,
  collisionStops:0,physicalPassCount:race.physics.passes};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b163',status:'CASE_PASS',seed,
  retries:rows.length,terminalReasons:group,
  medianDurationSeconds:c.medianTerminalDurationSeconds,
  endedWithin1s:endsByOffset['1000'],endedWithin10s:endsByOffset['10000']}));
}
const output={phase:'R5-b163',status:'PASS',track:'majoku-ring-v1',
 actualChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 readOnly:true,physicsModified:false,safePassingCorridorProven:false,
 aiTuningAuthorized:false,eventsAfterTerminalIgnoredAsOriginalAttack:true,
 note:'Driver and target can continue racing after the original attempt terminates. Counts of post-terminal pair locations are excluded from active attempt analysis.',
 cases};
fs.writeFileSync(dir+'b163-terminal-reasons-by-driver.json',JSON.stringify(output,null,2));
