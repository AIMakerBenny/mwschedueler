// R5-b170: timestamped AI and speed ordering before a real engine terminal
// event. Same-timestamp changes are never labelled the cause of disengage.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=x=>JSON.parse(fs.readFileSync(dir+x,'utf8'));
const replay=read('replay.json');
const events=read('b167-terminal-physical-context.json');
const contrast=read('b169-terminal-cause-contrast.json');
const ends=read('b161-attack-terminal-censor.json');
for(const x of [replay,events,contrast,ends])assert.equal(x.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(x=>x.seed),[1,2]);
const types=['DISENGAGED_UNCONFIRMED','TARGET_CHANGED','SUCCESS','PIT_INTERRUPTED'];
const fresh=()=>({
 attempts:0,pre200SourcePresent:0,pre20SourcePresent:0,
 terminalSourcePresent:0,allThreeSourcePresent:0,
 planAtMinus200:0,planAtMinus20:0,planAtTerminal:0,
 followAtMinus20:0,followAtTerminal:0,
 planToFollowBeforeTerminal:0,planToFollowAtTerminalOnly:0,
 retainedPlanUntilMinus20ThenSwitched:0,
 aiChangedMinus200ToMinus20:0,aiChangedMinus20ToTerminal:0,
 targetChangedBeforeTerminal:0,targetChangedAtTerminalOnly:0,
 usableSpeedComparisonPre200ToPre20:0,
 speedDeclinedBeforeTerminal:0,speedIncreasedBeforeTerminal:0,
 speedUnchangedBeforeTerminal:0,
 closingNonpositiveAtMinus20:0,closingPositiveAtMinus20:0,
 resourceDeployRisenBeforeMinus20:0,resourceDeployFallenBeforeMinus20:0,
 availableEnergyComparisonPre200ToPre20:0,
 signedGapIncreaseBeforeMinus20:0,signedGapDecreaseBeforeMinus20:0,
 comparableGapBeforeMinus20:0
});
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const ledger=race.real20ms?.attackLedger;
 assert(ledger&&!ledger.missingOverlap);
 const src=ledger.terminalEventWitnesses;
 const allStarts=new Map(ledger.events.filter(x=>x.type==='START').map(x=>[x.attemptId,x]));
 const byKey=new Map(src.map(x=>[x.attemptId+'|'+x.terminalType+'|'+x.terminalMs,x]));
 assert.equal(byKey.size,src.length);
 const old=events.cases.find(x=>x.seed===seed);
 const c=contrast.cases.find(x=>x.seed===seed);
 const boundary=ends.cases.find(x=>x.seed===seed);
 assert(old&&c&&boundary);
 const groups=Object.fromEntries(types.map(t=>[t,fresh()]));
 const observations=[];
 for(const row of old.rows){
  const group=groups[row.actualTerminalType];assert(group);
  const witness=byKey.get(row.attemptId+'|'+row.actualTerminalType+'|'+row.actualTerminalMs);
  assert(witness,'Missing identical real terminal event frame');
  const start=allStarts.get(row.attemptId);assert(start?.retry);
  assert.equal(witness.attackStartMs,start.ms);
  const before=witness.offsetSamples['-200'];
  const pre20=witness.offsetSamples['-20'];
  const at=witness.offsetSamples['0'];
  assert(before&&pre20&&at);
  group.attempts++;
  const beforeAllowed=before.ms>=start.ms;
  const early=beforeAllowed&&before.available;
  const late=pre20.ms>=start.ms&&pre20.available;
  const terminal=at.available;
  group.pre200SourcePresent+=Number(early);
  group.pre20SourcePresent+=Number(late);
  group.terminalSourcePresent+=Number(terminal);
  group.allThreeSourcePresent+=Number(early&&late&&terminal);
  if(early)group.planAtMinus200+=Number(before.driverAiState==='PLAN_ATTACK');
  if(late){
   group.planAtMinus20+=Number(pre20.driverAiState==='PLAN_ATTACK');
   group.followAtMinus20+=Number(pre20.driverAiState==='FOLLOW');
   if(Number.isFinite(pre20.relativeClosingSpeedMps)){
    group.closingNonpositiveAtMinus20+=Number(pre20.relativeClosingSpeedMps<=0);
    group.closingPositiveAtMinus20+=Number(pre20.relativeClosingSpeedMps>0);
   }
  }
  if(terminal){
   group.planAtTerminal+=Number(at.driverAiState==='PLAN_ATTACK');
   group.followAtTerminal+=Number(at.driverAiState==='FOLLOW');
  }
  let earlyTransition=false,terminalTransition=false;
  if(early&&late){
   earlyTransition=before.driverAiState==='PLAN_ATTACK'&&pre20.driverAiState==='FOLLOW';
   group.planToFollowBeforeTerminal+=Number(earlyTransition);
   group.aiChangedMinus200ToMinus20+=Number(before.driverAiState!==pre20.driverAiState);
   group.targetChangedBeforeTerminal+=Number(before.driverAiTarget!==pre20.driverAiTarget);
   if(Number.isFinite(before.relativeClosingSpeedMps)&&
    Number.isFinite(pre20.relativeClosingSpeedMps)){
    group.usableSpeedComparisonPre200ToPre20++;
    const d=pre20.relativeClosingSpeedMps-before.relativeClosingSpeedMps;
    group.speedDeclinedBeforeTerminal+=Number(d< -1e-8);
    group.speedIncreasedBeforeTerminal+=Number(d>1e-8);
    group.speedUnchangedBeforeTerminal+=Number(Math.abs(d)<=1e-8);
   }
   if(Number.isFinite(before.driverEnergyDeployKW)&&Number.isFinite(pre20.driverEnergyDeployKW)){
    group.availableEnergyComparisonPre200ToPre20++;
    const d=pre20.driverEnergyDeployKW-before.driverEnergyDeployKW;
    group.resourceDeployRisenBeforeMinus20+=Number(d>1e-8);
    group.resourceDeployFallenBeforeMinus20+=Number(d< -1e-8);
   }
   if(Number.isFinite(before.signedTrackProgressGapMeters)&&
    Number.isFinite(pre20.signedTrackProgressGapMeters)){
    group.comparableGapBeforeMinus20++;
    const d=pre20.signedTrackProgressGapMeters-before.signedTrackProgressGapMeters;
    group.signedGapIncreaseBeforeMinus20+=Number(d>1e-7);
    group.signedGapDecreaseBeforeMinus20+=Number(d< -1e-7);
   }
  }
  if(late&&terminal){
   terminalTransition=pre20.driverAiState==='PLAN_ATTACK'&&at.driverAiState==='FOLLOW';
   group.planToFollowAtTerminalOnly+=Number(terminalTransition);
   group.retainedPlanUntilMinus20ThenSwitched+=Number(
    early&&before.driverAiState==='PLAN_ATTACK'&&terminalTransition);
   group.aiChangedMinus20ToTerminal+=Number(pre20.driverAiState!==at.driverAiState);
   group.targetChangedAtTerminalOnly+=Number(pre20.driverAiTarget!==at.driverAiTarget);
  }
  observations.push({attemptId:row.attemptId,seed,terminalType:row.actualTerminalType,
   pre200Available:early,pre20Available:late,terminalAvailable:terminal,
   pre200Ai:early?before.driverAiState:null,
   pre20Ai:late?pre20.driverAiState:null,
   terminalAi:terminal?at.driverAiState:null,
   preTerminalPlanToFollowObserved:earlyTransition,
   onTerminalPlanToFollowObserved:terminalTransition,
   temporalPrecedenceSupportsCausality:false,
   sweptLateralSafetyProven:false});
 }
 assert.equal(observations.length,c.rapidQuickRetryAttempts);
 assert.equal(observations.length,old.quickRetries);
 for(const [reason,g]of Object.entries(groups)){
  assert.equal(g.attempts,c.byTerminalReason[reason].attempts);
  assert.equal(g.terminalSourcePresent,c.byTerminalReason[reason].exactTerminalFrameObserved);
  assert(g.pre200SourcePresent<=g.attempts&&g.pre20SourcePresent<=g.attempts);
  assert(g.allThreeSourcePresent<=g.pre200SourcePresent);
  assert(g.allThreeSourcePresent<=g.pre20SourcePresent);
  assert(g.allThreeSourcePresent<=g.terminalSourcePresent);
  assert.equal(g.speedDeclinedBeforeTerminal+g.speedIncreasedBeforeTerminal+
   g.speedUnchangedBeforeTerminal,g.usableSpeedComparisonPre200ToPre20);
  assert(g.planToFollowBeforeTerminal<=g.allThreeSourcePresent+
   g.pre200SourcePresent-g.allThreeSourcePresent);
  assert(g.planToFollowAtTerminalOnly<=g.pre20SourcePresent);
  assert(g.availableEnergyComparisonPre200ToPre20<=g.pre200SourcePresent);
 }
 cases.push({seed,quickRetries:observations.length,byReason:groups,
  measuredRows:observations,realPhysicalPasses:race.physics.passes,
  collisionStops:0, aiDecisionCausalityEstablished:false});
 console.log(JSON.stringify({phase:'R5-b170',status:'CASE_PASS',seed,
  disengagements:groups.DISENGAGED_UNCONFIRMED.attempts,
  disengagePreTerminalFollowShift:groups.DISENGAGED_UNCONFIRMED.planToFollowBeforeTerminal,
  disengageOnlyAtTerminalShift:groups.DISENGAGED_UNCONFIRMED.planToFollowAtTerminalOnly}));
}
const result={phase:'R5-b170',status:'PASS',track:'majoku-ring-v1',
 originalChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 enginePhysicsChanged:false,readOnly:true,aiBrakingRelaxationApproved:false,
 last20msTransitionCanBeConsequenceNotCause:true,
 safePhysicalOvertakeCorridorProven:false,cases,
 limitations:[
  'Observational 20ms sampling can order changes but cannot prove a cause',
  'A terminal frame may already reflect a completed AI state transition',
  'Missing source frames remain unavailable, never classified as a transition'
 ]};
fs.writeFileSync(dir+'b170-preterminal-ai-transition.json',JSON.stringify(result,null,2));
