// R5-b154: test whether observed gap closure was concentrated when the
// target was ALSO in PLAN_ATTACK at precisely the recorded START event.
// No inference that the target was blocking, and no lane-safety claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=x=>JSON.parse(fs.readFileSync(dir+x,'utf8'));
const replay=read('replay.json');
const gap=read('b153-gap-closure-vs-speed.json');
const attack=read('b139-exact-retry-context.json');
for(const f of [replay,gap,attack])assert.equal(f.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
assert.deepEqual(replay.pairs.map(p=>p.seed),[1,2]);
const resultByGroup=()=>({starts:0,closingNonpositiveAtStart:0,
 closingPositiveAtStart:0,knownGapChange:0,gapShrank:0,gapExpanded:0,
 successfulPhysicalOvertakes:0,attackerFollowAtMinus200:0,
 sameTargetStillPresentAtPlus200:0,opponentStillAttackingAtPlus200:0,
 attackerPhysicalEnergyOutputHigher:0,attackerPhysicalEnergyOutputLower:0,
 attackerOutputComparisonAvailable:0,mergeBlockerReportedAtStart:0});
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);
 assert.equal(race.physics.collisionStops,0);
 const ledger=race.real20ms?.attackLedger;
 assert(ledger&&ledger.missingOverlap===false);
 const startFrames=new Map(ledger.startWitnesses.map(w=>[w.attemptId,w]));
 const trajectories=new Map(ledger.startTrajectories.map(x=>[x.attemptId,x]));
 const q=attack.cases.find(x=>x.seed===seed);
 const g=gap.cases.find(x=>x.seed===seed);
 assert(q&&g);
 const groups={opponentAttackingAtStart:resultByGroup(),
  opponentNotAttackingAtStart:resultByGroup()};
 const recordById=new Map(g.rows.map(x=>[x.attemptId,x]));
 const rows=[];
 for(const item of q.rapidRetryWitnesses){
  const witness=startFrames.get(item.attemptId);
  const tr=trajectories.get(item.attemptId);
  assert(witness&&tr);
  assert.equal(witness.ms,item.startMs);
  assert.equal(witness.targetAiState,item.targetAiState);
  assert.equal(witness.driverAiTarget,item.target);
  assert.equal(witness.driverAiState,'PLAN_ATTACK');
  const at=tr.offsetSamples['0'],pre=tr.offsetSamples['-200'],post=tr.offsetSamples['200'];
  assert(at.available);assert.equal(at.targetAiState,item.targetAiState);
  const group=item.targetAiState==='PLAN_ATTACK'?
   'opponentAttackingAtStart':'opponentNotAttackingAtStart';
  const v=groups[group];
  v.starts++;
  v.closingNonpositiveAtStart+=Number(item.relativeClosingSpeedMps<=0);
  v.closingPositiveAtStart+=Number(item.relativeClosingSpeedMps>0);
  v.successfulPhysicalOvertakes+=Number(item.resultOfCurrentAttack==='SUCCESS');
  v.mergeBlockerReportedAtStart+=Number(item.driverReportedMergeBlockers.length>0);
  if(pre.available&&pre.driverAiState==='FOLLOW')v.attackerFollowAtMinus200++;
  if(post.available){
   v.sameTargetStillPresentAtPlus200+=Number(post.driverAiTarget===item.target);
   v.opponentStillAttackingAtPlus200+=Number(post.targetAiState==='PLAN_ATTACK');
  }
  if(Number.isFinite(at.driverEnergyDeployKW)&&Number.isFinite(at.targetEnergyDeployKW)){
   v.attackerOutputComparisonAvailable++;
   v.attackerPhysicalEnergyOutputHigher+=Number(
    at.driverEnergyDeployKW>at.targetEnergyDeployKW);
   v.attackerPhysicalEnergyOutputLower+=Number(
    at.driverEnergyDeployKW<at.targetEnergyDeployKW);
  }
  const physical=recordById.get(item.attemptId);
  const hasGapComparison=!!physical;
  if(hasGapComparison){
   v.knownGapChange++;
   v.gapShrank+=Number(physical.preToPostGapChangeMeters< -1e-7);
   v.gapExpanded+=Number(physical.preToPostGapChangeMeters>1e-7);
  }
  rows.push({attemptId:item.attemptId,driver:item.driver,target:item.target,
   opponentAiStateAtStart:item.targetAiState,
   opponentAlsoAttacking:group==='opponentAttackingAtStart',
   driverAiStateAtStart:'PLAN_ATTACK',
   startClosingSpeedMps:item.relativeClosingSpeedMps,
   gapChangeAvailable:hasGapComparison,
   gapChangeMeters:physical?.preToPostGapChangeMeters??null,
   physicalOvertakeSucceeded:item.resultOfCurrentAttack==='SUCCESS',
   physicalMergeReservationProven:false});
 }
 assert.equal(rows.length,q.rapidSameTargetRetries);
 assert.equal(rows.length,g.recordedRapidRetryStarts);
 assert.equal(groups.opponentAttackingAtStart.starts+
  groups.opponentNotAttackingAtStart.starts,rows.length);
 assert.equal(groups.opponentAttackingAtStart.knownGapChange+
  groups.opponentNotAttackingAtStart.knownGapChange,g.knownGapComparisons);
 assert.equal(groups.opponentAttackingAtStart.successfulPhysicalOvertakes+
  groups.opponentNotAttackingAtStart.successfulPhysicalOvertakes,
  q.rapidlyRetriedConfirmedPasses);
 for(const v of Object.values(groups)){
  assert.equal(v.closingNonpositiveAtStart+v.closingPositiveAtStart,v.starts);
  assert(v.knownGapChange<=v.starts);
  assert(v.gapShrank+v.gapExpanded<=v.knownGapChange);
  assert(v.attackerPhysicalEnergyOutputLower+v.attackerPhysicalEnergyOutputHigher<=
   v.attackerOutputComparisonAvailable);
 }
 const c={seed,quickRetryStarts:rows.length,groups,rows,
  confirmedPhysicalPasses:race.physics.passes,
  collisionStops:0,noCompetitiveTargetCausalityProven:true,
  anySafeAlternateLaneProven:false};
 cases.push(c);
 console.log(JSON.stringify({phase:'R5-b154',status:'CASE_PASS',seed,
  opponentAttacking:groups.opponentAttackingAtStart.starts,
  opponentNotAttacking:groups.opponentNotAttackingAtStart.starts,
  shrinkWhileTargetAttacking:groups.opponentAttackingAtStart.gapShrank,
  shrinkWhileTargetNotAttacking:groups.opponentNotAttackingAtStart.gapShrank}));
}
const report={phase:'R5-b154',status:'PASS',track:'majoku-ring-v1',
 sourceGenuineChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 readOnly:true,gamePhysicsChanged:false,
 attackingOpponentDoesNotProveBlocker:true,
 safeSweptMergeProven:false,aiBalanceCorrectionAuthorized:false,
 limitation:'Opponent AI mode recorded at attack START is an observational category, not proof of obstruction, a blocked pass, or avoidable braking.',
 cases};
fs.writeFileSync(dir+'b154-opponent-attack-context.json',JSON.stringify(report,null,2));
