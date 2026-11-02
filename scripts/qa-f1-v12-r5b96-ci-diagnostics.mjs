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
 'b93-ci-evidence-receipt.json'
];
const records=[];
for(const name of expected){
 const p=dir+name;
 if(!fs.existsSync(p)){records.push({name,exists:false,readableJson:false,status:null});continue}
 try{
  const data=JSON.parse(fs.readFileSync(p,'utf8'));
  records.push({name,exists:true,readableJson:true,status:data.status??data.outcome??null});
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
 ['b93-ci-evidence-receipt.json','EVIDENCE_VERIFIED_WITHIN_JOB']
]);
const unexpected=records.filter(r=>r.status!==requiredPass.get(r.name));
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
 priorJobStepStatus,missingOrBad:unexpected.map(x=>x.name),
 file:path,githubRunConclusion:result.overallGitHubRunConclusion}));
// If prior QA steps succeeded but expected evidence is absent or corrupt,
// do not allow the focused QA job to pass.
if(priorStepStatus==='success'){
 assert.equal(allVerified,true,'R5-b96 missing or mismatched genuine physical QA artifacts');
}
