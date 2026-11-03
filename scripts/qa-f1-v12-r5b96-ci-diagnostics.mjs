// R5-b96: emit a truthful evidence manifest even if Chromium or an assertion fails.
// This is not a standalone GitHub Actions success claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
fs.mkdirSync(dir,{recursive:true});
const expected=[
 'seed1-replay-attempt.json','seed2-replay-attempt.json',
 'seed1-physical-diff.json','seed2-physical-diff.json',
 'seed1-observed10.json','seed2-observed10.json',
 'replay.json','decision.json','traffic-attribution.json',
 'corridor-evidence.json','b85-episode-evidence.json',
 'b87-contiguous-episode-audit.json','b88-physical-fingerprints.json',
 'b89-live-ai-evidence-gate.json','b92-historical-baseline-provenance.json',
 'b93-ci-evidence-receipt.json',
 'b100-pinned-historical-baseline.json','b101-physical-pass-ledger.json',
 'b104-full-physical-outcome-gate.json'
];
// R5-b124: older archived races have no QA-only attempt ledger. Require
// the new attempt artifacts only when a new observed race actually carries it.
const attemptAware=[1,2].some(seed=>{
 try{return Boolean(JSON.parse(fs.readFileSync(dir+'seed'+seed+'-observed10.json','utf8')).real20ms?.attackLedger)}
 catch{return false}
});
if(attemptAware)expected.push('b122-attack-attribution.json','b123-attempt-lifecycle.json');
const exactWitnessAware=[1,2].some(seed=>{
 try{return Array.isArray(JSON.parse(fs.readFileSync(dir+'seed'+seed+'-observed10.json','utf8')).real20ms?.attackLedger?.startWitnesses)}
 catch{return false}
});
if(exactWitnessAware)expected.push('b139-exact-retry-context.json',
 'b141-rapid-attack-velocity-evidence.json',
 'b143-rapid-attack-resource-context.json');
