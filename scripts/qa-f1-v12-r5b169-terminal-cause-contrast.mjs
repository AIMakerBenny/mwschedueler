// R5-b169: quantitative contrast between terminal reason and simultaneous
// physical/AI states. Observational association must not become causal patch.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=name=>JSON.parse(fs.readFileSync(dir+name,'utf8'));
const replay=read('replay.json');
const terminal=read('b167-terminal-physical-context.json');
const lifecycle=read('b163-terminal-reasons-by-driver.json');
const rapid=read('b139-exact-retry-context.json');
for(const r of [replay,terminal,lifecycle,rapid])assert.equal(r.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const categories=['DISENGAGED_UNCONFIRMED','TARGET_CHANGED','SUCCESS','PIT_INTERRUPTED'];
const isNum=x=>typeof x==='number'&&Number.isFinite(x);
const median=values=>{
 const v=[...values].sort((a,b)=>a-b);
 return v.length?(v.length%2?v[(v.length-1)/2]:
  (v[v.length/2-1]+v[v.length/2])/2):null;
};
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);assert.equal(race.physics.collisionStops,0);
 const l=terminal.cases.find(x=>x.seed===seed);
 const e=lifecycle.cases.find(x=>x.seed===seed);
 const q=rapid.cases.find(x=>x.seed===seed);
 assert(l&&e&&q);
 const audit=new Map(l.rows.map(x=>[x.attemptId,x]));
 assert.equal(audit.size,l.quickRetries);
 const original=new Map(e.rows.map(x=>[x.attemptId,x]));
 const grouped=Object.fromEntries(categories.map(category=>[category,{
  terminalType:category,attempts:0,exactTerminalFrameObserved:0,
  missingTerminalFrame:0,exactPre200FrameObserved:0,
  closingSpeedPositiveAtTerminal:0,closingSpeedNonpositiveAtTerminal:0,
  closingSpeedAtTerminalUnavailable:0,
  signedGapChangeKnown:0,gapShrankNearTerminal:0,gapExpandedNearTerminal:0,
  closingTrendKnown:0,closingSpeedImprovedNearTerminal:0,
  closingSpeedWorsenedNearTerminal:0,
  aiPre200PlanAttack:0,aiPre200Follow:0,
  aiAtTerminalPlanAttack:0,aiAtTerminalFollow:0,
  targetAlsoAttackingAtTerminal:0,driverTargetPairs:[],
  availableTerminalSpeedsMps:[],availableSignedGapChangesMeters:[]
 }]));
 for(const o of e.rows){
  const row=audit.get(o.attemptId);assert(row);
  assert.equal(row.actualTerminalType,o.engineTerminalType);
  const group=grouped[row.actualTerminalType];
  assert(group,'Unsupported original engine terminal type '+row.actualTerminalType);
  group.attempts++;
  group.driverTargetPairs.push(o.driver+'|'+o.target);
  const valid=row.exactTerminalSourceAvailable;
  group.exactTerminalFrameObserved+=Number(valid);
  group.missingTerminalFrame+=Number(!valid);
  if(isNum(row.lastInstantClosingSpeedMps)){
   if(row.lastInstantClosingSpeedMps>0)group.closingSpeedPositiveAtTerminal++;
   else group.closingSpeedNonpositiveAtTerminal++;
   group.availableTerminalSpeedsMps.push(row.lastInstantClosingSpeedMps);
  }else group.closingSpeedAtTerminalUnavailable++;
  group.aiAtTerminalPlanAttack+=Number(valid&&row.terminalAiState==='PLAN_ATTACK');
  group.aiAtTerminalFollow+=Number(valid&&row.terminalAiState==='FOLLOW');
  group.targetAlsoAttackingAtTerminal+=Number(valid&&row.opponentAiAtTerminal==='PLAN_ATTACK');
  if(row.last200msSourceAvailable){
   group.exactPre200FrameObserved++;
   group.aiPre200PlanAttack+=Number(row.preTerminalAiState==='PLAN_ATTACK');
   group.aiPre200Follow+=Number(row.preTerminalAiState==='FOLLOW');
  }
  if(isNum(row.last200msSignedGapChangeMeters)){
   group.signedGapChangeKnown++;
   group.gapShrankNearTerminal+=Number(row.last200msSignedGapChangeMeters< -1e-7);
   group.gapExpandedNearTerminal+=Number(row.last200msSignedGapChangeMeters>1e-7);
   group.availableSignedGapChangesMeters.push(row.last200msSignedGapChangeMeters);
  }
  if(isNum(row.last200msRelativeClosingSpeedChangeMps)){
   group.closingTrendKnown++;
   group.closingSpeedImprovedNearTerminal+=Number(
    row.last200msRelativeClosingSpeedChangeMps>1e-8);
   group.closingSpeedWorsenedNearTerminal+=Number(
    row.last200msRelativeClosingSpeedChangeMps< -1e-8);
  }
 }
 const summaries={};
 for(const [category,g]of Object.entries(grouped)){
  assert.equal(g.attempts,e.terminalReasonCounts[category]||0);
  assert.equal(g.exactTerminalFrameObserved+g.missingTerminalFrame,g.attempts);
  assert.equal(g.closingSpeedPositiveAtTerminal+g.closingSpeedNonpositiveAtTerminal+
   g.closingSpeedAtTerminalUnavailable,g.attempts);
  assert(g.signedGapChangeKnown<=g.exactPre200FrameObserved);
  assert(g.exactPre200FrameObserved<=g.attempts);
  assert(g.gapShrankNearTerminal+g.gapExpandedNearTerminal<=g.signedGapChangeKnown);
  assert(g.closingSpeedImprovedNearTerminal+g.closingSpeedWorsenedNearTerminal<=
   g.closingTrendKnown);
  const distinctPairs=new Set(g.driverTargetPairs);
  summaries[category]={...g,
   medianTerminalClosingSpeedMps:median(g.availableTerminalSpeedsMps),
   medianLast200msGapChangeMeters:median(g.availableSignedGapChangesMeters),
   distinctDriverTargetPairs:distinctPairs.size,
   evidenceOfSafeMergeProven:false};
  delete summaries[category].driverTargetPairs;
  delete summaries[category].availableTerminalSpeedsMps;
  delete summaries[category].availableSignedGapChangesMeters;
 }
 assert.equal(Object.values(summaries).reduce((n,g)=>n+g.attempts,0),q.rapidSameTargetRetries);
 cases.push({seed,rapidQuickRetryAttempts:q.rapidSameTargetRetries,
  byTerminalReason:summaries,actualPhysicalPasses:race.physics.passes,
  collisionStops:0,causalDisengagementFaultProven:false});
 console.log(JSON.stringify({phase:'R5-b169',status:'CASE_PASS',seed,
  disengage:summaries.DISENGAGED_UNCONFIRMED.attempts,
  targetChanged:summaries.TARGET_CHANGED.attempts,
  terminalSpeedKnownDisengage:summaries.DISENGAGED_UNCONFIRMED.exactTerminalFrameObserved,
  terminalSpeedKnownTargetChange:summaries.TARGET_CHANGED.exactTerminalFrameObserved}));
}
const result={phase:'R5-b169',status:'PASS',track:'majoku-ring-v1',
 sourceGenuineChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 observedTenLapRaces:2,readOnly:true,physicsChanged:false,
 sampledTerminalGapDoesNotEstablishLateralBodyClearance:true,
 measuredAssociationNotCausation:true,aiPatchApproved:false,cases,
 limitations:[
  'Terminal state can reflect the effect of disengagement, not its cause',
  'Unavailable exact frames are reported separately and never imputed',
  'The analysis covers the rapid same-target retry subset, not all attacks'
 ]};
fs.writeFileSync(dir+'b169-terminal-cause-contrast.json',JSON.stringify(result,null,2));