const records=[];
for(const name of expected){
 const p=dir+name;
 if(!fs.existsSync(p)){records.push({name,exists:false,readableJson:false,status:null});continue}
 try{
  const data=JSON.parse(fs.readFileSync(p,'utf8'));
  // R5-b99: verify content, not only a self-reported status string.
  const issues=[];
  if(data.track!=='majoku-ring-v1')issues.push('WRONG_TRACK');
  const seedMatch=/^seed([12])-/.exec(name);
  if(seedMatch&&Number(data.seed??data.seedId)!==Number(seedMatch[1]))
   issues.push('WRONG_SEED');
  if(name.endsWith('-replay-attempt.json')&&(
   data.comparisonVerified!==true||data.exitCode!==0||
   data.observedFileStatus!=='PASS'||data.real20msProbe!==true))
   issues.push('REPLAY_COMPARISON_NOT_PROVED');
  if(name.endsWith('-physical-diff.json')&&(
   !Array.isArray(data.differences)||data.differences.length!==0||
   data.safeLaneProven!==false))
   issues.push('PHYSICAL_DIFFERENCE_OR_FALSE_CLEARANCE');
  if(name.endsWith('-observed10.json')){
   if(data.mode!=='NORMAL'||data.laps!==10||data.state!=='FINISHING'||
    !Array.isArray(data.finishedRows)||data.finishedRows.length!==12||
    data.finishedRows.some(x=>!Array.isArray(x.lapTimesMs)||x.lapTimesMs.length!==10))
    issues.push('INVALID_TEN_LAP_FINISH');
   if(data.physics?.collisionStops!==0||!(data.real20ms?.acceptedFrames>=4400&&data.real20ms?.acceptedFrames<=4500))
    issues.push('INVALID_PHYSICAL_20MS_WINDOW');
  }
  if(name==='replay.json'&&(data.authenticPhysicsUnchanged!==true||data.fullTenLapRaces!==2))
   issues.push('PHYSICAL_REPLAY_NOT_VERIFIED');
  if(name.endsWith('-observed10.json')&&data.real20ms?.attackLedger){
   const ledger=data.real20ms.attackLedger;
   if(ledger.missingOverlap!==false||!Array.isArray(ledger.events)||
    !Number.isInteger(ledger.totalStarts)||
    ledger.events.filter(x=>x.type==='START').length!==ledger.totalStarts)
    issues.push('INCOMPLETE_ATTACK_EVENT_PROVENANCE');
  }
  if(name.endsWith('-observed10.json')&&data.real20ms?.attackLedger?.startWitnesses){
   const ledger=data.real20ms.attackLedger;
   if(!Array.isArray(ledger.missingStartWitnesses)||
    ledger.startWitnesses.length+ledger.missingStartWitnesses.length!==ledger.totalStarts||
    ledger.safeLaneClaim!==false||
    ledger.startWitnesses.some(w=>w.driverAiState!=='PLAN_ATTACK'||
      w.driverAiTarget!==w.target||w.physicalOvertakingClearanceProven!==false))
    issues.push('MISSING_OR_UNSAFE_EXACT_START_WITNESS');
  }
  if(name==='b139-exact-retry-context.json'&&(
   data.safeLateralMergeProven!==false||data.aiTuningApproved!==false||
   !Array.isArray(data.cases)||data.cases.length!==2||
   data.cases.some(c=>c.missingRapidRetryWitnesses!==0||
    c.verifiedStartWitnessFrames+c.unmatchedStartWitnesses!==c.starts)))
    issues.push('UNPROVEN_OR_MISSING_EXACT_RETRY_CONTEXT');
  if(name==='b141-rapid-attack-velocity-evidence.json'&&(
   data.aiTuningAuthorized!==false||!Array.isArray(data.cases)||
   data.cases.length!==2||
   data.cases.some(c=>c.rapidRetryStarts!==
    c.closingSpeedAtStart.positiveClosing.count+
    c.closingSpeedAtStart.nonPositiveClosing.count)))
    issues.push('UNVERIFIED_EXACT_CLOSING_SPEED_EVIDENCE');
  if(name==='b143-rapid-attack-resource-context.json'&&(
   data.physicsModified!==false||data.proposedAiPatchesAuthorized!==false||
   data.safePassingLaneProven!==false||!Array.isArray(data.cases)||
   data.cases.length!==2||
   data.cases.some(c=>c.missingQuickRetryContext!==0||
    c.exactTimeContextSamples!==c.quickRetryStarts||
    c.resourceGroups.positiveClosing.count+
    c.resourceGroups.nonPositiveClosing.count!==c.quickRetryStarts)))
    issues.push('MISSING_REAL_START_TIME_TYRE_ENERGY_OR_AI_WITNESS');
  if(name==='b122-attack-attribution.json'&&(
   data.liveAiTuningAuthorized!==false||
   !Array.isArray(data.cases)||data.cases.length!==2||
   data.cases.some(x=>x.physicalConfirmedPasses!==x.independentlyAccountedPhysicalPasses)))
    issues.push('ATTEMPT_PHYSICAL_PASS_ATTRIBUTION_FAILED');
  if(name==='b123-attempt-lifecycle.json'&&(
   data.aiChangesApproved!==false||!Array.isArray(data.cases)||
   data.cases.length!==2||
   data.cases.some(x=>Object.values(x.outcomes||{}).reduce((a,b)=>a+b,0)!==x.attemptStarts)))
    issues.push('ATTEMPT_LIFECYCLE_INVALID');
  if(name==='b88-physical-fingerprints.json'&&data.physicalOutcomesIdentical!==true)
   issues.push('FINGERPRINTS_NOT_IDENTICAL');
  if(name==='b100-pinned-historical-baseline.json'&&
   data.certifiedHistoricalBaselineBytes!==true)
   issues.push('BASELINE_BYTES_NOT_PINNED');
  if(name==='b101-physical-pass-ledger.json'&&
   data.inputArtifactPinnedByR5b100!==true)
   issues.push('HISTORICAL_PHYSICAL_LEDGER_NOT_CERTIFIED');
  if(name==='b104-full-physical-outcome-gate.json'&&
   (data.completeFullJsonOutcomeIdentical!==true||
    data.permissionToReduceSafetyBraking!==false||
    data.permissionToBoostTrailingCars!==false))
   issues.push('FULL_OUTCOME_NOT_PROVED');
  if(name==='b89-live-ai-evidence-gate.json'&&(
   data.liveAiBrakingReductionApproved!==false||data.rearCarBoostApproved!==false||
   data.sweptCollisionClearanceProven!==false||data.mergeReservationSafetyProven!==false))
   issues.push('UNSAFE_AI_APPROVAL');
  records.push({name,exists:true,readableJson:true,
   status:data.status??data.outcome??null,issues});
 }catch(error){
  records.push({name,exists:true,readableJson:false,status:null,error:String(error)});
 }
}
const allPresent=records.every(r=>r.exists&&r.readableJson);
const requiredPass=new Map([
 ['seed1-replay-attempt.json','OBSERVED_COMPARISON_PASSED'],
 ['seed2-replay-attempt.json','OBSERVED_COMPARISON_PASSED'],
 ['seed1-physical-diff.json','PHYSICAL_FIELDS_IDENTICAL'],
 ['seed2-physical-diff.json','PHYSICAL_FIELDS_IDENTICAL'],
 ['seed1-observed10.json','PASS'],['seed2-observed10.json','PASS'],
 ['replay.json','PASS'],['decision.json','PASS'],
 ['traffic-attribution.json','PASS'],['corridor-evidence.json','PASS'],
 ['b85-episode-evidence.json','PASS'],
 ['b87-contiguous-episode-audit.json','PASS'],
 ['b88-physical-fingerprints.json','PASS'],
 ['b89-live-ai-evidence-gate.json','PASS'],
 ['b92-historical-baseline-provenance.json','PASS'],
 ['b93-ci-evidence-receipt.json','EVIDENCE_VERIFIED_WITHIN_JOB'],
 ['b100-pinned-historical-baseline.json','PASS'],
 ['b101-physical-pass-ledger.json','PASS'],
 ['b104-full-physical-outcome-gate.json','PASS']
]);
if(attemptAware){
 requiredPass.set('b122-attack-attribution.json','PASS');
 requiredPass.set('b123-attempt-lifecycle.json','PASS');
}
if(exactWitnessAware){
 requiredPass.set('b139-exact-retry-context.json','PASS');
 requiredPass.set('b141-rapid-attack-velocity-evidence.json','PASS');
 requiredPass.set('b143-rapid-attack-resource-context.json','PASS');
}
const unexpected=records.filter(r=>r.status!==requiredPass.get(r.name)||(r.issues?.length||0)>0);
const allVerified=allPresent&&unexpected.length===0;
const priorStepStatus=String(process.env.MWS_FOCUSED_QA_STEP_STATUS||'unknown').toLowerCase();
const result={
 phase:'R5-b96',track:'majoku-ring-v1',
 githubSha:process.env.GITHUB_SHA||null,
 githubRunId:process.env.GITHUB_RUN_ID||null,
 priorJobStepStatus:priorStepStatus,
 evidenceStatus:allVerified?'EXPECTED_ARTIFACTS_VERIFIED':'INCOMPLETE_OR_FAILED_EVIDENCE',
 overallGitHubRunConclusion:'NOT_AVAILABLE_AT_CAPTURE_TIME',
 physicalEngineUntouchedByThisDiagnostic:true,
 authentic20msReplayValidatedWithinJob:allVerified&&priorStepStatus==='success',
 sweptClearanceProven:false,aiTuningApproved:false,
 records,missingOrBad:unexpected,
 limitations:['A queued workflow cannot generate a verified race result',
  'A successful in-job assertion is not the final GitHub workflow conclusion',
  'No telemetry-only comparison is proof of physically safe lane entry']
};
const path=dir+'b96-ci-diagnostics.json';
fs.writeFileSync(path,JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:'R5-b96',status:result.evidenceStatus,
 priorStepStatus,missingOrBad:unexpected.map(x=>({name:x.name,status:x.status,issues:x.issues||[],error:x.error||null})),
 file:path,githubRunConclusion:result.overallGitHubRunConclusion}));
// If prior QA steps succeeded but expected evidence is absent or corrupt,
// do not allow the focused QA job to pass.
if(priorStepStatus==='success'){
 assert.equal(allVerified,true,'R5-b96 missing or mismatched genuine physical QA artifacts');
}
